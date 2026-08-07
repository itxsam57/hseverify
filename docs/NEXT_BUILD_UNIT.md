# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, Environments and CI/CD: **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation: **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Subunit 1 Immutable Audit Foundation: **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Subunit 2 Transactional Outbox and Deterministic Job Foundation: **DONE — OWNER PASS — 7 August 2026**.

## Phase 1 progress

**4 of 12 Milestone 1 bricks are DONE.**

M1.05 remains **IN PROGRESS** until persisted notifications, exact role-safe deep links, durable email delivery, complete isolation/retry proof and the final M1.05 owner gate all pass.

## M1.05 Subunit 2 final acceptance

Accepted evidence:

- Implementation pull request: `#39`
- Final validated PR head: `11ad5aff8cb737c00884e5820b24dc73fddf180a`
- Owner-tested merged commit: `d03155f41c11ba4a5b597e870bc0f54036359807`
- Merged-main engineering run: `31109232531`
- Merged-main validation job: `92642347886`
- Owner hard test: **PASS — 7 August 2026**
- Final acceptance record: `docs/testing/results/M1_05_OUTBOX_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`

The durable transaction-bound outbox, deterministic leasing/retry lifecycle, immutable audit integration, tenant-safe operational reads, rollback/reapplication behavior and permanent regression suite are accepted.

No unresolved release-blocking M1.05 Subunit 2 defect remains.

## Current build gate

# M1.05 — AUDIT AND NOTIFICATION FOUNDATIONS — IN PROGRESS

M1.05 is the only permitted implementation brick. M1.06 and later bricks remain blocked.

## Canonical M1.05 completion boundary

M1.05 must complete, without weakening M1.03, M1.04, the accepted audit foundation or the accepted outbox foundation:

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
11. exact owner handoff limited to genuinely visible notification behavior;
12. permanent regressions for notification deep links, no role crossing, duplicate suppression and durable state.

Live email credentials remain provider-blocked and are not required to complete the M1.05 local/test foundation.

## Internal M1.05 progress

1. Immutable Audit Domain, Schema and Append-Only Repository Foundation — **DONE — OWNER PASS**.
2. Transactional Outbox and Deterministic Job Foundation — **DONE — OWNER PASS**.
3. Persisted In-App Notifications and Role-Safe Deep Links — **FUNCTIONAL AUTOMATED PASS — FINAL DOCUMENTATION GATE / MERGE / OWNER PASS PENDING**.
4. Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **BLOCKED**.
5. Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **BLOCKED**.

## Current internal subunit

# Subunit 3 — Persisted In-App Notifications and Role-Safe Deep Links

**Status: FUNCTIONAL AUTOMATED PASS — FINAL DOCUMENTATION GATE / MERGE / OWNER PASS PENDING**

Subunit 3 remains the only permitted implementation scope. Subunit 4 must not start yet.

## Validated functional candidate evidence

- Implementation pull request: `#41`
- Functional implementation head: `35158a9fdfa2596d45febeca80996bf539aad41b`
- Complete engineering verification run: `31185529169`
- Validation job: `92888980538`
- Evidence artifact: `8989374984`
- Artifact digest: `sha256:4de0d4215be72521361351159249aba041e70512cd5a2a1c1b85b9256e99e677`
- Functional complete result: **PASS**
- Implementation record: `docs/M1_05_NOTIFICATION_FOUNDATION.md`
- Owner handoff: `docs/testing/M1_05_NOTIFICATION_FOUNDATION_HARD_TEST.md`
- Automated validation record: `docs/testing/results/M1_05_NOTIFICATION_FOUNDATION_VALIDATED_PENDING_OWNER.md`

The final documentation head must pass the complete gate before merge. The exact merge commit must then pass merged-main CI before owner handoff is considered ready.

## Implemented Subunit 3 boundary

