# Engineering Factory Work Contract — Phase 1 Retrospective Audit Before M2.06–M2.10

**Audit ID:** PRE-M2.06-AUDIT  
**Operating depth:** CRITICAL  
**Canonical branch:** `feat/m2-06-assessment-catalogue-eligibility`  
**Source of truth:** current mapped GitHub repository + Canonical Phase 1 Blueprint  
**Purpose:** independently re-verify every completed brick M1.01–M2.05 against its intended product purpose before adding M2.06–M2.10 production behavior.

## Governing principle

Previous green tests are evidence, not immunity. Each completed brick must prove its **purpose**, not merely compile. A brick is acceptable only when code/schema authority, authorization, visible UX, real workflow behavior, recovery/history rules, and realistic performance/concurrency are all either directly proven or explicitly marked not applicable.

## Audit scope

### Milestone 1

- M1.01 Repository, environments and CI/CD
- M1.02 Design system and global UX
- M1.03 Authentication and strict portal isolation
- M1.04 Authorization and tenant isolation
- M1.05 Audit and notification foundations
- M1.06 Secure storage and upload pipeline
- M1.07 Worker onboarding and Identity Engine
- M1.08 Company registration and verification
- M1.09 Sites, departments and team
- M1.10 Worker invitations and company codes
- M1.11 Employment, experience, skill and leaving-letter records
- M1.12 Public verification foundation

### Completed Milestone 2 bricks

- M2.01 Assurance Order and Case Engine
- M2.02 Evidence verification queues
- M2.03 Frameworks and Effective Policy
- M2.04 Question Bank
- M2.05 Randomized assessment form generation

## Explicit next-five boundary

After this audit is accepted, the next five canonical bricks are:

1. M2.06 Assessment Catalogue and Eligibility
2. M2.07 Candidate Assessment Window
3. M2.08 Answer Persistence and Interruption Recovery
4. M2.09 Integrity Engine
5. M2.10 Written Scoring and Review Engine

No M2.06–M2.10 production code may advance while this audit has a blocking unresolved finding.

## Evidence classes required per completed brick

Every brick receives an evidence row covering:

1. **Purpose** — exact canonical completion requirement.
2. **Code/schema authority** — real service/database implementation, no decorative-only path.
3. **Authorization/isolation** — server-side role/tenant/ownership enforcement where applicable.
4. **Visible UX** — route/control exists when the brick has a user-facing surface; all visible controls have real behavior.
5. **Workflow** — real browser/user journey exercises the intended flow rather than only route rendering.
6. **Persistence/recovery/history** — reload, immutable history, idempotency, interruption or rollback behavior as applicable.
7. **Performance/concurrency** — purpose-relevant concurrent load or transaction race proof; not a synthetic vanity benchmark.
8. **Regression** — exact-head targeted/full Engineering evidence.
9. **Verdict** — PASS / DEFECT / COVERAGE_GAP / EXTERNAL_PROVIDER_BOUNDARY / NOT_APPLICABLE.

## Release-blocking findings

The audit must classify as blocking:

- cross-role or cross-tenant access;
- question/answer-key/rubric exposure;
- lost or cross-linked evidence files;
- route changes that require manual refresh;
- reviewer unable to see the Worker/file identity required for the review task;
- unsafe deletion or loss of employment/evidence history;
- unlogged privileged decisions;
- duplicate high-stakes mutations under concurrency;
- stale UI state that contradicts backend authority;
- a visible button/control with no real backend behavior;
- a workflow accepted solely by source-text tests when the product purpose requires a browser/user journey.

Assessment-answer loss and unrecoverable assessment-window behavior remain release blockers, but they belong to M2.07/M2.08 and must not be falsely attributed to M2.05, whose accepted boundary stops before candidate runtime.

## Live-product evidence policy

The historical Version-10 `chatgpt.site` URL may be inspected if reachable, but it is not the code source of truth. The connected Vercel team currently exposes no HSE Verify project and the connected PostHog project exposes no HSE-specific dashboard/error evidence, so neither can independently certify production health. Therefore the mandatory live-equivalent evidence for this audit is a clean-database **real Chromium run against the real Next.js application**, with screenshots, console/page errors, reload/navigation checks, and server logs retained as artifacts.

