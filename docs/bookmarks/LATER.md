# Bookmark: Later

## Purpose

This bookmark records every canonical feature, dependency or acceptance requirement that is not fully complete and owner-accepted.

“Later” never means forgotten, optional or silently removed. An entry remains required unless the owner explicitly changes the frozen Phase 1 scope.

## Mandatory rule

Before merge, any requirement that is missing, partial, implemented only as an adapter, blocked by credentials, represented without its real workflow, postponed by a prerequisite or discovered during testing must be recorded here.

Resolved entries are moved to resolved history; they are never deleted.

## Status meanings

- **Deferred prerequisite** — required before a dependent feature may continue.
- **Implementation complete — owner test pending** — code/CI exist but acceptance is not complete.
- **Development adapter** — real local behavior exists but production adapter/activation remains.
- **Provider blocked** — workflow/adapter must exist, but activation needs external credentials or service.
- **Compatibility override** — a tested explicit dependency override is active until the parent package publishes a compatible patched dependency.
- **Not started** — canonical work has not begun.
- **Partial** — some behavior exists but the canonical workflow is incomplete.
- **Owner defect** — found through owner hard testing and awaiting correction.
- **Owner defect — implementation fixed, retest pending** — a repair and automated regression exist, but the owner must repeat the failed path before the defect can move to resolved history.
- **Resolved** — automated and owner acceptance passed; retained below.

## Open Later register

