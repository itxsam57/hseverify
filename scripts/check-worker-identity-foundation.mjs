import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path) {
  const full = resolve(path);
  assert.equal(existsSync(full), true, `${path} must exist.`);
  return readFileSync(full, "utf8");
}

function mustContain(text, marker, message) {
  assert.equal(text.includes(marker), true, message ?? `Missing ${marker}`);
}

function mustMatch(text, pattern, message) {
  assert.match(text, pattern, message);
}

function mustNotContain(text, marker, message) {
  assert.equal(text.includes(marker), false, message ?? `Forbidden ${marker}`);
}

const packageDocument = JSON.parse(source("package.json"));
const domain = source("src/lib/identity/worker-identity-domain.ts");
const repository = source("src/lib/identity/worker-identity-repository.ts");
const service = source("src/lib/identity/worker-identity-service.ts");
const auditDomain = source("src/lib/audit/audit-domain.ts");
const migration = source("database/migrations/0015_worker_identity_foundation.up.sql");
const rollback = source("database/migrations/0015_worker_identity_foundation.down.sql");
const runner = source("scripts/run-worker-identity-tests.mjs");
const domainTests = source("tests/identity/worker-identity-domain.test.mjs");
const platformTests = source("tests/platform/worker-identity-foundation.test.mjs");
const migrationTests = source("tests/platform/worker-identity-migration-stack.test.mjs");
const authFoundationTests = source("tests/platform/authentication-foundation.test.mjs");
const regression = source("docs/engineering/M1_07_SUBUNIT1_REGRESSIONS.md");
const nextBuild = source("docs/NEXT_BUILD_UNIT.md");

assert.equal(
  packageDocument.scripts["check:worker-identity"],
  "node scripts/check-worker-identity-foundation.mjs"
);
assert.equal(
  packageDocument.scripts["test:worker-identity"],
  "node scripts/run-worker-identity-tests.mjs"
);
for (const aggregate of ["verify:quick", "check"]) {
  mustMatch(
    packageDocument.scripts[aggregate],
    /npm run check:worker-identity(?:\s|$)/,
    `${aggregate} must retain the Worker identity source guard.`
  );
}
for (const aggregate of ["test:integration", "check"]) {
  mustMatch(
    packageDocument.scripts[aggregate],
    /npm run test:worker-identity(?:\s|$)/,
    `${aggregate} must execute Worker identity runtime/migration tests.`
  );
}

for (const marker of [
  "WORKER_IDENTITY_STATUSES",
  'draft: ["submitted"]',
  'submitted: ["automated_checks", "withdrawn"]',
  'automated_checks: ["manual_review", "more_info", "rejected"]',
  'manual_review: ["verified", "more_info", "rejected", "escalated"]',
  'verified: ["correction_pending", "expired_document", "suspended"]',
  'suspended: ["verified", "reinstated", "closed"]',
  "assertWorkerSelfTransition",
  "assertWorkerIdentityPrincipal",
  "createWorkerIdentityId",
  "createWorkerIdentityVersionId",
  "normalizeWorkerIdentityLockVersion"
]) mustContain(domain, marker, `Worker identity domain must retain ${marker}.`);
for (const forbidden of [
  'escalated: ["manual_review"]',
  'expired_document: ["correction_pending"]',
  'reinstated: ["verified"]'
]) {
  mustNotContain(
    domain,
    forbidden,
    `Worker identity foundation must not invent an unfrozen transition: ${forbidden}`
  );
}

for (const marker of [
  "CREATE TABLE IF NOT EXISTS worker_identities",
  "CREATE TABLE IF NOT EXISTS worker_identity_versions",
  "worker_identity_transition_allowed",
  "worker_identity_validate_insert",
  "worker_identity_guard_update",
  "worker_identity_version_validate_insert",
  "worker_identity_version_guard_update",
  "worker_identity_reject_delete",
  "correction_pending",
  "Submitted Worker identity versions are immutable",
  "Worker identity correction lineage is invalid",
  "worker_identity.created",
  "worker_identity.status.changed",
  "worker_identity",
  "FROM auth_accounts AS accounts",
  "JOIN auth_account_roles AS roles",
  "accounts.account_status = 'active'"
]) mustContain(migration, marker, `Identity migration must retain ${marker}.`);
for (const forbidden of [
  "worker_profiles",
  "BYTEA",
  "base64",
  "object_key",
  "document_number",
  "REFERENCES auth_accounts"
]) {
  mustNotContain(
    migration,
    forbidden,
    `Identity foundation must avoid profile/payload/auth-schema coupling: ${forbidden}`
  );
}
mustNotContain(rollback, "DROP TABLE", "Worker identity rollback must preserve durable identity history.");
mustNotContain(rollback, "DELETE FROM", "Worker identity rollback must not delete identity/audit history.");
mustContain(rollback, "logical rollback", "Identity rollback must document its monotonic contract.");

