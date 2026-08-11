"use client";

import { useActionState, useState } from "react";
import { INITIAL_COMPANY_TEAM_ACTION_STATE, inviteCompanyTeamMemberAction } from "@/app/company/(portal)/team/actions";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import {
  TENANT_MEMBERSHIP_ROLES,
  canGrantTenantRole,
  tenantPermissionsForRole,
  type TenantMembershipRole,
  type TenantPermission
} from "@/lib/authorization/authorization-domain";
import type { CompanyUnitRecord } from "@/lib/company/company-organization-domain";
import type { CompanyTeamMemberRecord } from "@/lib/company/company-team-service";

function permissionLabel(value: TenantPermission): string {
  return value.replace("company.", "").replaceAll(".", " · ");
}

export function CompanyTeamWorkspace({ members, sites, departments, actorRole, actorPermissions }: {
  members: readonly CompanyTeamMemberRecord[];
  sites: readonly CompanyUnitRecord[];
  departments: readonly CompanyUnitRecord[];
  actorRole: TenantMembershipRole;
  actorPermissions: readonly TenantPermission[];
}): React.JSX.Element {
  const [inviteState, inviteAction, invitePending] = useActionState(inviteCompanyTeamMemberAction, INITIAL_COMPANY_TEAM_ACTION_STATE);
  const availableRoles = TENANT_MEMBERSHIP_ROLES.filter((role) => canGrantTenantRole(actorRole, role));
  const [selectedRole, setSelectedRole] = useState<TenantMembershipRole>(availableRoles[0] ?? "viewer");
  const actorPermissionSet = new Set(actorPermissions);
  const selectablePermissions = tenantPermissionsForRole(selectedRole).filter((permission) => actorPermissionSet.has(permission));
  const activeSites = sites.filter((site) => site.status === "active");
  const activeDepartments = departments.filter((department) => department.status === "active");

  return <div className="content-stack">
    <section className="panel page-section" aria-labelledby="company-team-invite-title">
      <div className="section-heading-row"><div><p className="eyebrow">Invitation-only Company access</p><h2 id="company-team-invite-title">Invite Company Team member</h2></div></div>
      <p className="muted-copy">Company staff are separate from the Worker directory. The invitation uses the existing staff password and TOTP enrollment flow before tenant membership becomes active.</p>
      {inviteState.message ? <Alert tone={inviteState.status === "success" ? "success" : inviteState.status === "conflict" ? "warning" : "danger"}>{inviteState.message}</Alert> : null}
      {inviteState.invitationPath ? <Alert tone="neutral">Test invitation path: <strong>{inviteState.invitationPath}</strong></Alert> : null}
      {availableRoles.length === 0 ? <Alert tone="warning">Your current Company role cannot invite additional Team members.</Alert> :
      <form action={inviteAction} className="profile-form" noValidate>
        <Field htmlFor="team-email" label="Staff email"><Input id="team-email" name="email" type="email" required maxLength={320} /></Field>
        <Field htmlFor="team-role" label="Company Team role"><Select id="team-role" name="membershipRole" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as TenantMembershipRole)}>{availableRoles.map((role) => <option key={role} value={role}>{role}</option>)}</Select></Field>
        <Field htmlFor="team-site" label="Site scope (optional)"><Select id="team-site" name="siteId" defaultValue=""><option value="">No site assignment</option>{activeSites.map((site) => <option value={site.unitId} key={site.unitId}>{site.name}</option>)}</Select></Field>
        <Field htmlFor="team-department" label="Department scope (optional)"><Select id="team-department" name="departmentId" defaultValue=""><option value="">No department assignment</option>{activeDepartments.map((department) => <option value={department.unitId} key={department.unitId}>{department.name}</option>)}</Select></Field>
        <fieldset className="panel page-section"><legend>Effective tenant permissions</legend><p className="muted-copy">Only permissions inside the target role ceiling and your own current authority can be selected.</p>{selectablePermissions.map((permission) => <label key={permission} className="checkbox-row"><input type="checkbox" name="permissions" value={permission} defaultChecked /> <span>{permissionLabel(permission)}</span></label>)}</fieldset>
        <Button type="submit" disabled={invitePending}>{invitePending ? "Creating invitation…" : "Create Company Team invitation"}</Button>
      </form>}
    </section>

    <section className="content-stack" aria-labelledby="company-team-list-title">
      <div className="section-heading-row"><div><p className="eyebrow">Company staff only</p><h2 id="company-team-list-title">Team and permissions</h2></div><span className="status-pill">{members.length}</span></div>
      {members.length === 0 ? <Alert tone="neutral">No Company Team memberships are available.</Alert> : members.map((member) => <article className="panel page-section" key={member.membershipId}><div className="section-heading-row"><div><h3>{member.displayName}</h3><p className="muted-copy">{member.email}</p></div><span className="status-pill">{member.status}</span></div><p><strong>{member.membershipRole}</strong>{member.siteName ? ` · ${member.siteName}` : ""}{member.departmentName ? ` · ${member.departmentName}` : ""}</p><p className="muted-copy">Permissions: {member.permissions.length ? member.permissions.map(permissionLabel).join(", ") : "No tenant permissions"}</p></article>)}
    </section>
  </div>;
}
