# HSE Verify — Current Milestone Checklist

**Status date:** 20 August 2026  
**Branch:** `feat/m2-06-assessment-catalogue-eligibility`  
**Governor state:** retrospective foundation audit before M2.06 production completion  
**Current rule:** a milestone is not called fully functional merely because unit/runtime/type/lint/build tests pass. User-facing milestones require permanent real-Chromium UI/workflow evidence at the purpose-relevant boundary.

## Historical formal Milestone 1 closure ledger

This ledger preserves the formal Engineering Factory closure state recorded before the stricter retrospective browser Gatekeeper was introduced. It is historical evidence, not a downgrade of the current audit verdicts below.

- Formal Milestone 1 progress: **7 of 12 (7/12)**.
- **M1.07 — DONE**.
- **M1.08 — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- **M1.09 — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- **M1.10 — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- **M1.11 — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- **M1.12 — IN PROGRESS**.

The retrospective audit below intentionally applies a stronger acceptance standard to those previously engineering-closed bricks. Both records are retained so historical closure evidence and current consumer-level proof remain distinguishable.

## Status legend

- **ACCEPTED / PROVEN** — implementation, code tests, UI/workflow where applicable, integrity/concurrency, and Gatekeeper evidence are complete for the milestone-owned boundary.
- **IMPLEMENTED / ENGINEERING GREEN / AUDIT OPEN** — production code exists and engineering gates are strong, but the current retrospective browser/UX audit has not yet proven every purpose-relevant user journey.
- **CORE UI PROVEN / AUDIT OPEN** — a fresh real-browser checkpoint proves the named core UI path, but the milestone remains inside the wider retrospective audit until Gatekeeper acceptance.
- **TDD RED / PAUSED** — scaffold/contracts exist but production behavior is intentionally incomplete.
- **NOT BUILT** — milestone production implementation has not started.

## Current counts

### Current frozen Governor window through M2.10

- Total milestone bricks: **22** (`M1.01–M1.12` + `M2.01–M2.10`).
- Production milestones with substantial implementation through M2.05: **17**.
- Milestones already carrying a milestone-level **ACCEPTED / PROVEN** certificate in the current clean-build evidence: **1 — M2.05**.
- Additional implemented milestones currently being re-proven by the retrospective UI/UX/performance Gatekeeper: **16**.
- Not yet production-complete in the current five-milestone Governor queue: **5 — M2.06–M2.10**.

The repository Governor currently enumerates only the next five milestones through M2.10. Do not invent M2.11+ counts unless the canonical roadmap is explicitly extended.

## Milestone checklist

