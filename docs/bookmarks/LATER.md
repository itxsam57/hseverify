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
- **Not started** — canonical work has not begun.
- **Partial** — some behavior exists but the canonical workflow is incomplete.
- **Owner defect** — found through owner hard testing and awaiting correction.
- **Resolved** — automated and owner acceptance passed; retained below.

## Open Later register

| ID | Brick | Requirement | Status | Why still open | Completion target |
|---|---|---|---|---|---|
| LATER-001 | M1.01 | Development/test/preview/production environment separation | Implementation complete — owner test pending | Environment validation and templates are implemented in PR #5, but owner rejection tests have not yet passed. | Close after M1.01 owner test Parts B–C pass. |
| LATER-002 | M1.01 | PostgreSQL-compatible database and migration baseline | Implementation complete — owner test pending | PGlite/PostgreSQL adapters, migrations and checksums are implemented; owner migration and persistence tests remain. | Close after M1.01 owner test Parts D–F pass. |
| LATER-003 | M1.01 | Preview artifact, release evidence and rollback candidate | Implementation complete — owner test pending | Standalone build, smoke test, manifest and rollback workflow exist; final artifact review and owner GitHub Actions test remain. | Close after final CI artifact review and M1.01 owner test Parts G–I. |
| LATER-004 | M1.02 | Portal-wide design system | Partial | Worker routes have styling, but shared tokens/components and accessibility contracts are incomplete. | Complete in M1.02. |
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
| LATER-022 | M1.06 | Signed short-lived preview/download | Not started | No evidence objects or authorized preview route exist. | Complete in M1.06. |
| LATER-023 | M1.07 | Identity metadata and front/back/supporting uploads | Not started | Worker Profile has no identity evidence. | Resume after M1.06. |
| LATER-024 | M1.07 | Profile photograph | Not started | No secure capture/upload workflow exists. | Complete in M1.07 using M1.06 pipeline. |
| LATER-025 | M1.07 | Liveness and degraded/manual fallback | Provider blocked | Adapter, consent and fallback are not built. | Build in M1.07; activate through LATER-038/M3.10. |
| LATER-026 | M1.07 | Duplicate-worker detection and controlled merge review | Not started | Current identity derives from demo session values. | Complete in M1.07. |
| LATER-027 | M1.07 | Permanent Worker ID issuance transaction | Partial | A demo Worker ID exists but no accepted-submission issuance transaction exists. | Complete in M1.07. |
| LATER-028 | M1.07/M2.02 | Identity verification states and retained versions | Not started | Profile correction requests exist, but identity submission/review history does not. | Complete Worker states in M1.07 and reviewer queue in M2.02. |
| LATER-029 | M1.08 | Company verification case | Not started | No tenant or Company verification workflow exists. | Complete in M1.08. |
| LATER-030 | M1.09 | Sites, departments, Company team and scoped permissions | Not started | Company workspace is not implemented. | Complete in M1.09. |
| LATER-031 | M1.10 | Worker/staff invitations and Company codes | Not started | Invitation/token lifecycle does not exist. | Complete in M1.10. |
| LATER-032 | M1.11 | Qualification, experience, employment, skill and leaving-letter records | Not started | Dashboard only displays summary boundaries. | Complete integrated drafts/uploads/history in M1.11. |
| LATER-033 | M1.12 | Real public Worker/Credential verification and Report a Concern | Partial | Only configured demonstration public data exists. | Complete in M1.12. |
| LATER-034 | M1.01 | Replace file-backed Worker Profile store | Implementation complete — owner test pending | Database repository and safe importer exist in PR #5; owner persistence/import tests remain. | Close after M1.01 owner test Parts E–F pass. |
| LATER-035 | M1.05/M3.10 | Live email provider credentials | Provider blocked | Product must work with queued/sandbox delivery first. | Activate in M3.10 after delivery/security tests. |
| LATER-036 | M1.03/M3.10 | Live SMS/phone OTP credentials | Provider blocked | Requires approved sender/provider configuration. | Activate in M3.10 after sandbox OTP passes. |
| LATER-037 | M2.11–M2.12/M3.10 | Live video/interview provider | Provider blocked | Interview adapter/reconnect workflow is not built. | Build in M2; activate in M3.10. |
| LATER-038 | M1.07/M3.10 | Live liveness provider | Provider blocked | Consent, fallback and adapter must exist first. | Build in M1.07; activate in M3.10. |
| LATER-039 | M1.06/M3.10 | Live malware-scanning service | Provider blocked | Quarantine/scanner contract must exist first. | Build in M1.06; activate in M3.10. |
| LATER-040 | M3.05/M3.10 | Live payment provider and signed webhooks | Not started / provider blocked | Billing is Milestone 3 and needs approved credentials. | Complete in M3.05 and activate in M3.10. |
| LATER-042 | Current owner gate | M1.01 Windows platform-foundation owner retest | Owner defect retest required before M1.02 | The initial M1.01 Windows test failed after successful migrations when the application opened the same PGlite database. | Pass `docs/testing/M1_01_WINDOWS_PGLITE_RETEST.md` after PR #6 is merged. |
| LATER-OWNER-001 | M1.01 | Windows PGlite application runtime path and nested error document | Owner defect — implementation fixed, retest pending | On Windows with Node 22.23.1 and Next.js 16.2.12/Turbopack, migrations succeeded but `/worker/dashboard` failed with a path/URL TypeError wrapped as `ProfileStorageConfigurationError`; `app/error.tsx` also mounted nested `<html>/<body>`. | PR #6 normalizes a native path string, externalizes PGlite, aligns CLI/application path handling, fixes error boundaries and adds an existing-database protected-route regression. Close only after the focused Windows owner retest passes with no reset or fallback. |
| LATER-043 | M1.01/M3.10 | Live hosted preview URL and production traffic switching | Provider blocked | M1.01 produces and verifies a provider-neutral standalone artifact, but no hosting account/credentials or traffic controller are connected. | Connect approved hosting/traffic provider in M3.10; until then use local and GitHub artifact acceptance. |

## Resolved history

### LATER-041 — Worker Dashboard and Worker Profile owner test

- **Status:** Resolved.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated units:** Worker Dashboard foundation and Worker Profile/onboarding continuation.
- **Merge commits:** `4836b6e66c9d4ac1140de4a08949008f64bc891a` and `9910d5eddfcd70b0780304efc1d01e575149b632`.
- **Reported owner defects:** None for this gate.

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

Release-blocking examples include cross-role access, stale routes requiring refresh, lost profile/evidence data, wrong-record file attachment, dead controls, unsafe deletion, duplicate business actions, failed migration recovery and unrecoverable stuck workflows.
