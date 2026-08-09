# Next Build Unit

## Accepted owner/engineering gates

- Worker Dashboard and Worker Profile vertical slice — **PASS — 2 August 2026**.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Subunit 1 Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS — 9 August 2026**.
- M1.06 Subunit 2 Isolated Upload Intake, Validation and Quarantine — **DONE — ENGINEERING PASS — 9 August 2026**.

## Phase 1 progress

**5 of 12 Milestone 1 bricks are DONE.**

M1.06 remains **IN PROGRESS**. It is not a completed Milestone 1 brick until all five internal subunits and the brick-level acceptance gate close.

## M1.06 Subunit 2 final acceptance

Accepted evidence:

- Implementation PR: `#49`
- Accepted base main: `9fffd8e0bc479a19db6093052a219662c29ca7be`
- Frozen validated behavioral head: `f18ed46e994c26912f71ce5d621f15125c7191ab`
- Behavioral engineering gate: `31331804583 / 93291157241` — **PASS**
- Exact final PR head: `2c565d853719e4e53cad3a81ffb6caf9691a0292`
- Final PR gate: `31332058088 / 93291788050` — **PASS**
- Implementation merge: `7803dd66599edd88fc9b396447d235246badff90`
- Merged-main gate: `31332280267 / 93292321486` — **PASS**
- Owner/browser test: **NOT REQUIRED — no browser-visible workflow**
- Validation record: `docs/testing/results/M1_06_UPLOAD_QUARANTINE_VALIDATED.md`
- Final acceptance record: `docs/testing/results/M1_06_UPLOAD_QUARANTINE_FINAL_ACCEPTANCE.md`

The accepted Subunit 2 boundary includes trusted server upload policy, independent extension/declared-MIME/detected-structure/size controls, PDF/PNG/JPEG structural validation, server SHA-256 and size, exact private object-key binding, staged-byte retry recovery, stored-content revalidation, exact role/tenant isolation, concurrent upload-slot isolation and atomic `reserved -> quarantined` plus material audit persistence.

Permanent regressions `REG-039` through `REG-045` are protected. No unresolved release-blocking Subunit 2 defect remains.

## Current build gate

# M1.06 — SECURE STORAGE AND UPLOAD PIPELINE — IN PROGRESS

M1.06 remains the only permitted Milestone 1 brick. M1.07 and later bricks remain blocked until M1.06 is formally accepted.

Canonical completion requirement: **PDF/image upload isolation, MIME/size checks, quarantine, scan adapter and signed preview.**

## M1.06 internal progress

1. Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS**.
2. Isolated Upload Intake, Validation and Quarantine — **DONE — ENGINEERING PASS**.
3. **Durable Malware Scan Job and Local/Test Scanner Adapter — READY TO BUILD.**
4. Authorized Signed Preview/Download Pipeline — **BLOCKED** until Subunit 3 closes.
5. Complete M1.06 Isolation, Migration, Recovery and Owner Acceptance — **BLOCKED** until Subunits 1–4 close.

## Current internal subunit

# Subunit 3 — Durable Malware Scan Job and Local/Test Scanner Adapter

**Status: READY TO BUILD**

Subunit 3 must turn a private quarantined file into a durably scanned state through the already accepted M1.05 transactional outbox/worker. It must not add preview/download authorization, Worker identity/evidence workflow, or production scanner credentials.

## Required Subunit 3 boundary

