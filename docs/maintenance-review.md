# Wallet maintenance candidate — preparation only

This candidate starts at source-version commit `2392719f9d77914acd9c7e4e3c4b8766997d7267` (manifest 0.2.13). Original published archive bytes and registry gitHead remain UNPROVEN. This is a deliberate proposed source-based replacement, NOT exact archive recovery. Review-only version identity: `0.2.13-maintenance.1`; availability/publication permissions are not established and no registry probe or publication is authorized here.

## Preserved boundaries

All original src runtime and type files and original yarn.lock remain byte-identical. Exact CSL10.2.0, original allowlist, CommonJS lib/index.js and declarations, and frozen transitive graph are retained. No current 0.4.0 source transplant, wallet signing, transaction submission, browser/live wallet, chain activity, admin checkout/install/lock changes or credential escalation occurs. The only provider boundary is an in-memory synthetic injected wallet; decoder/compiler/library behavior is real. No runtime correction is proposed unless actual original-source tests prove a defect.

The original five Jest tests remain in source, but four try/catch assertions can pass without rejection, and the malformed-CBOR test expected null. They are not credited as acceptance. New behavior gates use rejection assertions and actual CSL10-generated full CBOR. CSL's ESM-distribution/CommonJS-test mismatch is handled by transpiling the actual dependency JS in memory with the original locked TypeScript compiler; no node_modules patch/API stub. The same suite executes the original built source and then the actual packed JavaScript.

The build emits an old .test.js/.test.d.ts under lib. A packaging-only .npmignore exclusion removes compiled test modules; pack manifest assertions reject test artifacts. Runtime JS is not rebuilt after its tests. Preparation adds only actual gitHead metadata, packs with --ignore-scripts, verifies tarball SHA512/layout, extracts it and tests its actual JS/declarations. No npm publish command or publisher workflow exists in this candidate. Workflow permissions are contents:read only; no registry write credential or automatic release. Push on the unique review alias runs preparation only, not master graph rollback.

## Native cases and negative controls

- Missing browser/provider/selected wallet and unsupported-wallet cases require real rejection; bypassing validation makes each fail. Exact eight-key allowlist assertion catches current-source optional-allowlist transplantation.
- Real connect persists exact name/icon/apiVersion/key and exposes the actual synthetic enabled boundary; returning a placeholder or wrong storage fails. Existing first-choice preservation catches an overwrite; provider denial catches swallowed errors or incorrectly persisted connection.
- Mainnet and testnet results must match actual getNetworkId; constant/default network selection fails.
- Real coin-only and native-asset full CBOR decode asserts exact transaction ID/index/lovelace/asset names/policy bytes. Returning []/null, dropping assets or corrupting identifiers fails. No multiasset-null behavior is presumed valid solely to preserve a bug: the coin-only case exercises real CSL10.
- Empty list is exactly []; null and corrupt legacy bytes must reject through the real decoder. Fallback success/empty results fail these negative cases.
- Wallet-provided UTxO address must match a fixed known testnet address; wrong address/network fails. Reward address must retain network/credential bytes; corrupt bytes reject. No signing methods are called.
- Disable must remove only the persisted wallet choice; retaining it fails. This validates the source's existing global localStorage browser contract with a synthetic storage boundary.

## Consumer compatibility limit

The preparation typechecks a targeted import-and-call boundary against the actual extracted packed declarations, using admin's inventoried CardanoWallets/Asset/Utxo/Wallet surface. It is NOT a handwritten public API stub, full admin TSX compilation, native admin test acceptance or migration. The actual packed JavaScript independently runs the same behavior tests. Existing admin owner retains all integration work and the private signing boundary is never invoked. Full consumer compilation/tests await separately approved immutable publication and explicit migration authorization.

## Future publication review requirements — not executable here

Publication remains unauthorized. A future exact-head reviewed publisher would need verified package ownership/destination, collision-free immutable identity, exact tested archive publication with explicit maintenance tag, tag capture independent of missing old versions/tags, unchanged latest (including truly absent latest), registry gitHead/compiler graph/integrity and downloaded byte equality. No claim that private/deleted old archive is globally nonexistent, or that built-in repository token already has package creation authority. No scope escalation. No consumer gap closes from this draft.
