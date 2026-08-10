# Bookmark: Later

## Purpose

This register records canonical requirements that are not yet fully implemented/accepted plus provider/maintenance items intentionally left open. “Later” never means optional. Resolved requirements remain in resolved history and must not reappear in the open table without an explicit reopen/regression decision.

The exact build gate is `docs/NEXT_BUILD_UNIT.md`; permanent brick status is `docs/bookmarks/MILESTONE_PATH.md`.

## Status meanings

- **Not started** — canonical work has not begun.
- **Partial** — prerequisite behavior exists but the complete canonical workflow is incomplete.
- **In progress** — current permitted work is under implementation/acceptance.
- **Provider blocked** — production activation needs an approved external provider/service.
- **Compatibility override** — tested override retained until a safe parent upgrade replaces it.
- **Resolved** — implementation plus required automated/owner acceptance passed.

## Open Later register

| ID | Brick | Requirement | Status | Why still open | Completion target |
|---|---|---|---|---|---|
| LATER-023 | M1.07 | Identity metadata and front/back/supporting uploads | Not started | Worker Profile exists, but identity evidence submission remains blocked until M1.06 closes. | Complete in M1.07 using accepted M1.06 storage. |
| LATER-024 | M1.07 | Profile photograph | Not started | Secure capture/upload product workflow is not built. | Complete in M1.07. |
| LATER-025 | M1.07 | Liveness and degraded/manual fallback | Provider blocked / not started | Consent, adapter and fallback are not built; live provider absent. | Build provider-neutral M1.07 workflow; activate live provider in M3.10. |
| LATER-026 | M1.07 | Duplicate-worker detection and controlled merge review | Not started | Complete verified identity workflow is absent. | Complete in M1.07. |
| LATER-027 | M1.07 | Permanent Worker ID issuance transaction | Partial | Registration uses provisional references; permanent issuance follows accepted identity submission. | Complete in M1.07. |
| LATER-028 | M1.07/M2.02 | Identity verification states and retained versions | Not started | Profile correction exists, but identity submission/review history does not. | Worker states M1.07; Verifier queues M2.02. |
| LATER-029 | M1.08 | Company verification case | Not started | Tenant security exists; Company registration/verification does not. | Complete in M1.08. |
| LATER-030 | M1.09 | Sites, departments and Company team scoped permissions | Not started | Company operational workspace is not built. | Complete in M1.09. |
| LATER-031 | M1.10 | Worker invitations and Company codes | Partial prerequisite only | Staff provisioning is not the Worker/Company business invitation/code workflow. | Complete in M1.10. |
| LATER-032 | M1.11 | Qualification, experience, employment, skill and leaving-letter records | Not started | Dashboard/Profile does not implement these durable evidence workflows. | Complete in M1.11. |
| LATER-033 | M1.12 | Real public Worker/Credential verification and Report a Concern | Partial prototype/demo only | Clean-rebuild lookup/projection/rate-limit/concern/QR foundation is not accepted. | Complete in M1.12. |
| LATER-035 | M1.05/M3.10 | Live email provider credentials | Provider blocked | Durable queued/local-test delivery is accepted; production provider activation is later. | Activate in M3.10 without changing queue semantics. |
| LATER-036 | M1.03/M3.10 | Live SMS/phone OTP credentials | Provider blocked | Phone OTP state machine is accepted with sandbox delivery. | Activate approved sender/provider in M3.10. |
| LATER-037 | M2.11–M2.12/M3.10 | Live video/interview provider | Provider blocked | Interview workflow/provider adapter is not built. | Build in M2; activate in M3.10. |
| LATER-038 | M1.07/M3.10 | Live liveness provider | Provider blocked | Liveness workflow/fallback is not built. | Build in M1.07; activate in M3.10. |
| LATER-039 | M1.06/M3.10 | Live malware-scanning service | Provider blocked | Durable local/test scanner foundation is accepted; no approved production scanner is connected. | Activate real provider in M3.10 without bypassing accepted lifecycle. |
| LATER-040 | M3.05/M3.10 | Live payment provider and signed webhooks | Not started / provider blocked | Billing belongs to M3 and requires approved credentials. | Complete M3.05 then activate in M3.10. |
| LATER-043 | M1.01/M3.10 | Hosted preview URL and production traffic switching | Provider blocked | Provider-neutral artifact exists; hosted traffic integration is not connected. | Activate in M3.10. |
| LATER-044 | M1.01/M3.10 | Remove explicit PostCSS and Sharp compatibility overrides | Compatibility override | Next.js `16.2.12` still uses tested secure-floor overrides. | Remove only after a safe Next.js upgrade passes the complete gate. |

