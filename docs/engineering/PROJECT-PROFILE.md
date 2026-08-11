# HSE Verify — Project Profile

## Identity and authority

- **Project name:** HSE Verify.
- **Purpose:** workforce trust platform that independently verifies Worker identity, qualifications, experience, skills, assessments, interviews and employer relationships through isolated role portals.
- **Category:** multi-role, multi-tenant Next.js web application with relational persistence, private object storage and security-sensitive durable workflows.
- **Build model:** Phase 1 clean rebuild; earlier Version 10/prototype code is capability reference only, never an architectural dependency.
- **Frozen product scope:** HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026.
- **Current build position:** controlled by `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.
- **Current accepted snapshot:** M1.01–M1.07 DONE; M1.07 Worker Onboarding and Identity Engine has engineering + owner/browser PASS on the exact released SHA. M1.08 Company Registration and Verification is READY TO BUILD only after the formal M1.07 closure branch merges and merged `main` passes. Milestone 1 is 7/12 DONE. M1.09+ remain blocked.
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
- **Worker identity:** M1.07 accepted a separate versioned Worker identity aggregate, verified contact snapshots, M1.06-backed private identity evidence, assistive automated checks/provider boundary, conservative duplicate/recovery dispositions, opaque permanent Worker-ID eligibility/issuance, immutable correction lineage and the Worker-only `/worker/identity` UX.
- **Deployment:** provider-neutral standalone preview bundle/release manifest; no repository-controlled hosted production URL yet.
- **Compatibility overrides:** PostCSS `8.5.18` and Sharp `0.35.3` remain intentionally pinned under the accepted security-floor policy.

## Application boundaries

- `src/app` is the Next.js App Router application.
- `src/proxy.ts` may perform optimistic missing-session-cookie redirects; database authorization remains authoritative.
- Public surfaces include landing, six role login surfaces, Worker registration/verification/recovery, staff invitation acceptance, controlled public verification demonstration and safe denial/not-found boundaries.
- Protected surfaces include Worker, Company, Assessor, Verifier, Administrator and Root portals plus protected server actions/routes.
- Trusted modules include `src/lib/auth`, `src/lib/authorization`, `src/lib/audit`, `src/lib/outbox`, notification/email modules, `src/lib/database`, `src/lib/worker`, `src/lib/secure-files` and the accepted `src/lib/identity` domain.
- Worker identity remains separate from the general Worker profile JSON document.
- Browser input never selects executable job handlers/providers, trusted account/role/tenant/membership context, storage root/object key, scanner implementation, signed-access scope, identity reviewer, duplicate/recovery authority or final identity decision authority.

## Environments

| Environment | Database | Provider behavior | Secure file / identity behavior | Rule |
|---|---|---|---|---|
| Development | PGlite by default | Explicit local sandbox adapters | Accepted private local/test secure files and deterministic identity-check adapters | Never use production credentials/data |
| Test/CI | Disposable/in-memory PGlite | Synthetic deterministic adapters | Disposable private storage plus deterministic scanner/identity fixtures | Deterministic synthetic state only |
| Preview | Private PostgreSQL required | Development adapters rejected | Secure-file and identity-provider-dependent behavior fails closed until approved real providers exist | No silent local fallback |
| Production | Private PostgreSQL required | Approved live providers only | Real private object/scanner/liveness/face/document providers required before activation | Fail closed when provider unavailable/unconfigured |

Restricted values include `HSE_SESSION_SECRET`, `HSE_AUTH_PEPPER`, `DATABASE_URL` and sandbox access material. Never commit/log/artifact/prompt real secrets.

## Roles and isolation

| Role | Intended boundary | Explicitly forbidden |
|---|---|---|
| Worker | Own Worker portal/profile/identity/session/secure-file authority | Other Workers; Company/Assessor/Verifier/Admin/Root portals; self-verification or duplicate-decision authority |
| Company | Current authenticated Company tenant and permitted records | Other tenants; client-selected tenant/membership/scope |
| Assessor | Assigned assessment/interview work when M2 exists | Company admin, Verifier decisions, Admin/Root authority |
| Verifier | Assigned identity/evidence verification when M2.02 exists | Company admin, Assessor-only work, Admin/Root authority |
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
| WF-007 | Deterministic migrations/rollback/database runtime | ACCEPTED THROUGH M1.07 |
| WF-008 | Production build, standalone preview bundle and release evidence | ACCEPTED |
| WF-009 | Engineering verification and exact owner handoff | ACCEPTED FOUNDATION |
| WF-010 | Secure file domain → upload/quarantine → scan → signed access → cumulative recovery | ACCEPTED — M1.06 DONE |
| WF-011 | Worker Identity Engine, private identity evidence, duplicate disposition and permanent Worker ID | ACCEPTED — M1.07 OWNER PASS |
| WF-012 | Company registration and verification | READY TO BUILD — M1.08 AFTER CLOSURE |
| WF-013 | Randomized MCQ/written assessment delivery and recovery | NOT CONFIGURED / BLOCKED |
| WF-014 | Sites/departments/team and later Company operational modules | NOT CONFIGURED / BLOCKED |

## Accepted M1.07 Worker Identity boundary

- separate versioned Worker identity aggregate owned by the authenticated Worker;
- legal/personal identity draft with optimistic revision and trusted verified email/phone snapshots;
- private identity-document/profile-photo/selfie evidence using the accepted M1.06 reserve/upload/quarantine/scan lifecycle and same-Worker binding;
- complete submission readiness enforced at trusted server/database boundaries;
- initial and correction readiness plus lifecycle transition serialized atomically in one database transaction;
- deterministic/provider-adapter automated identity checks with preview/production fail-closed provider behavior;
- automated/provider result is assistive evidence only and never final Worker self-verification/rejection authority;
- conservative duplicate signals and explicit disposition/recovery boundaries with no silent or automatic account/identity merge;
- opaque, unique, idempotent permanent Worker ID only for the current verified identity after duplicate/recovery eligibility is clear;
- immutable correction requests/decisions/evidence-origin history and monotonic version lineage;
- accepted parent identity/evidence is never destructively overwritten by correction;
- Worker-only `/worker/identity` route/actions, bounded status/eligibility display, evidence replacement, stale-write behavior and no refresh-only successful submission path;
- React Server Action evidence forms do not override React-owned method/encoding metadata;
- reviewer queue/assignment/decision UI remains M2.02.

Final accepted release: `4858c05fcab9d8e4fa4cc09d4cfc2243dc313177`; exact PR-head gate `31446794451`, merged-main gate `31447079334`, owner/browser PASS 11 August 2026. Final evidence: `docs/testing/results/M1_07_FINAL_ACCEPTANCE.md`.

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
- Worker Identity check/runtime commands installed in the complete application gate
- `npm run verify:quick`, `npm run verify:affected`
- **`npm run verify:full` / complete application gate `npm run check`**
- `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`
- `npm run report:handoff`
- `npm run check:engineering`
- `npm run build`

No required check may be called PASS when skipped, blocked, assumed or weakened.

## Manual-testing responsibility

Manual testing is mandatory when genuinely affected for visual hierarchy/usability, responsive visual behavior, real TOTP and real device/file-picker/camera/microphone interaction. Domain/repository/API/SQL/isolation/concurrency/retry/recovery/migration/runtime/build behavior is primarily automated.

M1.07's visible Worker Identity release received the mandatory targeted owner/browser PASS on 11 August 2026. The already-accepted unrelated browser baseline was not artificially rerun for the final atomic readiness/Server Action repair.

## Project-specific definition of done

A change is complete only when the canonical current boundary is implemented without later-brick work; server role/permission/owner/tenant rules hold; relevant durable/interruption/concurrency states are covered; focused tests and complete exact-head gate pass; no checks are skipped/weakened; serious defects have stable regression guards; the exact verified head merges without drift; merged `main` passes again; handoff accurately reports visible impact; required owner testing passes; no release blocker remains; and authoritative context files agree.

## Current limitations / blocked areas

- M1.08 Company Registration and Verification is not implemented yet; it becomes the only next permitted product brick after the M1.07 closure itself merges green.
- M1.09–M1.12 Company/operational/evidence/public verification workflows remain blocked in canonical order.
- Reviewer-facing identity/evidence queues remain M2.02; all M2 assessment/review/interview/decision work and all M3 credential/billing/reporting/production-launch work remain blocked by build order.
- Live email, SMS, private-object storage, malware scanning, liveness/face/document verification, video and payment activation requires later approved production providers/credentials; accepted local/test adapters must not be misrepresented as live providers.
- No repository-controlled hosted preview/production URL is configured.
