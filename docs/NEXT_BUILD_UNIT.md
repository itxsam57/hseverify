# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, environments and CI/CD: **DONE — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — 4 August 2026**.

## Phase 1 progress

**3 of 12 Milestone 1 bricks are DONE.**

## Current build gate

# M1.04 — AUTHORIZATION AND TENANT ISOLATION — IN PROGRESS

M1.04 is the only permitted implementation brick. M1.05 and later bricks remain blocked.

## Current internal subunit

# Authorization domain and tenant schema foundation — OWNER TEST PENDING

Implementation is merged on `main`:

```text
f1479f72cf189b158144cb7f6afc77623bf40489
```

PR #23 passed complete CI before merge, including authorization/domain/database tests, every accepted M1.01–M1.03 regression, strict TypeScript, ESLint, runtime smoke, production build, preview smoke and release evidence.

## Current permitted action

Run the Windows owner hard test:

```text
docs/testing/M1_04_AUTHORIZATION_FOUNDATION_HARD_TEST.md
```

Do not begin M1.04 subunit 2 until this owner test passes.

## Merged foundation boundary

1. Stable platform and Company-tenant permission vocabulary.
2. Exhaustive least-privilege matrix for all six authentication roles.
3. Company tenant roles: owner, admin, manager and viewer.
4. Opaque non-sequential tenant and membership identifiers.
5. Tenant lifecycle: pending, active, suspended and archived.
6. Membership lifecycle: invited, active, suspended and revoked.
7. One unambiguous current Company tenant membership per Company account.
8. SQL-enforced membership-role permission ceiling.
9. Wildcard, role-mismatched, duplicate and grant-above-ceiling overrides rejected.
10. Non-Company portal tenant evaluation denied.
11. Missing, mismatched or inactive tenant context denied.
12. Inactive membership denied.
13. Membership self-grant/self-modification denied.
14. Root emergency/security authority separated from routine Company tenant management.
15. Independently reversible migration `0005_authorization_tenant_isolation`.
16. Exhaustive domain, SQL policy-alignment, membership-context, migration and source-contract tests inside `npm run check`.

## Security boundaries

- Never trust a tenant ID, permission list or scope supplied by the browser.
- Never fetch a tenant-owned record globally and filter it in application memory afterward.
- Never infer tenant access merely from the authentication portal role.
- Never allow Company users to grant a permission they do not possess.
- Never allow a membership to grant or alter itself.
- Never give Root routine tenant-case access through an accidental wildcard.
- Never reveal whether another tenant's record exists.
- Never weaken M1.03 fixed-role sessions or add role switching.
- Do not implement M1.08 Company registration/verification inside M1.04.
- Do not implement M1.09 sites/departments/team screens inside this subunit.
- Do not claim complete tenant isolation until live context, repository/query/command and direct-endpoint security suites pass in later M1.04 subunits.

## Planned M1.04 internal order

1. Authorization domain and tenant schema foundation — **implementation merged; owner test pending**.
2. Session authorization-context integration and permission checks — **blocked**.
3. Tenant-scoped repository/query/command guard contracts — **blocked**.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — **blocked**.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and owner acceptance — **blocked**.

## Linked Later requirements

- `LATER-011` — platform permission model: foundation implemented, live server authorization remains.
- `LATER-012` — Company tenant isolation: schema foundation implemented, live context and scoped repositories remain.
- `LATER-013` — cross-role/cross-tenant direct-endpoint security suite remains incomplete.

## Gate rule

Subunit 1 becomes accepted only after the owner completes the focused source/domain gate, migrated database gate, complete `npm run check`, manual `0005` rollback/reapply, M1.03 authentication regression and clean Git-state check.

Do not begin M1.04 subunit 2 before subunit 1 owner PASS. Do not begin M1.05 until the whole M1.04 brick is DONE.
