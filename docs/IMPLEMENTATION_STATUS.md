# HSE Verify — Current Milestone Checklist

**Status date:** 31 August 2026  
**Branch:** `feat/m2-07-assessment-window`  
**Current Governor state:** M2.06 merged/post-merge verified; M2.07 implementation complete and in exact-head Gatekeeper closeout.  
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
- M2.07: **IMPLEMENTED / REAL-BROWSER PROVEN — EXACT-HEAD GATEKEEPER CLOSEOUT IN PROGRESS**.
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
| **M2.07 Candidate Assessment Window** | Real Worker start → one pinned question → durable answer-before-next → written question → reload → final submit passed Chromium. Server/runtime gates prove all six types, stale/duplicate/concurrent idempotency, transaction rollback, pinned-version continuity, cross-Worker denial and no future-question/answer-key/rubric/scoring leakage. Final submit intentionally keeps the Assurance Case at `Assessment in progress`. | **IMPLEMENTED / REAL-BROWSER PROVEN — GATEKEEPER CLOSEOUT** |
| **M2.08 Answer Persistence and Interruption Recovery** | Not built. This brick owns uncommitted autosave/recovery and interruption/emergency behavior; M2.07 only reloads committed state. | **NOT BUILT** |
| **M2.09 Integrity Engine** | Not built. Webcam/mic/screen secure-window and integrity incident behavior remain outside M2.07. | **NOT BUILT** |
| **M2.10 Written Scoring and Review Engine** | Not built. Correctness/scoring/pass-fail/reviewer allocation/result publication and transition beyond `Assessment in progress` remain outside M2.07. | **NOT BUILT** |

## M2.07 implementation evidence before final closeout head

The following evidence was produced during the strict RED→GREEN implementation cycle and is retained as development evidence. Final acceptance still requires a fresh exact-head full stack after the governance/status closeout changes.

- Task 1 persistence/domain exact correction head `e7713a344f0c14ccdc1380ce3138b328cd1080f9`; targeted run `33429643196` **PASS** after the intended RED schema lineage failure was fixed.
- Task 2 atomic begin head `905edd09dc3a41988e049a92cb43cd04d61c6363`; M2.07 targeted run `33430642887` **PASS**.
- Task 3 answer progression/concurrency culminated at `a6799c1c…`; the targeted suite passed six answer types, commit-before-next, duplicate/concurrent idempotency, conflict and rollback behavior before UI work advanced.
- Task 5 real-browser journey was proven after two harness-only defects were isolated without production changes: a seeded Worker missing `worker_reference`, then fuzzy Playwright `Next` matching the Next.js Dev Tools button. The corrected journey passed login, start, MCQ progression, written-question reload, cross-Worker denial, final submit and secrecy scans.
- On implementation head `9939d38a5dfb9facab1b9c967495c9fbd3435fb4`, M2.07 real browser QA run `33438046466`, Hard Browser run `33438046469`, Phase 1 retrospective run `33438046399`, M2.05 targeted regression `33438046431`, M2.06 targeted regression `33438046419`, M2.06 browser regression `33438046408`, M2.04 targeted regression `33438046360`, M2.01 targeted regression `33438046409` and M1.11 targeted regression `33438046439` all passed. The M2.07 targeted run intentionally remained RED only at the newly-added permanent Engineering-gate contract because the checker/wiring did not exist yet.
- M2.07 permanent-gate wiring was then implemented through `cf450bcba2f1507036d657ec26c54d056f8dc7f8`.

## Provider boundaries still not production-live

Production activation still requires approved live credentials/services for email/SMS, private object storage, malware scanning, liveness/document/face verification, real video/interview transport and payments. Sandbox/local adapters are not described as live production providers.

## Immediate Governor order

1. Run the complete M2.07 targeted gate on the final governance/status head and require persistence/domain, rollback/reapply, atomic begin, all six answer types, concurrency/replay, UI/action, browser contract, audit, permanent-gate contract, strict TypeScript and lint to pass together.
2. Run dedicated M2.07 real Chromium on the same exact head and retain evidence.
3. Require inherited Hard Browser, Phase 1 retrospective, M2.05/M2.06 regressions and Full Engineering verification on the same exact head.
4. Perform explicit PR #91 diff review for M2.08/M2.09/M2.10 scope creep, browser Worker-id/form/scoring authority, future-question/answer-key/rubric leakage, GET mutation, `Review pending` transition and temporary diagnostics.
5. Issue M2.07 Gatekeeper acceptance only if the exact-head stack and review are clean.
6. Update PR #91 from draft/TDD wording, merge with expected-head protection if repository policy permits, then verify merged `main` exact head.
7. Only after M2.07 post-merge verification, advance the Governor to M2.08 interruption recovery/autosave scope.
