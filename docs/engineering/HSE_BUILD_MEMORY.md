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

## Current accepted build position — 10 August 2026

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS**.
- M1.07 Worker Onboarding and Identity Engine — **READY TO BUILD — only permitted next Milestone 1 brick after the M1.06 closure transition passes**.
- M1.08 and later bricks — **BLOCKED** until M1.07 is DONE.

**Milestone 1 progress: 6 of 12 bricks are DONE.**

M1.06 final accepted implementation/evidence boundary:

- exact S5 head `86d135f87a2a2b53f12b8d5b1a2438944cd426fc`;
- exact-head full gate `31362444454` PASS;
- merge `4ee689e244c938d04a7db3d58306cff8e20b6213`;
- merged-main full gate `31362848897` PASS;
- acceptance record commit `03ac4ac48ee8477833999829c56f829365b92a9e` and full gate `31363206957` PASS;
- final record `docs/testing/results/M1_06_FINAL_ACCEPTANCE.md`.

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

### Secure files — complete accepted M1.06 boundary

- relational metadata is separated from private object content; file bytes never belong in relational rows;
- file/object identity is server-generated and opaque;
- local/test private storage rejects traversal/symlink escape and preserves exact account/role/Company tenant ownership;
- PDF/PNG/JPEG intake independently validates extension, declared MIME, detected structure/signature and size;
- quarantine persists immutable byte-size/SHA-256/object provenance and supports safe retry/recovery;
- one fixed `secure_file.scan` durable outbox job binds exact scan generation/content provenance and uses the shared worker/retry/lease model;
- scan processing revalidates private bytes and only permits guarded `scan_pending -> available|unsafe|scan_failed` outcomes;
- signed preview/download is available only for accepted `available` files;
- signed capability binds exact file, purpose and live session/account/role/Company tenant membership scope;
- use-time access repeats live authorization before private-object read;
- request bodies are bounded before buffering/parsing;
- private bytes are revalidated by exact size/SHA-256 immediately before response;
- stored filenames are revalidated at the final header boundary and response MIME comes only from accepted provenance;
- missing/tampered content fails non-enumerating, while database/private-storage operational failures remain infrastructure failures rather than fake authorization 404s;
- successful authorization/serve writes bounded immutable audit facts without token/URL/object key/hash/secret/raw bytes;
- no public object URL or browser-selected storage/content/tenant/provider authority exists;
- preview/production fail closed until approved real private-object/scanner providers are activated;
- cumulative shared-PGlite/private-storage tests prove Worker and Company isolation, malicious/tampered denial, persistent restart/reopen and complete rollback/reapply;
- historical accepted migrations 0012/0013 use explicit exact legacy-to-repaired checksum compatibility so append-only audit history survives replay while unknown/tampered checksum drift still fails closed.

M1.06 final acceptance is recorded at `docs/testing/results/M1_06_FINAL_ACCEPTANCE.md`. Subunit 4 regressions REG-055–069 and Subunit 5 regressions REG-070–072 remain permanent.

## M1.07 architecture boundary

The accepted Worker Dashboard/Profile slice is reusable, but identity is a separate versioned aggregate. Do not expand the generic profile JSON document into an identity-document store.

Required M1.07 build order:

1. Identity Domain, Versioned Persistence and State Machine.
2. Worker Identity Draft and Verified Contact Binding.
3. Secure Identity Document, Profile Photo and Selfie Evidence Binding using M1.06.
4. Automated Identity Checks and Provider Adapter Boundary.
5. Duplicate Signals, Recovery and Worker-ID Eligibility/Issuance.
6. Correction Versions, `/worker/identity` UX and Cumulative Acceptance.

Identity invariants:

- Worker principal owns the identity aggregate; client input cannot choose account/role/reviewer/provider authority.
- Submitted versions are immutable; correction creates lineage/new version.
- Raw document/photo/selfie bytes remain secure-file objects only.
- Only server-authorized `available` secure files may become identity evidence.
- Verified-contact provenance must come from trusted authentication/contact state, never a client checkbox/string.
- Duplicate detection produces signals/dispositions and never auto-merges identities.
- Permanent Worker ID is unique, server-generated, idempotent and gated by verified identity plus duplicate resolution.
- Liveness/face/document-provider integration is adapter-based; local/test is deterministic and preview/production fail closed until approved providers exist.
- Provider/AI output is evidence only, never sole final authority for verification, rejection or merge.
- Material transitions, duplicate disposition and Worker-ID issuance are auditable without raw identity-document content/numbers in audit metadata.
- Reviewer-facing verification queues are M2.02 and must not be pulled into M1.07.

Canonical identity lifecycle to preserve:

`DRAFT -> SUBMITTED -> AUTOMATED_CHECKS -> MANUAL_REVIEW|MORE_INFO|REJECTED`, with permitted withdrawal before review, manual-review outcomes `VERIFIED|MORE_INFO|REJECTED|ESCALATED`, verified maintenance states `CORRECTION_PENDING|EXPIRED_DOCUMENT|SUSPENDED`, versioned correction return to VERIFIED, and authorized suspension recovery/closure.

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
10. Require owner/browser testing for genuinely visible behavior; visible M1.07 UX cannot close without owner PASS.
11. Keep migrations reversible/monotonic according to accepted data-history contracts.
12. Never start the next subunit/brick while the current one is incomplete.

## Context cleanliness

- `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md` control live build position; this file must agree with them.
- Active defect IDs belong in active regression addenda; do not duplicate volatile lists here.
- Product regressions must own product behavior, not exact prose from this memory.
- Old chats/prototypes may explain requirements but never override the frozen specification or accepted repository evidence.
- A claimed PASS without exact executed evidence is not a PASS.
- A feature shown in a prototype does not count as implemented in the clean rebuild.
- Provider-blocked activation does not justify a fake adapter or false success; local/test adapters must be real and production must fail closed until approved credentials/providers exist.
