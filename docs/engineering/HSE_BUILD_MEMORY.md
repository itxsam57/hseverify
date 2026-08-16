# HSE Verify Engineering Memory

Compact working memory for the active Phase 1 clean rebuild. Volatile state must agree with `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

## Canonical authority

- Frozen product scope: **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**.
- Exact current gate: `docs/NEXT_BUILD_UNIT.md`.
- Permanent build order: `docs/bookmarks/MILESTONE_PATH.md`.
- Incomplete/provider blocks: `docs/bookmarks/LATER.md`.
- Repository: `itxsam57/hseverify`, default `main`.

## Current position — 12 August 2026

- M1.01–M1.06 — accepted.
- M1.07 Worker Onboarding and Identity Engine — **DONE — OWNER PASS**.
- M1.08 Company Registration and Verification — **IMPLEMENTATION MERGED / ENGINEERING PASS / OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
  - PR #74; exact head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`; gate `31476983323` PASS; merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`; merged-main gate `31483852831` PASS.
- M1.09 Sites, Departments and Company Team — **IMPLEMENTATION MERGED / ENGINEERING PASS / OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
  - PR #75; exact head `32130f82b661b86d7ad08f5dad7a368346cfe13d`; exact-head gate `31569523799` PASS; merge `1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf`; merged-main gate `31569898065` PASS.
- M1.10 Worker Invitations and Company Codes — **IN PROGRESS** on `build/m1-10-worker-invitations-company-codes`.
- M1.11+ — blocked.
- Formal Milestone 1 DONE count remains **7/12** until the requested combined Milestone 1 owner/browser test passes.

## Active M1.10 invariants

- Company authority is live, server-derived and tenant-scoped under `company.workforce.manage`/`read`.
- Worker invitation/code secrets are hashed at rest, expiring, revocable and replay-safe.
- Active Site/Department defaults must be same-tenant; archived/cross-tenant units cannot receive a new link.
- Worker identity remains portable; Company linking never creates Company staff membership or transfers identity ownership.
- Existing Worker acceptance binds the authenticated Worker; new Worker redemption reuses mandatory email+phone verification before link activation.
- Duplicate links, usage-limit races and repeated redemption are transactionally safe/idempotent.
- Bulk import returns row-level validation errors and cannot silently create partial/cross-linked records.
- Payment responsibility and future assessment reference may be stored as bounded defaults only; M2 assessment behavior stays blocked.
- Material invitation/code/link mutations require immutable transactional audit plus notification/outbox where another actor must act.
- M1.11/M1.12/M2 implementation leakage is forbidden while M1.10 is active.

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