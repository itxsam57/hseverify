# HSE Verify — Project Profile

## Identity and authority

- **Project name:** HSE Verify.
- **Purpose:** workforce trust platform that independently verifies Worker identity, qualifications, experience, skills, assessments, interviews and employer relationships through isolated role portals.
- **Category:** multi-role, multi-tenant web application with server-rendered portals, server actions/routes, relational persistence, private object storage and security-sensitive durable workflows.
- **Build model:** Phase 1 clean rebuild. Earlier Version 10/prototype code is capability reference only, never an architectural dependency.
- **Frozen product scope:** HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026.
- **Current build position:** controlled by `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`; both must agree before the engineering gate passes.
- **Current accepted snapshot:** M1.01–M1.05 DONE; M1.06 IN PROGRESS with Subunits 1–3 accepted and Subunit 4 signed preview/download in progress on PR #53. Milestone 1 is 5/12 DONE.
- **Repository:** `itxsam57/hseverify`; default branch `main`.

## Technology

- **Languages:** TypeScript, JavaScript ESM, SQL, CSS, YAML.
- **Frameworks:** Next.js `16.2.12` App Router, React `19.2.8`, React DOM `19.2.8`, TypeScript `6.0.3`, ESLint `9.39.5`.
- **Package manager:** npm with committed `package-lock.json`; Node.js `>=20.9.0`; CI uses Node.js 24.
- **Database:** direct SQL repository layer. PGlite `0.5.4` is PostgreSQL-compatible local/CI execution; `postgres` `3.4.9` is the preview/production PostgreSQL adapter. No ORM.
- **Authentication:** repository-owned password, OTP, TOTP, opaque revocable sessions, recovery, staff invitations and fixed-role portal services.
- **Authorization:** central server-only authorization context and explicit platform/Company permission matrices. Company tenant scope is derived only from the authenticated account's current active membership.
- **Audit:** immutable append-only platform audit facts with trusted actor/role/tenant context.
- **Queues/workers:** durable transactional outbox/background worker with fixed handler registry, lease ownership, bounded retry/reclaim and terminal states.
- **Notifications:** persisted in-app recipient/read state and exact role-safe deep links.
- **Email:** provider-neutral durable delivery/attempt history integrated with the shared outbox worker; local/test adapter is implemented, live provider credentials remain blocked for production activation.
- **Secure files:** relational metadata plus private object content. Local/test private object storage, upload validation/quarantine and durable malware-scan foundation are accepted. Signed preview/download is the active M1.06 Subunit 4.
- **Deployment:** provider-neutral standalone preview bundle and release manifest. No repository-controlled hosted production URL is configured yet.
- **Compatibility overrides:** PostCSS `8.5.18` and Sharp `0.35.3` remain intentionally pinned under the accepted security-floor policy.

## Application boundaries

- **Primary application:** `src/app` Next.js App Router.
- **Request pre-boundary:** `src/proxy.ts` performs optimistic missing-session-cookie redirects for protected dashboard route families; database authorization remains authoritative.
- **Public surfaces:** landing, six fixed-role login surfaces, Worker registration/verification/recovery, staff invitation acceptance, controlled public verification demonstration, access-denied/not-found boundaries.
- **Protected surfaces:** Worker, Company, Assessor, Verifier, Administrator and Root portal route groups plus protected server actions/routes.
- **Core trusted modules:** `src/lib/auth`, `src/lib/authorization`, `src/lib/audit`, `src/lib/outbox`, notification/email modules, `src/lib/database`, `src/lib/worker`, `src/lib/secure-files`.
- **API style:** no broad public REST API. App Router route handlers and server actions are trusted HTTP boundaries.
- **Background authority:** executable job type/handler authority is server-owned; browser input never selects a handler/provider.

## Environments

| Environment | Database | Auth/provider behavior | Secure file storage | Rule |
|---|---|---|---|---|
| Development | PGlite by default | Explicit local sandbox adapters only | Accepted private local/test adapter | Never use production credentials or data |
| Test/CI | Disposable/in-memory PGlite | Synthetic deterministic adapters | Disposable private test storage | No production state; deterministic fixtures |
| Preview | Private PostgreSQL required | Development adapters rejected | Signed file access fails closed until real private storage provider exists | No silent local fallback |
| Production | Private PostgreSQL required | Approved live providers only | Real private object provider required before secure-file access activation | Fail closed when provider is unavailable/unconfigured |