1. Reuse the accepted M1.05 transactional outbox/background-worker architecture. Do not create a second queue, scheduler, retry system or handler loader.
2. Add one fixed server-registered secure-file scan job type and schema version. Browser/request input must never select the job type, handler module, provider, URL, executable code, tenant or object key.
3. Queue scanning only for an exact existing `quarantined` secure file whose stored provenance is already accepted. A reserved, unsafe, available or unrelated file must not be silently reinterpreted as a new scan request.
4. Atomically bind the file to scan processing: the required file lifecycle transition, outbox enqueue and material audit fact must commit together or all roll back. No `scan_pending` row may exist without the durable work needed to process it.
5. Use server-derived idempotency keyed to the exact secure-file identity/content provenance so repeated equivalent scheduling cannot create duplicate logical scan work.
6. Preserve exact account/role/Company tenant and membership snapshots needed for audit/isolation. Cross-account, cross-role and cross-tenant copied IDs must never allow another principal to schedule or inspect another file's scan state.
7. The worker handler must be fixed in the server handler registry. It must accept only the trusted validated job payload; no dynamic module, SQL, URL, command or provider selection from persisted/browser payloads.
8. Before scanning, load the exact private object through the accepted private-storage adapter and prove its current size/SHA-256 still match the immutable quarantined provenance. Missing or inconsistent bytes must fail closed and must never become `available`.
9. Define one provider-neutral malware scanner interface whose result vocabulary is bounded and deterministic. The scanner adapter must not directly mutate database lifecycle state.
10. Implement only a deterministic `local_test` scanner adapter in this subunit. Production scanner credentials/service remain disabled until a later explicit integration activation gate.
11. The local/test adapter must support deterministic clean, malicious and retryable/controlled-failure fixtures without network access or live credentials. Fixture selection must be server/test authority, not browser-selected production behavior.
12. A clean accepted result may advance `scan_pending -> available` only through one guarded repository transaction that re-locks the exact file and validates the expected immutable content provenance.
13. A malicious result must advance `scan_pending -> unsafe`; the private object/history remain retained and unavailable to normal consumers.
14. A controlled scanner/provider failure must preserve a recoverable durable state. Retryable execution uses the accepted outbox retry/backoff/lease rules; exhaustion/terminal processing must not corrupt or falsely approve the file.
15. Where the lifecycle uses `scan_failed`, only the accepted transition graph may be used: `scan_pending -> scan_failed` and a controlled retry may return `scan_failed -> scan_pending`. No arbitrary status rewrite is permitted.
16. Worker lease expiry/reclaim and at-least-once execution must be safe. A stale worker completion cannot overwrite a newer valid scan decision.
17. Equivalent re-execution after the file already reached its accepted final scan result must be idempotent and must not duplicate material audit facts or reverse clean/malicious history.
18. Every material scan transition/result must use the accepted immutable platform audit authority. Do not create a scanner-specific event store.
19. Scan attempt/job/audit history must remain durable under retry, terminal failure, migration rollback/reapply and PGlite close/reopen.
20. Clean/unsafe/failed states must remain private. Subunit 3 must not add signed preview/download tokens, public object URLs or reviewer-facing file routes; Subunit 4 owns authorized preview/download.
21. Add permanent unit/platform/runtime/concurrency/migration regressions for duplicate scheduling, exact-content binding, missing/tampered object, clean result, malicious result, retry/backoff, terminal failure, lease reclaim/stale completion, cross-scope denial, idempotent replay and no false `available` state.
22. Preserve all accepted M1.01–M1.06 Subunit 2 behavior and wire every new check into the complete repository engineering gate.
23. Owner/browser testing is required only if a genuine visible scanner surface is introduced. Do not create a fake UI merely to manufacture a manual test.

## Explicitly blocked during Subunit 3

- Signed preview/download capability and tokens from Subunit 4.
- Public/private evidence viewing routes that depend on signed download authorization.
- Worker identity submission/liveness/Worker ID issuance from M1.07.
- Company verification from M1.08.
- Sites/departments/team from M1.09.
- Worker invitations/codes from M1.10.
- Qualification, experience, employment, skill and leaving-letter product workflows from M1.11.
- Public verification from M1.12.
- Assessment, review, interview, credential, billing and later milestone features.
- Live production malware-scanner credentials/service or browser-selectable scanner providers.

## Planned later M1.06 boundary

### Subunit 4 — Authorized Signed Preview/Download Pipeline

- Only safe/available files can receive preview/download authorization.
- Short-lived signed authorization binds exact file, purpose and authorized principal/scope.
- Expired, tampered, wrong-role, wrong-account, wrong-tenant and revoked-session access fails closed and non-enumerating.
- Signed URL/token reuse and expiry have permanent regressions.
- PDF/image preview/download response uses safe content headers, no public object URL and no browser-selected content type/path.
- Reviewer-facing identity/evidence workflow remains M1.07/M2.02; M1.06 supplies the secure file preview capability only.

### Subunit 5 — Complete M1.06 Acceptance

- Combined upload/storage/scan/preview isolation and recovery suite.
- Persistent metadata/object consistency and migration proof.
- Malicious upload, path traversal, content mismatch, copied-ID and signed-link abuse regressions.
- Exact owner handoff only for genuinely visible/local-test behavior.
- M1.06 becomes DONE only after exact-head PR gate, merge, merged-main gate, owner PASS where meaningful and separate closure record.

## M1.06 inherited non-negotiable controls

- Large uploads belong in private object storage, never relational rows.
- Application/browser input never supplies decisive authorization, tenant, storage key, provider or executable handler authority.
- Server-side authorization and direct tenant predicates remain mandatory.
- No public bucket/object URLs.
- No preview/download before required safety state allows it.
- MIME, extension, size and malware state are independent checks; none substitutes for another.
- Never weaken M1.03 portal isolation, M1.04 tenant isolation or M1.05 audit/outbox/notification/email foundations.
- Slow/retryable scan work uses the accepted durable background worker and bounded retry rules.
- Every discovered defect becomes a permanent regression before the subunit can close.

## Gate rule

M1.06 work proceeds one subunit at a time. Subunit 3 is complete only after its exact implementation head passes the complete engineering gate, merges without drift, merged `main` passes again, and any genuinely visible owner behavior is accepted. Until then Subunit 4 and M1.07+ remain blocked.
