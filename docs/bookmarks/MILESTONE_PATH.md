# Bookmark: Milestone Path

## Authority

This file is the permanent build-order and acceptance record for HSE Verify Phase 1.

The controlling source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, chats and summaries may explain intent but do not override that specification.

No pull request, implementation note or assistant-created next-step file may silently change this path.

## Status meanings

- **DONE** — implementation, automated validation and owner hard test all passed.
- **IMPLEMENTED — OWNER TEST PENDING** — code and CI are complete, but owner acceptance is not complete.
- **IMPLEMENTED — OWNER RETEST REQUIRED** — an owner test found a defect; repair may pass CI, but the brick remains blocked until targeted owner retest passes.
- **PARTIAL** — only part of the canonical brick exists.
- **IN PROGRESS** — active build branch or pull request without complete validation.
- **NOT STARTED** — canonical brick has not begun.

## Accepted owner gates

### Worker Dashboard and Worker Profile vertical slice

**OWNER HARD TEST: PASS — 2 August 2026**

Accepted units:

- Worker Dashboard foundation.
- Worker Profile and onboarding continuation.
- Profile refresh and server-restart persistence in the then-current adapter.
- Stale-form conflict behavior.
- Sensitive-field correction-request boundary.

These accepted units remain part of M1.07, but M1.07 remains PARTIAL until the complete Identity Engine and onboarding exit conditions pass.

### M1.01 — Repository, environments and CI/CD

**OWNER HARD TEST: PASS — 2 August 2026**

**Status: DONE**

Accepted repair history:

- PR #5 / `46952ab2dac05b2660f6c6a1586f38e2b9b5ab65`: validated environments, PGlite/PostgreSQL adapters, migrations, database-backed Worker Profiles, safe import, standalone preview, release manifest and rollback candidate;
- PR #6 / `e54d21fa2066d9db7bf05486df4a6d493092857d`: Windows-native PGlite path handling, shared CLI/application resolution, protected existing-database runtime regression and correct root error boundaries;
- PR #7 / `961589fff8b173b967fd1d613a4cc74c663ccc31`: visible Profile controls, keyboard focus/error states, PostCSS/Sharp security overrides, deterministic security floors and production audit gate.

`LATER-OWNER-001` and `LATER-OWNER-002` remain in resolved history. `LATER-044` remains the explicit compatibility-override maintenance obligation.

## Current owner gate

### M1.02 — Design System and Global UX

**Status: IMPLEMENTED — OWNER RETEST REQUIRED**

Pull request #8 was squash-merged as `ddd3bccc40a4176b394c138d2d12a3fdf2f3a767` and implements:

- shared semantic colour, spacing, radius, shadow, control, focus, motion and z-index tokens;
- shared buttons, fields, inputs, selects, textareas, checkboxes, alerts, badges, cards, empty states and loading states;
- accessible reusable data-table primitives;
- labelled confirmation dialog and real sign-out action;
- mobile Worker navigation;
- hover, focus-visible, disabled, error, contrast, forced-colour and reduced-motion behavior;
- live adoption across Worker login, statuses, Profile history and sign-out;
- permanent design-system architecture checks and owner responsive/accessibility testing.

Windows owner testing has found five release-blocking defects. M1.02 remains blocked until all repairs are owner-retested and every unfinished browser/accessibility section passes.

### LATER-OWNER-003 — Windows preview bundle portability

The first Windows preview test failed because recursive copying attempted a privileged traced PGlite symbolic link and returned `EPERM`. PR #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1` and materializes traced packages as ordinary files, rejects remaining links, verifies PGlite, checks `/` plus `/worker/login`, cleans partial bundles and proves shutdown.

### LATER-OWNER-004 — runtime smoke and production output collision

The next Windows `npm run check` passed standalone TypeScript and protected PGlite runtime, then production build failed on partial `.next/dev/types/validator.ts` with `Cannot find name 'er'`. PR #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17` and isolated runtime output, terminated the Windows process tree, cleaned stale development types and added the exact malformed-validator regression.

