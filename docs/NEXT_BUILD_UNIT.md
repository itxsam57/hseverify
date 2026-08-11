# Next Build Unit

## Authority

This is the exact current implementation gate for the HSE Verify Phase 1 clean rebuild. The frozen product scope remains the **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/bookmarks/MILESTONE_PATH.md` records accepted brick history and build order. Earlier Version 10/prototype code is capability reference only and is not an architectural dependency.

## Accepted brick gates

- Worker Dashboard and Worker Profile vertical slice — **PASS — 2 August 2026**; accepted prerequisite slice.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS — 10 August 2026**.
- M1.07 Worker Onboarding and Identity Engine — **DONE — OWNER PASS — 11 August 2026**, pending only this formal closure branch exact-head/merge/merged-main verification.

## M1.07 final acceptance

All six M1.07 internal subunits are accepted:

1. **Identity Domain, Versioned Persistence and State Machine — DONE.**
2. **Worker Identity Draft and Verified Contact Binding — DONE.**
3. **Secure Identity Document, Profile Photo and Selfie Evidence Binding — DONE.**
4. **Automated Identity Checks and Provider Adapter Boundary — DONE.**
5. **Duplicate Signals, Recovery and Worker-ID Eligibility — DONE.**
6. **Correction Versions, Worker Identity UX and Cumulative Acceptance — DONE — OWNER PASS.**

Final release evidence:

- final root-fix PR `#72`;
- exact final PR head `6dbac3cddeb8bea1ae85b7f92c065fa2716e0bc3`;
- exact-head complete engineering gate `31446794451` — **PASS**;
- expected-head-locked merge `4858c05fcab9d8e4fa4cc09d4cfc2243dc313177`;
- merged-main complete engineering gate `31447079334` — **PASS**;
- targeted `/worker/identity` owner/browser release retest — **PASS — 11 August 2026**;
- final acceptance `docs/testing/results/M1_07_FINAL_ACCEPTANCE.md`;
- formal closure transition `docs/testing/results/M1_07_FINAL_CLOSURE.md`.

The owner-tested final release proved the release-blocking paths fixed by REG-078/REG-079: Worker evidence upload/replacement produces no invalid React Server Action `encType`/`method` warning; incomplete identity submission returns the exact Country of residence readiness requirement instead of a generic unknown failure; completing/saving the missing field allows submission without a manual refresh; and the automated-check continuation remains assistive rather than granting Worker self-verification/rejection authority.

M1.07 permanently preserves versioned/immutable identity history and corrections, trusted verified-contact snapshots, M1.06 private evidence, deterministic/provider-adapter automated checks, conservative duplicate/recovery dispositions with no automatic merge, and opaque verified-only Worker-ID eligibility/issuance. Reviewer-facing identity/evidence queues remain M2.02.

Permanent M1.07 regression protections include REG-073 through REG-079 as applicable to their accepted subunits/release repairs. Live production liveness/face/document-provider activation remains later provider work and does not reopen the accepted fail-closed M1.07 contract.

## Milestone 1 progress

**7 of 12 Milestone 1 bricks are DONE.**

This closure branch changes canonical position only. It contains no M1.08 runtime/product implementation.

Current owner-tested accepted product release beneath this closure transition:

`4858c05fcab9d8e4fa4cc09d4cfc2243dc313177`

## Current build gate

# M1.07 — FINAL FORMAL CLOSURE — IN PROGRESS

The product/owner boundary is accepted. Before any M1.08 product code begins, this closure branch must:

1. synchronize `IMPLEMENTATION_STATUS`, `MILESTONE_PATH`, `LATER`, engineering memory/profile/test matrix and permanent automation guards;
2. pass the complete fail-closed engineering gate on the exact closure head;
3. merge only that exact verified closure head;
4. pass the complete engineering gate again on the resulting merged `main` commit.

Until those four closure steps finish, do not start M1.08 product/runtime work.

## Next permitted brick after closure

# M1.08 — COMPANY REGISTRATION AND VERIFICATION — READY TO BUILD AFTER THIS CLOSURE MERGES GREEN

M1.08 becomes the **only permitted next Milestone 1 product brick** after the formal M1.07 closure succeeds. M1.09 and later bricks remain blocked in canonical order.

### Canonical M1.08 outcome

A Company can enter the clean-rebuild platform through the fixed Company role, create and maintain its own registration/verification case under server-owned tenant authority, submit the required organization evidence through accepted private-file infrastructure, and progress through explicit verification states without client-selected tenant/reviewer/decision authority. Final human verification queues/assignment must remain in their canonical later reviewer/admin boundary where the frozen scope places them; M1.08 must not pull M1.09+ operational modules forward.

### M1.08 non-negotiable controls

1. Reuse M1.03 fixed-role Company authentication and M1.04 server-derived Company tenant/membership context; never create a parallel login, role switch or client-selected tenant boundary.
2. Company registration/verification is a separate versioned/durable business domain, not hidden in arbitrary profile JSON or UI-only state.
3. Browser input may provide organization facts/evidence but cannot select decisive Company tenant, membership, reviewer, verifier, administrator, decision, storage object/provider or audit authority.
4. Required Company evidence must reuse M1.06 private secure-file reservation/upload/quarantine/scan/access rules and exact Company tenant/membership ownership.
5. Submitted/accepted verification history must not be destructively overwritten; corrections/retries must preserve an auditable lineage appropriate to the frozen M1.08 scope.
6. Cross-company direct URL/action/file access must fail non-enumerating at server/database boundaries even when IDs are copied.
7. Material registration/verification transitions must emit bounded immutable audit facts without raw sensitive evidence, tokens, object keys or secrets.
8. Expected validation/permission/conflict outcomes must remain distinct from infrastructure failure; no generic success, fake approval or silent fallback is allowed.
9. Concurrency, interruption/restart and migration behavior must be deterministic and covered by permanent tests.
10. No M1.09 sites/departments/team, M1.10 Worker invitation/Company-code business flow, M1.11 employment/evidence records or M1.12 public verification may be pulled into M1.08 for convenience.
11. Reviewer-facing identity/evidence queue work from M2.02 and all assessment/interview/credential/billing features remain blocked.
12. Build M1.08 through precise internal subunits if needed; each subunit must preserve exact-head and merged-main gate discipline. Genuine visible Company workflow changes require targeted owner/browser testing before the brick can close.

## Explicitly blocked while M1.08 is active

- M1.09 Sites, Departments and Team.
- M1.10 Worker Invitations and Company Codes.
- M1.11 Employment, Experience, Qualification, Skill and Leaving Records.
- M1.12 Public Verification Foundation.
- M2.01–M2.13 Assurance/assessment/review/interview/decision features.
- M3.01–M3.12 credentials, living records, sharing, billing, production integration/certification/launch.
- Fake production activation for email/SMS/private-object/malware/liveness/face/document/video/payment providers.

## Permanent build procedure

- Reproduce defects before fixing them and trace the real state/data/permission boundary.
- Fix the smallest complete root cause and add permanent regression coverage.
- Keep only the current canonical brick/subunit active.
- Lower-layer tests stay pinned to accepted migration ceilings where required; the complete application/release gate always applies the full current migration stack.
- Run focused checks early and the complete gate before merge.
- Merge only an exact verified head, then run the complete gate on merged `main`.
- Require owner/browser testing for genuine visible behavior and tie PASS to an exact release.
- Do not start M1.09 while M1.08 is incomplete.
