# Implementation Status

## Formal Milestone 1 bricks

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **PARTIAL — IN PROGRESS**.
  - Subunit 1 Immutable Audit Foundation — **DONE — OWNER PASS — 6 August 2026**.
  - Subunit 2 Transactional Outbox and Deterministic Job Foundation — **DONE — OWNER PASS — 7 August 2026**.
  - Subunit 3 Persisted In-App Notifications and Role-Safe Deep Links — **DONE — OWNER PASS — 9 August 2026**.
  - Subunit 4 Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **DONE — OWNER PASS — 9 August 2026**.
  - Subunit 5 Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **IMPLEMENTATION AUTOMATED PASS — FINAL PR HEAD / MERGE / OWNER PASS PENDING**.
- M1.06 through M1.12 — blocked/incomplete according to `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

**Phase 1 progress: 4 of 12 Milestone 1 bricks are DONE.**

M1.05 must not be counted as DONE until the exact Subunit 5 final head merges, merged `main` passes, the final owner M1.05 command-line gate passes and the separate brick-level acceptance closure merges.

## Accepted platform boundary through Subunit 4

- Next.js application, local/test PGlite database, deterministic migrations and fail-closed CI gate.
- Shared responsive design system and six fixed role-specific portal shells.
- Worker registration with mandatory email and phone OTP through the local/test delivery sandbox.
- Fixed-role password sessions, mandatory staff TOTP, recovery and owned-session management.
- Explicit permission matrices, trusted Company tenant context and direct tenant predicates in SQL.
- Transactional authority revalidation and non-enumerating cross-role/cross-tenant denial.
- Immutable shared platform audit events with database-enforced append-only storage and authorized bounded reads.
- Accepted transactional outbox with deterministic claim/lease/reclaim, bounded retry/backoff, terminal failure, idempotency and durable attempt history.
- Accepted persisted notification store with exact recipient/role/Company scope, durable one-way read state, six-role notification surfaces and role-safe reauthorized deep links.
- Accepted durable email-delivery store with immutable attempt history, trusted recipient scope, provider-neutral results, lease-safe worker integration and deterministic local/test adapter.
- No plaintext recipient email is persisted in the accepted delivery/outbox/audit result path; only the accepted fingerprint/correlation boundary is durable.
- Accepted Worker Dashboard and Worker Profile vertical slice; later identity/evidence workflow remains incomplete.

## Subunit 5 validated integration boundary

The current Subunit 5 implementation adds engineering verification only, not product behavior. Its strengthened implementation candidate `724f7b5d8701a045837ffdb870f63ab804ff9958` passed engineering run `31320790608`, job `93263363256`.

The final acceptance layer now includes:

- combined audit/outbox/notification/email tenant and role isolation;
- all-six-role notification/email recipient copied-ID denial;
- membership/session revocation with durable-history retention;
- state+outbox atomic commit/rollback proof;
- outbox/notification/email duplicate suppression;
- mixed notification/email worker concurrency, lease expiry, reclaim and stale completion denial;
- accepted retry/backoff/terminal-failure regressions through outbox/email real-runtime tests;
- append-only audit and immutable notification/email history rules;
- durable one-way notification read state;
- principal-scoped fixed notification deep-link resolution;
- plaintext-recipient minimization and exact local/test provider authority;
- complete-stack migration checksum/state persistence after close/reopen plus existing owned-layer rollback/reapply proofs;
- final source authority guard with no competing M1.05 stores/schedulers/provider authority or type-safety bypass markers;
- permanent regression `REG-035` plus all earlier accepted regressions.

The branch contains documentation/governance and source-guard strengthening after the validated implementation head. The exact final PR head must independently pass the full gate before merge.

## Current permitted implementation

Only **M1.05 Subunit 5 final validation/merge/owner closure work** is permitted.

No M1.06 implementation may begin yet.

The exact current gate is `docs/NEXT_BUILD_UNIT.md`.

## Still incomplete

- Exact final PR-head gate after documentation/governance changes.
- Subunit 5 merge to `main` and merged-main gate.
- Final owner M1.05 command-line hard test.
- Separate M1.05 brick-level owner acceptance/closure record and its merged-main gate.
- Live email provider activation/credentials; intentionally outside the accepted local/test foundation.
- M1.06 secure object storage, validation, quarantine, scanning and authorized evidence preview.
- M1.07 Worker identity/evidence, liveness, duplicate detection and permanent Worker ID issuance.
- M1.08 Company registration/verification and later Milestone 1 workflows.
- Assessments, review, interviews, credential issuance, appeals, payments, reporting and production activation.
