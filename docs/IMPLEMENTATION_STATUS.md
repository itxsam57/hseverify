# HSE Verify — Current Milestone Checklist

**Status date:** 31 August 2026  
**Branch:** `feat/m2-06-assessment-catalogue-eligibility`  
**Current Governor state:** PRE-M2.06 retrospective Gatekeeper ACCEPT; M2.06 Gatekeeper ACCEPT, pending merge/post-merge verification.  
**Current rule:** a milestone is not called fully functional merely because unit/runtime/type/lint/build tests pass. User-facing milestones require permanent real-Chromium UI/workflow evidence at the purpose-relevant boundary.

## Historical formal Milestone 1 closure ledger

This ledger preserves the formal Engineering Factory closure state recorded before the stricter retrospective browser Gatekeeper was introduced. It is historical evidence, not a downgrade or rewrite of the current retrospective evidence below.

- Formal Milestone 1 progress: **7 of 12 (7/12)**.
- **M1.07 — DONE**.
- **M1.08 — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- **M1.09 — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- **M1.10 — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- **M1.11 — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- **M1.12 — IN PROGRESS**.

The historical ledger above is retained because owner-acceptance bookkeeping and the later stricter Engineering Factory retrospective audit are different records.

## Current engineering counts

### Frozen Governor window through M2.10

- Total bricks in the current window: **22** (`M1.01–M1.12` + `M2.01–M2.10`).
- Bricks with substantial production implementation through M2.06: **18**.
- M1.01–M2.05 retrospective audit: **GATEKEEPER ACCEPT**.
- M2.05 milestone certificate: **ACCEPTED / PROVEN**.
- M2.06 milestone certificate: **ACCEPTED / PROVEN — PENDING MERGE**.
- Not built in the current window: **4 — M2.07, M2.08, M2.09, M2.10**.

Do not infer M2.11+ implementation from this file; the current Governor queue stops at M2.10.

## Current milestone status

| Milestone | Current engineering / UI evidence | Current verdict |
|---|---|---|
| **M1.01 Repository, Environments, CI/CD** | Deterministic migrations, complete application gate, production build, preview smoke, release manifest and permanent clean-database browser CI passed. | **RETROSPECTIVE PROVEN** |
| **M1.02 Design System and Global UX** | Design/UX contracts plus real Worker/Company/Verifier/Admin 390×844 no-horizontal-overflow screenshots passed. | **RETROSPECTIVE PROVEN** |
| **M1.03 Authentication and Portal Isolation** | Worker OTP/contact verification, staff invitation/MFA, replay protection and cross-portal isolation are automated and real-browser proven. | **RETROSPECTIVE PROVEN** |
| **M1.04 Authorization and Tenant Isolation** | Explicit server permissions/tenant derivation, cross-role/cross-tenant denial and mixed-role real-server activity passed. | **RETROSPECTIVE PROVEN** |
| **M1.05 Audit, Outbox, Notifications and Email Queue** | Immutable runtime foundations plus real notification bell/unread/deep-link/read-state/reload workflow passed. | **RETROSPECTIVE PROVEN** |
| **M1.06 Secure Storage and Upload Pipeline** | Real Worker upload and Verifier secure preview passed; private storage/scan/access integrity is automated. Live provider activation remains external. | **RETROSPECTIVE PROVEN / EXTERNAL PROVIDER BOUNDARY** |
| **M1.07 Worker Onboarding and Identity Engine** | Profile/identity/evidence persistence and mobile behavior passed real Chromium; duplicate/Worker-ID authority remains server controlled. | **RETROSPECTIVE PROVEN** |
| **M1.08 Company Registration and Verification** | Real Company registration → secure evidence → submit → Admin review → activation passed; latest-schema M1.08 regression protects later migration compatibility. | **RETROSPECTIVE PROVEN** |
| **M1.09 Sites, Departments and Company Team** | Real create/archive/restore/team-invite/suspend/reactivate paths plus tenant/history tests passed. | **RETROSPECTIVE PROVEN** |
| **M1.10 Worker Invitations and Company Codes** | Real invitation and registration-code Worker linking, defaults and persistence passed. | **RETROSPECTIVE PROVEN** |
| **M1.11 Worker Evidence Records** | Qualification/evidence/history/employment leaving-letter workflows passed Chromium and targeted exact-version/history gates. | **RETROSPECTIVE PROVEN** |
| **M1.12 Public Verification Foundation** | Public non-enumeration plus real Report Concern submission and durable opaque concern reference passed Chromium; targeted privacy/rate-limit suites passed. | **RETROSPECTIVE PROVEN** |
| **M2.01 Assurance Order and Case Engine** | Real create/validate/submit/case/action/reload workflow plus duplicate-safe concurrency and tenant denial passed. | **RETROSPECTIVE PROVEN** |
| **M2.02 Evidence Verification Queues** | Real exact PDF preview, conflict, reassignment, terminal decision, refresh and Company case advancement passed. | **RETROSPECTIVE PROVEN** |
| **M2.03 Frameworks and Effective Policy** | Real Admin framework/global policy and stricter Company override/reload workflow passed. | **RETROSPECTIVE PROVEN** |
| **M2.04 Question Bank** | Real LONG_TEXT rubric create, immutable revision, reload and status cycle passed; answer-safe/race tests remain green. | **RETROSPECTIVE PROVEN** |
| **M2.05 Randomized Assessment Form Generation** | Dedicated blueprint Chromium and server-side generation/non-repeat/concurrency/safe-delivery gates passed. | **ACCEPTED / PROVEN** |
| **M2.06 Assessment Catalogue and Eligibility** | Admin catalogue lifecycle and Worker read-only availability passed dedicated Chromium; backend eligibility is owned-case/server-state derived with zero attempt side effects. | **ACCEPTED / PROVEN — PENDING MERGE** |
| **M2.07 Candidate Assessment Window** | Not built. This brick will own dedicated preflight/window, one-question delivery, answer-before-next and attempt progression. | **NOT BUILT** |
| **M2.08 Answer Persistence and Interruption Recovery** | Not built. | **NOT BUILT** |
| **M2.09 Integrity Engine** | Not built. | **NOT BUILT** |
| **M2.10 Written Scoring and Review Engine** | Not built. | **NOT BUILT** |

