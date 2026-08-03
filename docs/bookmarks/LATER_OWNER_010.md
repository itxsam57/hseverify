# LATER-OWNER-010 — Worker OTP submission and registration density

Status: FIX IMPLEMENTED — OWNER RETEST PENDING

Reported: 3 August 2026

Area: M1.03 Worker registration and mandatory dual OTP owner test.

## Owner-observed defects

1. A retrieved verification code was submitted but the page appeared not to accept or advance it.
2. Registration controls did not appear as one aligned shape.
3. Phone/password guidance and surrounding descriptions were visually overwhelming for a basic registration step.

## Root-cause finding

The OTP server action redirected back to the same `/worker/register/verify` URL after a successful state transition. The App Router could preserve the existing client form on that same route, making a successful email-to-phone transition appear as though the valid code was rejected.

## Implemented repair

- successful OTP verification now revalidates the page and redirects to a stage-changing URL;
- the verification form is keyed by the database-backed step so it remounts cleanly;
- registration fields are presented in one aligned column;
- repeated explanatory lists and dense verification cards were removed;
- editable registration wording was moved to `src/config/product-copy.ts`;
- `BUILD-PIN AUTH-REG-VERIFY-REFRESH` identifies the protected transition;
- `docs/engineering/HSE_BUILD_MEMORY.md` records the backbone-first, adapter-ready and code-bookmark rules.

## Acceptance boundary

This record remains open until:

- focused automated validation passes;
- full `npm run check` passes;
- the owner repeats Worker email and phone OTP registration successfully;
- the registration page is usable at desktop and mobile width;
- Git remains clean after shutdown.