1. One shared persisted `platform_notifications` model; no per-portal notification databases or second queue authority.
2. Opaque notification IDs, fixed type vocabulary, schema-versioned bounded metadata and database timestamps.
3. Recipient account and fixed portal role binding; Company records additionally bind the trusted tenant and membership.
4. Projection only from committed accepted outbox work through fixed server-side handler `notification.portal.foundation`.
5. Recipient-scoped deterministic projection keys plus database uniqueness for retry/reclaim duplicate suppression.
6. Database validation that the notification source job, recipient, role, tenant/membership, fixed content, metadata and current eligibility all agree.
7. Immutable source/recipient/content/target fields and database deletion rejection.
8. One-way durable unread-to-read state with database-generated read timestamp.
9. Direct recipient/role SQL predicates for every list/count/find/update; Company SQL also includes direct tenant/membership predicates.
10. Live session/account/role revalidation and live Company tenant-membership revalidation before reads and mutations.
11. Shared persisted notification bell/unread count and notification center across all six fixed portals.
12. Explicit notification loading, empty and failure states with responsive/keyboard-safe shared controls.
13. Worker dashboard demonstration notification state removed; Worker metrics/recent notifications now consume the persisted notification service.
14. Fixed server-side deep-link registry with only the already-real `portal.dashboard` target in this subunit.
15. Deep links derive destination from the current fixed role through the accepted role-home registry; no arbitrary URL is stored or accepted.
16. Browser notification actions submit only an opaque notification ID; role, tenant, membership, target and redirect destination remain server-derived.
17. Opening a notification re-authorizes current live recipient scope before resolving the target.
18. Cross-role/cross-account/cross-tenant/revoked/malformed access is non-enumerating and fails closed.
19. Mark Read immediately revalidates the affected route data and is duplicate/concurrency safe.
20. Immutable audit facts for notification projection, read transition and denied deep-link access.
21. Development/test owner fixture is impossible in production and uses the real accepted outbox transaction, worker, projection, persistence and authorization path.
22. Repeat owner-fixture creation uses a server-generated unique fixture identity while production projection idempotency remains enforced independently.
23. Notification center uses the authoritative persisted unread count instead of inferring totals from its bounded visible page.
24. Migration `0009_persisted_notifications` has deterministic rollback/reapply and persistent close/reopen proof while preserving historical outbox/audit vocabulary.
25. Notification source/unit/integration/route/migration checks are permanently wired into the complete engineering gate.

## Permanent validation repairs

The Subunit 3 validation cycle permanently corrected:

- stale migration-suite assumptions that `0008` would remain the newest migration;
- an outbox migration proof coupled to the globally newest layer rather than migration `0008` itself;
- an over-broad route-security regex that falsely treated source order as query-controlled role authority;
- a fixed development fixture idempotency key that made a second valid owner test unreliable;
- a visible unread total that could undercount when more than 50 unread notifications existed.

No gate was weakened to obtain a pass. Each fix either extends the existing accepted proof through `0009` or makes the proof structurally independent of future layers.

## Required Subunit 3 boundary retained for acceptance

1. one canonical persisted notification model;
2. opaque IDs, fixed types and bounded metadata;
3. exact recipient/role/Company scope;
4. projection from committed outbox work only;
5. durable idempotent projection;
6. persisted one-way read state;
7. bounded directly scoped queries;
8. shared authenticated bell/count;
9. accessible list/loading/empty/failure behavior;
10. fixed server-side deep-link registry;
11. authorization revalidation at click time;
12. cross-role denial;
13. cross-tenant non-enumerating denial;
14. framework-native real-route navigation;
15. duplicate-safe Mark Read and immediate visible update;
16. immutable material audit facts;
17. safe notification content with no secrets or unrestricted personal data;
18. real-path development/test fixture only;
19. role/tenant/dedup/concurrency/revocation/persistence/rollback regressions;
20. route/deep-link contracts;
21. permanent complete-gate integration;
22. focused visible owner handoff after final PR and merged-main green.

## Explicitly blocked until Subunit 4

- Durable email queue records.
- Email delivery-attempt records.
- Provider-neutral email delivery result mapping.
- Local/test email delivery adapters.
- Live email provider credentials or activation.
- Email-specific retry dashboards.

## Explicitly blocked until Subunit 5

- Final combined M1.05 adversarial isolation suite across audit, outbox, notifications and email delivery.
- Final M1.05 operational/recovery acceptance and brick-level owner sign-off.

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

- Never trust actor, role, tenant, membership, permission, recipient, notification type, target, URL, read state, timestamp or idempotency authority from the browser.
- Never bypass the accepted outbox for asynchronous notification projection.
- Never weaken fixed-role sessions, portal isolation, tenant SQL predicates, immutable audit or job lease/idempotency controls.
- Never fetch globally and filter notification ownership afterward.
- Never let a notification deep link act as authorization.
- Never expose another role's or tenant's record existence through errors, redirects or counts.
- Never use in-memory notifications as proof of persistence.
- Never count an enqueued job as a delivered notification; the persisted notification and authorized UI projection must exist.
- Never claim a notification flow passed because a generic route returned HTTP 200; the intended recipient behavior must render and be owner-tested.
- Every discovered defect becomes a permanent regression before the subunit can close.

## Remaining gate rule

Subunit 3 becomes accepted only after:

1. the exact final documentation PR head passes the complete engineering gate;
2. PR `#41` merges without head drift;
3. the exact merged `main` commit passes the complete push gate;
4. the visible owner notification/deep-link hard test passes;
5. normal shutdown succeeds and Git is clean/synchronized;
6. a final Subunit 3 owner-acceptance record is merged.

Subunit 4 remains blocked until that acceptance is complete.
