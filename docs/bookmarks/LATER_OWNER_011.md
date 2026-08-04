# LATER-OWNER-011 — Worker failed-password lockout did not persist

Status: LOCKOUT AND PASSWORD RESET PASS — FINAL RECOVERY CHECKS PENDING

Reported: 4 August 2026

Lockout owner retest passed: 4 August 2026

Password reset and new-password sign-in passed: 4 August 2026

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

## Owner-confirmed results

After pulling merge commit `403056b85f52b7e2c656b0585b6ced50fdad140a`, the owner entered five incorrect Worker passwords and then submitted the correct password. The sixth request was rejected with the temporary-account-lock behavior. Failed-password counting and the fifth-attempt lock passed owner retest.

The owner then completed password recovery using the local sandbox key already configured in `.env.local`, reset the password and successfully signed in using the new password. This confirms the recovery flow cleared the account lock and accepted the replacement password.

A temporary sandbox-access denial during this test was caused by an incorrect key supplied in the test instruction, not by the application. Local sandbox tests must use the exact current `HSE_AUTH_SANDBOX_ACCESS_KEY` from `.env.local`; a hard-coded example key must not be assumed to match an existing owner environment.

## Remaining acceptance boundary

This record remains open until:

- the consumed recovery OTP or completed recovery flow cannot be reused;
- all sessions that existed before password reset are rejected;
- the old password fails.

M1.03 Section F remains in progress until these final recovery checks pass. M1.04 remains blocked.
