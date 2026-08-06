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
- Validated implementation head: `d7999d50763775bc97d433451db869abbdfdc809`
- Implementation merge commit: `752e6cec8b7e83981cece5113748c8c48e52d52d`
- Delete repair pull request: `#32`
- Validated repair head: `bf82255de88f174f73eea8c2d8cb77911b556f89`
- Final repaired merge commit: `012ee75764b857345fc69499e8c19597dfceeffa`
- Final repaired merged-main run: `31065467924`
- Final repaired merged-main job: `92502148456`
- Final record: `docs/testing/results/M1_04_COMPANY_SCOPE_DEMONSTRATION_FINAL_OWNER_ACCEPTANCE.md`
- Resolved defect: `LATER-OWNER-016`

## Current internal subunit

# Subunit 5 — Complete Isolation Suite, Rollback Verification and Final M1.04 Acceptance

**Status: READY TO BUILD**

Subunit 5 is the only permitted next implementation scope.

## Required subunit 5 boundary

1. Complete the final cross-role direct-endpoint suite for all fixed portals and protected M1.04 surfaces.
2. Complete the final cross-tenant direct-endpoint suite for reads, writes, existence checks, locking and destructive commands.
3. Complete concurrency coverage for session, account, tenant, membership, role, permission and ownership changes that can race with protected operations.
4. Verify missing, malformed and cross-tenant identifiers remain non-enumerating across every accepted M1.04 repository and command boundary.
5. Verify every M1.04 migration rolls back in the intended order and reapplies cleanly without weakening M1.01–M1.03 data.
6. Verify the complete M1.04 migration stack is deterministic and idempotent on disposable and persistent local PGlite environments.
7. Consolidate the final M1.04 engineering gate, owner handoff and acceptance record without duplicating already accepted browser workflows unnecessarily.
8. Preserve every accepted central authorization, tenant-scope, transaction, role-isolation, session-lifecycle and no-client-selector contract.
9. Do not add Company registration, settings, workers, invitations, evidence, notifications, uploads, assessments, interviews, billing or any later business workflow.
10. Do not mark M1.04 DONE until the exact merged implementation, full automated gate, required focused owner closure, clean shutdown, clean synchronized Git state and final owner acceptance all pass.

## Current permitted action

Build and validate only subunit 5.

The implementation must begin from the accepted `main` state containing subunits 1–4 and must treat their owner-accepted behavior as immutable regression boundaries.

Owner browser testing should be limited to any genuinely visible behavior changed by subunit 5 plus final clean closure. Database, cross-role, cross-tenant, concurrency and rollback behavior should remain automated wherever deterministically testable.

## Explicitly blocked

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
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and final M1.04 owner acceptance — **READY TO BUILD**.

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

Subunit 5 becomes accepted only after its merged implementation, complete automated gate, required focused owner handoff, clean shutdown, clean synchronized Git state and owner acceptance all pass.

Only then may the whole M1.04 brick be marked DONE and M1.05 become eligible to start.
