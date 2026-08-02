# Bookmark: Later

## Purpose

This bookmark records every canonical feature, dependency or acceptance requirement that is not fully complete and owner-accepted.

“Later” never means forgotten, optional or silently removed. An entry remains required unless the owner explicitly changes the frozen Phase 1 scope.

Resolved entries move to resolved history; they are never deleted from project memory.

## Status meanings

- **Deferred prerequisite** — required before a dependent feature may continue.
- **Implementation complete — owner test pending** — code and automated evidence exist, but owner acceptance is incomplete.
- **Development adapter** — local behavior exists while production activation remains.
- **Provider blocked** — the workflow/adapter must exist, but activation needs external credentials or service approval.
- **Compatibility override** — a tested dependency override remains until the parent dependency supplies a safe compatible version.
- **Not started** — canonical work has not begun.
- **Partial** — some behavior exists, but the required workflow is incomplete.
- **Owner defect** — found through owner hard testing and awaiting correction.
- **Resolved** — implementation, automated validation and required owner acceptance passed.

## Open Later register

| ID | Brick | Requirement | Status | Why still open | Completion target |
|---|---|---|---|---|---|
| LATER-005 | M1.03 | Real Worker registration | Partial | PR #15 adds persistent accounts, Worker role assignment, provisional registration references and atomic transaction support, but no registration screen or activation state machine is connected yet. | Complete Worker registration and owner-test the full activation flow in M1.03. |
| LATER-006 | M1.03 | Mandatory email OTP | Partial | PR #15 adds hashed, expiring, attempt-limited and replay-safe email challenge state plus cryptographic tests; sandbox delivery, resend and verification actions remain. | Complete delivery, resend, verification, refresh/restart recovery and owner testing in M1.03. |
| LATER-007 | M1.03 | Mandatory phone OTP | Partial | PR #15 adds the persisted phone challenge model and secure OTP primitives; no SMS sandbox adapter or activation flow is connected. | Build and owner-test the sandbox phone workflow in M1.03; live activation remains under LATER-036. |
| LATER-008 | M1.03 | Password reset, recovery and account lifecycle | Partial | PR #15 adds scrypt password hashing, lifecycle/lockout columns, revocable sessions and transactional repository operations; sign-in/reset/recovery workflows remain. | Complete and owner-test password creation, login, reset, recovery, lockout and session revocation in M1.03. |
| LATER-009 | M1.03/M1.08 | Company registration and role-specific authentication | Partial | PR #15 adds the six-role registry, explicit account roles and separate login/home route contracts; role login screens and protected portal layouts are not connected. | Finish authentication and portal isolation in M1.03; Company verification remains M1.08. |
| LATER-010 | M1.03 | Verifier, assessor, administrator and root provisioning/MFA | Partial | PR #15 adds staff invitation state, encrypted TOTP factors, mandatory-MFA classification and replay-safe TOTP primitives; invitation acceptance, enrollment and guarded portals remain. | Complete provisioning, TOTP enrollment/login and direct-route guards in M1.03. |
| LATER-011 | M1.04 | Platform permission model | Not started | Worker-only guards exist, but complete role/permission enforcement does not. | Complete in M1.04. |
| LATER-012 | M1.04 | Company tenant isolation | Not started | No Company tenant model or query guard exists. | Complete before Company data modules. |
| LATER-013 | M1.04 | Cross-role/cross-tenant direct-endpoint security suite | Partial | Worker-only checks and M1.03 role route contracts exist; the complete live portal and tenant matrix does not. | Complete role denial in M1.03 and expand to tenant denial in M1.04. |
| LATER-014 | M1.05 | Immutable platform audit engine | Partial | Profile audit behavior and M1.03 authentication-specific security events exist; the complete immutable platform audit store does not. | Complete in M1.05 without replacing or weakening authentication events. |
| LATER-015 | M1.05 | Transactional outbox/background jobs | Not started | Notifications and provider actions are not durably queued. | Complete in M1.05. |
| LATER-016 | M1.05 | Persisted in-app notifications and exact deep links | Partial | Dashboard notifications are demonstration-only. | Complete in M1.05. |
| LATER-017 | M1.05 | Email queue, retries and delivery state | Not started | No durable email adapter/job state exists. | Build in M1.05; live provider activation remains under LATER-035. |
| LATER-018 | M1.06 | Private object-storage adapter | Not started | Secure evidence upload has not begun. | Complete in M1.06. |
| LATER-019 | M1.06 | Independent upload state per form | Not started | Required to prevent file leakage between identity, qualification, experience and skill forms. | Complete and regression-test in M1.06. |
| LATER-020 | M1.06 | PDF, PNG and JPEG validation | Not started | Extension, MIME, size and signature checks are absent. | Complete in M1.06. |
| LATER-021 | M1.06 | Quarantine and malware-scan state | Not started | No scanner contract or quarantine lifecycle exists. | Build the adapter in M1.06; live service activation remains under LATER-039. |
| LATER-022 | M1.06 | Signed short-lived preview/download | Not started | No authorized evidence-object preview route exists. | Complete in M1.06. |
| LATER-023 | M1.07 | Identity metadata and front/back/supporting uploads | Not started | Worker Profile has no identity evidence workflow. | Resume after M1.06. |
| LATER-024 | M1.07 | Profile photograph | Not started | No secure capture/upload workflow exists. | Complete in M1.07 using the M1.06 pipeline. |
| LATER-025 | M1.07 | Liveness and degraded/manual fallback | Provider blocked | Consent, fallback and adapter are not built. | Build in M1.07; live activation remains under LATER-038/M3.10. |
| LATER-026 | M1.07 | Duplicate-worker detection and controlled merge review | Not started | Current identity still lacks the complete verified identity workflow. | Complete in M1.07. |
| LATER-027 | M1.07 | Permanent Worker ID issuance transaction | Partial | M1.03 introduces only a clearly provisional `HSE-REG-*` registration reference; permanent Worker ID issuance remains absent. | Complete only after accepted identity submission in M1.07. |
| LATER-028 | M1.07/M2.02 | Identity verification states and retained versions | Not started | Profile correction requests exist, but identity submission/review history does not. | Complete Worker states in M1.07 and verifier queue behavior in M2.02. |
| LATER-029 | M1.08 | Company verification case | Not started | No Company tenant verification workflow exists. | Complete in M1.08. |
| LATER-030 | M1.09 | Sites, departments and Company team scoped permissions | Not started | Company workspace is not implemented. | Complete in M1.09. |
| LATER-031 | M1.10 | Worker/staff invitations and Company codes | Partial | PR #15 adds security-scoped staff provisioning invitations only; Worker invitations, Company codes and Company operational invitation flows remain absent. | Complete staff provisioning in M1.03 and Worker/Company invitation workflows in M1.10. |
| LATER-032 | M1.11 | Qualification, experience, employment, skill and leaving-letter records | Not started | Dashboard only displays summary boundaries. | Complete integrated drafts, uploads and history in M1.11. |
| LATER-033 | M1.12 | Real public Worker/Credential verification and Report a Concern | Partial | Only configured demonstration public data exists. | Complete in M1.12. |
| LATER-035 | M1.05/M3.10 | Live email provider credentials | Provider blocked | Product must first pass with queued/sandbox delivery. | Activate in M3.10 after delivery and security tests. |
| LATER-036 | M1.03/M3.10 | Live SMS/phone OTP credentials | Provider blocked | Requires approved sender/provider configuration. | Build sandbox OTP in M1.03; activate the live provider in M3.10. |
| LATER-037 | M2.11–M2.12/M3.10 | Live video/interview provider | Provider blocked | Interview adapter and reconnect workflow are not built. | Build in M2; activate in M3.10. |
| LATER-038 | M1.07/M3.10 | Live liveness provider | Provider blocked | Consent, fallback and adapter must exist first. | Build in M1.07; activate in M3.10. |
| LATER-039 | M1.06/M3.10 | Live malware-scanning service | Provider blocked | Quarantine and scanner contracts must exist first. | Build the adapter in M1.06; activate in M3.10. |
| LATER-040 | M3.05/M3.10 | Live payment provider and signed webhooks | Not started / provider blocked | Billing belongs to Milestone 3 and requires approved credentials. | Complete in M3.05 and activate in M3.10. |
| LATER-043 | M1.01/M3.10 | Live hosted preview URL and production traffic switching | Provider blocked | M1.01 produces a provider-neutral standalone artifact, but no hosting account or traffic controller is connected. | Connect approved hosting and traffic switching in M3.10. |
| LATER-044 | M1.01/M3.10 | Remove explicit PostCSS and Sharp compatibility overrides when Next.js resolves safe compatible versions | Compatibility override | Next.js `16.2.12` pulled vulnerable transitive versions. PR #7 pins PostCSS `8.5.18` and Sharp `0.35.3` and gates their minimum versions. | Remove only after a Next.js upgrade independently resolves safe versions and the full security/runtime/build gate passes. |

