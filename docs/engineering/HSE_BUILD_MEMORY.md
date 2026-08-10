# HSE Verify Engineering Memory

Compact working memory for the active Phase 1 clean rebuild. Volatile acceptance state must agree with `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

## Canonical authority

- Product scope: **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**.
- Exact current implementation gate: `docs/NEXT_BUILD_UNIT.md`.
- Permanent accepted brick/build-order record: `docs/bookmarks/MILESTONE_PATH.md`.
- Incomplete requirements/provider blocks: `docs/bookmarks/LATER.md`.
- Permanent regression sources: `docs/engineering/REGRESSION-REGISTER.md` plus the active unit addendum when one exists.
- Engineering procedures: `docs/engineering/01-MASTER-INSTRUCTIONS.md` through `08-CI-COST-AND-CREDIT-STANDARD.md`, `PROJECT-PROFILE.md` and `PROJECT-TEST-MATRIX.md`.
- Repository: `itxsam57/hseverify`, default branch `main`.
- Earlier Version 10/prototype code is capability reference only and is never an architectural dependency.

## Current accepted build position — 10 August 2026

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS**.
- M1.06 Secure Storage and Upload Pipeline — **IN PROGRESS — only permitted Milestone 1 brick**.
- M1.06 Subunit 1 secure file domain/private local-test storage — **DONE — ENGINEERING PASS**.
- M1.06 Subunit 2 isolated upload validation/quarantine — **DONE — ENGINEERING PASS**.
- M1.06 Subunit 3 durable malware scan/local-test scanner — **DONE — ENGINEERING PASS**.
- M1.06 Subunit 4 authorized signed preview/download — **DONE — ENGINEERING PASS**.
- M1.06 Subunit 5 cumulative isolation/migration/recovery/acceptance — **IN PROGRESS — `build/m1-06-final-acceptance`**.
- M1.07 and later bricks — **BLOCKED** until M1.06 is DONE.

**Milestone 1 progress: 5 of 12 bricks are DONE.**

Current accepted canonical `main` before Subunit 5:

`2a9ccd2d3fb7bf3292635482bc378335d4e5c6d4`

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

### Secure files through accepted M1.06 Subunit 4

- relational metadata is separated from private object content; file bytes never belong in relational rows;
- file/object identity is server-generated and opaque;
- local/test private storage rejects traversal/symlink escape and preserves exact account/role/Company tenant ownership;
- PDF/PNG/JPEG intake independently validates extension, declared MIME, detected structure/signature and size;
- quarantine persists immutable byte-size/SHA-256/object provenance and supports safe retry/recovery;
- one fixed `secure_file.scan` durable outbox job binds exact scan generation/content provenance and uses the accepted shared worker/retry/lease model;
- scan processing revalidates private bytes and only permits guarded `scan_pending -> available|unsafe|scan_failed` outcomes;
- signed preview/download is available only for accepted `available` files;
- signed capability binds exact file, purpose and live session/account/role/Company tenant membership scope;
- use-time access repeats live authorization before private-object read;
- request bodies are bounded before buffering/parsing;
- private bytes are revalidated by exact size/SHA-256 immediately before response;
- stored filenames are revalidated at the final header boundary and response MIME comes only from accepted provenance;
- missing/tampered content fails non-enumerating, while database/private-storage operational failures are not disguised as authorization 404s;
- successful authorization/serve writes bounded immutable audit facts without token/URL/object key/hash/secret/raw bytes;
- no public object URL or browser-selected storage/content/tenant/provider authority exists;
- preview/production fail closed until an approved real private-object provider is activated.

Subunit 4 final acceptance is recorded at `docs/testing/results/M1_06_SIGNED_ACCESS_FINAL_ACCEPTANCE.md`; permanent defects are `REG-055` through `REG-069` in `docs/engineering/M1_06_SUBUNIT4_REGRESSIONS.md`.

## Active M1.06 Subunit 5 proof

Subunit 5 is cumulative acceptance, not a new product workflow. The only new executable surface is the permanent cumulative engineering suite:

- `scripts/check-m1-06-final-acceptance.mjs`;
- `scripts/run-m1-06-final-tests.mjs`;
- `tests/platform/m1-06-final-acceptance.test.mjs`;
- `tests/platform/m1-06-final-restart-migration.test.mjs`;
- package gate wiring through `check:m1-06-final` and `test:m1-06-final`.

The cumulative suite shares one real PGlite database/private-storage boundary across reserve → validated upload/quarantine → durable scan → signed access, covers malicious/tampered content and Company/Worker isolation, and proves persistence/reopen plus migration rollback/reapply. It deliberately reuses the accepted production modules and shared M1.05 audit/outbox infrastructure rather than adding a parallel state machine.

Build no Worker identity/reviewer workflow, Company verification workflow, assessment/interview workflow, credential/billing feature or fake visible demo in this unit. The exact required proof is in `docs/NEXT_BUILD_UNIT.md`.

## Permanent build procedure

1. Load only the frozen master specification, this compact memory, `MILESTONE_PATH.md`, `LATER.md`, `NEXT_BUILD_UNIT.md`, project profile/test matrix and current repository evidence.
2. Reproduce a defect before fixing it.
3. Trace the failing state/data/permission/lifecycle boundary.
4. Fix the smallest complete root cause; do not add symptom patches, bypasses or fake green tests.
5. Add permanent regression coverage alongside the behavior.
6. Run focused checks early.
7. Run the complete fail-closed engineering gate on the exact branch head.
8. Merge only after the exact-head gate is green and branch scope is correct.
9. Run the complete gate again on merged `main`.
10. Require owner/browser testing only for genuinely visible behavior; record PASS before calling a visible brick DONE.
11. Keep migrations reversible/monotonic according to their accepted data-history contract.
12. Never start the next subunit/brick while the current one is incomplete.

## Context cleanliness

- `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md` control live build position; this file must agree with them.
- Active defect IDs belong in the active regression addendum; do not duplicate volatile lists here.
- Product regressions must own product behavior, not exact prose from this memory.
- Old chats/prototypes may explain requirements but never override the frozen specification or accepted repository evidence.
- A claimed PASS without exact executed evidence is not a PASS.
- A feature shown in a prototype does not count as implemented in the clean rebuild.
- Provider-blocked activation does not justify a fake adapter or false success; local/test adapters must be real and production must fail closed until approved credentials/providers exist.
