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
- M1.10 Worker Invitations and Company Codes — **IMPLEMENTATION MERGED / ENGINEERING PASS / OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
  - PR #76; exact head `9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725`; targeted gate `31971156192` PASS; exact-head full gate `31971157867` PASS; merge `3b32287fecb30f16d682cb130be0e8f1eb466616`; merged-main gate `31971506738` PASS.
- M1.11 Employment, Experience, Qualification, Skill and Leaving Records — **IMPLEMENTATION MERGED / ENGINEERING PASS / OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
  - PR #77; exact head `87f28bac5cb54b06267f51f100f58668f35dc085`; targeted gate `32011610521` PASS (27/27); exact-head full gate `32011610553` PASS; merge `ff296f7d59a6505241796f654249c3df6b97763d`; merged-main gate `32012346047` PASS.
- M1.12 Public Verification Foundation — **IN PROGRESS** on `build/m1-12-public-verification-foundation` from verified base `ff296f7d59a6505241796f654249c3df6b97763d`.
- M2+ — blocked.
- Formal Milestone 1 DONE count remains **7/12** until the requested combined Milestone 1 owner/browser test passes.

## Active M1.12 invariants

- Public verification is unauthenticated read-only projection, never public mutation authority.
- `/verify` accepts one bounded public lookup at a time; Worker ID authority comes from M1.07 rather than a duplicate identity system.
- QR/camera access is explicit user activation only and manual identifier entry remains available.
- Public lookup is normalized, rate-limited and non-enumerating before expensive or identifying work.
- Unknown and malformed identifiers converge on safe public outcomes where existence disclosure would create an oracle.
- Successful results use opaque, server-created, purpose-separated public capabilities; raw account/tenant/evidence/storage IDs never become browser authority.
- Public data is produced through an explicit allow-list projection. Private Worker/evidence/internal objects are never serialized and then redacted after the fact.
- Public result vocabulary is fixed: `valid`, `expired`, `suspended`, `revoked`, `not_found_or_invalid`, `temporarily_unavailable`.
- Evidence documents, identity documents, leaving letters, employer history, raw scores, proctoring/monitoring data, private notes and secure-file/storage metadata remain private.
- Concern handoff carries only an opaque public result/reference token.
- M1.05 centralized audit/outbox contracts remain authoritative; M1.06 private secure storage remains private.
- Any M1.12 persistence remains rollback/reapply safe and cannot own destructive lower-brick dependencies.
- Existing `/verify/worker/[workerId]` code is compatibility/prototype context only; it is not accepted M1.12 completion evidence.
- M3.01 credential issuance, M3.02 Living Record, M3.03 scoped sharing and M3.07 credential lifecycle administration are explicitly out of M1.12.

## Engineering discipline

- Reproduce a defect or unmet contract before fixing/building it.
- Trace the failing state/data/permission/lifecycle boundary.
- Fix the smallest complete root cause; do not add compatibility patches for impossible states or weaken accepted tests.
- Add or retain permanent regression coverage for the owning failure class.
- **Never start the next subunit/brick while the current one is incomplete.** The owner's combined Milestone 1 acceptance instruction removes intermediate browser stops; it does not permit overlapping incomplete bricks.
- Run the complete fail-closed engineering gate on the exact branch head before merge.
- Merge only the exact verified head, then run the complete gate again on merged `main` and verify `main` did not move underneath that evidence.
- The owner has explicitly authorized engineering progression through M1.12 before one combined Milestone 1 browser acceptance; do not reintroduce an intermediate browser stop.
- A claimed PASS without exact executed evidence is not a PASS.
- Use additive migrations for later vocabulary and preserve accepted historical schema/test ceilings.
- Local/sandbox provider adapters are test infrastructure, not live production providers.