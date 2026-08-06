# M1.04 Subunit 5 — Final Isolation Suite and Brick Acceptance

## Status

**IMPLEMENTATION MERGED — AUTOMATED PASS — OWNER CLOSURE PENDING**

This is the final internal subunit of M1.04. It adds no business workflow and does not alter the accepted permission model, tenant repository contract, Company demonstration data model, or role-specific dashboard design.

## Validated implementation evidence

- Pull request: `#34`
- Validated branch head: `a4634d10048315923b5c3cae65e1d6f88ededbe8`
- Validated PR merge candidate: `b8312e3d46cf35fc469fc39ffe6a2190ded44b21`
- PR workflow run: `31069538170`
- PR job: `92514406257`
- PR evidence artifact: `8955146532`
- Merge commit: `4329a591dfa7d1e7c4fca3feb5dd33c873984574`
- Merged-main workflow run: `31069783616`
- Merged-main job: `92515107222`
- Merged-main result: **PASS**

## Purpose

Close the remaining proof gaps across the complete M1.04 stack before the Authorization and Tenant Isolation brick may be marked DONE.

## Implemented automated boundary

1. A complete six-role authorization matrix evaluates every active fixed portal role against every expected portal role. The six own-role cases pass and all thirty cross-role combinations fail with the central `role_mismatch` result and audit context.
2. Every accepted protected route is inventoried against its fixed protected layout:
   - Worker dashboard, profile and onboarding;
   - Company dashboard and tenant-scope demonstration;
   - Assessor dashboard;
   - Verifier dashboard;
   - Admin dashboard and staff;
   - Root dashboard and staff.
3. The optimistic missing-cookie proxy now covers every accepted protected route before App Router rendering. Database-backed authorization remains authoritative for every cookie-present request.
4. Real Next.js development HTTP smoke requests all eleven accepted protected routes while signed out and requires a minimal `307` to the exact fixed-role login with no protected/not-found HTML.
5. Cross-tenant, missing and malformed fixture identifiers return the same empty result for find, update and delete. The accepted repository exposes no separate existence oracle.
6. Trusted scope locking rejects mismatched tenant, membership, account and session identities.
7. Previously accepted Company authority is transactionally denied after each relevant race:
   - session revocation;
   - account disablement;
   - tenant suspension;
   - membership suspension;
   - session active-role change;
   - membership-role reduction below the requested permission ceiling;
   - explicit deny override.
8. The complete M1.04 migration stack is exercised in order:
   - deterministic application through `0006`;
   - idempotent second application;
   - rollback `0006` then `0005`;
   - proof that M1.01–M1.03 Worker Profile, account, role and session data remain;
   - clean reapplication of `0005` and `0006`;
   - checksum/status validation;
   - close-and-reopen persistent PGlite validation.
9. The final suite is a permanent named command, `npm run test:m1-04-final`, and is included in both `test:integration` and the fail-closed complete `check` command.

## Production change boundary

The only runtime source change is expansion of the existing missing-cookie proxy matcher to accepted protected routes that previously depended on protected-layout rendering for their signed-out redirect. It does not:

- trust cookies as authorization;
- accept role, tenant, membership, permission, ownership or scope from the browser;
- switch role or tenant inside a session;
- change central role or permission registries;
- change tenant SQL or transaction logic;
- add public registration, Company management, evidence, notifications, assessments, interviews, billing or payments.

## Remaining owner gate

The automated and merged-main gates are complete. The only remaining closure is:

1. run `npm run setup:local` and verify migrations `0001` through `0006`;
2. confirm signed-out `/worker/profile` redirects to `/worker/login?reason=session-required` before protected rendering;
3. confirm a valid Company session receives **Access Denied** for `/worker/profile` and remains usable after returning to the active portal;
4. stop the server normally and confirm a clean synchronized Git state;
5. record final owner acceptance.

The other ten signed-out routes, twenty-nine additional cross-role combinations, cross-tenant commands, lifecycle races and migration rollback/reapply paths are automated and must not be repeated manually.

## Rollback

- Application source rollback: revert merge commit `4329a591dfa7d1e7c4fca3feb5dd33c873984574`.
- Schema rollback proof: the automated suite demonstrates `0006` then `0005` rollback and clean reapplication in local/test PGlite only.
- Preview and production destructive database rollback remains prohibited by the existing migration library.

M1.04 remains IN PROGRESS and M1.05 remains blocked until the focused owner closure and final acceptance record pass.
