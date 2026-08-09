# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, Environments and CI/CD: **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation: **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Subunit 1 Immutable Audit Foundation: **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Subunit 2 Transactional Outbox and Deterministic Job Foundation: **DONE — OWNER PASS — 7 August 2026**.
- M1.05 Subunit 3 Persisted In-App Notifications and Role-Safe Deep Links: **DONE — OWNER PASS — 9 August 2026**.

## Phase 1 progress

**4 of 12 Milestone 1 bricks are DONE.**

M1.05 remains **IN PROGRESS** until durable email delivery, complete combined isolation/retry/recovery proof and the final M1.05 owner gate pass.

## M1.05 Subunit 3 final acceptance

Accepted evidence:

- Implementation pull request: `#41`
- Final validated PR head: `5ba526d24ebf4788b1465b2f3d8780052eb51395`
- Owner-tested merged commit: `5f0b73e245044474713de54b9c7ae8642b771442`
- Final PR engineering run: `31186076304`
- Final PR validation job: `92890892172`
- Merged-main engineering run: `31186344977`
- Merged-main validation job: `92891735302`
- Owner visible hard test: **PASS — 9 August 2026**
- Final acceptance record: `docs/testing/results/M1_05_NOTIFICATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`

The accepted Subunit 3 boundary includes the shared persisted notification store, accepted-outbox projection, fixed recipient/role/Company scope, durable one-way read state, shared six-role bell/list surfaces, server-derived role-safe deep links, immutable notification audit facts, deterministic rollback/reapply and permanent isolation/deduplication/persistence regressions.

No unresolved release-blocking M1.05 Subunit 3 defect remains.

## Current build gate

# M1.05 — AUDIT AND NOTIFICATION FOUNDATIONS — IN PROGRESS

M1.05 is the only permitted implementation brick. M1.06 and later bricks remain blocked.

## Canonical M1.05 completion boundary

M1.05 must complete, without weakening M1.03, M1.04 or any accepted M1.05 subunit:

1. immutable audit events with trusted actor, role, tenant, action, target, outcome, reason and database timestamps;
2. append-only audit persistence and authorized read projections;
3. transactional outbox for accepted state and required follow-up work;
4. deterministic job claiming, idempotency, retry, backoff and terminal failure;
5. persisted in-app notifications with recipient scope, read state and exact role-safe deep links;
6. notification creation from committed outbox work rather than demonstration-only dashboard data;
7. durable email queue with attempt history, retry state and provider-neutral delivery results;
8. local/test delivery adapters and complete automated proof before live provider activation;
9. cross-role and cross-tenant denial for audit, outbox, notification and delivery records;
10. reversible deterministic migrations preserving accepted earlier data;
11. exact owner handoff limited to genuinely visible behavior;
12. permanent regressions for notification deep links, no role crossing, duplicate suppression and durable state.

Live email credentials remain provider-blocked and are not required to complete the M1.05 local/test foundation.

## Internal M1.05 progress

1. Immutable Audit Domain, Schema and Append-Only Repository Foundation — **DONE — OWNER PASS**.
2. Transactional Outbox and Deterministic Job Foundation — **DONE — OWNER PASS**.
3. Persisted In-App Notifications and Role-Safe Deep Links — **DONE — OWNER PASS**.
4. Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **READY TO BUILD**.
5. Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **BLOCKED**.

## Current internal subunit

# Subunit 4 — Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter

**Status: READY TO BUILD**

Subunit 4 is the only permitted next implementation scope. Subunit 5 and M1.06+ must not start yet.

## Required Subunit 4 boundary

