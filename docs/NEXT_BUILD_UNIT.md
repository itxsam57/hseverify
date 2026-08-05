# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, environments and CI/CD: **DONE — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — 4 August 2026**.
- M1.04 subunit 1, Authorization Domain and Tenant Schema Foundation: **DONE — OWNER PASS — 4 August 2026**.

## Phase 1 progress

**3 of 12 Milestone 1 bricks are DONE.**

M1.04 remains IN PROGRESS; implementation or acceptance of an internal subunit does not complete the brick.

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

The accepted permission domain, tenant schema, SQL ceilings, lifecycle denial rules, migration rollback boundary and M1.03 authentication isolation must not be weakened or bypassed.

## Current internal subunit

# Session authorization-context integration and permission checks — OWNER TEST PENDING

Implementation is merged on `main`:

```text
ccbcf44a4781faa85f6d0ded446dc13d38bbed27
```

Pull request #24 passed complete CI before merge, including authorization source/domain/migrated-database gates, every accepted M1.01–M1.03 regression, strict TypeScript, ESLint, development and database runtime smoke, deterministic production build, preview smoke and release evidence.

Merged status record:

```text
docs/testing/results/M1_04_SESSION_AUTHORIZATION_CONTEXT_MERGED_PENDING_OWNER.md
```

## Current permitted action

Run the Windows owner hard test only:

```text
docs/testing/M1_04_SESSION_AUTHORIZATION_CONTEXT_HARD_TEST.md
```

Do not begin M1.04 subunit 3 until this owner test passes and the repository is clean and synchronized.

## Merged subunit 2 boundary

1. Fail-closed authenticated session/account/role lifecycle resolution.
2. Canonical portal-entry permissions for all six fixed roles.
3. Authoritative session-token-to-context SQL accepting no tenant selector.
4. Company tenant context derived only from the authenticated account's current membership.
5. Tenant lifecycle, membership lifecycle and permission override loading.
6. Central server-only platform, portal and current-tenant permission guards.
7. Non-enumerating denial routing and authentication security-event recording.
8. Existing protected layouts integrated through the central guard without role switching.
9. Permanent context, exact SQL, stale-session, mismatch and source-contract tests in `npm run check`.
10. Clock-independent Root invitation regression coverage.
11. Runtime-compatible authorization imports and supported TypeScript `Node16` isolated-test semantics.
12. Implementation and Windows owner-test documentation.

## Security boundaries

- Never trust tenant ID, membership ID, role, permission or scope from the browser.
- Never infer tenant access merely from the Company portal role.
- Never create a second permission registry or route-local grant matrix.
- Never allow role or tenant switching inside an authenticated session.
- Never permit expired, revoked, stale or inactive account/session state.
- Never permit inactive tenant or membership state.
- Never reveal whether another tenant or membership exists.
- Never fetch tenant-owned records globally and filter them afterward.
- Do not implement tenant-owned repositories or business commands before subunit 3 is explicitly opened.
- Do not implement Company registration/verification from M1.08.
- Do not implement sites, departments or operational team screens from M1.09.
- Do not weaken M1.03 password, TOTP, session, portal or copied-route isolation.

## Planned M1.04 internal order

1. Authorization domain and tenant schema foundation — **DONE — OWNER PASS**.
2. Session authorization-context integration and permission checks — **implementation merged; owner test pending**.
3. Tenant-scoped repository/query/command guard contracts — **blocked**.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — **blocked**.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and owner acceptance — **blocked**.

## Linked Later requirements

- `LATER-011` — platform permission model: domain and live central server context/guards implemented; owner acceptance and later endpoint enforcement remain.
- `LATER-012` — Company tenant isolation: schema and trusted live tenant context implemented; owner acceptance and tenant-scoped repositories/commands remain.
- `LATER-013` — complete cross-role/cross-tenant endpoint and concurrency suite remains later in M1.04.

## Gate rule

Subunit 2 becomes accepted only after focused authorization tests, complete `npm run check`, live Worker and Company portal regressions, copied-URL denials, signed-out routing, clean shutdown, synchronized Git state and owner acceptance all pass against merged `main`.

Do not begin M1.04 subunit 3 before subunit 2 owner PASS. Do not begin M1.05 until the whole M1.04 brick is DONE.
