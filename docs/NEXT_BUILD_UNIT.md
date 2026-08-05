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

## Current internal subunit

# Subunit 4 — Company-Scope Bootstrap Fixtures and Protected Demonstration Surfaces

**Status: IMPLEMENTATION MERGED — AUTOMATED PASS — OWNER TEST PENDING**

Implementation:

- Pull request: `#28`
- Validated PR head: `d7999d50763775bc97d433451db869abbdfdc809`
- Merge commit: `752e6cec8b7e83981cece5113748c8c48e52d52d`
- Final PR run: `31031974398`
- Final PR job: `92394756813`
- PR evidence artifact: `8941090250`
- Merged-main run: `31032355746`
- Merged-main job: `92395916146`
- Merged status record: `docs/testing/results/M1_04_COMPANY_SCOPE_DEMONSTRATION_MERGED_PENDING_OWNER.md`
- Owner guide: `docs/testing/M1_04_COMPANY_SCOPE_DEMONSTRATION_HARD_TEST.md`

## Merged subunit 4 boundary

1. A deterministic test-only bootstrap creates synthetic Company accounts, tenants, current memberships and sessions inside disposable PGlite databases.
2. The Company dashboard links to the protected `/company/tenant-scope` demonstration.
3. Page reads use the accepted central current-tenant read permission and the subunit 3 tenant-scoped repository.
4. Create, update and delete commands use the accepted current-tenant write permission and transactionally revalidated command boundary.
5. Browser forms send only neutral fixture identity, optimistic version, key, title, note and intent; tenant, membership, role, permission, ownership and scope remain server-derived.
6. Cross-tenant and missing fixture identifiers remain non-enumerating for find, update and delete.
7. Two synthetic Company tenants list only their own records and may use the same key independently.
8. Stale membership state is denied at the command boundary.
9. Empty, loading, validation, pending, conflict, safe failure, confirmation, success and no-manual-refresh states are present.
10. Signed-out requests redirect before protected rendering; Worker copied-route access remains subject to central role denial.
11. Production build and standalone preview include the protected route and redirect smoke.
12. The generated handoff consolidates all visible impact into one exact Company/Worker workflow.
13. No public Company registration, verification, real settings, sites, departments, team, workers, invitations, evidence, notifications, assessments, interviews or billing was built early.

## Current permitted action

Run only the merged Windows owner browser handoff and clean closure:

```text
docs/testing/M1_04_COMPANY_SCOPE_DEMONSTRATION_HARD_TEST.md
```

Required visible workflow:

1. Company login with TOTP.
2. Open the protected tenant-scope demonstration from the Company dashboard.
3. Confirm masked tenant reference, membership role, synthetic-data warning and explicit empty/current-tenant records.
4. Confirm invalid-field validation without losing the page.
5. Create one synthetic record and confirm it appears without a manual browser refresh.
6. Edit it and confirm the new value/version appears without a manual browser refresh.
7. Navigate away and back to confirm persistence.
8. Delete through the confirmation dialog and confirm the success result.
9. Sign in as Worker, paste `/company/tenant-scope`, confirm Company content never appears and the Worker session remains usable.
10. Stop the server normally and confirm clean synchronized Git state.

Database, cross-tenant, stale-authority, build and preview suites are automated and must not be repeated manually unless a visible failure needs focused reproduction.

## Explicitly blocked

- M1.04 subunit 5 until subunit 4 OWNER PASS.
- Company public registration and verification from M1.08.
- Real Company settings, sites, departments or team management from M1.09.
- Worker invitations and Company codes from M1.10.
- Evidence, qualifications, employment or skills from M1.11.
- Notifications/audit engine from M1.05.
- Secure uploads from M1.06.
- Assessments, interviews, billing and later workflows.

## Remaining M1.04 order

1. Authorization domain and tenant schema foundation — **DONE — OWNER PASS**.
2. Session authorization context and permission checks — **DONE — OWNER PASS**.
3. Tenant-scoped repository/query/command guards — **DONE — OWNER PASS**.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — **implementation merged; automated PASS; owner test pending**.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and final M1.04 owner acceptance — **BLOCKED**.

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

Subunit 4 becomes accepted only after the merged implementation, complete automated gate, exact visible browser handoff, clean shutdown, clean synchronized Git state and owner acceptance all pass.

Do not begin subunit 5 before subunit 4 OWNER PASS. Do not begin M1.05 until the whole M1.04 brick is DONE.
