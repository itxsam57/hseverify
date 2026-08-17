# HSE Verify — Project Test Matrix

Status vocabulary: `PASS`, `FAIL`, `BLOCKED`, `NOT CONFIGURED`, `READY TO BUILD`, `IN PROGRESS`, `OWNER ACCEPTANCE DEFERRED`, `NOT APPLICABLE`.

| Feature ID | Feature/workflow | Automated evidence | Manual | Status |
|---|---|---|---|---|
| TM-001 | Clean install/environment separation | Locked install + environment validator | None | PASS |
| TM-002 | Deterministic migration ledger | Apply/checksum/rollback/reapply | None | PASS |
| TM-003 | Worker email/phone OTP registration | Auth/runtime/concurrency | When changed | PASS |
| TM-004 | Worker login/lockout/recovery | Auth runtime | When changed | PASS |
| TM-005 | Staff invitation and mandatory TOTP | Invitation/enrollment/TOTP/replay | When changed | PASS |
| TM-006 | Opaque sessions/revocation | Session runtime | When changed | PASS |
| TM-007 | Fixed-role portal isolation | Six-role matrix | When changed | PASS |
| TM-008 | Platform permission matrix | Exhaustive policy tests | None | PASS |
| TM-009 | Company tenant context | Membership/session SQL | When changed | PASS |
| TM-010 | Tenant-owned repository scope | SQL scope/concurrency | When visible | PASS |
| TM-010A | Protected Company tenant-scope demonstration | Real CRUD | Accepted | PASS |
| TM-010B | M1.04 final isolation | Final role/migration suites | Accepted | PASS |
| TM-011–TM-025 | Profile, design, runtime, CI, audit, outbox, notifications and email foundations | Permanent accepted gates | As applicable | PASS |
| TM-026 | Secure file foundation | Domain/repository/migration | None | PASS |
| TM-026A | Upload/quarantine | Validation/runtime/concurrency | None | PASS |
| TM-026B | Malware scan foundation | Runtime/retry/reclaim | Live scanner not configured | PASS |
| TM-026C | Authorized signed preview/download | Signed access/runtime/migration | None | PASS |
| TM-026D | Complete M1.06 cumulative isolation/migration/recovery acceptance | `check:m1-06-final` + cumulative runtime | None | PASS |
| TM-027 | Worker Identity Engine and permanent Worker ID | M1.07 cumulative suites REG-073–079 | `/worker/identity` owner PASS 11 Aug 2026 | PASS |
| TM-028 | Company registration/verification | Exact head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`, gate `31476983323`; merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`, merged-main gate `31483852831` | Combined Milestone 1 test | OWNER ACCEPTANCE DEFERRED |
| TM-029 | Sites/departments/Company Team | Exact head `32130f82b661b86d7ad08f5dad7a368346cfe13d`, gate `31569523799`; merge `1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf`, merged-main gate `31569898065` | Combined Milestone 1 test | OWNER ACCEPTANCE DEFERRED |
| TM-029A | Worker invitations/Company codes/Company↔Worker linking | Exact head `9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725`, targeted gate `31971156192`, full gate `31971157867`; merge `3b32287fecb30f16d682cb130be0e8f1eb466616`, merged-main gate `31971506738` | Combined Milestone 1 test | OWNER ACCEPTANCE DEFERRED |
| TM-030 | Employment/experience/qualification/skill/leaving records | M1.11 permanent source/runtime/migration/file-binding/lifecycle suites | Combined Milestone 1 test | IN PROGRESS |
| TM-031 | Public verification foundation | Future M1.12 | Combined Milestone 1 test | BLOCKED |
| TM-032 | Randomized MCQ/written assessment + durable recovery | Future M2 | Later | BLOCKED |
| TM-033 | Evidence review/interview/decision/appeal | Future M2 | Later | BLOCKED |
| TM-034 | Credentials/living record/share links | Future M3 | Later | BLOCKED |
| TM-035 | Payments/subscriptions/payout/webhooks | Future M3 | Later | BLOCKED |
| TM-036 | Production providers/load/security/recovery launch | Future M3.10–M3.12 | Certification | BLOCKED |

## Current acceptance semantics

M1.08, M1.09 and M1.10 have engineering acceptance but **not owner/browser PASS**. The owner explicitly requested one combined Milestone 1 browser test after M1.12 is engineering-green, so TM-028, TM-029 and TM-029A remain `OWNER ACCEPTANCE DEFERRED`.

TM-030 is the only active test target. M1.11 must permanently prove:
- exact Worker ownership and non-enumerating copied-ID failures;
- integrated qualification metadata plus primary-certificate binding and submission readiness;
- multiple independent experience/employment records without overwrite;
- immutable submitted versions and safe optimistic revisions;
- cross-form and cross-record file isolation through the accepted M1.06 secure-file lifecycle;
- terminal employment/skill lifecycle guards and preserved history;
- distinct skill assurance states without Worker self-promotion;
- leaving letters scoped to the exact ended employment/version with replacement lineage;
- material transactional audit with the true Worker actor;
- migration restart/rollback/reapply compatibility and no hard lower-brick ownership;
- no M1.12/M2 business implementation leakage.

M1.12+ remain blocked until TM-030 passes exact-head and merged-main engineering release gates. There is no intermediate browser acceptance stop under the current owner instruction.

## Test quality rules

Never weaken expected values to bless a defect. No skipped required tests, empty assertions or mocks of the exact security boundary under test. Security must be proven at server/database authority boundaries. Production credentials/data are never used in automated tests. Local/sandbox adapters are not live providers.