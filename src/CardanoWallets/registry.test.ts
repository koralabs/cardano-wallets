import CardanoWallets, { WalletKey } from '../index';

// These are browser-extension boundary fixtures, not an Exodus implementation
// or proof that a shipping Exodus extension exposes this registry namespace.
const installRegistry = (registry: Record<string, unknown>) => {
    const stored = new Map<string, string>();
    const storage = {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => { stored.set(key, value); }
    };
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { cardano: registry, localStorage: storage } });
    CardanoWallets.supportedWalletNames = [];
    return storage;
};
const provider = () => ({
    name: 'CIP-30 registry fixture', icon: 'fixture.svg', apiVersion: '1.0.0',
    enable: async () => ({ getNetworkId: async () => 0 }),
    isEnabled: async () => true
});

// Invariant: typed key works with the existing configurable registry connector.
// Failure: absent enum or stale PR deleting the configuration API breaks flow.
// Negative: actual master without enum fails; originalbe8 lacks addSupportedWallets.
test('typed Exodus key selects an injected boundary provider and persists details', async () => {
    const extension = provider();
    const storage = installRegistry({ exodus: extension });
    CardanoWallets.addSupportedWallets([WalletKey.Exodus]);
    await CardanoWallets.connect('exodus');
    expect(await CardanoWallets.getNetworkId()).toEqual(0);
    expect(JSON.parse(storage.getItem('cardanoWallet')!)).toEqual({
        name: extension.name, icon: 'fixture.svg', apiVersion: '1.0.0', key: 'exodus'
    });
});

// Invariant: adding a typed key preserves current default generic-registry use.
// Failure: the stale fixed whitelist unexpectedly rejects a new CIP-30 provider.
// Negative: originalbe8's fixed list rejects this fixture's non-enumerated key.
test('default registry behavior remains open and BeginNightly still connects', async () => {
    const storage = installRegistry({ 'boundary-wallet': provider(), 'begin-nightly': provider() });
    await CardanoWallets.connect('boundary-wallet');
    expect(JSON.parse(storage.getItem('cardanoWallet')!).key).toEqual('boundary-wallet');
    storage.setItem('cardanoWallet', 'null');
    await CardanoWallets.connect(WalletKey.BeginNightly);
    expect(JSON.parse(storage.getItem('cardanoWallet')!).key).toEqual('begin-nightly');
    expect(await CardanoWallets.getNetworkId()).toEqual(0);
});

// Invariant: allowlisting denies other keys without saving a selected wallet.
// Failure: skipping the configurable allowlist permits unintended connections.
// Negative: remove the existing nonempty-list validation and rejection fails.
test('configured allowlist rejects another injected provider without persistence', async () => {
    const storage = installRegistry({ exodus: provider(), nami: provider() });
    CardanoWallets.addSupportedWallets([WalletKey.Exodus]);
    await expect(CardanoWallets.connect('nami')).rejects.toThrow('nami is not supported');
    expect(storage.getItem('cardanoWallet')).toEqual(null);
});

// Invariant: missing or denied external providers fail without a stored choice.
// Failure: swallowing enable errors or bypassing registry checks saves false state.
// Negative: swallow the real enable rejection or skip validation; these fail.
test('missing provider and external enable denial remain visible failures', async () => {
    let storage = installRegistry({});
    await expect(CardanoWallets.connect('exodus')).rejects.toThrow('Specific wallet not found');
    expect(storage.getItem('cardanoWallet')).toEqual(null);
    storage = installRegistry({ exodus: { ...provider(), enable: async () => { throw new Error('User declined connection'); } } });
    await expect(CardanoWallets.connect('exodus')).rejects.toThrow('User declined connection');
    expect(storage.getItem('cardanoWallet')).toEqual(null);
});
