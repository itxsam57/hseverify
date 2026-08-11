import "server-only";

import {
  createIdentifier,
  createOpaqueToken,
  hashOpaqueValue,
  normalizeEmail
} from "../auth/auth-domain";
import { AuthAccessRepository } from "../auth/auth-access-repository";
import {
  canGrantTenantRole,
  resolveTenantPermissions,
  tenantPermissionsForRole,
  type TenantMembershipRole,
  type TenantPermission
} from "../authorization/authorization-domain";
import { runTenantScopedCommand } from "../authorization/tenant-scoped-command-guard";
import type { TenantPermissionPrincipal } from "../authorization/tenant-scoped-resource-domain";
import { getServerEnvironment } from "../config/server-environment";
import { getDatabaseClient, type DatabaseClient } from "../database/database";

const MANAGE_PERMISSION = "company.members.manage" as const;
const READ_PERMISSION = "company.members.read" as const;
const INVITATION_TTL_MS = 48 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_INVITATIONS = 20;

export type CompanyTeamInvitationResult = Readonly<{
  invitationId: string;
  email: string;
  membershipRole: TenantMembershipRole;
  expiresAt: string;
  invitationPath: string;
}>;

export type CompanyTeamMemberRecord = Readonly<{
  membershipId: string;
  accountId: string;
  displayName: string;
  email: string;
  membershipRole: TenantMembershipRole;
  status: "invited" | "active" | "suspended" | "revoked";
  permissions: readonly TenantPermission[];
  siteId: string | null;
  siteName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  activatedAt: string | null;
}>;

export class CompanyTeamInputError extends Error {
  constructor(message: string) { super(message); this.name = "CompanyTeamInputError"; }
}
export class CompanyTeamAccessError extends Error {
  constructor() { super("The Company Team operation could not be completed."); this.name = "CompanyTeamAccessError"; }
}
export class CompanyTeamConflictError extends Error {
  constructor(message = "The Company Team operation conflicts with current state.") { super(message); this.name = "CompanyTeamConflictError"; }
}

function addMs(date: Date, milliseconds: number): string {
  return new Date(date.getTime() + milliseconds).toISOString();
}
function uniquePermissions(values: readonly string[]): readonly TenantPermission[] {
  const allowed = new Set<TenantPermission>();
  for (const value of values) {
    if (!tenantPermissionsForRole("owner").includes(value as TenantPermission)) {
      throw new CompanyTeamInputError("Unknown Company permission.");
    }
    allowed.add(value as TenantPermission);
  }
  return Object.freeze([...allowed]);
}
function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: unknown }).code === "23505");
}

type MemberRow = {
  membership_id: string;
  account_id: string;
  display_name: string;
  email_normalized: string;
  membership_role: TenantMembershipRole;
  membership_status: CompanyTeamMemberRecord["status"];
  activated_at: string | Date | null;
  site_id: string | null;
  site_name: string | null;
  department_id: string | null;
  department_name: string | null;
};
type OverrideRow = { permission_key: TenantPermission; effect: "grant" | "deny" };

export class CompanyTeamService {
  constructor(
    private readonly clientPromise: Promise<DatabaseClient> = getDatabaseClient(),
    private readonly pepper: string = getServerEnvironment().authPepper,
    private readonly now: () => Date = () => new Date()
  ) {}
  private client(): Promise<DatabaseClient> { return this.clientPromise; }

  async listMembers(principal: TenantPermissionPrincipal<typeof READ_PERMISSION>): Promise<readonly CompanyTeamMemberRecord[]> {
    return runTenantScopedCommand({
      database: await this.client(), principal, permission: READ_PERMISSION,
      operation: async ({ database, scope }) => {
        const rows = await database.query<MemberRow>(
          `SELECT m.membership_id, m.account_id, a.display_name, a.email_normalized,
                  m.membership_role, m.membership_status, m.activated_at,
                  x.site_id, s.name AS site_name, x.department_id, d.name AS department_name
           FROM auth_tenant_memberships m
           JOIN auth_accounts a ON a.account_id=m.account_id
           LEFT JOIN company_team_unit_assignments x ON x.tenant_id=m.tenant_id AND x.membership_id=m.membership_id AND x.ended_at IS NULL
           LEFT JOIN company_sites s ON s.tenant_id=x.tenant_id AND s.site_id=x.site_id
           LEFT JOIN company_departments d ON d.tenant_id=x.tenant_id AND d.department_id=x.department_id
           WHERE m.tenant_id=$1 AND m.portal_role='company'
           ORDER BY CASE m.membership_status WHEN 'active' THEN 0 WHEN 'invited' THEN 1 WHEN 'suspended' THEN 2 ELSE 3 END, lower(a.display_name), m.membership_id`,
          [scope.tenantId]
        );
        const members: CompanyTeamMemberRecord[] = [];
        for (const row of rows.rows) {
          const overrides = await database.query<OverrideRow>(
            `SELECT permission_key, effect FROM auth_tenant_permission_overrides WHERE membership_id=$1 AND membership_role=$2 ORDER BY permission_key`,
            [row.membership_id, row.membership_role]
          );
          const permissions = [...resolveTenantPermissions(row.membership_role, overrides.rows.map((item) => ({ permission: item.permission_key, effect: item.effect })))];
          members.push(Object.freeze({
            membershipId: row.membership_id,
            accountId: row.account_id,
            displayName: row.display_name,
            email: row.email_normalized,
            membershipRole: row.membership_role,
            status: row.membership_status,
            permissions: Object.freeze(permissions),
            siteId: row.site_id,
            siteName: row.site_name,
            departmentId: row.department_id,
            departmentName: row.department_name,
            activatedAt: row.activated_at === null ? null : new Date(row.activated_at).toISOString()
          }));
        }
        return Object.freeze(members);
      }
    });
  }

