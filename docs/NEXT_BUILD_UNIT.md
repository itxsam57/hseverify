# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, Environments and CI/CD: **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation: **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Subunit 1 Immutable Audit Foundation: **DONE — OWNER PASS — 6 August 2026**.

## Phase 1 progress

**4 of 12 Milestone 1 bricks are DONE.**

M1.05 remains **IN PROGRESS** until every audit, outbox, persisted notification, deep-link, email-queue, retry, security, migration and required owner gate passes.

## M1.05 Subunit 1 final acceptance

Accepted evidence:

- Implementation pull request: `#37`
- Owner-tested merged commit: `43dfbd1b08fcabdc240c16b1a9d76c7844060eb5`
- Merged-main engineering run: `31087115019`
- Merged-main validation job: `92569086166`
- Owner hard test: **PASS — 6 August 2026**
- Final acceptance record: `docs/testing/results/M1_05_AUDIT_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`

The immutable audit contract, append-only database enforcement, authentication-event compatibility bridge, trusted actor/role/tenant context, safe bounded metadata, authorized platform/tenant reads, concurrency proof and rollback/reapplication proof are now accepted and permanently regression-protected.

No unresolved release-blocking M1.05 Subunit 1 defect remains.

## Current build gate

# M1.05 — AUDIT AND NOTIFICATION FOUNDATIONS — IN PROGRESS

M1.05 is the only permitted implementation brick. M1.06 and later bricks remain blocked.

## Canonical M1.05 completion boundary

M1.05 must complete, without weakening M1.03, M1.04 or the accepted audit foundation:

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

## Internal M1.05 progress

1. Immutable Audit Domain, Schema and Append-Only Repository Foundation — **DONE — OWNER PASS**.
2. Transactional Outbox and Deterministic Job Foundation — **AUTOMATED PASS — MERGE PENDING**.
3. Persisted In-App Notifications and Role-Safe Deep Links — **BLOCKED**.
4. Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **BLOCKED**.
5. Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **BLOCKED**.

## Current internal subunit

# Subunit 2 — Transactional Outbox and Deterministic Job Foundation

**Status: AUTOMATED PASS — MERGE PENDING**

Validated candidate evidence:

- Pull request: `#39`
- Validated implementation head: `fe43fadac8ce5a041bcb6ac5ca958d4adb5620fb`
- Engineering verification run: `31108303635`
- Validation job: `92639123132`
- Evidence artifact: `8970620528`
- Result: **PASS**
- Validation record: `docs/testing/results/M1_05_OUTBOX_FOUNDATION_VALIDATED_PENDING_OWNER.md`

The final documentation head must pass the same complete gate. PR `#39` must then merge without head drift, merged `main` must pass, and the owner command-line hard test plus final acceptance record must pass before Subunit 2 becomes DONE.

## Required subunit 2 boundary

1. Define one canonical typed outbox message and background-job contract; do not introduce a second task authority or provider-specific queue model.
2. Add durable opaque outbox/job identifiers, fixed purpose/type vocabulary, bounded schema-versioned payloads and trustworthy database-generated timestamps.
3. Provide a trusted server-only enqueue contract that can participate in the same database transaction as an accepted state change and its required audit fact.
4. Prove atomicity in both directions: accepted state must not commit without its required outbox work, and outbox work must not remain when the state transaction rolls back.
5. Add deterministic idempotency/deduplication keys with database uniqueness so repeated commands cannot create duplicate logical jobs.
6. Add explicit lifecycle states for pending, leased/processing, retry-wait, succeeded and terminally failed work without deleting history.
7. Implement safe concurrent claiming so one available job is leased to at most one worker at a time while other workers can continue claiming different jobs.
8. Use opaque worker/lease ownership, lease expiry and reclaim rules so crashed or abandoned work becomes recoverable without allowing stale workers to complete it.
9. Add bounded attempt counting, deterministic retry classification, server-controlled backoff, next-attempt timestamps and terminal-failure rules.
10. Require idempotent handler effects and separate claim/attempt history from final business effects; do not claim exactly-once transport when the architecture provides at-least-once execution with idempotent outcomes.
11. Keep handler registration server-only and fixed; never execute browser-supplied job types, module names, SQL, URLs or arbitrary code.
12. Prevent passwords, OTP/TOTP values, raw tokens, session cookies, private document bodies and unrestricted personal data from entering outbox payloads or attempt errors.
13. Record required job lifecycle audit facts through the accepted immutable audit engine without making audit persistence optional decoration.
14. Provide authorized, bounded and non-enumerating query contracts for later operational surfaces without building those surfaces early.
15. Add deterministic migration, rollback/reapply, close/reopen persistence, multi-worker concurrency, duplicate suppression, lease-expiry, stale-completion, retry, terminal-failure and transaction-rollback tests.
16. Wire the outbox/job checks into the permanent complete engineering gate and preserve every accepted M1.01–M1.05 Subunit 1 regression.

## Validated implementation boundary

- One fixed job registry with `platform.foundation.noop` as the only Subunit 2 handler.
- Fixed schema version and bounded payload validation.
- Trusted account/tenant-scoped SHA-256 idempotency and database uniqueness.
- Required-outbox transaction wrapper that fails closed without durable work.
- Durable job and attempt history with database deletion rejection.
- Concurrent `SKIP LOCKED` claiming, opaque leases, expiry/reclaim and stale-owner rejection.
- Five-attempt ceiling with deterministic retry delays.
- Fixed server-only handlers and safe bounded persisted errors.
- Immutable audit integration for enqueue, claim, reclaim, success, retry and terminal failure.
- Authorized platform and direct-tenant-SQL query contracts.
- Migration `0008_transactional_outbox_jobs` with rollback/reapply and persistent close/reopen proof.
- Permanent regression coverage for all defects found during validation.

## Explicitly blocked until later M1.05 subunits

- Persisted user-visible notification records and read/unread state.
- Notification center pages, badges and exact role-safe deep links.
- Business-event-to-notification projection handlers beyond interfaces strictly required to avoid redesign.
- Durable email queue records and provider delivery attempts.
- Local/test or live email-provider delivery activation.
- Admin/Root operational queue dashboards.

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

- Never trust actor, role, tenant, membership, permission, ownership, scope, job type, handler, retry result, timestamp or idempotency authority from the browser.
- Accepted state, its required immutable audit fact and required outbox work must share one transaction boundary.
- Never acknowledge successful enqueue before the durable transaction commits.
- Never fetch globally and filter tenant-owned records afterward.
- Never reveal whether another tenant's outbox or job record exists.
- Never delete failed or completed processing history merely to make a queue look clean.
- Never allow stale lease holders to complete, retry or fail a job after ownership has changed.
- Never use an in-memory-only queue as proof of durable behavior.
- Never treat process startup, page refresh or manual commands as the normal mechanism that makes queued work progress.
- Never weaken fixed-role sessions, portal isolation, permission checks, tenant SQL predicates or append-only audit protections.
- Every discovered defect becomes a permanent regression before the subunit can close.

## Gate rule

Subunit 2 becomes accepted only after its exact implementation is merged, the complete automated gate passes on merged `main`, the focused owner command-line hard test passes, Git remains clean and synchronized, and a final subunit acceptance record is merged.

Because Subunit 2 is infrastructure-only, no browser workflow is invented. Persisted notifications, deep links, email delivery and Subunit 3 remain blocked until Subunit 2 is formally accepted.
