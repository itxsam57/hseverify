# Current-Head Audit Cleanup Classification

## Scope and evidence

This record closes the cleanup-classification portion of the independent current-head consumer audit. It is deliberately **non-destructive**: no production file, export, route boundary, migration, or working feature is removed by this classification.

Audited/accepted main head: `b56f71a8d56b729d18d66bb60b61cfe4a4843328`.

Post-merge evidence:

- Engineering verification run `33477054052`: **GREEN**.
  - Artifact `9788747479`
  - Digest `sha256:5225fc96223a7211d0f201827dfe5aebc8bb0c1d94e53b8ef8cc66bcf687350b`
- Independent full-system audit run `33477054097`: **GREEN**.
  - Final artifact `9788841678`
  - Digest `sha256:8f4f5446c30bf8cd231629dc730b69552821f9bd9f89e34b6295b4b9bbef4b75`
  - Final enforcement: `NO_BLOCKING_DEFECTS_FOUND`, critical `0`, high `0`.
- Corrected static scan basis: 747 audited files, 352 production source files, 179 test files, 122 script files, 66 page routes, and 42 paired migrations.
- Corrected static scan counts: critical `0`, high `0`, medium `4`, low `28`, info `43`.
- The corrected dead-export scan searches the full audited repository text, including source, tests, scripts and `package.json`; the 42 entries below therefore have no second textual reference in the audited repository.

## Classification vocabulary

- **Contract / future boundary** — a stable domain constant/type, authorization facade, repository/service facade, protocol/schema marker, or factory boundary. It has no current textual caller but has architectural meaning; deleting it during an audit would create avoidable API churn.
- **Exported, currently unreferenced** — meaningful compatibility/convenience helper with no current caller and no framework auto-registration. It may be removable later, but only in a dedicated cleanup change with focused regression proof.
- **Proven unused candidate** — ordinary component/type/helper with no textual caller, no framework naming convention, and no current contract role found. This is the strongest cleanup candidate class, but this audit still does not delete it.
- **Framework/runtime boundary** — a file can be live even with no import because the framework discovers it by path/name. This classification applies to the duplicated Next.js route files discussed after the export table, not to the 42 export candidates themselves.

## 42 corrected dead-export candidates