## Exact pre-closure evidence head

Evidence head: `1d8194026b8e23e94fc6440b5e22a6cfb734c44a`.

- Phase 1 retrospective audit: **PASS** — run `33418124771`.
- Hard Browser QA: **PASS** — run `33418124846`.
- Full Engineering verification: **PASS** — run `33418124856`, job `99573593335`, artifact `9768131609`, digest `sha256:65d30868fff9660287068450ead4f0a4f28abcf79c3c8ebf881ac14e2e3c0cea`.
- M1.11 targeted: **PASS** — `33418124843`.
- M1.12 targeted: **PASS** — `33418124812`.
- M2.01 targeted: **PASS** — `33418125065`.
- M2.02 targeted: **PASS** — `33418124874`.
- M2.04 targeted: **PASS** — `33418124858`.
- M2.05 targeted: **PASS** — `33418124720`.
- M2.06 targeted: **PASS** — `33418124840`.
- M2.05 dedicated Chromium: **PASS** — `33418124851`.
- M2.06 dedicated Chromium: **PASS** — `33418124800`.

An earlier push-triggered retrospective job on the same SHA failed at npm dependency resolution (`ETARGET`) before application/browser execution. The later pull-request-triggered run on the same SHA passed and is the accepted runtime evidence.

## Provider boundaries still not production-live

Production activation still requires approved live credentials/services for email/SMS, private object storage, malware scanning, liveness/document/face verification, real video/interview transport and payments. Sandbox/local adapters are not described as live production providers.

## Immediate Governor order

1. Re-run required gates on the governance-only M2.06 closure head.
2. Update PR #86 description from its obsolete TDD-RED wording and mark it ready only after closure-head GREEN.
3. Merge PR #86 with expected-head protection if repository policy permits.
4. Verify merged `main` exact head.
5. Create isolated M2.07 work and run Superpowers brainstorming/writing-plan before production code.
6. Build M2.07 with TDD and real-browser evidence for the dedicated assessment window, one question at a time, answer-before-next, save-confirm-before-next progression and safe candidate exits/recovery boundaries owned by M2.07/M2.08.
