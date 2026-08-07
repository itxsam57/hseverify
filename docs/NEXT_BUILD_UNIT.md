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

The durable transaction-bound outbox, deterministic leasing/retry lifecycle, immutable audit integration, tenant-safe operational reads, rollback/reapplication behavior and permanent regression suite are now accepted.

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
3. Persisted In-App Notifications and Role-Safe Deep Links — **READY TO BUILD**.
4. Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **BLOCKED**.
5. Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **BLOCKED**.

## Current internal subunit

# Subunit 3 — Persisted In-App Notifications and Role-Safe Deep Links

**Status: READY TO BUILD**

Subunit 3 is the only permitted next implementation scope.

The canonical specification requires the authenticated global header to expose a notification bell with unread count and deep links, and the critical regression suite must prove notification bell, deep-link and mark-read behavior per role. Notification failures must not corrupt unrelated core state. The existing accepted outbox is the required asynchronous authority for notification projection.

## Required Subunit 3 boundary

1. Define one canonical persisted notification model; do not create separate per-portal notification stores or a second queue authority.
2. Use opaque notification identifiers, fixed notification type vocabulary, schema-versioned bounded metadata and database-generated creation timestamps.
3. Bind every notification to one trusted recipient account and fixed portal role. Company notifications that require tenant context must also bind the trusted tenant/membership context used when the notification was projected.
4. Create notifications only from committed outbox work through fixed server-side handlers. A business/security command must not bypass the accepted outbox by directly creating an asynchronous notification after returning success.
5. Make projection idempotent with database uniqueness so retries, duplicate workers or lease reclaim cannot create duplicate logical notifications.
6. Persist unread/read state and trustworthy read timestamps. Read-state mutation must be authorized from the current role-bound session and may affect only that recipient's notification.
7. Provide bounded server-side notification list and unread-count queries with direct recipient, role and tenant predicates. Never fetch global notifications and filter them in application code.
8. Add the authenticated notification bell and unread count through the shared portal shell without weakening fixed-role navigation or forcing manual refresh.
9. Add one accessible persisted notification surface for the current portal with explicit loading, empty, success, failure and permission-denial states; it must work at supported mobile widths and by keyboard/screen reader.
10. Define a fixed server-side deep-link registry. Notification payloads may carry typed target identifiers but must never carry browser-supplied arbitrary URLs, route modules, SQL or redirect destinations.
11. Resolve deep links against the recipient's current authenticated role and authorization at click time. A notification created while access was valid must not become a capability that bypasses later revocation, tenant changes or record-state changes.
12. Cross-role links must fail closed. A Worker notification can never open Company, Reviewer, Assessor, Admin or Root authority, and the equivalent rule applies to every other portal.
13. Cross-tenant links must be non-enumerating. Missing, moved, revoked or foreign-tenant targets must return a safe recipient-local result without revealing whether another tenant's record exists.
14. Deep links must use framework-native navigation and resolve to a real registered route. No manual `history.pushState`, blank page, endless loader or refresh-required navigation is acceptable.
15. Marking a notification read must update the list and unread count without manual refresh and must be duplicate-safe under repeated clicks or concurrent requests.
16. Add immutable audit facts where material for notification projection, denied deep-link access and read-state operations, using safe metadata only and preserving the accepted append-only audit contract.
17. Do not persist passwords, OTP/TOTP values, raw tokens, session cookies, private document bodies, unrestricted personal data, question/answer content or secrets in notification titles, bodies, metadata or deep-link payloads.
18. Provide development/test-only fixture creation if needed for owner testing, but it must use the same real outbox worker, projection handler, notification persistence and authorization path as production code and must be impossible to activate in production.
19. Prove multi-role recipient isolation, two-tenant isolation, duplicate projection suppression, concurrent mark-read, stale/revoked access, malformed identifiers, target disappearance, close/reopen persistence and rollback/reapply behavior.
20. Add route/deep-link contract tests so every registered notification target resolves for its intended recipient and cannot resolve for another role or tenant.
21. Wire notification/deep-link source checks, unit tests, integration tests and visible runtime checks into the permanent complete engineering gate while preserving all accepted M1.01–M1.05 Subunit 2 regressions.
22. Produce an exact owner handoff for the genuinely visible notification behavior only after the complete PR and merged-main gates pass.

## Initial visible acceptance target

Subunit 3 must finish with a real, persisted notification flow that can be exercised locally/test without fake dashboard state:

- a committed outbox job is processed by the real worker;
- one authorized recipient receives exactly one persisted notification;
- the correct portal bell shows the unread count;
- the notification list shows the persisted record;
- its registered deep link opens only the permitted real route;
- another role and another tenant cannot use that notification or target;
- Mark Read persists, immediately updates the UI and survives restart;
- retrying/reclaiming the projection does not duplicate the notification.

Where later business-domain target routes do not yet exist, Subunit 3 may use narrowly scoped development/test fixtures pointing only to already accepted real routes. It must not invent production business notifications for M1.06+ workflows merely to make the UI look populated.

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
- Never claim a notification flow passed because a generic route returned HTTP 200; render and verify the intended recipient behavior.
- Every discovered defect becomes a permanent regression before the subunit can close.

## Gate rule

Subunit 3 becomes accepted only after its exact implementation is merged, the complete automated gate passes on the exact PR head and merged `main`, the visible owner notification/deep-link handoff passes, normal shutdown succeeds, Git is clean and synchronized, and a final Subunit 3 acceptance record is merged.

Subunit 4 remains blocked until that acceptance is complete.