## Active progress record

### M1.03 authentication security foundation — PR #15

- **Status:** Implementation on branch; CI and focused owner test pending.
- **Implemented:** migration `0002`, accounts, roles, OTP challenge state, revocable sessions, invitations, TOTP factors, authentication security events, cryptographic primitives, PGlite/PostgreSQL transactions and repository contracts.
- **Permanent tests:** authentication-domain tests plus real PGlite migration/constraint/replay/transaction/rollback tests inside `npm run check`.
- **Boundary:** no registration UI, OTP delivery, recovery UI, cookie integration, staff enrollment or live role portal guards are claimed complete.
- **Owner guide:** `docs/testing/M1_03_AUTHENTICATION_FOUNDATION_HARD_TEST.md`.

## Resolved history

### M1.02 — Design System and Global UX

- **Resolved IDs:** `LATER-004`, `LATER-045`, `LATER-OWNER-003`, `LATER-OWNER-004`, `LATER-OWNER-005`, `LATER-OWNER-006`, `LATER-OWNER-007`, `LATER-OWNER-008`.
- **Status:** Resolved by owner retest.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Environment:** Windows 10, Node.js `v22.23.1`, Google Chrome, normal Command Prompt.
- **Privileges:** no Administrator terminal and no Developer Mode required.
- **Automated evidence:** focused Profile overflow regression returned five passes and zero failures; complete `npm run check` passed.
- **Browser evidence:** normal desktop, 860px, 768px, 390px and 320px all passed without page-wide horizontal overflow.
- **Zoom evidence:** 125%, 150% and 200% passed; owner additionally tested successfully through 500%.
- **Containment evidence:** sidebar, header, cards and action controls remained contained; horizontal scrolling stayed inside the Profile history table when required.
- **Integrity evidence:** normal `Ctrl+C` shutdown completed; `git status --short` and protected-file diff were empty.
- **Implementation chain:** PR #8 through PR #14.
- **Final acceptance record:** `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`.