1. Add one canonical durable email-delivery model; do not create competing per-feature email queues.
2. Build on the accepted transactional outbox/job foundation rather than bypassing it with direct post-response sends.
3. Keep delivery work server-side and provider-neutral. Browser input must never select provider modules, URLs, credentials, retry policy or delivery authority.
4. Persist durable email delivery records and separate delivery-attempt history sufficient to prove queued, processing, retry, delivered and terminal-failed outcomes.
5. Use opaque identifiers and fixed schema-versioned payload/result vocabularies with bounded safe metadata.
6. Derive recipient, tenant and delivery context from trusted server-side state and accepted work; do not trust browser-supplied recipient scope.
7. Store no plaintext passwords, OTP/TOTP values, session cookies, raw access tokens, provider secrets or unrestricted private document bodies in delivery records, attempts, logs or audit metadata.
8. Make delivery outcomes idempotent so worker retries, lease expiry or reclaim cannot cause duplicate logical delivery state.
9. Preserve the accepted at-least-once worker model and prevent stale workers from changing delivery state after lease ownership moves.
10. Use deterministic bounded retry/backoff and terminal-failure behavior. Do not create infinite retries or hidden retry loops.
11. Persist provider-neutral normalized results so later live providers can map their responses without changing the core delivery state machine.
12. Provide local/test delivery adapters that exercise the real queue, worker, attempt history, retry/result mapping and audit path without requiring live credentials.
13. Keep live provider credentials and live sending disabled/unconfigured in this subunit unless the canonical provider-integration gate later explicitly enables them.
14. Add immutable audit facts for material email queue/delivery lifecycle events using the accepted append-only audit engine and safe metadata.
15. Enforce authorized bounded reads with direct recipient/role/tenant predicates where delivery records become queryable; never fetch globally and filter ownership in application code.
16. Cross-role, cross-account and cross-tenant access to delivery state must fail closed and be non-enumerating.
17. Delivery failure must not roll back or corrupt already-committed core business state; follow-up delivery remains durable asynchronous work.
18. Migration work must be deterministic, reversible and preserve all accepted M1.01–M1.05 Subunit 3 data and immutable history.
19. Prove success, retry, terminal failure, duplicate suppression, worker reclaim, stale completion rejection, persistence across restart and rollback/reapply in permanent tests.
20. Wire email-delivery source checks, unit tests, integration tests and migration checks into the complete engineering gate before any merge.
21. Do not invent later business-domain email types merely to populate the queue. Use only the minimum foundation/test contract required to prove Subunit 4 architecture.
22. Produce an owner handoff only for genuinely visible/local-test behavior after the exact PR head and merged-main gates pass.

## Explicitly blocked until Subunit 5

- Final combined M1.05 adversarial isolation suite across audit, outbox, notifications and email delivery.
- Final M1.05 retry/recovery/operational acceptance across all four foundations.
- Final M1.05 brick-level owner sign-off.
- Declaring M1.05 DONE.

## Explicitly blocked beyond M1.05

- Secure object storage and uploads from M1.06.
- Worker identity evidence and liveness from M1.07.
- Company public registration and verification from M1.08.
- Sites, departments and team management from M1.09.
- Worker invitations and Company codes from M1.10.
- Qualifications, experience, employment, skill and leaving-letter evidence from M1.11.
- Real public verification from M1.12.
- Assessments, interviews, credentials, billing and later workflows.

## Inherited non-negotiable controls

- Never trust actor, role, tenant, membership, permission, recipient, provider, result, timestamp, retry or idempotency authority from the browser.
- Never bypass the accepted outbox/job foundation for asynchronous delivery.
- Never weaken fixed-role sessions, portal isolation, tenant SQL predicates, immutable audit, notification isolation or job lease/idempotency controls.
- Never expose another role's or tenant's delivery record existence through errors, redirects or counts.
- Never treat an enqueued email job as a delivered email; durable delivery state and attempt history must prove the outcome.
- Never hide failed delivery by deleting queue or attempt history.
- Never claim live email delivery when only a local/test adapter ran.
- Every discovered defect becomes a permanent regression before the subunit can close.

## Gate rule

Subunit 4 becomes accepted only after its exact implementation is merged, the complete automated gate passes on the exact PR head and merged `main`, any required focused owner local/test handoff passes, normal shutdown succeeds, Git is clean and synchronized, and a final Subunit 4 acceptance record is merged.

Subunit 5 remains blocked until that acceptance is complete.