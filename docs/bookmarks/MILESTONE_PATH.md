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

### M1.04 internal subunit 1 — Authorization Domain and Tenant Schema Foundation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- **Pull request:** #23.
- **Merge commit:** `f1479f72cf189b158144cb7f6afc77623bf40489`.
- **Final record:** `docs/testing/results/M1_04_AUTHORIZATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`.

### M1.04 internal subunit 2 — Session Authorization Context and Permission Checks

- **Status:** DONE — OWNER PASS — 5 August 2026.
- **Implementation pull request:** #24.
- **Implementation merge:** `ccbcf44a4781faa85f6d0ded446dc13d38bbed27`.
- **Repair pull request:** #25.
- **Repair merge:** `c100324ace9fea4495e1c4a50377a2df5d00a9ce`.
- **Resolved owner defect:** `LATER-OWNER-012`.
- **Final record:** `docs/testing/results/M1_04_SESSION_AUTHORIZATION_CONTEXT_FINAL_OWNER_ACCEPTANCE.md`.

### M1.04 internal subunit 3 — Tenant-Scoped Repository/Query/Command Guards

- **Status:** DONE — OWNER PASS — 5 August 2026.
- **Pull request:** #27.
- **Validated head:** `c26a6d1ef0564c6511f9575c39643779b539f5c2`.
- **Merge commit:** `f44d248f7da9bd815fdfbc869a3a7a374ad708e2`.
- **Final record:** `docs/testing/results/M1_04_TENANT_SCOPED_REPOSITORY_GUARDS_FINAL_OWNER_ACCEPTANCE.md`.
- **Accepted:** trusted tenant-permission binding, direct tenant predicates in every neutral fixture query/command, transactionally revalidated authority, non-enumerating cross-tenant results, scoped uniqueness/versioning/concurrency, independently reversible migration `0006`, Worker/Company visible regressions, clean shutdown and synchronized Git state.

## Current brick

# M1.04 — Authorization and Tenant Isolation

**Status: IN PROGRESS**

M1.04 is the only permitted implementation brick. M1.05 is blocked.

### Canonical completion requirement

Permission model, Company scoping, tenant-bound query/command guards and permanent security tests.

### Internal subunit 1 — Authorization domain and tenant schema foundation

**Status: DONE — OWNER PASS**

Accepted boundary:

- stable wildcard-free platform and tenant permissions;
- explicit least-privilege matrices;
- opaque tenant and membership identities;
- tenant/membership lifecycle states;
- one current Company membership context;
- SQL-enforced role ceilings and override constraints;
- non-Company, mismatch and inactive-state denial;
- self-grant rejection;
- reversible migration `0005` and complete regression coverage.

### Internal subunit 2 — Session authorization context and permission checks

**Status: DONE — OWNER PASS**

Accepted boundary:

- fail-closed session/account/role lifecycle resolution;
- fixed portal-entry permissions;
- one authoritative session-token context loader;
- trusted Company tenant/membership context;
- central server-only portal/platform/current-tenant guards;
- non-enumerating denials and security-event recording;
- missing-cookie pre-render redirects while database authorization remains authoritative;
- complete Windows owner regression and clean closure.

### Internal subunit 3 — Tenant-scoped repository/query/command guard contracts

**Status: DONE — OWNER PASS**

Accepted boundary:

- tenant-owned operations receive only a trusted permission-bound principal;
- tenant ID derives only from accepted current membership;
- direct tenant scope in reads, writes, existence, uniqueness, version and delete SQL;
- no client tenant/membership/role/permission/scope selector;
- no global fetch-then-filter or record-ID-only tenant lookup;
- non-enumerating missing/cross-tenant behavior;
- authorization and data operation share one transaction where races matter;
- scoped uniqueness, optimistic concurrency, stale-session/membership/permission tests;
- reversible migration `0006` and complete gate coverage.

### Internal subunit 4 — Company-scope bootstrap fixtures and protected demonstration surfaces

**Status: READY TO BUILD**

Required boundary:

1. deterministic synthetic Company-tenant fixtures for tests and demonstration only;
2. Company-only protected surface using the accepted central authorization and tenant-scoped repository layers;
3. no client-controlled tenant, membership, role, permission or scope;
4. neutral list/create/update/delete demonstration operations with explicit empty, validation, success and safe failure states;
5. same-tenant success and cross-tenant denial through pages, actions and direct requests;
6. no manual refresh requirement after successful actions;
7. no early Company registration, settings, sites, departments, team, workers, invitations, evidence, notifications, assessments or billing;
8. complete affected/full engineering gate and exact owner handoff.

Exact implementation gate:

```text
docs/NEXT_BUILD_UNIT.md
```

### Remaining M1.04 internal order

4. Company-scope bootstrap fixtures and protected demonstration surfaces — **READY TO BUILD**.
5. Complete cross-role/cross-tenant direct-endpoint/concurrency suite, migration rollback and final M1.04 owner acceptance — **BLOCKED**.

### M1.04 non-negotiable controls

- UI visibility is never the permission boundary.
- Tenant identity comes from trusted membership/session context, never client input.
- Repository reads and writes include tenant scope in the database query.
- Fetch-global-then-filter is prohibited.
- Cross-tenant denials reveal no record existence or protected fields.
- Company users cannot grant permissions they do not possess.
- Root emergency capability does not imply routine Company tenant access.
- Security denials remain recorded through the existing authentication security-event boundary until M1.05 adds the full audit engine.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | DONE | Compatibility override maintenance under `LATER-044`. |
| M1.02 | Design system and global UX | DONE | Accepted 2 August 2026. |
| M1.03 | Authentication and portal isolation | DONE | Accepted 4 August 2026. |
| M1.04 | Authorization and tenant isolation | IN PROGRESS | Subunits 1–3 accepted; protected Company demonstration and final security matrix remain. |
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
