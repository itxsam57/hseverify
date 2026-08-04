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

# Authorization domain and tenant schema foundation — READY TO BUILD

This subunit must create the durable security model used by every later Company, assurance, evidence, reporting and billing module. It must not implement Company registration or business workflows early.

## Required implementation

1. Add a stable authorization-domain module with typed permission keys.
2. Define least-privilege default role grants for:
   - Worker;
   - Company;
   - Assessor;
   - Verifier;
   - Administrator;
   - Root.
3. Separate platform permissions from Company-tenant permissions.
4. Add migration `0005_authorization_tenant_isolation`.
5. Add a Company-tenant foundation using public-safe non-sequential IDs.
6. Add tenant lifecycle state sufficient for authorization: pending, active, suspended and archived.
7. Add account-to-tenant membership with explicit status and tenant role/scope.
8. Prevent a membership from silently changing an authentication portal role.
9. Add explicit membership permissions/scopes without wildcard-by-accident behavior.
10. Add constraints that prevent duplicate active membership, malformed scope and cross-tenant references.
11. Create an authorization context type derived only from the authenticated database session and trusted membership records.
12. Add pure domain functions for:
    - permission checks;
    - role grant validation;
    - tenant membership validation;
    - grant-above-authority rejection;
    - safe denial classification.
13. Add migrated-PGlite tests for:
    - tenant isolation constraints;
    - duplicate membership rejection;
    - disabled/suspended membership denial;
    - permission grant boundaries;
    - independent rollback/reapply beneath later migrations.
14. Add domain tests for every role and permission combination.
15. Add route/repository source-contract checks so later code cannot bypass the central authorization boundary.
16. Integrate all focused tests into `npm run check`.
17. Produce implementation status and Windows owner-test documentation before subunit 2 starts.

## Security boundaries

- Never trust a tenant ID, permission list or scope supplied by the browser.
- Never fetch a tenant-owned record globally and filter it in application memory afterward.
- Never infer access merely from the portal role.
- Never allow Company users to grant a permission they do not possess.
- Never give Root routine tenant-case access through an accidental wildcard.
- Never reveal whether another tenant's record exists.
- Never weaken M1.03 fixed-role sessions or add role switching.
- Do not implement M1.08 Company registration/verification inside this subunit.
- Do not implement M1.09 sites/departments/team screens inside this subunit.
- Do not claim complete tenant isolation until repository/query/command and direct-endpoint security suites pass in later M1.04 subunits.

## Planned M1.04 internal order

1. Authorization domain and tenant schema foundation — **current**.
2. Session authorization-context integration and permission checks.
3. Tenant-scoped repository/query/command guard contracts.
4. Company-scope bootstrap fixtures and protected demonstration surfaces.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and owner acceptance.

## Linked Later requirements

- `LATER-011` — platform permission model.
- `LATER-012` — Company tenant isolation.
- `LATER-013` — cross-role/cross-tenant direct-endpoint security suite.

## Gate rule

Do not begin M1.04 subunit 2 until subunit 1 has complete implementation, focused and complete automated gates, independent migration rollback/reapply, a clean repository and owner acceptance.

Do not begin M1.05 until the whole M1.04 brick is DONE.
