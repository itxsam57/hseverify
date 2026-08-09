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
- M1.05 Subunit 4 Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter: **DONE — OWNER PASS — 9 August 2026**.

## Phase 1 progress

**4 of 12 Milestone 1 bricks are DONE.**

M1.05 remains **IN PROGRESS** until Subunit 5 completes the combined M1.05 isolation, retry/recovery, migration and final owner-acceptance gate.

## M1.05 Subunit 4 final acceptance

Accepted evidence:

- Implementation pull request: `#43`
- Final validated PR head: `d370dc787f59eba9e7914303d8c361f95e553e88`
- Owner-tested merged commit: `de1487739731edc124e176b043d0094d4f19175b`
- Final PR engineering run: `31316893556`
- Final PR validation job: `93253530340`
- Merged-main engineering run: `31317102908`
- Merged-main validation job: `93254018966`
- Owner command-line hard test: **PASS — 9 August 2026**
- Final acceptance record: `docs/testing/results/M1_05_EMAIL_DELIVERY_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`

The accepted Subunit 4 boundary includes one durable email-delivery model, immutable attempt history, transactional outbox integration, exact worker/lease authority, trusted recipient scope, no plaintext recipient persistence in delivery history, provider-neutral normalized results, deterministic local/test delivery, bounded retry/terminal behavior, duplicate-dispatch suppression, immutable audit facts, direct authorization/tenant predicates, deterministic rollback/reapply and permanent regressions `REG-027` through `REG-034`.

No unresolved release-blocking M1.05 Subunit 4 defect remains.

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
12. permanent regressions for deep links, role crossing, duplicate suppression and durable state.

Live email credentials remain provider-blocked and are not required to complete M1.05.

## Internal M1.05 progress

1. Immutable Audit Domain, Schema and Append-Only Repository Foundation — **DONE — OWNER PASS**.
2. Transactional Outbox and Deterministic Job Foundation — **DONE — OWNER PASS**.
3. Persisted In-App Notifications and Role-Safe Deep Links — **DONE — OWNER PASS**.
4. Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **DONE — OWNER PASS**.
5. Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **READY TO BUILD**.

## Current internal subunit

# Subunit 5 — Complete M1.05 Isolation, Retry, Migration and Owner Acceptance

**Status: READY TO BUILD**

Subunit 5 is the only permitted next implementation scope. It is a brick-closing verification/integration unit, not permission to add new product-domain features. M1.06 and later work must not begin until M1.05 is formally accepted.

## Required Subunit 5 boundary

1. Build one combined adversarial acceptance suite spanning immutable audit, outbox/jobs, persisted notifications and email delivery together.
2. Prove every fixed role remains isolated across all M1.05 read/write/open/dispatch boundaries; copied identifiers or direct URLs must not cross portals.
3. Prove Company tenant isolation across audit, notification and email-delivery records with direct SQL predicates, live membership revalidation and non-enumerating denial.
4. Prove revoked, expired, inactive or role-mismatched principals lose access without deleting durable history.
5. Prove accepted audit history remains append-only under direct update/delete attempts and survives all later M1.05 lifecycle work.
6. Prove state plus required outbox work commits atomically and rolls back atomically when the transaction fails.
7. Prove concurrent workers cannot own the same active lease and expired leases are safely reclaimable.
8. Prove stale workers cannot complete, retry, notify or finalize email work after lease ownership moves.
9. Prove at-least-once execution produces idempotent durable effects: no duplicate logical notification, no duplicate email-delivery state and no duplicate material audit fact where the accepted contract requires uniqueness.
10. Prove deterministic retry/backoff and exact terminal-failure boundaries remain consistent between the outbox engine and email projection.
11. Prove notification read state is durable and one-way while notification identity/source/recipient/target fields remain immutable.
12. Prove notification deep links reauthorize at open time and never become authorization capabilities.
13. Prove email delivery cannot persist plaintext recipient addresses, provider credentials, session/authentication secrets or unrestricted private content in outbox, delivery, attempt, audit or normalized result state.
14. Prove local/test provider execution cannot escape to arbitrary network/provider authority and production provider activation remains unavailable without the later explicit integration gate.
15. Prove failed asynchronous notification/email work cannot roll back or corrupt already-committed core state.
16. Prove every M1.05 migration (`0007`–`0010`) remains deterministic, checksum-stable, reversible in its owned layer and reapplicable beneath/around later layers without deleting accepted M1.01–M1.04 data or immutable M1.05 history that must survive.
17. Prove the complete migration stack survives persistent database close/reopen and retains accepted audit, outbox, notification and email-delivery state.
18. Run concurrency/crash-recovery tests at the combined boundary rather than relying only on isolated subunit tests.
19. Re-run every permanent M1.05 regression, including all defects recorded through `REG-034`, and add a new regression before repair if Subunit 5 discovers another defect.
20. Inspect the final M1.05 source for duplicate authority: no second audit store, no second scheduler/retry loop, no second notification store, no competing email queue and no browser-selected security authority.
21. Inspect all accepted M1.05 server/query paths for global-read-then-filter patterns, cross-tenant existence leaks, unsafe casts, bypass helpers, wildcard permissions, arbitrary handler/provider selection and unbounded secret-bearing metadata.
22. Keep the full repository engineering gate green: source contracts, unit/integration/platform/runtime tests, migration proofs, strict TypeScript, ESLint, development/runtime smoke and production build.
23. Produce a final M1.05 owner handoff containing only tests the owner can meaningfully perform. Do not invent a browser workflow for engineering-only behavior.
24. After the exact Subunit 5 implementation PR head passes, merge it, require a successful merged-main gate, obtain the final M1.05 owner PASS and merge a separate M1.05 brick-acceptance record.
25. Only after that closure may M1.05 be marked **DONE — OWNER PASS** and M1.06 become READY TO BUILD.

## Explicitly blocked during Subunit 5

- New notification types for future business workflows.
- New email templates/types for future business workflows.
- Live SMTP/API provider credentials or production sending.
- Secure object storage/upload implementation from M1.06.
- Worker identity evidence/liveness from M1.07.
- Company registration/verification from M1.08.
- Sites, departments, team management, invitations/codes, qualification/experience/skill evidence, public verification, assessments, interviews, credentials, billing or later workflows.

## Inherited non-negotiable controls

- Never trust actor, role, tenant, membership, permission, recipient, provider, result, timestamp, retry or idempotency authority from the browser.
- Never weaken fixed-role sessions, portal isolation or direct tenant SQL predicates.
- Never weaken immutable audit storage or hide failed asynchronous work by deleting history.
- Never bypass the accepted transactional outbox/job worker for required asynchronous effects.
- Never treat enqueue as successful notification/email delivery; durable target state must prove the effect.
- Never claim exactly-once external transport; M1.05 uses at-least-once execution with idempotent durable outcomes.
- Never claim live email delivery when only the local/test adapter ran.
- Every discovered defect becomes a permanent regression before M1.05 can close.

## Gate rule

Subunit 5 is complete only after its exact implementation is merged, the complete automated gate passes on the exact PR head and merged `main`, the final owner M1.05 hard test passes, Git is clean/synchronized, and a separate final M1.05 brick-acceptance record is merged.

M1.06 remains blocked until that final closure is complete.