## Active progress record

### M1.06 — Secure Storage and Upload Pipeline

- **Status:** IN PROGRESS — only permitted Milestone 1 brick.
- **Subunit 1:** secure-file domain/private local-test storage — DONE — ENGINEERING PASS.
- **Subunit 2:** isolated upload validation/quarantine — DONE — ENGINEERING PASS.
- **Subunit 3:** durable malware scan/local-test scanner — DONE — ENGINEERING PASS.
- **Subunit 4:** authorized signed preview/download — DONE — ENGINEERING PASS.
- **Subunit 5:** cumulative M1.06 isolation/migration/recovery/acceptance — READY TO BUILD.
- **Open M1.06 Later IDs:** `LATER-039` only, for later live production scanner activation; it does not block local/test M1.06 acceptance.
- **Exact gate:** `docs/NEXT_BUILD_UNIT.md`.

## Resolved history

### M1.06 accepted internal requirements through Subunit 4

The following former open requirements are **RESOLVED for the accepted local/test M1.06 foundation**:

- `LATER-018` — private object-storage adapter — resolved by Subunit 1.
- `LATER-019` — independent/cross-file upload isolation — resolved by Subunit 2.
- `LATER-020` — PDF/PNG/JPEG extension/MIME/signature/size validation — resolved by Subunit 2.
- `LATER-021` — quarantine and malware-scan state — resolved by Subunits 2–3; live provider activation remains `LATER-039`.
- `LATER-022` — signed short-lived preview/download — **RESOLVED by Subunit 4** after exact-head gate `31354949426 / 93352838153`, merge `d03ce5322c2ffa0214c90ee5dc19c15e22da9d51` and merged-main gate `31355234897 / 93353573069` passed. Final record: `docs/testing/results/M1_06_SIGNED_ACCESS_FINAL_ACCEPTANCE.md`.

Accepted Subunit 4 implementation boundary before cumulative Subunit 5:

`d03ce5322c2ffa0214c90ee5dc19c15e22da9d51`

### M1.05 — Audit and Notification Foundations

- **Status:** DONE — OWNER PASS — 9 August 2026.
- `LATER-014` immutable audit — RESOLVED.
- `LATER-015` transactional outbox/background jobs — RESOLVED.
- `LATER-016` persisted in-app notifications/deep links — RESOLVED.
- `LATER-017` provider-neutral durable email queue/delivery state — RESOLVED.
- Live email provider activation remains `LATER-035`.

### M1.04 — Authorization and Tenant Isolation

- **Status:** DONE — OWNER PASS — 6 August 2026.
- Resolved: `LATER-011`, `LATER-012`, `LATER-013`, `LATER-OWNER-012`, `LATER-OWNER-016`.
- Final record: `docs/testing/results/M1_04_FINAL_OWNER_ACCEPTANCE.md`.

### M1.03 — Authentication and Portal Isolation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- Resolved authentication requirements include `LATER-005` through `LATER-010` as applicable and role-denial portion of `LATER-013`.
- Resolved owner defects include `LATER-OWNER-010` and `LATER-OWNER-011`.
- Final record: `docs/testing/results/M1_03_FINAL_OWNER_ACCEPTANCE.md`.

### M1.02 — Design System and Global UX

- **Status:** DONE — OWNER PASS — 2 August 2026.
- Final record: `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`.

### M1.01 — Repository, Environments and CI/CD

- **Status:** DONE — OWNER PASS — 2 August 2026.
- Production hosting and compatibility maintenance remain `LATER-043` / `LATER-044`.

### Worker Dashboard and Worker Profile vertical slice

- **Status:** OWNER PASS — 2 August 2026.
- **Boundary:** accepted slice only; M1.07 remains incomplete and blocked until M1.06 closes.

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

Release-blocking examples include cross-role/cross-tenant access, stale routes requiring refresh, lost/cross-linked data, wrong-record file attachment, dead controls, unsafe deletion, duplicate business actions, failed migration recovery, dirty tracked source, page-wide overflow and unrecoverable stuck workflows.