Restricted variables include `HSE_SESSION_SECRET`, `HSE_AUTH_PEPPER`, `DATABASE_URL` and local sandbox access material. Real secrets must never be committed, logged, stored in artifacts or placed in AI prompts.

## Roles and isolation

| Role | Intended boundary | Explicitly forbidden |
|---|---|---|
| Worker | Own Worker portal, profile, sessions and own secure-file records/capabilities | Company/Assessor/Verifier/Admin/Root portals; another Worker's records |
| Company | Current authenticated Company tenant and permitted tenant-owned records | Any other Company tenant; client-selected tenant/membership/scope; Worker/staff portal crossing |
| Assessor | Assigned assessment/interview work when those Milestone 2 modules are built | Company administration, Verifier-only decisions, Admin/Root authority |
| Verifier | Assigned identity/evidence verification work when corresponding modules are built | Company administration, Assessor-only work, Admin/Root authority |
| Administrator | Explicit routine platform operations | Root-only emergency/security authority; arbitrary tenant access |
| Root | Explicit emergency/security platform authority | Routine Company operations merely because Root exists |

Permanent isolation rules:

- no role switching inside an authenticated session;
- role, permission, tenant, membership, provider, object key and executable handler authority are never trusted from URL/form/header/client state;
- Company tenant scope comes only from the accepted server authorization principal;
- tenant/owner scope is part of repository SQL reads/writes, not a post-fetch client/server filter;
- sensitive reads/writes revalidate current session/account/tenant/membership/permission state where required;
- cross-role, cross-account, cross-tenant, missing and malformed denial remains non-enumerating.

## Critical accepted workflows

| ID | Workflow | State | Current status |
|---|---|---|---|
| WF-001 | Worker dual-contact registration and OTP continuation | Account, registration flow, OTP/security events | ACCEPTED |
| WF-002 | Password login, lockout, recovery, session creation/revocation | Accounts, limits, sessions, events | ACCEPTED |
| WF-003 | Staff invitation, TOTP enrollment and fixed-role portal entry | Invitations, MFA, roles, sessions | ACCEPTED |
| WF-004 | Worker Profile persistence/concurrency/correction request | Worker profile/history | ACCEPTED VERTICAL SLICE |
| WF-005 | Central role/permission and Company tenant authorization context | Session/account/role/tenant/membership | ACCEPTED |
| WF-006 | Signed-out and copied-role denial | Session/authorization/security events | ACCEPTED |
| WF-007 | Deterministic migrations, rollback boundary and database runtime | Migration ledger/schema | ACCEPTED THROUGH CURRENT MERGED BOUNDARY |
| WF-008 | Production build, standalone preview bundle and release evidence | Build artifacts/manifests | ACCEPTED |
| WF-009 | Engineering verification and exact owner handoff | Generated ignored reports | ACCEPTED FOUNDATION; MUST EVOLVE WITH CURRENT BRICK |
| WF-010 | Secure file domain, upload/quarantine, scan and signed access | Metadata, private objects, audit/outbox | PARTIAL: SUBUNITS 1–3 ACCEPTED; SUBUNIT 4 IN PROGRESS; SUBUNIT 5 BLOCKED |
| WF-011 | Randomized MCQ/written assessment delivery and recovery | Future M2 state | NOT CONFIGURED / BLOCKED |
| WF-012 | Real Company operational modules | Future M1.08–M1.11 state | NOT CONFIGURED / BLOCKED |

## Secure-file accepted boundary through M1.06 Subunit 3

- Server-generated opaque file and object identity.
- Private local/test object storage with traversal/symlink protections.
- Exact account/role/Company tenant ownership and immutable provenance.
- Independent extension, declared MIME, detected structure/signature and size checks for PDF/PNG/JPEG.
- Server SHA-256 and size persistence, private quarantine and staged/retry recovery.
- Cross-file and concurrent upload isolation.
- Fixed durable `secure_file.scan` job using the accepted shared outbox worker.
- Trusted lease capability, consistent outbox-before-file lock order, bounded retry/reclaim/terminal recovery.
- Clean/EICAR/retry/terminal local-test scanner fixtures.
- Private-object SHA-256/size revalidation and guarded `scan_pending -> available|unsafe|scan_failed` transitions.

