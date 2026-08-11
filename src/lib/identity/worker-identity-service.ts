import "server-only";

import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";
import { evaluatePlatformPermission } from "../authorization/authorization-domain";
import {
  WorkerIdentityAccessDeniedError,
  assertWorkerIdentityPrincipal,
  type WorkerIdentitySnapshot
} from "./worker-identity-domain";
import {
  getWorkerIdentityRepository,
  type WorkerIdentityRepository
} from "./worker-identity-repository";
import {
  getWorkerIdentitySubmissionReadinessService,
  type WorkerIdentitySubmissionReadinessService
} from "./worker-identity-submission-readiness-service";

function assertWorkerIdentityManagePermission(
  principal: AuthorizationPrincipal
): AuthorizationPrincipal & Readonly<{ activeRole: "worker" }> {
  const worker = assertWorkerIdentityPrincipal(principal);
  const decision = evaluatePlatformPermission({
    role: worker.activeRole,
    permission: "worker.self.manage"
  });
  if (!decision.allowed) throw new WorkerIdentityAccessDeniedError();
  return worker;
}

export class WorkerIdentityService {
  constructor(
    private readonly repository: WorkerIdentityRepository =
      getWorkerIdentityRepository(),
    private readonly submissionReadiness: WorkerIdentitySubmissionReadinessService | null = null
  ) {}

  async load(
    principal: AuthorizationPrincipal
  ): Promise<WorkerIdentitySnapshot | null> {
    const worker = assertWorkerIdentityManagePermission(principal);
    return this.repository.loadOwn(worker);
  }

  async ensureDraft(
    principal: AuthorizationPrincipal
  ): Promise<WorkerIdentitySnapshot> {
    const worker = assertWorkerIdentityManagePermission(principal);
    return this.repository.ensureOwnDraft(worker);
  }

  async submit(
    principal: AuthorizationPrincipal,
    expectedLockVersion: number
  ): Promise<WorkerIdentitySnapshot> {
    const worker = assertWorkerIdentityManagePermission(principal);
    if (this.submissionReadiness) {
      await this.submissionReadiness.assertOwnReady(worker, {
        expectedLockVersion,
        expectedVersionKind: "initial"
      });
    }
    return this.repository.submitOwn(worker, expectedLockVersion);
  }

  async withdraw(
    principal: AuthorizationPrincipal,
    expectedLockVersion: number
  ): Promise<WorkerIdentitySnapshot> {
    const worker = assertWorkerIdentityManagePermission(principal);
    return this.repository.withdrawOwn(worker, expectedLockVersion);
  }
}

let service: WorkerIdentityService | null = null;

export function getWorkerIdentityService(): WorkerIdentityService {
  service ??= new WorkerIdentityService(
    getWorkerIdentityRepository(),
    getWorkerIdentitySubmissionReadinessService()
  );
  return service;
}
