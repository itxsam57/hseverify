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
4. Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **AUTOMATED PASS — FINAL PR HEAD VALIDATION / MERGE / OWNER PASS PENDING**.
5. Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **BLOCKED**.

## Current internal subunit

# Subunit 4 — Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter

**Status: IMPLEMENTATION AUTOMATED PASS — NOT DONE**

Subunit 4 remains the only permitted current scope. Its implementation head `831702670a4b2c3f23fad3c9eca0301148b3e0f1` passed engineering run `31316549538`, validation job `93252630064`, including the complete application gate, preview smoke and release evidence manifest. Final documentation changed the PR head afterward, so that exact final head must pass again before merge.

Subunit 5 and M1.06+ remain blocked.

## Implemented Subunit 4 boundary

1. One canonical durable email-delivery model; no competing per-feature email queues.
2. Delivery work uses the accepted transactional outbox/job foundation rather than direct post-response sends.
3. Delivery work is server-side and provider-neutral; browser input cannot select provider modules, URLs, credentials, retry policy or delivery authority.
4. Durable delivery records and separate immutable attempt history prove queued, processing, retry, delivered and terminal-failed outcomes.
5. Opaque identifiers and fixed schema-versioned payload/result vocabularies use bounded safe metadata.
6. Recipient, tenant and delivery context are derived from trusted server-side state; browser-supplied recipient scope is not trusted.
7. Plaintext recipient email is not persisted in outbox payload, delivery/attempt history, audit metadata or normalized provider results; only a SHA-256 address fingerprint is stored by the delivery domain.
8. Delivery outcomes are idempotent across retries, lease expiry and reclaim.
9. The accepted at-least-once worker model is preserved and stale workers cannot start or finish after lease ownership moves.
10. Retry/backoff and fifth-attempt terminal failure are inherited from the accepted deterministic outbox engine; no second retry loop exists.
11. Provider-neutral normalized results allow later live-provider mapping without changing the delivery state machine.
12. A deterministic development/test adapter exercises the real queue, worker, attempt history, retry/result mapping and audit path without network calls or credentials.
13. Live provider credentials and live sending remain disabled/unconfigured.
14. Material email queue/delivery lifecycle facts use the accepted immutable audit engine and safe metadata.
15. Authorized bounded reads use direct recipient/role/tenant SQL predicates plus live authorization revalidation.
16. Cross-role, cross-account and cross-tenant access fails closed and remains non-enumerating.
17. Delivery failure cannot roll back already-committed core state; delivery remains durable asynchronous work.
18. Migration `0010_email_delivery_foundation` is deterministic, reversible and preserves accepted M1.01–M1.05 Subunit 3 data/history.
19. Permanent tests prove success, retry, terminal failure, duplicate suppression, worker reclaim, stale completion rejection, restart persistence and rollback/reapply.
20. Email-delivery source, unit, platform, real-runtime and migration checks are wired into the complete engineering gate.
21. No later business-domain email types were invented; only the minimum foundation/test contract exists.
22. No browser workflow was added, so owner handoff is command-line only after merge and merged-main validation.

## Subunit 4 permanent regressions

REG-027 through REG-034 are recorded in `docs/engineering/REGRESSION-REGISTER.md`, including future-safe migration ownership, stale/reclaimed worker denial, duplicate-start audit denial, durable-terminal redispatch suppression, runtime compiler parity, PostgreSQL integer-width coherence, invariant-safe integration fixtures and feature-specific outbox handler adaptation.

## Remaining Subunit 4 gates

1. Exact final documentation PR head passes the complete engineering gate.
2. PR #43 has no head drift, unresolved review thread or scope contamination.
3. Exact validated head merges to `main`.
4. Merged `main` passes the complete engineering gate.
5. Owner runs `docs/testing/M1_05_EMAIL_DELIVERY_FOUNDATION_HARD_TEST.md` and reports PASS.
6. Final Subunit 4 owner-acceptance record merges.

Only after all six may Subunit 4 be marked **DONE — OWNER PASS** and Subunit 5 become ready.

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

Subunit 4 becomes accepted only after its exact implementation is merged, the complete automated gate passes on the exact PR head and merged `main`, the owner command-line hard test passes, normal shutdown succeeds, Git is clean and synchronized, and a final Subunit 4 acceptance record is merged.

Subunit 5 remains blocked until that acceptance is complete.
