# Bookmark: Milestone Path

## Authority

This file is the permanent build-order and acceptance record for HSE Verify Phase 1.

The controlling source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, chats and summaries may explain intent but do not override that specification.

No pull request, implementation note or assistant-created next-step file may silently change this path.

## Status meanings

- **DONE** — implementation, automated validation and owner hard test all passed.
- **IMPLEMENTED — OWNER TEST PENDING** — code and CI are complete, but the brick does not yet receive DONE.
- **IMPLEMENTED — OWNER RETEST REQUIRED** — an owner test found a defect; the repair may pass CI, but the brick remains blocked until the targeted owner retest passes.
- **PARTIAL** — only part of the canonical brick exists.
- **IN PROGRESS** — active build branch or pull request without complete validation.
- **NOT STARTED** — canonical brick has not begun.

## Accepted owner gates

### Worker Dashboard and Worker Profile vertical slice

**OWNER HARD TEST: PASS — 2 August 2026**

Accepted units:

- Worker Dashboard foundation.
- Worker Profile and onboarding continuation.
- Profile refresh and server-restart persistence in the then-current development adapter.
- Stale-form conflict behavior.
- Sensitive-field correction-request boundary.

These accepted units remain part of M1.07, but M1.07 is still PARTIAL until the complete Identity Engine and onboarding exit conditions pass.

### M1.01 — Repository, environments and CI/CD

**OWNER HARD TEST: PASS — 2 August 2026**

**Status: DONE**

Accepted implementation and repair history:

- pull request #5 / `46952ab2dac05b2660f6c6a1586f38e2b9b5ab65`: validated environments, PGlite/PostgreSQL adapters, migrations, database-backed Worker Profiles, safe import, standalone preview, release manifest and rollback candidate;
- pull request #6 / `e54d21fa2066d9db7bf05486df4a6d493092857d`: Windows-native PGlite path handling, shared CLI/application resolution, protected existing-database runtime regression and correct root error boundaries;
- pull request #7 / `961589fff8b173b967fd1d613a4cc74c663ccc31`: visible Profile controls, keyboard focus and error states, PostCSS/Sharp security overrides, deterministic security floors and production audit gate.

Owner acceptance confirms:

- the migrated Windows PGlite database opens through the real protected application;
- Dashboard and Profile load without path, storage, hydration or nested-document failure;
- the complete Profile saves and survives refresh and server restart;
- controls, dropdowns, textareas, checkboxes, focus and validation states are visible;
- locked dependencies install successfully;
- the production audit reports no high-severity findings;
- the complete `npm run check` gate passes.

`LATER-OWNER-001` and `LATER-OWNER-002` remain in resolved history. The PostCSS/Sharp compatibility override lifecycle remains tracked by `LATER-044` and does not block M1.01 acceptance.

## Current owner gate

### M1.02 — Design System and Global UX

**Status: IMPLEMENTED — OWNER RETEST REQUIRED**

Pull request #8 was squash-merged as commit `ddd3bccc40a4176b394c138d2d12a3fdf2f3a767` and implements:

- shared semantic colour, spacing, radius, shadow, control, focus, motion and z-index tokens;
- shared buttons, fields, inputs, selects, textareas, checkboxes, alerts, status badges, cards, empty states and loading states;
- accessible reusable data-table primitives;
- native modal confirmation with labelled title/description and explicit cancel/confirm actions;
- a real mobile Worker navigation replacement for the desktop sidebar;
- consistent hover, focus-visible, disabled, error, high-contrast, forced-colour and reduced-motion behavior;
- live adoption in Worker login, Worker statuses, Profile history and sign-out;
- removal of duplicate legacy Profile stylesheet loading;
- permanent design-system architecture checks in `npm run check`;
- a step-by-step owner responsive and accessibility hard test.

The exact-head pull-request gate passed locked installation, environment and route validation, shared design-system and Profile UX checks, production dependency security, Profile and platform tests, TypeScript, ESLint, protected PGlite runtime, production build, Linux standalone preview and complete artifact upload.

### Owner defect LATER-OWNER-003 — Windows preview bundle copy

The Windows owner test used commit `ebb06e4` with Node.js `v22.23.1`. The application gate and production build passed, but `npm run preview:smoke` attempted to recreate a traced `@electric-sql/pglite` symbolic link inside `.preview-bundle`. Windows returned:

```text
EPERM: operation not permitted, symlink
```

Administrator Command Prompt produced the same failure.

Pull request #9 was squash-merged as commit `d849ec933f61c5296a3fc981ef57e470445f2ee1` and:

