# Bookmark: Later

## Purpose

This bookmark records every approved feature, dependency or acceptance requirement that is not complete in the current code.

“Later” never means forgotten, optional or silently removed. Every entry remains part of the canonical Phase 1 scope unless the owner explicitly changes the specification.

## Mandatory rule

Before a pull request is merged, any canonical requirement that was:

- not implemented;
- implemented only as a development adapter;
- disabled pending provider credentials;
- represented by read-only data without its real workflow;
- postponed because a prerequisite is missing; or
- discovered during testing but not fixed in the same build unit

must be added here.

Each entry must identify its canonical brick, why it is incomplete, what blocks it, when it is targeted and how completion will be proven. No feature may disappear from this file merely because another screen was built around it.

## Status meanings

- **Deferred prerequisite:** required before the dependent feature can safely continue.
- **Development adapter:** real local behavior exists, but the production adapter is not connected.
- **Provider blocked:** product workflow and adapter must exist, but live activation needs approved credentials/service.
- **Not started:** canonical scope has not yet been implemented.
- **Partial:** some visible or backend behavior exists, but the canonical workflow is incomplete.
- **Owner defect:** found through owner hard testing and awaiting correction.
- **Resolved:** completed and proven; retained in the resolved history rather than deleted.

## Open Later register

| ID | Canonical brick | Feature or requirement | Status | Why it is not complete now | Dependency / completion target |
|---|---|---|---|---|---|
| LATER-001 | M1.01 | Production-like environment separation | Partial | Repository and CI exist, but development, preview and production configuration boundaries are not complete. | Complete in M1.01 with configuration validation, secret handling and environment tests. |
| LATER-002 | M1.01 | Relational database and migration baseline | Not started | Current Worker Profile uses a file-backed development repository. | Complete in M1.01 before platform-wide identity, company and tenant records. |
| LATER-003 | M1.01 | Preview deployment, rollback and release evidence | Not started | CI builds code but there is no controlled preview/release/rollback workflow in this repository. | Complete in M1.01 and prove rollback. |
| LATER-004 | M1.02 | Portal-wide design system | Partial | Worker routes have styling, but shared components/tokens are not complete across every portal and state. | Complete in M1.02 with accessibility and responsive tests. |
| LATER-005 | M1.03 | Real Worker registration | Not started | Current access uses environment-gated demo credentials. | Complete in M1.03. |
| LATER-006 | M1.03 | Mandatory email OTP | Not started | No persisted registration/OTP workflow exists. | Complete in M1.03 with expiry, rate limits, hashed codes and resend controls. |
| LATER-007 | M1.03 | Mandatory phone OTP | Not started | No SMS provider adapter or persisted OTP workflow exists. | Build adapter and sandbox behavior in M1.03; live activation tracked by LATER-036. |
| LATER-008 | M1.03 | Password reset, recovery and account lifecycle | Not started | Demo authentication has no production account lifecycle. | Complete in M1.03. |
| LATER-009 | M1.03 | Company registration and role-specific authentication | Not started | Only the Worker demo login is implemented. | Company registration foundation in M1.03/M1.08. |
| LATER-010 | M1.03 | Reviewer, assessor, admin and root provisioning/MFA | Not started | Staff portals and activation flows are not implemented. | Complete role provisioning and portal guards in M1.03; operational screens continue in later bricks. |
| LATER-011 | M1.04 | Platform permission model | Not started | Worker route guard exists, but complete role/permission enforcement does not. | Complete in M1.04. |
| LATER-012 | M1.04 | Company tenant isolation | Not started | No company tenant data model or query guard exists. | Complete in M1.04 before Company Portal data. |
| LATER-013 | M1.04 | Cross-role/cross-tenant direct-endpoint security suite | Partial | Worker-only route checks exist; full portal matrix does not. | Complete in M1.04 and expand cumulatively. |
| LATER-014 | M1.05 | Immutable platform audit engine | Partial | Profile records append local audit events, but there is no platform event/audit store. | Complete in M1.05. |
| LATER-015 | M1.05 | Transactional outbox/background jobs | Not started | Notifications and provider jobs are not durably queued. | Complete in M1.05. |
| LATER-016 | M1.05 | Persisted in-app notifications and exact deep links | Partial | Worker Dashboard has a demonstration projection only. | Complete in M1.05. |
| LATER-017 | M1.05 | Email notification queue, retries and delivery state | Not started | No email provider adapter/job state exists. | Build in M1.05; live provider activation tracked by LATER-035. |
| LATER-018 | M1.06 | Private object-storage adapter | Not started | Evidence uploads are not implemented. | Complete in M1.06. |
| LATER-019 | M1.06 | Independent upload state per form | Not started | Must prevent a selected file leaking into another identity/qualification/experience/skill form. | Complete and regression-test in M1.06. |
| LATER-020 | M1.06 | PDF, PNG and JPEG validation | Not started | Extension, MIME, size and file-signature checks are not implemented. | Complete in M1.06. |
| LATER-021 | M1.06 | Quarantine and malware-scan state | Not started | No upload quarantine or scanner adapter exists. | Build disabled/mock/test/live adapter in M1.06; live scanner tracked by LATER-039. |
| LATER-022 | M1.06 | Signed short-lived preview/download | Not started | No evidence object references or authorized preview route exists. | Complete in M1.06. |
| LATER-023 | M1.07 | Identity document metadata and front/back/supporting uploads | Not started | Worker Profile does not yet include identity evidence. | Resume after M1.06 is complete. |
| LATER-024 | M1.07 | Profile photograph | Not started | No secure photograph upload/capture workflow. | Complete in M1.07 using M1.06 pipeline. |
| LATER-025 | M1.07 | Liveness workflow and degraded/manual fallback | Provider blocked | Adapter, consent, evidence fields and fallback are not implemented. | Build in M1.07; live activation tracked by LATER-038. |
| LATER-026 | M1.07 | Duplicate-worker detection and controlled merge review | Not started | Current worker identity is based on demo session values. | Complete in M1.07. |
| LATER-027 | M1.07 | Permanent Worker ID issuance rule | Partial | Demo Worker ID exists, but no accepted-submission issuance transaction exists. | Complete in M1.07. |
| LATER-028 | M1.07 | Identity verification status workflow and retained versions | Not started | Profile correction request exists, but identity evidence submission/review history does not. | Complete in M1.07 and M2.02 reviewer queue. |
| LATER-029 | M1.08 | Company verification case | Not started | No company tenant/verification workflow. | Complete in M1.08. |
| LATER-030 | M1.09 | Sites, departments, company team and scoped permissions | Not started | Company workspace is not implemented. | Complete in M1.09. |
| LATER-031 | M1.10 | Worker/staff invitations and company codes | Not started | Invitation model and token lifecycle do not exist. | Complete in M1.10. |
| LATER-032 | M1.11 | Qualification, experience, employment, skill and leaving-letter records | Not started | Dashboard only exposes summary categories. | Complete integrated draft/upload/history workflows in M1.11. |
| LATER-033 | M1.12 | Real public Worker ID verification and Report a Concern | Partial | A demonstration public projection exists only for configured demo data. | Complete in M1.12. |
| LATER-034 | All milestones | Production database replacement for file-backed Worker Profile repository | Development adapter | Local persistence is real but not horizontally scalable or the final production store. | Replace through the same repository contract after M1.01 database/migrations. |
| LATER-035 | M1.05/M3.10 | Live email provider credentials | Provider blocked | Product must function with queued/sandbox delivery until approved credentials are supplied. | Activate in M3.10 after delivery and security tests. |
| LATER-036 | M1.03/M3.10 | Live SMS/phone OTP provider credentials | Provider blocked | Phone OTP requires approved SMS provider and sender configuration. | Activate in M3.10 after sandbox workflow is proven. |
| LATER-037 | M2.11–M2.12/M3.10 | Live video/interview provider | Provider blocked | Interview adapters and reconnect rules are not yet built. | Build in Milestone 2; activate production provider in M3.10. |
| LATER-038 | M1.07/M3.10 | Live liveness provider | Provider blocked | Consent, manual fallback and adapter must exist before credentials. | Build in M1.07; activate in M3.10. |
| LATER-039 | M1.06/M3.10 | Live malware scanning service | Provider blocked | Quarantine and scanner contract must exist first. | Build in M1.06; activate in M3.10. |
| LATER-040 | M3.05/M3.10 | Live payment provider and webhooks | Not started / provider blocked | Billing workflows are Milestone 3 scope and require signed webhook credentials. | Complete in M3.05 and activate in M3.10. |
| LATER-041 | Current owner gate | Manual owner hard test of Worker Dashboard and Worker Profile | Required before continuation | Automated CI cannot prove browser/device/usability behavior by itself. | Follow `docs/testing/WORKER_DASHBOARD_PROFILE_HARD_TEST.md`; log every failure here as Owner defect. |

## Resolved history

No entry is deleted after completion. Move it here with:

- resolving pull request and commit;
- automated tests passed;
- owner test result;
- date accepted.

## Owner defect format

When hard testing finds a problem, add an entry before further feature work:

```text
ID: LATER-OWNER-###
Area:
Exact route:
Steps to reproduce:
Expected:
Observed:
Device/browser:
Severity: release-blocking | high | medium | low
Target brick/fix:
Retest result:
```

Release-blocking examples include cross-role access, stale routes requiring refresh, lost profile/evidence data, files attached to the wrong record, dead buttons, unsafe deletion, duplicate business actions and unrecoverable stuck workflows.