  async invite(principal: TenantPermissionPrincipal<typeof MANAGE_PERMISSION>, input: {
    email: string;
    membershipRole: TenantMembershipRole;
    permissions: readonly string[];
    siteId?: string | null;
    departmentId?: string | null;
    requestFingerprint: string;
  }): Promise<CompanyTeamInvitationResult> {
    let email: string;
    try { email = normalizeEmail(input.email); } catch { throw new CompanyTeamInputError("Enter a valid staff email address."); }
    const selectedPermissions = uniquePermissions(input.permissions);
    const actorRole = principal.tenantMembership.role;
    if (!canGrantTenantRole(actorRole, input.membershipRole)) throw new CompanyTeamAccessError();
    const actorPermissions = resolveTenantPermissions(actorRole, principal.tenantMembership.overrides);
    const targetCeiling = new Set(tenantPermissionsForRole(input.membershipRole));
    for (const permission of selectedPermissions) {
      if (!targetCeiling.has(permission) || !actorPermissions.has(permission)) throw new CompanyTeamAccessError();
    }
    const siteId = input.siteId?.trim() || null;
    const departmentId = input.departmentId?.trim() || null;
    const now = this.now();
    const nowIso = now.toISOString();
    const token = createOpaqueToken();
    const fingerprint = hashOpaqueValue(input.requestFingerprint, this.pepper, "company-team-invitation-rate");

    try {
      return await runTenantScopedCommand({
        database: await this.client(), principal, permission: MANAGE_PERMISSION, now,
        operation: async ({ database, scope }) => {
          const access = new AuthAccessRepository(database);
          const attempts = await access.consumeAccessRateLimit({
            action: "staff_invitation",
            bucketKey: hashOpaqueValue(`${scope.accountId}\u0000${fingerprint}`, this.pepper, "auth-staff_invitation-rate-limit"),
            now: nowIso,
            resetBefore: addMs(now, -RATE_WINDOW_MS)
          });
          if (attempts > MAX_INVITATIONS) throw new CompanyTeamInputError("Too many Company staff invitations. Wait before trying again.");
          if (await access.authentication.findAccountByEmail(email)) throw new CompanyTeamConflictError("A Company Team invitation cannot be created for an existing account.");

          if (siteId) {
            const site = await database.query(`SELECT 1 FROM company_sites WHERE tenant_id=$1 AND site_id=$2 AND site_status='active' FOR UPDATE`, [scope.tenantId, siteId]);
            if (!site.rows[0]) throw new CompanyTeamInputError("Select an active Company site.");
          }
          if (departmentId) {
            const department = await database.query(`SELECT 1 FROM company_departments WHERE tenant_id=$1 AND department_id=$2 AND department_status='active' FOR UPDATE`, [scope.tenantId, departmentId]);
            if (!department.rows[0]) throw new CompanyTeamInputError("Select an active Company department.");
          }

          const invitationId = createIdentifier("invitation");
          const expiresAt = addMs(now, INVITATION_TTL_MS);
          await access.insertStaffInvitation({
            invitationId,
            email,
            role: "company",
            tokenHash: hashOpaqueValue(token, this.pepper, "staff-invitation"),
            invitedByAccountId: scope.accountId,
            expiresAt,
            createdAt: nowIso
          });
          const membershipId = createIdentifier("membership");
          const initialAssignmentId = siteId || departmentId ? createIdentifier("teamassignment") : null;
          await database.query(
            `INSERT INTO company_team_invitation_bindings (invitation_id,membership_id,initial_assignment_id,tenant_id,invited_by_membership_id,membership_role,site_id,department_id,created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [invitationId, membershipId, initialAssignmentId, scope.tenantId, scope.membershipId, input.membershipRole, siteId, departmentId, nowIso]
          );
          for (const permission of selectedPermissions) {
            await database.query(
              `INSERT INTO company_team_invitation_permissions (invitation_id,membership_role,permission_key,created_at) VALUES ($1,$2,$3,$4)`,
              [invitationId, input.membershipRole, permission, nowIso]
            );
          }
          await access.authentication.insertSecurityEvent({
            eventId: createIdentifier("event"), accountId: scope.accountId,
            eventType: "invitation_created", activeRole: "company",
            metadata: { invitationId, invitedRole: "company", membershipRole: input.membershipRole }, occurredAt: nowIso
          });
          return Object.freeze({ invitationId, email, membershipRole: input.membershipRole, expiresAt, invitationPath: `/staff/invite/${token}` });
        }
      });
    } catch (error) {
      if (error instanceof CompanyTeamInputError || error instanceof CompanyTeamAccessError || error instanceof CompanyTeamConflictError) throw error;
      if (isUniqueViolation(error)) throw new CompanyTeamConflictError("A pending Company Team invitation already exists for that email.");
      throw error;
    }
  }
}

let service: CompanyTeamService | null = null;
export function getCompanyTeamService(): CompanyTeamService {
  service ??= new CompanyTeamService();
  return service;
}
