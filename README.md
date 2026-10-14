# Cardano Wallets

Library for connecting cardano dApps to wallet browser extensions using [CIP-30](https://cips.cardano.org/cips/cip30/).

## Documentation

- [Docs index](./docs/index.md)
- [Product scope](./docs/product/prd.md)
- [Registry integration spec](./docs/spec/spec.md)

## Registry keys

`WalletKey.Exodus` is a typed alias for the string `exodus`. The existing connector selects `window.cardano[key]`; an empty supported-wallet list accepts any injected provider, and `addSupportedWallets` makes an explicit allowlist. The alias does not inject or adapt an Exodus provider, prove that a shipping Exodus extension exposes this namespace, or establish vendor CIP-30 conformance. Missing providers and declined connection requests remain errors.

```typescript
import CardanoWallets, { WalletKey } from '@koralabs/cardano-wallets';

CardanoWallets.addSupportedWallets([WalletKey.Exodus]);
// Requires a provider already registered as window.cardano.exodus.
await CardanoWallets.connect(WalletKey.Exodus);
```

No serialization, signing, submission or on-chain behavior changes are part of this key addition.

## Installation

Using npm:

```javascript
npm install @koralabs/cardano-wallets
```

## Usage:

#

## Connecting to a wallet

```javascript
import CardanoWallets from '@koralabs/cardano-wallets';

const walletKey = 'nami';
await CardanoWallets.connect(walletKey);

// Verify wallet's network is mainnet
const isMainnet = await CardanoWallets.isMainnet();
if (!isMainnet) {
    throw new Error('Wallet must be in Mainnet');
}

// verify wallet balance
const minimumBalanceNeeded = 100;
await CardanoWallets.verifyBalance(minimumBalanceNeeded);
```

## Getting policy assets

```javascript
import CardanoWallets from '@koralabs/cardano-wallets';

const walletKey = 'nami';
await CardanoWallets.connect(walletKey);

const utxos = await CardanoWallets.getUtxos();
const builtUtxos = CardanoWallets.buildUtxos(utxos);

const policyId = "some_policy_id";

const assets = builtUtxos.reduce<{
    name: string;
    hex: string;
    policyId: string;
}[]>((agg, utxo) => {
        const { assets } = utxo;
        for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            if (asset.policyId === policyId) {
                agg.push(asset);

            }
        }
        return agg;
    }, []);
```
