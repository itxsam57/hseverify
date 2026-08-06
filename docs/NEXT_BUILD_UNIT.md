# Next Build Unit

## Accepted owner gates

- Worker Dashboard and Worker Profile vertical slice: **PASS — 2 August 2026**.
- M1.01 Repository, environments and CI/CD: **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX: **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 subunit 1, Authorization Domain and Tenant Schema Foundation: **DONE — OWNER PASS — 4 August 2026**.
- M1.04 subunit 2, Session Authorization Context and Permission Checks: **DONE — OWNER PASS — 5 August 2026**.
- M1.04 subunit 3, Tenant-Scoped Repository/Query/Command Guards: **DONE — OWNER PASS — 5 August 2026**.
- M1.04 subunit 4, Company-Scope Bootstrap Fixtures and Protected Demonstration Surfaces: **DONE — OWNER PASS — 6 August 2026**.

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

### Subunit 4 — Company-scope bootstrap fixtures and protected demonstration surfaces

**DONE — OWNER PASS — 6 August 2026**

- Implementation pull request: `#28`
- Implementation merge commit: `752e6cec8b7e83981cece5113748c8c48e52d52d`
- Delete repair pull request: `#32`
- Final repaired merge commit: `012ee75764b857345fc69499e8c19597dfceeffa`
- Final record: `docs/testing/results/M1_04_COMPANY_SCOPE_DEMONSTRATION_FINAL_OWNER_ACCEPTANCE.md`
- Resolved defect: `LATER-OWNER-016`

## Current internal subunit

# Subunit 5 — Complete Isolation Suite, Rollback Verification and Final M1.04 Acceptance

**Status: IMPLEMENTATION MERGED — AUTOMATED PASS — OWNER CLOSURE PENDING**

Implementation evidence:

- Pull request: `#34`
- Validated branch head: `a4634d10048315923b5c3cae65e1d6f88ededbe8`
- Validated PR merge candidate: `b8312e3d46cf35fc469fc39ffe6a2190ded44b21`
- PR workflow run: `31069538170`
- PR job: `92514406257`
- PR artifact: `8955146532`
- Merge commit: `4329a591dfa7d1e7c4fca3feb5dd33c873984574`
- Merged-main workflow run: `31069783616`
- Merged-main job: `92515107222`
- Merged-main result: **PASS**
- Implementation record: `docs/M1_04_FINAL_ISOLATION_AND_ACCEPTANCE.md`
- Owner guide: `docs/testing/M1_04_FINAL_ACCEPTANCE_HARD_TEST.md`

## Automated boundary now complete

1. Six own-role portal entries pass and all thirty cross-role combinations fail through the central authorization result.
2. All eleven accepted protected routes have fixed-role layout inventory and real signed-out pre-render HTTP redirect smoke.
3. Cross-tenant, missing and malformed identifiers are non-enumerating for find, update and delete.
4. Mismatched tenant, membership, account and session identities fail the trusted lock boundary.
5. Transactional authorization is revalidated after session revocation, account disablement, tenant suspension, membership suspension, active-role change, membership-role reduction and explicit permission denial.
6. Migrations `0006` then `0005` roll back in order and reapply cleanly.
7. M1.01–M1.03 Worker Profile, account, role and session data remain intact through M1.04 rollback/reapply.
8. The complete stack remains deterministic after persistent PGlite close and reopen.
9. TypeScript, lint, development runtime, application PGlite runtime, production build, preview startup, release manifest and evidence upload pass.
10. The generated handoff is consolidated to one representative browser workflow; accepted Company CRUD is not repeated.

## Current permitted action

Run only the focused final owner closure in:

```text
docs/testing/M1_04_FINAL_ACCEPTANCE_HARD_TEST.md
```

Required visible workflow:

1. Synchronize `main`, run local setup/migrations and start the normal development server.
2. While fully signed out, paste `/worker/profile` and confirm redirect to `/worker/login?reason=session-required` before Worker or global not-found content appears.
3. Sign in as Company with TOTP, paste `/worker/profile`, confirm **Access Denied**, then return to the still-usable Company portal.
4. Sign out, stop the server normally and confirm clean synchronized Git state.

The other ten signed-out routes, twenty-nine additional cross-role combinations, all cross-tenant commands, lifecycle races and rollback/reapply paths are automated and must not be repeated manually.

## Explicitly blocked

- Final M1.04 DONE status until focused owner closure and final acceptance record pass.
- M1.05 Notifications and Audit Engine until the whole M1.04 brick is OWNER PASS.
- Company public registration and verification from M1.08.
- Real Company settings, sites, departments or team management from M1.09.
- Worker invitations and Company codes from M1.10.
- Evidence, qualifications, employment or skills from M1.11.
- Secure uploads from M1.06.
- Assessments, interviews, billing and later workflows.

## Remaining M1.04 order

1. Authorization domain and tenant schema foundation — **DONE — OWNER PASS**.
2. Session authorization context and permission checks — **DONE — OWNER PASS**.
3. Tenant-scoped repository/query/command guards — **DONE — OWNER PASS**.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — **DONE — OWNER PASS**.
5. Complete isolation/concurrency/rollback suite and final M1.04 acceptance — **implementation merged; automated PASS; owner closure pending**.

## Non-negotiable controls

- Never trust tenant, membership, role, permission, ownership or scope from the browser.
- Every tenant-owned read and mutation must include trusted tenant scope in SQL.
- Every sensitive operation must revalidate authority transactionally where state can race.
- Never fetch globally and filter afterward.
- Never reveal whether another tenant's record exists.
- Never create a second permission registry or route-local grant matrix.
- Never permit role or tenant switching inside a session.
- Demonstration data must remain synthetic, clearly labelled and isolated from future production business entities.
- Do not weaken accepted authentication, authorization, migration, runtime or engineering-gate controls.

## Gate rule

Subunit 5 and the whole M1.04 brick become accepted only after the focused owner closure, clean shutdown, clean synchronized Git state and final owner acceptance record pass.

Only then may M1.04 be marked DONE, Phase 1 progress advance to 4 of 12 Milestone 1 bricks, and M1.05 become eligible to start.
