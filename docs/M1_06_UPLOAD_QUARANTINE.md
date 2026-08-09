# M1.06 Subunit 2 — Isolated Upload Intake, Validation and Quarantine

## Status

**VALIDATED — PENDING MERGED-MAIN ACCEPTANCE**

This subunit accepts bytes only for an already-authorized secure-file reservation, validates them independently from browser claims, writes them to the reservation's private object key, confirms the durable stored content, and atomically advances the file from `reserved` to `quarantined` with its first material secure-file audit fact.

It deliberately does **not** implement malware scanning, scan jobs, safe/available state, signed preview/download, Worker identity/evidence workflow, or M1.07+ product behavior.

## Accepted implementation boundary

- one server-only upload/quarantine service bound to the accepted M1.06 Subunit 1 secure-file authority;
- request/browser inputs are limited to untrusted bytes, original filename and declared MIME plus an opaque existing file reference;
- owner account, fixed role, Company tenant/membership, storage adapter, object key, detected MIME, byte size, SHA-256 and lifecycle state remain server/database authority;
- non-copyable trusted upload policy capability controls accepted content families and maximum size;
- platform hard ceiling is 25 MiB and the current default local/test evidence policy is 10 MiB;
- accepted families are PDF, PNG and JPEG (`.jpg` / `.jpeg` both map to `image/jpeg`);
- extension, declared MIME, detected content structure and size are separate checks and must agree;
- untrusted input bytes are copied before validation authority is issued, preventing caller mutation after validation;
- SHA-256 and byte size are computed server-side;
- PDF detection requires `%PDF-` at byte zero and a final terminal `%%EOF` boundary with only ASCII whitespace after it; earlier EOF markers are permitted for legitimate incremental revisions;
- PNG detection validates exact signature, chunk boundaries, per-chunk CRC32, semantic IHDR fields, IDAT ordering and exact terminal zero-length IEND;
- JPEG detection validates bounded marker segments, at least one valid SOF frame with non-zero dimensions, at least one valid SOS scan header, scan marker handling and exact terminal EOI;
- path-like filenames, unsupported extensions, declaration/content mismatches, truncation, impossible structures and trailing bytes fail closed;
- accepted bytes write only to the already server-derived private object key;
- same-key/same-bytes staging is idempotent while same-key/different-bytes replay fails closed;
- the stored object is statted again and its exact SHA-256/size must match the validated content before finalization authority is issued;
- staged bytes are intentionally retained when database finalization fails so an exact same-content retry can recover; blind cleanup cannot break the logical reservation;
- quarantine finalization revalidates live session/account/role and exact Company tenant/membership state transactionally;
- copied file IDs across accounts/roles/tenants return non-enumerating denial;
- database finalization locks the exact secure-file row and permits only `reserved -> quarantined`;
- file extension, declared MIME, detected MIME, byte size and SHA-256 become immutable validated content provenance once quarantined;
- successful quarantine and `secure_file.quarantined` audit insertion occur in the same database transaction;
- exact same-content repository replay returns the existing quarantine without creating a duplicate audit fact;
- conflicting replay cannot replace accepted bytes/provenance;
- a forced audit-insert failure rolls the file row back to `reserved`, proving there is no unaudited quarantine state;
- independent upload slots remain isolated even when display filenames are identical and finalization is concurrent;
- migration `0012_secure_file_upload_quarantine` adds only the immutable audit action/target vocabulary needed for this material lifecycle event;
- its rollback deliberately preserves the expanded audit vocabulary so accepted immutable history cannot become invalid;
- no outbox scanner job is created and no file reaches `scan_pending` or `available` in this subunit;
- no public URL, preview/download route, scanner service, browser upload UI or M1.07 evidence workflow is introduced.

## Regressions discovered and permanently protected

- `REG-039` — assert prohibited mutation outcome and retained provenance, not database trigger error ordering.
- `REG-040` — reject duplicate allowed-kind entries in trusted upload policies.
- `REG-041` — execute the real quarantine repository and prove metadata/audit atomic rollback.
- `REG-042` — accept legitimate incrementally updated PDFs by validating the final EOF boundary rather than requiring one historical EOF marker.
- `REG-043` — validate every PNG chunk CRC.
- `REG-044` — reject JPEG wrapper-only data; require an actual bounded frame and scan structure.
- `REG-045` — validate PNG IHDR semantics and IDAT ordering.

Detailed record: `docs/engineering/M1_06_SUBUNIT2_REGRESSIONS.md`.

## Automated validation evidence

- Accepted base main: `9fffd8e0bc479a19db6093052a219662c29ca7be`
- Implementation PR: `#49`
- Frozen validated behavioral head: `f18ed46e994c26912f71ce5d621f15125c7191ab`
- Full engineering run: `31331804583`
- Validation job: `93291157241`
- Result: **PASS**

The gate includes all accepted M1.01–M1.05 and M1.06 Subunit 1 regressions plus new source/security guards, upload-domain tests, real private-storage recovery tests, SQL scope/lifecycle tests, concurrent slot/finalization tests, migration rollback/reapply/persistence tests, real repository transaction/atomicity runtime tests, TypeScript, ESLint, runtime smoke and production build.

## Owner test decision

No owner/browser test is required for Subunit 2. This subunit adds no browser-visible upload route or UI, and inventing one solely for manual acceptance would violate the frozen brick boundary. The meaningful acceptance is the automated validation/storage/database security path.

## Remaining acceptance gate

1. Validation documentation must pass the full engineering gate on the exact final PR head.
2. PR #49 must merge without head drift.
3. The resulting exact merged-main commit must pass the complete engineering gate.
4. A separate documentation/governance closure PR must record Subunit 2 as DONE — ENGINEERING PASS and make M1.06 Subunit 3 the only next permitted implementation unit.
5. Subunit 3 remains blocked until that closure itself is green on merged `main`.
