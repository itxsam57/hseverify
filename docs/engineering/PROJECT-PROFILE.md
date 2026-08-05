# HSE Verify — Project Profile

## Identity

- **Project name:** HSE Verify
- **Product purpose:** A workforce trust platform that independently verifies worker identity, qualifications, experience, skills, assessments, interviews, and employer relationships through isolated role portals.
- **Product category:** Multi-role, multi-tenant web application with server-rendered portals, server actions, relational persistence, and security-sensitive workflows.
- **Current lifecycle stage:** Phase 1 clean rebuild. Milestone 1 has 3 of 12 bricks owner-accepted. M1.04 Authorization and Tenant Isolation is in progress; internal subunits 1 and 2 are owner-accepted and subunit 3 is the next product build unit.
- **Repository:** `itxsam57/hseverify`
- **Default branch:** `main`

## Technology

- **Languages:** TypeScript, JavaScript ESM, SQL, CSS, YAML.
- **Frameworks and versions:** Next.js `16.2.12` App Router, React `19.2.8`, React DOM `19.2.8`, TypeScript `6.0.3`, ESLint `9.39.5`.
- **Package manager and lockfile:** npm with committed `package-lock.json`; Node.js `>=20.9.0`. CI uses Node.js 24.
- **Database/ORM:** Direct SQL repository layer. PGlite `0.5.4` provides PostgreSQL-compatible local and CI execution; `postgres` `3.4.9` provides the preview/production PostgreSQL adapter. No ORM is used.
- **Authentication:** Repository-owned password, OTP, TOTP, opaque session, recovery, staff invitation, and fixed-role portal services.
- **Authorization:** Central server-only authorization context and permission service with platform-role and Company-tenant permission matrices. Company tenant context is derived only from the authenticated account's current membership.
- **Storage:** Relational database only for implemented workflows. Secure object/evidence storage is not built yet.
- **Queues/workers:** No durable outbox or background-job runner yet; these belong to M1.05.
- **External providers:** Live email, SMS, liveness, malware scanning, video/interview, object storage, and payment providers are not connected. Development/test authentication delivery uses an explicitly gated local sandbox.
- **Deployment:** Provider-neutral standalone preview bundle and release manifest. CI validates the bundle with a real startup smoke. No repository-controlled hosted preview URL is currently configured.
- **CI:** GitHub Actions with locked installation, complete verification gate, preview smoke, release evidence, concurrency cancellation, dependency caching, concise handoff summary, and short artifact retention.
- **Compatibility overrides:** Locked PostCSS `8.5.18` and Sharp `0.35.3` overrides are intentionally retained under the existing security-floor policy.

## Application boundaries

- **Primary entry point:** `src/app` Next.js App Router.
- **Request pre-boundary:** `src/proxy.ts` performs only an optimistic missing-session-cookie redirect for protected dashboard route families.
- **Public surfaces:** Root landing page, six fixed-role login pages, Worker registration/verification/recovery surfaces, staff invitation acceptance, public verification demonstration route, access-denied and not-found boundaries.
- **Protected surfaces:** Worker, Company, Assessor, Verifier, Administrator, and Root portal route groups; account session management; staff management where permitted.
- **Server actions/routes:** App Router server actions and route handlers under `src/app`; authentication, registration, session, profile, and staff workflows are server-side.
- **Data/service entry points:** `src/lib/auth`, `src/lib/authorization`, `src/lib/database`, and `src/lib/worker`.
- **Background jobs:** NOT CONFIGURED. Durable outbox, notification, and provider jobs belong to M1.05.
- **Shared high-impact modules:**
  - `src/lib/auth/*`
  - `src/lib/authorization/*`
  - `src/lib/database/*`
  - `src/proxy.ts`
  - shared role portal shells and login forms
  - shared UI components and global/design-system CSS
  - migration runner and isolated Next build/runtime scripts
- **API boundary:** No broad public REST API exists. Route handlers and server actions are the current trusted HTTP boundaries.

## Environments and secrets

| Environment | Database | Authentication delivery | Demo data | Rule |
|---|---|---|---|---|
| Development | PGlite by default | Optional local sandbox | Explicit flags only | Never use production credentials or data |
| Test/CI | In-memory PGlite | Synthetic test state | Disabled unless a focused test explicitly owns it | Deterministic and disposable |
| Preview | Private PostgreSQL required | Live sandbox adapter is rejected | Disabled | Provider-neutral artifact is smoke-tested |
| Production | Private PostgreSQL required | Approved live providers only | Disabled | No development/test fallback |

Required and sensitive variables include `HSE_SESSION_SECRET`, `HSE_AUTH_PEPPER`, `DATABASE_URL`, and the local-only sandbox access key. Real values must never be committed, printed, stored in artifacts, or included in AI prompts.

## Users, roles, and isolation

