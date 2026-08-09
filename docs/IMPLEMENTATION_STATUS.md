# Implementation Status

## Formal Milestone 1 bricks

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
  - Subunit 1 Immutable Audit Foundation — **DONE — OWNER PASS — 6 August 2026**.
  - Subunit 2 Transactional Outbox and Deterministic Job Foundation — **DONE — OWNER PASS — 7 August 2026**.
  - Subunit 3 Persisted In-App Notifications and Role-Safe Deep Links — **DONE — OWNER PASS — 9 August 2026**.
  - Subunit 4 Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **DONE — OWNER PASS — 9 August 2026**.
  - Subunit 5 Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **READY TO BUILD** after this closure commit is green on merged `main`.
- M1.07 through M1.12 — blocked/incomplete according to `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

**Phase 1 progress: 5 of 12 Milestone 1 bricks are DONE.**

## Accepted platform boundary through M1.05

- Next.js application, local/test PGlite database, deterministic migrations and fail-closed CI gate.
- Shared responsive design system and six fixed role-specific portal shells.
- Worker registration with mandatory email and phone OTP through the local/test delivery sandbox.
- Fixed-role password sessions, mandatory staff TOTP, recovery and owned-session management.
- Explicit permission matrices, trusted Company tenant context and direct tenant predicates in SQL.
- Transactional authority revalidation and non-enumerating cross-role/cross-tenant denial.
- Immutable shared platform audit events with database-enforced append-only storage and authorized bounded reads.
- Transactional outbox with deterministic claim/lease/reclaim, bounded retry/backoff, terminal failure, idempotency and durable attempt history.
- Persisted notification store with exact recipient/role/Company scope, durable one-way read state, six-role notification surfaces and role-safe reauthorized deep links.
- Durable email-delivery store with immutable attempt history, trusted recipient scope, provider-neutral results, lease-safe worker integration and deterministic `local_test` adapter.
- Combined six-role/tenant isolation, mixed-worker concurrency/reclaim, migration persistence and final M1.05 regressions through `REG-035`.
- No plaintext recipient email is persisted in the accepted delivery/outbox/audit result path.
- Accepted Worker Dashboard and Worker Profile vertical slice; later identity/evidence workflow remains incomplete.

## M1.05 final evidence

- Final implementation PR: `#45`
- Final validated PR head: `e581ec92400f47f06f66eb3ad17f912fa0d7982e`
- PR gate: `31321141113 / 93264217778` — **PASS**
- Implementation merge: `dada64848d683cde4359fdb02efe704f37332a2a`
- Merged-main gate: `31321380167 / 93264799262` — **PASS**
- Owner final hard test: **PASS — 9 August 2026**
- Owner acceptance record: `docs/testing/results/M1_05_FINAL_OWNER_ACCEPTANCE.md`

No unresolved release-blocking M1.05 defect remains.

## Current permitted implementation

Only **M1.06 Secure Storage and Upload Pipeline** may begin after the separate M1.05 owner-acceptance closure PR is merged and its merged-main engineering gate passes.

The exact current gate and M1.06 build boundary are defined in `docs/NEXT_BUILD_UNIT.md`.

## Still incomplete

- M1.06 private object storage abstraction, isolated file metadata, PDF/image validation, quarantine, malware-scan adapter and authorized signed preview.
- M1.07 Worker identity/evidence, photograph/liveness, duplicate detection and permanent Worker ID issuance.
- M1.08 Company registration and verification.
- M1.09 sites, departments and company team management.
- M1.10 Worker invitations and company codes.
- M1.11 employment, experience, skill and leaving-letter records.
- M1.12 public verification foundation.
- Milestone 2 assessments/review/interviews and Milestone 3 credentials/billing/reporting/launch work.
- Production malware-scanner credentials/service and other later production provider activation.
