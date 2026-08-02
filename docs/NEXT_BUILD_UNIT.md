# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**
- **M1.02 Design System and Global UX: PASSED — 2 August 2026**

## Phase 1 progress

**2 of 12 bricks are DONE.**

M1.01 and M1.02 have both passed implementation, automated validation and owner hard testing.

## M1.02 accepted boundary

M1.02 is DONE. The accepted boundary includes:

- shared design tokens and reusable controls;
- responsive Worker shell and mobile navigation;
- keyboard/focus, dialog and table contracts;
- deterministic development, type-generation, runtime, build and preview isolation;
- portable Windows preview behavior without privileged symlinks;
- protected tracked Next/TypeScript configuration;
- Worker Profile page-width containment and table-local horizontal scrolling;
- platform-stable LF/CRLF regression validation.

The owner passed:

- `npm run test:profile-overflow` with five passes and zero failures;
- the complete Windows `npm run check` gate;
- normal desktop, 860px, 768px, 390px and 320px browser checks;
- 125%, 150% and 200% zoom checks;
- additional zoom testing through 500%;
- normal `Ctrl+C` development shutdown;
- clean `git status --short`;
- empty protected-file diff for `tsconfig.json`, `package.json`, `package-lock.json` and `next.config.ts`.

Final acceptance evidence:

- `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`

Resolved by this owner PASS:

- `LATER-004`;
- `LATER-045`;
- `LATER-OWNER-003` through `LATER-OWNER-008`.

`LATER-044` remains an explicit maintenance obligation for the temporary PostCSS/Sharp compatibility overrides.

## Current build gate

**M1.03 — AUTHENTICATION AND PORTAL ISOLATION — READY TO BUILD**

M1.03 is now the only permitted implementation brick.

### Required M1.03 scope

M1.03 must replace demonstration-only access with a real authentication foundation covering:

1. Worker registration and account activation.
2. Mandatory email OTP with secure hashing, expiry, resend limits, attempt limits and replay prevention.
3. Mandatory phone OTP through a real sandbox adapter, with production provider activation remaining tracked separately.
4. Password creation, sign-in, reset, recovery and account lifecycle controls.
5. Session and device controls, including secure cookie/session handling and revocation.
6. Role-specific login and portal entry for Worker, Company, assessor, verifier/reviewer, administrator and root/super-admin roles.
7. Staff invitation/provisioning and mandatory MFA for privileged roles.
8. Strict portal guards so one role cannot enter another role’s dashboard through navigation, copied URLs, direct endpoints or stale sessions.
9. Explicit logout before changing roles; no role-switching inside an authenticated session.
10. Security audit events for registration, OTP, login, logout, recovery, lockout, provisioning and access denial.
11. Automated cross-role route and endpoint tests.
12. Windows owner hard-test instructions and a clean rollback boundary.

### Linked Later requirements

M1.03 must complete or materially advance:

- `LATER-005` — real Worker registration;
- `LATER-006` — mandatory email OTP;
- `LATER-007` — mandatory phone OTP sandbox workflow;
- `LATER-008` — password reset, recovery and account lifecycle;
- `LATER-009` — role-specific authentication foundation;
- `LATER-010` — staff provisioning and MFA;
- `LATER-036` remains provider-blocked only for live SMS credentials after the sandbox workflow exists.

## Gate rule

Do not begin M1.04 until M1.03 has:

- complete implementation;
- passing automated security and functional validation;
- passing owner hard testing;
- a clean repository state;
- no unresolved release-blocking owner defect.

## Canonical order after M1.03

1. M1.04 — authorization and tenant isolation.
2. M1.05 — immutable audit/outbox and persisted notifications.
3. M1.06 — secure private upload pipeline.
4. M1.07 — Worker Identity Engine.
5. M1.08 — Company verification.
6. M1.09 — Company sites, departments and team permissions.
7. M1.10 — invitations and Company codes.
8. M1.11 — qualifications, experience, employment, skills and leaving letters.
9. M1.12 — public verification and Report a Concern.
