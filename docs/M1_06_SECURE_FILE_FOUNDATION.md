# M1.06 Subunit 1 — Secure File Domain, Metadata Schema and Private Object Storage Adapter

## Status

**VALIDATED — PENDING MERGED-MAIN ACCEPTANCE**

This subunit establishes the secure-file metadata and private object-storage authority required by M1.06. It deliberately does not implement upload intake, content-signature/MIME validation, quarantine finalization, malware scanning, signed preview/download or Worker identity/evidence workflows.

## Accepted implementation boundary

- one canonical `platform_secure_files` metadata store introduced by migration `0011_secure_file_foundation`;
- opaque server-generated secure-file IDs, server-derived reservation keys and server-derived fixed-root object keys;
- no file bytes, base64 payloads or object bodies in relational storage;
- exact account/fixed-role ownership plus Company tenant/membership scope;
- live session revalidation and live Company membership/tenant revalidation before metadata access;
- direct owner/role/tenant/membership SQL predicates with non-enumerating copied-ID denial;
- immutable file identity, ownership, display metadata and storage provenance;
- explicit lifecycle vocabulary reserved for later M1.06 processing: `reserved`, `quarantined`, `scan_pending`, `available`, `unsafe`, `scan_failed`;
- database-enforced lifecycle transition and content-provenance invariants;
- idempotent logical reservation under retry/concurrency;
- provider-neutral private object-storage interface with one accepted `local_test` adapter;
- application storage root fixed to `.data/private-objects` beneath server authority;
- exact opaque object-key allow-list, no public URLs/network storage, no arbitrary roots or browser-selected paths;
- same-key/same-bytes object writes are idempotent; same-key/different-bytes writes fail closed;
- symlink directory/object escapes rejected before outside directory creation or object access;
- deterministic owned migration rollback/reapply and persistent PGlite close/reopen proof;
- full repository engineering gate coverage.

## Deliberate scope boundary

Subunit 1 reserves metadata/storage authority only. A reservation is not a successful upload and does not create a material evidence/audit event. Material file lifecycle audit/outbox integration begins only when Subunit 2 actually accepts validated bytes into quarantine. This avoids falsely recording evidence work that has not happened.

## Regressions discovered and protected

- `REG-036` — metadata-only reservation must not prematurely mutate accepted M1.05 audit/outbox vocabulary.
- `REG-037` — application callers must not choose their own trusted local-storage base/root.
- `REG-038` — lexical path containment is insufficient; symbolic-link paths/objects must fail closed before any escaped write side effect.
- inherited `REG-027` — accepted migration tests must remain forward-compatible when later migrations are added.
- inherited `REG-033` — tests must use valid lower-layer SHA-256 fixtures rather than weakening database constraints.
- inherited `REG-035` — source guards assert security semantics rather than guessed source spelling.

Detailed regression record: `docs/engineering/M1_06_SUBUNIT1_REGRESSIONS.md`.

## Validation evidence

- Accepted base main: `e3b80934012b6f473945e59eff5d902ef14cc190`
- Draft implementation PR: `#47`
- Hardened validated implementation head: `80755684278365daabfc572990ddcf992e722434`
- Engineering run: `31326798669`
- Validation job: `93278355271`
- Result: **PASS**

The full gate includes source/security contracts, secure-file unit tests, storage adapter tests, metadata isolation tests, duplicate/concurrency tests, migration rollback/reapply, persistent restart proof, all accepted M1.01–M1.05 regressions, TypeScript, ESLint, development/runtime smoke and production build.

## Owner test decision

No owner/browser test is required for Subunit 1 because it adds no browser-visible workflow. Asking the owner to click an unrelated existing screen would not validate the storage authority implemented here.

## Remaining acceptance gate

1. This implementation PR must pass the full engineering gate again on its exact final documentation head.
2. The PR must merge without head drift.
3. The exact merged-main commit must pass the complete engineering gate.
4. Only then may Subunit 1 be marked DONE and M1.06 Subunit 2 — Isolated Upload Intake, Validation and Quarantine — become READY TO BUILD.
