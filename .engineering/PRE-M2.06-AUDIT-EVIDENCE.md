# Phase 1 Retrospective Audit Evidence — PRE-M2.06-AUDIT

**Status:** GATEKEEPER ACCEPT  
**Audit scope:** M1.01–M1.12 and M2.01–M2.05  
**Operating depth:** CRITICAL  
**Evidence head:** `1d8194026b8e23e94fc6440b5e22a6cfb734c44a`  
**Base:** `8180c0f677390bc28ebf76a8f25c9ad0011e2790`  
**Acceptance rule:** purpose-level code/schema authority, authorization/isolation, visible UX where applicable, real workflow behavior, persistence/history, purpose-relevant concurrency, exact-head regressions, and independent review.

> This audit strengthens engineering evidence. It does not rewrite the historical Milestone 1 owner-acceptance ledger and it does not claim external production providers are activated.

## Final evidence matrix

| Brick | Purpose / authority | Visible workflow evidence | Persistence / concurrency / regression evidence | Verdict |
|---|---|---|---|---|
| M1.01 | Environment validation, deterministic migrations, CI/build/preview/release boundaries are repository-owned and fail closed. | No product UI owned. Real Next.js application is started by permanent browser CI on clean migrated databases. | Full Engineering, preview smoke, release manifest, retrospective jobs and exact-SHA checkout passed. | **PASS** |
| M1.02 | Shared design/UX contracts own layout, controls, feedback, accessibility and responsive behavior. | Real authenticated Worker, Company, Verifier and Admin pages passed 390×844 no-horizontal-overflow checks with screenshots; browser console/page errors are fail conditions. | Design/UX contracts, TypeScript and lint passed. | **PASS** |
| M1.03 | Registration, OTP/MFA, fixed-role sessions and portal isolation are server-authoritative. | Worker contact verification plus Root/Admin/Verifier provisioning, MFA and cross-portal isolation passed in Chromium. | TOTP replay remained enforced; browser harness was corrected to preserve the already-authenticated session rather than weakening MFA. | **PASS** |
| M1.04 | Permissions and tenant scope are server-derived; browser tenant/role selectors cannot grant authority. | Retrospective Company/Worker/Admin/Verifier journeys exercised real protected routes and copied-role boundaries. | Authorization, tenant-scope, role matrix and mixed-role real-server burst passed. | **PASS** |
| M1.05 | Immutable audit/outbox, persisted notifications, unread state and role-safe deep links. | `M1.05 notification bell unread deep link workflow` passed in real Admin Chromium: create persisted notification through real outbox, unread count increment, deep-link open, read-state transition and reload persistence. | Notification/outbox/email runtime/concurrency suites and Full Engineering passed. | **PASS** |
| M1.06 | Private secure-file reserve/upload/quarantine/scan/access boundaries. | Worker evidence upload and Verifier authenticated PDF preview passed through real UI/server paths. | Secure-file lifecycle, malicious/tamper denial, signed access and migration/restart tests passed. Live object-storage/malware providers remain an explicit external provider boundary. | **PASS / EXTERNAL_PROVIDER_BOUNDARY** |
| M1.07 | Worker profile/identity/evidence/duplicate eligibility and permanent Worker identity. | Worker profile and identity save, navigation-away/back, reload and mobile behavior passed in Chromium. | Optimistic concurrency, immutable versions, verified-contact binding, evidence lineage and Worker-ID eligibility suites passed. | **PASS** |
| M1.08 | Company registration, verification evidence, Admin decision and tenant activation. | Real Company registration → profile → secure evidence upload/scan → submit → Admin evidence access/review → activation passed. | Latest-schema regression now exercises M1.08 through the current migration stack; 0041 preserves the pending-company secure-file authority exception lost by a later migration. | **PASS** |
| M1.09 | Sites, departments and Company Team with scoped permissions/history. | Real Site/Department create/archive/restore and Team invitation/suspend/reactivate paths passed. | Tenant scoping, owner continuity, grant ceilings, audit/history and migration/restart suites passed. | **PASS** |
| M1.10 | Worker invitation, Company code and explicit Worker linking. | Real invitation acceptance and Company registration-code linking passed with durable link/default metadata. | Capacity race, secret/hash-only storage, Worker consent, expiry/revoke and migration suites passed. | **PASS** |
| M1.11 | Typed Worker evidence records and leaving-letter history without destructive deletion. | Qualification/evidence/history and employment leaving-letter flows passed real Chromium. | Exact-version attachment isolation, replacement history, async scan finalization, stale-write protection and migration/restart suites passed. | **PASS** |
| M1.12 | Bounded public projection, non-enumeration, QR/manual verification and concern intake. | Real Chromium proved known-private vs unknown non-enumeration and `Public verification Report Concern submits through the real UI`, producing durable `public_concern_…` authority without private leakage. | Rate limits, opaque result capability, concern idempotency/evidence, rollback/restart and targeted M1.12 gate passed. | **PASS** |
| M2.01 | Company Assurance Orders/Cases, validation, submit, timeline and Action Centre ownership. | Real Company create → validate → submit → case/action state → reload/immutable submitted scope passed. | Duplicate-safe concurrent submit, tenant denial, immutable timeline/scope and cancellation tests passed. | **PASS** |
| M2.02 | Exact-version evidence review, secure preview, conflict, reassignment and immutable decision. | Assigned Verifier opened exact PDF, declared conflict, second Verifier claimed, approved, refreshed, and Company case advanced. | Claim/decision races, stale-version denial, append-only decisions and exact employment leaving-letter secure-file lineage passed. | **PASS** |
| M2.03 | Versioned frameworks/effective policy, Company tightening overrides and locked case snapshots. | Admin created framework/global policy; Company saved a stricter permitted override and proved reload persistence. | Gap/overlap fail-closed behavior, tightening-direction enforcement, tenant isolation, snapshot concurrency and rollback/reapply passed. | **PASS** |
| M2.04 | Six-type Question Bank with immutable revisions, written rubrics and answer-safe delivery. | Real Admin LONG_TEXT/rubric create → immutable v2 revision → reload → deactivate/reactivate passed. | Eight-way revision race, semantic duplicate denial, append-only history, malformed-shape denial and answer-safe delivery passed. | **PASS** |
| M2.05 | Immutable blueprints, randomized form generation, exact versions, permanent Worker stable-question non-repeat and safe delivery. | Dedicated real Chromium proved Admin blueprint create/revise/deactivate/reactivate/reload; the aggregate audit recognizes the same permanent harness rather than duplicating it. | Database-enforced cross-case Worker/question uniqueness, selector allocation, generation races, insufficient-capacity fail-closed, policy/framework binding, rollback/reapply and targeted gate passed. | **PASS** |

