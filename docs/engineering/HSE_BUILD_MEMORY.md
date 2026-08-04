# HSE Verify Engineering Memory

Compact source of truth for the active clean rebuild.

## Current build position

- Canonical authority: **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**.
- Repository: `itxsam57/hseverify`, branch `main`.
- M1.01 Repository, environments and CI/CD: **DONE — OWNER PASS**.
- M1.02 Design system and global UX: **DONE — OWNER PASS**.
- M1.03 Authentication and portal isolation: **DONE — OWNER PASS on 4 August 2026**.
- M1.04 Authorization and tenant isolation: **IN PROGRESS — only permitted brick**.
- M1.05 and later bricks remain blocked until M1.04 owner acceptance.

## M1.03 accepted boundary

- Worker registration requires email and phone OTP before activation.
- Registration creates no authenticated session.
- Worker password login, lockout, recovery and opaque revocable sessions passed.
- Password reset revokes every existing session.
- Company, Assessor, Verifier, Administrator and Root are invitation-only and require TOTP.
- One browser cookie maps to one database session and one immutable `activeRole`.
- There is no role-switch operation; another portal requires sign-out and fresh login or a separate browser context.
- Protected layouts and server actions recheck the database session.
- Six-role copied-URL isolation, unauthenticated routing, stale-action denial and password-reset invalidation passed.
- Migration `0004_authentication_completion` independently rolled back/reapplied and the complete gate passed.
- Required authentication surfaces passed desktop, tablet, mobile, keyboard-focus and zoom checks.
- Final shutdown and Git state passed cleanly without Administrator terminal or Developer Mode.
- Final record: `docs/testing/results/M1_03_FINAL_OWNER_ACCEPTANCE.md`.

## Resolved M1.03 defects

- `LATER-OWNER-010`: Worker dual-OTP timestamp typing failure — resolved and owner accepted.
- `LATER-OWNER-011`: Worker lockout/recovery timestamp typing failure — resolved and owner accepted.

## M1.04 canonical objective

Implement the complete server-side permission and tenant boundary required before Company data modules:

1. explicit permission vocabulary and least-privilege role grants;
2. Company tenant and membership/scope foundation without prematurely implementing M1.08 registration;
3. authorization context derived from the authenticated database session, never from client input;
4. tenant-bound query and command guards that require `tenant_id` for every tenant-owned operation;
5. prevention of self-grant and grant-above-authority;
6. Root/Super Admin behavior separated from routine tenant operations;
7. safe denial responses with no cross-tenant existence disclosure;
8. permanent direct-endpoint, repository and concurrent cross-tenant security tests;
9. independently reversible migration and Windows owner hard test.

### M1.04 internal order

1. **Authorization domain and tenant schema foundation.**
2. **Session authorization-context integration and permission checks.**
3. **Tenant-scoped repository/query/command guard contracts.**
4. **Company-scope bootstrap fixtures and protected demonstration surfaces.**
5. **Complete cross-role/cross-tenant security matrix, rollback and owner acceptance.**

Do not start M1.05 before all five subunits and the final M1.04 owner gate pass.

## Permanent security rules

- The UI is never the authorization boundary.
- Role, permission, tenant and record-state checks are repeated server-side for every protected read and write.
- A tenant-owned record must carry an immutable tenant identifier.
- Tenant scope comes from trusted account membership/session context, never a browser-supplied tenant ID.
- Queries must be tenant-filtered at the repository boundary; fetching globally and filtering afterward is prohibited.
- Cross-tenant not-found and forbidden responses must not reveal whether the other tenant record exists.
- Company users cannot grant permissions they do not possess.
- Platform staff scope must be explicit; no role receives blanket access by accident.
- Root emergency capability must not become routine case access.
- Material authorization denials continue to use authentication security events until M1.05 adds the full audit/outbox engine.

## Build priority rule

- A brick is DONE only after canonical implementation, complete automated validation, owner hard testing, rollback evidence and clean Git state.
- Stop at the first owner failure and create `LATER-OWNER-###` before repair.
- Fix root causes on a branch, add permanent regression coverage, run focused and full gates, merge, then repeat the exact owner step.
- Never revive discarded Version 10 code as an architectural dependency. It is capability reference only.
- No frozen Phase 1 feature may be silently removed or replaced by a visual mock.
- Provider-dependent behavior must keep a real adapter and truthful sandbox/disabled state.

## Existing integration boundaries

- Worker registration state machine: `src/lib/auth/worker-registration-service.ts`.
- Registration persistence: `src/lib/auth/worker-registration-repository.ts`.
- Lockout and OTP persistence: `src/lib/auth/auth-repository.ts`.
- Sessions and fixed-role enforcement: `src/lib/auth/auth-session-service.ts`.
- Development OTP inbox: `src/lib/auth/auth-sandbox-service.ts`.
- Editable product copy: `src/config/product-copy.ts`.

## Active BUILD-PIN boundaries

Stable code bookmark format:

```text
BUILD-PIN <MODULE>-<FLOW>-<PURPOSE>
```

- `AUTH-REG-OTP-POST`: challenge-bound same-origin OTP POST and 303 redirect.
- `AUTH-REG-OTP-ERROR-BOUNDARY`: separates expected registration errors from database/invariant failures.
- `tests/platform/worker-registration-flow-sql.test.mjs`: typed OTP-stage timestamps.
- `tests/platform/authentication-failure-state-sql.test.mjs`: lockout and terminal OTP timestamps.
- `src/lib/auth/auth-session-service.ts`: fixed-role portal isolation.

## Context-cleanliness rule

Future chats should load only the canonical master specification, this memory, milestone path, open Later register, exact next build unit and current repository evidence. Earlier prototypes and contradictory memories are non-authoritative.
