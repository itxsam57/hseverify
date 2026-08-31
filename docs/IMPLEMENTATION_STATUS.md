# HSE Verify — Current Milestone Checklist

**Status date:** 31 August 2026  
**Branch:** `feat/m2-07-assessment-window`  
**Current Governor state:** M2.06 merged/post-merge verified; M2.07 Gatekeeper accepted on code evidence head `9727d56261d51f7a2c6f61053ccb221d20e529d5`; final governance metadata exact-head verification is in progress before merge.  
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
- M2.07 milestone certificate: **ACCEPTED / PROVEN — PRE-MERGE METADATA REVERIFICATION IN PROGRESS**.
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
| **M2.07 Candidate Assessment Window** | Real Worker start → one pinned question → durable answer-before-next → written question → reload → final submit passed Chromium. Server/runtime gates prove all six types, stale/duplicate/concurrent idempotency, transaction rollback, pinned-version continuity, cross-Worker denial, append-only committed answers, safe Server→Client projection and no future-question/answer-key/rubric/scoring/internal-attempt leakage. Final submit intentionally keeps the Assurance Case at `Assessment in progress`. | **ACCEPTED / PROVEN — PRE-MERGE METADATA REVERIFICATION** |
| **M2.08 Answer Persistence and Interruption Recovery** | Not built. This brick owns uncommitted autosave/recovery and interruption/emergency behavior; M2.07 only reloads committed state. | **NOT BUILT** |
| **M2.09 Integrity Engine** | Not built. Webcam/mic/screen secure-window and integrity incident behavior remain outside M2.07. | **NOT BUILT** |
| **M2.10 Written Scoring and Review Engine** | Not built. Correctness/scoring/pass-fail/reviewer allocation/result publication and transition beyond `Assessment in progress` remain outside M2.07. | **NOT BUILT** |

## M2.07 acceptance evidence

M2.07 was implemented through a strict RED→GREEN sequence and independently Gatekeeper-reviewed. The accepted code evidence head is `9727d56261d51f7a2c6f61053ccb221d20e529d5`; the certificate is `.engineering/M2.07-ACCEPTANCE.md`.

- Task 1 persistence/domain exact correction head `e7713a344f0c14ccdc1380ce3138b328cd1080f9`; targeted run `33429643196` **PASS** after the intended RED schema lineage failure was fixed.
- Task 2 atomic begin head `905edd09dc3a41988e049a92cb43cd04d61c6363`; M2.07 targeted run `33430642887` **PASS**.
- Task 3 answer progression/concurrency culminated at `a6799c1c…`; the targeted suite passed six answer types, commit-before-next, duplicate/concurrent idempotency, conflict and rollback behavior before UI work advanced.
- Task 5 real-browser journey was proven after two harness-only defects were isolated without production changes: a seeded Worker missing `worker_reference`, then fuzzy Playwright `Next` matching the Next.js Dev Tools button. The corrected journey passed login, start, MCQ progression, written-question reload, cross-Worker denial, final submit and secrecy scans.
- Permanent M2.07 Engineering wiring was implemented through `cf450bcba2f1507036d657ec26c54d056f8dc7f8` after its own intended RED contract.
- Gatekeeper review then caught and corrected two additional acceptance blockers with new RED tests before fixes: internal attempt metadata crossing the Server→Client boundary, and direct database mutability of committed answer rows.
- Exact accepted code head `9727d56261d51f7a2c6f61053ccb221d20e529d5`: M2.07 targeted run `33440893266` **PASS**; dedicated M2.07 browser run `33440893171` **PASS**; Hard Browser run `33440893224` **PASS**; Phase 1 retrospective run `33440893250` **PASS**; Full Engineering run `33440893197` **PASS**, job `99648758412`, artifact `9776501359`, digest `sha256:c9749ef22133208eb35e3b4fb3bf0d041e67a4ab49c0a0bef184803b34eae5d8`.
- Same-head regressions: M2.06 targeted `33440893256` **PASS**; M2.06 browser `33440893311` **PASS**; M2.05 targeted `33440893194` **PASS**; M2.04 targeted `33440893153` **PASS**; M2.01 targeted `33440893243` **PASS**; M1.12 targeted `33440893188` **PASS**; M1.11 targeted `33440893269` **PASS**.
- PR #91 independent diff review found no M2.08/M2.09/M2.10 scope creep, no browser Worker/form/scoring authority, no future-question/answer-key/rubric leakage, no GET mutation, no `Review pending` transition and no unresolved review thread.

The acceptance certificate and this ledger update are governance-only commits added after the code evidence head. The resulting final pre-merge metadata head must receive fresh exact-head verification before merge.

## Provider boundaries still not production-live

Production activation still requires approved live credentials/services for email/SMS, private object storage, malware scanning, liveness/document/face verification, real video/interview transport and payments. Sandbox/local adapters are not described as live production providers.

## Immediate Governor order

1. Freeze the final M2.07 pre-merge metadata head and require the M2.07 targeted gate, dedicated M2.07 Chromium, inherited Hard Browser, Phase 1 retrospective, M2.05/M2.06 regressions and Full Engineering verification on that exact head.
2. If the metadata exact-head stack is clean, restore PR #91's full evidence body, mark it ready for review and merge with expected-head protection if repository policy permits.
3. Verify the exact merged `main` head with the established post-merge Engineering pattern and record the final merged/post-merge state.
4. Only after M2.07 post-merge verification, advance the Governor to M2.08 interruption recovery/autosave scope.
