import { requireCurrentTenantPermission } from "@/lib/authorization/authorization-service";
import { resolveTenantPermissions } from "@/lib/authorization/authorization-domain";
import { getCompanyOrganizationRepository } from "@/lib/company/company-organization-repository";
import { getCompanyTeamService } from "@/lib/company/company-team-service";
import { CompanyTeamWorkspace } from "@/components/company/company-team-workspace";

export default async function CompanyTeamPage(): Promise<React.JSX.Element> {
  const teamPrincipal = await requireCurrentTenantPermission("company.members.read");
  const organizationPrincipal = await requireCurrentTenantPermission("company.tenant.read");
  const organization = getCompanyOrganizationRepository();
  const [members, sites, departments] = await Promise.all([
    getCompanyTeamService().listMembers(teamPrincipal),
    organization.list(organizationPrincipal, "site"),
    organization.list(organizationPrincipal, "department")
  ]);
  const actorPermissions = [...resolveTenantPermissions(teamPrincipal.tenantMembership.role, teamPrincipal.tenantMembership.overrides)];
  return <div className="dashboard-page"><header className="page-heading-row"><div><p className="eyebrow">Company access</p><h1>Company Team</h1><p className="page-intro">Invite and review Company staff separately from workers. Tenant role, unit scope and permissions are server-bound and every new member must complete TOTP enrollment.</p></div></header><CompanyTeamWorkspace members={members} sites={sites} departments={departments} actorRole={teamPrincipal.tenantMembership.role} actorPermissions={actorPermissions} /></div>;
}