| File | Export(s) | Classification | Audit conclusion |
|---|---|---|---|
| `src/app/worker/login/login-form.tsx` | `WorkerLoginForm` | **Proven unused candidate** | Ordinary client component; `login-form.tsx` is not a Next.js route convention, and no route/test/script imports it. Current Worker login is browser-proven without this export. Retain for now; candidate for a dedicated cleanup PR only. |
| `src/components/ui/surface.tsx` | `Card` | **Proven unused candidate** | Ordinary UI helper with no import or framework discovery role. Retain now; safe cleanup candidate after focused UI regression proof. |
| `src/components/ui/surface.tsx` | `PageHeading` | **Proven unused candidate** | Ordinary UI helper with no import or framework discovery role. Retain now; safe cleanup candidate after focused UI regression proof. |
| `src/lib/assessment-attempt/assessment-attempt-domain.ts` | `AssessmentAnswerInput` | **Proven unused candidate** | Type alias only. M2.07 accepts `unknown` at the trust boundary and normalizes by question type; no code consumes this alias. Retain until M2.08 design settles the draft-input contract. |
| `src/lib/assessment-generation/assessment-form-delivery-service.ts` | `getAssessmentFormDeliveryService` | **Contract / future boundary** | Default-database factory for the live `AssessmentFormDeliveryService`; constructor-based use remains available for transactions/tests. Keep the factory boundary. |
| `src/lib/assessment-generation/assessment-form-generation-service.ts` | `getAssessmentFormGenerationService` | **Contract / future boundary** | Default-database factory for the live generator. M2.07 currently injects the service into an existing transaction; the factory remains a valid top-level boundary. |
| `src/lib/assurance/assurance-action-centre-service.ts` | `ASSURANCE_ACTION_CENTRE_FIELDS` | **Contract / future boundary** | Source comment explicitly defines this as the stable Action Centre projection vocabulary. It is architectural documentation/contract, not executable dead behavior. |
| `src/lib/audit/audit-service.ts` | `recordPlatformAuditEvent` | **Contract / future boundary** | Authorization-aware audit service facade over the live repository. Current code may call repository objects directly, but this wrapper is a coherent public server boundary. |
| `src/lib/audit/audit-service.ts` | `listAuthorizedPlatformAuditEvents` | **Contract / future boundary** | Platform-security read facade that centralizes role/permission enforcement. Keep. |
| `src/lib/audit/audit-service.ts` | `findAuthorizedPlatformAuditEvent` | **Contract / future boundary** | Platform-security lookup facade that centralizes role/permission enforcement. Keep. |
| `src/lib/audit/audit-service.ts` | `listCurrentTenantAuditEvents` | **Contract / future boundary** | Tenant audit read facade bound to `company.audit.read`. Keep. |
| `src/lib/audit/audit-service.ts` | `findCurrentTenantAuditEvent` | **Contract / future boundary** | Tenant audit lookup facade bound to `company.audit.read`. Keep. |
| `src/lib/auth/auth-session-service.ts` | `authenticatedLoginPath` | **Exported, currently unreferenced** | Symmetric role-path helper beside the used session/path API; ordinary code, not framework-discovered. Candidate for later export-surface cleanup, not deletion during this audit. |
| `src/lib/auth/staff-enrollment-cookie.ts` | `writeStaffEnrollmentToken` | **Exported, currently unreferenced** | Direct cookie-store writer; the response-specific sibling remains part of the same cookie contract. Keep until staff-enrollment call sites are deliberately simplified. |
| `src/lib/auth/worker-session.ts` | `readWorkerSession` | **Exported, currently unreferenced** | Compatibility convenience over the centralized session/authorization services. `requireWorkerSession` in the same boundary remains live. Defer cleanup. |
| `src/lib/auth/worker-session.ts` | `deleteWorkerSession` | **Exported, currently unreferenced** | Compatibility convenience over centralized logout/session revocation. Defer cleanup. |
| `src/lib/auth/worker-session.ts` | `redirectToWorkerLogin` | **Exported, currently unreferenced** | Compatibility redirect helper. Central authorization now owns most access redirects; remove only in a focused auth cleanup. |
| `src/lib/auth/worker-session.ts` | `secureStringEqual` | **Proven unused candidate** | Standalone timing-safe string comparison helper with no caller found anywhere in source/tests/scripts. Retain now; strongest auth-helper cleanup candidate. |
| `src/lib/authorization/tenant-scope-fixture-service.ts` | `listTenantScopeFixtures` | **Contract / future boundary** | Tenant-scoped service facade using the central permission resolver; complements the live demonstration/create/update/delete boundary. Keep. |
| `src/lib/authorization/tenant-scope-fixture-service.ts` | `findTenantScopeFixture` | **Contract / future boundary** | Tenant-scoped lookup facade using the same central permission boundary. Keep. |
| `src/lib/company/company-workforce-domain.ts` | `BulkInviteWorkerRow` | **Proven unused candidate** | Type alias only; current bulk service accepts `InviteWorkerInput[]` and produces `BulkInviteWorkerResult[]`. No contract consumer found. Retain now; type-only cleanup candidate. |
| `src/lib/company/company-workforce-service.ts` | `COMPANY_WORKFORCE_SQL_AUTHORITY` | **Contract / future boundary** | Explicit map documenting authoritative tables for verification, permanent Worker ID, invitations, codes and links. Keep as a cross-brick authority contract. |
| `src/lib/email-delivery/email-delivery-service.ts` | `queueFoundationEmailDelivery` | **Contract / future boundary** | Development/test-only delivery fixture facade with explicit production prohibition; useful integration boundary even without a current route caller. Keep. |
| `src/lib/email-delivery/email-delivery-service.ts` | `listEmailDeliveriesForPrincipal` | **Contract / future boundary** | Principal-scoped delivery read facade over the live repository. Keep. |
| `src/lib/email-delivery/email-delivery-service.ts` | `findEmailDeliveryForPrincipal` | **Contract / future boundary** | Principal-scoped delivery lookup facade. Keep. |
| `src/lib/email-delivery/email-delivery-service.ts` | `listEmailDeliveryAttemptsForPrincipal` | **Contract / future boundary** | Principal-scoped delivery-attempt history facade. Keep. |
| `src/lib/notifications/notification-service.ts` | `listNotificationsForRole` | **Contract / future boundary** | Generic role-scoped notification query facade; current UI uses the specialized menu/center projections. Keep the generic service boundary. |
| `src/lib/outbox/outbox-service.ts` | `listAuthorizedPlatformOutboxJobs` | **Contract / future boundary** | Platform-security outbox read facade with central permission enforcement. Keep. |
| `src/lib/outbox/outbox-service.ts` | `findAuthorizedPlatformOutboxJob` | **Contract / future boundary** | Platform-security outbox lookup facade. Keep. |
| `src/lib/outbox/outbox-service.ts` | `listAuthorizedPlatformOutboxAttempts` | **Contract / future boundary** | Platform-security outbox attempt-history facade. Keep. |
| `src/lib/outbox/outbox-service.ts` | `listCurrentTenantOutboxJobs` | **Contract / future boundary** | Tenant audit/outbox read facade bound to `company.audit.read`. Keep. |
| `src/lib/outbox/outbox-service.ts` | `findCurrentTenantOutboxJob` | **Contract / future boundary** | Tenant outbox lookup facade. Keep. |
| `src/lib/outbox/outbox-service.ts` | `listCurrentTenantOutboxAttempts` | **Contract / future boundary** | Tenant outbox attempt-history facade. Keep. |
| `src/lib/policy/effective-policy-domain.ts` | `POLICY_PLATFORM_PERMISSION` | **Contract / future boundary** | Domain-level platform permission identifier. Keep alongside the active tenant permission contract to avoid permission vocabulary drift. |
| `src/lib/policy/effective-policy-domain.ts` | `PolicyAdminPrincipal` | **Contract / future boundary** | Domain principal type alias for platform policy operations. Keep until policy service/API cleanup is intentionally designed. |
| `src/lib/policy/effective-policy-domain.ts` | `PolicyTenantPrincipal` | **Contract / future boundary** | Domain principal type alias tied to the tenant policy permission. Keep. |
| `src/lib/question-bank/question-delivery-service.ts` | `getQuestionDeliveryService` | **Contract / future boundary** | Default-database factory for the live safe-question delivery service. Keep. |
| `src/lib/review/evidence-review-domain.ts` | `EVIDENCE_REVIEW_READ_PERMISSION` | **Contract / future boundary** | Domain permission constant representing verifier read authority. Keep as permission vocabulary even while current services resolve through other symbols. |
| `src/lib/review/evidence-review-domain.ts` | `EVIDENCE_REVIEW_DECIDE_PERMISSION` | **Contract / future boundary** | Domain permission constant representing verifier decision authority. Keep. |
| `src/lib/secure-files/secure-file-scan-domain.ts` | `SECURE_FILE_SCAN_SCHEMA_VERSION` | **Contract / future boundary** | Protocol/schema-version constant for scan payload evolution. Keep. |
| `src/lib/secure-files/secure-file-scan-domain.ts` | `SecureFileScanFinalStatus` | **Contract / future boundary** | Domain type derived from the canonical final-status list. Keep as a stable scan contract. |
| `src/lib/secure-files/secure-file-scan-domain.ts` | `secureFileHasScannableProvenance` | **Contract / future boundary** | Central provenance predicate encoding the minimum metadata required for safe scanning. Keep until secure-file integration cleanup explicitly proves replacement/removal. |

