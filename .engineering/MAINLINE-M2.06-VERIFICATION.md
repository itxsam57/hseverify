# M2.06 Mainline Verification Trigger

This branch was created from exact `main` head `a3ee0381bc482e5ba49c728f80b9cdc0eb01b6cb` solely because the connected GitHub commit-run API exposes PR-triggered workflow runs but not push-triggered runs.

This file is governance metadata only. It intentionally changes no product, database, runtime, test, package, or workflow behavior.

Acceptance rule:

- the PR-triggered full Engineering verification must pass on this branch;
- product/runtime evidence remains the already accepted M2.06 exact-head evidence because the product tree is identical to current `main`;
- after evidence is recorded, this verification PR will be closed without merge and the branch must not become a second source of truth.
