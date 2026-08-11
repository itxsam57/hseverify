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
| TM-028 | Company registration/verification | Exact head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`, gate `31476983323`; merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`, merged-main gate `31483852831` | Combined with M1.09 by owner instruction | OWNER ACCEPTANCE DEFERRED |
| TM-029 | Sites/departments/Company Team | M1.09 PR #75; permanent runtime/source coverage required before merge | Combined M1.08 + M1.09 test after merged-main green | IN PROGRESS |
| TM-030 | Employment/experience/qualification/skill/leaving records | Future M1.11 | Later | BLOCKED |
| TM-031 | Public verification foundation | Future M1.12 | Later | BLOCKED |
| TM-032 | Randomized MCQ/written assessment + durable recovery | Future M2 | Later | BLOCKED |
| TM-033 | Evidence review/interview/decision/appeal | Future M2 | Later | BLOCKED |
| TM-034 | Credentials/living record/share links | Future M3 | Later | BLOCKED |
| TM-035 | Payments/subscriptions/payout/webhooks | Future M3 | Later | BLOCKED |
| TM-036 | Production providers/load/security/recovery launch | Future M3.10–M3.12 | Certification | BLOCKED |

## Current acceptance semantics

M1.08 has engineering acceptance but **not owner/browser PASS**. The owner explicitly requested that M1.08 and M1.09 be tested together, so TM-028 remains `OWNER ACCEPTANCE DEFERRED` until that combined test succeeds.

TM-029 is the only active test target. It must permanently prove:
- exact tenant isolation for Sites, Departments and Company Team;
- safe archive ends active assignments and preserves historical assignment rows;
- archived units reject active assignments and restore does not resurrect ended assignments;
- Company Team stays separate from Worker directory/business invitation flow;
- existing staff password/TOTP enrollment activates a Company membership only after successful MFA;
- cross-tenant unit bindings fail;
- role grant matrix is enforced;
- an inviter cannot grant a permission removed from their own live authority;
- omitted target permissions become deny overrides;
- visible actions do not rely on refresh-only state.

M1.10+ remain blocked until TM-029 passes engineering release gates and the combined owner test closes TM-028 + TM-029.

## Test quality rules

Never weaken expected values to bless a defect. No skipped required tests, empty assertions or mocks of the exact security boundary under test. Security must be proven at server/database authority boundaries. Production credentials/data are never used in automated tests. Local/sandbox adapters are not live providers.