### Candidate totals

- Proven unused candidate: **6**
- Exported, currently unreferenced: **5**
- Contract / future boundary: **31**
- Deleted by this audit: **0**

## Other corrected static findings

### Framework duplicate files — retain

The scanner found byte-identical notification `error.tsx` files and byte-identical notification `loading.tsx` files across the six role portals. These are **Next.js App Router route-segment convention files**. Their path/name gives them runtime meaning without an import. Do not delete them as dead duplicates. A later UI refactor may share their inner component while preserving the route files.

### “Temporary/demo” vocabulary hits — not temporary implementation

Fifteen low findings came from the scanner matching the literal word `placeholder` in normal form/input placeholder attributes or the user-facing phrase `Temporary problem` in framework error boundaries. These are copy/markup vocabulary hits, not temporary production behavior. No deletion or product fix is required.

### Synthetic timing credential — intentional

`DUMMY_PASSWORD = "HSE-Verify-Timing-Only-9!Password"` in `auth-login-service.ts` is explicitly synthetic timing-equalization material, not a production credential. The independent audit and authentication regression gates remain green. Retain while the login timing-equalization path exists; never replace it with a real credential.

### Complexity findings — refactor risk, not defects

Four production files exceeded the scanner's higher complexity threshold and eleven more exceeded the lower threshold. These are maintainability signals only. Splitting them during an unrelated audit closure would increase regression risk. Apply responsibility-splitting only when the relevant subsystem is next modified, under focused tests plus the permanent independent gate.

## Closure decision

1. The corrected independent audit found no blocking consumer/product defect on `b56f71a8d56b729d18d66bb60b61cfe4a4843328`.
2. No application code change is justified solely to reduce informational scanner counts.
3. No dead-code deletion is authorized by this audit closure.
4. The six strongest cleanup candidates are recorded for a future dedicated cleanup cycle, not mixed into M2.08.
5. The verified baseline is now permanently guarded on pull requests and `main` by the Independent full-system audit plus the Engineering verification gate.
6. The next product action is the already-governed **M2.08 design approval** for Answer Persistence and Interruption Recovery; implementation must not start before owner approval.
