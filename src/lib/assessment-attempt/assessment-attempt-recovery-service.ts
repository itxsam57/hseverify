import "server-only";

import { createHash } from "node:crypto";

import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";
import { bindTrustedAuditActor } from "../audit/audit-domain";
import { DatabaseAuditRepository } from "../audit/audit-repository";
import { createAssuranceTimelineEventId } from "../assurance/assurance-order-domain";
import { AssuranceOrderRepository } from "../assurance/assurance-order-repository";
import type { DatabaseClient } from "../database/database";
import { assertLiveAssessmentWorker } from "./assessment-attempt-authorization";
import {
  AssessmentAttemptAccessError,
  AssessmentAttemptConflictError,
  AssessmentAttemptInputError,
  normalizeAssessmentAttemptReference,
  type AssessmentAttemptRecord,
  type AssessmentAttemptStatus
} from "./assessment-attempt-domain";
import {
  ASSESSMENT_TECHNICAL_ISSUE_CATEGORIES,
  ASSESSMENT_TECHNICAL_ISSUE_MODES,
  AssessmentDraftConflictError,
  AssessmentDraftInputError,
  createAssessmentInterruptionId,
  createAssessmentIssueId,
  normalizeAssessmentDraftValue,
  type AssessmentDraftSaveInput,
  type AssessmentDraftSnapshot,
  type AssessmentInterruptionReason,
  type AssessmentTechnicalIssueCategory,
  type AssessmentTechnicalIssueMode
} from "./assessment-attempt-recovery-domain";
import {
  AssessmentAttemptRecoveryRepository,
  toAssessmentDraftSnapshot,
  type StoredAssessmentTechnicalIssue
} from "./assessment-attempt-recovery-repository";
import { AssessmentAttemptRepository } from "./assessment-attempt-repository";
import {
  AssessmentAttemptService,
  type AssessmentAttemptView
} from "./assessment-attempt-service";

const QUESTION_VERSION_ID_PATTERN = /^question_version_[A-Za-z0-9_-]{24}$/;
const MAX_REVISION = 2_147_483_646;
const INTERRUPTION_REASONS = new Set<AssessmentInterruptionReason>([
  "EMERGENCY_EXIT",
  "TECHNICAL_ISSUE_EXIT"
]);
const TECHNICAL_ISSUE_CATEGORIES = new Set<string>(
  ASSESSMENT_TECHNICAL_ISSUE_CATEGORIES
);
const TECHNICAL_ISSUE_MODES = new Set<string>(ASSESSMENT_TECHNICAL_ISSUE_MODES);

type RecoveryCaseRow = {
  order_id: string;
  tenant_id: string;
  case_status: string;
  assessment_reference: string | null;
  next_action: string | null;
};

type InterruptionInput = Readonly<{
  attemptId: string;
  position: number;
  questionVersionId: string;
  reason: AssessmentInterruptionReason;
  mutationKey: string;
}>;

type TechnicalIssueInput = Readonly<{
  attemptId: string;
  position: number;
  questionVersionId: string;
  category: AssessmentTechnicalIssueCategory;
  description: string;
  mode: AssessmentTechnicalIssueMode;
  mutationKey: string;
}>;

export type AssessmentTechnicalIssueResult = Readonly<{
  issueId: string;
  attemptId: string;
  status: AssessmentAttemptStatus;
  category: AssessmentTechnicalIssueCategory;
  mode: AssessmentTechnicalIssueMode;
  reportedAt: string;
}>;

function assertValidNow(now: Date): void {
  if (Number.isNaN(now.getTime())) {
    throw new AssessmentAttemptInputError("Assessment recovery timestamp is invalid.");
  }
}

function normalizeMutationKey(value: string, message: string): string {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    [...value].length < 16 ||
    [...value].length > 160
  ) {
    throw new AssessmentAttemptInputError(message);
  }
  return value;
}

