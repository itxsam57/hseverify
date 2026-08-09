# Next Build Unit

## Accepted owner/engineering gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, Environments and CI/CD: **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation: **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations: **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Subunit 1 Secure File Domain, Metadata Schema and Private Object Storage Adapter: **DONE — ENGINEERING PASS — 9 August 2026**.

## Phase 1 progress

**5 of 12 Milestone 1 bricks are DONE.**

M1.06 remains **IN PROGRESS** until all five internal M1.06 subunits complete and the brick-level acceptance gate closes.

## M1.06 Subunit 1 final acceptance

Accepted evidence:

- Implementation pull request: `#47`
- Hardened implementation head: `80755684278365daabfc572990ddcf992e722434`
- Hardened implementation gate: `31326798669 / 93278355271` — **PASS**
- Exact final PR head: `aefc1283922e40d2f6e3bc375e45a8c5ce1693eb`
- Final PR gate: `31327013176 / 93278912641` — **PASS**
- Implementation merge: `e2c2a748fd7d3b168517809f04f0d7d19c206f34`
- Merged-main gate: `31327264168 / 93279514688` — **PASS**
- Owner/browser test: **NOT REQUIRED — no browser-visible workflow**
- Final acceptance record: `docs/testing/results/M1_06_SECURE_FILE_FOUNDATION_FINAL_ACCEPTANCE.md`

The accepted Subunit 1 boundary includes one canonical secure-file metadata authority, opaque server IDs/keys, exact principal/tenant scope, live authorization revalidation, immutable provenance, deterministic reservation idempotency, relational-byte exclusion, one fixed server-owned local/test private-object root, overwrite/traversal/symlink escape protection, owned migration rollback/reapply and persistent restart proof.

Permanent regressions `REG-036` through `REG-038` are protected. No unresolved release-blocking Subunit 1 defect remains.

## Current build gate

# M1.06 — SECURE STORAGE AND UPLOAD PIPELINE — IN PROGRESS

M1.06 is the only permitted Milestone 1 brick. M1.07 and later bricks remain blocked until M1.06 is formally accepted.

Canonical completion requirement: **PDF/image upload isolation, MIME/size checks, quarantine, scan adapter and signed preview.**

## M1.06 internal progress

1. Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS**.
2. Isolated Upload Intake, Validation and Quarantine — **READY TO BUILD**.
3. Durable Malware Scan Job and Local/Test Scanner Adapter — **BLOCKED** until Subunit 2 closes.
4. Authorized Signed Preview/Download Pipeline — **BLOCKED** until Subunit 3 closes.
5. Complete M1.06 Isolation, Migration, Recovery and Owner Acceptance — **BLOCKED** until Subunits 1–4 close.

## Current internal subunit

# Subunit 2 — Isolated Upload Intake, Validation and Quarantine

**Status: READY TO BUILD**

Subunit 2 must turn a trusted server-side secure-file reservation into a validated private quarantined object without claiming malware safety, preview eligibility or future Worker identity/evidence workflow completion.

## Required Subunit 2 boundary

