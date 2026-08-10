# HSE Verify — Project Profile

## Identity and authority

- **Project name:** HSE Verify.
- **Purpose:** workforce trust platform that independently verifies Worker identity, qualifications, experience, skills, assessments, interviews and employer relationships through isolated role portals.
- **Category:** multi-role, multi-tenant Next.js web application with relational persistence, private object storage and security-sensitive durable workflows.
- **Build model:** Phase 1 clean rebuild; earlier Version 10/prototype code is capability reference only, never an architectural dependency.
- **Frozen product scope:** HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026.
- **Current build position:** controlled by `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.
- **Current accepted snapshot:** M1.01–M1.05 DONE; M1.06 IN PROGRESS with Subunits 1–4 DONE and Subunit 5 cumulative isolation/migration/recovery/acceptance READY TO BUILD. Milestone 1 is 5/12 DONE.
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
- **Secure files:** relational metadata plus private object content. Private local/test storage, validated quarantine, durable malware scan and authorized signed preview/download are accepted. Subunit 5 now owns only cumulative M1.06 proof/recovery.
- **Deployment:** provider-neutral standalone preview bundle/release manifest; no repository-controlled hosted production URL yet.
- **Compatibility overrides:** PostCSS `8.5.18` and Sharp `0.35.3` remain intentionally pinned under the accepted security-floor policy.

## Application boundaries

- `src/app` is the Next.js App Router application.
- `src/proxy.ts` may perform optimistic missing-session-cookie redirects; database authorization remains authoritative.
- Public surfaces include landing, six role login surfaces, Worker registration/verification/recovery, staff invitation acceptance, controlled public verification demonstration and safe denial/not-found boundaries.
- Protected surfaces include Worker, Company, Assessor, Verifier, Administrator and Root portals plus protected server actions/routes.
- Trusted modules include `src/lib/auth`, `src/lib/authorization`, `src/lib/audit`, `src/lib/outbox`, notification/email modules, `src/lib/database`, `src/lib/worker` and `src/lib/secure-files`.
- Browser input never selects executable job handlers/providers, trusted tenant/membership context, storage root/object key, scanner implementation or signed-access scope.

## Environments

| Environment | Database | Provider behavior | Secure file behavior | Rule |
|---|---|---|---|---|
| Development | PGlite by default | Explicit local sandbox adapters | Accepted private local/test storage/scanner/access | Never use production credentials/data |
| Test/CI | Disposable/in-memory PGlite | Synthetic deterministic adapters | Disposable private storage and deterministic scanner fixtures | Deterministic synthetic state only |
| Preview | Private PostgreSQL required | Development adapters rejected | Signed file access fails closed until real private storage provider exists | No silent local fallback |
| Production | Private PostgreSQL required | Approved live providers only | Real private object/scanner providers required before activation | Fail closed when provider unavailable/unconfigured |

Restricted values include `HSE_SESSION_SECRET`, `HSE_AUTH_PEPPER`, `DATABASE_URL` and sandbox access material. Never commit/log/artifact/prompt real secrets.

## Roles and isolation

| Role | Intended boundary | Explicitly forbidden |
|---|---|---|
| Worker | Own Worker portal/profile/session/secure-file authority | Other Workers; Company/Assessor/Verifier/Admin/Root portals |
| Company | Current authenticated Company tenant and permitted records | Other tenants; client-selected tenant/membership/scope |
| Assessor | Assigned assessment/interview work when M2 exists | Company admin, Verifier decisions, Admin/Root authority |
| Verifier | Assigned identity/evidence verification when later modules exist | Company admin, Assessor-only work, Admin/Root authority |
| Administrator | Explicit routine platform operations | Root-only emergency authority; arbitrary tenant access |
| Root | Explicit emergency/security authority | Routine Company operations merely because Root exists |

Permanent isolation rules: no in-session role switching; role/permission/tenant/membership/provider/object-key/handler authority is never trusted from the client; tenant/owner scope is part of SQL; sensitive operations revalidate live authority; cross-role/account/tenant/missing/malformed denial remains non-enumerating.

## Critical workflows

| ID | Workflow | Status |
|---|---|---|
| WF-001 | Worker dual-contact registration and OTP continuation | ACCEPTED |
| WF-002 | Password login, lockout, recovery, session creation/revocation | ACCEPTED |
| WF-003 | Staff invitation, TOTP enrollment and fixed-role portal entry | ACCEPTED |
| WF-004 | Worker Profile persistence/concurrency/correction request | ACCEPTED VERTICAL SLICE |
| WF-005 | Central role/permission and Company tenant authorization context | ACCEPTED |
| WF-006 | Signed-out and copied-role denial | ACCEPTED |
| WF-007 | Deterministic migrations/rollback/database runtime | ACCEPTED THROUGH CURRENT MERGED BOUNDARY |
| WF-008 | Production build, standalone preview bundle and release evidence | ACCEPTED |
| WF-009 | Engineering verification and exact owner handoff | ACCEPTED FOUNDATION |
| WF-010 | Secure file domain → upload/quarantine → scan → signed access | SUBUNITS 1–4 ACCEPTED; SUBUNIT 5 READY TO BUILD |
| WF-011 | Randomized MCQ/written assessment delivery and recovery | NOT CONFIGURED / BLOCKED |
| WF-012 | Real Company operational modules | NOT CONFIGURED / BLOCKED |

## Secure-file accepted boundary through M1.06 Subunit 4

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
- production/preview signed access fails closed until a real private provider is activated.

Subunit 4 final acceptance: `docs/testing/results/M1_06_SIGNED_ACCESS_FINAL_ACCEPTANCE.md`. Subunit 5 must prove these accepted modules together; it must not add M1.07 identity/reviewer product workflow.

## Data classification

| Data | Sensitivity | Rule |
|---|---|---|
| Passwords, OTPs, TOTP secrets, session tokens, peppers | Restricted secret | Hash/encrypt/opaque token hash only; never plaintext logs/artifacts/prompts |
| Worker profile/contact data | Personal/confidential | Relational DB; synthetic tests; redact evidence |
| Company tenant/membership data | Confidential authorization data | Relational DB; no cross-tenant disclosure |
| Identity/evidence bytes | Highly sensitive | Private object storage only; never relational rows/public URLs/CI artifacts/prompts |
| Secure-file metadata/hashes | Confidential provenance | Server-owned relational metadata; bounded authorized projections only |
| Audit/security history | Confidential security metadata | Append-only facts; no secrets/raw private content |
| Assessment/interview content | Highly sensitive | Not built yet; future private/durable storage |

## Verification commands

- `npm run dev`
- `npm run validate:env`
- `npm run db:migrate`, `npm run db:status`, guarded `npm run db:rollback`
- `npm run check:secure-access`, `npm run test:secure-access`, `npm run test:secure-access-runtime`
- `npm run verify:quick`, `npm run verify:affected`
- **`npm run verify:full` / complete application gate `npm run check`**
- `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`
- `npm run report:handoff`
- `npm run check:engineering`
- `npm run build`

No required check may be called PASS when skipped, blocked, assumed or weakened.

## Manual-testing responsibility

Manual testing is mandatory when genuinely affected for visual hierarchy/usability, responsive visual behavior, real TOTP and real device/file-picker/camera/microphone interaction. Domain/repository/API/SQL/isolation/concurrency/retry/recovery/migration/runtime/build behavior is primarily automated.

Subunit 4 was API/internal and required no owner browser test. Subunit 5 must also avoid inventing a UI; owner browser testing is required only if it changes a real visible product workflow.

## Project-specific definition of done

A change is complete only when the canonical current boundary is implemented without later-brick work; server role/permission/owner/tenant rules hold; relevant durable/interruption/concurrency states are covered; focused tests and complete exact-head gate pass; no checks are skipped/weakened; serious defects have stable regression guards; the exact verified head merges without drift; merged `main` passes again; handoff accurately reports visible impact; required owner testing passes; no release blocker remains; and authoritative context files agree.

## Current limitations / blocked areas

- M1.06 remains incomplete until Subunit 5 cumulative acceptance and the separate brick-level closure finish.
- M1.07 identity submission/liveness/duplicate detection/permanent Worker ID remains blocked.
- M1.08–M1.12 Company/operational/evidence/public verification workflows remain blocked.
- All M2 assessment/review/interview/decision work and all M3 credential/billing/reporting/production-launch work remain blocked by build order.
- Live email, SMS, private-object storage, malware scanning, liveness, video and payment activation requires later approved production providers/credentials; accepted local/test adapters must not be misrepresented as live providers.
- No repository-controlled hosted preview/production URL is configured.