Any statement about production telemetry must distinguish unavailable telemetry from verified zero errors.

## Browser audit minimum journey

The expanded real-Chromium audit must exercise, where the current completed bricks own the behavior:

- public routes and signed-out redirects;
- zero-state Root bootstrap;
- Root/Admin/Verifier provisioning + MFA;
- strict cross-portal isolation;
- Worker registration/contact-verification path in sandbox mode;
- Worker Profile and Identity navigation with reload persistence;
- Worker qualification/experience/employment/skill evidence creation/upload path and preserved-history behavior;
- Company registration/verification path;
- Company sites/departments/team path;
- Worker invitation/company-code path;
- public verification safe projection/unknown-id behavior;
- Company Assurance Order creation/validation/submission where current policy dependencies permit;
- Verifier evidence-review queue navigation, exact evidence visibility, refresh stability and non-enumeration;
- Admin framework/effective-policy publication;
- Admin Question Bank create/revise/status lifecycle;
- Admin Assessment Blueprint create/revise/status lifecycle;
- mobile overflow checks for representative Worker/Company/Verifier/Admin pages;
- browser console/page errors captured as failures unless explicitly classified framework noise.

M2.05 candidate assessment execution is not required here because candidate runtime begins at M2.07; M2.05 browser proof is Admin blueprint lifecycle plus server-side form-generation/non-repetition/delivery tests.

## Performance/concurrency audit minimum

Add a repository-owned, deterministic production-like CI audit that measures and asserts correctness under concurrency for representative high-risk operations. It must include at least:

- live-session authorization/role isolation under parallel reads;
- tenant-scoped Company reads/mutations without cross-tenant leakage;
- review-task claim/terminal-decision races;
- M2.04 stale question revision race;
- M2.05 same-case generation convergence and same-Worker cross-case non-repetition;
- a 50-request authenticated mixed-role read burst using the actual application/server boundary if the existing test harness can provision those roles safely.

Performance acceptance is primarily correctness-under-load. Timing is recorded, but no unsupported Internet-scale throughput claim may be made from CI hardware. Any latency threshold added must be generous, deterministic, and justified by user-facing purpose.

## Allowed modifications during audit

- `.engineering/**` audit plan, ledger, rejection/acceptance/checkpoint files.
- `docs/superpowers/plans/**` audit implementation plan.
- `scripts/**` audit/browser/performance harnesses only.
- `tests/**` regression coverage for already-completed bricks.
- `.github/workflows/**` audit workflow/gate wiring.
- Existing product files M1.01–M2.05 only when a reproduced defect proves a root-cause correction is necessary.

## Forbidden audit behavior

- No new product features while audit is unresolved.
- No M2.06 eligibility service implementation until audit acceptance.
- No M2.07–M2.10 production code.
- No weakening or deleting a failing test to create green.
- No source-text-only substitute for a user-facing browser flow.
- No claim that Vercel/PostHog/live production is healthy when the connected telemetry/project is absent.
- No broad refactor without a reproduced root cause.
- No “expected to work” verdict.

## Defect handling

Every defect follows Superpowers Systematic Debugging:

1. reproduce and collect evidence;
2. trace root cause;
3. compare with a working repository pattern;
4. add the smallest failing regression;
5. implement one root-cause fix;
6. rerun affected targeted/browser/performance/full Engineering gates;
7. record rejection/correction in `.engineering/CONTINUATION.json`.

Three failed root-cause revisions on the same finding triggers `LOOP_DETECTED` / architectural review rather than a fourth patch.

## Acceptance gates

The retrospective audit can receive Gatekeeper `ACCEPT` only when:

- every M1.01–M2.05 brick has a populated evidence matrix row;
- every required user-facing completed flow has real-Chromium evidence on the exact audit candidate;
- the purpose-relevant concurrency/performance audit is green;
- all discovered release-blocking defects are fixed at root cause and re-proven;
- strict TypeScript, lint, targeted regressions and the full Engineering gate are green;
- no audit-only temporary repair workflow remains;
- an independent code/security/test/UI/stale/regression review finds no blocker.

Only after acceptance may M2.06 Task 3 production implementation resume.