| Milestone | Purpose | Code / backend status | UI/UX proof status | Current verdict |
|---|---|---|---|---|
| **M1.01 Repository, Environments, CI/CD** | Reproducible environments, migrations, build, preview/release verification and rollback foundations. | Current full Engineering gate is green; migrations/build/type/lint/release checks exist. | No product UI owned. Hosted production telemetry is not currently accepted as evidence. | **IMPLEMENTED / ENGINEERING GREEN / AUDIT OPEN** |
| **M1.02 Design System and Global UX** | Shared layouts, controls, forms, tables, feedback, responsive behavior and accessibility foundations. | Design/UX contracts and application gates exist. | Representative all-role mobile/responsive checkpoint is still open. | **IMPLEMENTED / AUDIT OPEN** |
| **M1.03 Authentication and Portal Isolation** | Worker/Company registration, OTP/MFA staff enrollment, login, logout and strict role-bound portal isolation. | Auth/session/role isolation suites are strong. | Fresh Chromium proves Worker registration/contact verification and staff MFA/isolation; the current Company re-run still needs a completed fresh browser cycle. | **CORE UI PROVEN / AUDIT OPEN** |
| **M1.04 Authorization and Tenant Isolation** | Explicit permissions, server-derived tenant authority, copied-ID denial and cross-role/cross-tenant isolation. | Authorization and tenant-scope tests are green; visible Company tenant-scope entry point was restored during audit. | Wider browser isolation proof remains part of the Gatekeeper audit. | **IMPLEMENTED / ENGINEERING GREEN / AUDIT OPEN** |
| **M1.05 Audit, Outbox, Notifications and Email Queue** | Immutable audit history, durable jobs/outbox, persisted notifications and role-correct deep links. | Runtime/concurrency foundations exist. | Purpose-level notification/deep-link browser proof is not yet a completed retrospective checkpoint. | **IMPLEMENTED / AUDIT OPEN** |
| **M1.06 Secure Storage and Upload Pipeline** | Private evidence upload, validation, quarantine, malware-scan boundary and safe preview authorization. | Secure-file validation/access/concurrency architecture exists. | Worker secure evidence upload/history has passed Chromium; Verifier exact-evidence preview is still open under M2.02. Live storage/scan providers remain external. | **CORE UI PROVEN / AUDIT OPEN / EXTERNAL PROVIDER BOUNDARY** |
| **M1.07 Worker Onboarding and Identity Engine** | Worker profile, identity details/evidence, corrections, duplicate protection and stable Worker identity. | Identity engine and persistence/concurrency logic implemented. | Fresh Chromium proves profile + identity save, navigation-away/back and hard-reload persistence. | **CORE UI PROVEN / AUDIT OPEN** |
| **M1.08 Company Registration and Verification** | Company onboarding, verification evidence, Admin decision and tenant activation. | Production implementation exists; Admin review service/UI was repaired and hardened during audit. | Current browser script covers registration → evidence → Admin review → verification, but the newest full browser execution has not completed after the latest harness changes. | **IMPLEMENTED / ENGINEERING GREEN / UI RE-PROOF PENDING** |
| **M1.09 Sites, Departments and Company Team** | Tenant organization structure, archival/restoration and scoped Company staff access. | Production implementation and engineering tests exist. | Real Chromium workflow is now scripted for Site/Department create, archive/restore and Team invite/suspend/reactivate, but a fresh complete execution is still pending. | **IMPLEMENTED / UI RE-PROOF PENDING** |
| **M1.10 Worker Invitations and Company Codes** | Company-to-Worker invitation, bounded registration codes, Worker consent/linking and defaults. | Production implementation and duplicate/concurrency protections exist. | Real Chromium invitation + existing-Worker consent + Company-code redemption workflow is now scripted; latest coverage contract has progressed past this checkpoint, but a full fresh browser execution is still pending. | **IMPLEMENTED / UI RE-PROOF PENDING** |
| **M1.11 Employment, Experience, Qualification, Skill and Leaving Records** | Worker evidence records with secure uploads, revisions and preserved history instead of destructive deletion. | Targeted M1.11 gate is green on current head. | Fresh Chromium passed Worker evidence/history workflow. | **CORE UI PROVEN / AUDIT OPEN** |
| **M1.12 Public Verification Foundation** | Privacy-safe Worker-ID verification, bounded public projection, non-enumeration/rate limiting and concern intake foundation. | Current M1.12 targeted gate is green. | **This is the next missing permanent real-browser checkpoint identified by the current coverage contract.** | **IMPLEMENTED / ENGINEERING GREEN / UI PROOF MISSING** |
| **M2.01 Assurance Order and Case Engine** | Company Assurance Orders, one worker-specific Assurance Case per target, validation/submit, timeline and ownership/action state. | Current M2.01 targeted gate is green; duplicate-safe submit/concurrency and tenant denial are tested. | Company Assurance Order/Case real-browser workflow is still open. | **IMPLEMENTED / ENGINEERING GREEN / UI PROOF MISSING** |
| **M2.02 Evidence Verification Queues** | Exact-version Verifier queues, claim/conflict handling, secure evidence review and immutable terminal decisions. | Strong runtime tests cover idempotency, races, stale evidence denial and terminal decisions. | Basic queue navigation exists; exact evidence detail/secure preview plus conflict/decision/refresh browser proof remains open. | **IMPLEMENTED / ENGINEERING GREEN / UI PROOF PARTIAL** |
| **M2.03 Frameworks and Effective Policy** | Versioned frameworks/global policy, Company tightening overrides and immutable case policy snapshots. | Resolver, fail-closed policy logic, snapshots and order integration implemented/tested. | Admin framework/policy publication is browser-proven; Company effective-policy override UI workflow is still open. | **IMPLEMENTED / ENGINEERING GREEN / UI PROOF PARTIAL** |
| **M2.04 Question Bank** | Six question types, immutable revisions/status, MCQ/boolean/numeric validation, written rubrics and answer-safe delivery. | Current M2.04 targeted gate is green; revision races and safe delivery are tested. | Create/status UI exists; immutable revise + written rubric authoring browser checkpoint remains open. | **IMPLEMENTED / ENGINEERING GREEN / UI PROOF PARTIAL** |
| **M2.05 Randomized Assessment Form Generation** | Immutable blueprints, complete server-side form generation, exact question versions, cryptographic randomization and permanent Worker-level non-repeat. | Accepted architecture includes DB-enforced cross-case non-repeat, safe delivery and concurrency protection. | Dedicated Chromium proved Admin blueprint create/revise/deactivate/reactivate/reload. Candidate attempt UI is correctly outside M2.05. | **ACCEPTED / PROVEN** |
| **M2.06 Assessment Catalogue and Eligibility** | Versioned assessment catalogue and backend-authoritative Worker eligibility from owned pending cases, locked policy/framework and verified evidence. | Migration/domain/contracts exist; production eligibility service is intentionally absent at the current RED checkpoint. | Admin/Worker final UI cannot be accepted until the production service is completed after retrospective Gatekeeper ACCEPT. | **TDD RED / PAUSED** |
| **M2.07 Candidate Assessment Window** | Dedicated candidate runtime with one question displayed at a time and server-authoritative attempt progression. | Not built. | Not built. | **NOT BUILT** |
| **M2.08 Answer Persistence and Interruption Recovery** | Durable answer save/autosave, restore/resume, interruption/emergency recovery and no lost written answers. | Not built. | Not built. | **NOT BUILT** |
| **M2.09 Integrity Engine** | Assessment integrity/proctoring signals and secure event capture without silently changing assessment authority. | Not built. | Not built. | **NOT BUILT** |
| **M2.10 Written Scoring and Review Engine** | Rubric-based written scoring, reviewer workflow, immutable scoring/review history and safe case progression. | Not built. | Not built. | **NOT BUILT** |

