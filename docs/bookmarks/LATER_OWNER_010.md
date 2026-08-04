# LATER-OWNER-010 — Worker OTP submission and registration density

Status: THIRD REPAIR IMPLEMENTED — OWNER RETEST PENDING

Reported: 3 August 2026

Failed owner retests: 4 August 2026

Area: M1.03 Worker registration and mandatory dual OTP owner test.

## Owner-observed defects

1. A retrieved verification code was submitted but the page did not accept or advance it.
2. Registration controls did not appear as one aligned shape.
3. Phone/password guidance and surrounding descriptions were visually overwhelming for a basic registration step.

## Confirmed owner results

- The one-column registration layout passed.
- The original client-action OTP path failed.
- The challenge-bound POST path reached the server but returned: `Verification could not be completed. Try the latest code again.`
- Therefore this record remains open and neither earlier OTP repair is accepted.

## Third root-cause finding

The challenge-bound POST route wrapped the registration-domain verification, request-context lookup, cache invalidation and redirect creation inside one broad catch block. Any unexpected error after a successful database transition could therefore be misreported as an OTP failure. The verification page is already `force-dynamic`, so `revalidatePath` was unnecessary. The route also used the server-action header accessor even though the concrete `Request` object was already available.

## Third implemented repair

- remove `revalidatePath` from OTP verification and resend routes;
- use a normal POST + 303 GET with `Cache-Control: no-store` to read committed database state;
- separate server-action fingerprinting from route-handler fingerprinting;
- read route fingerprints directly from the submitted `Request` headers;
- keep only expected `RegistrationServiceError` failures inside the user-facing OTP error boundary;
- allow unexpected database or invariant failures to reach the server error log instead of disguising them as a retryable code error;
- preserve exact challenge binding, same-origin validation, dual verification and the accepted one-column layout;
- add `BUILD-PIN AUTH-REG-OTP-ERROR-BOUNDARY` and regression tests preventing broad catch and cache invalidation from returning.

## Acceptance boundary

This record remains open until:

- focused automated validation passes;
- full `npm run check` passes;
- the owner starts a completely fresh Worker registration;
- the owner completes both email and phone OTP stages successfully;
- the registration page remains usable at desktop and mobile width;
- Git remains clean after shutdown.
