# LATER-OWNER-011 — Worker failed-password lockout did not persist

Status: LOCKOUT RETEST PASS — PASSWORD RECOVERY RETEST PENDING

Reported: 4 August 2026

Lockout owner retest passed: 4 August 2026

Area: M1.03 Section F — Worker lockout and password recovery.

## Owner-observed failure

The owner entered an incorrect Worker password five times. On the sixth attempt, the correct password was accepted and the Worker signed in instead of receiving the temporary-lock message.

## Reproduced root cause

The lockout repository update assigned an ISO timestamp parameter through a SQL `CASE` expression into `auth_accounts.locked_until`, which is a `TIMESTAMPTZ` column. PostgreSQL/PGlite rejected the statement with error `42804` because the expression resolved as text. Each failed-password transaction therefore rolled back, leaving `failed_sign_in_count` unchanged and the account active.

The same audit found an equivalent untyped timestamp `CASE` in OTP terminal-attempt invalidation for `auth_otp_challenges.invalidated_at`.

## Implemented repair

- cast the lock timestamp branch to `timestamptz`;
- type the lockout null branch as `NULL::timestamptz`;
- cast the failed-attempt `updated_at` value to `timestamptz`;
- cast the OTP terminal invalidation timestamp to `timestamptz`;
- add `tests/platform/authentication-failure-state-sql.test.mjs`;
- execute attempts 1 through 5 against migrated PGlite;
- assert attempts 1–4 stay active with no lock timestamp;
- assert attempt 5 persists `account_status = 'locked'`, count 5 and the lock expiry;
- assert a sixth active-account failure update affects zero rows;
- assert clearing lockout resets count, status and timestamp;
- assert OTP failure attempts persist and the final attempt writes `invalidated_at`;
- include the new regression in `test:auth-completion` and the full `npm run check` gate.

## Owner-confirmed lockout result

After pulling merge commit `403056b85f52b7e2c656b0585b6ced50fdad140a`, the owner entered five incorrect Worker passwords and then submitted the correct password. The sixth request was rejected with the temporary-account-lock behavior. Failed-password counting and the fifth-attempt lock therefore passed owner retest.

## Remaining acceptance boundary

This record remains open until:

- password recovery clears the lock;
- the recovery OTP is accepted only once;
- all existing sessions are revoked by the reset;
- the new password signs in;
- the old password fails.

M1.03 Section F remains in progress until the complete recovery retest passes. M1.04 remains blocked.