1. materializes traced package links as ordinary files/directories;
2. cleans incomplete preview bundles before and after failed attempts;
3. verifies `server.js`, static assets, PGlite inclusion and no remaining symbolic links;
4. retains real standalone `/` and `/worker/login` checks;
5. proves preview server shutdown;
6. adds a portable link/junction copy and repeatability regression.

The exact-head PR #9 gate passed the portable-copy regression, production build, portable PGlite bundle verification, successful route responses, server shutdown and artifact upload. Windows owner confirmation remains open.

### Owner defect LATER-OWNER-004 — runtime smoke and production output collision

During the focused Windows retest on Node.js `v22.23.1`, the owner ran `npm run check`.

The following passed:

- environment, route, design-system and UX checks;
- dependency security and production audit;
- Profile and platform tests;
- portable preview-copy regression;
- standalone TypeScript and ESLint;
- protected existing-database PGlite runtime smoke.

The final production build then failed at:

```text
.next/dev/types/validator.ts:89:1
Type error: Cannot find name 'er'.
er = {} as typeof import(...)
```

Standalone TypeScript had already passed before `test:runtime-db`. The malformed development validator was therefore created afterward when the runtime smoke launched `next dev` in the same `.next` directory later consumed by `next build`.

Pull request #10 repairs this boundary by:

1. validating an internal `HSE_NEXT_DIST_DIR` option;
2. running the protected runtime smoke in isolated `.next-runtime-smoke` output;
3. terminating the Windows runtime-smoke process tree;
4. removing isolated output with retry-safe cleanup;
5. cleaning stale `.next/dev` before standalone typecheck and production build;
6. forcing production build output back to the standard `.next` directory;
7. adding a regression containing the exact malformed `er = ...` validator;
8. proving development output is removed without deleting production `.next/types`;
9. committing Next.js's expected `.next/dev/types/**/*.ts` include so builds do not modify `tsconfig.json`;
10. adding the output-boundary regression to the permanent `npm run check` chain.

The first PR #10 exact-head repair gate passed the malformed-validator regression, cleanup before typecheck, isolated PGlite runtime smoke, production build after runtime smoke, portable preview bundle, successful `/` and `/worker/login`, preview shutdown and complete artifact upload.

M1.02 cannot receive DONE until PR #10 is merged and the owner passes `docs/testing/M1_02_RUNTIME_BUILD_RETEST.md`, including the resumed portable preview checks, plus any remaining uncompleted browser sections from `docs/testing/M1_02_DESIGN_SYSTEM_HARD_TEST.md`.

## Current Milestone 1 status

| Brick | Capability | Status | Remaining acceptance requirement |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | DONE | Owner accepted on 2 August 2026. Compatibility override maintenance remains tracked by LATER-044. |
| M1.02 | Design system and global UX | IMPLEMENTED — OWNER RETEST REQUIRED | Pass the Windows runtime/build/preview retest and remaining M1.02 browser acceptance. |
| M1.03 | Authentication and portal isolation | PARTIAL | Real registration, mandatory email and phone OTP, recovery, staff provisioning, MFA and every role guard. Demo Worker auth is not production auth. |
| M1.04 | Authorization and tenant isolation | NOT STARTED | Permission model, company tenancy, query/command guards, field visibility and cross-role/cross-tenant denial tests. |
| M1.05 | Audit and notification foundations | PARTIAL | Immutable audit store, outbox/jobs, persisted notifications, email queue, retries and delivery states. |
| M1.06 | Secure storage and upload pipeline | NOT STARTED | Private storage, isolated upload state, file validation, quarantine, scan adapter, signed preview/download and access audit. |
| M1.07 | Worker onboarding and Identity Engine | PARTIAL | Dashboard/Profile accepted; contact verification, identity evidence, photograph/liveness, duplicate detection, Worker ID issuance and review timeline remain. |
| M1.08 | Company registration and verification | NOT STARTED | Tenant creation, first administrator, company verification case and settings. |
| M1.09 | Sites, departments and team | NOT STARTED | Combined management, archival, staff invitations and scoped permissions. |
| M1.10 | Worker invitations and company codes | NOT STARTED | Single/bulk invites, codes, limits, defaults, funding responsibility and linking. |
| M1.11 | Employment, experience, qualification, skill and leaving-letter records | NOT STARTED | Integrated drafts, independent evidence uploads, verification states and retained history. |
| M1.12 | Public verification foundation | PARTIAL PROTOTYPE | Real Worker/Credential lookup, safe projection, concern reporting, rate limits and QR base. |

