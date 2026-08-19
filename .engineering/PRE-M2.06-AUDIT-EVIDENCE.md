# Phase 1 Retrospective Audit Evidence — M1.01 through M2.05

**Audit:** PRE-M2.06-AUDIT  
**Status:** IN PROGRESS  
**Branch:** `feat/m2-06-assessment-catalogue-eligibility`  
**Audit Work Contract:** `.engineering/PRE-M2.06-AUDIT-WORK-CONTRACT.md`  
**Execution plan:** `docs/superpowers/plans/2026-08-19-phase1-retrospective-audit-before-m2-06.md`

## Evidence policy

`PROVEN` means the brick's owned behavior is demonstrated at the appropriate boundary. A user-facing brick is not `PROVEN` merely because source contracts/unit tests are green; it needs a real browser/user workflow. `PARTIAL` means substantial backend/contract evidence exists but at least one purpose-relevant browser/performance path is missing. `MISSING` means the owning behavior itself is absent. `DEFECT` means a reproduced behavior contradicts the frozen requirement. `EXTERNAL_PROVIDER_BOUNDARY` means the internal adapter/job/security boundary is proven but live provider credentials are intentionally absent.

Historical Version-10 deployment/validation claims are context only, not current acceptance proof. Connected Vercel currently exposes no HSE Verify project. Connected PostHog has no HSE-specific dashboard/evidence. The historical `chatgpt.site` URL was not inspectable by the connected web fetch in this audit cycle. Therefore current live-equivalent UX proof is repository-owned real Playwright Chromium against the real Next.js app and a clean database.

## Current exact evidence anchors

- Verified M2.05 main product head: `4ab5c2dce37389454d75c0b2c721bf535e1a8d89`.
- Verified `main` governance baseline before M2.06: `8180c0f677390bc28ebf76a8f25c9ad0011e2790`.
- M2.05 post-mainline full Engineering: run `32126092591` — PASS.
- Current pre-audit M2.06 Task-3 RED head: `777b1aaf89d19c766b60f1ee45144ea0a868c6cb`.
- Current Hard Browser on that branch: run `32129897713` — PASS, artifact `9321806866`, digest `sha256:125879dbfc2d2054f6d7e9d12995e2f5361837906eb0336a579adf02a7d5113f`.
- Current Hard Browser artifact contains only 9 checkpoints: public routes, zero-state Root bootstrap, Root MFA/isolation, Root→Admin/Verifier provisioning, M2.03 Admin framework/policy, M2.04 Question Bank create/status, Admin role isolation, M2.02 queue refresh, and one Verifier mobile-overflow check.
- M2.01 targeted on RED head: `32129897747` — PASS.
- M2.04 targeted on RED head: `32129897668` — PASS.
- M2.05 targeted on RED head: `32129897634` — PASS.
- M1.11 targeted on RED head: `32129897550` — PASS.
- Full Engineering on RED head `32129897654` stopped at the global authorization least-privilege test because that older expected matrix had not yet included the new M2.06 Worker-only `worker.assessments.read` permission. The failing expectation was corrected at `993e486db20adc2c80eaced1a36554fcf1e1dc19`; this is an M2.06 test-contract synchronization defect, not an M1.01–M2.05 product failure.

## Milestone evidence matrix — initial audit inventory

