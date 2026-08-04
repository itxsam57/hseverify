import assert from "node:assert/strict";
import test from "node:test";

import {
  PLATFORM_PERMISSIONS,
  TENANT_MEMBERSHIP_ROLES,
  TENANT_PERMISSIONS,
  TENANT_STATUSES,
  canAssignTenantRole,
  canGrantTenantRole,
  canSetTenantPermissionOverride,
  createTenantId,
  createTenantMembershipId,
  evaluatePlatformPermission,
  evaluateTenantPermission,
  isPlatformPermission,
  isTenantMembershipRole,
  isTenantPermission,
  isTenantStatus,
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

test("tenant identifiers are opaque, non-sequential and context-prefixed", () => {
  const firstTenant = createTenantId();
  const secondTenant = createTenantId();
  const membership = createTenantMembershipId();
  assert.match(firstTenant, /^tenant_[A-Za-z0-9_-]{24}$/);
  assert.match(secondTenant, /^tenant_[A-Za-z0-9_-]{24}$/);
  assert.match(membership, /^membership_[A-Za-z0-9_-]{24}$/);
  assert.notEqual(firstTenant, secondTenant);
  assert.notEqual(firstTenant, membership);
});

test("tenant lifecycle vocabulary is explicit", () => {
  assert.deepEqual(TENANT_STATUSES, [
    "pending",
    "active",
    "suspended",
    "archived"
  ]);
  for (const status of TENANT_STATUSES) {
    assert.equal(isTenantStatus(status), true);
  }
  assert.equal(isTenantStatus("verified"), false);
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

test("tenant authorization rejects role, context, tenant and membership mismatches", () => {
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
      tenantStatus: "active",
      membershipId: "membership_alpha",
      role: "manager",
      status: "active",
      overrides: []
    }
  };

  assert.deepEqual(
    evaluateTenantPermission({
      context: {
        ...activeContext,
        activeRole: "worker"
      },
      resourceTenantId: "tenant_alpha",
      permission: "company.tenant.read"
    }),
    { allowed: false, reason: "tenant_role_mismatch" }
  );

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
          tenantStatus: "suspended"
        }
      },
      resourceTenantId: "tenant_alpha",
      permission: "company.tenant.read"
    }),
    { allowed: false, reason: "tenant_inactive" }
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

test("membership grants reject self-grant and grant-above-authority", () => {
  assert.equal(canGrantTenantRole("owner", "owner"), true);
  assert.equal(canGrantTenantRole("owner", "admin"), true);
  assert.equal(canGrantTenantRole("admin", "manager"), true);
  assert.equal(canGrantTenantRole("admin", "admin"), false);
  assert.equal(canGrantTenantRole("manager", "viewer"), false);

  assert.equal(
    canAssignTenantRole({
      actorMembershipId: "membership_owner",
      actorRole: "owner",
      targetMembershipId: "membership_owner",
      targetRole: "owner"
    }),
    false
  );
  assert.equal(
    canAssignTenantRole({
      actorMembershipId: "membership_owner",
      actorRole: "owner",
      targetMembershipId: "membership_admin",
      targetRole: "admin"
    }),
    true
  );
  assert.equal(
    canAssignTenantRole({
      actorMembershipId: "membership_admin",
      actorRole: "admin",
      targetMembershipId: "membership_other_admin",
      targetRole: "admin"
    }),
    false
  );

  assert.equal(
    canSetTenantPermissionOverride({
      actorMembershipId: "membership_admin",
      actorRole: "admin",
      targetMembershipId: "membership_manager",
      targetRole: "manager",
      permission: "company.orders.manage",
      effect: "deny"
    }),
    true
  );
  assert.equal(
    canSetTenantPermissionOverride({
      actorMembershipId: "membership_admin",
      actorRole: "admin",
      targetMembershipId: "membership_admin",
      targetRole: "manager",
      permission: "company.orders.manage",
      effect: "grant"
    }),
    false
  );
  assert.equal(
    canSetTenantPermissionOverride({
      actorMembershipId: "membership_admin",
      actorRole: "admin",
      targetMembershipId: "membership_viewer",
      targetRole: "viewer",
      permission: "company.billing.manage",
      effect: "grant"
    }),
    false
  );
  assert.equal(
    canSetTenantPermissionOverride({
      actorMembershipId: "membership_admin",
      actorRole: "admin",
      targetMembershipId: "membership_owner",
      targetRole: "owner",
      permission: "company.members.grant_owner",
      effect: "grant"
    }),
    false
  );
});