| Role | Intended access | Forbidden access | Critical actions |
|---|---|---|---|
| Worker | Own Worker portal, profile, sessions, future personal evidence and assessments | Company, Assessor, Verifier, Admin, Root portals; another worker's private records | Register, authenticate, maintain profile, submit future evidence/assessments |
| Company | Current authenticated Company tenant only | Another Company tenant; Worker/staff portals; client-selected tenant context | Authenticate with TOTP, access Company portal, future tenant-owned operations |
| Assessor | Assigned assessment/interview work only | Company tenant administration, verifier decisions, Admin/Root authority | Future assigned assessment and interview decisions |
| Verifier | Assigned verification work only | Company administration, assessor-only work, Admin/Root authority | Future evidence and identity verification |
| Admin | Routine platform operations explicitly granted by the platform matrix | Root-only emergency/security actions; arbitrary Company tenant access | Staff provisioning and routine administration |
| Root | Emergency/security platform authority explicitly granted by the matrix | Routine Company tenant management merely because Root exists | Root bootstrap, security oversight, exceptional platform actions |

**Isolation rules**

- No role switching inside an authenticated session.
- No role, permission, tenant, membership, or scope selector may be trusted from URL, form, header, cookie field, or client state.
- Company tenant scope comes only from the accepted server authorization principal.
- Repository reads/writes for tenant-owned data must include tenant scope directly in SQL.
- Fetch-global-then-filter and record-ID-only tenant queries are prohibited.
- Cross-role and cross-tenant denial must be non-enumerating.

## Critical workflows

| ID | Workflow | Roles | Durable state | External dependency | Risk |
|---|---|---|---|---|---|
| WF-001 | Worker dual-contact registration and OTP continuation | Worker | Account, registration flow, OTP challenges, security events | Local sandbox now; live email/SMS later | High |
| WF-002 | Password login, lockout, recovery, session creation and revocation | All roles | Accounts, rate limits, recovery flows, sessions, events | None in CI | High |
| WF-003 | Staff invitation, TOTP enrollment and fixed-role portal entry | Company, Assessor, Verifier, Admin, Root | Invitations, MFA factors, roles, sessions | Authenticator device for manual test | High |
| WF-004 | Worker Profile persistence, optimistic concurrency and correction request | Worker | Worker profile and history | None | High |
| WF-005 | Central role/permission and Company tenant authorization context | All roles | Session/account/role/tenant/membership state | None | Critical |
| WF-006 | Signed-out and copied-route denial | All roles | Session state and security events | Browser for visible acceptance | Critical |
| WF-007 | Deterministic migrations, rollback boundary and database runtime | Engineering/platform | Migration ledger and schema | PGlite/PostgreSQL adapter | Critical |
| WF-008 | Production build, standalone preview bundle and release evidence | Engineering/platform | Build artifact and release manifest | GitHub Actions artifact storage | High |
| WF-009 | Engineering verification and manual-test handoff | Engineering/owner | Generated non-committed concise reports | Git and GitHub Actions | High |
| WF-010 | Future secure evidence upload/review | Worker, Verifier | NOT BUILT | Object storage and malware scanner | Critical |
| WF-011 | Future randomized MCQ/written assessment delivery and recovery | Worker, Assessor | NOT BUILT | Proctoring/interview adapters later | Critical |
| WF-012 | Future tenant-owned Company records and commands | Company | Subunit 3 onward | None | Critical |

## Data classification

| Data | Sensitivity | Storage | Logging rule | Test-fixture rule |
|---|---|---|---|---|
| Passwords, OTPs, TOTP secrets, session tokens, peppers | Restricted secret | Hashes/encrypted values and opaque token hashes only | Never log plaintext or derived reusable material | Synthetic only; never committed |
| Worker name, email, phone, profile data | Personal/confidential | Relational database | Redact or omit from CI summaries and artifacts | Synthetic identities only |
| Company tenant and membership records | Confidential authorization data | Relational database | No cross-tenant identifiers in denial output | Opaque synthetic IDs |
| Future identity documents and evidence | Highly sensitive | NOT BUILT; future private object storage | Never include in screenshots, traces, logs, artifacts, or prompts | Generated non-personal sample files only |
| Security events and audit history | Confidential security metadata | Relational database | Summarize without secrets or protected record detail | Synthetic account/tenant references |
| Assessment answers/interview media | Highly sensitive | NOT BUILT | Never expose in CI or AI prompts | Synthetic answers/media only |
| Build and release metadata | Internal | Generated artifact/manifest | Safe when it contains no secret/environment value | Deterministic test values |

## Existing commands

- Development: `npm run dev`
- Production build: `npm run build`
- Environment validation: `npm run validate:env`
- Database: `npm run db:migrate`, `npm run db:status`, `npm run db:rollback`
- Existing complete application gate: `npm run check`
- Preview startup smoke: `npm run preview:smoke`
- Release evidence: `npm run release:manifest`

## Verification commands

- **Quick:** `npm run verify:quick`
- **Affected:** `npm run verify:affected`
- **Full:** `npm run verify:full`
- **Unit:** `npm run test:unit`
- **Integration/database/API-equivalent:** `npm run test:integration`
- **UI/E2E equivalent:** `npm run test:e2e`
- **Handoff:** `npm run report:handoff`
- **Engineering installation contract:** `npm run check:engineering`

