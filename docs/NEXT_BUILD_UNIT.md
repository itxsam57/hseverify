# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, Environments and CI/CD: **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation: **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations: **DONE — OWNER PASS — 9 August 2026**.
  - Subunit 1 Immutable Audit Foundation — **DONE — OWNER PASS**.
  - Subunit 2 Transactional Outbox and Deterministic Job Foundation — **DONE — OWNER PASS**.
  - Subunit 3 Persisted In-App Notifications and Role-Safe Deep Links — **DONE — OWNER PASS**.
  - Subunit 4 Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter — **DONE — OWNER PASS**.
  - Subunit 5 Complete M1.05 Isolation, Retry, Migration and Owner Acceptance — **DONE — OWNER PASS**.

## Phase 1 progress

**5 of 12 Milestone 1 bricks are DONE.**

## M1.05 final acceptance evidence

- Final implementation PR: `#45`
- Final validated PR head: `e581ec92400f47f06f66eb3ad17f912fa0d7982e`
- Final PR gate: `31321141113 / 93264217778` — **PASS**
- Implementation merge commit: `dada64848d683cde4359fdb02efe704f37332a2a`
- Merged-main gate: `31321380167 / 93264799262` — **PASS**
- Owner final command-line hard test: **PASS — 9 August 2026**
- Final acceptance record: `docs/testing/results/M1_05_FINAL_OWNER_ACCEPTANCE.md`

No unresolved release-blocking M1.05 defect remains.

## Current build gate

# M1.06 — SECURE STORAGE AND UPLOAD PIPELINE — READY TO BUILD

M1.06 is the only permitted implementation brick. M1.07 and later bricks remain blocked until M1.06 is formally accepted.

Canonical completion requirement: **PDF/image upload isolation, MIME/size checks, quarantine, scan adapter and signed preview.**

## M1.06 engineering objective

Build one secure, provider-neutral private-file foundation that later identity/evidence workflows can reuse without storing file bytes in the relational database or trusting browser-supplied storage/authorization metadata.

The accepted M1.06 pipeline must support PDF, PNG and JPG/JPEG where evidence allows. Extension, declared MIME, detected content signature, size and malware-scan state are independent controls. A file is unavailable to normal evidence consumers while quarantined or unsafe. Preview/download access is short-lived, authorized and private.

## Internal M1.06 subunits

1. **Secure File Domain, Metadata Schema and Private Object Storage Adapter — READY TO BUILD.**
2. Isolated Upload Intake, Validation and Quarantine — **BLOCKED** until Subunit 1 closes.
3. Durable Malware Scan Job and Local/Test Scanner Adapter — **BLOCKED** until Subunit 2 closes.
4. Authorized Signed Preview/Download Pipeline — **BLOCKED** until Subunit 3 closes.
5. Complete M1.06 Isolation, Migration, Recovery and Owner Acceptance — **BLOCKED** until Subunits 1–4 close.

## Current internal subunit

# Subunit 1 — Secure File Domain, Metadata Schema and Private Object Storage Adapter

**Status: READY TO BUILD**

Subunit 1 establishes storage authority only. It must not implement Worker identity/evidence forms from M1.07 or future qualification/experience/employment workflows.

## Required Subunit 1 boundary

