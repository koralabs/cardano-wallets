# Typed wallet registry key

## Requirement
Expose `WalletKey.Exodus = 'exodus'` through the existing public enum so consumers can configure the existing generic CIP-30 registry connector without an untyped string.

## Preserved behavior
- The caller/browser extension provides `window.cardano[key]`.
- Empty supported-wallet configuration accepts any injected key.
- `addSupportedWallets` explicitly restricts keys when configured.
- Successful connection stores the selected provider's metadata and enables read-only API use.
- Missing providers and declined connection fail without saving a new choice.
- Existing enum entries, including BeginNightly, remain available.

## Non-goals and evidence bounds
No provider injection, nonstandard namespace adaptation, certified live Exodus support, vendor CIP-30 conformance, serialization upgrade/downgrade, transaction construction/signing/submission or on-chain acceptance. Browser-boundary fixtures validate the library's registry contract, not a real Exodus installation. The original PR's official provider-reference URL currently reports Package Not Found; that is not evidence that the vendor cannot work, nor a reason to retire the existing unit based on age.

See the [implementation spec](../spec/spec.md).
