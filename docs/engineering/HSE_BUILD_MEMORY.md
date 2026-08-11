# HSE Verify Engineering Memory

Compact working memory for the active Phase 1 clean rebuild. Volatile acceptance state must agree with `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

## Canonical authority

- Product scope: **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**.
- Exact current implementation gate: `docs/NEXT_BUILD_UNIT.md`.
- Permanent accepted brick/build-order record: `docs/bookmarks/MILESTONE_PATH.md`.
- Incomplete requirements/provider blocks: `docs/bookmarks/LATER.md`.
- Permanent regressions: `docs/engineering/REGRESSION-REGISTER.md` plus unit addenda.
- Engineering procedures: `docs/engineering/01-MASTER-INSTRUCTIONS.md` through `08-CI-COST-AND-CREDIT-STANDARD.md`, `PROJECT-PROFILE.md` and `PROJECT-TEST-MATRIX.md`.
- Repository: `itxsam57/hseverify`, default branch `main`.
- Earlier Version 10/prototype code is capability reference only and is never an architectural dependency.

## Current accepted build position — 11 August 2026

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS**.
- M1.07 Worker Onboarding and Identity Engine — **DONE — OWNER PASS — 11 August 2026**, pending only this formal closure branch exact-head/merge/merged-main verification.
- M1.08 Company Registration and Verification — **READY TO BUILD after the M1.07 closure merges green on `main`**.
- M1.09 and later bricks — **BLOCKED in canonical order**.

**Milestone 1 progress: 7 of 12 bricks are DONE.**

M1.07 final accepted owner-tested release boundary:

- final root-fix PR `#72`;
- exact final head `6dbac3cddeb8bea1ae85b7f92c065fa2716e0bc3`;
- exact-head full gate `31446794451` PASS;
- expected-head-locked merge `4858c05fcab9d8e4fa4cc09d4cfc2243dc313177`;
- merged-main full gate `31447079334` PASS;
- targeted owner/browser retest PASS — 11 August 2026;
- final acceptance `docs/testing/results/M1_07_FINAL_ACCEPTANCE.md`;
- formal closure transition `docs/testing/results/M1_07_FINAL_CLOSURE.md`.

## Accepted security/architecture boundary

### Authentication and authorization

- Worker registration requires email and phone OTP before activation.
- Company, Assessor, Verifier, Administrator and Root are invitation-only and require TOTP.
- One opaque database session has one immutable active role; no in-session role switching exists.
- Password reset/revocation invalidates existing sessions.
- Role, permission, owner and tenant checks are server-side.
- Company scope comes only from the authenticated account's current active membership.
- Tenant-owned SQL carries tenant predicates directly; fetch-global-then-filter is prohibited.
- Protected operations revalidate live authority where required and cross-scope denial is non-enumerating.

### Audit, jobs, notifications and email

- Platform audit is append-only and actor/role/tenant context is server-derived.
- Durable outbox/background jobs use fixed handler authority, leases, bounded retries, reclaim and terminal states.
- In-app notifications persist recipient/read state and exact role-safe deep links.
- Provider-neutral email delivery persists logical delivery/attempt history; accepted local/test delivery is real while live provider activation remains later.

### Secure files — accepted M1.06 boundary

- relational metadata is separated from private object content; file bytes never belong in relational rows;
- file/object identity is server-generated and opaque;
- local/test private storage rejects traversal/symlink escape and preserves exact account/role/Company tenant ownership;
- PDF/PNG/JPEG intake independently validates extension, declared MIME, detected structure/signature and size;
- quarantine persists immutable byte-size/SHA-256/object provenance and supports safe retry/recovery;
- durable malware scanning uses the shared outbox/lease/retry/reclaim model and guarded `scan_pending -> available|unsafe|scan_failed` outcomes;
- signed preview/download is `available`-only and bound to live session/account/role/tenant authority;
- use-time authorization and final private-byte size/SHA revalidation remain mandatory;
- no public object URL or browser-selected storage/content/tenant/provider authority exists;
- preview/production fail closed until approved real private-object/scanner providers are activated;
- cumulative restart/reopen and migration rollback/reapply remain permanently tested.