## Correct execution order

1. Owner-retest and accept M1.02.
2. Finish and owner-accept M1.03.
3. Finish and owner-accept M1.04.
4. Finish and owner-accept M1.05.
5. Finish and owner-accept M1.06.
6. Resume and complete M1.07.
7. Continue M1.08 through M1.12 in order.
8. Pass the full Milestone 1 exit test.
9. Start Milestone 2 only after Milestone 1 is DONE.

## Canonical three-milestone roadmap

### Milestone 1 — Platform Foundation, Identity and Company Trust

1. M1.01 Repository, environments and CI/CD.
2. M1.02 Design system and global UX.
3. M1.03 Authentication and portal isolation.
4. M1.04 Authorization and tenant isolation.
5. M1.05 Audit and notification foundations.
6. M1.06 Secure storage and upload pipeline.
7. M1.07 Worker onboarding and Identity Engine.
8. M1.08 Company registration and verification.
9. M1.09 Sites, departments and team.
10. M1.10 Worker invitations and company codes.
11. M1.11 Employment, experience, qualification, skill and leaving-letter records.
12. M1.12 Public verification foundation.

**Milestone 1 exit gate:** a Worker can securely register, verify email and phone, submit identity/evidence, receive a permanent Worker ID, join a verified Company and appear in its directory. Portal isolation, tenant isolation, audit and secure uploads must pass security testing.

### Milestone 2 — Assurance, Assessments, Review and Interviews

1. M2.01 Assurance Order and Case Engine.
2. M2.02 Evidence verification queues.
3. M2.03 Frameworks and Effective Policy.
4. M2.04 MCQ and written Question Bank, rubrics, approval, versioning and retirement.
5. M2.05 Randomized assessment generation with exposure history and non-repetition while unseen alternatives exist.
6. M2.06 Assessment catalogue, eligibility, attempts, waiting, assignment and funding.
7. M2.07 Candidate assessment window with one-question delivery, answer-before-next and emergency exit.
8. M2.08 Answer persistence and interruption recovery with auto-save, offline buffer, idempotent submission and replacement forms.
9. M2.09 Integrity Engine with camera, microphone, screen/browser events, classification and degraded mode.
10. M2.10 Written scoring and Review Engine with rubrics, human authority, conflicts and calibration.
11. M2.11 Interview scheduling and candidate-specific assignment.
12. M2.12 Interview console and structured playbook.
13. M2.13 Decision Engine with reasons, states, overrides and audit.

**Milestone 2 exit gate:** an eligible Worker completes a unique monitored assessment, retains written answers through interruption, passes human review, attends a structured interview and receives an auditable decision.

### Milestone 3 — Credentials, Enterprise Operations and Production Readiness

1. M3.01 Credential and QR issuance.
2. M3.02 Digital Passport and Living Record.
3. M3.03 Scoped share links.
4. M3.04 Company Action Centre and analytics.
5. M3.05 Billing and subscriptions.
6. M3.06 Reports and delivery.
7. M3.07 Appeals, renewal, suspension and revocation.
8. M3.08 Administrative operational completeness.
9. M3.09 Privacy and accessibility operations.
10. M3.10 Production integrations.
11. M3.11 Load, security and recovery certification.
12. M3.12 Production launch and operational handover.

**Milestone 3 exit gate:** the complete Phase 1 product works end to end with credentials, Company operations, billing, reports, administration, provider activation or truthful disabled modes, security/load/recovery certification, runbooks and final release acceptance.

## Definition of Done for every brick

A brick is not DONE merely because a page renders or CI compiles. It must include:

1. Traceability to the canonical requirement and workflow.
2. Role, permission, tenant and field-visibility rules.
3. Data model, states, versions and preservation rules.
4. Security and privacy threat review.
5. Server commands, queries and contracts.
6. UI routes and every working control.
7. Loading, success, empty, error and conflict states.
8. Audit, notification, job and provider consequences.
9. Appropriate unit, contract, integration, route, security, accessibility and responsive tests.
10. Passing automated CI and production build evidence.
11. Step-by-step owner hard-test instructions.
12. Owner hard-test PASS and defect retest.
13. Updated Milestone Path, Later bookmark and engineering documentation.

## Mandatory update rule

Every feature pull request must update this file with:

- active brick;
- status change;
- automated validation result;
- owner test state;
- exact next dependency;
- any explicit owner-approved deviation.

Silent roadmap changes are prohibited.
