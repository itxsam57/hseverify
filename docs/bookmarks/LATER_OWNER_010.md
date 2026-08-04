# LATER-OWNER-010 — Worker OTP submission and registration density

Status: SECOND REPAIR IMPLEMENTED — OWNER RETEST PENDING

Reported: 3 August 2026

Failed owner retest: 4 August 2026

Area: M1.03 Worker registration and mandatory dual OTP owner test.

## Owner-observed defects

1. A retrieved verification code was submitted but the page did not accept or advance it.
2. Registration controls did not appear as one aligned shape.
3. Phone/password guidance and surrounding descriptions were visually overwhelming for a basic registration step.

## Owner retest result

The one-column registration layout passed. OTP verification still failed. Therefore the first diagnosis was incomplete and this record remained open.

## Corrected root-cause finding

The first repair changed the URL after a successful server action, but it left the fragile submission mechanism in place. The OTP form still sent only six digits through client action state, while the server selected whichever active challenge it considered latest. The automated repair test only inspected source markers and never proved a browser-standard OTP POST boundary.

## Second implemented repair

- OTP verification now uses a normal same-origin HTML POST to `/worker/register/verify/submit`;
- resend now uses a normal POST to `/worker/register/verify/resend` and reloads database state;
- the rendered form carries the exact opaque challenge ID that was current when the page loaded;
- the POST route rejects missing, malformed or stale challenge IDs before verification;
- successful verification uses a 303 redirect to the email, phone or completion stage;
- safe query-state messages explain invalid, stale, expired and resent-code conditions;
- request fingerprinting and same-origin validation are centralized in `src/lib/http/registration-request.ts`;
- `BUILD-PIN AUTH-REG-OTP-POST` protects the new backbone boundary;
- the previous client OTP actions were removed rather than retained as dead duplicate code;
- permanent tests now require the POST routes, hidden challenge binding and absence of the failed client-action path.

## Acceptance boundary

This record remains open until:

- focused automated validation passes;
- full `npm run check` passes;
- the owner starts a completely fresh Worker registration;
- the owner completes both email and phone OTP stages successfully;
- the registration page remains usable at desktop and mobile width;
- Git remains clean after shutdown.
