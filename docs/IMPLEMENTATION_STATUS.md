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
  - Subunit 5 Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **READY TO BUILD**.
- M1.06 through M1.12 — incomplete according to `docs/bookmarks/MILESTONE_PATH.md`.

**Phase 1 progress: 4 of 12 Milestone 1 bricks are DONE.**

## Accepted platform boundary

- Next.js application, local/test PGlite database, deterministic migrations and fail-closed CI gate.
- Shared responsive design system and role-specific portal shells.
- Worker registration with mandatory email and phone OTP through the local/test delivery sandbox.
- Fixed-role password sessions, mandatory staff TOTP, recovery and owned-session management.
- Six isolated Worker, Company, Assessor, Verifier, Administrator and Root portals.
- Explicit permission matrices, one trusted Company tenant context and direct tenant predicates in SQL.
- Transactional authority revalidation and non-enumerating cross-role/cross-tenant denial.
- Protected synthetic Company tenant-scope demonstration and complete M1.04 isolation/rollback regression suite.
- Immutable shared platform audit events with database-enforced append-only storage, trusted actor/role/tenant snapshots and authorized bounded reads.
- Accepted transactional outbox with deterministic claim/lease/reclaim, bounded retry/backoff, terminal failure, idempotency and durable attempt history.
- Accepted persisted in-app notification store with exact recipient/role/Company scope, durable read state, six-role notification surfaces and role-safe reauthorized deep links.
- Accepted durable email-delivery store with immutable attempt history, trusted recipient scope, provider-neutral results, lease-safe worker integration and deterministic local/test adapter.
- No plaintext recipient email is persisted in the accepted delivery/outbox/audit result path; only the accepted fingerprint/correlation boundary is durable.
- Accepted Worker Dashboard and Worker Profile vertical slice; the wider M1.07 identity workflow remains incomplete.

## Current permitted implementation

Only **M1.05 Subunit 5 — Complete M1.05 Isolation, Retry, Migration and Owner Acceptance** is READY TO BUILD.

Subunit 5 is a final combined integration/adversarial acceptance unit for the existing M1.05 audit, outbox, notification and email-delivery foundations. It is not permission to add later business-domain features.

The exact current gate is `docs/NEXT_BUILD_UNIT.md`.

## Still incomplete

- Final combined M1.05 adversarial isolation across audit, outbox, notifications and email delivery.
- Final combined retry/reclaim/idempotency/crash-recovery proof across all four M1.05 foundations.
- Final combined M1.05 migration-stack persistence/rollback/reapply proof.
- Final M1.05 brick-level owner acceptance and closure record.
- Live email provider activation/credentials; this remains intentionally blocked beyond the local/test foundation.
- Secure object storage, validation, quarantine, scanning and authorized evidence preview from M1.06.
- Worker identity/evidence, liveness, duplicate detection and permanent Worker ID issuance from M1.07.
- Company registration/verification, sites, departments, team management and operational Worker invitations/codes.
- Qualification, experience, employment, skill and leaving-letter evidence workflows.
- Real public verification and Report a Concern.
- Assessments, review, interviews, credential issuance, appeals, payments, reporting and production activation.