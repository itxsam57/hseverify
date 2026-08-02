# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**
- **M1.02 Design System and Global UX: PASSED — 2 August 2026**

## Phase 1 progress

**2 of 12 bricks are DONE.**

M1.01 and M1.02 have passed implementation, automated validation and owner hard testing.

## Current build gate

**M1.03 — AUTHENTICATION AND PORTAL ISOLATION — IN PROGRESS**

M1.03 is the only permitted implementation brick. M1.04 remains blocked.

## Current internal subunit

**Authentication security foundation — MERGED, OWNER TEST REQUIRED**

PR #15 was squash-merged as:

```text
1472ea94118507320cef5c33412cc260e55c3916
```

The merged foundation establishes:

- migration `0002_authentication_foundation`;
- persistent accounts and explicit account roles;
- verified account lifecycle and lock-state database constraints;
- expiring, attempt-limited and replay-safe OTP challenge state;
- opaque revocable sessions bound to an assigned account role;
- active-account-only session creation and lookup;
- staff invitation and encrypted TOTP factor state;
- authentication-specific append-only security events;
- six canonical roles: Worker, Company, assessor, verifier, administrator and root/super-admin;
- separate login/home route contracts and no role switching;
- mandatory MFA classification for all non-Worker roles;
- scrypt password hashing;
- challenge/destination-bound OTP hashing;
- context-separated opaque token hashing;
- TOTP verification with replay-counter protection;
- authenticated encryption for MFA secrets;
- real PGlite/PostgreSQL transaction support;
- transactional authentication repository contracts;
- permanent cryptographic, migration, lifecycle, role-assignment, transaction and rollback tests.

Exact merge and CI evidence:

- `docs/testing/results/M1_03_AUTHENTICATION_FOUNDATION_MERGED.md`

Owner guide:

- `docs/testing/M1_03_AUTHENTICATION_FOUNDATION_HARD_TEST.md`

## Immediate gate

The owner must pass the focused Windows authentication-foundation test against merged `main`.

A failure creates `LATER-OWNER-009`. Do not begin Worker registration or any later M1.03 subunit until the foundation owner result is PASS.

## Next M1.03 subunit after foundation owner PASS

**Worker registration and mandatory contact verification**

It must connect the accepted foundation to:

1. Worker registration form and duplicate-account handling.
2. Secure account creation in `pending_email` state.
3. Sandbox email OTP delivery, resend timing, attempt exhaustion and replay prevention.
4. Transition to `pending_phone` only after email verification.
5. Sandbox phone OTP delivery and verification.
6. Transition to `active` only after both contacts are verified.
7. Password creation and safe login eligibility.
8. Authentication security events for every transition and denial.
9. Recovery-safe refresh/back/restart behavior.
10. Windows owner hard testing without exposing OTP plaintext in the database or browser response.

## Remaining M1.03 scope after registration

- password sign-in, reset, recovery and lifecycle controls;
- database-backed opaque session cookie integration and revocation;
- staff invitation acceptance and provisioning;
- TOTP enrollment and mandatory privileged-role MFA;
- separate role-specific login pages and protected portal layouts;
- copied-URL, direct-endpoint, stale-session and cross-role denial tests;
- complete M1.03 owner acceptance and rollback boundary.

## Linked Later requirements

M1.03 must complete or materially advance:

- `LATER-005` — real Worker registration;
- `LATER-006` — mandatory email OTP;
- `LATER-007` — mandatory phone OTP sandbox workflow;
- `LATER-008` — password reset, recovery and account lifecycle;
- `LATER-009` — role-specific authentication foundation;
- `LATER-010` — staff provisioning and MFA;
- `LATER-036` remains provider-blocked only for live SMS credentials after the sandbox workflow passes.

## Gate rule

Do not begin M1.04 until M1.03 has complete implementation, passing automated security and functional validation, passing owner hard testing, a clean repository state and no unresolved release-blocking owner defect.
