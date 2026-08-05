# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, environments and CI/CD: **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 subunit 1, Authorization Domain and Tenant Schema Foundation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 subunit 2, Session Authorization Context and Permission Checks: **DONE — OWNER PASS — 5 August 2026**.
- M1.04 subunit 3, Tenant-Scoped Repository/Query/Command Guards: **DONE — OWNER PASS — 5 August 2026**.

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

### Subunit 3 — Tenant-scoped repository/query/command guards

**DONE — OWNER PASS — 5 August 2026**

- Pull request: `#27`
- Validated PR head: `c26a6d1ef0564c6511f9575c39643779b539f5c2`
- Merge commit: `f44d248f7da9bd815fdfbc869a3a7a374ad708e2`
- Final record: `docs/testing/results/M1_04_TENANT_SCOPED_REPOSITORY_GUARDS_FINAL_OWNER_ACCEPTANCE.md`

Accepted boundary:

1. tenant permission is bound to the trusted Company principal;
2. tenant scope comes only from authenticated session/account/membership context;
3. every tenant-owned fixture query and command includes tenant scope directly in SQL;
4. browser-controlled tenant, membership, role, permission, ownership and scope selectors are prohibited;
5. cross-tenant and missing records are non-enumerating;
6. sensitive reads and writes revalidate authorization inside the same transaction;
7. tenant-scoped uniqueness, optimistic concurrency and stale-authority races are covered;
8. migration `0006_authorization_tenant_scope_fixture` is independently reversible;
9. required Worker/Company visible regressions, clean shutdown and synchronized Git state passed.

## Current internal subunit

# Subunit 4 — Company-Scope Bootstrap Fixtures and Protected Demonstration Surfaces

**Status: READY TO BUILD**

## Required boundary

1. Provide deterministic, synthetic Company-tenant bootstrap fixtures for automated and owner demonstration without creating public Company registration.
2. Add a protected Company-only demonstration surface that reads tenant-owned records through the accepted central permission and tenant-scoped repository layers.
3. Any demonstration mutation accepts only resource content/identity fields; tenant, membership, role, permission and scope remain server-derived.
4. Show an explicit empty state, loading/pending behavior where applicable, validation errors, safe failure messages and successful no-refresh updates.
5. Preserve the valid Company session after denied copied-role navigation.
6. Prove two synthetic Company tenants cannot see or mutate each other’s demonstration records through page loads, server actions or direct endpoints.
7. Keep the demonstration neutral and removable. Do not model real sites, departments, workers, settings, verification, invitations, evidence, notifications, assessments or billing early.
8. Reuse the existing `authorization_tenant_scope_fixtures` table and accepted subunit 3 enforcement base unless a narrowly justified reversible migration is required.
9. Add source, domain, database, server-action, runtime and handoff regressions to the automated engineering gate.
10. Generate an exact owner browser handoff containing only the visible Company demonstration and portal-isolation checks that automation cannot replace.

## Current permitted implementation

- deterministic synthetic tenant/account/membership/session fixture helpers for tests;
- Company-only tenant-scope demonstration route and navigation link;
- neutral list/create/update/delete demonstration operations using existing guarded services;
- safe server-action state and no-refresh refresh/revalidation;
- permanent cross-tenant action and runtime tests;
- documentation, generated handoff and release evidence.

## Explicitly blocked

- Company public registration and verification from M1.08;
- real Company settings, sites, departments or team management from M1.09;
- Worker invitations and Company codes from M1.10;
- evidence, qualifications, employment or skills from M1.11;
- notifications/audit engine from M1.05;
- secure uploads from M1.06;
- assessments, interviews, billing and later workflows.

## Remaining M1.04 order

1. Authorization domain and tenant schema foundation — **DONE — OWNER PASS**.
2. Session authorization context and permission checks — **DONE — OWNER PASS**.
3. Tenant-scoped repository/query/command guards — **DONE — OWNER PASS**.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — **READY TO BUILD**.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and final M1.04 owner acceptance — **BLOCKED**.

## Non-negotiable controls

- Never trust tenant, membership, role, permission, ownership or scope from the browser.
- Every tenant-owned read and mutation must include trusted tenant scope in SQL.
- Every sensitive operation must revalidate authority transactionally where state can race.
- Never fetch globally and filter afterward.
- Never reveal whether another tenant's record exists.
- Never create a second permission registry or route-local grant matrix.
- Never permit role or tenant switching inside a session.
- Demonstration data must be synthetic, clearly labelled and isolated from future production business entities.
- Do not weaken accepted authentication, authorization, migration, runtime or engineering-gate controls.

## Gate rule

Subunit 4 becomes accepted only after implementation, focused tests, complete `npm run verify:full`, preview smoke, generated handoff, merged-main CI, required owner visible testing, clean shutdown and clean synchronized Git state all pass.

Do not begin subunit 5 before subunit 4 OWNER PASS. Do not begin M1.05 until the whole M1.04 brick is DONE.
