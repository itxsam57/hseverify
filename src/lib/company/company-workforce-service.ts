import "server-only";

import {
  createOpaqueToken,
  hashOpaqueValue
} from "../auth/auth-domain";
import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";
import { runTenantScopedCommand } from "../authorization/tenant-scoped-command-guard";
import type { DatabaseClient } from "../database/database";
import {
  COMPANY_WORKFORCE_MANAGE_PERMISSION,
  CompanyWorkforceAccessError,
  CompanyWorkforceConflictError,
  type BulkInviteWorkerResult,
  type CompanyRegistrationCodeSecret,
  type CompanyWorkerInvitationSecret,
  type CompanyWorkerLinkRecord,
  type CompanyWorkforceManagePrincipal,
  type CreateCompanyRegistrationCodeInput,
  type InviteWorkerInput
} from "./company-workforce-domain";

const INVITATION_SECRET_CONTEXT = "hse-company-worker-invitation-v1";
const REGISTRATION_CODE_SECRET_CONTEXT = "hse-company-registration-code-v1";

export const COMPANY_WORKFORCE_SQL_AUTHORITY = Object.freeze({
  verification: "company_verification_cases",
  permanentWorkerId: "worker_identity_worker_ids",
  invitations: "company_worker_invitations",
  codes: "company_registration_codes",
  links: "company_worker_links"
});

export function createCompanyWorkerInvitationSecret(pepper: string): Readonly<{
  raw: string;
  hash: string;
}> {
  const raw = createOpaqueToken();
  return Object.freeze({
    raw,
    hash: hashOpaqueValue(raw, pepper, INVITATION_SECRET_CONTEXT)
  });
}

export function createCompanyRegistrationCodeSecret(pepper: string): Readonly<{
  raw: string;
  hash: string;
}> {
  const raw = createOpaqueToken(24);
  return Object.freeze({
    raw,
    hash: hashOpaqueValue(raw, pepper, REGISTRATION_CODE_SECRET_CONTEXT)
  });
}

export async function runVerifiedCompanyWorkforceCommand<Result>(input: {
  database: DatabaseClient;
  principal: CompanyWorkforceManagePrincipal;
  now?: Date;
  operation: (input: {
    database: DatabaseClient;
    tenantId: string;
    membershipId: string;
  }) => Promise<Result>;
}): Promise<Result> {
  try {
    return await runTenantScopedCommand({
      database: input.database,
      principal: input.principal,
      permission: COMPANY_WORKFORCE_MANAGE_PERMISSION,
      now: input.now,
      operation: async ({ database, scope }) => {
        const verification = await database.query<{ case_status: string }>(
          `SELECT case_status
           FROM company_verification_cases
           WHERE tenant_id = $1
           FOR UPDATE`,
          [scope.tenantId]
        );
        if (verification.rows[0]?.case_status !== "verified") {
          throw new CompanyWorkforceAccessError();
        }
        return input.operation({
          database,
          tenantId: scope.tenantId,
          membershipId: scope.membershipId
        });
      }
    });
  } catch (error) {
    if (error instanceof CompanyWorkforceAccessError) throw error;
    throw new CompanyWorkforceAccessError();
  }
}

export class CompanyWorkforceService {
  constructor(
    private readonly database: DatabaseClient,
    private readonly pepper: string,
    private readonly now: () => Date = () => new Date()
  ) {
    if (pepper.length < 32) {
      throw new Error("Company workforce secret pepper must contain at least 32 characters.");
    }
  }

  async inviteWorker(
    _principal: CompanyWorkforceManagePrincipal,
    _input: InviteWorkerInput
  ): Promise<CompanyWorkerInvitationSecret> {
    throw new CompanyWorkforceConflictError("Worker invitation behavior is not implemented in this GREEN slice.");
  }

  async bulkInviteWorkers(
    _principal: CompanyWorkforceManagePrincipal,
    _input: readonly InviteWorkerInput[]
  ): Promise<readonly BulkInviteWorkerResult[]> {
    throw new CompanyWorkforceConflictError("Bulk Worker invitation behavior is not implemented in this GREEN slice.");
  }

  async resendInvitation(
    _principal: CompanyWorkforceManagePrincipal,
    _invitationId: string
  ): Promise<CompanyWorkerInvitationSecret> {
    throw new CompanyWorkforceConflictError("Worker invitation resend behavior is not implemented in this GREEN slice.");
  }

  async revokeInvitation(
    _principal: CompanyWorkforceManagePrincipal,
    _invitationId: string
  ): Promise<void> {
    throw new CompanyWorkforceConflictError("Worker invitation revocation behavior is not implemented in this GREEN slice.");
  }

  async createRegistrationCode(
    _principal: CompanyWorkforceManagePrincipal,
    _input: CreateCompanyRegistrationCodeInput
  ): Promise<CompanyRegistrationCodeSecret> {
    throw new CompanyWorkforceConflictError("Company registration code behavior is not implemented in this GREEN slice.");
  }

  async revokeRegistrationCode(
    _principal: CompanyWorkforceManagePrincipal,
    _codeId: string
  ): Promise<void> {
    throw new CompanyWorkforceConflictError("Company registration code revocation behavior is not implemented in this GREEN slice.");
  }

  async acceptInvitation(
    _principal: AuthorizationPrincipal,
    _token: string
  ): Promise<CompanyWorkerLinkRecord> {
    throw new CompanyWorkforceConflictError("Worker invitation acceptance behavior is not implemented in this GREEN slice.");
  }

  async redeemRegistrationCode(
    _principal: AuthorizationPrincipal,
    _code: string
  ): Promise<CompanyWorkerLinkRecord> {
    throw new CompanyWorkforceConflictError("Company registration code redemption behavior is not implemented in this GREEN slice.");
  }

  async requestPermanentWorkerLink(
    _principal: CompanyWorkforceManagePrincipal,
    _permanentWorkerId: string,
    _defaults: InviteWorkerInput
  ): Promise<CompanyWorkerLinkRecord> {
    throw new CompanyWorkforceConflictError("Permanent Worker-ID linking behavior is not implemented in this GREEN slice.");
  }

  async acceptWorkerLink(
    _principal: AuthorizationPrincipal,
    _linkId: string
  ): Promise<CompanyWorkerLinkRecord> {
    throw new CompanyWorkforceConflictError("Worker link acceptance behavior is not implemented in this GREEN slice.");
  }

  protected get runtimeDependencies(): Readonly<{
    database: DatabaseClient;
    pepper: string;
    now: () => Date;
  }> {
    return Object.freeze({ database: this.database, pepper: this.pepper, now: this.now });
  }
}
