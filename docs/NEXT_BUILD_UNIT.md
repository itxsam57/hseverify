# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, environments and CI/CD: **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 subunit 1, Authorization Domain and Tenant Schema Foundation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 subunit 2, Session Authorization Context and Permission Checks: **DONE — OWNER PASS — 5 August 2026**.

## Phase 1 progress

**3 of 12 Milestone 1 bricks are DONE.**

M1.04 remains IN PROGRESS. Acceptance of internal subunits does not complete the brick.

## Current build gate

# M1.04 — AUTHORIZATION AND TENANT ISOLATION — IN PROGRESS

M1.04 is the only permitted implementation brick. M1.05 and later bricks remain blocked.

## Accepted internal subunit 1

# Authorization domain and tenant schema foundation — DONE — OWNER PASS

Implementation merge:

```text
f1479f72cf189b158144cb7f6afc77623bf40489
```

Final owner record:

```text
docs/testing/results/M1_04_AUTHORIZATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md
```

## Accepted internal subunit 2

# Session authorization-context integration and permission checks — DONE — OWNER PASS

Primary implementation merge:

```text
ccbcf44a4781faa85f6d0ded446dc13d38bbed27
```

Signed-out Worker redirect repair merge:

```text
c100324ace9fea4495e1c4a50377a2df5d00a9ce
```

Final owner record:

```text
docs/testing/results/M1_04_SESSION_AUTHORIZATION_CONTEXT_FINAL_OWNER_ACCEPTANCE.md
```

Resolved owner defect:

```text
LATER-OWNER-012 — RESOLVED — OWNER PASS
```

Accepted subunit 2 boundary:

1. Fail-closed authenticated session/account/fixed-role lifecycle resolution.
2. Canonical portal-entry permissions for all six fixed roles.
3. One authoritative session-token-to-context SQL loader.
4. Company tenant context derived only from authenticated current membership.
5. Tenant lifecycle, membership lifecycle and permission override loading.
6. Central server-only portal, platform and current-tenant permission guards.
7. Non-enumerating credential, role, permission and tenant denial routing.
8. Authorization denial recording through the accepted authentication security-event boundary.
9. Existing protected layouts integrated without role switching.
10. Exact migrated SQL, stale-session, mismatch and source-contract tests inside `npm run check`.
11. Missing-cookie pre-render redirects for all fixed-role portal families while database-backed authorization remains authoritative.
12. Windows owner portal regression, signed-out routing, clean shutdown and synchronized Git state.

## Current internal subunit

# Tenant-scoped repository/query/command guard contracts — READY TO BUILD

## Purpose

Bind real tenant-owned reads and writes to the accepted server-derived Company tenant context. The repository and command layers must make cross-tenant access structurally impossible rather than relying on UI hiding or post-query filtering.

## Required implementation boundary

1. Define one reusable tenant-scoped repository/query/command contract for Company-owned data.
2. Require an accepted `TenantAuthorizationPrincipal` or equivalent trusted server context at every tenant-owned repository and command entry point.
3. Derive tenant scope only from `principal.tenantMembership.tenantId` after `requireCurrentTenantPermission()` succeeds.
4. Never accept tenant ID, membership ID, Company role, permission, scope or ownership claims from route parameters, headers, cookies, forms, search parameters or JSON bodies.
5. Include tenant scope directly in every tenant-owned SQL `SELECT`, `UPDATE`, `DELETE`, `INSERT`, existence check, uniqueness check and locking query.
6. Prohibit fetch-global-then-filter and fetch-by-record-ID-without-tenant-scope patterns.
7. Ensure cross-tenant missing/forbidden records return one non-enumerating result and reveal no existence or protected fields.
8. Ensure command authorization and database mutation occur inside one controlled transaction where race conditions could otherwise change ownership or permission state.
9. Require the specific accepted tenant permission for each repository read or command write; Company portal access alone is never enough.
10. Prevent self-grant, permission escalation and grant-above-ceiling behavior from bypassing the accepted subunit 1 rules.
11. Preserve session role and tenant immutability; no command may switch role or tenant inside the active session.
12. Record authorization or scope denials through the existing authentication security-event boundary where applicable, without building the full M1.05 audit engine early.
13. Add permanent pure-contract and source-contract tests proving no tenant selector is accepted from client-controlled input.
14. Add migrated PGlite tests for allowed same-tenant reads/writes, denied cross-tenant reads/writes, non-enumerating results and tenant-scoped uniqueness.
15. Add concurrent-command tests where ownership, membership or permission state could change between authorization and mutation.
16. Integrate every new focused test into `npm run check`.
17. Produce implementation, security and Windows owner-test documentation before subunit 4 begins.

## Initial implementation scope

This subunit may introduce a minimal neutral tenant-owned test resource solely to prove repository/query/command enforcement if no suitable existing Company-owned domain entity is ready. Any such resource must:

- exist only as an authorization enforcement fixture;
- use opaque identifiers;
- include an explicit tenant foreign key;
- have reversible migration support if persistence is required;
- not pre-build Company registration, sites, departments, workers, orders, billing, evidence or later business workflows;
- be clearly removable or replaceable when the real domain repository is introduced.

## Security boundaries

- UI visibility is never the permission boundary.
- Company portal access is not tenant-owned record permission.
- Tenant identity comes only from the accepted authenticated membership context.
- No browser-controlled tenant selector is permitted.
- Every database read and mutation must include tenant scope in the SQL statement.
- Fetch-global-then-filter is prohibited.
- Fetch-by-record-ID-then-check-tenant is prohibited when the query can scope both values together.
- Cross-tenant denials must not disclose record existence.
- No route-local permission matrix or second permission registry is permitted.
- No session role or tenant switching is permitted.
- No global administrator or Root authority may be silently reused as Company tenant authority.
- Do not implement Company registration/verification from M1.08.
- Do not implement sites, departments or operational teams from M1.09.
- Do not implement Worker invitation/code workflows from M1.10.
- Do not implement employment, qualifications, evidence or skills from M1.11.
- Do not build M1.05 audit/outbox/notification infrastructure early.
- Do not weaken accepted M1.03 authentication or M1.04 subunits 1–2.

## Planned M1.04 internal order

1. Authorization domain and tenant schema foundation — **DONE — OWNER PASS**.
2. Session authorization-context integration and permission checks — **DONE — OWNER PASS**.
3. Tenant-scoped repository/query/command guard contracts — **READY TO BUILD**.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — **blocked**.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and final owner acceptance — **blocked**.

## Linked Later requirements

- `LATER-011` — platform permission model: accepted domain and central live guards exist; endpoint/repository enforcement continues in subunit 3.
- `LATER-012` — Company tenant isolation: trusted live context is owner-accepted; tenant-scoped reads/writes are the current target.
- `LATER-013` — complete cross-role/cross-tenant endpoint and concurrency suite remains cumulative through subunits 3–5.

## Gate rule

Subunit 3 is accepted only after implementation, focused repository/command tests, migrated database tests, concurrency tests, complete `npm run check`, Windows owner hard testing and clean synchronized Git state all pass.

Do not begin subunit 4 before subunit 3 owner PASS. Do not begin M1.05 until the whole M1.04 brick is DONE.
