# M1.06 Subunit 1 Regression Addendum

These stable IDs extend `docs/engineering/REGRESSION-REGISTER.md` for defects discovered while building the M1.06 secure-file storage authority foundation. They must remain protected even if this subunit is later refactored.

| ID | Defect prevented | Root cause | Expected behaviour | Permanent automated guard | Status |
|---|---|---|---|---|---|
| REG-036 | A metadata-only file reservation changes M1.05 audit/outbox vocabulary before any bytes have been accepted or quarantined | The first 0011 draft treated reserving a future object slot as a material evidence lifecycle event and prematurely coupled Subunit 1 to later upload semantics | Subunit 1 owns only secure-file metadata/storage authority; migration 0011 and its rollback do not alter `platform_audit_events` or `platform_outbox_jobs`. Material file audit/job vocabulary begins only with the later subunit that actually accepts/processes bytes | `check-secure-file-foundation.mjs` explicitly rejects M1.05 audit/outbox mutation in migration 0011 and rollback | PROTECTED |
| REG-037 | Application code can choose its own “trusted” local storage base and thereby turn an arbitrary filesystem path into storage authority | The first server wrapper re-exported the low-level `LocalTestPrivateObjectStorage` constructor, including its caller-supplied trusted base | Application code receives only a server-only factory pinned to `process.cwd()` with a relative non-traversing root; direct imports of the low-level storage core from application source are rejected | `check-secure-file-foundation.mjs`; `private-object-storage.test.mjs` root/traversal cases | PROTECTED |

The central register should preserve these IDs when it is next consolidated; this addendum is already part of the permanent engineering gate evidence for M1.06 Subunit 1.
