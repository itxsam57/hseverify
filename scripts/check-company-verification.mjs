import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path) {
  return readFileSync(resolve(path), "utf8");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireMarker(source, marker, label) {
  if (!source.includes(marker)) fail(`${label} lost required M1.08 contract: ${marker}`);
}

function forbidMarker(source, marker, label) {
  if (source.includes(marker)) fail(`${label} contains forbidden M1.08 authority/scope: ${marker}`);
}

const required = [
  "database/migrations/0022_company_registration_verification.up.sql",
  "database/migrations/0022_company_registration_verification.down.sql",
  "database/migrations/0023_company_registration_duplicate_claims.up.sql",
  "database/migrations/0023_company_registration_duplicate_claims.down.sql",
  "database/migrations/0024_company_verification_transition_guards.up.sql",
  "database/migrations/0024_company_verification_transition_guards.down.sql",
  "database/migrations/0025_company_verification_authority_integration.up.sql",
  "database/migrations/0025_company_verification_authority_integration.down.sql",
  "src/lib/company/company-verification-domain.ts",
  "src/lib/company/company-verification-repository.ts",
  "src/lib/company/company-verification-service.ts",
  "src/lib/company/company-verification-secure-file-authority-repository.ts",
  "src/lib/company/company-registration-repository.ts",
  "src/lib/company/company-registration-service.ts",
  "src/lib/company/company-application-secure-file-service.ts",
  "src/app/company/register/page.tsx",
  "src/app/company/register/verify/page.tsx",
  "src/app/company/(portal)/settings/profile/page.tsx",
  "src/app/company/(portal)/settings/profile/actions.ts",
  "src/components/company/company-verification-workspace.tsx"
];
for (const path of required) {
  if (!existsSync(resolve(path))) fail(`M1.08 implementation is missing ${path}`);
}

const migration = read("database/migrations/0022_company_registration_verification.up.sql");
const claimsMigration = read("database/migrations/0023_company_registration_duplicate_claims.up.sql");
const transitionMigration = read("database/migrations/0024_company_verification_transition_guards.up.sql");
const integrationMigration = read("database/migrations/0025_company_verification_authority_integration.up.sql");
const integrationRollback = read("database/migrations/0025_company_verification_authority_integration.down.sql");
for (const marker of [
  "company_registration_flows",
  "company_verification_cases",
  "company_verification_versions",
  "company_verification_evidence",
  "company_verification_duplicate_signals",
  "company_verification_version_history_guard",
  "company_verification_evidence_history_guard"
]) requireMarker(migration, marker, "M1.08 migration 0022");
for (const marker of [
  "company_registration_flow_case_fk",
  "registration_fingerprint",
  "legal_name_fingerprint",
  "company_verification_registration_claim_idx"
]) requireMarker(claimsMigration, marker, "M1.08 migration 0023");
for (const marker of [
  "company_verification_case_transition_allowed",
  "company_verification_version_transition_allowed"
]) requireMarker(transitionMigration, marker, "M1.08 migration 0024");
for (const marker of [
  "company_verification_secure_file_authorities",
  "company_verification_secure_file_authority_validate_insert",
  "company_verification_secure_file_authority_reject_mutation",
  "authority.reservation_key = NEW.reservation_key",
  "authority.owner_account_id = NEW.owner_account_id",
  "authority.tenant_id = NEW.tenant_id",
  "authority.membership_id = NEW.membership_id",
  "cases.case_status = 'draft'",
  "versions.version_status = 'draft'",
  "memberships.membership_role IN ('owner', 'admin')",
  "tenants.tenant_status IN ('pending', 'active')",
  "tenants.tenant_status = 'active'",
  "company_verification.updated",
  "company_verification.evidence.bound",
  "company_verification.submitted",
  "company_verification.withdrawn",
  "company_verification.status.changed",
  "'company_verification'"
]) requireMarker(integrationMigration, marker, "M1.08 migration 0025");
for (const marker of [
  "Company secure file ownership requires the active trusted tenant membership.",
  "DROP TABLE IF EXISTS company_verification_secure_file_authorities",
  "worker_identity.worker_id.issued"
]) requireMarker(integrationRollback, marker, "M1.08 migration 0025 rollback");
forbidMarker(integrationMigration, "ADD COLUMN IF NOT EXISTS authority_mode", "M1.08 migration 0025");
forbidMarker(integrationMigration, "platform_secure_file_authority_mode_check", "M1.08 migration 0025");

const secureDomain = read("src/lib/secure-files/secure-file-domain.ts");
for (const marker of [
  'authorityMode: "active_tenant"',
  'authorityMode: "company_application"',
  "bindTrustedCompanyApplicationSecureFileOwner",
  "TRUSTED_SECURE_FILE_AUTHORITY_MODES",
  'Object.defineProperty(owner, "authorityMode"',
  "enumerable: false"
]) requireMarker(secureDomain, marker, "Secure-file authority domain");
requireMarker(secureDomain, 'membership.tenantStatus !== "active"', "Generic Company secure-file authority");
requireMarker(secureDomain, 'membership.tenantStatus !== "pending" && membership.tenantStatus !== "active"', "Company application secure-file authority");
requireMarker(secureDomain, 'membership.role !== "owner" && membership.role !== "admin"', "Company application secure-file authority");

const secureRepository = read("src/lib/secure-files/secure-file-repository.ts");
const uploadRepository = read("src/lib/secure-files/secure-file-upload-repository.ts");
const scanRepository = read("src/lib/secure-files/secure-file-scan-repository.ts");
for (const [label, source] of [
  ["Secure-file repository", secureRepository],
  ["Secure-upload repository", uploadRepository],
  ["Secure-scan repository", scanRepository]
]) {
  requireMarker(source, "tenant_status = 'active'", label);
  requireMarker(source, "tenant_status IN ('pending', 'active')", label);
  forbidMarker(source, "authority_mode", `${label} must remain compatible with the accepted M1.06 table`);
}
requireMarker(secureRepository, "authorityMode: owner.authorityMode", "Secure-file repository branded authority flow");
requireMarker(secureRepository, 'input.authorityMode === "company_application"', "Secure-file repository Company application authority branch");
requireMarker(uploadRepository, 'owner.authorityMode === "company_application"', "Secure-upload repository Company application authority branch");
requireMarker(scanRepository, 'owner.authorityMode === "company_application"', "Secure-scan repository Company application authority branch");
requireMarker(scanRepository, "scheduleForCompanyApplication", "Secure-scan repository");
requireMarker(scanRepository, "enqueueInTransaction(transaction, actor", "Secure-scan repository");

const authorityRepository = read("src/lib/company/company-verification-secure-file-authority-repository.ts");
for (const marker of [
  "COMPANY_VERIFICATION_SECURE_FILE_AUTHORITY_INSERT_SQL",
  "COMPANY_VERIFICATION_SECURE_FILE_AUTHORITY_FIND_SQL",
  'getTrustedSecureFileAuthorityMode(owner) !== "company_application"',
  "intent.reservationKey",
  "cases.current_version_id",
  "cases.case_status = 'draft'",
  "versions.version_status = 'draft'",
  "DatabaseSecureFileRepository(Promise.resolve(transaction))",
  "return files.reserve(owner, intent)"
]) requireMarker(authorityRepository, marker, "Company verification secure-file authority repository");
for (const forbidden of [
  "clientCaseId",
  "clientVersionId",
  "caseId:",
  "versionId:"
]) forbidMarker(authorityRepository, forbidden, "Company verification secure-file authority repository");

const applicationFileService = read("src/lib/company/company-application-secure-file-service.ts");
for (const marker of [
  "CompanyVerificationSecureFileAuthorityRepository",
  "private readonly authorities",
  "return this.authorities.reserve(owner, intent)"
]) requireMarker(applicationFileService, marker, "Company application secure-file service");
forbidMarker(applicationFileService, "return this.files.reserve(owner, intent)", "Company application secure-file service");

const registrationRepository = read("src/lib/company/company-registration-repository.ts");
for (const marker of [
  "'company', 'owner', 'invited'",
  "WITH activated_membership AS",
  "membership_status = 'active'",
  "activated_at = $2",
  "memberships.membership_status = 'invited'",
  "flows.current_step = 'pending_mfa'",
  "SET current_step = 'complete'"
]) requireMarker(registrationRepository, marker, "Company registration membership lifecycle");
forbidMarker(
  registrationRepository,
  "'company', 'owner', 'active', $4, $4",
  "Company registration must not grant owner membership before MFA"
);

const verificationRepository = read("src/lib/company/company-verification-repository.ts");
for (const marker of [
  "COMPANY_VERIFICATION_MANAGER_GUARD_SQL",
  "COMPANY_VERIFICATION_DECIDER_GUARD_SQL",
  "FOR UPDATE",
  "draft_revision = draft_revision + 1",
  "company_verification_registration_claim_idx",
  "lifecycle_status = 'available'",
  "case_status = 'submitted'",
  "case_status = 'under_review'",
  "tenant_status = 'active'",
  "startCorrection",
  "version_number"
]) requireMarker(verificationRepository, marker, "Company verification repository");
for (const forbidden of [
  "clientTenantId",
  "reviewerId:",
  "verifierId:",
  "providerId:",
  "storageRoot:",
  "objectKey: input"
]) forbidMarker(verificationRepository, forbidden, "Company verification repository");

const registrationService = read("src/lib/company/company-registration-service.ts");
for (const marker of [
  "verifyTotp",
  "lastAcceptedCounter: factor.lastAcceptedCounter",
  "registrationFingerprint: companyRegistrationFingerprint",
  "createTotpSecret",
  "pending_email"
]) requireMarker(registrationService, marker, "Company registration service");
forbidMarker(registrationService, "verifyTotpCode", "Company registration service");

const sandbox = read("src/lib/auth/auth-sandbox-service.ts");
requireMarker(sandbox, "company-registration-email-destination", "Shared authentication sandbox");

const tests = read("tests/platform/company-verification.test.mjs");
for (const marker of [
  'const OWNED_MIGRATION = "0025_company_verification_authority_integration"',
  "CompanyVerificationSecureFileAuthorityRepository",
  "files.reserve(owner, unclaimedIntent)",
  "company_verification_secure_file_authorities",
  "immutable"
]) requireMarker(tests, marker, "M1.08 platform regressions");

const actions = read("src/app/company/(portal)/settings/profile/actions.ts");
const workspace = read("src/components/company/company-verification-workspace.tsx");
const registrationForms = read("src/app/company/register/company-registration-forms.tsx");
for (const [label, source] of [
  ["Company verification actions", actions],
  ["Company verification workspace", workspace],
  ["Company registration forms", registrationForms]
]) {
  if (/\bencType=/.test(source)) {
    fail(`${label} must not reintroduce explicit Server Action form encoding metadata.`);
  }
}
for (const marker of [
  "uploadCompanyVerificationEvidenceAction",
  "submitCompanyVerificationAction",
  "withdrawCompanyVerificationAction",
  "startCompanyVerificationCorrectionAction"
]) requireMarker(actions, marker, "Company verification actions");
for (const marker of [
  "Verified business email",
  "Company registration evidence",
  "Submit Company verification",
  "Withdraw before review",
  "Create correction version"
]) requireMarker(workspace, marker, "Company verification workspace");

const forbiddenM109 = [
  "src/app/company/(portal)/sites",
  "src/app/company/(portal)/departments",
  "src/app/company/(portal)/team",
  "src/lib/company/company-site-domain.ts",
  "src/lib/company/company-department-domain.ts",
  "src/lib/company/company-team-domain.ts"
];
for (const path of forbiddenM109) {
  if (existsSync(resolve(path))) fail(`M1.09 work leaked into M1.08: ${path}`);
}

console.log(
  "M1.08 Company registration/verification source, pending-authority isolation, MFA-bound owner activation, atomic additive secure-file authority, immutable version/evidence, audit vocabulary, duplicate-claim and no-M1.09 guards passed."
);
