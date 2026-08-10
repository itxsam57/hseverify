# Next Build Unit

## Authority

This is the exact current implementation gate for the HSE Verify Phase 1 clean rebuild. The frozen product scope remains the **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/bookmarks/MILESTONE_PATH.md` records accepted brick history and build order. Earlier Version 10/prototype code is capability reference only and is not an architectural dependency.

## Accepted owner/engineering gates

- Worker Dashboard and Worker Profile vertical slice — **PASS — 2 August 2026**; accepted slice only, M1.07 remains incomplete.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Subunit 1 Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS — 9 August 2026**.
- M1.06 Subunit 2 Isolated Upload Intake, Validation and Quarantine — **DONE — ENGINEERING PASS — 9 August 2026**.
- M1.06 Subunit 3 Durable Malware Scan Job and Local/Test Scanner Adapter — **DONE — ENGINEERING PASS — 10 August 2026**.
- M1.06 Subunit 4 Authorized Signed Preview/Download Pipeline — **DONE — ENGINEERING PASS — 10 August 2026**.

## Phase 1 / Milestone 1 progress

**5 of 12 Milestone 1 bricks are DONE.**

M1.06 remains **IN PROGRESS**. Four internal subunits are accepted, but the brick is not DONE until Subunit 5 proves the complete M1.06 pipeline and the brick-level acceptance gate closes.

Current accepted canonical `main` boundary after Subunit 4 implementation:

`d03ce5322c2ffa0214c90ee5dc19c15e22da9d51`

## M1.06 Subunit 4 final acceptance

Accepted evidence:

- implementation PR `#53`;
- exact validated head `b370142658238b47d842366f1af343f72533d0b1`;
- exact-head full engineering gate `31354949426 / 93352838153` — **PASS**;
- exact-head artifact `9050368203`, digest `sha256:83e54c82c85cd92b6591b91bad023e43bc0379a788b45d0f86a7db35d9e5c6a2`;
- implementation merge `d03ce5322c2ffa0214c90ee5dc19c15e22da9d51`;
- merged-main full engineering gate `31355234897 / 93353573069` — **PASS**;
- merged-main artifact `9050454811`, digest `sha256:3e84fce13dd4ac981e0fc8faf3020046d92f90d65b2bad7f98415f6479c63469`;
- owner/browser test — **NOT REQUIRED** because no browser-visible product surface was introduced;
- final record `docs/testing/results/M1_06_SIGNED_ACCESS_FINAL_ACCEPTANCE.md`;
- permanent Subunit 4 regressions `REG-055` through `REG-069` remain protected.

## Current build gate

# M1.06 — SECURE STORAGE AND UPLOAD PIPELINE — IN PROGRESS

M1.06 is the only permitted Milestone 1 brick. M1.07 and later bricks remain blocked until the complete M1.06 brick is formally accepted.

Canonical completion requirement: **PDF/image upload isolation, MIME/size/signature checks, private quarantine, malware-scan adapter/lifecycle, authorized signed preview/download, and one cumulative recovery/isolation acceptance proof.**

## M1.06 internal progress

1. Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS**.
2. Isolated Upload Intake, Validation and Quarantine — **DONE — ENGINEERING PASS**.
3. Durable Malware Scan Job and Local/Test Scanner Adapter — **DONE — ENGINEERING PASS**.
4. Authorized Signed Preview/Download Pipeline — **DONE — ENGINEERING PASS**.
5. **Complete M1.06 Isolation, Migration, Recovery and Acceptance — READY TO BUILD.**

## Current internal subunit

# Subunit 5 — Complete M1.06 Isolation, Migration, Recovery and Acceptance

**Status: READY TO BUILD**

Subunit 5 is a cumulative acceptance unit. It must prove that the accepted M1.06 foundations operate correctly together. It must not introduce Worker identity/evidence product workflows from M1.07 or later-brick features merely to create a visible demo.

### Required Subunit 5 boundary

