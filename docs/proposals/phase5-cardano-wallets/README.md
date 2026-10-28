# cardano-wallets: canonical contract and enclave proposal

**DRAFT, NOT ACTIVE. Do not merge without the operator's review** (kora-bot
`v3/docs/ecosystem-ownership-plan.md`, Phase 5 row 5.3: every repo gets a canonical contract and
an enclave, even if the enclave is empty, and its `AGENTS.md` points at both).

- [Proposed canonical contract](./CANONICAL_CONTRACT.md): what this repo must never violate.
- [Candidate enclave](./.enclave): 2 repo-root-relative entries (0 code paths plus the two policy files).

## Why it is inert here

K.O.R.A.'s `merge_pr` loads only `v3/.enclave` or a root `.enclave` from the target branch, and
gates enclave-touching merges into `master`, `main`, `mainnet` and `preprod`. A copy under
`docs/proposals/` changes nothing. Adoption is a separate change that moves both files to the repo
root (and updates the `AGENTS.md` pointer). An absent root manifest cannot protect its own first
installation, so that change needs the operator's review too.

## Review asks

1. Are the "Must never be violated" rules right and complete?
2. Is each enclave path needed, and is anything missing? Every path was checked to exist on
   `master` at `49ddb03`.
3. Keys, prompts and the code that enforces the contract are the only enclave candidates (decision 2); an enclave of just the two policy files means nothing here enforces an ecosystem-critical rule today.