| Brick | Frozen purpose | Code/schema & automated evidence | Current browser/UI/workflow evidence | Performance/concurrency evidence | Initial verdict |
|---|---|---|---|---|---|
| M1.01 | Repository, environments, CI/CD, migrations, build, rollback | `validate:env`, engineering automation checks, migration runners, production build/preview/release-manifest gates; verified M2.05 mainline Engineering PASS | No user UI owned. Connected Vercel has no HSE project, so current hosted-deployment health is not independently observable from Vercel | CI/build execution exists; no dedicated retrospective deployment/performance artifact yet | PARTIAL |
| M1.02 | Shared design system, layouts, forms, tables, messages, dialogs, responsive accessibility | `check:design-system`, `check:ux`, profile overflow tests, route/build checks | Current Chromium checks only Verifier mobile overflow plus sampled Admin/Verifier pages; no representative Worker/Company/Admin responsive/a11y workflow matrix | No dedicated render/navigation burst | PARTIAL |
| M1.03 | Worker/Company registration, OTP, staff provisioning/MFA, role-bound sessions, strict portal guards | auth unit/integration/concurrency/completion/portal-isolation suites; route checks | Real Chromium proves Root/Admin/Verifier enrollment/MFA and some cross-portal isolation. Worker and Company registration/contact-verification/login are not in the permanent hard-browser journey | Auth concurrency tests exist; mixed-role HTTP burst not yet audited | PARTIAL |
| M1.04 | Explicit permission model, server-derived tenant scope, cross-role/tenant isolation | authorization unit/final isolation/tenant-scope/company-scope suites; copied-ID and SQL guards | Chromium proves Root/Admin/Verifier crossover denial only. Worker↔Company crossover and two-tenant browser workflow are not currently exercised | Repository has tenant/concurrency tests; no unified mixed-role 50-request audit | PARTIAL |
| M1.05 | Immutable audit, outbox, notifications, email queue, role-specific deep links | audit/outbox/notification/email runtime and concurrency suites; centralized audit guards | No current Chromium checkpoint opens notification UI/deep links or verifies role-specific redirect behavior | Audit/outbox concurrency suites exist | PARTIAL |
| M1.06 | Secure private uploads, MIME/size, quarantine, scan adapter, signed preview | secure-file/upload/scan/access platform/runtime/final acceptance suites | No current Chromium Worker upload → quarantine/available → preview journey; no real Verifier evidence preview in current hard-browser | Secure-file/upload concurrency suites exist; live provider activation intentionally external | PARTIAL / EXTERNAL_PROVIDER_BOUNDARY |
| M1.07 | Worker profile, identity documents/photo, duplicate checks, Worker ID, corrections/status | Worker identity foundation/draft/evidence/automated/eligibility/corrections + final acceptance suites | Current hard-browser does not register a Worker or exercise Profile/Identity navigation/reload/upload/correction/Worker-ID states | Identity concurrency/readiness tests exist; no browser timing audit | PARTIAL |
| M1.08 | Company registration, tenant, initial admin, verification case/settings | Company verification source/runtime/transition suites | Current hard-browser does not register/verify a Company through Company UI | Internal transition/concurrency protection exists; no browser/load evidence | PARTIAL |
| M1.09 | Sites, departments, team, archival, staff invitations/scoped permissions | `check:m1-09`, `test:m1-09`, authorization ceilings/history | No current Chromium Company sites/departments/team CRUD or archive workflow | Internal tenant/concurrency guards exist; no UI/load evidence | PARTIAL |
| M1.10 | Worker invitations/company codes, defaults, linking | `check:m1-10`, `test:m1-10`, current M1.10 targeted workflow | No current Chromium Company worker invitation/code redemption/linking workflow | Internal duplicate/concurrency protections exist; no UI/load evidence | PARTIAL |
| M1.11 | Qualification/experience/employment/skill/leaving-letter records with preserved history | `check:m1-11`, `test:m1-11`, current targeted run `32129897550` PASS | No current Chromium Worker evidence create/upload/revise/end/leave-letter/history journey | Runtime/concurrency/history tests exist; no browser/load evidence | PARTIAL |
| M1.12 | Public Worker-ID verification, safe projection, concern/QR foundation | `check:m1-12`, `test:m1-12` including rate limits/non-enumeration | Current hard-browser public-route sample does not exercise a known/unknown Worker ID, safe projection or concern workflow | Rate-limit/idempotency tests exist; no browser burst evidence | PARTIAL |
| M2.01 | Assurance Order draft/validate/submit, Worker cases, timeline, Action Centre ownership | targeted `32129897747` PASS; full runtime proves one case per Worker, duplicate-safe submit, cross-tenant copied-ID denial, immutable history | No current Chromium Company Assurance Order/Case/Action Centre workflow | Concurrent submit exactly-one already proven internally; no HTTP/browser load | PARTIAL |
| M2.02 | Exact-version evidence verification queues, conflicts, decisions | full runtime suite proves queue idempotency, claim race, conflict release, stale version denial, exactly-one terminal decision, changes requested, history rollback | Current Chromium proves queue navigation/refresh only; it does not create a real task then open candidate/file preview and execute conflict/decision workflow | Claim/decision concurrency is strong internally | PARTIAL |
| M2.03 | Frameworks, effective global policy, tenant tightening overrides, immutable case snapshot | runtime proves global/override resolution, weakening denial, tenant isolation, gaps/overlap fail-closed, concurrent snapshot pinning, order integration | Current Chromium proves Admin framework + immutable policy publication. Company effective-policy override UI is not in current hard-browser journey | Snapshot concurrency internally proven | PARTIAL |
| M2.04 | Six-type Question Bank, written rubrics, immutable versions/status, safe delivery | targeted `32129897668` PASS; runtime covers six types, validation, semantic duplicates, revoked Admin, stale revision race, safe delivery, tamper/rollback | Current Chromium proves create, reload and status toggle for one MCQ; no visible revise or written-question/rubric browser path in current hard-browser | 8-way revision race internally proven | PARTIAL |
| M2.05 | Immutable randomized forms, unseen/permanent non-repeat, exact versions/order, fail-closed capacity, answer-safe delivery | targeted `32129897634` PASS; DB integrity, rollback/reapply, selector allocation, Admin blueprint, cross-case same-Worker race, same-case convergence, safe delivery | Dedicated accepted M2.05 Chromium already proved Admin blueprint create/revise/status/reload. Candidate attempt UI correctly not owned until M2.07 | Strong internal concurrency: same-case convergence + cross-case Worker-question uniqueness | PROVEN (subject to retrospective regression) |