1. Accept upload bytes only through a server-side intake service bound to a trusted authenticated principal and an existing secure-file reservation owned by that same current principal/scope.
2. Browser/request input may provide bytes, original filename and declared MIME as untrusted claims only; it must never supply owner, role, tenant, membership, storage root, object key, detected MIME, content hash, lifecycle result or executable/provider authority.
3. Use a non-copyable trusted upload-policy capability created by server code. The policy—not the browser—defines allowed content families and maximum byte size so later business workflows can reuse the foundation without hard-coding future M1.07 evidence semantics now.
4. Support PDF, PNG and JPG/JPEG where the trusted policy allows them.
5. Validate filename extension, declared MIME, server-detected content signature/magic bytes and byte size independently. None substitutes for another.
6. Normalize extension case safely; `.jpg` and `.jpeg` map to `image/jpeg`. Unsupported/no-extension/path-like filenames fail before storage finalization.
7. Detect PDF only from a valid PDF header and terminal EOF structure; reject truncated PDF or non-whitespace trailing payload after the accepted EOF boundary.
8. Detect PNG only from its exact signature and terminal IEND structure; reject truncated or trailing-content PNG.
9. Detect JPEG only from accepted SOI signature and terminal EOI marker; reject truncated or trailing-content JPEG.
10. Declared MIME, extension and detected MIME must agree with the trusted policy. Mismatch, unsupported type and ambiguous/invalid structure fail closed.
11. Enforce trusted maximum size before durable object write where possible; oversize inputs must never transition the metadata record to quarantined.
12. Compute server-side SHA-256 and byte size from the accepted bytes; never trust client-supplied hash/size.
13. Write accepted bytes only to the already server-derived private object key from Subunit 1. The upload path cannot select or replace another file's object key.
14. Keep the existing safe two-phase recovery model: a reserved metadata row may temporarily coexist with staged private bytes if a database finalization fails, but no normal consumer may treat that reservation as uploaded/quarantined evidence. A retry with the exact same bytes must be able to finish safely; different bytes for the same reserved object must fail closed.
15. Before metadata transition, stat/read back the private object as needed to prove its server hash/size match the validated bytes. Never mark a file quarantined while the referenced private object is missing or inconsistent.
16. Finalize `reserved -> quarantined` only through one server repository command that binds exact owner/role/Company scope and writes extension, declared MIME, detected MIME, byte size and SHA-256 once. Content provenance becomes immutable after quarantine under the accepted 0011 database trigger.
17. Duplicate/replayed finalize calls with the same accepted content must be idempotent and return the existing quarantined state; conflicting replays must fail non-enumerating without changing the object or provenance.
18. Independent reservations/fields must remain independent under concurrency. Uploading/finalizing one file must never populate, overwrite or advance another file record even when filenames are identical.
19. Record the first material file lifecycle audit fact only when bytes are successfully accepted into quarantine. Use the accepted M1.05 audit authority; do not create a second event store.
20. Do not enqueue a malware-scan job without an executable accepted handler. Subunit 3 owns scan-job vocabulary/handler/adapter and will atomically advance quarantined files into scan processing.
21. Quarantined files are private and unavailable as trusted evidence. Subunit 2 must not add public object URLs, preview/download authorization or mark files `available`.
22. On validation/storage/finalization failure, preserve a safe recoverable state. Never leave an `available` record, cross-linked object, silently changed provenance or false success response.
23. Cross-account, cross-role, cross-tenant, revoked-session and revoked-membership attempts must fail closed/non-enumerating before another principal's metadata or bytes can be finalized.
24. Add permanent regressions for independent upload slots, extension/MIME/signature mismatch, unsupported type, oversize, truncated structure, trailing-content/polyglot-style payloads, duplicate replay, conflicting replay, missing/inconsistent stored object, cross-file object substitution, copied IDs, tenant crossing and revoked authority.
25. Preserve deterministic migration compatibility. Add a new migration only if Subunit 2 needs owned durable schema/vocabulary; its rollback must not invalidate immutable accepted audit facts.
26. Wire all new source/unit/platform/concurrency/recovery checks into the complete repository engineering gate.
27. Owner/browser testing is required only if Subunit 2 introduces a genuine visible upload surface. Do not create a fake UI merely to manufacture an owner test.

## Explicitly blocked during Subunit 2

- Malware scanner execution/adapters and scan retry policy from Subunit 3.
- Marking a file safe/available based on malware status.
- Signed preview/download capability from Subunit 4.
- Worker identity submission/liveness/Worker ID issuance from M1.07.
- Company verification from M1.08.
- Sites/departments/team from M1.09.
- Worker invitations/codes from M1.10.
- Qualification, experience, employment, skill and leaving-letter product workflows from M1.11.
- Public verification from M1.12.
- Assessment, review, interview, credential, billing and later milestone features.
- Live production object-storage or malware-scanner credentials/provider activation.

## Planned later M1.06 boundary

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
- M1.06 becomes DONE only after exact-head PR gate, merge, merged-main gate, owner PASS where meaningful and separate closure record.

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

## Gate rule

M1.06 work proceeds one subunit at a time. Subunit 2 is complete only after its exact implementation head passes the complete engineering gate, merges without drift, merged `main` passes again, and any genuinely visible owner behavior is accepted. Until then Subunit 3 and M1.07+ remain blocked.
