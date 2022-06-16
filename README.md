# Cardano Wallets

Library for connecting cardano dApps to wallet browser extensions using [CIP-30](https://cips.cardano.org/cips/cip30/).

## Installation

Using npm:

```javascript
npm install @koralabs/cardano-wallets
```

## Usage

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
