"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentTenantPermission } from "@/lib/authorization/authorization-service";
import type {
  TenantMembershipRole,
  TenantMembershipStatus
} from "@/lib/authorization/authorization-domain";
import { readAuthenticationRequestMetadata } from "@/lib/auth/auth-request";
import {
  CompanyTeamAccessError,
  CompanyTeamConflictError,
  CompanyTeamInputError,
  getCompanyTeamService
} from "@/lib/company/company-team-service";

export type CompanyTeamActionState = Readonly<{
  status: "idle" | "success" | "error" | "conflict";
  message: string | null;
  invitationPath: string | null;
}>;
export const INITIAL_COMPANY_TEAM_ACTION_STATE: CompanyTeamActionState = Object.freeze({
  status: "idle",
  message: null,
  invitationPath: null
});

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
function role(value: string): TenantMembershipRole | null {
  return value === "owner" || value === "admin" || value === "manager" || value === "viewer"
    ? value
    : null;
}
function membershipStatus(value: string): TenantMembershipStatus | null {
  return value === "invited" || value === "active" || value === "suspended" || value === "revoked"
    ? value
    : null;
}
function targetStatus(value: string): "active" | "suspended" | "revoked" | null {
  return value === "active" || value === "suspended" || value === "revoked" ? value : null;
}
function state(
  status: CompanyTeamActionState["status"],
  message: string,
  invitationPath: string | null = null
): CompanyTeamActionState {
  return Object.freeze({ status, message, invitationPath });
}
function failure(error: unknown): CompanyTeamActionState {
  if (error instanceof CompanyTeamConflictError) return state("conflict", error.message);
  if (error instanceof CompanyTeamInputError) return state("error", error.message);
  if (error instanceof CompanyTeamAccessError) {
    return state("error", "Your current Company role cannot complete that Team change.");
  }
  return state("error", "The Company Team change could not be completed safely.");
}
function refresh(): void {
  revalidatePath("/company/team");
  revalidatePath("/company/organization");
  revalidatePath("/company/dashboard");
}

export async function inviteCompanyTeamMemberAction(
  _previous: CompanyTeamActionState,
  formData: FormData
): Promise<CompanyTeamActionState> {
  const membershipRole = role(text(formData, "membershipRole"));
  if (!membershipRole) return state("error", "Choose a valid Company Team role.");
  const permissions = formData
    .getAll("permissions")
    .filter((value): value is string => typeof value === "string");
  try {
    const principal = await requireCurrentTenantPermission("company.members.manage");
    const metadata = await readAuthenticationRequestMetadata();
    const invitation = await getCompanyTeamService().invite(principal, {
      email: text(formData, "email"),
      membershipRole,
      permissions,
      siteId: text(formData, "siteId") || null,
      departmentId: text(formData, "departmentId") || null,
      requestFingerprint: metadata.fingerprint
    });
    refresh();
    return state(
      "success",
      "Company Team invitation created. The recipient must finish password setup and TOTP before membership becomes active.",
      invitation.invitationPath
    );
  } catch (error) {
    return failure(error);
  }
}

export async function cancelCompanyTeamInvitationAction(
  _previous: CompanyTeamActionState,
  formData: FormData
): Promise<CompanyTeamActionState> {
  const invitationId = text(formData, "invitationId");
  if (!invitationId) return state("conflict", "That Company Team invitation is no longer available.");
  try {
    const principal = await requireCurrentTenantPermission("company.members.manage");
    await getCompanyTeamService().cancelInvitation(principal, invitationId);
    refresh();
    return state("success", "Company Team invitation cancelled.");
  } catch (error) {
    return failure(error);
  }
}

export async function updateCompanyTeamMemberAction(
  _previous: CompanyTeamActionState,
  formData: FormData
): Promise<CompanyTeamActionState> {
  const expectedRole = role(text(formData, "expectedRole"));
  const expectedStatus = membershipStatus(text(formData, "expectedStatus"));
  const membershipRole = role(text(formData, "membershipRole"));
  const membershipId = text(formData, "membershipId");
  if (!expectedRole || !expectedStatus || !membershipRole || !membershipId) {
    return state("conflict", "That Company Team form is stale. Reload and try again.");
  }
  const permissions = formData
    .getAll("permissions")
    .filter((value): value is string => typeof value === "string");
  try {
    const principal = await requireCurrentTenantPermission("company.members.manage");
    await getCompanyTeamService().updateMember(principal, {
      membershipId,
      expectedRole,
      expectedStatus,
      membershipRole,
      permissions,
      siteId: text(formData, "siteId") || null,
      departmentId: text(formData, "departmentId") || null
    });
    refresh();
    return state("success", "Company Team role, permissions and unit scope saved.");
  } catch (error) {
    return failure(error);
  }
}

export async function changeCompanyTeamMemberStatusAction(
  _previous: CompanyTeamActionState,
  formData: FormData
): Promise<CompanyTeamActionState> {
  const membershipId = text(formData, "membershipId");
  const expectedStatus = membershipStatus(text(formData, "expectedStatus"));
  const nextStatus = targetStatus(text(formData, "targetStatus"));
  if (!membershipId || !expectedStatus || !nextStatus) {
    return state("conflict", "That Company Team status form is stale. Reload and try again.");
  }
  try {
    const principal = await requireCurrentTenantPermission("company.members.manage");
    await getCompanyTeamService().changeMemberStatus(principal, {
      membershipId,
      expectedStatus,
      targetStatus: nextStatus
    });
    refresh();
    return state(
      "success",
      nextStatus === "suspended"
        ? "Company Team access suspended. Active unit assignments were ended and retained as history."
        : nextStatus === "active"
          ? "Company Team access reactivated. Historical assignments were not recreated."
          : "Company Team access revoked. Historical assignments were retained."
    );
  } catch (error) {
    return failure(error);
  }
}
