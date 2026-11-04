# cardano-wallets canonical contract

Browser library that connects to a user's CIP-30 wallet (`window.cardano`), remembers the choice and reads wallet data (balance, UTxOs, addresses). It holds no keys.

1. It never signs or submits on its own: `signTx` and `submitTx` pass the caller's transaction to the enabled wallet, which prompts the user.
2. It connects only to a wallet actually injected, and only supported ones when a list is set; an absent `window`/`window.cardano`, missing key, unlisted key or declined `enable` rejects.
3. A stored wallet selection is never overridden until `disableWallet` clears it.
4. UTxO decoding is exact (tx id, index, lovelace, native-asset policy and name bytes, address); malformed CBOR rejects instead of guessing.
5. Balance and staking checks fail closed with the matching `WalletError`.
