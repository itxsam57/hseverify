# Bookmark: Milestone Path

## Authority

This file is the permanent build-order and acceptance record for HSE Verify Phase 1.

The controlling source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, chats, summaries and discarded implementations may explain intent but cannot override it.

## Brick gate

A brick is DONE only after:

1. complete canonical implementation;
2. complete automated validation;
3. owner hard testing;
4. migration/rollback evidence where applicable;
5. clean shutdown and Git state;
6. no unresolved release-blocking owner defect.

The next brick may not begin before the current brick is DONE.

## Accepted owner gates

### Worker Dashboard and Worker Profile vertical slice

- **Owner result:** PASS — 2 August 2026.
- **Boundary:** accepted M1.07 subunits only; M1.07 remains PARTIAL.

### M1.01 — Repository, environments and CI/CD

- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Implementation chain:** PR #5, PR #6 and PR #7.
- **Accepted:** environment separation, PGlite/PostgreSQL adapters, deterministic migrations, database-backed Profile storage, Windows runtime, dependency floors, production audit, release artifact, rollback and clean owner state.
- **Maintenance:** `LATER-044` retains the tested PostCSS/Sharp compatibility overrides.

### M1.02 — Design System and Global UX

- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Implementation chain:** PR #8 through PR #14.
- **Final record:** `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`.

### M1.03 — Authentication and Portal Isolation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- **Foundation merge:** `1472ea94118507320cef5c33412cc260e55c3916`.
- **Completion merge:** `69e1c9018063f1ae01bb826ea8ab59c22a0602a6`.
- **Repair merges:** `54f1b2aaa00b189ddb38585744104529d916073e`, `403056b85f52b7e2c656b0585b6ced50fdad140a`.
- **Final record:** `docs/testing/results/M1_03_FINAL_OWNER_ACCEPTANCE.md`.
- **Accepted:** Worker dual OTP, password login/lockout/recovery, opaque revocable sessions, first-Root bootstrap, invitation-only staff enrollment, mandatory staff TOTP, six fixed-role portals, copied-URL denial, unauthenticated routing, stale-action denial, all-session password-reset revocation, migration rollback/reapply, responsive/accessibility matrix and clean Git state.

### M1.04 internal subunit 1 — Authorization Domain and Tenant Schema Foundation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- **Pull request:** #23.
- **Merge commit:** `f1479f72cf189b158144cb7f6afc77623bf40489`.
- **Final record:** `docs/testing/results/M1_04_AUTHORIZATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`.
- **Boundary:** this accepts the authorization domain, tenant/membership schema, SQL permission ceilings, lifecycle denial rules, migration `0005`, rollback/reapply and M1.03 regression only. M1.04 remains IN PROGRESS.

## Current brick

# M1.04 — Authorization and Tenant Isolation

**Status: IN PROGRESS**

M1.04 is the only permitted implementation brick. M1.05 is blocked.

### Canonical completion requirement

Permission model, Company scoping, tenant-bound query/command guards and permanent security tests.

### Internal subunit 1 — Authorization domain and tenant schema foundation

**Status: DONE — OWNER PASS**

Accepted boundary:

1. stable platform and Company-tenant permission keys;
2. exhaustive least-privilege matrices for Worker, Company, Assessor, Verifier, Administrator and Root;
3. Company tenant roles owner, admin, manager and viewer;
4. opaque tenant and membership identifiers with SQL shape constraints;
5. tenant lifecycle pending, active, suspended and archived;
6. membership lifecycle invited, active, suspended and revoked;
7. one unambiguous current tenant membership per Company account;
8. SQL-enforced membership-role permission ceilings;
9. wildcard, role-mismatched, duplicate and grant-above-ceiling overrides rejected;
10. non-Company portal, tenant mismatch, inactive tenant, inactive membership and missing tenant context denied by pure domain decisions;
11. membership self-grant/self-modification rejected;
12. Root emergency/security authority separated from routine Company tenant management;
13. independently reversible migration `0005_authorization_tenant_isolation`;
14. exhaustive domain, migrated-PGlite, policy-alignment, migration and source-contract tests inside `npm run check`;
15. complete Windows owner hard test, M1.03 authentication regression and clean synchronized Git state.

### Internal subunit 2 — Session authorization-context integration and permission checks

**Status: IMPLEMENTATION MERGED — OWNER TEST PENDING**

- Pull request: #24.
- Implementation head: `c1707fb072fd133abffd834fc65a764e5befffe2`.
- Merge commit: `ccbcf44a4781faa85f6d0ded446dc13d38bbed27`.
- Final pre-merge CI: run `30978183970`, job `92216772217`, complete validation/preview/release evidence PASS.
- Merged record: `docs/testing/results/M1_04_SESSION_AUTHORIZATION_CONTEXT_MERGED_PENDING_OWNER.md`.
- Owner guide: `docs/testing/M1_04_SESSION_AUTHORIZATION_CONTEXT_HARD_TEST.md`.

