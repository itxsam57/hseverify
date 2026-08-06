# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, Environments and CI/CD: **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation: **DONE — OWNER PASS — 6 August 2026**.

## Phase 1 progress

**4 of 12 Milestone 1 bricks are DONE.**

## M1.04 final acceptance

All five M1.04 internal subunits are accepted:

1. Authorization domain and tenant schema foundation — **DONE — OWNER PASS**.
2. Session authorization context and permission checks — **DONE — OWNER PASS**.
3. Tenant-scoped repository/query/command guards — **DONE — OWNER PASS**.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — **DONE — OWNER PASS**.
5. Complete isolation, concurrency, rollback and final brick acceptance — **DONE — OWNER PASS**.

Final evidence:

- Final implementation pull request: `#34`
- Implementation merge: `4329a591dfa7d1e7c4fca3feb5dd33c873984574`
- Owner-tested commit: `56973430099171ebc48d2f4cc96887b58486167b`
- Final control merged-main run: `31070230847`
- Final control merged-main job: `92516468358`
- Final result: **PASS**
- Final acceptance record: `docs/testing/results/M1_04_FINAL_OWNER_ACCEPTANCE.md`

No unresolved release-blocking M1.04 owner defect remains.

## Current build gate

# M1.05 — AUDIT AND NOTIFICATION FOUNDATIONS — READY TO BUILD

M1.05 is the only permitted implementation brick. M1.06 and later bricks remain blocked.

## Canonical M1.05 completion boundary

M1.05 must complete, without weakening M1.03 or M1.04:

1. an immutable platform audit engine that preserves actor, role, tenant context, action, target, outcome, reason and trustworthy timestamps;
2. append-only audit persistence and authorized read projections, with no normal update/delete path for audit facts;
3. a transactional outbox so accepted business/security state and required follow-up work commit atomically;
4. deterministic background-job claiming, retry, backoff, terminal-failure and idempotency behavior;
5. persisted in-app notifications with recipient scope, read state and exact role-safe deep links;
6. notification creation from committed outbox work rather than demonstration-only dashboard data;
7. a durable email queue with attempt history, retry state and provider-neutral delivery results;
8. local/test delivery adapters and complete automated proof before any live provider activation;
9. cross-role and cross-tenant denial for audit, outbox, notification and delivery records;
10. reversible, deterministic and idempotent migrations with preserved M1.01–M1.04 data;
11. exact owner handoff limited to genuinely visible notification behavior;
12. permanent regression tests for notification deep links, no role crossing, duplicate suppression and durable state.

Live email credentials remain provider-blocked and are not required to complete the M1.05 local/test foundation.

## Current internal subunit

# Subunit 1 — Immutable Audit Domain, Schema and Append-Only Repository Foundation

**Status: READY TO BUILD**

Subunit 1 is the only permitted next implementation scope.

## Required subunit 1 boundary

1. Define the canonical audit event vocabulary and typed event contract.
2. Preserve the existing authentication security-event boundary while introducing the shared platform audit foundation; do not discard or silently fork accepted events.
3. Add opaque audit-event identifiers and trustworthy server-generated timestamps.
4. Record actor account, fixed active role, optional trusted tenant/membership context, action, protected target reference, outcome and non-sensitive denial/failure reason.
5. Add an append-only database migration and repository with no product update/delete command.
6. Prevent browser-supplied actor, role, tenant, permission, outcome or timestamp authority.
7. Provide authorized, bounded and tenant-safe query contracts for later administration surfaces without building those surfaces early.
8. Make missing and cross-tenant audit records non-enumerating.
9. Add deterministic migration, rollback/reapply, persistence, concurrency and source-contract tests.
10. Wire the new audit gate into the permanent complete application check.
11. Preserve every accepted M1.03 authentication, M1.04 authorization, tenant isolation, runtime, build and clean-source boundary.
12. Do not build the transactional outbox, background worker, visible notification center or email queue inside this first subunit except for interfaces strictly required to avoid redesign.

## Explicitly blocked until later M1.05 subunits

- Transactional outbox and background job execution.
- Persisted in-app notification delivery and read state.
- Exact notification deep-link user interface.
- Durable email queue, retries and provider delivery state.
- Live email-provider activation.

## Explicitly blocked beyond M1.05

- Secure object storage and uploads from M1.06.
- Worker identity evidence and liveness from M1.07.
- Company public registration and verification from M1.08.
- Sites, departments and Company team management from M1.09.
- Worker invitations and Company codes from M1.10.
- Qualifications, experience, employment and skill evidence from M1.11.
- Real public verification from M1.12.
- Assessments, interviews, billing, payments and later workflows.

## Inherited non-negotiable controls

- Never trust actor, role, tenant, membership, permission, ownership, scope, outcome or timestamp from the browser.
- Audit creation must occur at trusted server boundaries and must not become optional decoration.
- Accepted state and required audit facts must not diverge because of partial failure.
- Audit records are append-only; corrections use linked compensating/superseding events, not mutation of history.
- Sensitive secrets, password/OTP/TOTP values, raw tokens and private document contents must never be written into audit payloads.
- Every tenant-owned query includes trusted tenant scope directly in SQL.
- Never fetch globally and filter afterward.
- Never reveal whether another tenant's audit or notification record exists.
- Never create a second role, permission or tenant authority registry.
- Never permit role or tenant switching inside a session.
- Do not weaken the complete fail-closed engineering gate.

## Gate rule

M1.05 remains IN PROGRESS until all audit, outbox, persisted notification, deep-link, email-queue, retry, security, migration and required owner gates pass.

Subunit 1 becomes accepted only after its exact implementation is merged, the complete automated gate passes on merged `main`, any required focused owner handoff passes, the server shuts down normally, Git remains clean and synchronized, and a final subunit acceptance record is merged.