1. Add one canonical secure-file metadata model with opaque file/object identifiers, server timestamps and explicit lifecycle vocabulary.
2. Store file bytes only through a private object-storage adapter; never put document/image bytes or base64 blobs in PostgreSQL/PGlite.
3. Use server-generated non-guessable object keys. Browser filename/path/storage-key input must never become storage authority.
4. Preserve the original user filename only as bounded display metadata after normalization; it must never control filesystem/object paths, content type or authorization.
5. Bind every file record to one trusted owner/scope model that can represent account/fixed-role and Company tenant/membership scope without pulling M1.07 business entities forward.
6. Define a strict lifecycle that can later represent upload intake, quarantine, scan pending, safe/available, rejected/unsafe and controlled failure without silently deleting history.
7. Keep file identity and immutable provenance separate from mutable processing state. Material state transitions must be auditable.
8. Add provider-neutral storage operations for write/read/stat/delete-or-retain behavior required by the lifecycle, but use only a deterministic local/test private adapter in this subunit.
9. The local/test adapter must remain server-only, private and unable to accept arbitrary absolute paths, traversal segments or browser-chosen storage roots.
10. File metadata/storage operations must be idempotent where retries can repeat the same accepted operation.
11. Enforce direct SQL recipient/tenant scope for file metadata reads; no global-read-then-JavaScript-filter pattern.
12. Cross-account, cross-role and cross-tenant copied file IDs must return non-enumerating denial.
13. Revoked/expired/inactive principals must lose current file access while durable file/audit history remains.
14. Integrate material file lifecycle events with the accepted M1.05 audit/outbox foundation rather than creating a second event/job system.
15. Add deterministic reversible migration(s) after `0010` with checksum, rollback/reapply and persistent close/reopen proof.
16. Add permanent unit/platform/concurrency/migration regressions for identifier opacity, path traversal, ownership isolation, tenant isolation, duplicate creation, immutable provenance and storage/metadata consistency.
17. Wire all new checks into the complete repository engineering gate before owner handoff.
18. Do not claim production object storage, malware scanning or signed preview in Subunit 1; those remain later M1.06 subunits.

## Planned later M1.06 boundary

### Subunit 2 — Isolated Upload Intake, Validation and Quarantine

- Independent upload field/request state; one upload cannot populate or finalize another.
- PDF, PNG and JPG/JPEG allow-list where the calling evidence type permits.
- Independent extension, declared MIME, detected signature/magic-byte and size validation.
- Reject mismatch/polyglot/unsupported/oversize/truncated inputs safely.
- Accepted bytes enter private quarantine only; quarantined files cannot be previewed as trusted evidence.
- Duplicate/replayed finalize calls cannot create multiple logical files.
- Upload failure preserves safe user-facing state and never leaves an authorized record pointing to missing/cross-linked bytes.

### Subunit 3 — Durable Malware Scan Job and Local/Test Scanner Adapter

- Malware scanning runs through the accepted transactional outbox/background worker.
- Scan status is durable; retry/backoff/terminal failure cannot corrupt the file record.
- Deterministic local/test scanner supports clean and malicious fixtures without live scanner credentials.
- Malicious/unsafe files remain blocked and historical facts remain auditable.
- Production scanner credentials/service remain disabled until explicit later integration activation.

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
- M1.06 becomes DONE only after exact-head PR gate, merge, merged-main gate, owner PASS and separate closure record.

## M1.06 inherited non-negotiable controls

- Large uploads belong in private object storage, never relational rows.
- Application/browser input never supplies decisive authorization, tenant, storage key, provider or executable handler authority.
- Server-side authorization and direct tenant predicates remain mandatory.
- No public bucket/object URLs.
- No preview/download before required safety state allows it.
- MIME, extension, size and malware state are independent checks; none substitutes for another.
- Never weaken M1.03 portal isolation, M1.04 tenant isolation or M1.05 audit/outbox/notification/email foundations.
- Slow/retryable scan/preview work uses durable background jobs where applicable.
- Every discovered defect becomes a permanent regression before the subunit can close.

## Explicitly blocked during M1.06

- Worker identity submission/liveness/Worker ID issuance from M1.07.
- Company verification from M1.08.
- Sites/departments/team from M1.09.
- Worker invitations/codes from M1.10.
- Qualification, experience, employment, skill and leaving-letter product workflows from M1.11.
- Public verification from M1.12.
- Assessment, review, interview, credential, billing and later milestone features.
- Live production malware-scanner credentials/service unless a later explicit integration gate activates them.

## Gate rule

M1.06 work must proceed one subunit at a time. No later M1.06 subunit is accepted merely because its schema/route exists. Each subunit requires its exact implementation gate, merged-main evidence and owner-visible testing only where a genuine visible behavior exists.
