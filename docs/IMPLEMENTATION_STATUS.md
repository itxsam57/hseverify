# HSE Verify — Current Milestone Checklist

**Status date:** 31 August 2026  
**Branch:** `main`  
**Current Governor state:** M2.07 Candidate Assessment Window is **ACCEPTED / PROVEN / MERGED / POST-MERGE VERIFIED** on `main` merge commit `5f26aeb4f1740835de67c42311b745e73d205061`. The next unfinished brick is M2.08 Answer Persistence and Interruption Recovery; implementation has not started because its architecture approval gate is still pending.  
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
- M2.07 milestone certificate: **ACCEPTED / PROVEN / MERGED / POST-MERGE VERIFIED**.
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
| **M2.07 Candidate Assessment Window** | Real Worker start → one pinned question → durable answer-before-next → written question → reload → final submit passed Chromium. Server/runtime gates prove all six types, stale/duplicate/concurrent idempotency, transaction rollback, pinned-version continuity, append-only committed answers, cross-Worker denial, safe Server→Client projection and no future-question/answer-key/rubric/scoring/internal-attempt leakage. Final submit intentionally keeps the Assurance Case at `Assessment in progress`. | **ACCEPTED / PROVEN / MERGED / POST-MERGE VERIFIED** |
| **M2.08 Answer Persistence and Interruption Recovery** | Not built. This brick owns uncommitted autosave/offline recovery, one-session/device attempt leasing, interruption/emergency behavior, controlled resume/recovery and replacement-form recovery. M2.07 only reloads committed state. | **NOT BUILT — DESIGN APPROVAL PENDING** |
| **M2.09 Integrity Engine** | Not built. Webcam/mic/screen secure-window and integrity incident behavior remain outside M2.08. | **NOT BUILT** |
| **M2.10 Written Scoring and Review Engine** | Not built. Correctness/scoring/pass-fail/reviewer allocation/result publication and transition beyond `Assessment in progress` remain outside M2.08. | **NOT BUILT** |

## M2.07 Gatekeeper and integration evidence

M2.07 was implemented through strict RED→GREEN TDD, independently Gatekeeper-reviewed, exact-head reverified after governance metadata, merged through accepted integration PR #92, and verified again on the actual `main` merge commit.

- Accepted code evidence head `9727d56261d51f7a2c6f61053ccb221d20e529d5`: M2.07 targeted run `33440893266` **PASS**; dedicated M2.07 browser run `33440893171` **PASS**; Hard Browser run `33440893224` **PASS**; Phase 1 retrospective run `33440893250` **PASS**; Full Engineering run `33440893197` **PASS**, job `99648758412`, artifact `9776501359`, digest `sha256:c9749ef22133208eb35e3b4fb3bf0d041e67a4ab49c0a0bef184803b34eae5d8`.
- Gatekeeper review caught and fixed two additional blockers with new RED regression tests before production fixes: internal attempt metadata crossing the Server→Client boundary, and direct database mutability of committed answer rows.
- Final pre-merge governance head `ca1479863d226b784653426d30df375eb1183022`: M2.07 targeted run `33442007745` **PASS**; M2.07 browser `33442007684` **PASS**; Hard Browser `33442007694` **PASS**; Phase 1 retrospective `33442007689` **PASS**; M2.06 targeted/browser, M2.05 targeted, M2.04 targeted, M2.01 targeted, M1.12 targeted and M1.11 targeted regressions all **PASS**; Full Engineering run `33442007697` **PASS**, artifact `9776888017`, digest `sha256:116a844d5a28d415c230d6fa628e446e0b6bcbd64762e3ce66fbc598dc635f3a`.
- The connected GitHub draft→ready mutation for development PR #91 failed because of a connector GraphQL response-schema error. No repository code changed as a result. A non-draft integration branch pointing to the exact same verified SHA was opened as PR #92.
- PR #92 merged with expected-head protection. Authoritative `main` merge commit: `5f26aeb4f1740835de67c42311b745e73d205061`.
- Automatic `push: main` Full Engineering run `33443005675` **PASS** on the actual merge commit. Post-merge artifact `9777227993`, digest `sha256:5b86b597522314124e53ad83b09a2fe8da793f01add0267015db2e955953d179`.
- Development PR #91 was closed without merge as superseded by PR #92. It remains only as TDD/development history, not as a source of truth.
- Acceptance certificate: `.engineering/M2.07-ACCEPTANCE.md`.

## Provider boundaries still not production-live

Production activation still requires approved live credentials/services for email/SMS, private object storage, malware scanning, liveness/document/face verification, real video/interview transport and payments. Sandbox/local adapters are not described as live production providers.

## Immediate Governor order

1. Treat `main` commit `5f26aeb4f1740835de67c42311b745e73d205061` as the canonical M2.07 post-merge checkpoint.
2. Freeze M2.09 integrity/proctoring and M2.10 scoring/review scope; neither may leak into M2.08.
3. Complete and obtain owner approval for the M2.08 Answer Persistence and Interruption Recovery architecture before implementation.
4. After approval, create a new M2.08 feature branch from the verified `main` checkpoint and execute it through strict RED→GREEN TDD, dedicated real-browser proof, inherited regressions, Gatekeeper review and post-merge verification.
