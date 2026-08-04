import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import {
  applyPendingMigrations,
  migrationStatus,
  rollbackLatestMigration
} from "../../scripts/lib/migrations.mjs";

const TEST_ENVIRONMENT = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "authorization-tenant-foundation-test",
  sessionSecret:
    "authorization-tenant-session-secret-with-at-least-thirty-two-characters",
  authPepper:
    "authorization-tenant-auth-pepper-with-at-least-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function openMigratedDatabase() {
  const database = await openScriptDatabase(TEST_ENVIRONMENT);
  await applyPendingMigrations(database, TEST_ENVIRONMENT.releaseSha);
  return database;
}

async function insertActiveAccount(database, input) {
  await database.query(
    `INSERT INTO auth_accounts (
       account_id, email_normalized, display_name, account_status,
       password_hash, email_verified_at, password_set_at,
       created_at, updated_at
     ) VALUES ($1, $2, $3, 'active', $4, $5, $5, $5, $5)`,
    [
      input.accountId,
      input.email,
      input.displayName,
      "scrypt$16384$8$1$salt$hash",
      input.now
    ]
  );
  await database.query(
    `INSERT INTO auth_account_roles (account_id, role, created_at)
     VALUES ($1, $2, $3)`,
    [input.accountId, input.role, input.now]
  );
}

