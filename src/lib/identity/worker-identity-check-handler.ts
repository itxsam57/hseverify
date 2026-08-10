import "server-only";

import { getServerEnvironment } from "../config/server-environment";
import {
  normalizeOutboxFailure,
  type OutboxHandlerResult,
  type OutboxJobRecord,
  type TrustedOutboxLease
} from "../outbox/outbox-domain";
import {
  WorkerIdentityCheckProviderUnavailableError,
  createWorkerIdentityVerificationAdapter
} from "./worker-identity-check-domain";
import {
  getWorkerIdentityCheckRepository,
  type WorkerIdentityCheckRepository
} from "./worker-identity-check-repository";

export class WorkerIdentityAutomatedCheckHandler {
  constructor(
    private readonly repository: WorkerIdentityCheckRepository =
      getWorkerIdentityCheckRepository()
  ) {}

  async handle(
    job: OutboxJobRecord,
    lease: TrustedOutboxLease
  ): Promise<OutboxHandlerResult> {
    if (job.jobType !== "worker_identity.automated_checks") {
      return {
        kind: "terminal",
        failure: normalizeOutboxFailure({
          code: "wrong_identity_check_job_type",
          summary: "The job is not an automated Worker identity-check job."
        })
      };
    }

    try {
      const begun = await this.repository.beginLeasedRun(job, lease);
      if (begun.kind === "already_completed" || begun.kind === "stale") {
        return { kind: "succeeded" };
      }

      const environment = getServerEnvironment();
      let adapter;
      try {
        adapter = createWorkerIdentityVerificationAdapter(
          environment.appEnvironment
        );
      } catch (error) {
        if (error instanceof WorkerIdentityCheckProviderUnavailableError) {
          await this.repository.failProviderUnavailable(job, lease);
          return {
            kind: "terminal",
            failure: normalizeOutboxFailure({
              code: "identity_provider_not_configured",
              summary: "Identity provider checks are not configured for this environment."
            })
          };
        }
        throw error;
      }

      const batch = await adapter.run(begun.request);
      await this.repository.completeLeasedRun(job, lease, batch);
      return { kind: "succeeded" };
    } catch (error) {
      if (error instanceof WorkerIdentityCheckProviderUnavailableError) {
        await this.repository.failProviderUnavailable(job, lease);
        return {
          kind: "terminal",
          failure: normalizeOutboxFailure({
            code: "identity_provider_not_configured",
            summary: "Identity provider checks are not configured for this environment."
          })
        };
      }
      return {
        kind: "retryable",
        failure: normalizeOutboxFailure({
          code: "identity_check_processing_failed",
          summary: "The automated Worker identity-check attempt did not complete."
        })
      };
    }
  }
}

let handler: WorkerIdentityAutomatedCheckHandler | null = null;
export function getWorkerIdentityAutomatedCheckHandler(): WorkerIdentityAutomatedCheckHandler {
  handler ??= new WorkerIdentityAutomatedCheckHandler();
  return handler;
}
