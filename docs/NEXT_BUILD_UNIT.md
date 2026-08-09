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

M1.05 remains **IN PROGRESS**. It cannot become DONE until the Subunit 5 final PR merges, merged `main` passes, the owner final M1.05 command-line gate passes, and a separate M1.05 brick-level acceptance record is merged and revalidated.

## Current build gate

# M1.05 — AUDIT AND NOTIFICATION FOUNDATIONS — IN PROGRESS

M1.05 is the only permitted implementation brick. **M1.06 and every later brick remain blocked.**

## Internal M1.05 progress

1. Immutable Audit Domain, Schema and Append-Only Repository Foundation — **DONE — OWNER PASS**.
2. Transactional Outbox and Deterministic Job Foundation — **DONE — OWNER PASS**.
3. Persisted In-App Notifications and Role-Safe Deep Links — **DONE — OWNER PASS**.
4. Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **DONE — OWNER PASS**.
5. Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **IMPLEMENTATION AUTOMATED PASS — FINAL PR HEAD VALIDATION / MERGE / OWNER PASS PENDING**.

## Current internal subunit

# Subunit 5 — Complete M1.05 Isolation, Retry, Migration and Owner Acceptance

**Status: IMPLEMENTATION AUTOMATED PASS — NOT DONE**

Validated implementation evidence:

- Pull request: `#45`
- Branch: `build/m1-05-final-acceptance`
- Accepted base: `101f93a0c6a91ef014efdef94fb5f9a9a50ac9aa`
- Strengthened validated implementation head: `724f7b5d8701a045837ffdb870f63ab804ff9958`
- Engineering run: `31320790608`
- Validation job: `93263363256`
- Complete repository engineering gate: **PASS**
- Validated-pending-owner record: `docs/testing/results/M1_05_FINAL_ACCEPTANCE_VALIDATED_PENDING_OWNER.md`
- Owner hard test: `docs/testing/M1_05_FINAL_ACCEPTANCE_HARD_TEST.md`

The final documentation/governance head includes one additional source-guard strengthening change and therefore must independently pass the same complete gate before PR #45 may merge.

## Validated Subunit 5 boundary

The final acceptance layer now proves and permanently protects:

1. one combined adversarial PGlite suite across audit, outbox/jobs, persisted notifications and durable email delivery;
2. Company A/B direct-SQL tenant isolation and non-enumerating copied-ID denial across all four M1.05 foundations;
3. Worker, Company, Assessor, Verifier, Admin and Root recipient isolation for persisted notification and email-delivery records;
4. revoked membership/session denial without deleting durable M1.05 history;
5. immutable append-only audit history;
6. core state plus required outbox commit/rollback atomicity;
7. mixed notification/email worker concurrency with `FOR UPDATE SKIP LOCKED`;
8. expired-lease reclaim, replacement ownership and stale-worker completion denial;
9. idempotent outbox enqueue, notification projection and email-delivery creation;
10. no duplicate logical notification/email effect after crash/reclaim;
11. deterministic retry/backoff and fifth-attempt terminal behavior through the accepted outbox/email platform and real-runtime regressions;
12. durable one-way notification read state and immutable notification identity/source/recipient/target fields;
13. principal-scoped notification lookup before fixed server-side `resolveNotificationHref` deep-link resolution;
14. no plaintext recipient email in accepted outbox payload, audit metadata or durable email state;
15. exact `local_test` provider authority with no arbitrary network/provider endpoint selection;
16. failed asynchronous work cannot undo already-committed core state;
17. M1.05 migrations `0007`–`0010` retain permanent owned-layer rollback/reapply/checksum proof;
18. complete-stack checksum and audit/outbox/notification/email persistence after PGlite close/reopen;
19. permanent regressions through `REG-035`;
20. no second audit store, scheduler/retry loop, notification store or email queue;
21. direct SQL scoping, fixed worker/provider authority and no accepted M1.05 type-safety bypass markers;
22. the complete repository gate remains green through security/dependency checks, strict TypeScript, ESLint, runtime smoke and production build.

## Subunit 5 permanent regression

`REG-035` is recorded in `docs/engineering/REGRESSION-REGISTER.md`.

The final source guard must verify stable security semantics rather than guessed symbol spelling or unsafe substrings. It also permanently requires all three final M1.05 combined test files to remain wired into `test:m1-05-final`:

- `m1-05-final-acceptance.test.mjs`
- `m1-05-final-concurrency.test.mjs`
- `m1-05-final-role-matrix.test.mjs`

Final-suite fixtures are also bound by existing `REG-033`: higher-layer tests cannot bypass accepted lower-layer lifecycle/cryptographic constraints.

## Remaining gates

1. Exact final documentation PR head passes the complete engineering gate.
2. PR #45 has no head drift, unresolved review thread, temporary automation or scope contamination.
3. Exact validated final head merges to `main`.
4. Merged `main` passes the complete engineering gate.
5. Owner runs `docs/testing/M1_05_FINAL_ACCEPTANCE_HARD_TEST.md` and reports PASS.
6. A separate M1.05 brick-level final owner-acceptance closure record merges and its merged-main gate passes.

Only after all six may M1.05 be marked **DONE — OWNER PASS** and Phase 1 progress advance to **5 of 12**.

## Explicitly blocked until final M1.05 closure

- Declaring M1.05 DONE.
- M1.06 secure object storage/upload implementation.
- M1.07 Worker identity evidence/liveness.
- M1.08 Company registration/verification.
- M1.09–M1.12 later Milestone 1 product workflows.
- Assessments, interviews, credentials, billing or later milestone work.
- Live SMTP/API provider credentials or production sending.

## Inherited non-negotiable controls

- Never trust actor, role, tenant, membership, permission, recipient, provider, result, timestamp, retry or idempotency authority from the browser.
- Never weaken fixed-role sessions, portal isolation or direct tenant SQL predicates.
- Never weaken immutable audit storage or delete failed asynchronous history.
- Never bypass the accepted transactional outbox/job worker for required asynchronous effects.
- Never treat enqueue as successful notification/email delivery; durable target state must prove the effect.
- Never claim exactly-once external transport; M1.05 uses at-least-once execution with idempotent durable outcomes.
- Never claim live email delivery when only the local/test adapter ran.
- Every discovered defect becomes a permanent regression before M1.05 can close.

## Gate rule

Subunit 5 remains **NOT DONE** until its exact final implementation/documentation head is merged, the complete automated gate passes on exact PR head and merged `main`, the final owner M1.05 hard test passes, Git is clean/synchronized, and a separate M1.05 brick-acceptance record is merged and revalidated.

M1.06 remains blocked until that final closure is complete.
