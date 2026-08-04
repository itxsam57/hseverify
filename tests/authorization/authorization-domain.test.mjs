import assert from "node:assert/strict";
import test from "node:test";

import {
  PLATFORM_PERMISSIONS,
  TENANT_MEMBERSHIP_ROLES,
  TENANT_PERMISSIONS,
  canGrantTenantRole,
  canSetTenantPermissionOverride,
  evaluatePlatformPermission,
  evaluateTenantPermission,
  isPlatformPermission,
  isTenantMembershipRole,
  isTenantPermission,
  platformPermissionsForRole,
  resolveTenantPermissions,
  roleHasPlatformPermission,
  tenantPermissionsForRole,
  tenantRoleHasPermission
} from "../../.authorization-test-dist/authorization/authorization-domain.js";

test("permission registries are explicit, unique and wildcard-free", () => {
  assert.equal(new Set(PLATFORM_PERMISSIONS).size, PLATFORM_PERMISSIONS.length);
  assert.equal(new Set(TENANT_PERMISSIONS).size, TENANT_PERMISSIONS.length);
  for (const permission of [...PLATFORM_PERMISSIONS, ...TENANT_PERMISSIONS]) {
    assert.equal(permission.includes("*"), false);
  }
  assert.equal(isPlatformPermission("platform.staff.manage"), true);
  assert.equal(isPlatformPermission("platform.*"), false);
  assert.equal(isTenantPermission("company.workforce.read"), true);
  assert.equal(isTenantPermission("company.*"), false);
});

test("platform roles receive least-privilege grants without tenant wildcards", () => {
  assert.deepEqual(platformPermissionsForRole("worker"), [
    "worker.self.read",
    "worker.self.manage"
  ]);
  assert.deepEqual(platformPermissionsForRole("company"), [
    "company.portal.access"
  ]);
  assert.equal(
    roleHasPlatformPermission("verifier", "verification.assigned.decide"),
    true
  );
  assert.equal(
    roleHasPlatformPermission("assessor", "verification.assigned.read"),
    false
  );
  assert.equal(
    roleHasPlatformPermission("admin", "platform.tenants.manage"),
    true
  );
  assert.equal(
    roleHasPlatformPermission("root", "platform.tenants.manage"),
    false
  );
  assert.equal(
    roleHasPlatformPermission("root", "platform.emergency.recover"),
    true
  );
  assert.deepEqual(
    evaluatePlatformPermission({
      role: "company",
      permission: "platform.staff.read"
    }),
    { allowed: false, reason: "role_permission_denied" }
  );
});

test("tenant membership roles have explicit monotonic permission ceilings", () => {
  assert.deepEqual(TENANT_MEMBERSHIP_ROLES, [
    "owner",
    "admin",
    "manager",
    "viewer"
  ]);
  for (const role of TENANT_MEMBERSHIP_ROLES) {
    assert.equal(isTenantMembershipRole(role), true);
  }
  assert.equal(isTenantMembershipRole("superuser"), false);
  assert.equal(
    tenantRoleHasPermission("viewer", "company.workforce.read"),
    true
  );
  assert.equal(
    tenantRoleHasPermission("viewer", "company.workforce.manage"),
    false
  );
  assert.equal(
    tenantRoleHasPermission("manager", "company.orders.manage"),
    true
  );
  assert.equal(
    tenantRoleHasPermission("manager", "company.billing.manage"),
    false
  );
  assert.equal(
    tenantRoleHasPermission("admin", "company.members.manage"),
    true
  );
  assert.equal(
    tenantRoleHasPermission("admin", "company.members.grant_owner"),
    false
  );
  assert.deepEqual(tenantPermissionsForRole("owner"), TENANT_PERMISSIONS);
});

test("tenant permission overrides can only narrow or remain inside the role ceiling", () => {
  const narrowed = resolveTenantPermissions("manager", [
    { permission: "company.orders.manage", effect: "deny" }
  ]);
  assert.equal(narrowed.has("company.orders.read"), true);
  assert.equal(narrowed.has("company.orders.manage"), false);

  assert.throws(
    () =>
      resolveTenantPermissions("viewer", [
        { permission: "company.billing.manage", effect: "grant" }
      ]),
    /exceeds the membership role/i
  );
  assert.throws(
    () =>
      resolveTenantPermissions("manager", [
        { permission: "company.orders.read", effect: "deny" },
        { permission: "company.orders.read", effect: "grant" }
      ]),
    /duplicate/i
  );
});

test("tenant authorization rejects missing, mismatched and inactive membership", () => {
  const baseContext = {
    accountId: "acct_company_member",
    sessionId: "session_company_member",
    activeRole: "company",
    tenantMembership: null
  };

  assert.deepEqual(
    evaluateTenantPermission({
      context: baseContext,
      resourceTenantId: "tenant_alpha",
      permission: "company.tenant.read"
    }),
    { allowed: false, reason: "tenant_context_missing" }
  );

  const activeContext = {
    ...baseContext,
    tenantMembership: {
      tenantId: "tenant_alpha",
      membershipId: "membership_alpha",
      role: "manager",
      status: "active",
      overrides: []
    }
  };

  assert.deepEqual(
    evaluateTenantPermission({
      context: activeContext,
      resourceTenantId: "tenant_beta",
      permission: "company.tenant.read"
    }),
    { allowed: false, reason: "tenant_mismatch" }
  );

  assert.deepEqual(
    evaluateTenantPermission({
      context: {
        ...activeContext,
        tenantMembership: {
          ...activeContext.tenantMembership,
          status: "suspended"
        }
      },
      resourceTenantId: "tenant_alpha",
      permission: "company.tenant.read"
    }),
    { allowed: false, reason: "membership_inactive" }
  );

  assert.deepEqual(
    evaluateTenantPermission({
      context: activeContext,
      resourceTenantId: "tenant_alpha",
      permission: "company.orders.manage"
    }),
    { allowed: true }
  );

  assert.deepEqual(
    evaluateTenantPermission({
      context: activeContext,
      resourceTenantId: "tenant_alpha",
      permission: "company.billing.manage"
    }),
    { allowed: false, reason: "tenant_permission_denied" }
  );
});

test("membership grants reject grant-above-authority", () => {
  assert.equal(canGrantTenantRole("owner", "owner"), true);
  assert.equal(canGrantTenantRole("owner", "admin"), true);
  assert.equal(canGrantTenantRole("admin", "manager"), true);
  assert.equal(canGrantTenantRole("admin", "admin"), false);
  assert.equal(canGrantTenantRole("manager", "viewer"), false);

  assert.equal(
    canSetTenantPermissionOverride({
      actorRole: "admin",
      targetRole: "manager",
      permission: "company.orders.manage",
      effect: "deny"
    }),
    true
  );
  assert.equal(
    canSetTenantPermissionOverride({
      actorRole: "admin",
      targetRole: "viewer",
      permission: "company.billing.manage",
      effect: "grant"
    }),
    false
  );
  assert.equal(
    canSetTenantPermissionOverride({
      actorRole: "admin",
      targetRole: "owner",
      permission: "company.members.grant_owner",
      effect: "grant"
    }),
    false
  );
});
