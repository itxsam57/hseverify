"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentTenantPermission } from "@/lib/authorization/authorization-service";
import type { TenantMembershipRole } from "@/lib/authorization/authorization-domain";
import { readAuthenticationRequestMetadata } from "@/lib/auth/auth-request";
import { CompanyTeamAccessError, CompanyTeamConflictError, CompanyTeamInputError, getCompanyTeamService } from "@/lib/company/company-team-service";

export type CompanyTeamActionState = Readonly<{ status: "idle" | "success" | "error" | "conflict"; message: string | null; invitationPath: string | null }>;
export const INITIAL_COMPANY_TEAM_ACTION_STATE: CompanyTeamActionState = Object.freeze({ status: "idle", message: null, invitationPath: null });
function text(formData: FormData, name: string): string { const value = formData.get(name); return typeof value === "string" ? value : ""; }
function role(value: string): TenantMembershipRole | null { return value === "owner" || value === "admin" || value === "manager" || value === "viewer" ? value : null; }
function state(status: CompanyTeamActionState["status"], message: string, invitationPath: string | null = null): CompanyTeamActionState { return Object.freeze({ status, message, invitationPath }); }
function failure(error: unknown): CompanyTeamActionState {
  if (error instanceof CompanyTeamConflictError) return state("conflict", error.message);
  if (error instanceof CompanyTeamInputError) return state("error", error.message);
  if (error instanceof CompanyTeamAccessError) return state("error", "Your current Company role cannot grant that role or permission set.");
  return state("error", "The Company Team invitation could not be created safely.");
}
export async function inviteCompanyTeamMemberAction(_previous: CompanyTeamActionState, formData: FormData): Promise<CompanyTeamActionState> {
  const membershipRole = role(text(formData, "membershipRole"));
  if (!membershipRole) return state("error", "Choose a valid Company Team role.");
  const permissions = formData.getAll("permissions").filter((value): value is string => typeof value === "string");
  try {
    const principal = await requireCurrentTenantPermission("company.members.manage");
    const metadata = await readAuthenticationRequestMetadata();
    const invitation = await getCompanyTeamService().invite(principal, {
      email: text(formData, "email"), membershipRole, permissions,
      siteId: text(formData, "siteId") || null, departmentId: text(formData, "departmentId") || null,
      requestFingerprint: metadata.fingerprint
    });
    revalidatePath("/company/team");
    return state("success", "Company Team invitation created. The recipient must finish password setup and TOTP before membership becomes active.", invitation.invitationPath);
  } catch (error) { return failure(error); }
}
