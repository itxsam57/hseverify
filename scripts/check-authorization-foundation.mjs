import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "src/lib/authorization/authorization-domain.ts",
  "database/migrations/0005_authorization_tenant_isolation.up.sql",
  "database/migrations/0005_authorization_tenant_isolation.down.sql",
  "scripts/run-authorization-tests.mjs",
  "tests/authorization/authorization-domain.test.mjs",
  "tests/platform/authorization-tenant-foundation.test.mjs",
  "tsconfig.authorization-tests.json"
];

const missing = requiredFiles.filter((path) => !existsSync(resolve(path)));
if (missing.length > 0) {
  console.error(`Missing M1.04 authorization foundation files:\n${missing.join("\n")}`);
  process.exit(1);
}

function source(path) {
  return readFileSync(resolve(path), "utf8");
}

function requireMarkers(path, markers) {
  const content = source(path);
  for (const marker of markers) {
    if (!content.includes(marker)) {
      console.error(`${path} is missing: ${marker}`);
      process.exit(1);
    }
  }
  return content;
}

const domain = requireMarkers(
  "src/lib/authorization/authorization-domain.ts",
  [
    "PLATFORM_PERMISSIONS",
    "TENANT_PERMISSIONS",
    "AuthorizationContext",
    "ROLE_PLATFORM_PERMISSION_GRANTS",
    "TENANT_ROLE_PERMISSION_GRANTS",
    "createTenantId",
    "createTenantMembershipId",
    "evaluatePlatformPermission",
    "evaluateTenantPermission",
    "canGrantTenantRole",
    "canSetTenantPermissionOverride",
    'from "../auth/auth-domain.js"'
  ]
);

if (/['"`]\*\.|\.\*['"`]/.test(domain)) {
  console.error("Authorization permissions must be explicit and wildcard-free.");
  process.exit(1);
}
if (!domain.includes('root: [') || !domain.includes('"platform.emergency.recover"')) {
  console.error("Root emergency permissions must remain explicit.");
  process.exit(1);
}
if (/root:[\s\S]*?platform\.tenants\.manage/.test(domain)) {
  console.error("Root must not receive routine tenant management by accidental grant.");
  process.exit(1);
}

const migration = requireMarkers(
  "database/migrations/0005_authorization_tenant_isolation.up.sql",
  [
    "platform_tenants",
    "auth_tenant_memberships",
    "auth_tenant_permission_overrides",
    "auth_tenant_membership_company_role_fk",
    "auth_current_tenant_membership_idx",
    "permission_key NOT LIKE '%*%'"
  ]
);

if (!/FOREIGN KEY \(account_id, portal_role\)[\s\S]*auth_account_roles/.test(migration)) {
  console.error("Tenant membership must be bound to an assigned Company portal role.");
  process.exit(1);
}
if (!/UNIQUE INDEX[\s\S]*tenant_id, account_id/.test(migration)) {
  console.error("Current tenant membership uniqueness boundary is missing.");
  process.exit(1);
}

requireMarkers(
  "database/migrations/0005_authorization_tenant_isolation.down.sql",
  [
    "DROP TABLE IF EXISTS auth_tenant_permission_overrides",
    "DROP TABLE IF EXISTS auth_tenant_memberships",
    "DROP TABLE IF EXISTS platform_tenants"
  ]
);

const packageDocument = JSON.parse(source("package.json"));
for (const script of [
  "check:authorization",
  "test:authorization",
  "test:authorization-platform"
]) {
  if (!packageDocument.scripts?.[script]) {
    console.error(`package.json is missing ${script}.`);
    process.exit(1);
  }
}
if (!packageDocument.scripts.check.includes("check:authorization")) {
  console.error("The complete check gate must include check:authorization.");
  process.exit(1);
}
if (!packageDocument.scripts.check.includes("test:authorization")) {
  console.error("The complete check gate must include authorization domain tests.");
  process.exit(1);
}
if (!packageDocument.scripts.check.includes("test:authorization-platform")) {
  console.error("The complete check gate must include authorization platform tests.");
  process.exit(1);
}

console.log(
  "Explicit permissions, opaque tenant identifiers, Company membership constraints, wildcard denial and M1.04 authorization test contracts passed."
);