## Fresh evidence on current audit head before this documentation update

- Full Engineering verification gate: **PASS** — run `32232044951`.
- M1.11 targeted gate: **PASS** — run `32232044991`.
- M1.12 targeted gate: **PASS** — run `32232044897`.
- M2.01 targeted gate: **PASS** — run `32232044902`.
- M2.04 targeted gate: **PASS** — run `32232044954`.
- M2.05 targeted gate: **PASS** — run `32232044929`.
- Retrospective correctness/concurrency performance lane: **PASS** — run `32232045063`.
- Retrospective coverage contract: **EXPECTED RED**, currently stopping at `Public verification uses a bounded non-enumerating projection`.
- M2.06 targeted gate: **EXPECTED RED** while the production eligibility service remains paused for the retrospective Gatekeeper.
- Hard Browser QA: **RED** because it shares the still-incomplete retrospective coverage contract, not because M1.11/M1.12/M2.01/M2.04/M2.05 code gates are red.

## External provider boundaries still not production-live

Live provider credentials/integrations are still required for production email/SMS delivery, private object storage, malware scanning, liveness/face/document verification, real video/interview transport and payments. Sandbox/queued adapters can prove internal application behavior but are not equivalent to live provider activation.

## Immediate order from Governor

1. Finish retrospective real-browser coverage beginning with **M1.12 Public Verification**.
2. Then prove **M2.01 Assurance Order/Case**.
3. Then prove **M2.02 exact evidence preview + conflict/decision**.
4. Then prove **M2.03 Company policy override**.
5. Then prove **M2.04 immutable revision + written rubric**.
6. Regress **M2.05** and complete representative mobile/responsive checks.
7. Gatekeeper ACCEPT the retrospective foundation audit.
8. Resume M2.06 production eligibility service and finish M2.06 UI/UX.
9. Build M2.07, M2.08, M2.09 and M2.10 sequentially with TDD, browser UI/UX, concurrency/performance and exact-head Engineering gates.