function normalizeSaveRequest(input: AssessmentDraftSaveInput): AssessmentDraftSaveInput {
  const attemptId = normalizeAssessmentAttemptReference(input.attemptId);
  const questionVersionId = input.questionVersionId.trim();
  if (!QUESTION_VERSION_ID_PATTERN.test(questionVersionId)) {
    throw new AssessmentDraftInputError("Assessment draft question reference is invalid.");
  }
  if (!Number.isSafeInteger(input.position) || input.position < 1 || input.position > 500) {
    throw new AssessmentDraftInputError("Assessment draft position is invalid.");
  }
  if (
    input.expectedRevision !== null &&
    (!Number.isSafeInteger(input.expectedRevision) ||
      input.expectedRevision < 1 ||
      input.expectedRevision > MAX_REVISION)
  ) {
    throw new AssessmentDraftInputError("Assessment draft revision is invalid.");
  }
  if (
    typeof input.mutationKey !== "string" ||
    input.mutationKey !== input.mutationKey.trim() ||
    [...input.mutationKey].length < 16 ||
    [...input.mutationKey].length > 160
  ) {
    throw new AssessmentDraftInputError("Assessment draft mutation key is invalid.");
  }

  return Object.freeze({
    attemptId,
    position: input.position,
    questionVersionId,
    value: input.value,
    expectedRevision: input.expectedRevision,
    mutationKey: input.mutationKey
  });
}

function normalizeInterruptionRequest(input: InterruptionInput): InterruptionInput {
  const attemptId = normalizeAssessmentAttemptReference(input.attemptId);
  if (!Number.isSafeInteger(input.position) || input.position < 1 || input.position > 500) {
    throw new AssessmentAttemptInputError("Assessment interruption position is invalid.");
  }
  const questionVersionId = input.questionVersionId.trim();
  if (!QUESTION_VERSION_ID_PATTERN.test(questionVersionId)) {
    throw new AssessmentAttemptInputError("Assessment interruption question reference is invalid.");
  }
  if (!INTERRUPTION_REASONS.has(input.reason)) {
    throw new AssessmentAttemptInputError("Assessment interruption reason is invalid.");
  }
  const mutationKey = normalizeMutationKey(
    input.mutationKey,
    "Assessment interruption mutation key is invalid."
  );
  return Object.freeze({
    attemptId,
    position: input.position,
    questionVersionId,
    reason: input.reason,
    mutationKey
  });
}

function normalizeTechnicalIssueRequest(input: TechnicalIssueInput): TechnicalIssueInput {
  const attemptId = normalizeAssessmentAttemptReference(input.attemptId);
  if (!Number.isSafeInteger(input.position) || input.position < 1 || input.position > 500) {
    throw new AssessmentAttemptInputError("Assessment technical issue position is invalid.");
  }
  const questionVersionId = input.questionVersionId.trim();
  if (!QUESTION_VERSION_ID_PATTERN.test(questionVersionId)) {
    throw new AssessmentAttemptInputError("Assessment technical issue question reference is invalid.");
  }
  if (!TECHNICAL_ISSUE_CATEGORIES.has(input.category)) {
    throw new AssessmentAttemptInputError("Assessment technical issue category is invalid.");
  }
  if (!TECHNICAL_ISSUE_MODES.has(input.mode)) {
    throw new AssessmentAttemptInputError("Assessment technical issue mode is invalid.");
  }
  if (typeof input.description !== "string") {
    throw new AssessmentAttemptInputError("Assessment technical issue description is invalid.");
  }
  const description = input.description.trim();
  if ([...description].length < 1 || [...description].length > 2_000) {
    throw new AssessmentAttemptInputError("Assessment technical issue description is invalid.");
  }
  const mutationKey = normalizeMutationKey(
    input.mutationKey,
    "Assessment technical issue mutation key is invalid."
  );
  return Object.freeze({
    attemptId,
    position: input.position,
    questionVersionId,
    category: input.category,
    description,
    mode: input.mode,
    mutationKey
  });
}