### Worker Identity Engine — accepted M1.07 boundary

M1.07 is a separate versioned identity domain; the general Worker profile JSON is not an identity-document store.

Accepted identity invariants:

- Worker principal owns the identity aggregate; browser input cannot choose account/role/reviewer/provider authority.
- Verified email and phone identity contacts are snapshots of trusted authentication authority, never client-declared verification.
- Raw identity-document/profile-photo/selfie bytes remain M1.06 private secure-file objects; only server-authorized `available` same-Worker files may bind as evidence.
- Submitted identity versions and evidence are immutable; corrections create explicit new version/evidence lineage and never overwrite accepted history.
- Initial and correction submission readiness is server-authoritative and atomic with the real lifecycle transition; predictable missing requirements return bounded actionable errors while the SQL trigger remains final defense in depth.
- Automated identity checks are deterministic/provider-adapter based. Local/test fixtures are real contract tests; preview/production fail closed until approved identity providers are configured.
- Provider/AI output is assistive evidence only and cannot be sole final verification, rejection or merge authority.
- Duplicate checks are conservative, version-bound and server-owned; identities/accounts are never silently or automatically merged.
- Duplicate/recovery dispositions remain explicit and auditable; personal-fact matching cannot grant account recovery authority.
- Permanent Worker ID is server-generated, opaque, unique, idempotent and issued only after the current verified identity and duplicate/recovery eligibility gates are clear.
- `/worker/identity` is Worker-only and owner-tested; draft persistence, evidence upload/replacement, readiness, submission and automated-check continuation do not depend on manual refresh.
- React Server Action evidence forms let React own method/encoding metadata; no explicit `method`/`encType` workaround is permitted.
- Reviewer-facing identity/evidence queues remain M2.02 and were not pulled into M1.07.

Permanent M1.07 regression protections include REG-073 through REG-079 as applicable to the accepted subunits/release repairs.

## Current next brick boundary — M1.08

After the M1.07 closure branch itself passes exact-head verification, merges without drift and merged `main` passes the complete gate, M1.08 Company Registration and Verification is the only permitted next Milestone 1 brick.

Do not pull forward M1.09 sites/departments/team, M1.10 Worker invitation/Company-code business workflows, M1.11 Worker employment/evidence records, M1.12 public verification or any M2/M3 work while M1.08 is incomplete.

Live email, SMS, malware, private-object, liveness/face/document, video and payment provider activation stays in its canonical later production-integration work; accepted local/test adapters are not live providers.

## Permanent build procedure

1. Load the frozen master specification, this compact memory, `MILESTONE_PATH.md`, `LATER.md`, `NEXT_BUILD_UNIT.md`, project profile/test matrix and current repository evidence.
2. Reproduce a defect before fixing it.
3. Trace the failing state/data/permission/lifecycle boundary.
4. Fix the smallest complete root cause; do not add symptom patches, bypasses or fake green tests.
5. Add permanent regression coverage alongside the behavior.
6. Run focused checks early.
7. Run the complete fail-closed engineering gate on the exact branch head.
8. Merge only after the exact-head gate is green and branch scope is correct.
9. Run the complete gate again on merged `main`.
10. Require owner/browser testing for genuinely visible behavior and tie PASS to an exact tested release.
11. Keep migrations reversible/monotonic according to accepted data-history contracts.
12. Never start the next brick while the current closure/build gate is incomplete.

## Context cleanliness

- `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md` control live build position; this file must agree with them.
- Active defect IDs belong in active regression addenda; do not duplicate volatile lists here.
- Product regressions must own product behavior, not exact prose from this memory.
- Old chats/prototypes may explain requirements but never override the frozen specification or accepted repository evidence.
- A claimed PASS without exact executed evidence is not a PASS.
- A feature shown in a prototype does not count as implemented in the clean rebuild.
- Provider-blocked activation does not justify a fake adapter or false success; local/test adapters must be real and production must fail closed until approved credentials/providers exist.