| ID | Brick | Requirement | Status | Why still open | Completion target |
|---|---|---|---|---|---|
| LATER-004 | M1.02 | Portal-wide design system | Implementation complete — owner retest required | PR #8 implements shared tokens, reusable controls, live route adoption, mobile navigation, dialog/table contracts and automated validation. Windows owner tests found `LATER-OWNER-003` through `LATER-OWNER-007` in preview portability, generated-output isolation, tracked source determinism, the ordinary development command and Worker Profile page-width containment. | Close after `docs/testing/M1_02_DEVELOPMENT_CONFIG_RETEST.md`, `docs/testing/M1_02_PROFILE_OVERFLOW_RETEST.md`, the remaining sections of `docs/testing/M1_02_FULL_REWRITE_RETEST.md` and all M1.02 browser/accessibility sections report Overall PASS. |
| LATER-005 | M1.03 | Real Worker registration | Not started | Current access uses environment-gated demonstration credentials. | Complete in M1.03. |
| LATER-006 | M1.03 | Mandatory email OTP | Not started | No persisted OTP workflow exists. | Complete in M1.03 with expiry, hashing, limits and resend controls. |
| LATER-007 | M1.03 | Mandatory phone OTP | Not started | No persisted SMS OTP adapter/workflow exists. | Build sandbox workflow in M1.03; production activation tracked by LATER-036. |
| LATER-008 | M1.03 | Password reset, recovery and account lifecycle | Not started | Demo authentication has no production account lifecycle. | Complete in M1.03. |
| LATER-009 | M1.03/M1.08 | Company registration and role-specific authentication | Not started | Only Worker demo access exists. | Authentication foundation in M1.03; Company verification in M1.08. |
| LATER-010 | M1.03 | Reviewer, assessor, administrator and root provisioning/MFA | Not started | Staff activation and portals do not exist. | Complete provisioning/guards in M1.03; operational modules later. |
| LATER-011 | M1.04 | Platform permission model | Not started | Worker guard exists, but full role/permission enforcement does not. | Complete in M1.04. |
| LATER-012 | M1.04 | Company tenant isolation | Not started | No Company tenant model or query guard exists. | Complete before Company data modules. |
| LATER-013 | M1.04 | Cross-role/cross-tenant direct-endpoint security suite | Partial | Worker-only checks exist; the full portal matrix does not. | Complete and expand cumulatively in M1.04. |
| LATER-014 | M1.05 | Immutable platform audit engine | Partial | Profile-level audit exists; platform audit store does not. | Complete in M1.05. |
| LATER-015 | M1.05 | Transactional outbox/background jobs | Not started | Notifications/providers are not durably queued. | Complete in M1.05. |
| LATER-016 | M1.05 | Persisted in-app notifications and exact deep links | Partial | Dashboard has demonstration notifications only. | Complete in M1.05. |
| LATER-017 | M1.05 | Email queue, retries and delivery state | Not started | No email adapter/job state exists. | Build in M1.05; live provider tracked by LATER-035. |
| LATER-018 | M1.06 | Private object-storage adapter | Not started | Evidence upload has not begun. | Complete in M1.06. |
| LATER-019 | M1.06 | Independent upload state per form | Not started | Must prevent file leakage between identity, qualification, experience and skill forms. | Complete and regression-test in M1.06. |
| LATER-020 | M1.06 | PDF, PNG and JPEG validation | Not started | Extension, MIME, size and signature checks are absent. | Complete in M1.06. |
| LATER-021 | M1.06 | Quarantine and malware-scan state | Not started | No scanner contract or quarantine lifecycle exists. | Build adapter in M1.06; live service tracked by LATER-039. |
| LATER-022 | M1.06 | Signed short-lived preview/download | Not started | No evidence objects or authorized preview route exists. | Complete in M1.06. |
| LATER-023 | M1.07 | Identity metadata and front/back/supporting uploads | Not started | Worker Profile has no identity evidence. | Resume after M1.06. |
| LATER-024 | M1.07 | Profile photograph | Not started | No secure capture/upload workflow exists. | Complete in M1.07 using M1.06 pipeline. |
| LATER-025 | M1.07 | Liveness and degraded/manual fallback | Provider blocked | Adapter, consent and fallback are not built. | Build in M1.07; activate through LATER-038/M3.10. |
| LATER-026 | M1.07 | Duplicate-worker detection and controlled merge review | Not started | Current identity derives from demo session values. | Complete in M1.07. |
| LATER-027 | M1.07 | Permanent Worker ID issuance transaction | Partial | A demo Worker ID exists but no accepted-submission issuance transaction exists. | Complete in M1.07. |
| LATER-028 | M1.07/M2.02 | Identity verification states and retained versions | Not started | Profile correction requests exist, but identity submission/review history does not. | Complete Worker states in M1.07 and reviewer queue in M2.02. |
| LATER-029 | M1.08 | Company verification case | Not started | No tenant or Company verification workflow exists. | Complete in M1.08. |
| LATER-030 | M1.09 | Sites, departments and Company team scoped permissions | Not started | Company workspace is not implemented. | Complete in M1.09. |
| LATER-031 | M1.10 | Worker/staff invitations and Company codes | Not started | Invitation/token lifecycle does not exist. | Complete in M1.10. |
| LATER-032 | M1.11 | Qualification, experience, employment, skill and leaving-letter records | Not started | Dashboard only displays summary boundaries. | Complete integrated drafts/uploads/history in M1.11. |
| LATER-033 | M1.12 | Real public Worker/Credential verification and Report a Concern | Partial | Only configured demonstration public data exists. | Complete in M1.12. |
| LATER-035 | M1.05/M3.10 | Live email provider credentials | Provider blocked | Product must work with queued/sandbox delivery first. | Activate in M3.10 after delivery/security tests. |
| LATER-036 | M1.03/M3.10 | Live SMS/phone OTP credentials | Provider blocked | Requires approved sender/provider configuration. | Activate in M3.10 after sandbox OTP passes. |
| LATER-037 | M2.11–M2.12/M3.10 | Live video/interview provider | Provider blocked | Interview adapter/reconnect workflow is not built. | Build in M2; activate in M3.10. |
| LATER-038 | M1.07/M3.10 | Live liveness provider | Provider blocked | Consent, fallback and adapter must exist first. | Build in M1.07; activate in M3.10. |
| LATER-039 | M1.06/M3.10 | Live malware-scanning service | Provider blocked | Quarantine/scanner contract must exist first. | Build adapter in M1.06; activate in M3.10. |
| LATER-040 | M3.05/M3.10 | Live payment provider and signed webhooks | Not started / provider blocked | Billing is Milestone 3 and needs approved credentials. | Complete in M3.05 and activate in M3.10. |
| LATER-043 | M1.01/M3.10 | Live hosted preview URL and production traffic switching | Provider blocked | M1.01 produces and verifies a provider-neutral standalone artifact, but no hosting account/credentials or traffic controller are connected. | Connect approved hosting/traffic provider in M3.10; until then use local and GitHub artifact acceptance. |
| LATER-044 | M1.01/M3.10 | Remove explicit PostCSS and Sharp compatibility overrides when Next.js ships patched compatible transitive versions | Compatibility override | Next.js 16.2.12 pulled vulnerable PostCSS and Sharp versions. PR #7 pins PostCSS 8.5.18 and Sharp 0.35.3 and gates their minimum versions. The override must not be removed silently. | Remove only after an upgraded Next.js lockfile independently resolves patched versions and the full security/runtime/build gate passes. |
| LATER-045 | Current owner gate | M1.02 design-system responsive, accessibility, deterministic development/build and preview acceptance | Implementation complete — owner retest required | The owner passed the rewritten malformed-validator recovery and full application gate, then found tracked TypeScript configuration changes. PR #11 protected automated modes; PR #12 protected ordinary development. The next owner pass found page-wide horizontal overflow on Worker Profile. PR #13 rewrites shell/Profile width containment and adds permanent overflow contracts. Windows confirmation and remaining browser acceptance remain mandatory. | Close after `docs/testing/M1_02_DEVELOPMENT_CONFIG_RETEST.md`, `docs/testing/M1_02_PROFILE_OVERFLOW_RETEST.md`, the remaining full rewrite sections and all M1.02 browser checks report Overall PASS. |
| LATER-OWNER-003 | M1.02 | Windows standalone preview copy attempted a privileged PGlite symlink | Owner defect — implementation fixed, retest pending | On Windows/Node 22.23.1, `npm run preview:smoke` failed with `EPERM: operation not permitted, symlink` before `server.js` started. PR #9 materializes traced links as ordinary files, cleans partial bundles, verifies no links remain, verifies PGlite inclusion and adds a portable-copy regression. | Pass the preview sections in `docs/testing/M1_02_FULL_REWRITE_RETEST.md` from a normal Command Prompt with successful routes, clean repeatability, confirmed shutdown, no Administrator privileges and no Developer Mode. |
| LATER-OWNER-004 | M1.02 | Protected runtime smoke corrupted generated Next development types consumed by production build | Owner defect — implementation fixed, retest pending | On Windows/Node 22.23.1, `npm run check` passed standalone typecheck and every stage through `test:runtime-db`, then production build failed on `.next/dev/types/validator.ts` with `Cannot find name 'er'`. PR #10 isolated the runtime smoke; PR #11 replaces the whole automated mode/configuration/cleanup system so runtime and production can no longer share generated output. | Pass the full Windows rewrite retest with successful typegen, runtime smoke, production build, clean workspaces and preserved database. |
| LATER-OWNER-005 | M1.02 | Passing automated Next commands modified tracked TypeScript configuration | Owner defect — implementation fixed, retest pending | After PR #10, the owner’s malformed-validator recovery and complete `npm run check` passed, but `git status --short` showed modified `next-env.d.ts` and `tsconfig.json`. PR #11 stops tracking generated declarations, commits stable Next-compatible root configuration, generates ignored configs for typecheck/runtime/build, hashes protected files and replaces the automated subsystem plus regression suite. | Pass the remaining full rewrite retest with clean Git status and protected-file diff after automated typecheck, full check/build and repeated preview runs. |
| LATER-OWNER-006 | M1.02 | Ordinary `npm run dev` rewrote tracked root `tsconfig.json` | Owner defect — implementation fixed, retest pending | During the PR #11 Windows retest on Node 22.23.1, the owner started the normal development server, opened Worker routes, stopped it and found `tsconfig.json` reformatted with `jsx` changed from `preserve` to `react-jsx`. Root cause: `package.json` still invoked raw `next dev`, so the ordinary developer path bypassed the generated-config boundary. PR #12 replaces raw development with a protected runner, `.next-development`, `.hse-next/development/tsconfig.json`, Windows process-tree shutdown, post-Ctrl+C hash verification and a real HTTP development smoke inside `npm run check`. | Pass `docs/testing/M1_02_DEVELOPMENT_CONFIG_RETEST.md` on Windows with empty Git status/diff after automated and manual development, clean shutdown and no Administrator or Developer Mode requirement. |
| LATER-OWNER-007 | M1.02 | Worker Profile created page-wide horizontal overflow and clipped action controls | Owner defect — implementation fixed, retest pending | On Windows 10/Chrome/Node 22.23.1 at normal desktop width and 100% zoom, `/worker/profile` widened the document, moved the complete shell/sidebar during horizontal scrolling, clipped Ready to submit and left Submit profile partly outside the viewport. Root causes were viewport-based Profile breakpoints despite a fixed sidebar, a fixed 300px action-column minimum and incomplete shrink containment through shell/Profile/table ancestors. PR #13 introduces shell width containment, Profile container queries, a shrinkable 16rem–22rem action track, bounded controls, table-local scrolling and four permanent overflow contracts. | Pass `docs/testing/M1_02_PROFILE_OVERFLOW_RETEST.md` at normal desktop, 860px, 768px, 390px, 320px and 125%/150%/200% zoom with no document overflow and table-only horizontal scrolling. |

