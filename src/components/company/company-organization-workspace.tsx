"use client";

import { useActionState } from "react";
import {
  INITIAL_COMPANY_ORGANIZATION_ACTION_STATE,
  archiveCompanyUnitAction,
  createCompanyUnitAction,
  restoreCompanyUnitAction,
  updateCompanyUnitAction
} from "@/app/company/(portal)/organization/actions";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { CompanyUnitKind, CompanyUnitRecord } from "@/lib/company/company-organization-domain";

function Feedback({ state }: { state: typeof INITIAL_COMPANY_ORGANIZATION_ACTION_STATE }): React.JSX.Element | null {
  if (!state.message) return null;
  return <Alert tone={state.status === "success" ? "success" : state.status === "conflict" ? "warning" : "danger"}>{state.message}</Alert>;
}

function UnitCard({ unit, canManage }: { unit: CompanyUnitRecord; canManage: boolean }): React.JSX.Element {
  const [editState, editAction, editPending] = useActionState(updateCompanyUnitAction, INITIAL_COMPANY_ORGANIZATION_ACTION_STATE);
  const [archiveState, archiveAction, archivePending] = useActionState(archiveCompanyUnitAction, INITIAL_COMPANY_ORGANIZATION_ACTION_STATE);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreCompanyUnitAction, INITIAL_COMPANY_ORGANIZATION_ACTION_STATE);
  const transitionState = unit.status === "active" ? archiveState : restoreState;
  return (
    <article className="panel page-section">
      <div className="section-heading-row"><div><p className="eyebrow">{unit.kind}</p><h3>{unit.name}</h3></div><span className="status-pill">{unit.status}</span></div>
      <p className="muted-copy">{unit.formattedAddress} · {unit.email} · {unit.phone}</p>
      {canManage ? (
        <>
          <Feedback state={editState} />
          <form action={editAction} className="profile-form" noValidate>
            <input type="hidden" name="kind" value={unit.kind} /><input type="hidden" name="unitId" value={unit.unitId} /><input type="hidden" name="revision" value={unit.revision} />
            <Field htmlFor={`${unit.unitId}-name`} label="Name"><Input id={`${unit.unitId}-name`} name="name" defaultValue={unit.name} required maxLength={160} /></Field>
            <Field htmlFor={`${unit.unitId}-address`} label="Formatted address"><Input id={`${unit.unitId}-address`} name="formattedAddress" defaultValue={unit.formattedAddress} required maxLength={500} /></Field>
            <Field htmlFor={`${unit.unitId}-phone`} label="Phone"><Input id={`${unit.unitId}-phone`} name="phone" defaultValue={unit.phone} required maxLength={32} /></Field>
            <Field htmlFor={`${unit.unitId}-website`} label="Website"><Input id={`${unit.unitId}-website`} name="website" type="url" defaultValue={unit.website} required maxLength={240} /></Field>
            <Field htmlFor={`${unit.unitId}-email`} label="Email"><Input id={`${unit.unitId}-email`} name="email" type="email" defaultValue={unit.email} required maxLength={320} /></Field>
            <Field htmlFor={`${unit.unitId}-registration`} label="Registration number (optional)"><Input id={`${unit.unitId}-registration`} name="registrationNumber" defaultValue={unit.registrationNumber ?? ""} maxLength={120} /></Field>
            <Button type="submit" disabled={editPending || unit.status === "archived"}>{editPending ? "Saving…" : "Save changes"}</Button>
          </form>
          <Feedback state={transitionState} />
          <form action={unit.status === "active" ? archiveAction : restoreAction}>
            <input type="hidden" name="kind" value={unit.kind} /><input type="hidden" name="unitId" value={unit.unitId} /><input type="hidden" name="revision" value={unit.revision} />
            <Button type="submit" variant={unit.status === "active" ? "danger" : "secondary"} disabled={archivePending || restorePending}>
              {archivePending || restorePending ? "Updating…" : unit.status === "active" ? `Archive ${unit.kind}` : `Restore ${unit.kind}`}
            </Button>
            {unit.status === "active" ? <p className="muted-copy">Archiving ends active Company Team assignments to this unit and preserves assignment history.</p> : null}
          </form>
        </>
      ) : null}
    </article>
  );
}

export function CompanyOrganizationWorkspace({ sites, departments, canManage }: { sites: readonly CompanyUnitRecord[]; departments: readonly CompanyUnitRecord[]; canManage: boolean }): React.JSX.Element {
  const [createState, createAction, createPending] = useActionState(createCompanyUnitAction, INITIAL_COMPANY_ORGANIZATION_ACTION_STATE);
  const sections: Array<[CompanyUnitKind, readonly CompanyUnitRecord[]]> = [["site", sites], ["department", departments]];
  return <div className="content-stack">
    {canManage ? <section className="panel page-section"><div className="section-heading-row"><div><p className="eyebrow">Organization structure</p><h2>Add Site or Department</h2></div></div><Feedback state={createState} />
      <form action={createAction} className="profile-form" noValidate>
        <Field htmlFor="unit-kind" label="Unit type"><Select id="unit-kind" name="kind" defaultValue="site"><option value="site">Site</option><option value="department">Department</option></Select></Field>
        <Field htmlFor="unit-name" label="Name"><Input id="unit-name" name="name" required maxLength={160} /></Field>
        <Field htmlFor="unit-address" label="Formatted address"><Input id="unit-address" name="formattedAddress" required maxLength={500} /></Field>
        <Field htmlFor="unit-phone" label="Phone"><Input id="unit-phone" name="phone" required maxLength={32} /></Field>
        <Field htmlFor="unit-website" label="Website"><Input id="unit-website" name="website" type="url" required maxLength={240} /></Field>
        <Field htmlFor="unit-email" label="Email"><Input id="unit-email" name="email" type="email" required maxLength={320} /></Field>
        <Field htmlFor="unit-registration" label="Registration number (optional)"><Input id="unit-registration" name="registrationNumber" maxLength={120} /></Field>
        <Button type="submit" disabled={createPending}>{createPending ? "Creating…" : "Create unit"}</Button>
      </form></section> : null}
    {sections.map(([kind, records]) => <section key={kind} className="content-stack" aria-labelledby={`${kind}-list-title`}><div className="section-heading-row"><div><p className="eyebrow">Combined organization interface</p><h2 id={`${kind}-list-title`}>{kind === "site" ? "Sites" : "Departments"}</h2></div><span className="status-pill">{records.length}</span></div>{records.length === 0 ? <Alert tone="neutral">No {kind === "site" ? "sites" : "departments"} have been created.</Alert> : records.map((unit) => <UnitCard key={unit.unitId} unit={unit} canManage={canManage} />)}</section>)}
  </div>;
}
