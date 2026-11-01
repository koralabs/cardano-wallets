import { CardanoWallets } from '.';
import { Buffer } from 'buffer';
import { Blockfrost } from '../lib/blockfrost';
import { loadCardanoWasm } from '../lib/serialize';

const valueHex = async (lovelace: string): Promise<string> => {
    const lib = await loadCardanoWasm();
    return Buffer.from(lib.Value.new(lib.BigNum.from_str(lovelace)).to_bytes()).toString('hex');
};

const useWallet = (wallet: Record<string, unknown>) => {
    CardanoWallets._enabledWallet = wallet as any;
};

afterEach(() => jest.restoreAllMocks());

describe('CardanoWallets balance and staking checks', () => {
    // Invariant: the wallet's CBOR balance is reported in ADA, and funds at or below the minimum are rejected.
    // Failure: wrong lovelace-to-ADA scaling or an off-by-one at the minimum lets under-funded wallets through.
    // Negative: change `<=` to `<` in verifyBalance and the equal-balance case stops rejecting.
    it('converts lovelace to ADA', async () => {
        useWallet({ getBalance: async () => valueHex('5500000') });
        expect(await CardanoWallets.getAdaBalance()).toBe(5.5);
    });

    it('accepts a balance above the minimum', async () => {
        useWallet({ getBalance: async () => valueHex('5500000') });
        await expect(CardanoWallets.verifyBalance(5)).resolves.toBeUndefined();
    });

    it('rejects a balance equal to the minimum', async () => {
        useWallet({ getBalance: async () => valueHex('5000000') });
        await expect(CardanoWallets.verifyBalance(5)).rejects.toThrow('Insufficient balance');
    });

    it.each([0, -1])('rejects a minimum of %p', async (min) => {
        useWallet({ getBalance: async () => valueHex('5000000') });
        await expect(CardanoWallets.verifyBalance(min)).rejects.toThrow('Minimum balance must be greater than 0.');
    });

    it('treats network id 1 as mainnet and 0 as not', async () => {
        useWallet({ getNetworkId: async () => 1 });
        expect(await CardanoWallets.isMainnet()).toBe(true);
        useWallet({ getNetworkId: async () => 0 });
        expect(await CardanoWallets.isMainnet()).toBe(false);
    });

    it('passes when a registration exists', async () => {
        jest.spyOn(Blockfrost, 'getAccountsRegistrations').mockResolvedValue({ data: [{ action: 'registered' }] } as any);
        await expect(CardanoWallets.verifyStaking({ rewardAddress: 'stake1x' })).resolves.toBeUndefined();
    });

    it.each([
        ['an error result', { error: 'boom' }],
        ['no data', {}],
        ['an empty registration list', { data: [] }]
    ])('throws NotDelegated on %s', async (_n, result) => {
        jest.spyOn(Blockfrost, 'getAccountsRegistrations').mockResolvedValue(result as any);
        await expect(CardanoWallets.verifyStaking({ rewardAddress: 'stake1x' })).rejects.toThrow('Not delegated');
    });

    it('forwards signTx and submitTx to the wallet unchanged', async () => {
        const signTx = jest.fn(async () => 'witness');
        const submitTx = jest.fn(async () => 'txid');
        useWallet({ signTx, submitTx });
        expect(await CardanoWallets.signTx('aa', true)).toBe('witness');
        expect(signTx).toHaveBeenCalledWith('aa', true);
        expect(await CardanoWallets.submitTx('bb')).toBe('txid');
    });
});
