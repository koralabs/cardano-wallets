import { CardanoWallets } from '.';
import { Buffer } from 'buffer';
import { loadCardanoWasm } from '../lib/serialize';

// CIP-19 test vectors
const PAYMENT = 'addr1vx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzers66hrl8';
const REWARD = 'stake1uyehkck0lajq8gr28t9uxnuvgcqrc6070x3k9r8048z8y5gh6ffgw';

const toHex = async (bech32: string) => {
    const lib = await loadCardanoWasm();
    return Buffer.from(lib.Address.from_bech32(bech32).to_bytes()).toString('hex');
};

const store = new Map<string, string>();
const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear()
};
beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } });
});
afterAll(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).localStorage;
});
afterEach(() => storage.clear());

describe('CardanoWallets CIP-30 wrappers', () => {
    // Invariant: wallet answers reach callers unchanged, and hex addresses become bech32.
    // Failure: dropped arguments or a wrong address encoding would show users the wrong address.
    // Negative: encoding the change address as hex instead of bech32 fails the address cases.
    it('forwards utxo arguments and returns wallet data unchanged', async () => {
        const getUtxos = jest.fn(async () => ['u1']);
        CardanoWallets._enabledWallet = {
            getUtxos,
            getNetworkId: async () => 1,
            getCollateral: async () => ['c1'],
            getUnusedAddresses: async () => ['a1', 'a2']
        } as any;
        expect(await CardanoWallets.getUtxos('10', { page: 2, limit: 5 })).toEqual(['u1']);
        expect(getUtxos).toHaveBeenCalledWith('10', { page: 2, limit: 5 });
        expect(await CardanoWallets.getNetworkId()).toBe(1);
        expect(await CardanoWallets.getCollateral()).toEqual(['c1']);
        expect(await CardanoWallets.getUnusedAddresses()).toEqual(['a1', 'a2']);
    });

    it('converts change and reward addresses to bech32', async () => {
        CardanoWallets._enabledWallet = {
            getChangeAddress: async () => toHex(PAYMENT),
            getRewardAddresses: async () => [await toHex(REWARD)]
        } as any;
        expect(await CardanoWallets.getChangeAddress()).toBe(PAYMENT);
        expect(await CardanoWallets.getRewardAddresses()).toEqual([REWARD]);
    });

    it('reports whether the wallet is enabled', async () => {
        CardanoWallets.wallet = { isEnabled: async () => false } as any;
        expect(await CardanoWallets.isWalletEnabled()).toBe(false);
    });
});

describe('CardanoWallets local storage', () => {
    it('merges extra data into the saved wallet and refuses when nothing is saved', () => {
        expect(() => CardanoWallets.setAdditionalWalletData({ a: '1' })).toThrow('No data saved');
        localStorage.setItem(CardanoWallets.localStorageKey, JSON.stringify({ wallet: 'nami' }));
        CardanoWallets.setAdditionalWalletData({ a: '1' });
        expect(CardanoWallets.getWalletDetailsFromStorage()).toEqual({ wallet: 'nami', a: '1' });
    });

    it('forgets the wallet on disable', async () => {
        localStorage.setItem(CardanoWallets.localStorageKey, JSON.stringify({ wallet: 'nami' }));
        await CardanoWallets.disableWallet();
        expect(CardanoWallets.getWalletDetailsFromStorage()).toBeNull();
    });

    it('rejects unsupported wallets on connect', async () => {
        const saved = CardanoWallets.supportedWalletNames;
        CardanoWallets.supportedWalletNames = [];
        CardanoWallets.addSupportedWallets(['nami']);
        await expect(CardanoWallets.connect('eternl')).rejects.toThrow('eternl is not supported');
        CardanoWallets.supportedWalletNames = saved;
    });
});