### LATER-OWNER-005 — automated gate left tracked source dirty

After PR #10, the full gate passed but Git still reported tracked `next-env.d.ts` and `tsconfig.json` modified. PR #11 was squash-merged as `36e1cfc9c5395cffbce330c56cfbbe19fca4871a` and replaced automated type generation, protected runtime smoke, production build and generated-output lifecycle:

1. `next-env.d.ts` became generated, ignored and untracked.
2. Root TypeScript config used committed stable values.
3. Type generation used `.next-typecheck`.
4. Runtime smoke used `.next-runtime-smoke`.
5. Production alone used `.next`.
6. Automated modes used ignored generated configs under `.hse-next`.
7. Package, lockfile, Next config and root TypeScript config were hashed before and after automated commands.
8. Protected mutation failed the command.
9. Obsolete partial-cleanup code was removed.
10. Four architecture/mode/mutation/cleanup regressions entered the trusted gate.

Final PR #11 source head `c8d59a9b1ee97ec9d72f5c77484f33c4505b4527` / merge head `27a4989dc27720fe0cda5643f993ccf05ac3ac0a` passed workflow `30743937853`, job `91486183017`. Artifact ID `8832238865`, 1,630 files, 20,139,143 bytes, SHA-256:

```text
a8992880f78b3171015f242f9c778ab6d96481d3ad5c606586935ba9db818228
```

### LATER-OWNER-006 — ordinary development rewrote tracked `tsconfig.json`

During the PR #11 Windows retest on Node.js `v22.23.1`, the owner started the real application with `npm run dev`, opened Worker routes, stopped the server and ran:

```cmd
git diff -- tsconfig.json package.json package-lock.json next.config.ts
```

Git showed tracked root `tsconfig.json` reformatted and changed from `"jsx": "preserve"` to `"jsx": "react-jsx"`.

The LF-to-CRLF warning was not the release blocker. The substantive tracked configuration mutation was.

Root cause: PR #11 protected automated typecheck/runtime/build commands, but `package.json` still mapped normal development directly to raw `next dev`. The ordinary developer path still used tracked root `tsconfig.json` and had no real route/start/stop cleanliness regression.

### Pull request #12 — protected normal development

PR #12 was squash-merged as `4f04a525f39f203f6def7915647c68a6718303a8` and added the missing ordinary-development boundary:

1. `npm run dev` invokes `node scripts/run-development.mjs`; raw `next dev` is prohibited by regression.
2. Normal development uses `.next-development`.
3. Next receives `.hse-next/development/tsconfig.json`, never tracked root `tsconfig.json`.
4. Development, typecheck, runtime smoke and production build use separate generated-config subdirectories.
5. Generated configs exclude other outputs but never exclude their own route types.
6. `.next-development` is ignored by Git and ESLint.
7. The runner hashes `package.json`, `package-lock.json`, `next.config.ts` and `tsconfig.json` before startup and after shutdown.
8. Ctrl+C triggers complete Windows process-tree shutdown.
9. Protected source mutation fails the development command.
10. `.next-development` and `.hse-next/development` are removed on success, signal and failure.
11. A new `test:development` starts the same real development runner, requests `/worker/login`, requires HTTP 200, shuts down and verifies clean source state.
12. The full `npm run check` exercises normal development before protected PGlite runtime and production build.
13. Shutdown timeouts are cleared when processes exit so completed tests do not keep Node alive unnecessarily.

Final PR #12 source head `bb8aad20f7dd5a20201d05deef9b735977ca0101` / merge head `ee8d11311ea7f8e22e6a0d36e64438708a44d8da` passed workflow `30745665336`, job `91490717539`. Artifact ID `8832793543`, 1,630 files, 20,139,133 bytes, SHA-256:

```text
e2f5ef4ca9150f385f16c165378538c06f49ac80e5219086ac8cf05338cdfbc1
```

