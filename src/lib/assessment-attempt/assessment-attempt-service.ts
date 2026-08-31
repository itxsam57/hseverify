import "server-only";

import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";
import { evaluatePlatformPermission } from "../authorization/authorization-domain";
import { bindTrustedAuditActor } from "../audit/audit-domain";
import { DatabaseAuditRepository } from "../audit/audit-repository";
import { AssessmentCatalogueEligibilityService } from "../assessment-catalogue/assessment-catalogue-eligibility-service";
import { AssessmentFormGenerationService } from "../assessment-generation/assessment-form-generation-service";
import {
  createAssuranceTimelineEventId,
  type AssuranceCaseStatus
} from "../assurance/assurance-order-domain";
import { AssuranceOrderRepository } from "../assurance/assurance-order-repository";
import type { DatabaseClient } from "../database/database";
import { getDatabaseClient } from "../database/database";
import {
  AssessmentAttemptAccessError,
  AssessmentAttemptConflictError,
  AssessmentAttemptInputError,
  createAssessmentAttemptId,
  type AssessmentAttemptRecord
} from "./assessment-attempt-domain";
import {
  AssessmentAttemptRepository,
  type PinnedAssessmentAttemptItem
} from "./assessment-attempt-repository";

export {
  AssessmentAttemptAccessError,
  AssessmentAttemptConflictError,
  AssessmentAttemptInputError
} from "./assessment-attempt-domain";

export type CurrentAssessmentQuestion = Readonly<{
  attemptId: string;
  position: number;
  questionCount: number;
  questionId: string;
  questionVersionId: string;
  questionType: PinnedAssessmentAttemptItem["questionType"];
  prompt: string;
  options: readonly string[] | null;
  domainReference: string;
  difficulty: PinnedAssessmentAttemptItem["difficulty"];
  tags: readonly string[];
}>;

export type AssessmentAttemptView = Readonly<{
  attempt: AssessmentAttemptRecord;
  currentQuestion: CurrentAssessmentQuestion | null;
  submitted: boolean;
}>;

type OwnedCaseRow = {
  case_id: string;
  order_id: string;
  tenant_id: string;
  worker_account_id: string;
  case_status: AssuranceCaseStatus;
};

const CASE_ID_PATTERN = /^assurance_case_[A-Za-z0-9_-]{24}$/;
const CATALOGUE_VERSION_ID_PATTERN = /^catalogue_version_[A-Za-z0-9_-]{24}$/;

async function assertLiveWorker(
  database: DatabaseClient,
  principal: AuthorizationPrincipal,
  now: Date
): Promise<void> {
  const decision = evaluatePlatformPermission({
    role: principal.activeRole,
    permission: "worker.assessments.read"
  });
  if (
    principal.activeRole !== "worker" ||
    principal.accountStatus !== "active" ||
    !decision.allowed ||
    principal.tenantMembership !== null
  ) {
    throw new AssessmentAttemptAccessError();
  }

  const current = await database.query<{ session_id: string }>(
    `SELECT s.session_id
     FROM auth_sessions s
     JOIN auth_accounts a ON a.account_id=s.account_id
     JOIN auth_account_roles r
       ON r.account_id=a.account_id
      AND r.role='worker'
     WHERE s.session_id=$1
       AND s.account_id=$2
       AND s.active_role='worker'
       AND s.revoked_at IS NULL
       AND s.expires_at > $3
       AND a.account_status='active'
     LIMIT 1`,
    [principal.sessionId, principal.accountId, now.toISOString()]
  );
  if (current.rows[0]?.session_id !== principal.sessionId) {
    throw new AssessmentAttemptAccessError();
  }
}

function currentQuestion(
  attempt: AssessmentAttemptRecord,
  item: PinnedAssessmentAttemptItem
): CurrentAssessmentQuestion {
  if (item.position !== attempt.currentPosition) {
    throw new AssessmentAttemptConflictError("Assessment question position is inconsistent.");
  }
  return Object.freeze({
    attemptId: attempt.attemptId,
    position: item.position,
    questionCount: attempt.questionCount,
    questionId: item.questionId,
    questionVersionId: item.questionVersionId,
    questionType: item.questionType,
    prompt: item.prompt,
    options: item.options,
    domainReference: item.domainReference,
    difficulty: item.difficulty,
    tags: item.tags
  });
}

async function view(
  repository: AssessmentAttemptRepository,
  attempt: AssessmentAttemptRecord
): Promise<AssessmentAttemptView> {
  if (attempt.status === "SUBMITTED") {
    return Object.freeze({ attempt, currentQuestion: null, submitted: true });
  }
  const item = await repository.loadCurrentPinnedItem(
    attempt.workerAccountId,
    attempt.attemptId
  );
  if (!item) {
    throw new AssessmentAttemptConflictError("The current assessment question is unavailable.");
  }
  return Object.freeze({
    attempt,
    currentQuestion: currentQuestion(attempt, item),
    submitted: false
  });
}