function mutationDigest(input: {
  position: number;
  questionVersionId: string;
  value: AssessmentDraftSaveInput["value"];
}): string {
  const serialized = JSON.stringify({
    position: input.position,
    questionVersionId: input.questionVersionId,
    value: input.value
  });
  return createHash("sha256").update(serialized).digest("hex");
}

function interruptionDigest(input: InterruptionInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        position: input.position,
        questionVersionId: input.questionVersionId,
        reason: input.reason
      })
    )
    .digest("hex");
}

function technicalIssueDigest(input: TechnicalIssueInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        position: input.position,
        questionVersionId: input.questionVersionId,
        category: input.category,
        description: input.description,
        mode: input.mode
      })
    )
    .digest("hex");
}

function technicalIssueResult(
  issue: StoredAssessmentTechnicalIssue,
  status: AssessmentAttemptStatus
): AssessmentTechnicalIssueResult {
  return Object.freeze({
    issueId: issue.issueId,
    attemptId: issue.attemptId,
    status,
    category: issue.category,
    mode: issue.mode,
    reportedAt: issue.reportedAt
  });
}

async function loadRecoveryCaseContext(
  database: DatabaseClient,
  attempt: AssessmentAttemptRecord,
  principal: AuthorizationPrincipal
): Promise<RecoveryCaseRow> {
  const result = await database.query<RecoveryCaseRow>(
    `SELECT order_id,tenant_id,case_status,assessment_reference,next_action
     FROM assurance_cases
     WHERE case_id=$1 AND worker_account_id=$2
     LIMIT 1`,
    [attempt.caseId, principal.accountId]
  );
  const row = result.rows[0];
  if (
    !row ||
    row.case_status !== "Assessment in progress" ||
    row.assessment_reference !== attempt.attemptId
  ) {
    throw new AssessmentAttemptConflictError();
  }
  return row;
}

async function assertSameFormRecoveryState(
  attemptRepository: AssessmentAttemptRepository,
  recoveryRepository: AssessmentAttemptRecoveryRepository,
  attempt: AssessmentAttemptRecord,
  workerAccountId: string
): Promise<void> {
  const item = await attemptRepository.loadCurrentPinnedItem(
    workerAccountId,
    attempt.attemptId
  );
  if (!item || item.position !== attempt.currentPosition) {
    throw new AssessmentAttemptConflictError(
      "The current assessment question is unavailable."
    );
  }
  const draft = await recoveryRepository.findDraftForUpdate(attempt.attemptId);
  if (
    draft &&
    (
      draft.formId !== attempt.formId ||
      draft.formItemId !== item.formItemId ||
      draft.position !== attempt.currentPosition ||
      draft.questionId !== item.questionId ||
      draft.questionVersionId !== item.questionVersionId ||
      draft.questionType !== item.questionType
    )
  ) {
    throw new AssessmentAttemptConflictError();
  }
}

async function appendLifecycleEvidence(
  database: DatabaseClient,
  principal: AuthorizationPrincipal,
  attempt: AssessmentAttemptRecord,
  context: RecoveryCaseRow,
  input: {
    action:
      | "assessment.attempt.interrupted"
      | "assessment.attempt.recovery.eligible"
      | "assessment.attempt.resumed";
    eventType:
      | "assessment_attempt_interrupted"
      | "assessment_attempt_recovery_eligible"
      | "assessment_attempt_resumed";
    now: string;
    reason?: AssessmentInterruptionReason;
  }
): Promise<void> {
  await new AssuranceOrderRepository(database).insertTimeline({
    eventId: createAssuranceTimelineEventId(),
    tenantId: context.tenant_id,
    orderId: context.order_id,
    caseId: attempt.caseId,
    eventType: input.eventType,
    fromStatus: "Assessment in progress",
    toStatus: "Assessment in progress",
    owner: "worker",
    nextAction: context.next_action,
    actorAccountId: principal.accountId,
    actorRole: principal.activeRole,
    now: input.now
  });

  await new DatabaseAuditRepository(Promise.resolve(database)).append(
    bindTrustedAuditActor(principal),
    {
      action: input.action,
      outcome: "succeeded",
      target: { type: "resource", reference: attempt.attemptId },
      metadata: {
        caseId: attempt.caseId,
        formId: attempt.formId,
        position: attempt.currentPosition,
        ...(input.reason ? { reason: input.reason } : {})
      }
    }
  );
}