## Resolved history

### LATER-001, LATER-002, LATER-003 and LATER-034 — M1.01 platform foundation acceptance

- **Status:** Resolved.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated:** environment separation, database and migrations, database-backed Worker Profile storage, preview/release evidence, rollback boundary, Windows application runtime and persisted Profile save/restart behavior.
- **Relevant merges:** PR #5, PR #6 and PR #7.

### LATER-041 — Worker Dashboard and Worker Profile owner test

- **Status:** Resolved.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated units:** Worker Dashboard foundation and Worker Profile/onboarding continuation.
- **Merge commits:** `4836b6e66c9d4ac1140de4a08949008f64bc891a` and `9910d5eddfcd70b0780304efc1d01e575149b632`.

### LATER-042 and LATER-OWNER-002 — M1.01 visible controls and dependency security

- **Status:** Resolved by owner retest.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated:** visible Profile input/select/textarea/checkbox boundaries, keyboard focus, validation states, saved data persistence, locked dependency installation, secure PostCSS/Sharp versions, production audit and complete `npm run check`.
- **Repair merge:** `961589fff8b173b967fd1d613a4cc74c663ccc31` (PR #7).

### LATER-OWNER-001 — Windows PGlite application runtime and nested error document

- **Status:** Resolved by owner retest; retained for history.
- **Owner result:** The complete Worker Profile form loaded and saved successfully on Windows using the existing migrated PGlite database.
- **Accepted evidence:** The owner completed the repair process and reported that the full form could be filled and saved; no repeated path, `ProfileStorageConfigurationError`, white-screen or nested-document failure was reported.
- **Repair merge:** `e54d21fa2066d9db7bf05486df4a6d493092857d` (PR #6).

## Owner defect format

```text
ID: LATER-OWNER-###
Area:
Exact route or command:
Steps to reproduce:
Expected:
Observed:
Device/browser/OS:
Severity: release-blocking | high | medium | low
Target brick/fix:
Retest result:
```

Release-blocking examples include cross-role access, stale routes requiring refresh, lost profile/evidence data, wrong-record file attachment, dead controls, unsafe deletion, duplicate business actions, failed migration recovery, dirty tracked source after a supposedly deterministic command, page-wide horizontal overflow and unrecoverable stuck workflows.