### LATER-OWNER-008 — Windows CRLF-sensitive Profile overflow validator

- **Status:** Resolved by focused owner retest.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated:** five Profile overflow tests passed with zero failures on Windows after PR #14 normalized line endings and changed the assertion to semantic CSS inspection.
- **Repair merge:** `bf7c715a6e7e6490af7030a8026f3a2774c5b190`.

### LATER-OWNER-007 — Worker Profile page-wide overflow and clipped controls

- **Status:** Resolved by complete browser owner matrix.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated:** normal desktop, 860px, 768px, 390px, 320px, 125%, 150%, 200% and additional testing through 500% without page-wide overflow.
- **Repair merge:** `612e8948c24bb007e0dfc6f266b0c81a50a7408a`.

### LATER-OWNER-003 through LATER-OWNER-006 — Windows preview, generated output and source-configuration determinism

- **Status:** Resolved by complete Windows owner gate.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated:** portable preview without privileged symlinks, isolated runtime/build output, protected tracked configuration, ordinary development HTTP behavior, clean shutdown and clean repository state.
- **Repair merges:** PR #9, PR #10, PR #11 and PR #12.

### LATER-001, LATER-002, LATER-003 and LATER-034 — M1.01 platform foundation acceptance

- **Status:** Resolved.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated:** environment separation, database and migrations, database-backed Worker Profile storage, preview/release evidence, rollback boundary, Windows application runtime and persisted Profile save/restart behavior.
- **Relevant merges:** PR #5, PR #6 and PR #7.

### LATER-041 — Worker Dashboard and Worker Profile vertical slice

- **Status:** Resolved.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated:** Worker Dashboard foundation and Worker Profile/onboarding continuation.
- **Merge commits:** `4836b6e66c9d4ac1140de4a08949008f64bc891a` and `9910d5eddfcd70b0780304efc1d01e575149b632`.

### LATER-042 and LATER-OWNER-002 — M1.01 visible controls and dependency security

- **Status:** Resolved by owner retest.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated:** visible Profile controls, keyboard focus, validation states, saved-data persistence, locked dependency installation, secure PostCSS/Sharp versions, production audit and complete `npm run check`.
- **Repair merge:** `961589fff8b173b967fd1d613a4cc74c663ccc31`.

### LATER-OWNER-001 — Windows PGlite runtime and nested error document

- **Status:** Resolved by owner retest.
- **Owner result:** PASS.
- **Accepted:** 2 August 2026.
- **Validated:** complete Worker Profile form loaded and saved successfully on Windows using the migrated PGlite database without repeated path, storage configuration, white-screen or nested-document failure.
- **Repair merge:** `e54d21fa2066d9db7bf05486df4a6d493092857d`.

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

Release-blocking examples include cross-role access, stale routes requiring refresh, lost profile/evidence data, wrong-record file attachment, dead controls, unsafe deletion, duplicate business actions, failed migration recovery, dirty tracked source after a deterministic command, platform-sensitive validation, page-wide horizontal overflow and unrecoverable stuck workflows.
