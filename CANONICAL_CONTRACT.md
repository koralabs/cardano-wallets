# cardano-wallets canonical contract

## Purpose and authority

I am a browser library that connects to a user's CIP-30 Cardano wallet (`window.cardano`), remembers the choice, and reads wallet data (balance, UTxOs, addresses). I hold no keys. Every signature and submission is the user's wallet's decision, shown in the wallet's own prompt. I am published manually to npm (`npm:publish` script); there is no publish workflow.


This file and `.enclave` are the operator's gate: a PR that changes any path listed in `.enclave` and merges into `master` needs the operator's approval. Nothing here authorizes signing, spending, minting, burning or editing on-chain contracts or settings. Ecosystem rules (addresses correct 100% of the time, never double-mint, chain-accurate properties) are in the koralabs root `AGENTS.md`.

## Invariants (must never be violated)

1. **I never sign or submit on my own.** `signTx` and `submitTx` only pass the caller's transaction to the enabled wallet, which prompts the user. I never build, alter or sign a transaction myself. NOT enforced by a test: the existing tests do not call signing or submission.
2. **I only connect to a wallet that is actually injected, and only supported ones when a list is set.** An absent `window`, absent `window.cardano`, missing wallet key, a key outside a configured list, or a declined `enable` all reject. Enforced by `src/CardanoWallets/registry.test.ts` and `src/CardanoWallets/index.test.ts`.
3. **Stored wallet details never override an existing choice.** The first stored selection is kept until `disableWallet` clears it. Enforced in `registry.test.ts`.
4. **UTxO decoding is exact.** Input transaction id and index, lovelace, native-asset policy and name bytes and the address decode to what the wallet's CBOR contains; malformed CBOR rejects rather than returning a guess. Enforced by the real-CBOR tests in `src/CardanoWallets/index.test.ts`.
5. **Balance and staking checks fail closed.** A zero minimum balance, insufficient balance, or a failed or empty staking lookup throws the matching `WalletError`. Not enforced by a test today.
6. **No secrets in this repo.** Not enforced by a test. The Blockfrost helper takes no key from source today.
7. **Publishing is deliberate.** There is no automated publish; a release is a human running the publish script after a version bump. Not enforced by a test.

## Boundaries and known limits

- I do not check that a wallet follows CIP-30 fully; test fixtures are not vendor conformance.
- `signData` is intentionally not exposed (commented out in source).
- The library is legacy; newer apps use the shared wallet connector in `@koralabs/handles-shared-components`.

## Refactors needed to enforce this

- Add a test that `signTx`/`submitTx` pass arguments and results through unchanged and that no other method calls them (invariant 1).
- Add network-free tests (fetch mocked at the boundary) for `verifyStaking`, `verifyBalance` failures (invariant 5).
- Add a gate that no key or token string is committed (invariant 6).
