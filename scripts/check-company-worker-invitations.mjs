import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) {
  console.error(message);
  process.exit(1);
}
function read(path) {
  if (!existsSync(resolve(path))) fail(`M1.10 required production surface is missing: ${path}`);
  return readFileSync(resolve(path), "utf8");
}
function requireMarker(text, marker, label) {
  if (!text.includes(marker)) fail(`${label} is missing M1.10 contract evidence: ${marker}`);
}
function requirePattern(text, pattern, label, fact) {
  if (!pattern.test(text)) fail(`${label} is missing M1.10 contract evidence: ${fact}`);
}
function forbidPattern(text, pattern, label, fact) {
  if (pattern.test(text)) fail(`${label} contains forbidden M1.10 evidence: ${fact}`);
}

const paths = Object.freeze({
  up: "database/migrations/0028_company_worker_invitations_codes.up.sql",
  down: "database/migrations/0028_company_worker_invitations_codes.down.sql",
  domain: "src/lib/company/company-workforce-domain.ts",
  service: "src/lib/company/company-workforce-service.ts",
  actions: "src/app/company/(portal)/invitations/actions.ts",
  page: "src/app/company/(portal)/invitations/page.tsx",
  workspace: "src/components/company/company-workforce-invitations-workspace.tsx",
  runner: "scripts/run-company-worker-invitation-tests.mjs",
  runtimeTest: "tests/platform/company-worker-invitations.test.mjs",
  migrationTest: "tests/platform/company-worker-invitations-migration-stack.test.mjs"
});

const up = read(paths.up);
const down = read(paths.down);
const domain = read(paths.domain);
const service = read(paths.service);
const actions = read(paths.actions);
const page = read(paths.page);
const workspace = read(paths.workspace);
read(paths.runner);
read(paths.runtimeTest);
read(paths.migrationTest);

for (const marker of [
  "company_worker_invitations",
  "company_registration_codes",
  "company_worker_links",
  "token_hash",
  "code_hash",
  "usage_limit",
  "usage_count",
  "payment_responsibility",
  "site_id",
  "department_id",
  "worker_identity_worker_ids",
  "platform_audit_events"
]) requireMarker(up, marker, paths.up);
for (const marker of [
  "DROP TABLE IF EXISTS company_worker_links",
  "DROP TABLE IF EXISTS company_registration_codes",
  "DROP TABLE IF EXISTS company_worker_invitations"
]) requireMarker(down, marker, paths.down);

requirePattern(up, /CHECK\s*\([^)]*usage_count\s*<=\s*usage_limit/i, paths.up, "usage count cannot exceed code usage limit");
requirePattern(up, /payment_responsibility[\s\S]{0,220}(?:company|worker)/i, paths.up, "bounded company/worker payment responsibility");
forbidPattern(up, /\b(?:raw_)?(?:invitation_)?token\s+(?:TEXT|VARCHAR|CHAR)/i, paths.up, "raw invitation token persistence");
forbidPattern(up, /\b(?:raw_)?(?:registration_)?code\s+(?:TEXT|VARCHAR|CHAR)/i, paths.up, "raw Company code persistence");

for (const marker of [
  "company.workforce.manage",
  "runTenantScopedCommand",
  "hashOpaqueValue",
  "createOpaqueToken",
  "company_verification_cases",
  "worker_identity_worker_ids",
  "company_worker_invitations",
  "company_registration_codes",
  "company_worker_links"
]) requireMarker(service, marker, paths.service);
for (const marker of ["company", "worker", "pending", "revoked", "accepted"])
  requireMarker(domain, marker, paths.domain);

forbidPattern(actions, /\b(?:tenantId|actorAccountId|membershipId|authorizedTenantPermission|companyVerified)\s*:/, paths.actions, "browser-provided authorization context");
requireMarker(actions, "requireCurrentTenantPermission", paths.actions);
requireMarker(actions, "company.workforce.manage", paths.actions);
requireMarker(page, "Company", paths.page);
requirePattern(`${page}\n${workspace}`, /invitation/i, "M1.10 Company invitation UI", "invitation workflow");
requirePattern(workspace, /(?:CSV|bulk)/i, paths.workspace, "bulk CSV workflow");
requirePattern(workspace, /(?:registration code|company code)/i, paths.workspace, "Company registration code workflow");
forbidPattern(`${actions}\n${page}\n${workspace}`, /paste\s+(?:the\s+)?(?:invitation\s+)?token/i, "M1.10 invitation UX", "manual opaque invitation-token paste workflow");

console.log("M1.10 Worker invitation/Company-code architecture, secret, authorization and UI source contract passed.");