test("authorization migration creates tenant and membership security boundaries", async () => {
  const database = await openMigratedDatabase();
  try {
    const tables = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN (
           'platform_tenants',
           'auth_tenant_memberships',
           'auth_tenant_permission_overrides'
         )
       ORDER BY table_name`
    );
    assert.deepEqual(
      tables.rows.map((row) => row.table_name),
      [
        "auth_tenant_memberships",
        "auth_tenant_permission_overrides",
        "platform_tenants"
      ]
    );

    const status = await migrationStatus(database);
    assert.deepEqual(
      status.map((entry) => [entry.id, entry.applied, entry.checksumMatches]),
      [
        ["0001_platform_foundation", true, true],
        ["0002_authentication_foundation", true, true],
        ["0003_worker_registration_otp", true, true],
        ["0004_authentication_completion", true, true],
        ["0005_authorization_tenant_isolation", true, true]
      ]
    );
  } finally {
    await database.close();
  }
});

test("only assigned Company accounts can hold current tenant membership", async () => {
  const database = await openMigratedDatabase();
  try {
    const now = new Date("2026-08-04T12:00:00.000Z").toISOString();
    await insertActiveAccount(database, {
      accountId: "acct_company_member",
      email: "company-member@example.com",
      displayName: "Company Member",
      role: "company",
      now
    });
    await insertActiveAccount(database, {
      accountId: "acct_worker_member",
      email: "worker-member@example.com",
      displayName: "Worker Member",
      role: "worker",
      now
    });

    await database.query(
      `INSERT INTO platform_tenants (
         tenant_id, tenant_type, display_name, tenant_status,
         created_by_account_id, created_at, updated_at, activated_at
       ) VALUES ($1, 'company', $2, 'active', $3, $4, $4, $4)`,
      [
        "tenant_company_alpha",
        "Company Alpha",
        "acct_company_member",
        now
      ]
    );

    await assert.rejects(
      database.query(
        `INSERT INTO auth_tenant_memberships (
           membership_id, tenant_id, account_id, portal_role,
           membership_role, membership_status, created_at, updated_at, activated_at
         ) VALUES ($1, $2, $3, 'company', 'viewer', 'active', $4, $4, $4)`,
        [
          "membership_worker_invalid",
          "tenant_company_alpha",
          "acct_worker_member",
          now
        ]
      ),
      /auth_tenant_membership_company_role_fk|foreign key|violates/i
    );

    await database.query(
      `INSERT INTO auth_tenant_memberships (
         membership_id, tenant_id, account_id, portal_role,
         membership_role, membership_status, created_at, updated_at, activated_at
       ) VALUES ($1, $2, $3, 'company', 'owner', 'active', $4, $4, $4)`,
      [
        "membership_company_owner",
        "tenant_company_alpha",
        "acct_company_member",
        now
      ]
    );

    await assert.rejects(
      database.query(
        `INSERT INTO auth_tenant_memberships (
           membership_id, tenant_id, account_id, portal_role,
           membership_role, membership_status, created_at, updated_at, activated_at
         ) VALUES ($1, $2, $3, 'company', 'viewer', 'active', $4, $4, $4)`,
        [
          "membership_company_duplicate",
          "tenant_company_alpha",
          "acct_company_member",
          now
        ]
      ),
      /auth_current_tenant_membership_idx|unique|duplicate/i
    );
  } finally {
    await database.close();
  }
});

test("tenant and membership lifecycle constraints reject contradictory state", async () => {
  const database = await openMigratedDatabase();
  try {
    const now = new Date("2026-08-04T12:00:00.000Z").toISOString();
    await insertActiveAccount(database, {
      accountId: "acct_company_lifecycle",
      email: "company-lifecycle@example.com",
      displayName: "Company Lifecycle",
      role: "company",
      now
    });

    await assert.rejects(
      database.query(
        `INSERT INTO platform_tenants (
           tenant_id, tenant_type, display_name, tenant_status,
           created_at, updated_at
         ) VALUES ($1, 'company', $2, 'active', $3, $3)`,
        ["tenant_invalid_active", "Invalid Active", now]
      ),
      /platform_tenants_state_check|check constraint|violates/i
    );

    await database.query(
      `INSERT INTO platform_tenants (
         tenant_id, tenant_type, display_name, tenant_status,
         created_at, updated_at
       ) VALUES ($1, 'company', $2, 'pending', $3, $3)`,
      ["tenant_pending", "Pending Company", now]
    );

    await assert.rejects(
      database.query(
        `INSERT INTO auth_tenant_memberships (
           membership_id, tenant_id, account_id, portal_role,
           membership_role, membership_status, created_at, updated_at
         ) VALUES ($1, $2, $3, 'company', 'admin', 'active', $4, $4)`,
        [
          "membership_invalid_active",
          "tenant_pending",
          "acct_company_lifecycle",
          now
        ]
      ),
      /auth_tenant_membership_state_check|check constraint|violates/i
    );
  } finally {
    await database.close();
  }
});

test("tenant permission overrides reject wildcard, unknown and duplicate permission state", async () => {
  const database = await openMigratedDatabase();
  try {
    const now = new Date("2026-08-04T12:00:00.000Z").toISOString();
    await insertActiveAccount(database, {
      accountId: "acct_company_override",
      email: "company-override@example.com",
      displayName: "Company Override",
      role: "company",
      now
    });
    await database.query(
      `INSERT INTO platform_tenants (
         tenant_id, tenant_type, display_name, tenant_status,
         created_at, updated_at, activated_at
       ) VALUES ($1, 'company', $2, 'active', $3, $3, $3)`,
      ["tenant_override", "Override Company", now]
    );
    await database.query(
      `INSERT INTO auth_tenant_memberships (
         membership_id, tenant_id, account_id, portal_role,
         membership_role, membership_status, created_at, updated_at, activated_at
       ) VALUES ($1, $2, $3, 'company', 'manager', 'active', $4, $4, $4)`,
      [
        "membership_override",
        "tenant_override",
        "acct_company_override",
        now
      ]
    );

    await assert.rejects(
      database.query(
        `INSERT INTO auth_tenant_permission_overrides (
           membership_id, permission_key, effect, reason, created_at
         ) VALUES ($1, $2, 'grant', $3, $4)`,
        ["membership_override", "company.*", "No wildcard permission", now]
      ),
      /auth_tenant_permission_overrides|check constraint|violates/i
    );

    await database.query(
      `INSERT INTO auth_tenant_permission_overrides (
         membership_id, permission_key, effect, reason, created_at
       ) VALUES ($1, 'company.orders.manage', 'deny', $2, $3)`,
      ["membership_override", "Restricted order authority", now]
    );

    await assert.rejects(
      database.query(
        `INSERT INTO auth_tenant_permission_overrides (
           membership_id, permission_key, effect, reason, created_at
         ) VALUES ($1, 'company.orders.manage', 'grant', $2, $3)`,
        ["membership_override", "Conflicting duplicate override", now]
      ),
      /auth_tenant_permission_overrides_pkey|unique|duplicate/i
    );
  } finally {
    await database.close();
  }
});

test("authorization migration rolls back independently and reapplies cleanly", async () => {
  const database = await openMigratedDatabase();
  const previous = process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
  process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = "true";
  try {
    const rolledBack = await rollbackLatestMigration(
      database,
      TEST_ENVIRONMENT
    );
    assert.equal(rolledBack, "0005_authorization_tenant_isolation");

    const tenantTable = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'platform_tenants'`
    );
    const authTable = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_accounts'`
    );
    assert.equal(tenantTable.rows.length, 0);
    assert.equal(authTable.rows.length, 1);

    const reapplied = await applyPendingMigrations(
      database,
      TEST_ENVIRONMENT.releaseSha
    );
    assert.deepEqual(reapplied, ["0005_authorization_tenant_isolation"]);
  } finally {
    if (previous === undefined) {
      delete process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
    } else {
      process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = previous;
    }
    await database.close();
  }
});

test("authorization source keeps permission and tenant boundaries explicit", async () => {
  const [domain, migration] = await Promise.all([
    readFile(
      resolve("src/lib/authorization/authorization-domain.ts"),
      "utf8"
    ),
    readFile(
      resolve("database/migrations/0005_authorization_tenant_isolation.up.sql"),
      "utf8"
    )
  ]);

  for (const marker of [
    "PLATFORM_PERMISSIONS",
    "TENANT_PERMISSIONS",
    "ROLE_PLATFORM_PERMISSION_GRANTS",
    "TENANT_ROLE_PERMISSION_GRANTS",
    "evaluatePlatformPermission",
    "evaluateTenantPermission",
    "canGrantTenantRole",
    "canSetTenantPermissionOverride"
  ]) {
    assert.match(domain, new RegExp(marker));
  }
  assert.doesNotMatch(domain, /["'`]\*\.[^"'`]*["'`]|["'`][^"'`]*\.\*["'`]/);

  for (const marker of [
    "platform_tenants",
    "auth_tenant_memberships",
    "auth_tenant_permission_overrides",
    "auth_tenant_membership_company_role_fk",
    "auth_current_tenant_membership_idx",
    "permission_key NOT LIKE '%*%'"
  ]) {
    assert.match(migration, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
