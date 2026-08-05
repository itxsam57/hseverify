# Bookmark: Later

## Purpose

This register records every canonical requirement that is not fully implemented and owner-accepted. “Later” never means optional or forgotten. Resolved entries remain in resolved history.

## Status meanings

- **Not started** — canonical work has not begun.
- **Partial** — some accepted behavior exists, but the canonical workflow is incomplete.
- **Development adapter** — real local behavior exists while production activation remains.
- **Provider blocked** — the workflow/adapter must exist, but activation needs external credentials or approval.
- **Compatibility override** — a tested override remains until the parent dependency safely replaces it.
- **Owner defect** — owner testing found a defect awaiting repair/retest.
- **Resolved** — implementation, automated validation and required owner acceptance passed.

## Open Later register

| ID | Brick | Requirement | Status | Why still open | Completion target |
|---|---|---|---|---|---|
| LATER-011 | M1.04 | Platform permission model | Partial | Subunit 1 is owner-accepted. PR #24 now merges trusted session lifecycle resolution and central platform/portal permission guards, but subunit 2 still requires owner acceptance and later tenant-owned endpoints must enforce the guards. | Owner-accept subunit 2, then complete repository/command and endpoint enforcement in later M1.04 subunits. |
| LATER-012 | M1.04 | Company tenant isolation | Partial | Subunit 1 is owner-accepted. PR #24 now derives one trusted Company tenant context from the authenticated session/account membership and prohibits client tenant selection, but subunit 2 still requires owner acceptance and tenant-scoped repositories/commands remain. | Owner-accept trusted live context, then complete scoped reads/writes in subunit 3. |
| LATER-013 | M1.04 | Cross-role/cross-tenant direct-endpoint security suite | Partial | M1.03 role denial and PR #24 central portal guards are implemented, with exact session-context SQL and copied-route regressions. Complete tenant-owned endpoint and concurrent-command tests remain. | Complete cumulative role, tenant, endpoint and concurrency coverage before M1.04 final acceptance. |
| LATER-014 | M1.05 | Immutable platform audit engine | Partial | Authentication security events and Profile audit behavior exist; the complete immutable platform audit store does not. | Complete in M1.05 without weakening authentication events. |
| LATER-015 | M1.05 | Transactional outbox/background jobs | Not started | Notifications and provider actions are not durably queued. | Complete in M1.05. |
| LATER-016 | M1.05 | Persisted in-app notifications and exact deep links | Partial | Dashboard notifications remain demonstration-only. | Complete in M1.05. |
| LATER-017 | M1.05 | Email queue, retries and delivery state | Not started | No durable email job/delivery state exists. | Build in M1.05; live activation remains under LATER-035. |
| LATER-018 | M1.06 | Private object-storage adapter | Not started | Secure evidence upload has not begun. | Complete in M1.06. |
| LATER-019 | M1.06 | Independent upload state per form | Not started | Required to prevent file leakage across identity/evidence forms. | Complete and regression-test in M1.06. |
| LATER-020 | M1.06 | PDF, PNG and JPEG validation | Not started | Extension, MIME, size and signature checks are absent. | Complete in M1.06. |
| LATER-021 | M1.06 | Quarantine and malware-scan state | Not started | No scanner contract or quarantine lifecycle exists. | Build in M1.06; live service remains under LATER-039. |
| LATER-022 | M1.06 | Signed short-lived preview/download | Not started | No authorized evidence-object preview route exists. | Complete in M1.06. |
| LATER-023 | M1.07 | Identity metadata and front/back/supporting uploads | Not started | Worker Profile has no identity evidence workflow. | Resume after M1.06. |
| LATER-024 | M1.07 | Profile photograph | Not started | No secure capture/upload workflow exists. | Complete in M1.07 using the M1.06 pipeline. |
| LATER-025 | M1.07 | Liveness and degraded/manual fallback | Provider blocked | Consent, fallback and adapter are not built. | Build in M1.07; activate live provider under LATER-038/M3.10. |
| LATER-026 | M1.07 | Duplicate-worker detection and controlled merge review | Not started | Complete verified identity workflow is absent. | Complete in M1.07. |
| LATER-027 | M1.07 | Permanent Worker ID issuance transaction | Partial | M1.03 creates only provisional `HSE-REG-*` references. | Issue permanent Worker ID only after accepted identity submission in M1.07. |
| LATER-028 | M1.07/M2.02 | Identity verification states and retained versions | Not started | Profile correction exists, but identity submission/review history does not. | Complete Worker states in M1.07 and Verifier queues in M2.02. |
| LATER-029 | M1.08 | Company verification case | Not started | M1.04 creates only the tenant security foundation, not Company verification. | Complete registration, initial administrator, verification case and settings in M1.08. |
| LATER-030 | M1.09 | Sites, departments and Company team scoped permissions | Not started | Company operational workspace is not implemented. | Complete in M1.09 on the accepted M1.04 permission/tenant model. |
| LATER-031 | M1.10 | Worker invitations and Company codes | Partial | M1.03 completes platform staff provisioning only. | Complete Worker/Company operational invitations and codes in M1.10. |
| LATER-032 | M1.11 | Qualification, experience, employment, skill and leaving-letter records | Not started | Dashboard only displays summary boundaries. | Complete integrated drafts, uploads, statuses and retained history in M1.11. |
| LATER-033 | M1.12 | Real public Worker/Credential verification and Report a Concern | Partial | Only configured demonstration public data exists. | Complete in M1.12. |
| LATER-035 | M1.05/M3.10 | Live email provider credentials | Provider blocked | Product must first pass queued/sandbox delivery. | Activate in M3.10 after delivery and security tests. |
| LATER-036 | M1.03/M3.10 | Live SMS/phone OTP credentials | Provider blocked | The sandbox phone OTP workflow is owner-accepted; approved sender/provider credentials are still absent. | Activate live SMS in M3.10 without changing the accepted M1.03 state machine. |
| LATER-037 | M2.11–M2.12/M3.10 | Live video/interview provider | Provider blocked | Interview adapter and reconnect workflow are not built. | Build in M2 and activate in M3.10. |
| LATER-038 | M1.07/M3.10 | Live liveness provider | Provider blocked | Consent, fallback and adapter must exist first. | Build in M1.07 and activate in M3.10. |
| LATER-039 | M1.06/M3.10 | Live malware-scanning service | Provider blocked | Quarantine and scanner contracts must exist first. | Build in M1.06 and activate in M3.10. |
| LATER-040 | M3.05/M3.10 | Live payment provider and signed webhooks | Not started / provider blocked | Billing belongs to Milestone 3 and requires approved credentials. | Complete in M3.05 and activate in M3.10. |
| LATER-043 | M1.01/M3.10 | Live hosted preview URL and production traffic switching | Provider blocked | M1.01 produces a provider-neutral artifact; hosting/traffic control is not connected. | Activate in M3.10. |
| LATER-044 | M1.01/M3.10 | Remove explicit PostCSS and Sharp compatibility overrides | Compatibility override | Next.js `16.2.12` still requires tested secure floors. | Remove only after a safe Next.js upgrade passes the complete security/runtime/build gate. |

