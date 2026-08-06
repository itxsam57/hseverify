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
| LATER-014 | M1.05 | Immutable platform audit engine | Partial | Authentication security events and Profile audit behavior exist, but the shared append-only platform audit domain, schema and authorized projections are incomplete. | Complete the first M1.05 subunit without weakening accepted authentication events. |
| LATER-015 | M1.05 | Transactional outbox/background jobs | Not started | Notifications and provider actions are not durably queued with accepted state. | Complete after the immutable audit foundation inside M1.05. |
| LATER-016 | M1.05 | Persisted in-app notifications and exact deep links | Partial | Dashboard notifications remain demonstration-only and have no persisted recipient/read/deep-link lifecycle. | Complete in M1.05 using the accepted outbox and authorization foundations. |
| LATER-017 | M1.05 | Email queue, retries and delivery state | Not started | No durable provider-neutral email job, attempt history or terminal delivery state exists. | Build in M1.05; live activation remains under LATER-035. |
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
| LATER-029 | M1.08 | Company verification case | Not started | M1.04 creates the accepted tenant security foundation and neutral demonstration, not Company verification. | Complete registration, initial administrator, verification case and settings in M1.08. |
| LATER-030 | M1.09 | Sites, departments and Company team scoped permissions | Not started | Company operational workspace is not implemented. The M1.04 demonstration is deliberately neutral. | Complete in M1.09 on the accepted M1.04 permission/tenant model. |
| LATER-031 | M1.10 | Worker invitations and Company codes | Partial | M1.03 completes platform staff provisioning only. | Complete Worker/Company operational invitations and codes in M1.10. |
| LATER-032 | M1.11 | Qualification, experience, employment, skill and leaving-letter records | Not started | Dashboard only displays summary boundaries. | Complete integrated drafts, uploads, statuses and retained history in M1.11. |
| LATER-033 | M1.12 | Real public Worker/Credential verification and Report a Concern | Partial | Only configured demonstration public data exists. | Complete in M1.12. |
| LATER-035 | M1.05/M3.10 | Live email provider credentials | Provider blocked | Product must first pass queued/sandbox delivery. | Activate in M3.10 after M1.05 delivery and security tests. |
| LATER-036 | M1.03/M3.10 | Live SMS/phone OTP credentials | Provider blocked | The sandbox phone OTP workflow is owner-accepted; approved sender/provider credentials are still absent. | Activate live SMS in M3.10 without changing the accepted M1.03 state machine. |
| LATER-037 | M2.11–M2.12/M3.10 | Live video/interview provider | Provider blocked | Interview adapter and reconnect workflow are not built. | Build in M2 and activate in M3.10. |
| LATER-038 | M1.07/M3.10 | Live liveness provider | Provider blocked | Consent, fallback and adapter must exist first. | Build in M1.07 and activate in M3.10. |
| LATER-039 | M1.06/M3.10 | Live malware-scanning service | Provider blocked | Quarantine and scanner contracts must exist first. | Build in M1.06 and activate in M3.10. |
| LATER-040 | M3.05/M3.10 | Live payment provider and signed webhooks | Not started / provider blocked | Billing belongs to Milestone 3 and requires approved credentials. | Complete in M3.05 and activate in M3.10. |
| LATER-043 | M1.01/M3.10 | Live hosted preview URL and production traffic switching | Provider blocked | M1.01 produces a provider-neutral artifact; hosting/traffic control is not connected. | Activate in M3.10. |
| LATER-044 | M1.01/M3.10 | Remove explicit PostCSS and Sharp compatibility overrides | Compatibility override | Next.js `16.2.12` still requires tested secure floors. | Remove only after a safe Next.js upgrade passes the complete security/runtime/build gate. |

## Active progress record

### M1.05 — Audit and Notification Foundations

- **Status:** READY TO BUILD.
- **Only permitted brick:** M1.05; M1.06 and later bricks remain blocked.
- **Current internal subunit:** Immutable Audit Domain, Schema and Append-Only Repository Foundation — READY TO BUILD.
- **Existing partial input:** accepted authentication security events and demonstration dashboard notification projections.
- **Required completion:** immutable audit engine, transactional outbox/background jobs, persisted in-app notifications with exact role-safe deep links, and durable provider-neutral email queue/retry/delivery state.
- **Live email activation:** provider-blocked under `LATER-035`; not required for local/test M1.05 acceptance.
- **Exact gate:** `docs/NEXT_BUILD_UNIT.md`.
- **Build order:** `docs/bookmarks/MILESTONE_PATH.md`.
- **Open IDs:** `LATER-014`, `LATER-015`, `LATER-016`, `LATER-017`, `LATER-035`.