1. Prove the complete local/test lifecycle across the accepted boundaries: server-owned secure-file reservation/private storage → validated PDF/PNG/JPEG intake → quarantine/provenance → durable malware scan → accepted `available|unsafe|scan_failed` result → signed preview/download for `available` only.
2. Prove exact account, fixed-role and Company tenant/membership isolation across every stage. Copied file IDs, reservations, scan jobs and signed capabilities must not cross principal or tenant scope.
3. Prove unsafe, scan-pending, scan-failed, reserved and quarantined files cannot be previewed/downloaded or silently promoted.
4. Prove extension, declared MIME, detected byte structure/signature, byte size, SHA-256 and malware result remain independent trusted checks. No one check may substitute for another.
5. Prove malicious/truncated/corrupt/trailing-content uploads, path traversal/symlink escape, missing objects, changed bytes, wrong hashes and wrong object provenance fail closed without false `available` state.
6. Prove signed-link abuse: tamper, expiry, wrong purpose, copied account/role/tenant/membership, revoked/stale session and stale Company membership fail non-enumerating at the accepted boundary.
7. Prove expected access denial is not confused with database/private-storage operational failure; infrastructure failure remains generic server failure and cannot silently approve or corrupt file state.
8. Prove upload retry, scan retry/backoff/lease reclaim/terminal recovery, repeated handler execution and repeated signed access are idempotent within their accepted contracts and cannot duplicate material state/audit facts.
9. Prove interruption/restart behavior with persistent PGlite and private object storage: metadata, immutable provenance, scan generation/job binding, audit history, file lifecycle and accepted content remain coherent after close/reopen.
10. Prove the complete M1.06 migration stack applies deterministically, rolls back only within accepted monotonic/history-preserving boundaries, reapplies cleanly and retains earlier M1.01–M1.05 accepted data/history.
11. Prove no file bytes/base64 payloads enter relational rows, audit metadata, notification/email state, generated handoff, release artifacts or public URLs.
12. Prove browser/request input cannot select decisive tenant, membership, object key, storage root/provider, scanner provider/handler, detected MIME/hash or signed-access authorization scope.
13. Reuse the existing M1.05 outbox/audit infrastructure and accepted secure-file modules. Do not create parallel queues, event stores, authorization systems, storage abstractions or duplicate lifecycle state machines.
14. Add only cumulative integration/recovery tests and root-cause fixes genuinely required by failures discovered during this acceptance. Do not rewrite already accepted modules without reproduced evidence.
15. Every newly discovered serious defect receives the next stable regression ID and permanent executable guard before M1.06 can close.
16. All focused M1.06 tests, every inherited repository regression, typecheck, lint, runtime smoke, production build and complete fail-closed engineering gate must pass on the exact implementation head.
17. Merge only the exact verified head; then require the complete engineering gate on merged `main` again.
18. Owner/browser testing is required only if Subunit 5 changes a genuine visible product workflow. Do not create a fake UI or test harness just to manufacture a manual test.
19. A separate final M1.06 closure record must be committed after implementation/merged-main verification. Only that closure may mark M1.06 DONE and unlock M1.07.

### Explicitly blocked during Subunit 5

- Worker identity document submission, liveness, duplicate-worker merge review or permanent Worker ID issuance from M1.07.
- Reviewer-facing identity/evidence queues from M2.02.
- Company registration/verification, sites/departments/team, Worker invitation/code, employment/evidence records and public verification from M1.08–M1.12.
- Assessments, Question Bank, assessment delivery, integrity monitoring, written scoring, interview, decision, credentials, billing and all Milestone 2/3 product workflows.
- Live production email/SMS/private-object-storage/malware/liveness/video/payment credentials or provider activation.

## M1.06 brick-level acceptance gate

M1.06 becomes DONE only after Subunit 5 satisfies its exact-head gate, merges without drift, merged `main` passes the complete gate again, any genuinely visible owner behavior is accepted where applicable, and a separate final M1.06 closure records that evidence.

Until then Milestone 1 remains **5/12 DONE** and M1.07 remains blocked.

## Inherited non-negotiable controls

- Large uploads belong in private object storage, never relational rows.
- Browser/application input never supplies decisive authorization, tenant, storage key, provider or executable handler authority.
- Server-side authorization and direct owner/tenant predicates remain mandatory.
- No public bucket/object URLs.
- No preview/download before the required safety state allows it.
- MIME, extension, size, signature and malware state are independent checks; none substitutes for another.
- Slow/retryable scan work uses the accepted M1.05 durable outbox/background worker and bounded retry rules.
- M1.03 portal isolation, M1.04 tenant isolation and M1.05 audit/outbox/notification/email foundations may not be weakened.
- Every confirmed serious defect becomes a permanent regression before the current subunit can close.
- The next brick never begins while the current brick is incomplete.
