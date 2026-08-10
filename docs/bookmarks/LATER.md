# Bookmark: Later

## Purpose

This register records canonical requirements that are not yet fully implemented/accepted plus provider/maintenance items that intentionally remain open. “Later” never means optional or forgotten. Resolved requirements stay in the resolved-history section and must never return to the open table without a new documented regression/reopen decision.

The exact current build gate is `docs/NEXT_BUILD_UNIT.md`; permanent brick status is `docs/bookmarks/MILESTONE_PATH.md`.

## Status meanings

- **Not started** — canonical work has not begun.
- **Partial** — accepted prerequisite/behavior exists but the canonical workflow is incomplete.
- **In progress** — current permitted build work is actively under implementation/acceptance.
- **Development adapter** — real local/test behavior exists while production activation remains later.
- **Provider blocked** — production activation needs approved external provider credentials/service.
- **Compatibility override** — a tested override remains until the parent dependency safely replaces it.
- **Owner defect** — owner testing found a defect awaiting repair/retest.
- **Resolved** — implementation plus required automated/owner acceptance passed.

## Open Later register

| ID | Brick | Requirement | Status | Why still open | Completion target |
|---|---|---|---|---|---|
| LATER-022 | M1.06 | Signed short-lived preview/download | **In progress** | M1.06 Subunit 4 is active on PR #53; exact-head engineering acceptance has not closed. | Complete Subunit 4, merged-main verification and then M1.06 Subunit 5 cumulative acceptance. |
| LATER-023 | M1.07 | Identity metadata and front/back/supporting uploads | Not started | Worker Profile exists, but the identity evidence submission workflow is deliberately blocked behind M1.06. | Resume only after M1.06 is DONE. |
| LATER-024 | M1.07 | Profile photograph | Not started | Secure capture/upload product workflow is not built. | Complete in M1.07 using accepted M1.06 storage. |
| LATER-025 | M1.07 | Liveness and degraded/manual fallback | Provider blocked / not started | Consent, liveness adapter and manual fallback have not been built; live provider credentials are not available. | Build provider-neutral workflow in M1.07; activate live provider in M3.10. |
| LATER-026 | M1.07 | Duplicate-worker detection and controlled merge review | Not started | Complete verified identity workflow is absent. | Complete in M1.07. |
| LATER-027 | M1.07 | Permanent Worker ID issuance transaction | Partial | Registration uses provisional references; permanent issuance belongs after accepted identity submission. | Complete in M1.07. |
| LATER-028 | M1.07/M2.02 | Identity verification states and retained versions | Not started | Profile correction exists, but identity submission/review history is not built. | Worker-side states in M1.07; Verifier queues in M2.02. |
| LATER-029 | M1.08 | Company verification case | Not started | M1.04 accepted tenant security, not Company registration/verification. | Complete registration, initial administrator, verification case and settings in M1.08. |
| LATER-030 | M1.09 | Sites, departments and Company team scoped permissions | Not started | Company operational workspace is not built. | Complete in M1.09 on the accepted tenant/permission model. |
| LATER-031 | M1.10 | Worker invitations and Company codes | Partial prerequisite only | M1.03 staff provisioning is not the Worker/Company business invitation/code workflow. | Complete in M1.10. |
| LATER-032 | M1.11 | Qualification, experience, employment, skill and leaving-letter records | Not started | Dashboard/Profile foundation does not implement these durable evidence workflows. | Complete in M1.11 using accepted secure-file and tenant foundations. |
| LATER-033 | M1.12 | Real public Worker/Credential verification and Report a Concern | Partial prototype/demo only | No accepted clean-rebuild production lookup/safe projection/rate-limit/concern/QR foundation exists. | Complete in M1.12. |
| LATER-035 | M1.05/M3.10 | Live email provider credentials | Provider blocked | M1.05 durable queued/local-test delivery is accepted; production provider activation is intentionally later. | Activate approved live provider in M3.10 without changing accepted queue semantics. |
| LATER-036 | M1.03/M3.10 | Live SMS/phone OTP credentials | Provider blocked | Worker phone OTP state machine is accepted with sandbox delivery; approved live sender/provider is absent. | Activate in M3.10 without changing M1.03 auth state machine. |
| LATER-037 | M2.11–M2.12/M3.10 | Live video/interview provider | Provider blocked | Interview workflow/provider adapter is not built. | Build provider-neutral interview flow in M2; activate live provider in M3.10. |
| LATER-038 | M1.07/M3.10 | Live liveness provider | Provider blocked | Liveness workflow and fallback are not built. | Build in M1.07; activate approved live provider in M3.10. |
| LATER-039 | M1.06/M3.10 | Live malware-scanning service | Provider blocked | M1.06 Subunit 3 accepted durable scanner contracts/local-test clean/EICAR/retry/terminal behavior; no approved production scanner is connected. | Activate a real provider in M3.10 without bypassing accepted quarantine/scan state. |
| LATER-040 | M3.05/M3.10 | Live payment provider and signed webhooks | Not started / provider blocked | Billing belongs to Milestone 3 and requires approved provider credentials. | Complete M3.05 then production activation in M3.10. |
| LATER-043 | M1.01/M3.10 | Hosted preview URL and production traffic switching | Provider blocked | M1.01 produces a provider-neutral artifact; repository-controlled hosting/traffic integration is not connected. | Activate in M3.10. |
| LATER-044 | M1.01/M3.10 | Remove explicit PostCSS and Sharp compatibility overrides | Compatibility override | Next.js `16.2.12` still uses the tested secure-floor overrides. | Remove only after a safe Next.js upgrade passes the complete gate. |

