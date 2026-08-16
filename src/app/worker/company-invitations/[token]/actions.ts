"use server";

import { redirect } from "next/navigation";

import { requirePortalAuthorization } from "@/lib/authorization/authorization-service";
import { getServerEnvironment } from "@/lib/config/server-environment";
import { getDatabaseClient } from "@/lib/database/database";
import {
  CompanyWorkforceAccessError,
  CompanyWorkforceConflictError,
  CompanyWorkforceSecretError
} from "@/lib/company/company-workforce-domain";
import {
  prepareCompanyWorkforceRegistrationBinding
} from "@/lib/company/company-workforce-registration-binding";
import { CompanyWorkforceRegistrationService } from "@/lib/company/company-workforce-registration-service";
import { CompanyWorkforceService } from "@/lib/company/company-workforce-service";

export type WorkerCompanyInvitationActionState = Readonly<{
  error: string | null;
}>;

export const INITIAL_WORKER_COMPANY_INVITATION_ACTION_STATE: WorkerCompanyInvitationActionState = Object.freeze({
  error: null
});

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function services(): Promise<{
  workforce: CompanyWorkforceService;
  registration: CompanyWorkforceRegistrationService;
}> {
  const database = await getDatabaseClient();
  const environment = getServerEnvironment();
  return {
    workforce: new CompanyWorkforceService(database, environment.authPepper),
    registration: new CompanyWorkforceRegistrationService(database, environment.authPepper)
  };
}

function failure(error: unknown): WorkerCompanyInvitationActionState {
  if (error instanceof CompanyWorkforceSecretError) {
    return { error: "This Worker invitation is invalid, expired, revoked, or has already been replaced." };
  }
  if (error instanceof CompanyWorkforceConflictError) return { error: error.message };
  if (error instanceof CompanyWorkforceAccessError) {
    return { error: "This Worker invitation cannot be linked to the current Worker account." };
  }
  return { error: "The Worker invitation could not be completed safely." };
}

export async function prepareCompanyWorkforceRegistrationAction(
  _previous: WorkerCompanyInvitationActionState,
  formData: FormData
): Promise<WorkerCompanyInvitationActionState> {
  try {
    const token = text(formData, "token");
    const { registration } = await services();
    const resource = await registration.prepareInvitation(token);
    await prepareCompanyWorkforceRegistrationBinding(resource);
  } catch (error) {
    return failure(error);
  }
  redirect("/worker/register?company=invitation");
}

export async function acceptWorkerCompanyInvitationAction(
  _previous: WorkerCompanyInvitationActionState,
  formData: FormData
): Promise<WorkerCompanyInvitationActionState> {
  try {
    const principal = await requirePortalAuthorization("worker");
    const token = text(formData, "token");
    const { workforce } = await services();
    await workforce.acceptInvitation(principal, token);
  } catch (error) {
    return failure(error);
  }
  redirect("/worker/company-access?status=linked");
}
