# M1.05 Subunit 5 — Complete M1.05 Isolation, Retry, Migration and Owner Acceptance

## Status

**IMPLEMENTATION AUTOMATED PASS — FINAL DOCUMENTATION HEAD VALIDATION PENDING — NOT DONE**

Subunit 5 is the brick-closing verification/integration unit for M1.05. It adds no new business-domain product behavior. M1.05 remains **IN PROGRESS**, and M1.06 remains blocked until this exact PR merges, merged `main` passes, the owner final command-line gate passes, and a separate M1.05 brick-acceptance record is merged.

## Validated implementation evidence

- Pull request: `#45`
- Branch: `build/m1-05-final-acceptance`
- Accepted base before Subunit 5: `101f93a0c6a91ef014efdef94fb5f9a9a50ac9aa`
- Strengthened validated implementation head: `724f7b5d8701a045837ffdb870f63ab804ff9958`
- Engineering run: `31320790608`
- Validation job: `93263363256`
- Complete repository engineering gate: **PASS**
- No production feature, database migration, dependency, route, provider or UI behavior was added by Subunit 5.

The branch contains one additional source-guard strengthening commit after that validated implementation head so the final combined tests cannot be silently dropped. The exact final documentation head must pass the complete gate again before merge.

## Combined acceptance coverage

The final M1.05 suite now proves the accepted audit, outbox/jobs, persisted notifications and durable email delivery foundations together:

1. Company A and Company B audit, outbox, notification and email records are isolated with direct tenant/recipient SQL predicates and non-enumerating copied-ID denial.
2. Worker, Company, Assessor, Verifier, Admin and Root each read only their own recipient-bound notification/email records; copied identifiers across all six fixed roles return no record.
3. Live Company membership and session revalidation fails closed after membership/session revocation while durable M1.05 history remains intact.
4. Accepted audit events remain append-only and reject direct mutation/deletion.
5. Notification identity/source/recipient/target fields remain immutable; unread-to-read is durable and one-way.
6. Email delivery history remains non-deletable and does not persist plaintext recipient email in outbox payload, audit metadata or durable delivery fields.
7. Core state plus required outbox work rolls back atomically on transaction failure and commits together on success.
8. Outbox, notification projection and email-delivery creation remain idempotent under repeated equivalent work.
9. Mixed notification/email jobs use the same accepted `FOR UPDATE SKIP LOCKED` lease authority; concurrent workers do not claim the same active job.
10. Expired mixed-job leases are reclaimable, the prior attempt is closed as lease-expired, the replacement worker receives the next attempt, and stale completion returns no state change.
11. Lease reclaim does not duplicate the already-durable logical notification or email-delivery record.
12. Existing outbox/email platform and real-runtime regressions continue to prove deterministic retry/backoff, fifth-attempt terminal failure, stale email start/finalize rejection and no redispatch after durable terminal outcomes.
13. Notification open-time behavior remains principal-scoped before fixed server-side `resolveNotificationHref` resolution; stored targets never become authorization capabilities or arbitrary URLs.
14. Email provider authority remains exactly `local_test`, with no network endpoint/fetch and no live-provider activation.
15. The shared outbox worker remains a fixed handler registry: notification receives job-only adaptation and email receives job plus trusted lease.
16. M1.05 source keeps direct SQL scope, fixed handler/provider authority and no `as any`, `@ts-ignore` or `@ts-expect-error` bypass in audit/outbox/notification/email source.
17. Migrations `0007`–`0010` continue through their permanent owned-layer rollback/reapply/checksum tests, while the combined suite verifies complete-stack checksums and persisted audit/outbox/notification/email state after database close/reopen.
18. Failed asynchronous work does not undo already-committed core state.
19. Every accepted M1.05 regression through `REG-034` reruns in the complete repository gate; `REG-035` permanently protects the final source guard from matching guessed implementation spelling instead of stable security semantics.
20. No second audit store, scheduler/retry authority, notification store or email queue is introduced by Subunit 5.

## Permanent Subunit 5 regression

### REG-035 — final source guard coupled to guessed spelling rather than security semantics

Early final-acceptance checks incorrectly assumed particular internal symbol spellings and used an unsafe unbounded provider substring. Correct accepted behavior was blocked even though the product boundary was sound.

The permanent guard now checks stable semantics instead:

- delivered/terminal email preparation short-circuits;
- notification open performs principal-scoped lookup before fixed `resolveNotificationHref` resolution;
- provider authority is exactly `EMAIL_ADAPTER_KEYS = ["local_test"]`;
- live-provider names, if checked, use word boundaries;
- fixed notification/email worker adapters remain explicit;
- the final isolation, mixed crash/reclaim and six-role matrix test files must remain wired into `test:m1-05-final`.

## Test-fixture discipline

During combined-suite validation, malformed higher-layer fixtures were rejected by accepted lower-layer constraints: session revocation requires both timestamp and reason, and terminal outbox state requires a valid attempt count/lifecycle shape. Those were corrected as **REG-033** fixture-discipline applications. No accepted database constraint was weakened.

## Explicit exclusions

Subunit 5 does not add or claim:

- live SMTP/API provider credentials or production sending;
- new notification/email business types;
- a new notification/email operations dashboard;
- secure object storage or evidence upload from M1.06;
- worker identity/liveness from M1.07;
- company registration/verification from M1.08;
- sites/departments/team/invitations, evidence workflows, public verification, assessments, interviews, credentials, billing or later milestones.

## Final gate before owner handoff

Subunit 5 is not accepted until all of these occur in order:

1. exact final PR head passes the complete engineering gate;
2. PR review confirms no head drift, unresolved review thread, temporary automation or scope contamination;
3. that exact head merges to `main`;
4. merged `main` passes the complete engineering gate;
5. owner runs `docs/testing/M1_05_FINAL_ACCEPTANCE_HARD_TEST.md` and reports PASS;
6. a separate M1.05 brick-level final owner-acceptance record merges and its merged-main gate passes.

Only then may M1.05 become **DONE — OWNER PASS** and M1.06 become **READY TO BUILD**.
