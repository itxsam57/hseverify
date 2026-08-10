# HSE Verify — Project Profile

## Identity and authority

- **Project name:** HSE Verify.
- **Purpose:** workforce trust platform that independently verifies Worker identity, qualifications, experience, skills, assessments, interviews and employer relationships through isolated role portals.
- **Category:** multi-role, multi-tenant Next.js web application with relational persistence, private object storage and security-sensitive durable workflows.
- **Build model:** Phase 1 clean rebuild; earlier Version 10/prototype code is capability reference only, never an architectural dependency.
- **Frozen product scope:** HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026.
- **Current build position:** controlled by `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.
- **Current accepted snapshot:** M1.01–M1.06 DONE; M1.07 Worker Onboarding and Identity Engine is READY TO BUILD after the M1.06 closure transition. Milestone 1 is 6/12 DONE. M1.08+ remain blocked.
- **Repository:** `itxsam57/hseverify`; default branch `main`.

## Technology

- **Languages:** TypeScript, JavaScript ESM, SQL, CSS, YAML.
- **Frameworks:** Next.js `16.2.12` App Router, React `19.2.8`, React DOM `19.2.8`, TypeScript `6.0.3`, ESLint `9.39.5`.
- **Package manager:** npm with committed lockfile; Node.js `>=20.9.0`; CI uses Node.js 24.
- **Database:** direct SQL repository layer; PGlite `0.5.4` for local/CI and `postgres` `3.4.9` for preview/production PostgreSQL. No ORM.
- **Authentication:** password, OTP, TOTP, opaque revocable sessions, recovery, staff invitations and fixed-role portal services.
- **Authorization:** server-only authorization context, explicit platform/Company permission matrices and database-derived current Company membership.
- **Audit:** immutable append-only platform audit facts.
- **Queues/workers:** durable transactional outbox/background worker with fixed handler registry, lease ownership, bounded retry/reclaim and terminal states.
- **Notifications/email:** persisted role-safe in-app notifications and provider-neutral durable email attempt/delivery state; local/test email adapter accepted, live provider later.
- **Secure files:** M1.06 accepted relational metadata plus private object content, private local/test storage, isolated file validation/quarantine, durable malware scan, authorized signed access, restart recovery and cumulative migration replay protections.
- **Deployment:** provider-neutral standalone preview bundle/release manifest; no repository-controlled hosted production URL yet.
- **Compatibility overrides:** PostCSS `8.5.18` and Sharp `0.35.3` remain intentionally pinned under the accepted security-floor policy.

## Application boundaries

- `src/app` is the Next.js App Router application.
- `src/proxy.ts` may perform optimistic missing-session-cookie redirects; database authorization remains authoritative.
- Public surfaces include landing, six role login surfaces, Worker registration/verification/recovery, staff invitation acceptance, controlled public verification demonstration and safe denial/not-found boundaries.
- Protected surfaces include Worker, Company, Assessor, Verifier, Administrator and Root portals plus protected server actions/routes.
- Trusted modules include `src/lib/auth`, `src/lib/authorization`, `src/lib/audit`, `src/lib/outbox`, notification/email modules, `src/lib/database`, `src/lib/worker` and `src/lib/secure-files`.
- M1.07 may add a separate identity module/domain; it must not collapse identity documents into the general Worker profile JSON store.
- Browser input never selects executable job handlers/providers, trusted account/role/tenant/membership context, storage root/object key, scanner implementation, signed-access scope, identity reviewer or final identity decision authority.

## Environments

| Environment | Database | Provider behavior | Secure file / identity behavior | Rule |
|---|---|---|---|---|
| Development | PGlite by default | Explicit local sandbox adapters | Accepted private local/test secure files; deterministic identity-provider fixtures only when M1.07 adds them | Never use production credentials/data |
| Test/CI | Disposable/in-memory PGlite | Synthetic deterministic adapters | Disposable private storage, deterministic scanner/identity fixtures | Deterministic synthetic state only |
| Preview | Private PostgreSQL required | Development adapters rejected | Secure-file and future identity-provider features fail closed until approved real providers exist | No silent local fallback |
| Production | Private PostgreSQL required | Approved live providers only | Real private object/scanner/liveness/document providers required before activation | Fail closed when provider unavailable/unconfigured |

Restricted values include `HSE_SESSION_SECRET`, `HSE_AUTH_PEPPER`, `DATABASE_URL` and sandbox access material. Never commit/log/artifact/prompt real secrets.

## Roles and isolation

| Role | Intended boundary | Explicitly forbidden |
|---|---|---|
| Worker | Own Worker portal/profile/identity/session/secure-file authority | Other Workers; Company/Assessor/Verifier/Admin/Root portals |
| Company | Current authenticated Company tenant and permitted records | Other tenants; client-selected tenant/membership/scope |
| Assessor | Assigned assessment/interview work when M2 exists | Company admin, Verifier decisions, Admin/Root authority |
| Verifier | Assigned identity/evidence verification when later modules exist | Company admin, Assessor-only work, Admin/Root authority |
| Administrator | Explicit routine platform operations | Root-only emergency authority; arbitrary tenant access |
| Root | Explicit emergency/security authority | Routine Company operations merely because Root exists |

Permanent isolation rules: no in-session role switching; role/permission/tenant/membership/provider/object-key/handler/reviewer authority is never trusted from the client; tenant/owner scope is part of SQL; sensitive operations revalidate live authority; cross-role/account/tenant/missing/malformed denial remains non-enumerating.

## Critical workflows

| ID | Workflow | Status |
|---|---|---|
| WF-001 | Worker dual-contact registration and OTP continuation | ACCEPTED |
| WF-002 | Password login, lockout, recovery, session creation/revocation | ACCEPTED |
| WF-003 | Staff invitation, TOTP enrollment and fixed-role portal entry | ACCEPTED |
| WF-004 | Worker Profile persistence/concurrency/correction request | ACCEPTED VERTICAL SLICE |
| WF-005 | Central role/permission and Company tenant authorization context | ACCEPTED |
| WF-006 | Signed-out and copied-role denial | ACCEPTED |
| WF-007 | Deterministic migrations/rollback/database runtime | ACCEPTED THROUGH M1.06 |
| WF-008 | Production build, standalone preview bundle and release evidence | ACCEPTED |
| WF-009 | Engineering verification and exact owner handoff | ACCEPTED FOUNDATION |
| WF-010 | Secure file domain → upload/quarantine → scan → signed access → cumulative recovery | ACCEPTED — M1.06 DONE |
| WF-011 | Worker Identity Engine, duplicate disposition and permanent Worker ID | READY TO BUILD — M1.07 |
| WF-012 | Randomized MCQ/written assessment delivery and recovery | NOT CONFIGURED / BLOCKED |
| WF-013 | Real Company operational modules | NOT CONFIGURED / BLOCKED |

## Complete M1.06 secure-file boundary

- server-generated opaque file/object identity and exact account/role/Company tenant ownership;
- private local/test object storage with traversal/symlink protections;
- PDF/PNG/JPEG extension, declared MIME, detected structure/signature and byte-size checks at trusted boundaries;
- SHA-256/size/object provenance, private quarantine, retry/recovery and cross-file/concurrency isolation;
- fixed durable `secure_file.scan` shared outbox job with trusted lease, bounded retry/reclaim/terminal behavior and deterministic clean/EICAR/retry fixtures;
- private-object revalidation and guarded `scan_pending -> available|unsafe|scan_failed` transitions;
- `available`-only short-lived signed preview/download bound to exact live session/account/role/tenant membership scope;
- use-time authorization and private-byte size/SHA revalidation;
- bounded authorization body parsing before buffering;
- safe stored-filename/content-type response boundary and private/no-store security headers;
- immutable bounded authorization/serve audit facts without tokens, URLs, object keys, hashes, secrets or raw bytes;
- expected denial separated from database/private-storage operational failures;
- no public object URLs or client-selected storage/content/tenant/provider authority;
- production/preview signed access fails closed until a real private provider is activated;
- cumulative Worker/Company lifecycle, malicious/tampered denial, restart/reopen and rollback/reapply acceptance;
- exact historical checksum-repair compatibility for repaired 0012/0013 migration replay, with unknown/tampered drift still rejected.

Final M1.06 acceptance: `docs/testing/results/M1_06_FINAL_ACCEPTANCE.md`.

## M1.07 Worker Identity Engine boundary

M1.07 must build a separate versioned identity aggregate using accepted profile/auth/contact context and M1.06 secure-file references. The identity domain must preserve:

- legal/previous name, date of birth, nationality/residence and document metadata;
- trusted verified email/phone provenance rather than client-declared verification;
- secure passport/national-ID/residence-permit, profile-photo and selfie/liveness evidence references;
- immutable submitted identity versions and correction lineage;
- server-authoritative lifecycle transitions;
- deterministic automated checks plus fail-closed provider adapters for future live liveness/face/document checks;
- duplicate signals from trusted contact/document/name-DOB/fingerprint/provider evidence, with no automatic identity merge;
- permanent unique Worker ID only after verification and duplicate-resolution eligibility;
- bounded immutable audit facts;
- `/worker/identity` visible UX with proper empty/loading/validation/failure/permission-denial states in the final visible subunit.

Verifier queue/assignment UI remains M2.02. M1.07 can model `MANUAL_REVIEW` state and Worker-facing status without pulling that later queue forward.

## Data classification

| Data | Sensitivity | Rule |
|---|---|---|
| Passwords, OTPs, TOTP secrets, session tokens, peppers | Restricted secret | Hash/encrypt/opaque token hash only; never plaintext logs/artifacts/prompts |
| Worker profile/contact data | Personal/confidential | Relational DB; synthetic tests; redact evidence |
| Company tenant/membership data | Confidential authorization data | Relational DB; no cross-tenant disclosure |
| Identity/evidence bytes | Highly sensitive | Private M1.06 object storage only; never relational rows/public URLs/CI artifacts/prompts |
| Identity document metadata/duplicate signals | Highly sensitive/confidential | Minimal normalized relational state; do not put raw secret values in audit/logs |
| Secure-file metadata/hashes | Confidential provenance | Server-owned relational metadata; bounded authorized projections only |
| Audit/security history | Confidential security metadata | Append-only facts; no secrets/raw private content |
| Assessment/interview content | Highly sensitive | Not built yet; future private/durable storage |

## Verification commands

- `npm run dev`
- `npm run validate:env`
- `npm run db:migrate`, `npm run db:status`, guarded `npm run db:rollback`
- `npm run check:secure-access`, `npm run test:secure-access`, `npm run test:secure-access-runtime`
- `npm run check:m1-06-final`, `npm run test:m1-06-final`
- `npm run verify:quick`, `npm run verify:affected`
- **`npm run verify:full` / complete application gate `npm run check`**
- `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`
- `npm run report:handoff`
- `npm run check:engineering`
- `npm run build`

No required check may be called PASS when skipped, blocked, assumed or weakened.

## Manual-testing responsibility

Manual testing is mandatory when genuinely affected for visual hierarchy/usability, responsive visual behavior, real TOTP and real device/file-picker/camera/microphone interaction. Domain/repository/API/SQL/isolation/concurrency/retry/recovery/migration/runtime/build behavior is primarily automated.

M1.06's final internal acceptance had no browser-visible surface and therefore required no invented owner browser test. M1.07's final Worker identity UX is genuinely visible and the brick cannot close without the corresponding owner/browser PASS.

## Project-specific definition of done

A change is complete only when the canonical current boundary is implemented without later-brick work; server role/permission/owner/tenant rules hold; relevant durable/interruption/concurrency states are covered; focused tests and complete exact-head gate pass; no checks are skipped/weakened; serious defects have stable regression guards; the exact verified head merges without drift; merged `main` passes again; handoff accurately reports visible impact; required owner testing passes; no release blocker remains; and authoritative context files agree.

## Current limitations / blocked areas

- M1.07 Identity Engine is the next unfinished brick; the accepted Worker Profile slice does not substitute for identity verification.
- M1.08–M1.12 Company/operational/evidence/public verification workflows remain blocked.
- All M2 assessment/review/interview/decision work and all M3 credential/billing/reporting/production-launch work remain blocked by build order.
- Live email, SMS, private-object storage, malware scanning, liveness, face/document verification, video and payment activation requires later approved production providers/credentials; accepted local/test adapters must not be misrepresented as live providers.
- No repository-controlled hosted preview/production URL is configured.