## Active progress record

### M1.06 — Secure Storage and Upload Pipeline

- **Status:** IN PROGRESS — only permitted Milestone 1 brick.
- **Subunit 1:** secure-file domain/private local-test storage — DONE — ENGINEERING PASS.
- **Subunit 2:** isolated upload validation/quarantine — DONE — ENGINEERING PASS.
- **Subunit 3:** durable malware scan/local-test scanner — DONE — ENGINEERING PASS.
- **Subunit 4:** authorized signed preview/download — IN PROGRESS — PR #53.
- **Subunit 5:** cumulative M1.06 isolation/migration/recovery/owner acceptance — BLOCKED until Subunit 4 closes.
- **Open M1.06 Later IDs:** `LATER-022` for signed access and `LATER-039` for later live production scanner activation.
- **Exact gate:** `docs/NEXT_BUILD_UNIT.md`.

## Resolved history

### M1.06 accepted internal requirements through Subunit 3

The following former open requirements are **RESOLVED for the accepted local/test M1.06 foundation**:

- `LATER-018` — private object-storage adapter: resolved by Subunit 1.
- `LATER-019` — independent/cross-file upload isolation: resolved by Subunit 2 concurrency and binding controls.
- `LATER-020` — PDF/PNG/JPEG extension/MIME/signature/size validation: resolved by Subunit 2.
- `LATER-021` — quarantine and malware-scan state: resolved by Subunits 2–3. Live provider activation remains separately open as `LATER-039`.

Accepted Subunit 3 canonical-main closure boundary before active Subunit 4:

`d4acee0093c2d1cd540fc944c1937183dd3afa8a`

### M1.05 — Audit and Notification Foundations

- **Status:** DONE — OWNER PASS — 9 August 2026.
- `LATER-014` — immutable platform audit engine — **RESOLVED**.
- `LATER-015` — transactional outbox/background jobs — **RESOLVED**.
- `LATER-016` — persisted in-app notifications/read state/exact deep links — **RESOLVED**.
- `LATER-017` — provider-neutral durable email queue/retries/delivery state — **RESOLVED**.
- Live email provider activation remains separately open as `LATER-035`.

Accepted M1.05 boundary includes append-only audit facts, transactional durable outbox/background processing, persisted role-safe notifications and provider-neutral durable email attempt/delivery state with local/test adapter and bounded retries/reclaim/terminal handling.

### M1.04 — Authorization and Tenant Isolation

- **Status:** DONE — OWNER PASS — 6 August 2026.
- **Resolved requirements:** `LATER-011`, `LATER-012`, `LATER-013`.
- **Resolved owner defects:** `LATER-OWNER-012`, `LATER-OWNER-016`.
- **Final PR/merge:** #34 / `4329a591dfa7d1e7c4fca3feb5dd33c873984574`.
- **Owner-tested commit:** `56973430099171ebc48d2f4cc96887b58486167b`.
- **Final record:** `docs/testing/results/M1_04_FINAL_OWNER_ACCEPTANCE.md`.

### M1.03 — Authentication and Portal Isolation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- Resolved authentication requirements include `LATER-005` through `LATER-010` as applicable and the role-denial portion of `LATER-013`.
- Resolved owner defects include `LATER-OWNER-010` and `LATER-OWNER-011`.
- **Final record:** `docs/testing/results/M1_03_FINAL_OWNER_ACCEPTANCE.md`.

### M1.02 — Design System and Global UX

- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Final record:** `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`.

### M1.01 — Repository, Environments and CI/CD

- **Status:** DONE — OWNER PASS — 2 August 2026.
- Production-provider hosting and compatibility maintenance remain separately open as `LATER-043` and `LATER-044`.

### Worker Dashboard and Worker Profile vertical slice

- **Status:** OWNER PASS — 2 August 2026.
- **Boundary:** accepted slice only; M1.07 is still incomplete and blocked until M1.06 closes.

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