## Existing hard-browser artifact inspection

Current artifact `9321806866` was unpacked and inspected directly. `results.json` contains 9/9 PASS. Representative checkpoint durations on CI/dev-mode Chromium:

- public route sweep: 3876 ms;
- zero-state Root bootstrap: 1466 ms;
- Root MFA/login/isolation: 2461 ms;
- Root provisions Admin/Verifier: 745 ms;
- M2.03 framework/policy: 1320 ms;
- M2.04 Question Bank: 1283 ms;
- Admin cross-role isolation: 242 ms;
- M2.02 Verifier queue navigation/reload: 780 ms;
- mobile Verifier overflow check: 205 ms.

These are diagnostic timings from GitHub-hosted dev-mode execution, **not production latency SLAs**.

Server-log inspection found no M2.02/M2.03/M2.04 application exception. It did contain React/Next development diagnostic markup showing transient `caret-color: transparent` style differences around interacted inputs; because the browser harness did not record a page error or console error, this is currently `INVESTIGATE / NON-BLOCKING` rather than a product defect. The expanded audit should continue to fail on actual page/console errors.

## Confirmed audit gaps that must be closed before Gatekeeper

1. Worker registration/contact verification real-browser journey.
2. Worker Profile + Identity navigation/reload and secure identity/evidence upload/preview journey.
3. Worker qualification/experience/employment/skill history workflow in real browser.
4. Company registration/verification real-browser journey.
5. Company Sites/Departments/Team real-browser workflow.
6. Company Worker invitation/company-code/linking real-browser workflow.
7. Public verification known/unknown safe projection and concern path in real browser.
8. M2.01 Company Assurance Order/Case/Action Centre real-browser workflow.
9. M2.02 real evidence task detail + Worker/file identity + preview + conflict/decision + refresh/non-enumeration browser workflow.
10. M2.03 Company effective-policy override browser workflow.
11. M2.04 visible immutable revision plus at least one written/rubric authoring browser workflow.
12. Representative Worker/Company/Admin mobile overflow/control-access checks.
13. Purpose-relevant consolidated concurrency/performance audit, including 50 authenticated mixed-role HTTP reads if the real server harness can provision them safely.
14. Fresh full Engineering gate after synchronizing the M2.06 Worker permission into the global least-privilege expected matrix.

## Next evidence action

Write and run a failing `hard-browser-audit-contract` that names the missing checkpoints above. Then expand the real Chromium script until that contract and the browser journey prove the completed UI/workflow surface. Do not resume M2.06 Task 3 production implementation before this audit reaches Gatekeeper ACCEPT.