async function appendTechnicalIssueEvidence(
  database: DatabaseClient,
  principal: AuthorizationPrincipal,
  attempt: AssessmentAttemptRecord,
  context: RecoveryCaseRow,
  issue: StoredAssessmentTechnicalIssue,
  status: AssessmentAttemptStatus
): Promise<void> {
  await new AssuranceOrderRepository(database).insertTimeline({
    eventId: createAssuranceTimelineEventId(),
    tenantId: context.tenant_id,
    orderId: context.order_id,
    caseId: attempt.caseId,
    eventType: "assessment_technical_issue_reported",
    fromStatus: "Assessment in progress",
    toStatus: "Assessment in progress",
    owner: "worker",
    nextAction: context.next_action,
    actorAccountId: principal.accountId,
    actorRole: principal.activeRole,
    now: issue.reportedAt
  });

  await new DatabaseAuditRepository(Promise.resolve(database)).append(
    bindTrustedAuditActor(principal),
    {
      action: "assessment.technical_issue.reported",
      outcome: "succeeded",
      target: { type: "resource", reference: attempt.attemptId },
      metadata: {
        caseId: attempt.caseId,
        position: issue.position,
        category: issue.category,
        mode: issue.mode,
        status
      }
    }
  );
}

export class AssessmentAttemptRecoveryService {
  constructor(private readonly database: DatabaseClient) {}

  async saveDraft(
    principal: AuthorizationPrincipal,
    input: AssessmentDraftSaveInput,
    now = new Date()
  ): Promise<AssessmentDraftSnapshot> {
    if (Number.isNaN(now.getTime())) {
      throw new AssessmentDraftInputError("Assessment draft timestamp is invalid.");
    }
    const request = normalizeSaveRequest(input);

    return this.database.transaction(async (database) => {
      await assertLiveAssessmentWorker(database, principal, now);

      const attemptRepository = new AssessmentAttemptRepository(database);
      const recoveryRepository = new AssessmentAttemptRecoveryRepository(database);
      const attempt = await attemptRepository.lockOwned(
        principal.accountId,
        request.attemptId
      );
      if (!attempt) throw new AssessmentAttemptAccessError();
      if (attempt.status !== "IN_PROGRESS") {
        throw new AssessmentAttemptConflictError();
      }
      if (await recoveryRepository.findSuccessorAttemptId(attempt.attemptId)) {
        throw new AssessmentAttemptConflictError();
      }

      const item = await attemptRepository.loadCurrentPinnedItem(
        principal.accountId,
        attempt.attemptId
      );
      if (!item) {
        throw new AssessmentAttemptConflictError(
          "The current assessment question is unavailable."
        );
      }
      if (
        request.position !== attempt.currentPosition ||
        request.position !== item.position ||
        request.questionVersionId !== item.questionVersionId
      ) {
        throw new AssessmentAttemptConflictError();
      }

      const value = normalizeAssessmentDraftValue(
        item.questionType,
        request.value,
        item.options
      );
      const digest = mutationDigest({
        position: request.position,
        questionVersionId: request.questionVersionId,
        value
      });
      const current = await recoveryRepository.findDraftForUpdate(attempt.attemptId);

      if (current?.latestMutationKey === request.mutationKey) {
        const snapshot = toAssessmentDraftSnapshot(current);
        if (current.latestMutationDigest === digest) return snapshot;
        throw new AssessmentDraftConflictError(snapshot);
      }

      if (!current) {
        if (request.expectedRevision !== null) {
          throw new AssessmentDraftConflictError(null);
        }
        const created = await recoveryRepository.insertDraft({
          attemptId: attempt.attemptId,
          formId: attempt.formId,
          formItemId: item.formItemId,
          position: item.position,
          questionId: item.questionId,
          questionVersionId: item.questionVersionId,
          questionType: item.questionType,
          value,
          mutationKey: request.mutationKey,
          mutationDigest: digest,
          now: now.toISOString()
        });
        return toAssessmentDraftSnapshot(created);
      }

      const currentSnapshot = toAssessmentDraftSnapshot(current);
      if (request.expectedRevision !== current.revision) {
        throw new AssessmentDraftConflictError(currentSnapshot);
      }

      const updated = await recoveryRepository.updateDraftCas({
        attemptId: attempt.attemptId,
        expectedRevision: current.revision,
        formId: attempt.formId,
        formItemId: item.formItemId,
        position: item.position,
        questionId: item.questionId,
        questionVersionId: item.questionVersionId,
        questionType: item.questionType,
        value,
        mutationKey: request.mutationKey,
        mutationDigest: digest,
        now: now.toISOString()
      });
      if (!updated) {
        const authoritative = await recoveryRepository.findDraftForUpdate(attempt.attemptId);
        throw new AssessmentDraftConflictError(
          authoritative ? toAssessmentDraftSnapshot(authoritative) : null
        );
      }
      return toAssessmentDraftSnapshot(updated);
    });
  }