`test:e2e` is intentionally the repository's current real Next.js runtime, protected-route, database-backed application, and deployable-preview smoke layer. A duplicate browser framework is not installed while current visible acceptance still depends on local TOTP/test accounts and subjective UI review.

## Safe test environment

- **Test accounts:** Existing local synthetic Worker and staff accounts only. No production or personal accounts.
- **Test database:** In-memory PGlite for automated checks; `.data/postgres` local PGlite for owner testing.
- **Fixtures:** Test files create isolated rows inside disposable PGlite databases. Local authentication sandbox values are manually configured and ignored.
- **Cleanup strategy:** Automated databases are disposable. Tests must not delete or reset the owner's local `.data` database unless the documented guarded rollback/import command is explicitly being tested.
- **Required non-production secrets:** Synthetic session secret and auth pepper of valid length. CI uses fixed non-production values.
- **External credentials:** Not required for the current automated gate. Live providers remain BLOCKED.
- **Generated output:** `.engineering`, preview bundles, release manifests, test evidence, coverage, screenshots, traces, videos, and logs are ignored and must not be committed.

## Browser and device matrix

| Surface | Automated | Owner/manual |
|---|---|---|
| Next.js development startup and HTTP response | Yes | No |
| Signed-out Worker/Company redirects | Yes, real runtime HTTP | Visible Chrome confirmation when affected |
| Worker/Company login and TOTP flow | Domain/database/source automated | Chrome on Windows for final visible acceptance |
| Copied cross-role URLs | Server/domain/source automated | Chrome spot-check when auth/authorization changes |
| Responsive layout | CSS/source contract automated at defined boundaries | Chrome desktop plus responsive widths for final visual acceptance |
| Keyboard/focus/forced-colour/reduced-motion contracts | Source/design-system checks | Human usability spot-check |
| Firefox/Edge/Safari | Not in every CI run | Release-level compatibility testing; Edge is a useful Windows spot-check |
| Real camera, microphone, OS file picker | NOT CONFIGURED because corresponding product workflows are not built | Manual when those milestones are implemented |

## Manual-testing responsibility

### Always manual

- Visual hierarchy, spacing, wording, usability, and natural workflow judgement.
- Final Chrome browser acceptance for any visible feature changed.
- Real TOTP authenticator interaction when login/MFA UI changes.
- Responsive visual inspection after shared CSS or shell changes.
- Real file picker, camera, microphone, and device permission behaviour once those features exist.

### Usually automated

- Locked install, environment rules, lint, strict type checking, production build.
- Unit, database, migration, repository, concurrency, role, permission, tenant, and direct-route checks.
- Development runtime, database-backed application smoke, protected redirects, preview bundle startup, and release manifest.
- Known regression contracts.
- Change-impact classification and concise manual handoff generation.

### Not currently automatable or deliberately not installed

- Hosted preview URL: no repository-controlled deployment integration exists.
- Live provider delivery and callbacks: credentials/adapters are not connected.
- Full browser workflow automation: not installed yet because it would duplicate current runtime coverage, add material CI/dependency cost, and still require safe deterministic staff/TOTP fixtures. Reassess when stable end-to-end business workflows are built.
- Upload, assessment, interview, payment, and notification browser flows: product layers are not built.

## Project-specific definition of done

A product change is complete only when:

1. the canonical current milestone boundary is implemented without building later bricks early;
2. server-side role, permission, ownership, and tenant rules are enforced;
3. durable state, retries, duplicate actions, and concurrency are covered where applicable;
4. focused tests pass;
5. `npm run verify:full` passes in a safe test environment;
6. no required test is skipped, weakened, or hidden;
7. the generated handoff has one allowed status and accurately describes visible impact;
8. the owner performs only the listed visible manual tests;
9. serious discovered defects receive stable regression IDs;
10. no release-blocking defect remains and the branch is clean/synchronized before owner acceptance.

## Known limitations and blocked areas

- M1.04 is still incomplete; tenant-owned repository/query/command guards and final cross-tenant endpoint/concurrency coverage remain.
- M1.05 durable audit/outbox/notification foundation is not complete.
- Secure evidence uploads, Company verification, sites/teams, Worker invitations/codes, evidence records, and public verification are later Milestone 1 work.
- Assessments, written answers, randomized non-repeating delivery, interviews, review, appeals, and credentials are Milestone 2.
- Billing, payouts, reporting, operational hardening, and live production activation are Milestone 3.
- Live email, SMS, storage, malware scanning, liveness, video, and payment credentials are provider-blocked.
- The current README and SECURITY status text contains historical foundation wording and should not be treated as the roadmap authority; `docs/bookmarks/MILESTONE_PATH.md`, `docs/bookmarks/LATER.md`, and `docs/NEXT_BUILD_UNIT.md` control build order.
