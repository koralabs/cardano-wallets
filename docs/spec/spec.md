# Registry integration specification

The public entry point exports `WalletKey`; its Exodus member maps to the literal `exodus`. The existing connector validates configured supported keys, resolves the injected `window.cardano[key]`, awaits `enable`, stores metadata in `cardanoWallet` and delegates read-only methods to the enabled API.

Preserve master0.4.0 semantics: default empty supported-key list, configurable `addSupportedWallets`, BeginNightly, installed dependency declarations/lockfile, publish script and current UTxO guards. Do not reintroduce the old PR's fixed whitelist or roll back unrelated changes. The runtime connector, transaction paths and provider-specific namespaces are unchanged.

`src/CardanoWallets/registry.test.ts` exercises the public library API using an in-memory browser storage and injected-provider boundary fixture. Assertions cover selected-key persistence/read API, generic default configuration, BeginNightly, configured denial, missing injection and declined enable. They do not mock the connector or call signing/submission. Fixture methods do not establish full vendor CIP-30 conformance.

Run `npm test -- --runInBand`, `npm run build -- --noEmit` and `npm run build` with the declared locked runtime/development dependencies. Jest28 uses the declared TypeScript compiler to translate only CSL11.5's ESM JavaScript modules for its CommonJS test runner; no dependency API is replaced and package bytes remain unchanged. The general JavaScript-transform preset is not used.

Real CSL-generated wallet CBOR exercises exact transaction input/index, lovelace, native-asset policy/name bytes and decoded address. Empty arrays return empty arrays; null is outside the typed array contract and rejects; the original malformed `test1`/`test2` inputs retain decoder rejection rather than the old nonsensical expected null. No synthetic mint, signing or transaction submission occurs. Syntax-only transpilation is not full typechecking, and isolated registry tests are not proof that the serialization suite/build passes. See [product scope](../product/prd.md).