  async interrupt(
    principal: AuthorizationPrincipal,
    input: InterruptionInput,
    now = new Date()
  ): Promise<AssessmentAttemptRecord> {
    assertValidNow(now);
    const request = normalizeInterruptionRequest(input);
    const digest = interruptionDigest(request);

    return this.database.transaction(async (database) => {
      await assertLiveAssessmentWorker(database, principal, now);
      const attemptRepository = new AssessmentAttemptRepository(database);
      const recoveryRepository = new AssessmentAttemptRecoveryRepository(database);
      const attempt = await attemptRepository.lockOwned(principal.accountId, request.attemptId);
      if (!attempt) throw new AssessmentAttemptAccessError();
      if (await recoveryRepository.findSuccessorAttemptId(attempt.attemptId)) {
        throw new AssessmentAttemptConflictError();
      }

      const existing = await recoveryRepository.findInterruptionForUpdate(
        attempt.attemptId,
        request.mutationKey
      );
      if (existing) {
        if (existing.mutationDigest !== digest || attempt.status !== "INTERRUPTED") {
          throw new AssessmentAttemptConflictError();
        }
        return attempt;
      }
      if (attempt.status !== "IN_PROGRESS") {
        throw new AssessmentAttemptConflictError();
      }

      const item = await attemptRepository.loadCurrentPinnedItem(
        principal.accountId,
        attempt.attemptId
      );
      if (
        !item ||
        item.position !== attempt.currentPosition ||
        request.position !== attempt.currentPosition ||
        request.questionVersionId !== item.questionVersionId
      ) {
        throw new AssessmentAttemptConflictError();
      }
      const context = await loadRecoveryCaseContext(database, attempt, principal);
      const timestamp = now.toISOString();

      await recoveryRepository.insertInterruption({
        interruptionId: createAssessmentInterruptionId(),
        attemptId: attempt.attemptId,
        position: item.position,
        questionVersionId: item.questionVersionId,
        reason: request.reason,
        mutationKey: request.mutationKey,
        mutationDigest: digest,
        now: timestamp
      });
      const transitioned = await recoveryRepository.transitionAttemptStatus({
        attemptId: attempt.attemptId,
        workerAccountId: principal.accountId,
        fromStatus: "IN_PROGRESS",
        toStatus: "INTERRUPTED",
        now: timestamp
      });
      if (!transitioned) throw new AssessmentAttemptConflictError();

      const updated = await attemptRepository.findOwned(principal.accountId, attempt.attemptId);
      if (!updated || updated.status !== "INTERRUPTED") {
        throw new AssessmentAttemptConflictError();
      }
      await appendLifecycleEvidence(database, principal, updated, context, {
        action: "assessment.attempt.interrupted",
        eventType: "assessment_attempt_interrupted",
        now: timestamp,
        reason: request.reason
      });
      return updated;
    });
  }

