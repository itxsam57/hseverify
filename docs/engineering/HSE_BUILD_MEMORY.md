# HSE Verify Engineering Memory

Compact working memory for the active Phase 1 clean rebuild. Volatile state must agree with `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

## Canonical authority

- Frozen product scope: **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**.
- Exact current gate: `docs/NEXT_BUILD_UNIT.md`.
- Permanent build order: `docs/bookmarks/MILESTONE_PATH.md`.
- Incomplete/provider blocks: `docs/bookmarks/LATER.md`.
- Repository: `itxsam57/hseverify`, default `main`.

## Current position — 11 August 2026

- M1.01–M1.06 — accepted.
- M1.07 Worker Onboarding and Identity Engine — **DONE — OWNER PASS**.
- M1.08 Company Registration and Verification — **IMPLEMENTATION MERGED / ENGINEERING PASS / OWNER ACCEPTANCE DEFERRED**.
  - PR #74.
  - exact head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`.
  - exact-head gate `31476983323` PASS.
  - merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`.
  - merged-main gate `31483852831` PASS.
- M1.09 Sites, Departments and Company Team — **IN PROGRESS — PR #75**.
- M1.10+ — blocked.
- Formal Milestone 1 DONE count remains **7/12** until the requested combined M1.08 + M1.09 owner/browser test passes.

## Active M1.09 invariants

- One combined Sites/Departments Company interface.
- Tenant-scoped durable site/department records.
- Safe archive ends active assignments but preserves assignment history.
- Archived units cannot receive active assignments; restore does not resurrect old assignments.
- Company Team is separate from Worker directory.
- Company Team enrollment reuses existing `auth_staff_invitations` + `/staff/invite/<token>` password/TOTP path.
- Company role/site/department/permissions are server/database-owned.
- No inviter may grant a role above the accepted role matrix or a permission they do not possess.
- Organization/team mutations require immutable transactional audit and permanent PGlite regressions.
- No M1.10 Worker invitation/company-code implementation leakage.

## Engineering discipline

Root cause only; no compatibility patches for impossible states. Do not weaken accepted tests. Use additive migrations for later vocabulary. Exact-head full gate before merge, expected-head lock, then merged-main full gate. Local/sandbox provider adapters are not live production providers.
