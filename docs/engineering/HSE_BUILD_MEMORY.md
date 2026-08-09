# HSE Verify Engineering Memory

Compact working memory for the active Phase 1 clean rebuild. This file is intentionally concise; volatile acceptance state must agree with `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

## Canonical authority

- Product scope: **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**.
- Exact current implementation gate: `docs/NEXT_BUILD_UNIT.md`.
- Permanent accepted brick/build-order record: `docs/bookmarks/MILESTONE_PATH.md`.
- Incomplete canonical requirements/provider blocks: `docs/bookmarks/LATER.md`.
- Engineering procedures: `docs/engineering/01-MASTER-INSTRUCTIONS.md` through `08-CI-COST-AND-CREDIT-STANDARD.md` plus `PROJECT-PROFILE.md`, `PROJECT-TEST-MATRIX.md` and the regression register/addenda.
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
- M1.06 Subunit 4 authorized signed preview/download — **IN PROGRESS — PR #53**.
- M1.06 Subunit 5 cumulative M1.06 acceptance — **BLOCKED** until Subunit 4 closes.
- M1.07 and later bricks — **BLOCKED** until M1.06 is DONE.

**Milestone 1 progress: 5 of 12 bricks are DONE.**

Last accepted canonical `main` boundary before Subunit 4:

`d4acee0093c2d1cd540fc944c1937183dd3afa8a`

## Accepted security/architecture boundary

### Authentication and portal isolation

- Worker registration requires email and phone OTP before activation.
- Company, Assessor, Verifier, Administrator and Root are invitation-only and require TOTP.
- One opaque database session has one immutable active role; no in-session role switching exists.
- Password reset/revocation invalidates existing sessions.
- Protected layouts/actions/routes recheck the database session.
- Cross-role copied URLs and signed-out protected routes fail closed.

### Authorization and tenants

- UI/client state is never the authorization boundary.
- Role, permission, owner and tenant checks are server-side.
- Company tenant scope comes only from the authenticated account's current active membership.
- Tenant-owned SQL reads/writes include tenant scope directly; fetch-global-then-filter is prohibited.
- Protected operations revalidate session/account/tenant/membership/permission state transactionally where required.
- Cross-tenant, missing and malformed identifiers are non-enumerating.
- Root emergency/security authority is separate from routine Company operations.

### Audit, jobs, notifications and email

- Platform audit is append-only and actor/role/tenant context is server-derived.
- Durable outbox/background jobs use fixed handler authority, leases, bounded retries, reclaim and terminal states.
- In-app notifications are persisted with recipient/read state and exact role-safe deep links.
- Provider-neutral email delivery persists logical delivery/attempt history and uses the accepted outbox worker; local/test delivery is real, while live provider credentials remain blocked for production activation.

### Secure files through accepted M1.06 Subunit 3

- Secure-file metadata is relational; large/private file content is kept in private object storage, never database rows.
- File/object keys are server-generated and opaque.
- Local/test private storage rejects traversal/symlink escape and preserves exact account/role/Company tenant ownership.
- PDF/PNG/JPEG intake independently validates extension, declared MIME, detected structure/signature and size.
- Accepted content is privately quarantined with server SHA-256/size and exact object binding.
- Scan work uses one fixed durable `secure_file.scan` outbox job with trusted lease authority, bounded retry/reclaim/terminal recovery and consistent outbox-before-file lock order.
- Local/test scanner fixtures cover clean, EICAR malicious, retry and terminal outcomes.
- Scan processing revalidates private object SHA-256/size and guards `scan_pending -> available|unsafe|scan_failed` transitions.

## Active M1.06 Subunit 4 boundary

Build only the authorized signed preview/download capability:

- `available` files only;
- short-lived HMAC-signed capability bound to exact file, purpose and current session/account/role/Company tenant membership scope;
- issue-time and use-time live authorization/ownership checks;
- fixed preview/download endpoints and purpose separation;
- expiry, tamper, copied-account/role/tenant/membership and revoked-session denial;
- private-object size/SHA-256 revalidation before serving;
- safe server-derived PDF/image response headers;
- no public object URL or browser-selected storage/content/tenant authority;
- immutable successful authorization/serve audit facts without token/URL/object key/hash/secret/raw bytes;
- production/preview fail closed until a real private object provider exists.

Do **not** build Worker identity submission/reviewer workflows, Company operations, assessments, interviews, credentials or billing in Subunit 4.

## Current discovered Subunit 4 regressions

- `REG-055` — malformed token timestamp runtime typing.
- `REG-056` — stored filename/header injection revalidation.
- `REG-057` — isolated unit harness must not remove production `server-only` protection.
- `REG-058` — security source guard must distinguish bounded `byteSize` metadata from raw file bytes while continuing to forbid sensitive authority identifiers.

Every additional confirmed serious defect gets the next stable regression ID before closure.

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
- Old chats/prototypes may explain requirements but never override the frozen specification or accepted repository evidence.
- A claimed PASS without exact executed evidence is not a PASS.
- A feature shown in a prototype does not count as implemented in the clean rebuild.
- Provider-blocked activation does not justify a fake adapter or false success; local/test adapters must be real and production must fail closed until approved credentials/providers exist.
