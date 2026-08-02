# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**
- **M1.02 Design System and Global UX: PASSED — 2 August 2026**
- **M1.03 authentication security foundation: PASSED — 2 August 2026**

## Phase 1 progress

**2 of 12 bricks are DONE.**

M1.01 and M1.02 are complete bricks. The first internal subunit of M1.03 is owner-accepted, but M1.03 remains IN PROGRESS.

## Current build gate

**M1.03 — AUTHENTICATION AND PORTAL ISOLATION — IN PROGRESS**

M1.03 is the only permitted implementation brick. M1.04 remains blocked.

## Accepted internal subunit

**Authentication security foundation — OWNER PASS**

Implementation merge:

```text
1472ea94118507320cef5c33412cc260e55c3916
```

Final owner acceptance:

- `docs/testing/results/M1_03_AUTHENTICATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`

The accepted foundation must not be weakened or bypassed by later M1.03 work.

## Current internal subunit

**Worker registration and mandatory contact verification — READY TO BUILD**

This subunit must connect the accepted foundation to a complete, recoverable Worker activation workflow.

### Required implementation

1. Worker registration form with full name, normalized email, international-format phone and password creation.
2. Duplicate email and duplicate phone handling without account enumeration.
3. Atomic account creation in `pending_email` state with the Worker role and provisional `HSE-REG-*` reference.
4. Sandbox email OTP delivery adapter.
5. Email OTP expiry, resend timing, attempt exhaustion, invalidation and replay prevention.
6. Transition to `pending_phone` only after successful email verification.
7. Sandbox phone OTP delivery adapter.
8. Phone OTP expiry, resend timing, attempt exhaustion, invalidation and replay prevention.
9. Transition to `active` only after both email and phone are verified and a valid password exists.
10. Authentication security events for registration start, OTP issuance, denial, failure and verification.
11. Refresh, back-navigation and browser-restart recovery without creating duplicate accounts or losing the current verification step.
12. Safe cancellation and restart behavior.
13. No plaintext OTP in the database, logs, browser storage or normal API response.
14. Rate limits and cooldowns persisted or otherwise deterministic across requests.
15. Permanent unit, database, route, lifecycle and recovery tests inside `npm run check`.
16. Windows owner hard testing against merged `main` before the next M1.03 subunit begins.

### Security boundaries

- Do not create an active account before both contacts are verified.
- Do not create a session during registration.
- Do not permit an unassigned role.
- Do not use the provisional registration reference as the permanent Worker ID.
- Do not expose whether an existing account belongs to a specific person.
- Do not store OTP plaintext.
- Do not let resend create multiple simultaneously valid challenges.
- Do not let refresh/back restart a consumed challenge.
- Do not weaken the accepted migration, transaction or rollback boundaries.

## Remaining M1.03 scope after registration

1. Password sign-in, lockout, reset, recovery and account lifecycle.
2. Database-backed opaque session-cookie integration, device list and revocation.
3. Staff invitation acceptance and TOTP enrollment.
4. Separate role-specific login pages and protected portal layouts.
5. Copied-URL, direct-endpoint, stale-session and cross-role denial suite.
6. Complete M1.03 owner acceptance and rollback boundary.

## Linked Later requirements

The current subunit must complete or materially advance:

- `LATER-005` — real Worker registration;
- `LATER-006` — mandatory email OTP;
- `LATER-007` — mandatory phone OTP sandbox workflow;
- `LATER-036` remains provider-blocked only for live SMS credentials after the sandbox workflow passes.

## Gate rule

Do not begin the password sign-in/recovery subunit until Worker registration and both sandbox OTP channels have complete implementation, passing CI, passing owner hard testing, a clean repository state and no unresolved release-blocking owner defect.

Do not begin M1.04 until the whole M1.03 brick is DONE.
