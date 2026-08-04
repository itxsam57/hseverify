# HSE Verify Engineering Memory

Compact source of truth for the active clean rebuild.

## Current build position

- Scope: Phase 1 master specification dated 1 August 2026.
- Repository: `itxsam57/hseverify`, branch `main`.
- M1.01 Platform Foundation: owner accepted.
- M1.02 Design System and Global UX: owner accepted.
- M1.03 Authentication and Portal Isolation: implementation merged; owner hard test in progress.
- M1.04 remains blocked until complete M1.03 owner PASS.

### M1.03 owner PASS evidence — 4 August 2026

- Worker public registration with mandatory email and phone OTP.
- Worker fixed-role sign-in, opaque sessions, session listing/revocation and sign-out.
- Worker lockout and password recovery after repair merge `403056b85f52b7e2c656b0585b6ced50fdad140a`.
- First-Root sandbox bootstrap, TOTP enrollment and Root login.
- Invitation-only enrollment, TOTP login, dashboard access and invitation reuse rejection for Company, Assessor, Verifier and Administrator.
- Six-role signed-in copied-URL isolation: every mismatched portal denied.
- Unauthenticated direct access: every protected dashboard redirects to its own role-specific login.
- Stale protected Root invitation action after sign-out denied with no mutation.
- Password-reset all-session invalidation and stale-session denial.
- Migration `0004_authentication_completion` rollback/reapply and complete `npm run check`.
- Responsive/accessibility matrix for Worker registration.
- Responsive/accessibility matrix for all six fixed-role login pages.

### Remaining M1.03 owner gates

1. Password-recovery request and verification responsive/accessibility surfaces.
2. Staff enrollment responsive/accessibility surface.
3. Account sessions responsive/accessibility surface.
4. Access-denied responsive/accessibility surface.
5. Final clean shutdown and Git state.

## Resolved defects

- `LATER-OWNER-010`: Worker dual-OTP timestamp typing failure — resolved and owner accepted.
- `LATER-OWNER-011`: Worker lockout/recovery timestamp typing failure — resolved and owner accepted.

## Permanent authentication rules

- One browser authentication cookie maps to one database session with one immutable `activeRole`.
- Moving to another portal requires explicit sign-out and separate login, or a separate browser context.
- Silent role switching must never be added.
- Worker registration does not create a session before both OTP contacts are verified.
- Staff accounts are invitation-only and require TOTP.
- Password reset revokes every existing session.
- Recovery tokens, OTPs, invitations and TOTP counters are one-time.
- Owner sandbox instructions must use the exact current `HSE_AUTH_SANDBOX_ACCESS_KEY` from `.env.local`.
- Local rollback instructions must temporarily set `HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK=true` and clear it immediately afterward; never persist it in `.env.local`.

## Build priority

1. Build and hard-test the working domain backbone, dashboards and role-to-role workflow first.
2. Do not rebuild final marketing polish or production providers inside an earlier brick.
3. Required future features keep stable interfaces and truthful disabled/sandbox states.
4. Provider failures must never corrupt the core workflow.

## Editable content and integration entry points

- Editable product copy: `src/config/product-copy.ts`.
- Worker registration state machine: `src/lib/auth/worker-registration-service.ts`.
- Worker registration persistence: `src/lib/auth/worker-registration-repository.ts`.
- Lockout and OTP failure persistence: `src/lib/auth/auth-repository.ts`.
- Sessions and fixed-role enforcement: `src/lib/auth/auth-session-service.ts`.
- Development OTP inbox: `src/lib/auth/auth-sandbox-service.ts`.

Production email/SMS providers may replace only the delivery boundary. They must not rewrite registration states, OTP hashing, expiry, rate limits or activation.

## Active BUILD-PIN boundaries

- `AUTH-REG-OTP-POST`: challenge-bound same-origin OTP POST and 303 redirect.
- `AUTH-REG-OTP-ERROR-BOUNDARY`: separates expected registration errors from database/invariant failures.
- `tests/platform/worker-registration-flow-sql.test.mjs`: protects typed timestamps across OTP stages.
- `tests/platform/authentication-failure-state-sql.test.mjs`: protects lockout and terminal OTP timestamps.
- `src/lib/auth/auth-session-service.ts`: protects fixed-role portal isolation.

## Defect protocol

Stop at the first owner failure, create `LATER-OWNER-###`, repair root cause on a branch, add regression coverage, run focused and full gates, merge, then repeat the owner step. Resolve only after owner retest PASS.

## Context-cleanliness rule

Future chats should load only the master specification, this memory, milestone status, unresolved Later records and current repository evidence. Discarded versions are historical capability references only.