## Resolved history

### M1.04 — Authorization and Tenant Isolation

- **Resolved IDs:** `LATER-011`, `LATER-012`, `LATER-013`.
- **Resolved owner defects:** `LATER-OWNER-012`, `LATER-OWNER-016`.
- **Status:** DONE — OWNER PASS — 6 August 2026.
- **Final implementation pull request:** #34.
- **Implementation merge:** `4329a591dfa7d1e7c4fca3feb5dd33c873984574`.
- **Owner-tested commit:** `56973430099171ebc48d2f4cc96887b58486167b`.
- **Final control merged-main run/job:** `31070230847` / `92516468358` — PASS.
- **Final record:** `docs/testing/results/M1_04_FINAL_OWNER_ACCEPTANCE.md`.
- **Accepted:** explicit permissions, fixed-role direct-endpoint isolation, one trusted Company tenant context, tenant predicates in SQL, transactional authority revalidation, non-enumerating cross-tenant behavior, protected synthetic Company scope demonstration, complete concurrency coverage, reversible deterministic migrations `0005`/`0006`, persistent PGlite proof, normal shutdown and clean synchronized Git state.

### M1.04 subunit 5 — Complete Isolation, Concurrency and Rollback Suite

- **Status:** DONE — OWNER PASS — 6 August 2026.
- **Pull request:** #34.
- **Merge:** `4329a591dfa7d1e7c4fca3feb5dd33c873984574`.
- **Accepted:** six-role matrix, all eleven protected-route redirects, cross-tenant/missing/malformed non-enumeration, lifecycle/permission race denial, full M1.04 rollback/reapply and focused owner closure.

### M1.04 subunit 4 — Company-Scope Bootstrap and Protected Demonstration

- **Status:** DONE — OWNER PASS — 6 August 2026.
- **Implementation pull request/merge:** #28 / `752e6cec8b7e83981cece5113748c8c48e52d52d`.
- **Delete repair pull request/merge:** #32 / `012ee75764b857345fc69499e8c19597dfceeffa`.
- **Final record:** `docs/testing/results/M1_04_COMPANY_SCOPE_DEMONSTRATION_FINAL_OWNER_ACCEPTANCE.md`.
- **Accepted:** deterministic synthetic Company scope bootstrap, Company-only protected CRUD, no browser tenant selector, no-refresh create/update/delete, destructive confirmation, two-tenant isolation and Worker copied-route denial.

### M1.04 subunit 3 — Tenant-Scoped Repository/Query/Command Guards

- **Status:** DONE — OWNER PASS — 5 August 2026.
- **Pull request:** #27.
- **Merge:** `f44d248f7da9bd815fdfbc869a3a7a374ad708e2`.
- **Final record:** `docs/testing/results/M1_04_TENANT_SCOPED_REPOSITORY_GUARDS_FINAL_OWNER_ACCEPTANCE.md`.
- **Accepted:** trusted permission-bound Company principal, direct tenant scope in every neutral fixture query/command, no client tenant selector, transactionally revalidated authority, non-enumerating cross-tenant results, scoped uniqueness/optimistic concurrency/stale-authority tests and reversible migration `0006`.

### M1.04 subunit 2 — Session Authorization Context and Permission Checks

- **Status:** DONE — OWNER PASS — 5 August 2026.
- **Implementation merge:** PR #24, commit `ccbcf44a4781faa85f6d0ded446dc13d38bbed27`.
- **Repair merge:** PR #25, commit `c100324ace9fea4495e1c4a50377a2df5d00a9ce`.
- **Resolved owner defect:** `LATER-OWNER-012`.
- **Final record:** `docs/testing/results/M1_04_SESSION_AUTHORIZATION_CONTEXT_FINAL_OWNER_ACCEPTANCE.md`.

### M1.04 subunit 1 — Authorization Domain and Tenant Schema Foundation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- **Pull request:** #23.
- **Merge:** `f1479f72cf189b158144cb7f6afc77623bf40489`.
- **Final record:** `docs/testing/results/M1_04_AUTHORIZATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`.

### M1.03 — Authentication and Portal Isolation

- **Resolved IDs:** `LATER-005`, `LATER-006`, `LATER-007`, `LATER-008`, authentication portion of `LATER-009`, `LATER-010`, and role-denial portion of `LATER-013`.
- **Resolved owner defects:** `LATER-OWNER-010`, `LATER-OWNER-011`.
- **Status:** DONE — OWNER PASS — 4 August 2026.
- **Final record:** `docs/testing/results/M1_03_FINAL_OWNER_ACCEPTANCE.md`.

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