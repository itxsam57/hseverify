# HSE Verify Engineering Memory

Compact working memory for the active Phase 1 clean rebuild. Volatile state must agree with `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

## Canonical authority

- Frozen product scope: **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**.
- Exact current gate: `docs/NEXT_BUILD_UNIT.md`.
- Permanent build order: `docs/bookmarks/MILESTONE_PATH.md`.
- Incomplete/provider blocks: `docs/bookmarks/LATER.md`.
- Repository: `itxsam57/hseverify`, default `main`.

## Current position — 17 August 2026

- M1.01–M1.06 — accepted.
- M1.07 Worker Onboarding and Identity Engine — **DONE — OWNER PASS**.
- M1.08 Company Registration and Verification — **IMPLEMENTATION MERGED / ENGINEERING PASS / OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
  - PR #74; exact head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`; gate `31476983323` PASS; merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`; merged-main gate `31483852831` PASS.
- M1.09 Sites, Departments and Company Team — **IMPLEMENTATION MERGED / ENGINEERING PASS / OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
  - PR #75; exact head `32130f82b661b86d7ad08f5dad7a368346cfe13d`; exact-head gate `31569523799` PASS; merge `1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf`; merged-main gate `31569898065` PASS.
- M1.10 Worker Invitations and Company Codes — **IMPLEMENTATION MERGED / ENGINEERING PASS / OWNER ACCEPTANCE DEFERRED TO M1.13**.
  - PR #76; exact head `9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725`; targeted gate `31971156192` PASS; exact-head full gate `31971157867` PASS; merge `3b32287fecb30f16d682cb130be0e8f1eb466616`; merged-main gate `31971506738` PASS.
- M1.11 Employment, Experience, Qualification, Skill and Leaving Records — **IN PROGRESS** on `build/m1-11-worker-evidence-records`.
- M1.12+ — blocked.
- Formal Milestone 1 DONE count remains **7/12** until the requested combined Milestone 1 owner/browser test passes.

## Active M1.11 invariants

- Worker ownership is live-session-derived; copied IDs cannot transfer authority or enumerate another Worker.
- Qualification metadata and the primary certificate bind to the exact record/version; submission is blocked without that active certificate.
- Experience/employment support independent multiple records and never overwrite one another.
- Submitted versions are immutable; later edits create a new draft/version and preserve history.
- Evidence files reuse M1.06 reservation/quarantine/scan/private-file controls with exact business-reference binding.
- Same-slot file replacement is optimistic and history-preserving; files cannot leak across records/forms.
- Employment ending and skill inactivation are terminal transaction states and cannot be repeated or reopened through crafted calls.
- Leaving letters bind only to the exact current submitted ended employment version and retain replacement lineage.
- Worker skill writes remain `self_declared`; evidence and competency assurance states cannot be self-promoted.
- Material mutations write centralized immutable audit with the true Worker actor inside the same transaction.
- M1.12/M2 implementation leakage is forbidden while M1.11 is active.

## Engineering discipline

- Reproduce a defect before fixing it.
- Trace the failing state/data/permission/lifecycle boundary.
- Fix the smallest complete root cause; do not add compatibility patches for impossible states or weaken accepted tests.
- Add or retain permanent regression coverage for the owning failure class.
- **Never start the next subunit/brick while the current one is incomplete.** The owner's combined Milestone 1 acceptance instruction removes intermediate browser stops; it does not permit overlapping incomplete bricks.
- Run the complete fail-closed engineering gate on the exact branch head before merge.
- Merge only the exact verified head, then run the complete gate again on merged `main` and verify `main` did not move underneath that evidence.
- The owner has explicitly authorized engineering progression through M1.10, M1.11 and M1.12 before one combined Milestone 1 browser acceptance; do not reintroduce an intermediate browser stop.
- A claimed PASS without exact executed evidence is not a PASS.
- Use additive migrations for later vocabulary and preserve accepted historical schema/test ceilings.
- Local/sandbox provider adapters are test infrastructure, not live production providers.