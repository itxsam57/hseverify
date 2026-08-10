# HSE Verify — Project Test Matrix

Status vocabulary is `PASS`, `FAIL`, `BLOCKED`, `NOT CONFIGURED`, `READY TO BUILD`, `IN PROGRESS`, and `NOT APPLICABLE`. A `PASS` means the implemented layer is inside the permanent automated gate and has accepted evidence. A future/partial business workflow is never upgraded to PASS merely because a prerequisite exists.

The exact current build position is controlled by `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

| Feature ID | Feature/workflow | Role(s) | Main risk | Automated evidence | Isolation/security evidence | Manual | Status |
|---|---|---|---|---|---|---|---|
| TM-001 | Clean install and environment separation | Engineering | Dependency drift or production fallback in test | Environment contract, locked `npm ci`, validator | Secrets/demo fallbacks rejected | No routine manual test | PASS |
| TM-002 | Deterministic migration ledger | Platform | Partial/reordered/changed migration or destructive rollback | Apply/idempotency/checksum/rollback-reapply suites | Prior accepted data preserved | No destructive owner DB test | PASS |
| TM-003 | Worker dual email/phone OTP registration | Worker | Replay, concurrent challenge, stuck transition | Auth domain/repository/SQL/route/concurrency | Registration/session isolation | Browser flow when UI changes | PASS |
| TM-004 | Worker password login, lockout and recovery | Worker | Enumeration, weak lockout, stale sessions | Password/OTP/token/failure tests | Fixed Worker role/session ownership | Login/recovery when changed | PASS |
| TM-005 | Staff invitation and mandatory TOTP | Company, Assessor, Verifier, Administrator, Root | Bypass/replay/wrong role | Invitation/TOTP/enrollment/MFA | Fixed role/no role switching | Authenticator flow when changed | PASS |
| TM-006 | Opaque sessions, revocation and stale-state denial | All roles | Access after logout/reset/revocation | Session lifecycle/reset tests | Central role/permission guard | Logout when affected | PASS |
| TM-007 | Fixed-role portal isolation | All roles | Cross-role endpoint access | Six-role matrix/protected route tests | 6 own-role allows + 30 cross-role denials | Copied URL when affected | PASS |
| TM-008 | Platform permission matrix | All roles | Wildcard/over-broad grants | Exhaustive authorization/source tests | Explicit permission ceilings | Usually none | PASS |
| TM-009 | Company tenant context | Company | Client-selected/ambiguous tenant | Session/membership SQL/domain | Current active membership only | When affected | PASS |
| TM-010 | Tenant-owned repository/query/command scope | Company | Cross-tenant read/write leak | SQL scope/version/concurrency | Live authority revalidation | Future real modules add visible checks | PASS |
| TM-010A | Protected Company tenant-scope demonstration | Company, Worker | Client tenant/stale UI/dead control | Real route/database CRUD | Cross-tenant/copied-role denial | Accepted CRUD/no-refresh workflow | PASS |
| TM-010B | M1.04 final isolation/rollback closure | All roles/platform | Role/lifecycle/rollback gap | Final role/concurrency/migration suites | Non-enumerating denial | Owner closure accepted | PASS |
| TM-011 | Worker Profile persistence/concurrency | Worker | Lost update/wrong profile | Domain/repository/version | Worker ownership | Profile when changed | PASS |
| TM-012 | Identity-locked Profile correction path | Worker | Sensitive overwrite | Domain/service/repository | Worker correction boundary | Wording when changed | PASS |
| TM-013 | Responsive shell/Profile containment | Worker/shared UI | Overflow/clipped actions | CSS/source/width/zoom | NOT APPLICABLE | Responsive visual check | PASS |
| TM-014 | Shared design/accessibility contracts | All roles | Dead controls/focus/inconsistent states | Component/source/design | Portal isolation retained | Human usability judgment | PASS |
| TM-015 | Signed-out protected-route redirects | All roles | Protected render after logout | Real Next HTTP redirect smoke | Fixed-role targets | Representative route | PASS |
| TM-016 | Development server lifecycle | Engineering | Start/dirty config/orphan process | Startup/clean shutdown smoke | Demo/auth flags controlled | None | PASS |
| TM-017 | Database-backed application runtime | Worker/platform | Bundling/runtime adapter failure | PGlite application smoke | Accepted auth/data boundaries | None | PASS |
| TM-018 | Strict type checking and lint | Engineering | Unsafe/unreachable code | Project typecheck + ESLint | Security code included | None | PASS |
| TM-019 | Production build isolation | Engineering | Generated mutation/non-determinism | Next build-system + production build | Environment rules | None | PASS |
| TM-020 | Standalone preview bundle | Engineering/owner | Artifact cannot start | Bundle copy/start smoke | Test-only environment | Hosted visual preview NOT CONFIGURED | PASS |
| TM-021 | Release manifest and rollback candidate | Engineering | Untraceable release | Manifest/source/CI evidence | Immutable target ref | None | PASS |
| TM-022 | Production dependency security floor | Engineering | Known high-severity dependency | Secure dependency check + production audit | NOT APPLICABLE | None | PASS |
| TM-023 | Engineering docs/automation/context | Engineering/AI | Missing/weakened rules or stale context | `check:engineering` | Security/build-state consistency | None | PASS |
| TM-024 | Change-impact classification | Engineering/owner | Wrong manual scope | Handoff domain/git diff | Shared auth/tenant mapping | Generated steps only | PASS |
| TM-025 | Full-gate result/manual handoff | Engineering/owner | False readiness/hidden failure | Fail-closed gate/result | Security failure blocks readiness | Generated visible steps only | PASS |
| TM-025A | Immutable platform audit | Protected workflows | Missing/alterable history | Audit domain/repository/concurrency/migration | Trusted actor/role/tenant | None unless projection changes | PASS |
| TM-025B | Transactional outbox/background worker | Platform/providers | Lost/duplicate job/stale lease | Outbox runtime/concurrency/migration | Fixed handler/lease/reclaim/terminal | None | PASS |
| TM-025C | Persisted in-app notifications/deep links | Recipient roles | Wrong role/tenant navigation | Notification repository/route/migration | Exact recipient/current principal | Click when visible | PASS |
| TM-025D | Provider-neutral durable email delivery | Platform/recipients | Duplicate/lost retry/false delivery | Email runtime/platform | Outbox binding/terminal/no secrets | Live provider NOT CONFIGURED | PASS |
| TM-026 | Secure file domain/private storage foundation | Worker, Company, future reviewers | Cross-scope/path escape | Domain/repository/concurrency/migration | Opaque keys/owner-tenant SQL/traversal guards | No visible workflow | PASS |
| TM-026A | Isolated PDF/PNG/JPEG upload validation/quarantine | Worker, Company | Wrong file/MIME/signature/partial state | Upload source/unit/runtime/concurrency/migration | Owner/tenant/private quarantine/SHA-size | No product UI yet | PASS |
| TM-026B | Durable malware scan foundation | Platform/secure files | Unsafe availability/duplicate scan/deadlock | Scanner/runtime/handler/retry/reclaim/migration | Trusted lease/lock order/live scope | Live scanner NOT CONFIGURED | PASS |
| TM-026C | Authorized signed preview/download | Worker, Company | Copied token/wrong scope/public URL/unsafe header | Token/core/request/runtime/route/migration tests | Exact session/account/role/tenant; use-time lookup; size/hash | No browser-visible surface | PASS |
| TM-026D | Complete M1.06 cumulative isolation/migration/recovery acceptance | Worker, Company, Platform | Individually correct modules fail when composed/restarted/retried | Final cumulative M1.06 lifecycle/isolation/restart/migration suite | End-to-end owner/tenant/signed-link/storage authority | Only if genuine visible workflow changes | READY TO BUILD |
| TM-027 | Worker Identity Engine and permanent Worker ID | Worker, Verifier | Wrong identity/version/duplicate Worker/unsafe evidence | Future M1.07 | Required | Required when built | NOT CONFIGURED |
| TM-028 | Company registration/verification | Company, Verifier/Admin | Unverified tenant/wrong admin | Future M1.08 | Required | Required when built | NOT CONFIGURED |
| TM-029 | Sites/departments/team and Worker invitation records | Company | Cross-scope/history loss | Future M1.09–M1.10 | Required | Required when built | NOT CONFIGURED |
| TM-030 | Employment/experience/qualification/skill/leaving records | Worker, Company, Verifier | Wrong-record evidence/lost history | Future M1.11 | Required | Required when built | NOT CONFIGURED |
| TM-031 | Public verification foundation | Public/Worker/platform | Excess data/enumeration/abuse | Future M1.12 | Safe projection/rate limit/concern | Required when built | NOT CONFIGURED |
| TM-032 | Randomized MCQ/written assessment + durable answer recovery | Worker, Assessor | Repeated questions/lost answers/stuck test | Future M2 | Assigned case/user only | Required when built | BLOCKED |
| TM-033 | Evidence review/interview/decision/appeal | Worker, Assessor, Verifier | Wrong case/lost status/interruption | Future M2 | Required | Required when built | BLOCKED |
| TM-034 | Credentials/living record/share links | Worker, Company, public | Stale/revoked disclosure | Future M3 | Required | Required when built | BLOCKED |
| TM-035 | Payments/subscriptions/payout/webhooks | Company/platform | Duplicate/replay/wrong ledger | Future M3 | Signed callbacks/idempotency | Sandbox/live later | BLOCKED |
| TM-036 | Production providers/load/security/recovery launch | Platform | Sandbox leakage/outage/capacity/recovery | Future M3.10–M3.12 | Production secrets/fail closed | Release certification | BLOCKED |

## Accepted M1.06 Subunit 4 evidence

TM-026C is PASS only because exact implementation head `b370142658238b47d842366f1af343f72533d0b1` passed full gate `31354949426 / 93352838153`, merged as `d03ce5322c2ffa0214c90ee5dc19c15e22da9d51`, and merged-main full gate `31355234897 / 93353573069` passed. No browser-visible surface changed, so owner browser testing was not applicable.

## Current M1.06 cumulative acceptance requirements

TM-026D must prove the accepted secure-file domain, private storage, upload/quarantine, malware scan and signed-access modules together, including:

- complete accepted lifecycle from validated intake through final scan state and `available`-only signed access;
- exact account/role/Company tenant membership isolation across every stage;
- no preview/download for reserved/quarantined/scan-pending/unsafe/scan-failed state;
- independent extension/MIME/structure/size/SHA/malware checks;
- malicious/corrupt/truncated/trailing data, traversal/symlink, missing/tampered/wrong-provenance object denial;
- signed-link tamper/expiry/wrong-purpose/copied-scope/revoked-session/stale-membership denial;
- expected denial separated from database/private-storage operational failure;
- retry/interruption/lease reclaim/repeated execution/idempotency and durable audit behavior;
- PGlite/private-object close/reopen coherence;
- complete M1.06 migration apply/rollback/reapply with accepted history preservation;
- no bytes/base64/public URLs or client-selected trusted authority in relational/audit/handoff/release boundaries;
- exact-head full gate → exact merge → merged-main full gate → separate final M1.06 closure.

## Test quality rules

- No empty/always-true assertions, expected-value changes that bless a bug, hidden/skipped required tests or mocks of the exact behavior under test.
- Security is tested at trusted boundaries, not only through UI hiding.
- Serious confirmed defects receive stable permanent regression IDs.
- A flaky required test is a defect, not a pass.
- Production state/data/credentials are never used by automated tests.
