# HSE Verify — Project Test Matrix

Status vocabulary is `PASS`, `FAIL`, `BLOCKED`, `NOT CONFIGURED`, and `NOT APPLICABLE`. A `PASS` means the implemented layer is inside the permanent automated gate and has accepted evidence. A future/partial business workflow is never upgraded to PASS merely because a prerequisite foundation exists.

The exact current build position is controlled by `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

| Feature ID | Feature/workflow | Role(s) | Main risk | Automated evidence | Isolation/security evidence | Manual | Status |
|---|---|---|---|---|---|---|---|
| TM-001 | Clean install and environment separation | Engineering | Dependency drift or production fallback in test | Environment contract, locked `npm ci`, validator | Secrets/demo fallbacks rejected | No routine manual test | PASS |
| TM-002 | Deterministic migration ledger | Platform | Partial/reordered/changed migration or destructive rollback | Apply/idempotency/checksum/rollback-reapply suites through accepted migrations | Prior accepted data preserved | No destructive owner DB test | PASS |
| TM-003 | Worker dual email/phone OTP registration | Worker | Replay, concurrent challenge, stuck transition | Auth domain, repository, SQL, route and concurrency tests | Registration/session isolation | Browser flow when auth UI changes | PASS |
| TM-004 | Worker password login, lockout and recovery | Worker | Enumeration, weak lockout, stale sessions | Password/OTP/token and failure-state tests | Fixed Worker role and session ownership | Login/recovery when changed | PASS |
| TM-005 | Staff invitation and mandatory TOTP | Company, Assessor, Verifier, Administrator, Root | Bypass, replay, wrong role | Invitation/TOTP/enrollment/MFA tests | Fixed role, no role switching | Authenticator flow when changed | PASS |
| TM-006 | Opaque sessions, revocation and stale-state denial | All roles | Access after logout/reset/revocation | Session lifecycle and reset-revocation tests | Central role/permission guard | Logout when affected | PASS |
| TM-007 | Fixed-role portal isolation | All roles | Cross-role dashboard/endpoint access | Six-role matrix, protected route tests | 6 own-role allows + 30 cross-role denials | Representative copied URL when affected | PASS |
| TM-008 | Platform permission matrix | All roles | Wildcard/over-broad grants | Exhaustive authorization domain/source tests | Explicit permission evaluation/ceilings | Usually none | PASS |
| TM-009 | Company tenant context | Company | Client-selected/ambiguous tenant | Session/membership SQL and domain tests | Active current membership only | Tenant-visible check when affected | PASS |
| TM-010 | Tenant-owned repository/query/command scope | Company | Cross-tenant read/write/existence leak | SQL scope, uniqueness, version and concurrency tests | Transactional live authority revalidation | Future real modules add visible checks | PASS |
| TM-010A | Protected Company tenant-scope demonstration | Company, Worker | Browser-selected tenant, stale UI, dead controls | Real route/database CRUD tests | Cross-tenant and copied-role denial | Accepted CRUD/no-refresh workflow | PASS |
| TM-010B | M1.04 final isolation/rollback closure | All roles/platform | Untested role pair, lifecycle race, incomplete rollback | Final role/endpoint/concurrency/migration suites | Non-enumerating malformed/cross-tenant denial | Owner closure accepted 6 Aug 2026 | PASS |
| TM-011 | Worker Profile persistence/concurrency | Worker | Lost update/wrong profile | Domain/repository/version tests | Worker ownership | Profile form/refresh when changed | PASS |
| TM-012 | Identity-locked Profile correction path | Worker | Sensitive-field overwrite | Domain/service/repository tests | Worker-only correction boundary | Wording when changed | PASS |
| TM-013 | Responsive shell/Profile containment | Worker/shared UI | Overflow/clipped actions | CSS/source/width/zoom contracts | NOT APPLICABLE | Visual responsive check after shared CSS | PASS |
| TM-014 | Shared design/accessibility contracts | All roles | Dead controls/focus/inconsistent states | Component/source/design checks | Portal isolation retained | Human usability/visual judgment | PASS |
| TM-015 | Signed-out protected-route redirects | All roles | Protected render/not-found after logout | Real Next HTTP redirect smoke | Exact fixed-role login targets | Representative changed route | PASS |
| TM-016 | Development server lifecycle | Engineering | Start failure/dirty config/orphan process | Real startup/clean shutdown smoke | Demo/auth flags controlled | None | PASS |
| TM-017 | Database-backed application runtime | Worker/platform | Bundling/runtime adapter failure | PGlite app smoke | Accepted auth/data boundaries | None | PASS |
| TM-018 | Strict type checking and lint | Engineering | Unsafe/unreachable code | Project typecheck + ESLint | Security code included | None | PASS |
| TM-019 | Production build isolation | Engineering | Generated config mutation/non-determinism | Next build-system tests + production build | Environment rules | None | PASS |
| TM-020 | Standalone preview bundle | Engineering/owner | Artifact cannot start | Bundle copy/start smoke | Test-only environment | Hosted visual preview NOT CONFIGURED | PASS |
| TM-021 | Release manifest and rollback candidate | Engineering | Untraceable release | Manifest/source/CI evidence | Immutable target ref | None | PASS |
| TM-022 | Production dependency security floor | Engineering | Known high-severity dependency | Secure dependency check + production npm audit | NOT APPLICABLE | None | PASS |
| TM-023 | Engineering documentation/automation installation | Engineering/AI | Missing/weakened operating rules or stale build context | `check:engineering` required-file, workflow, context-consistency and regression checks | Security rules/context included | None | PASS |
| TM-024 | Change-impact classification | Engineering/owner | Wrong manual test scope | Handoff domain and git-diff mapping | Shared auth/tenant impact mapping | Owner follows generated steps only | PASS |
| TM-025 | Full-gate result/manual handoff | Engineering/owner | False readiness/hidden failure | Fail-closed orchestrator/result file | Required security failure blocks readiness | Owner tests only generated visible steps | PASS |
| TM-025A | Immutable platform audit | All protected workflows | Missing/alterable privileged history | Audit domain/repository/concurrency/migration suites | Trusted actor/role/tenant context; append-only | None unless a visible projection changes | PASS |
| TM-025B | Transactional outbox/background worker | Platform/providers | Lost/duplicate job, stale lease, unbounded retry | Outbox domain/runtime/concurrency/migration suites | Fixed handler authority, lease/reclaim/terminal guards | None | PASS |
| TM-025C | Persisted in-app notifications/deep links | All recipient roles | Non-clickable/wrong-role/cross-tenant navigation | Notification repository/route/migration tests | Exact recipient/current-principal link resolution | Click changed notification types when visible | PASS |
| TM-025D | Provider-neutral durable email delivery | Platform/recipients | Duplicate send, lost retry, false delivery | Email foundation/runtime/platform tests | Outbox lease binding, terminal short-circuit, no plaintext secrets | Live provider NOT CONFIGURED; local/test accepted | PASS |
| TM-026 | Secure file domain/private object-storage foundation | Worker, Company, future reviewers | Cross-account/tenant object access, path escape | Secure-file domain/repository/concurrency/migration tests | Server opaque keys; owner/tenant SQL scope; traversal/symlink guards | No visible workflow | PASS |
| TM-026A | Isolated PDF/PNG/JPEG upload validation/quarantine | Worker, Company | Wrong file, MIME/signature mismatch, leaked form state, partial upload | Upload source/unit/runtime/platform/concurrency/migration suites | Exact owner/tenant binding; private quarantine; SHA-256/size | No complete product UI yet | PASS |
| TM-026B | Durable malware scan foundation | Platform/secure files | Unsafe file availability, duplicate scan, deadlock/stuck scan | Scanner/runtime/handler/migration/retry/reclaim tests | Trusted lease, outbox-before-file lock order, live scope revalidation | Live scanner NOT CONFIGURED | PASS |
| TM-026C | Authorized signed preview/download | Worker, Company | Copied token, wrong role/tenant, public object URL, unsafe headers | Signed token/core/runtime/source/migration tests under PR #53 | Exact session/account/role/tenant scope; use-time live lookup; size/hash revalidation | Only if generated handoff identifies visible behavior | BLOCKED — M1.06 SUBUNIT 4 IN PROGRESS |
| TM-027 | Worker Identity Engine and permanent Worker ID | Worker, Verifier | Wrong identity/version, duplicate Worker, unsafe evidence | Future M1.07 | Required | Required when built | NOT CONFIGURED |
| TM-028 | Company registration/verification | Company, Verifier/Admin | Unverified tenant activation/wrong admin | Future M1.08 | Required | Required when built | NOT CONFIGURED |
| TM-029 | Sites/departments/team and operational Worker invitation records | Company | Cross-scope access/history deletion | Future M1.09–M1.10 | Required | Required when built | NOT CONFIGURED |
| TM-030 | Employment/experience/qualification/skill/leaving records | Worker, Company, Verifier | Wrong-record evidence/lost history | Future M1.11 | Required | Required when built | NOT CONFIGURED |
| TM-031 | Public verification foundation | Public/Worker/platform | Excess data exposure/enumeration/abuse | Future M1.12 | Safe projection/rate-limit/concern controls required | Required when built | NOT CONFIGURED |
| TM-032 | Randomized MCQ/written assessment + durable answer recovery | Worker, Assessor | Repeated questions, lost answers, stuck assessment | Future M2 | Assigned case/user only | Required when built | BLOCKED |
| TM-033 | Evidence verification/review/interview/decision/appeal | Worker, Assessor, Verifier | Wrong case access/lost status/provider interruption | Future M2 | Required | Required when built | BLOCKED |
| TM-034 | Credentials/living record/share links | Worker, Company, public | Stale/revoked credential disclosure | Future M3 | Required | Required when built | BLOCKED |
| TM-035 | Payments/subscriptions/payout/webhooks | Company/platform | Duplicate charge/replay/wrong ledger | Future M3 | Signed callbacks/idempotency required | Sandbox/live provider required later | BLOCKED |
| TM-036 | Production provider activation/load/security/recovery launch | Platform | Sandbox leakage, provider outage, capacity/recovery failure | Future M3.10–M3.12 | Production-only secrets and fail-closed integrations | Release certification | BLOCKED |

## Current M1.06 signed-access coverage requirements

Subunit 4 cannot become PASS until its exact implementation head proves:

- only `available` files can receive access;
- exact file + preview/download purpose + current session/account/role/Company membership scope binding;
- tamper, expiry, wrong-purpose, copied-account/role/tenant/membership and revoked/stale-session denial;
- token reuse while valid and expiry boundary;
- use-time live repository authorization before private-object read;
- private-object size and SHA-256 revalidation;
- server-derived PDF/image content type and safe `Content-Disposition`/cache/referrer/cross-origin headers;
- no public object URL or browser-selected storage/content/tenant authority;
- successful access auditing without token/URL/object key/hash/secret/raw bytes;
- unsupported preview/production storage environment fails closed;
- migration rollback/reapplication and restart persistence where applicable;
- exact-head complete engineering gate, merge and merged-main complete gate.

## Test quality rules

- No empty/always-true assertions, expected-value changes that bless a bug, hidden/skipped required tests, or mocks of the exact behavior under test.
- Security is tested at trusted boundaries, never only through hidden UI controls.
- Serious confirmed defects receive permanent regression IDs.
- A flaky required test is a defect, not a pass.
- Production state/data/credentials are never used by automated tests.
