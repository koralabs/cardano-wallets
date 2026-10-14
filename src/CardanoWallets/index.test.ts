import { CardanoWallets } from '.';
import { Buffer } from 'buffer';
import { loadCardanoWasm } from '../lib/serialize';

const walletUtxoCbor = async (withAsset: boolean): Promise<string> => {
    const lib = await loadCardanoWasm();
    const address = lib.EnterpriseAddress.new(
        0, lib.StakeCredential.from_keyhash(lib.Ed25519KeyHash.from_bytes(Buffer.from('22'.repeat(28), 'hex')))
    ).to_address();
    const value = lib.Value.new(lib.BigNum.from_str('1234567'));
    if (withAsset) {
        const assets = lib.Assets.new();
        assets.insert(lib.AssetName.new(Buffer.from('fixture', 'utf8')), lib.BigNum.from_str('1'));
        const multiasset = lib.MultiAsset.new();
        multiasset.insert(lib.ScriptHash.from_bytes(Buffer.from('33'.repeat(28), 'hex')), assets);
        value.set_multiasset(multiasset);
    }
    const input = lib.TransactionInput.new(lib.TransactionHash.from_bytes(Buffer.from('11'.repeat(32), 'hex')), 3);
    return Buffer.from(lib.TransactionUnspentOutput.new(input, lib.TransactionOutput.new(address, value)).to_bytes()).toString('hex');
};

describe('CardanoWallets Tests', () => {
    describe('connect Tests', () => {
        it('Should throw error if window is not defined', async () => {
            try {
                await CardanoWallets.connect('nami');
            } catch (error) {
                expect((error as any).message).toEqual('window is not defined');
            }
        });

        it('Should throw error if window.cardano is not defined', async () => {
            // @ts-ignore
            global.window = {};

            try {
                await CardanoWallets.connect('nami');
            } catch (error) {
                expect((error as any).message).toEqual('No wallets found');
            }
        });

        it('Should throw error if window.cardano.nami is not defined', async () => {
            // @ts-ignore
            global.window = {
                cardano: {
                    eternl: {}
                }
            };

            try {
                await CardanoWallets.connect('nami');
            } catch (error) {
                expect((error as any).message).toEqual('Specific wallet not found');
            }
        });

        it('Should connect and save wallet details', async () => {
            // @ts-ignore
            global.window = {
                // @ts-ignore
                localStorage: {
                    setItem: jest.fn(),
                    getItem: jest.fn()
                },
                cardano: {
                    nami: {
                        icon: 'some-icon.jpg',
                        name: 'Nami',
                        enable: () => jest.fn(),
                        isEnabled: () => true
                    }
                }
            };

            await CardanoWallets.connect('nami');
            expect(CardanoWallets.wallet.name).toEqual('Nami');
        });
    });

    describe('wallet CBOR decoding', () => {
        // Invariant: real wallet CBOR yields exact input, coin and asset data.
        // Failure: dropping assets, losing bytes or returning a placeholder.
        // Negative: returning null/[] or corrupting decoded quantities fails.
        it.each([false, true])('decodes a real serialized UTxO (native asset: %s)', async (withAsset) => {
            const cbor = await walletUtxoCbor(withAsset);
            expect(await CardanoWallets.buildUtxos([cbor])).toEqual([{
                txId: '11'.repeat(32), txIndx: 3, lovelaceAmount: '1234567',
                assets: withAsset ? [{ policyId: '33'.repeat(28), name: 'fixture', hex: '66697874757265' }] : []
            }]);
        });

        // Invariant: addresses are decoded from wallet-provided UTxO bytes.
        // Failure: selecting another address/network or ignoring the wallet data.
        // Negative: replace the decoded address and this exact output fails.
        it('reads the exact address through the real connector and wallet CBOR API', async () => {
            const cbor = await walletUtxoCbor(true);
            const stored = new Map<string, string>();
            Object.defineProperty(globalThis, 'window', { configurable: true, value: {
                localStorage: {
                    getItem: (key: string) => stored.get(key) ?? null,
                    setItem: (key: string, value: string) => { stored.set(key, value); }
                },
                cardano: { nami: {
                    name: 'CBOR boundary fixture', icon: 'fixture.svg', apiVersion: '1.0.0',
                    enable: async () => ({ getUtxos: async () => [cbor] })
                } }
            } });
            CardanoWallets.supportedWalletNames = [];
            await CardanoWallets.connect('nami');
            expect(await CardanoWallets.getUtxoBech32Addresses()).toEqual([
                'addr_test1vq3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygswahgq5'
            ]);
        });

        // Invariant: no wallet inputs produce no decoded UTxOs.
        // Failure: inventing a synthetic UTxO or returning null.
        // Negative: return null for an empty array and this assertion fails.
        it('returns an empty array for an empty wallet UTxO list', async () => {
            expect(await CardanoWallets.buildUtxos([])).toEqual([]);
        });

        // Invariant: null is outside the typed array contract and is rejected.
        // Failure: a null fallback conceals invalid caller input.
        // Negative: returning [] for null makes this rejection assertion fail.
        it('rejects null rather than inventing an empty decoded wallet', async () => {
            // @ts-expect-error Exercise an invalid JavaScript caller at runtime.
            await expect(CardanoWallets.buildUtxos(null)).rejects.toThrow(TypeError);
        });

        // Original test1/test2 are not CBOR; its expected null was the bug.
        // Invariant: malformed bytes retain the actual decoder rejection.
        // Failure: silently coercing corrupt wallet data to empty/null output.
        // Negative: swallow the decoder failure and this rejection fails.
        it('rejects the retained malformed legacy inputs instead of returning null', async () => {
            await expect(CardanoWallets.buildUtxos(['test1', 'test2'])).rejects.toMatch(/Deserialization failed in TransactionUnspentOutput.*Invalid cbor/);
        });
    });
});
