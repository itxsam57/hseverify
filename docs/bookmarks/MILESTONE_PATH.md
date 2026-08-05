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

The next brick may not begin before the current brick is DONE. Internal subunits may advance only after their own implementation, automated and owner gates pass.

## Accepted owner gates

### Worker Dashboard and Worker Profile vertical slice

- **Owner result:** PASS — 2 August 2026.
- **Boundary:** accepted M1.07 subunits only; M1.07 remains PARTIAL.

### M1.01 — Repository, environments and CI/CD

- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Implementation chain:** PR #5, PR #6 and PR #7.
- **Maintenance:** `LATER-044` retains the tested PostCSS/Sharp compatibility overrides.

### M1.02 — Design System and Global UX

- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Implementation chain:** PR #8 through PR #14.
- **Final record:** `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`.

### M1.03 — Authentication and Portal Isolation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- **Implementation and repair chain:** authentication PRs through merge `403056b85f52b7e2c656b0585b6ced50fdad140a`.
- **Final record:** `docs/testing/results/M1_03_FINAL_OWNER_ACCEPTANCE.md`.

### M1.04 internal subunit 1 — Authorization Domain and Tenant Schema Foundation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- **Pull request:** #23.
- **Merge:** `f1479f72cf189b158144cb7f6afc77623bf40489`.
- **Final record:** `docs/testing/results/M1_04_AUTHORIZATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`.

### M1.04 internal subunit 2 — Session Authorization Context and Permission Checks

- **Status:** DONE — OWNER PASS — 5 August 2026.
- **Implementation/repair:** PR #24 and #25; merges `ccbcf44a4781faa85f6d0ded446dc13d38bbed27` and `c100324ace9fea4495e1c4a50377a2df5d00a9ce`.
- **Resolved owner defect:** `LATER-OWNER-012`.
- **Final record:** `docs/testing/results/M1_04_SESSION_AUTHORIZATION_CONTEXT_FINAL_OWNER_ACCEPTANCE.md`.

### M1.04 internal subunit 3 — Tenant-Scoped Repository/Query/Command Guards

- **Status:** DONE — OWNER PASS — 5 August 2026.
- **Pull request:** #27.
- **Merge:** `f44d248f7da9bd815fdfbc869a3a7a374ad708e2`.
- **Final record:** `docs/testing/results/M1_04_TENANT_SCOPED_REPOSITORY_GUARDS_FINAL_OWNER_ACCEPTANCE.md`.

## Current brick

# M1.04 — Authorization and Tenant Isolation

**Status: IN PROGRESS**

M1.04 is the only permitted implementation brick. M1.05 is blocked.

### Canonical completion requirement

Permission model, Company scoping, tenant-bound query/command guards and permanent security tests.

### Internal subunit 1 — Authorization domain and tenant schema foundation

**Status: DONE — OWNER PASS**

Accepted boundary includes wildcard-free permission matrices, opaque tenant/membership identities, lifecycle denial, one current Company membership, SQL role ceilings, self-grant rejection and reversible migration `0005`.

### Internal subunit 2 — Session authorization context and permission checks

**Status: DONE — OWNER PASS**

Accepted boundary includes fail-closed session/account/role resolution, one trusted Company tenant context, central server-only permission guards, non-enumerating denials and fixed-role signed-out routing.

### Internal subunit 3 — Tenant-scoped repository/query/command guards

**Status: DONE — OWNER PASS**

Accepted boundary includes permission-bound principals, direct tenant predicates in all neutral fixture SQL, no browser tenant selector, transactional authority revalidation, non-enumerating cross-tenant results, scoped uniqueness/versioning/concurrency and reversible migration `0006`.

### Internal subunit 4 — Company-scope bootstrap fixtures and protected demonstration surfaces

**Status: IMPLEMENTATION MERGED — AUTOMATED PASS — OWNER TEST PENDING**

