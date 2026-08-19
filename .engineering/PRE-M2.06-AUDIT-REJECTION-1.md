# PRE-M2.06 Audit Rejection 1 — Worker Registration Live Workflow

**Audit:** PRE-M2.06-AUDIT  
**Affected bricks:** M1.03 Authentication / Worker registration; M1.01 live runtime boundary  
**Classification:** `WORKFLOW_DEFECT` + `HTTP_ORIGIN_BOUNDARY_DEFECT`  
**Status:** FIXED, browser re-proven  

## Purpose that failed

A new Worker must be able to create an account, verify email OTP, verify phone OTP, activate the account, and then sign in. This is a visible two-step security workflow, so source-text/unit checks alone are insufficient.

## Reproduction evidence

### Initial browser RED

Retrospective Chromium workflow created a Worker and opened the correct sandbox email OTP, but submitting that valid OTP returned HTTP 403 from `/worker/register/verify/submit`.

Root cause: `isSameOriginRegistrationPost()` compared browser `Origin` only against `request.url.origin`. Next.js/reverse-proxy execution may expose an internal URL origin while the browser correctly uses the effective `Host`. Legitimate same-origin posts were therefore rejected.

### Revision 1

Commit `e03169d0241832d852bbbc70ee7b08c1725ee783` changed same-origin validation to require the browser Origin to match an allowed effective request origin derived from request URL / Host / forwarded Host+protocol. Foreign origins remain rejected.

Result: the email OTP POST changed from 403 to 303, proving the CSRF boundary was repaired. The flow still restarted after the redirect.

### Instrumented second RED

Run `32202880166` / job `95920153548` recorded:

- valid email OTP accepted;
- HttpOnly `hse_worker_registration` cookie still present;
- browser redirected to `http://localhost:3000/worker/register?reason=restart` even though the user journey began on `http://127.0.0.1:3000`.

The registration cookie is host-only. Redirect helpers used `new URL(path, request.url)`, so Next's internal `localhost` request URL changed browser origin and caused the cookie not to be sent on the redirected GET.

### Revision 2 — root boundary correction

Commits:

- `d902c9c7fd97595847983ef69eaee16c0244e3ec` — added `registrationRedirectUrl()` using the already-validated browser Origin/effective request host.
- `78af35a60e58ad681d2b6387358f7c6a2c97d096` — OTP submit redirects stay on browser origin.
- `b7370ded539d73e98ce020e4143d382b6904db4b` — OTP resend redirects stay on browser origin.
- `f833ac9584a00f27bd3fa49ff6d53a972033fe44` — permanent source guard forbids returning to `new URL(path, request.url)` for these flows.

## Browser GREEN

Phase‑1 retrospective browser run `32203067854`, job `95920710841` completed checkpoint **“Worker registration and contact verification”** successfully after Revision 2. The checkpoint requires:

1. visible Worker registration form;
2. sandbox email OTP retrieval;
3. valid email verification;
4. cookie continuity and same browser-origin continuation;
5. sandbox phone OTP retrieval;
6. valid phone verification;
7. visible Activation complete state;
8. Worker sign-in using the newly activated credentials.

No Playwright workaround or database seed replaced the owned user behavior.

## Permanent regression layers

- Real Chromium: `scripts/hard-browser-retrospective.mjs`.
- Source boundary guard: `tests/platform/worker-registration-owner-repair.test.mjs`.
- CSRF/effective-host helper remains server-side in `src/lib/http/registration-request.ts`.

## Gatekeeper status

This individual finding is `FIXED_AND_REPROVEN`, but the wider PRE-M2.06 retrospective audit remains open. M2.06 Task 3 production implementation stays paused until the full audit receives Gatekeeper ACCEPT.
