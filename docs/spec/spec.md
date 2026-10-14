# Registry integration specification

The public entry point exports `WalletKey`; its Exodus member maps to the literal `exodus`. The existing connector validates configured supported keys, resolves the injected `window.cardano[key]`, awaits `enable`, stores metadata in `cardanoWallet` and delegates read-only methods to the enabled API.

Preserve master0.4.0 semantics: default empty supported-key list, configurable `addSupportedWallets`, BeginNightly, installed dependency declarations/lockfile, publish script and current UTxO guards. Do not reintroduce the old PR's fixed whitelist or roll back unrelated changes. The runtime connector, transaction paths and provider-specific namespaces are unchanged.

`src/CardanoWallets/registry.test.ts` exercises the public library API using an in-memory browser storage and injected-provider boundary fixture. Assertions cover selected-key persistence/read API, generic default configuration, BeginNightly, configured denial, missing injection and declined enable. They do not mock the connector or call signing/submission. Fixture methods do not establish full vendor CIP-30 conformance.

Run the declared Jest/TypeScript tooling only with the package's actual development/runtime dependencies provisioned. Syntax-only transpilation is not full typechecking, and isolated registry tests are not proof that the serialization suite/build passes. See [product scope](../product/prd.md).