export class AssessmentAttemptService {
  constructor(private readonly database: DatabaseClient) {}

  async begin(
    principal: AuthorizationPrincipal,
    input: { caseId: string; catalogueVersionId: string },
    now = new Date()
  ): Promise<AssessmentAttemptView> {
    const caseId = input.caseId.trim();
    const catalogueVersionId = input.catalogueVersionId.trim();
    if (
      !CASE_ID_PATTERN.test(caseId) ||
      !CATALOGUE_VERSION_ID_PATTERN.test(catalogueVersionId)
    ) {
      throw new AssessmentAttemptInputError("Assessment selection reference is invalid.");
    }

    return this.database.transaction(async (database) => {
      await assertLiveWorker(database, principal, now);

      const caseResult = await database.query<OwnedCaseRow>(
        `SELECT case_id,order_id,tenant_id,worker_account_id,case_status
         FROM assurance_cases
         WHERE case_id=$1 AND worker_account_id=$2
         FOR UPDATE`,
        [caseId, principal.accountId]
      );
      const assuranceCase = caseResult.rows[0];
      if (!assuranceCase) throw new AssessmentAttemptAccessError();

      const repository = new AssessmentAttemptRepository(database);
      const existing = await repository.findByCaseCatalogueOwned(
        principal.accountId,
        caseId,
        catalogueVersionId
      );
      if (existing) {
        if (assuranceCase.case_status !== "Assessment in progress") {
          throw new AssessmentAttemptConflictError();
        }
        return view(repository, existing);
      }
      if (assuranceCase.case_status !== "Assessment pending") {
        throw new AssessmentAttemptAccessError();
      }

      const available = await new AssessmentCatalogueEligibilityService(database)
        .findAvailableForCase(principal, caseId, now);
      const selected = available.find(
        (entry) => entry.catalogueVersionId === catalogueVersionId
      );
      if (!selected) throw new AssessmentAttemptAccessError();

      // DatabaseClient.transaction() intentionally becomes a no-op when the
      // supplied client is already a transaction client. Therefore M2.05 form
      // generation participates in this exact outer begin transaction on both
      // PGlite and PostgreSQL and cannot commit independently.
      const form = await new AssessmentFormGenerationService(database).generateForCase(
        principal,
        {
          caseId,
          blueprintVersionId: selected.blueprintVersionId
        },
        now
      );

      const alreadyForForm = await repository.findByForm(principal.accountId, form.formId);
      if (alreadyForForm) return view(repository, alreadyForForm);

      const created = await repository.insertAttempt({
        attemptId: createAssessmentAttemptId(),
        caseId,
        workerAccountId: principal.accountId,
        catalogueVersionId,
        blueprintVersionId: selected.blueprintVersionId,
        formId: form.formId,
        questionCount: form.questionCount,
        now: now.toISOString()
      });

      const transitioned = await database.query(
        `UPDATE assurance_cases
         SET case_status='Assessment in progress',
             owner_kind='worker',
             next_action='Complete the assessment for this Assurance Case.',
             assessment_reference=$3,
             updated_at=$4
         WHERE case_id=$1
           AND worker_account_id=$2
           AND case_status='Assessment pending'`,
        [caseId, principal.accountId, created.attemptId, now.toISOString()]
      );
      if (transitioned.affectedRows !== 1) {
        throw new AssessmentAttemptConflictError();
      }

      await new AssuranceOrderRepository(database).insertTimeline({
        eventId: createAssuranceTimelineEventId(),
        tenantId: assuranceCase.tenant_id,
        orderId: assuranceCase.order_id,
        caseId,
        eventType: "assessment_attempt_started",
        fromStatus: "Assessment pending",
        toStatus: "Assessment in progress",
        owner: "worker",
        nextAction: "Complete the assessment for this Assurance Case.",
        actorAccountId: principal.accountId,
        actorRole: principal.activeRole,
        now: now.toISOString()
      });

      await new DatabaseAuditRepository(Promise.resolve(database)).append(
        bindTrustedAuditActor(principal),
        {
          action: "assessment.attempt.started",
          outcome: "succeeded",
          target: { type: "resource", reference: created.attemptId },
          metadata: {
            caseId,
            catalogueVersionId,
            blueprintVersionId: created.blueprintVersionId,
            formId: created.formId,
            questionCount: created.questionCount
          }
        }
      );

      return view(repository, created);
    });
  }
}

let service: AssessmentAttemptService | null = null;

export async function getAssessmentAttemptService(): Promise<AssessmentAttemptService> {
  service ??= new AssessmentAttemptService(await getDatabaseClient());
  return service;
}