Active Subunit 4 adds only signed authorized preview/download. Worker identity submission/reviewer evidence product workflows remain later bricks.

## Data classification

| Data | Sensitivity | Storage/logging rule |
|---|---|---|
| Passwords, OTPs, TOTP secrets, session tokens, peppers | Restricted secret | Hash/encrypt/opaque token hash only; never plaintext logs/artifacts/prompts |
| Worker contact/profile data | Personal/confidential | Relational database; synthetic fixtures; redact CI evidence |
| Company tenant/membership data | Confidential authorization data | Relational database; denial output must not disclose cross-tenant existence |
| Identity/evidence file bytes | Highly sensitive | Private object storage only; never relational rows, public URLs, screenshots, traces, CI artifacts or prompts |
| Secure-file metadata/hashes | Confidential security/provenance data | Server-owned relational metadata; expose only bounded authorized projections |
| Security/audit history | Confidential security metadata | Append-only relational facts; no secrets/raw private content |
| Assessment answers/interview media | Highly sensitive | Not built yet; future private/durable storage only |
| Build/release metadata | Internal | Safe generated evidence only; no secrets/environment values |

## Verification commands

- Development: `npm run dev`
- Production build: `npm run build`
- Environment validation: `npm run validate:env`
- Database: `npm run db:migrate`, `npm run db:status`, guarded `npm run db:rollback`
- Focused current signed-access checks: `npm run check:secure-access`, `npm run test:secure-access`, `npm run test:secure-access-runtime`
- Quick gate: `npm run verify:quick`
- Affected gate: `npm run verify:affected`
- **Full fail-closed gate:** `npm run verify:full` / repository complete application gate `npm run check`
- Unit aggregate: `npm run test:unit`
- Integration aggregate: `npm run test:integration`
- Runtime/E2E-equivalent aggregate: `npm run test:e2e`
- Owner handoff: `npm run report:handoff`
- Engineering installation/context contract: `npm run check:engineering`

No required check may be called PASS when skipped, blocked, assumed or weakened.

## Manual-testing responsibility

Always manual when affected: visual hierarchy/wording/usability, responsive visual behavior, real TOTP interaction, real file-picker/camera/microphone/device behavior when built, and other subjective human acceptance.

Usually automated: install/environment, migration/rollback, lint/type/build, domain/service/repository/API tests, role/tenant/account isolation, concurrency, durable retry/recovery, source authority guards, real Next runtime smoke and release evidence.

Subunit 4 currently exposes an API-level signed file capability and no complete Worker/reviewer UI workflow; owner browser testing is required only if the generated handoff identifies genuinely visible behavior after the exact engineering gate passes.

## Project-specific definition of done

A product change is complete only when:

1. the exact canonical current milestone/subunit boundary is implemented without later-brick work;
2. server-side role, permission, ownership and tenant rules are enforced;
3. durable state, retries, duplicates, interruption and concurrency are covered where applicable;
4. focused tests pass;
5. the complete fail-closed engineering gate passes on the exact implementation head;
6. no required test is skipped, weakened or hidden;
7. serious discovered defects receive stable regression IDs and permanent guards;
8. the implementation merges without drift and merged `main` passes again;
9. the generated handoff accurately identifies visible impact;
10. required owner testing passes before a visible brick is marked DONE;
11. no release-blocking defect remains;
12. authoritative context files agree on the build position.

## Current limitations / blocked areas

- M1.06 is incomplete until signed preview/download Subunit 4 and cumulative Subunit 5 acceptance close.
- M1.07 identity submission/liveness/Worker ID, M1.08 Company verification, M1.09 sites/departments/team, M1.10 Worker/Company operational invitations, M1.11 evidence records and M1.12 public verification remain blocked.
- All M2 assessment/review/interview/decision work remains blocked until Milestone 1 closes.
- All M3 credentials, billing, reporting, production provider activation and launch certification remain blocked by build order.
- Live email, SMS, malware scanning, liveness, video and payment providers require later approved production credentials/integrations; accepted local/test adapters must not be misrepresented as live production providers.
- No repository-controlled hosted preview/production URL is configured.