## Active progress record

### M1.04 — Authorization and Tenant Isolation

- **Status:** IN PROGRESS.
- **Accepted subunit 1:** authorization domain and tenant schema foundation — DONE — OWNER PASS — 4 August 2026.
- **Foundation merge:** PR #23, commit `f1479f72cf189b158144cb7f6afc77623bf40489`.
- **Foundation owner record:** `docs/testing/results/M1_04_AUTHORIZATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`.
- **Current subunit 2:** session authorization-context integration and permission checks — IMPLEMENTATION MERGED — OWNER TEST PENDING.
- **Subunit 2 merge:** PR #24, commit `ccbcf44a4781faa85f6d0ded446dc13d38bbed27`.
- **Automated gate:** GitHub Actions run `30978183970`, job `92216772217`, complete CI/preview/release evidence PASS.
- **Merged record:** `docs/testing/results/M1_04_SESSION_AUTHORIZATION_CONTEXT_MERGED_PENDING_OWNER.md`.
- **Owner guide:** `docs/testing/M1_04_SESSION_AUTHORIZATION_CONTEXT_HARD_TEST.md`.
- **Next action:** owner hard test only; subunit 3 remains blocked.
- **Exact gate:** `docs/NEXT_BUILD_UNIT.md`.
- **Build order:** `docs/bookmarks/MILESTONE_PATH.md`.
- **Open IDs:** `LATER-011`, `LATER-012`, `LATER-013`.

## Resolved history

### M1.03 — Authentication and Portal Isolation

- **Resolved IDs:** `LATER-005`, `LATER-006`, `LATER-007`, `LATER-008`, authentication portion of `LATER-009`, `LATER-010`, and role-denial portion of `LATER-013`.
- **Resolved owner defects:** `LATER-OWNER-010`, `LATER-OWNER-011`.
- **Status:** DONE — OWNER PASS.
- **Accepted:** 4 August 2026.
- **Final record:** `docs/testing/results/M1_03_FINAL_OWNER_ACCEPTANCE.md`.
- **Accepted:** Worker dual OTP, password login/lockout/recovery, opaque revocable sessions, staff invitation/TOTP enrollment, six fixed-role portals, role isolation, stale-session denial, migration rollback/reapply, responsive/accessibility and clean Git state.
- **Remaining boundary:** Company public registration/verification belongs to M1.08; live SMS credentials remain under `LATER-036`; cross-tenant denial remains under M1.04.

### M1.02 — Design System and Global UX

- **Resolved IDs:** `LATER-004`, `LATER-045`, `LATER-OWNER-003` through `LATER-OWNER-008`.
- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Final record:** `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`.

### M1.01 — Repository, Environments and CI/CD

- **Resolved IDs:** `LATER-001`, `LATER-002`, `LATER-003`, `LATER-034`, `LATER-042`, `LATER-OWNER-001`, `LATER-OWNER-002`.
- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Maintenance:** `LATER-043` and `LATER-044` remain open.

### Worker Dashboard and Worker Profile vertical slice

- **Resolved ID:** `LATER-041`.
- **Status:** OWNER PASS — 2 August 2026.
- **Boundary:** accepted subunits remain part of incomplete M1.07.

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

Release-blocking examples include cross-role or cross-tenant access, stale routes requiring refresh, lost data, wrong-record file attachment, dead controls, unsafe deletion, duplicate business actions, failed migration recovery, dirty tracked source, page-wide overflow and unrecoverable stuck workflows.
