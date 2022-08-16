# Cardano Wallets

Library for connecting cardano dApps to wallet browser extensions using [CIP-30](https://cips.cardano.org/cips/cip30/).

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
