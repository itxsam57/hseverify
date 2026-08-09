# M1.06 Subunit 3 Regression Addendum

These stable IDs extend the HSE Verify regression register for defects discovered while building M1.06 Subunit 3. They remain permanent even if the malware-scan implementation is later refactored.

| ID | Defect prevented | Root cause | Required behaviour | Permanent automated guard | Status |
|---|---|---|---|---|---|
| REG-046 | A scan handler and terminal outbox recovery acquire the same two rows in opposite order, creating an avoidable database deadlock and allowing copied lease fields to masquerade as trusted worker authority | The first handler repository draft locked the secure-file row and only then checked/locked the outbox lease, while the outbox terminal-failure transaction necessarily locks the outbox row before its recovery trigger updates the linked secure file; the draft also structurally compared lease fields without proving the lease object came from the accepted worker authority | Every handler load/finalize path must require the non-copyable trusted outbox lease capability and must acquire/validate the outbox lease row before locking the secure-file row. Terminal-failure recovery and normal handler finalization therefore use the same outbox→file lock order, and forged copied lease objects fail before mutation | `scripts/check-secure-file-scan.mjs` asserts trusted-lease use and outbox-before-file source order; Subunit 3 runtime tests execute active/stale/reclaimed lease behavior and terminal recovery | PROTECTED |

Additional defects discovered by CI or self-review must receive the next stable regression ID before Subunit 3 can close.
