# M1.06 Subunit 2 Regression Addendum

These stable IDs extend the HSE Verify regression register for defects discovered while building M1.06 Subunit 2. They remain permanent even if the upload/quarantine implementation is later refactored.

| ID | Defect prevented | Root cause | Required behaviour | Permanent automated guard | Status |
|---|---|---|---|---|---|
| REG-039 | A security regression test fails or passes based on which database trigger happens to reject a prohibited post-quarantine mutation first | The first quarantine platform test asserted the exact provenance-guard error text, but the accepted lifecycle guard correctly rejects an in-place quarantined-row update before the provenance-specific branch is reached | Tests must assert the security outcome: the mutation is rejected and the persisted lifecycle/hash/size remain unchanged. Trigger ordering or internal error wording is not part of the security contract | `tests/platform/secure-file-upload-quarantine.test.mjs` rejects the tamper then re-reads and proves the accepted hash/size/lifecycle are unchanged | PROTECTED |
| REG-040 | A trusted upload policy silently accepts duplicate content-kind declarations and canonicalizes them, hiding malformed policy construction | The initial policy constructor compared canonical unique kinds with `new Set(...).size`, which does not detect repeated identical input values | Trusted policy creation must fail closed when the caller supplies any duplicate allowed kind; accepted policies contain unique canonical kinds only | `secure-file-upload-domain.ts` checks set size against input length; `secure-file-upload-domain.test.mjs` rejects `['pdf','pdf']` | PROTECTED |

The central regression register should preserve these IDs when next consolidated.