for (const marker of [
  "WORKER_IDENTITY_LIVE_SESSION_GUARD_SQL",
  "sessions.active_role = 'worker'",
  "accounts.account_status = 'active'",
  "sessions.revoked_at IS NULL",
  "sessions.expires_at > CURRENT_TIMESTAMP",
  "FOR UPDATE OF sessions, accounts",
  "worker_account_id = $1",
  "ON CONFLICT (worker_account_id) DO NOTHING",
  "AUDIT_APPEND_SQL",
  "worker_identity.created",
  "worker_identity.status.changed",
  "lock_version = lock_version + 1",
  "assertWorkerSelfTransition"
]) mustContain(repository, marker, `Worker identity repository must retain ${marker}.`);
for (const forbidden of [
  "clientTenantId",
  "requestedTenantId",
  "reviewerId",
  "providerKey",
  "documentNumber",
  "objectKey",
  "rawBytes"
]) {
  mustNotContain(
    repository,
    forbidden,
    `Worker identity repository must not accept later/client authority: ${forbidden}`
  );
}

for (const marker of [
  "worker.self.manage",
  "assertWorkerIdentityManagePermission",
  "repository.ensureOwnDraft",
  "repository.submitOwn",
  "repository.withdrawOwn"
]) mustContain(service, marker, `Worker identity service must retain ${marker}.`);

for (const marker of [
  '"worker_identity.created"',
  '"worker_identity.status.changed"',
  '"worker_identity"'
]) mustContain(auditDomain, marker, `Platform audit vocabulary must retain ${marker}.`);

for (const marker of [
  "const ENTRY_FILES",
  'const LIB_ALIAS_PREFIX = "@/lib/"',
  "function resolveSourceImport",
  "function collectRuntimeSources",
  "ts.preProcessFile",
  "normalizeRelativeSourcePath",
  "Worker identity runtime dependency escaped src/lib",
  "Worker identity runtime dependency could not be resolved",
  "worker-identity-domain.test.mjs",
  "worker-identity-foundation.test.mjs",
  "worker-identity-migration-stack.test.mjs"
]) mustContain(runner, marker, `Worker identity runtime runner must retain ${marker}.`);
mustNotContain(runner, "const SOURCE_FILES", "Identity runner must derive the dependency closure rather than hand-maintain it.");

for (const marker of [
  "canonical Worker identity lifecycle permits only frozen transitions",
  "Worker self authority is narrower than the complete lifecycle graph",
  "active non-tenant Worker principals"
]) mustContain(domainTests, marker, `Identity domain regression must retain ${marker}.`);
for (const marker of [
  "idempotent, immutable and atomically audited",
  "never crosses accounts or roles",
  "optimistic concurrency admits one submit",
  "premature correction lineage"
]) mustContain(platformTests, marker, `Identity platform regression must retain ${marker}.`);
for (const marker of [
  "rollback is monotonic and deterministic",
  "survive PGlite close and reopen",
  "rollbackLatestMigration",
  "migrationStatus",
  "checksumMatches"
]) mustContain(migrationTests, marker, `Identity migration regression must retain ${marker}.`);

mustContain(
  authFoundationTests,
  "authentication migration remains independently reversible beneath later layers",
  "REG-073 requires the accepted M1.03 independent rollback regression to remain unchanged."
);
for (const marker of [
  "REG-073",
  "not foreign keys to a rollback-owned authentication schema",
  "tests/platform/authentication-foundation.test.mjs",
  "REFERENCES auth_accounts"
]) {
  mustContain(regression, marker, `M1.07 Subunit 1 regression record must retain ${marker}.`);
}

mustMatch(nextBuild, /M1\.06[\s\S]{0,200}\bDONE\b/i, "M1.06 must remain closed while M1.07 builds.");
mustMatch(nextBuild, /M1\.07[\s\S]{0,220}\bIN PROGRESS\b/i, "M1.07 must be the active brick.");
mustMatch(
  nextBuild,
  /Identity Domain, Versioned Persistence and State Machine[\s\S]{0,220}\bIN PROGRESS\b/i,
  "M1.07 Subunit 1 must be the only active internal unit."
);
mustMatch(nextBuild, /M1\.08[\s\S]{0,180}\bblocked\b/i, "M1.08 must remain blocked.");

console.log("Worker identity domain, persistence, authority, audit, auth-rollback compatibility, migration and regression guard passed.");