Merged boundary:

1. fail-closed session, account and fixed-role lifecycle resolution;
2. canonical portal-entry permission mapping for all six roles;
3. authoritative session-token-to-context SQL accepting no tenant selector;
4. trusted Company tenant context derived only from authenticated account membership;
5. tenant lifecycle, membership lifecycle and permission override loading;
6. one central server-only platform, portal and current-tenant authorization service;
7. non-enumerating credential, role, permission and tenant denial routing;
8. authorization denial recording through the accepted authentication security-event boundary;
9. existing protected layouts integrated behind the central guard without role switching;
10. exact migrated SQL, context lifecycle, mismatch, stale-session and source-contract tests inside `npm run check`;
11. runtime-compatible authorization imports and supported TypeScript `Node16` isolated-test semantics;
12. clock-independent Root invitation regressions;
13. implementation and Windows owner-test documentation.

Acceptance boundary:

- Subunit 2 is not accepted until the Windows owner hard test passes against merged `main`.
- M1.04 remains IN PROGRESS after subunit 2 acceptance.
- Do not begin subunit 3 before subunit 2 owner PASS.

### Remaining M1.04 internal order

3. Tenant-scoped repository/query/command guard contracts.
4. Company-scope bootstrap fixtures and protected demonstration surfaces.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and Windows owner acceptance.

### M1.04 non-negotiable controls

- UI visibility is never the permission boundary.
- Tenant identity comes from trusted membership/session context, never client input.
- Repository reads and writes include tenant scope in the database query.
- Fetch-global-then-filter is prohibited.
- Cross-tenant denials reveal no record existence or protected fields.
- Company users cannot grant permissions they do not possess.
- Staff scope is explicit and calibration/assignment rules remain later-domain concerns.
- Root emergency capability does not imply routine case access.
- Security denials remain recorded through the existing authentication security-event boundary until M1.05 adds the full audit engine.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | DONE | Compatibility override maintenance under `LATER-044`. |
| M1.02 | Design system and global UX | DONE | Accepted 2 August 2026. |
| M1.03 | Authentication and portal isolation | DONE | Accepted 4 August 2026. |
| M1.04 | Authorization and tenant isolation | IN PROGRESS | Subunit 1 accepted; subunit 2 owner gate, tenant-scoped query/command guards, protected surfaces and full security matrix remain. |
| M1.05 | Audit and notification foundations | PARTIAL | Blocked until M1.04 DONE. |
| M1.06 | Secure storage and upload pipeline | NOT STARTED | Blocked until M1.05 DONE. |
| M1.07 | Worker onboarding and Identity Engine | PARTIAL | Resume only after M1.06. |
| M1.08 | Company registration and verification | NOT STARTED | Tenant security foundation comes from M1.04. |
| M1.09 | Sites, departments and team | NOT STARTED | Requires accepted tenant model and scoped permissions. |
| M1.10 | Worker invitations and Company codes | PARTIAL | Staff provisioning does not complete operational invitations/codes. |
| M1.11 | Employment, experience, qualification, skill and leaving-letter records | NOT STARTED | Requires secure upload and tenant boundaries. |
| M1.12 | Public verification foundation | PARTIAL PROTOTYPE | Real lookup, safe projection, concern reporting, rate limits and QR base remain. |

**Phase 1 progress: 3 of 12 Milestone 1 bricks are DONE.**

## Correct execution order

1. Complete and owner-accept M1.04.
2. Complete and owner-accept M1.05.
3. Complete and owner-accept M1.06.
4. Resume and complete M1.07.
5. Continue M1.08 through M1.12 in order.
6. Pass the complete Milestone 1 exit test.
7. Begin Milestone 2 only after Milestone 1 is DONE.

## Canonical roadmap

### Milestone 1 — Platform Foundation, Identity and Company Trust

M1.01 through M1.12 remain frozen in the master specification.

**Exit gate:** a Worker can securely register, verify contact information, submit identity/evidence, receive a permanent Worker ID, join a verified Company and appear in its directory. Portal isolation, tenant isolation, audit and secure uploads must pass security testing.

### Milestone 2 — Assurance, Assessments, Review and Interviews

M2.01 through M2.15 remain frozen. They include Assurance Cases, evidence verification, frameworks/effective policy, MCQ and written Question Bank, randomized non-repeating forms, one-question assessment delivery, answer persistence/recovery, integrity monitoring, review, interviews, decisions, appeals and credential issuance.

### Milestone 3 — Operations, Billing, Intelligence and Production Launch

M3.01 through M3.10 remain frozen. They include reassessment/renewal, payments/payouts, subscriptions, finance, reporting, advanced administration, compliance hardening, performance/accessibility and production activation.
