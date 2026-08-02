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

### M1.01 Windows PGlite application runtime repair

**TARGETED OWNER RETEST: FUNCTIONAL PATH PASSED — 2 August 2026**

The owner preserved the migrated Windows PGlite database, completed the repair process, loaded the Worker Profile, filled the complete form and confirmed that it saved. No repeated path/URL TypeError, `ProfileStorageConfigurationError`, white screen or nested `<html>/<body>` error was reported. `LATER-OWNER-001` is retained in resolved history.

The same owner pass found two final M1.01 follow-ups:

1. Worker Profile controls had no clear visible boxes, forcing the owner to guess where to type (`LATER-OWNER-002`).
2. `npm ci` succeeded but npm reported three high-severity production-path transitive advisories through Next.js (`LATER-044` records the compatibility override lifecycle).

## Current owner gate

### M1.01 — Repository, environments and CI/CD

**Status: IMPLEMENTED — FINAL UI/SECURITY OWNER RETEST REQUIRED**

Pull request #5 was merged as commit `46952ab2dac05b2660f6c6a1586f38e2b9b5ab65` and implemented:

- validated development, test, preview and production configuration;
- PGlite local/CI database without Docker;
- PostgreSQL adapter for preview/production;
- deterministic migrations with checksums;
- database-backed Worker Profile persistence;
- safe legacy profile import;
- standalone preview build and route smoke test;
- release evidence manifest;
- exact-ref rollback-candidate workflow;
- environment, migration, concurrency and rollback tests;
- detailed owner hard-test procedure.

Pull request #6, merged as `e54d21fa2066d9db7bf05486df4a6d493092857d`, repaired Windows PGlite application path handling and the nested-document error boundary. The owner’s functional Windows retest passed.

Pull request #7 is the final M1.01 repair gate and adds:

- visible Worker Profile input, date, number, select and textarea boundaries;
- hover, keyboard-focus, disabled, placeholder and validation-error states;
- checkbox, action-feedback and responsive form styling;
- a permanent profile UX architecture regression;
- explicit PostCSS `8.5.18` and Sharp `0.35.3` compatibility overrides;
- deterministic minimum-version checks against the lockfile;
- a production dependency audit inside the trusted `npm run check` gate;
- a Later entry preventing silent removal of overrides before Next.js resolves patched compatible transitive versions.

M1.01 receives DONE only after PR #7 is merged and the owner confirms visible form controls, keyboard focus, successful save/refresh/restart persistence, successful `npm ci`, zero high production audit findings, and a passing `npm run check`.

## Current Milestone 1 status

| Brick | Capability | Status | Remaining acceptance requirement |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | IMPLEMENTED — FINAL UI/SECURITY OWNER RETEST REQUIRED | Pass the focused profile-control and dependency-security retest after PR #7. |
| M1.02 | Design system and global UX | PARTIAL | Shared portal-wide tokens, components, dialogs, tables, forms, responsive rules and accessibility tests. The Worker Profile control repair is an accepted precursor, not completion of M1.02. |
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

1. Owner-accept the final M1.01 UI/security repair.
2. Finish and owner-accept M1.02.
3. Finish and owner-accept M1.03.
4. Finish and owner-accept M1.04.
5. Finish and owner-accept M1.05.
6. Finish and owner-accept M1.06.
7. Resume and complete M1.07.
8. Continue M1.08 through M1.12 in order.
9. Pass the full Milestone 1 exit test.
10. Start Milestone 2 only after Milestone 1 is DONE.

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