- Pull request: #28.
- Validated head: `d7999d50763775bc97d433451db869abbdfdc809`.
- Merge: `752e6cec8b7e83981cece5113748c8c48e52d52d`.
- PR gate: run `31031974398`, job `92394756813`, artifact `8941090250` — PASS.
- Merged-main gate: run `31032355746`, job `92395916146` — PASS.
- Pending-owner record: `docs/testing/results/M1_04_COMPANY_SCOPE_DEMONSTRATION_MERGED_PENDING_OWNER.md`.
- Owner guide: `docs/testing/M1_04_COMPANY_SCOPE_DEMONSTRATION_HARD_TEST.md`.

Merged boundary:

1. deterministic synthetic Company tenant/account/membership/session bootstrap for disposable tests;
2. protected Company route `/company/tenant-scope` linked from the Company dashboard;
3. central current-tenant read/write permission checks;
4. tenant-scoped list/create/update/delete using the accepted subunit 3 repository and command guard;
5. no client tenant, membership, role, permission, ownership or scope selector;
6. non-enumerating missing/cross-tenant behavior;
7. two-tenant isolation, independent tenant uniqueness and stale-membership tests;
8. empty/loading/validation/pending/conflict/failure/confirmation/success states;
9. create/update/delete visible without manual browser refresh;
10. signed-out development and preview route smoke;
11. one consolidated Company/Worker owner handoff;
12. no later Company business domain built early.

Acceptance boundary:

- Subunit 4 is not accepted until the owner completes the generated Company CRUD/no-refresh and Worker copied-route workflow, clean shutdown and clean synchronized Git state.
- Subunit 5 remains blocked.

### Remaining M1.04 internal order

4. Company-scope bootstrap fixtures and protected demonstration surfaces — **implementation merged; automated PASS; owner test pending**.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and final M1.04 owner acceptance — **BLOCKED**.

### M1.04 non-negotiable controls

- UI visibility is never the permission boundary.
- Tenant identity comes from trusted membership/session context, never client input.
- Repository reads and writes include tenant scope directly in SQL.
- Fetch-global-then-filter is prohibited.
- Cross-tenant denials reveal no record existence or protected fields.
- Company users cannot grant permissions they do not possess.
- Root emergency capability does not imply routine Company tenant access.
- Demonstration data remains synthetic and neutral.
- Security denials remain recorded through the existing authentication security-event boundary until M1.05 adds the full audit engine.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | DONE | Compatibility override maintenance under `LATER-044`. |
| M1.02 | Design system and global UX | DONE | Accepted 2 August 2026. |
| M1.03 | Authentication and portal isolation | DONE | Accepted 4 August 2026. |
| M1.04 | Authorization and tenant isolation | IN PROGRESS | Subunits 1–3 accepted; subunit 4 owner gate and subunit 5 final cumulative security acceptance remain. |
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

1. Owner-accept M1.04 subunit 4.
2. Complete and owner-accept M1.04 subunit 5 and the whole M1.04 brick.
3. Complete M1.05 through M1.12 in order.
4. Pass the complete Milestone 1 exit test.
5. Begin Milestone 2 only after Milestone 1 is DONE.

## Canonical roadmap

### Milestone 1 — Platform Foundation, Identity and Company Trust

M1.01 through M1.12 remain frozen in the master specification.

**Exit gate:** a Worker can securely register, verify contact information, submit identity/evidence, receive a permanent Worker ID, join a verified Company and appear in its directory. Portal isolation, tenant isolation, audit and secure uploads must pass security testing.

### Milestone 2 — Assurance, Assessments, Review and Interviews

M2.01 through M2.15 remain frozen. They include Assurance Cases, evidence verification, frameworks/effective policy, MCQ and written Question Bank, randomized non-repeating forms, one-question assessment delivery, answer persistence/recovery, integrity monitoring, review, interviews, decisions, appeals and credential issuance.

### Milestone 3 — Operations, Billing, Intelligence and Production Launch

M3.01 through M3.10 remain frozen. They include reassessment/renewal, payments/payouts, subscriptions, finance, reporting, advanced administration, compliance hardening, performance/accessibility and production activation.
