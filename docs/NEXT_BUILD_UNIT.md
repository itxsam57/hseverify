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

M1.04 remains IN PROGRESS. Acceptance of an internal subunit does not complete the brick.

## Current build gate

# M1.04 — AUTHORIZATION AND TENANT ISOLATION — IN PROGRESS

M1.04 is the only permitted implementation brick. M1.05 and later bricks remain blocked.

## Accepted internal subunits

### Subunit 1 — Authorization domain and tenant schema foundation

**DONE — OWNER PASS — 4 August 2026**

- Merge: `f1479f72cf189b158144cb7f6afc77623bf40489`
- Final record: `docs/testing/results/M1_04_AUTHORIZATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`

### Subunit 2 — Session authorization context and permission checks

**DONE — OWNER PASS — 5 August 2026**

- Implementation merge: `ccbcf44a4781faa85f6d0ded446dc13d38bbed27`
- Signed-out routing repair: `c100324ace9fea4495e1c4a50377a2df5d00a9ce`
- Final record: `docs/testing/results/M1_04_SESSION_AUTHORIZATION_CONTEXT_FINAL_OWNER_ACCEPTANCE.md`
- Resolved defect: `LATER-OWNER-012`

## Current internal subunit

# Subunit 3 — Tenant-scoped repository/query/command guard contracts

**Status: IMPLEMENTATION MERGED — AUTOMATED PASS — OWNER TEST PENDING**

Implementation:

- Pull request: `#27`
- Validated PR head: `c26a6d1ef0564c6511f9575c39643779b539f5c2`
- Merge commit: `f44d248f7da9bd815fdfbc869a3a7a374ad708e2`
- Merged status record: `docs/testing/results/M1_04_TENANT_SCOPED_REPOSITORY_GUARDS_MERGED_PENDING_OWNER.md`
- Owner guide: `docs/testing/M1_04_TENANT_SCOPED_REPOSITORY_GUARDS_HARD_TEST.md`

Automated evidence:

- Final PR run `31023856354`, job `92367329693`: **PASS**.
- Merged-main run `31024142785`, job `92368137924`: **PASS**.

## Merged subunit 3 boundary

1. Accepted tenant permission is bound to the trusted Company principal.
2. Tenant scope is derived only from authenticated session/account/membership context.
3. Every neutral fixture read, write, existence, uniqueness, version and delete statement includes tenant scope directly in SQL.
4. No route, form, header, cookie, query string or JSON body can select tenant, membership, role, permission, ownership or scope.
5. Fetch-global-then-filter and record-ID-only tenant queries are prohibited.
6. Cross-tenant and missing records are non-enumerating.
7. Reads and writes revalidate session, account, assigned Company role, tenant, membership, permission ceiling and deny overrides inside the same transaction as the data operation.
8. Tenant-scoped uniqueness, optimistic versioning, stale membership, stale session and permission-race behavior have migrated database/concurrency coverage.
9. Migration `0006_authorization_tenant_scope_fixture` is independently reversible and all prior migration chains remain protected.
10. No Company registration, sites, departments, workforce, invitations, evidence, notifications, assessment, billing or later business workflow was built early.

## Current permitted action

Run the Windows owner hard test only:

```text
docs/testing/M1_04_TENANT_SCOPED_REPOSITORY_GUARDS_HARD_TEST.md
```

The owner performs only:

1. Worker login, copied Company dashboard denial and Worker-session continuity;
2. Company TOTP login, copied Worker dashboard denial and Company-session continuity;
3. clean server shutdown;
4. clean synchronized Git state.

Database, cross-tenant, migration, rollback and concurrency tests are automated and must not be repeated manually unless a failure requires local reproduction.

## Remaining M1.04 order

1. Authorization domain and tenant schema foundation — **DONE — OWNER PASS**.
2. Session authorization context and permission checks — **DONE — OWNER PASS**.
3. Tenant-scoped repository/query/command guards — **implementation merged; owner test pending**.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — **BLOCKED**.
5. Complete cross-role/cross-tenant endpoint/concurrency suite, migration rollback and final M1.04 owner acceptance — **BLOCKED**.

## Non-negotiable controls

- Never trust tenant, membership, role, permission, ownership or scope from the browser.
- Every tenant-owned read and mutation must include trusted tenant scope in SQL.
- Every sensitive operation must use transactionally revalidated authorization where state can race.
- Never fetch globally and filter afterward.
- Never reveal whether another tenant's record exists.
- Never create a second permission registry or route-local grant matrix.
- Never permit role or tenant switching inside a session.
- Future real tenant repositories must adopt the accepted subunit 3 enforcement base and add domain-specific tests.
- Do not implement Company registration/verification, sites, departments, Worker invitations, evidence, notifications, assessments or billing early.
- Do not weaken accepted authentication, authorization, migration, runtime or engineering-gate controls.

## Gate rule

Subunit 3 becomes accepted only after the merged implementation, complete automated gate, required Worker/Company visible regressions, clean shutdown, clean synchronized Git state and owner acceptance all pass.

Do not begin subunit 4 before subunit 3 owner PASS. Do not begin M1.05 until the whole M1.04 brick is DONE.
