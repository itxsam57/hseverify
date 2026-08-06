# Implementation Status

## Formal Milestone 1 bricks

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **PARTIAL — IN PROGRESS**.
  - Subunit 1 Immutable Audit Foundation — **DONE — OWNER PASS — 6 August 2026**.
  - Subunit 2 Transactional Outbox and Deterministic Job Foundation — **READY TO BUILD**.
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
- Immutable shared platform audit events with database-enforced append-only storage.
- Trusted actor, role and optional Company tenant/membership snapshots for audit facts.
- Transactional compatibility mirroring of accepted authentication security events.
- Authorized bounded platform and tenant audit reads with direct tenant predicates and non-enumerating denial.
- Accepted Worker Dashboard and Worker Profile vertical slice; the wider M1.07 identity workflow remains incomplete.

## Current permitted implementation

Only M1.05 Subunit 2 — Transactional Outbox and Deterministic Job Foundation — is READY TO BUILD.

The exact current gate is `docs/NEXT_BUILD_UNIT.md`.

## Still incomplete

- Transactional outbox persistence, deterministic job claiming, retries, backoff, terminal failure and idempotent processing.
- Persisted in-app notifications, exact role-safe deep links and durable read state.
- Durable email queue, delivery attempts, provider-neutral outcomes and local/test adapters.
- Secure object storage, validation, quarantine, scanning and authorized evidence preview.
- Worker identity/evidence, liveness, duplicate detection and permanent Worker ID issuance.
- Company registration/verification, sites, departments, team management and operational Worker invitations/codes.
- Qualification, experience, employment, skill and leaving-letter evidence workflows.
- Real public verification and Report a Concern.
- Assessments, review, interviews, credential issuance, appeals, payments, reporting and production activation.
