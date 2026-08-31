# HSE Verify — Current Milestone Checklist

**Status date:** 1 September 2026  
**Branch:** `feat/m2-07-assessment-window`  
**Current Governor state:** M2.06 merged/post-merge verified; M2.07 Gatekeeper accepted and final pre-merge exact-head verification is GREEN.  
**Current rule:** a milestone is not called fully functional merely because unit/runtime/type/lint/build tests pass. User-facing milestones require permanent real-Chromium UI/workflow evidence at the purpose-relevant boundary, exact-head regression evidence and Gatekeeper acceptance.

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
- Bricks with substantial production implementation through M2.07: **19**.
- M1.01–M2.05 retrospective audit: **GATEKEEPER ACCEPT**.
- M2.05 milestone certificate: **ACCEPTED / PROVEN**.
- M2.06 milestone certificate: **ACCEPTED / PROVEN / MERGED / POST-MERGE VERIFIED**.
- M2.07 milestone certificate: **ACCEPTED / PROVEN — PRE-MERGE EXACT-HEAD VERIFIED**.
- Not built in the current window: **3 — M2.08, M2.09, M2.10**.

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
| **M2.06 Assessment Catalogue and Eligibility** | Admin catalogue lifecycle and Worker read-only availability passed dedicated Chromium; backend eligibility is owned-case/server-state derived with zero attempt side effects. | **ACCEPTED / PROVEN / MERGED / POST-MERGE VERIFIED** |
| **M2.07 Candidate Assessment Window** | Real Worker start → one pinned question → durable answer-before-next → written question → reload → final submit passed Chromium. Server/runtime gates prove all six types, stale/duplicate/concurrent idempotency, transaction rollback, pinned-version continuity, append-only committed answers, cross-Worker denial and no future-question/answer-key/rubric/scoring/internal-attempt-metadata leakage. Final submit intentionally keeps the Assurance Case at `Assessment in progress`. | **ACCEPTED / PROVEN — PRE-MERGE EXACT-HEAD VERIFIED** |
| **M2.08 Answer Persistence and Interruption Recovery** | Not built. This brick owns uncommitted autosave/recovery and interruption/emergency behavior; M2.07 only reloads committed state. | **NOT BUILT** |
| **M2.09 Integrity Engine** | Not built. Webcam/mic/screen secure-window and integrity incident behavior remain outside M2.07. | **NOT BUILT** |
| **M2.10 Written Scoring and Review Engine** | Not built. Correctness/scoring/pass-fail/reviewer allocation/result publication and transition beyond `Assessment in progress` remain outside M2.07. | **NOT BUILT** |

## M2.07 Gatekeeper evidence

M2.07 was accepted after strict RED→GREEN implementation and an independent Gatekeeper diff review. The accepted code evidence head is `9727d56261d51f7a2c6f61053ccb221d20e529d5`; final governance metadata was then verified again at exact head `ca1479863d226b784653426d30df375eb1183022` and final merge candidate `7b36b61bf7c3cd96d338d923d27122f73251f67f`.

Key evidence:

- Task 1 persistence/domain correction head `e7713a344f0c14ccdc1380ce3138b328cd1080f9`; targeted run `33429643196` **PASS** after intended RED lineage failure.
- Task 2 atomic begin head `905edd09dc3a41988e049a92cb43cd04d61c6363`; M2.07 targeted run `33430642887` **PASS**.
- Task 3 answer progression/concurrency passed six answer types, commit-before-next, duplicate/concurrent idempotency, conflict and rollback behavior.
- Browser QA passed real Worker login/start, MCQ progression, written-question reload, cross-Worker denial, final submit and secrecy scans.
- Gatekeeper review found and fixed two additional blockers with RED regression tests first: internal attempt aggregate crossing the Server→Client boundary, and direct DB mutability of committed answers.
- Accepted code head `9727d56261d51f7a2c6f61053ccb221d20e529d5`: M2.07 targeted `33440893266`, M2.07 browser `33440893171`, Hard Browser `33440893224`, Phase 1 retrospective `33440893250`, Full Engineering `33440893197` — all **PASS**. Engineering artifact `9776501359`, digest `sha256:c9749ef22133208eb35e3b4fb3bf0d041e67a4ab49c0a0bef184803b34eae5d8`.
- Governance metadata head `ca1479863d226b784653426d30df375eb1183022`: M2.07 targeted `33442007745`, M2.07 browser `33442007684`, Hard Browser `33442007694`, Phase 1 retrospective `33442007689`, M2.06 targeted/browser regressions, M2.05/M2.04/M2.01/M1.12/M1.11 regressions, and Full Engineering `33442007697` — all **PASS**. Engineering artifact `9776888017`, digest `sha256:116a844d5a28d415c230d6fa628e446e0b6bcbd64762e3ce66fbc598dc635f3a`.
- Final merge-candidate head `7b36b61bf7c3cd96d338d923d27122f73251f67f`: M2.07 targeted `33442908217`, M2.07 browser `33442908206`, Hard Browser `33442908179`, Phase 1 retrospective `33442908181`, M2.06 browser `33442908182`, M2.06 targeted `33442908245`, M2.05 targeted `33442908329`, M2.04 targeted `33442908180`, M2.01 targeted `33442908219`, M1.12 targeted `33442908185`, M1.11 targeted `33442908186`, and Full Engineering `33442908190` — all **PASS**. Engineering artifact `9777185422`, digest `sha256:0d99edae2d1acce2928121bebf86d0cf35626ea7367c790e063375f516dc8245`.
- Acceptance certificate: `.engineering/M2.07-ACCEPTANCE.md`.

## Provider boundaries still not production-live

Production activation still requires approved live credentials/services for email/SMS, private object storage, malware scanning, liveness/document/face verification, real video/interview transport and payments. Sandbox/local adapters are not described as live production providers.

## Immediate Governor order

1. Merge PR #91 only with expected-head protection on exact verified head `7b36b61bf7c3cd96d338d923d27122f73251f67f`.
2. Verify the resulting `main` merge commit through the automatic `push: main` Full Engineering gate and confirm the merged files/acceptance certificate are present.
3. Record M2.07 as **MERGED / POST-MERGE VERIFIED** only after that mainline gate is GREEN.
4. Then advance the Governor to M2.08 interruption recovery/autosave scope; do not pull M2.09 integrity or M2.10 scoring/review into M2.08.