  async establishRecoveryEligibility(
    principal: AuthorizationPrincipal,
    input: { attemptId: string },
    now = new Date()
  ): Promise<AssessmentAttemptRecord> {
    assertValidNow(now);
    const attemptId = normalizeAssessmentAttemptReference(input.attemptId);

    return this.database.transaction(async (database) => {
      await assertLiveAssessmentWorker(database, principal, now);
      const attemptRepository = new AssessmentAttemptRepository(database);
      const recoveryRepository = new AssessmentAttemptRecoveryRepository(database);
      const attempt = await attemptRepository.lockOwned(principal.accountId, attemptId);
      if (!attempt) throw new AssessmentAttemptAccessError();
      if (await recoveryRepository.findSuccessorAttemptId(attempt.attemptId)) {
        throw new AssessmentAttemptConflictError();
      }
      if (attempt.status === "RECOVERABLE") return attempt;
      if (attempt.status !== "INTERRUPTED") {
        throw new AssessmentAttemptConflictError();
      }

      await assertSameFormRecoveryState(
        attemptRepository,
        recoveryRepository,
        attempt,
        principal.accountId
      );
      const context = await loadRecoveryCaseContext(database, attempt, principal);
      const timestamp = now.toISOString();
      const transitioned = await recoveryRepository.transitionAttemptStatus({
        attemptId: attempt.attemptId,
        workerAccountId: principal.accountId,
        fromStatus: "INTERRUPTED",
        toStatus: "RECOVERABLE",
        now: timestamp
      });
      if (!transitioned) throw new AssessmentAttemptConflictError();

      const updated = await attemptRepository.findOwned(principal.accountId, attempt.attemptId);
      if (!updated || updated.status !== "RECOVERABLE") {
        throw new AssessmentAttemptConflictError();
      }
      await appendLifecycleEvidence(database, principal, updated, context, {
        action: "assessment.attempt.recovery.eligible",
        eventType: "assessment_attempt_recovery_eligible",
        now: timestamp
      });
      return updated;
    });
  }

  async resumeSameForm(
    principal: AuthorizationPrincipal,
    input: { attemptId: string },
    now = new Date()
  ): Promise<AssessmentAttemptView> {
    assertValidNow(now);
    const attemptId = normalizeAssessmentAttemptReference(input.attemptId);

    return this.database.transaction(async (database) => {
      await assertLiveAssessmentWorker(database, principal, now);
      const attemptRepository = new AssessmentAttemptRepository(database);
      const recoveryRepository = new AssessmentAttemptRecoveryRepository(database);
      const attempt = await attemptRepository.lockOwned(principal.accountId, attemptId);
      if (!attempt) throw new AssessmentAttemptAccessError();
      if (await recoveryRepository.findSuccessorAttemptId(attempt.attemptId)) {
        throw new AssessmentAttemptConflictError();
      }
      if (attempt.status !== "RECOVERABLE") {
        throw new AssessmentAttemptConflictError();
      }

      await assertSameFormRecoveryState(
        attemptRepository,
        recoveryRepository,
        attempt,
        principal.accountId
      );
      const context = await loadRecoveryCaseContext(database, attempt, principal);
      const timestamp = now.toISOString();
      const transitioned = await recoveryRepository.transitionAttemptStatus({
        attemptId: attempt.attemptId,
        workerAccountId: principal.accountId,
        fromStatus: "RECOVERABLE",
        toStatus: "IN_PROGRESS",
        now: timestamp
      });
      if (!transitioned) throw new AssessmentAttemptConflictError();

      const updated = await attemptRepository.findOwned(principal.accountId, attempt.attemptId);
      if (!updated || updated.status !== "IN_PROGRESS") {
        throw new AssessmentAttemptConflictError();
      }
      await appendLifecycleEvidence(database, principal, updated, context, {
        action: "assessment.attempt.resumed",
        eventType: "assessment_attempt_resumed",
        now: timestamp
      });

      return new AssessmentAttemptService(database).getOwnedView(
        principal,
        updated.attemptId,
        now
      );
    });
  }