## Browser checkpoint inventory

The permanent fail-closed coverage contract requires and recognizes all of these checkpoints exactly once where intended:

1. Worker registration and contact verification.
2. Worker profile and identity persistence across navigation/reload.
3. Worker evidence records preserve history through visible workflow.
4. Company registration and verification workflow.
5. Company sites/departments/team workflow.
6. Company Worker invitation and Company-code linking workflow.
7. M1.05 notification bell/unread/deep-link workflow.
8. Public verification bounded non-enumerating projection.
9. Public verification Report Concern submission through real UI.
10. M2.01 Company Assurance Order and Case workflow.
11. M2.02 exact evidence detail and authenticated secure preview.
12. M2.02 conflict/reassignment/terminal-decision workflow survives refresh.
13. M2.03 Company effective-policy override workflow.
14. M2.04 Question Bank immutable revision and written rubric workflow.
15. M2.05 Assessment Blueprint create/revise/status workflow.
16. Worker 390×844 no-horizontal-overflow proof.
17. Company 390×844 no-horizontal-overflow proof.
18. Verifier 390×844 no-horizontal-overflow proof.
19. Admin 390×844 no-horizontal-overflow proof.

The Worker mobile checkpoint is guarded to execute exactly once. Browser screenshot caret instrumentation uses non-mutating settings so Playwright cannot create false hydration mismatches.

## Performance and concurrency evidence

The permanent retrospective audit records correctness under concurrency for the high-risk operations required by the Work Contract and additionally executes a real Next.js application boundary burst:

- live-session authorization/role isolation under parallel reads;
- tenant-scoped Company operations without cross-tenant leakage;
- review-task claim and terminal-decision races;
- M2.04 stale revision race;
- M2.05 same-case convergence and same-Worker cross-case non-repetition;
- **50 authenticated real-server HTTP reads:** 10 each for Worker, Company, Verifier, Admin and Root, using real registration/enrollment/login sessions.

No Internet-scale throughput claim is made from hosted CI hardware; acceptance is correctness-under-load.

## Exact-head gate evidence

All successful acceptance runs below are pull-request runs against `1d8194026b8e23e94fc6440b5e22a6cfb734c44a`:

- Phase 1 retrospective audit: **PASS** — run `33418124771` (coverage, performance/concurrency, mixed-role HTTP burst, retrospective Chromium).
- Hard Browser QA: **PASS** — run `33418124846`.
- Full Engineering verification: **PASS** — run `33418124856`, job `99573593335`; artifact `9768131609`, digest `sha256:65d30868fff9660287068450ead4f0a4f28abcf79c3c8ebf881ac14e2e3c0cea`.
- M1.11 targeted: **PASS** — run `33418124843`.
- M1.12 targeted: **PASS** — run `33418124812`.
- M2.01 targeted: **PASS** — run `33418125065`.
- M2.02 targeted: **PASS** — run `33418124874`.
- M2.04 targeted: **PASS** — run `33418124858`.
- M2.05 targeted: **PASS** — run `33418124720`.
- M2.06 targeted regression: **PASS** — run `33418124840`.
- M2.05 dedicated Chromium: **PASS** — run `33418124851`.
- M2.06 dedicated Chromium: **PASS** — run `33418124800`.

### Same-SHA infrastructure failure classification

An earlier push-triggered retrospective run on the same SHA failed before the application/browser executed because npm returned `ETARGET` for `@typescript-eslint/visitor-keys@8.69.0` while installing the pinned Playwright test dependency. The later pull-request-triggered run on the **same SHA** passed the affected jobs. This is classified as transient dependency-registry infrastructure failure, not application flakiness.

## Defects found and root-cause corrections

The audit did not merely add tests. It found and permanently repaired product and test architecture defects, including:

- HTTP-origin/runtime boundary and identity feedback defects recorded in the audit rejection files;
- M1.08 pending Company verification secure-file authority removed accidentally by a later migration; repaired by forward compatibility migration `0041` and latest-schema regression;
- employment evidence review losing the active leaving-letter PDF lineage; repaired with exact-version employment fallback and regression;
- missing production Company→M2.02 evidence-review handoff;
- missing M2.06 Worker eligibility service/UI/nav and later real-browser coverage;
- stale browser locators/timing assumptions corrected only where the product state was proven healthy;
- stale manual-handoff claim that browser automation was unavailable;
- duplicate Worker mobile checkpoint removed under an exactly-once regression.

No historic applied migration was edited to conceal a later regression.

## Independent Gatekeeper review

### Code / architecture — PASS

- M2.06 remains bounded to catalogue/eligibility; it does not implement candidate attempts, answer persistence, scoring or integrity monitoring.
- Catalogue versions are immutable/history-preserving; stale current-version races fail closed.
- Worker availability derives from owned pending Assurance Cases and locked server state rather than browser-supplied Worker identity.
- Cross-brick repairs preserve existing ownership boundaries instead of creating duplicate authorities.

### Security / data integrity — PASS

- Worker M2.06 permission is limited to `worker.assessments.read`.
- Admin catalogue mutations reauthorize `platform.operations.manage` server-side.
- Worker eligibility uses `principal.accountId`; no browser-selected Worker/tenant authority is accepted.
- Missing/mismatched policy/framework/catalogue/blueprint/qualification state fails closed.
- M2.06 read path creates no attempt/form/answer side effects.
- `0041` composes active-tenant, exact pending Company-application and public-concern secure-file authority without relaxing ordinary tenant isolation.
- No answer key, written rubric, scoring authority or internal audit secret is exposed by Worker availability DTOs.

### UI / dead controls — PASS

- Admin catalogue and Worker Available Assessments routes are reachable through their real portal navigation.
- Admin create/revise/status controls are backed by real server actions.
- Worker catalogue is explicitly read-only and contains no M2.07 `Start assessment` control.
- No orphan M2.06 route or decorative action was found.

### Stale / temporary code — PASS

- No temporary diagnostic marker, unresolved PR review thread, TODO/FIXME bypass, or audit-only self-modifying repair workflow remains.
- Manual handoff now truthfully reports permanent Chromium automation.
- PR #86 description is stale and must be updated during closeout; that metadata defect does not affect runtime evidence.

### Regression — PASS

M1.11, M1.12, M2.01, M2.02, M2.04, M2.05, M2.06 targeted gates, dedicated M2.05/M2.06 Chromium, Hard Browser, retrospective browser/performance/mixed-role audit and Full Engineering are green on the evidence head.

## External provider boundaries

Production activation still requires approved live providers/credentials for email/SMS, private object storage, malware scanning, liveness/document/face verification, real video/interview transport and payments. Accepted local/test adapters prove internal behavior but are not represented as live production activation.

## Gatekeeper verdict

`ACCEPT`

Every evidence class required by `.engineering/PRE-M2.06-AUDIT-WORK-CONTRACT.md` is populated, all required purpose-relevant user-facing completed flows have real-Chromium evidence, the correctness-under-load audit including the 50-request authenticated mixed-role server burst is green, discovered blockers were repaired at root cause, no audit-only repair workflow remains, and the independent code/security/test/UI/stale/regression review found no blocker.
