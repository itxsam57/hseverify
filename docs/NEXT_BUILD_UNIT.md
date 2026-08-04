# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, environments and CI/CD: **DONE — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — 4 August 2026**.
- M1.04 subunit 1, Authorization Domain and Tenant Schema Foundation: **DONE — OWNER PASS — 4 August 2026**.

## Phase 1 progress

**3 of 12 Milestone 1 bricks are DONE.**

M1.04 remains IN PROGRESS; acceptance of an internal subunit does not complete the brick.

## Current build gate

# M1.04 — AUTHORIZATION AND TENANT ISOLATION — IN PROGRESS

M1.04 is the only permitted implementation brick. M1.05 and later bricks remain blocked.

## Accepted internal subunit

# Authorization domain and tenant schema foundation — DONE — OWNER PASS

Implementation merge:

```text
f1479f72cf189b158144cb7f6afc77623bf40489
```

Final owner record:

```text
docs/testing/results/M1_04_AUTHORIZATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md
```

The accepted domain, schema, permission ceilings, lifecycle denial rules, migration rollback boundary and M1.03 authentication isolation must not be weakened or bypassed.

## Current internal subunit

# Session authorization-context integration and permission checks — READY TO BUILD

This subunit must connect the accepted authorization model to real authenticated server execution. It must not implement Company registration, operational Company modules or tenant-owned business data early.

## Required implementation

1. Derive a platform authorization context from the authenticated database session, never from browser-provided role or permission data.
2. For Company sessions, derive the current tenant context only from trusted active membership records.
3. Resolve account status, fixed portal role, session validity, tenant status and membership status before any permission decision.
4. Add one central server-only authorization service for platform and Company-tenant permission checks.
5. Reuse the accepted permission vocabulary and matrices without duplicating or reinterpreting grants in route code.
6. Deny missing, expired, revoked, stale or role-mismatched sessions before authorization evaluation.
7. Deny missing tenant context, non-Company tenant access, inactive tenants and inactive memberships.
8. Prevent any request parameter, form field, cookie or header from selecting or overriding the trusted tenant.
9. Add explicit guard results for unauthenticated, wrong role, missing permission, inactive account, invalid tenant and invalid membership states.
10. Keep denial responses non-enumerating: no disclosure that another tenant, membership or protected record exists.
11. Integrate central guards into the existing protected portal/server-action boundary without creating role switching.
12. Record authorization denial through the existing authentication security-event boundary where applicable; do not build the full M1.05 audit engine early.
13. Add permanent unit and migrated-database tests for context derivation, stale-session denial, tenant mismatch, lifecycle denial and permission decisions.
14. Add source-contract tests that prohibit client-trusted tenant selection and ad-hoc permission matrices.
15. Integrate all focused tests into `npm run check`.
16. Produce implementation, security-boundary and Windows owner-test documentation before subunit 3 starts.

## Security boundaries

- Never trust a tenant ID, role, permission or scope supplied by the browser.
- Never infer tenant access merely from the Company portal role.
- Never create a second permission registry or local route-specific grant matrix.
- Never allow a session to change role or tenant context without logout and a new valid authentication flow.
- Never permit suspended, archived, revoked, invited or otherwise inactive tenant state.
- Never reveal whether another tenant or membership exists.
- Never fetch tenant-owned records globally and filter them afterward.
- Do not implement tenant-owned repositories or business commands in this subunit; those belong to subunit 3.
- Do not implement Company registration/verification from M1.08.
- Do not implement sites, departments or operational team screens from M1.09.
- Do not weaken M1.03 password, TOTP, session, portal or copied-route isolation.

## Planned M1.04 internal order

1. Authorization domain and tenant schema foundation — **DONE — OWNER PASS**.
2. Session authorization-context integration and permission checks — **current; ready to build**.
3. Tenant-scoped repository/query/command guard contracts — **blocked**.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — **blocked**.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and owner acceptance — **blocked**.

## Linked Later requirements

- `LATER-011` — platform permission model: accepted foundation exists; live server authorization is current.
- `LATER-012` — Company tenant isolation: accepted schema exists; trusted live session context is current.
- `LATER-013` — complete cross-role/cross-tenant endpoint and concurrency suite remains later in M1.04.

## Gate rule

Do not begin M1.04 subunit 3 until subunit 2 has complete implementation, focused and complete automated gates, clean migration/authentication regressions, a clean repository and owner acceptance.

Do not begin M1.05 until the whole M1.04 brick is DONE.