  async reportTechnicalIssue(
    principal: AuthorizationPrincipal,
    input: TechnicalIssueInput,
    now = new Date()
  ): Promise<AssessmentTechnicalIssueResult> {
    assertValidNow(now);
    const request = normalizeTechnicalIssueRequest(input);
    const digest = technicalIssueDigest(request);

    return this.database.transaction(async (database) => {
      await assertLiveAssessmentWorker(database, principal, now);
      const attemptRepository = new AssessmentAttemptRepository(database);
      const recoveryRepository = new AssessmentAttemptRecoveryRepository(database);
      const attempt = await attemptRepository.lockOwned(principal.accountId, request.attemptId);
      if (!attempt) throw new AssessmentAttemptAccessError();
      if (await recoveryRepository.findSuccessorAttemptId(attempt.attemptId)) {
        throw new AssessmentAttemptConflictError();
      }

      const existing = await recoveryRepository.findTechnicalIssueForUpdate(
        attempt.attemptId,
        request.mutationKey
      );
      if (existing) {
        if (existing.mutationDigest !== digest) {
          throw new AssessmentAttemptConflictError();
        }
        const expectedStatus = existing.mode === "EXIT" ? "INTERRUPTED" : "IN_PROGRESS";
        if (attempt.status !== expectedStatus) {
          throw new AssessmentAttemptConflictError();
        }
        if (existing.mode === "EXIT") {
          const interruption = await recoveryRepository.findInterruptionForUpdate(
            attempt.attemptId,
            request.mutationKey
          );
          if (
            !interruption ||
            interruption.reason !== "TECHNICAL_ISSUE_EXIT" ||
            interruption.position !== existing.position ||
            interruption.questionVersionId !== existing.questionVersionId
          ) {
            throw new AssessmentAttemptConflictError();
          }
        }
        return technicalIssueResult(existing, attempt.status);
      }

      if (attempt.status !== "IN_PROGRESS") {
        throw new AssessmentAttemptConflictError();
      }
      const item = await attemptRepository.loadCurrentPinnedItem(
        principal.accountId,
        attempt.attemptId
      );
      if (
        !item ||
        item.position !== attempt.currentPosition ||
        request.position !== attempt.currentPosition ||
        request.questionVersionId !== item.questionVersionId
      ) {
        throw new AssessmentAttemptConflictError();
      }
      const context = await loadRecoveryCaseContext(database, attempt, principal);
      const timestamp = now.toISOString();
      const issue = await recoveryRepository.insertTechnicalIssue({
        issueId: createAssessmentIssueId(),
        attemptId: attempt.attemptId,
        position: item.position,
        questionVersionId: item.questionVersionId,
        category: request.category,
        description: request.description,
        mode: request.mode,
        mutationKey: request.mutationKey,
        mutationDigest: digest,
        now: timestamp
      });

      let resultAttempt = attempt;
      if (request.mode === "EXIT") {
        resultAttempt = await new AssessmentAttemptRecoveryService(database).interrupt(
          principal,
          {
            attemptId: attempt.attemptId,
            position: item.position,
            questionVersionId: item.questionVersionId,
            reason: "TECHNICAL_ISSUE_EXIT",
            mutationKey: request.mutationKey
          },
          now
        );
      }

      await appendTechnicalIssueEvidence(
        database,
        principal,
        resultAttempt,
        context,
        issue,
        resultAttempt.status
      );
      return technicalIssueResult(issue, resultAttempt.status);
    });
  }
}