### LATER-OWNER-007 — Worker Profile page-wide horizontal overflow

The owner then tested commit `362793d` on Windows 10, Node.js `v22.23.1` and Google Chrome at normal desktop width and 100% zoom.

At `/worker/profile`:

- the document gained a page-wide horizontal scrollbar;
- the main Profile layout extended beyond the browser’s right edge;
- the Ready to submit panel was clipped;
- the Submit profile button was partly outside the visible viewport;
- horizontal document scrolling moved the complete application and sidebar off screen;
- header controls and Profile cards were not contained;
- `Ctrl+0` and `Ctrl+F5` did not change the defect.

Review found that Profile media queries used full viewport width even though desktop Profile receives the viewport minus the 260px sidebar and portal padding. The Profile action track also used a fixed 300px minimum, while shell/Profile/table descendants did not all have a zero minimum inline size.

### Pull request #13 — shell and Profile width-model rewrite

PR #13 repairs the complete responsive chain:

1. A dedicated shell-containment stylesheet loads before Profile styles.
2. Portal shell, sidebar, main column, header, content and direct content children receive explicit width/shrink containment.
3. The repair does not hide overflow on `body` or the whole portal shell.
4. Worker Profile becomes a named inline-size container.
5. The editor/action layout uses `minmax(0, 1fr) minmax(16rem, 22rem)` instead of a fixed 300px minimum.
6. Summary, editor/action layout and aside stack at a 62rem Profile-container width.
7. Steps, facts, fields and actions stack at a 46rem Profile-container width.
8. Cards, forms, fields, headings, status copy and action descendants are bounded to their available width.
9. Ready to submit and Submit profile controls remain inside the action card.
10. Profile history clips its card boundary while the table wrapper alone receives horizontal scrolling.
11. Intrinsic 36rem table width cannot propagate into page width.
12. Viewport media-query fallbacks remain.
13. `test:profile-overflow` enters the permanent full gate.

The new overflow suite validates:

- shell/Profile shrink containment;
- table-only horizontal scrolling;
- bounded action controls;
- normal desktop, 860px, 768px, 390px, 320px and 125%/150%/200% zoom transition before clipping.

The first complete PR #13 implementation run passed workflow `30747176028`, job `91494637373`, including all four overflow contracts, the full application gate, normal-development HTTP smoke, protected PGlite runtime, deterministic production build, portable preview and artifact upload. Final documented-head validation remains required before merge.

### Mandatory owner acceptance

The owner must pass:

- `docs/testing/M1_02_DEVELOPMENT_CONFIG_RETEST.md`;
- `docs/testing/M1_02_PROFILE_OVERFLOW_RETEST.md`;
- unfinished sections of `docs/testing/M1_02_FULL_REWRITE_RETEST.md`;
- every unfinished section of `docs/testing/M1_02_DESIGN_SYSTEM_HARD_TEST.md`.

The Profile overflow retest must report no document-wide horizontal scrollbar at normal desktop, 860px, 768px, 390px, 320px and 125%/150%/200% zoom. Sidebar, header, Profile cards, Ready to submit and Submit profile must remain contained. Only the Profile history table may scroll horizontally inside its own region.

The final Windows gate must also prove clean tracked source after automated and manual normal development, isolated type generation, the complete application gate, protected runtime, production build and repeated portable preview. No Administrator privileges or Developer Mode may be required.

M1.02 cannot receive DONE until the owner reports **Overall: PASS**. M1.03 remains blocked.

## Current Milestone 1 status

| Brick | Capability | Status | Remaining acceptance requirement |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | DONE | Owner accepted on 2 August 2026. Compatibility override maintenance remains tracked by LATER-044. |
| M1.02 | Design system and global UX | IMPLEMENTED — OWNER RETEST REQUIRED | Pass focused normal-development and Profile-overflow retests, remaining full rewrite/preview checks and all browser/accessibility acceptance. |
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
