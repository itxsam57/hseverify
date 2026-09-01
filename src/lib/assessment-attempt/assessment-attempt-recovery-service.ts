import "server-only";

import { createHash } from "node:crypto";

import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";
import type { DatabaseClient } from "../database/database";
import { assertLiveAssessmentWorker } from "./assessment-attempt-authorization";
import {
  AssessmentAttemptAccessError,
  AssessmentAttemptConflictError,
  normalizeAssessmentAttemptReference
} from "./assessment-attempt-domain";
import {
  AssessmentDraftConflictError,
  AssessmentDraftInputError,
  normalizeAssessmentDraftValue,
  type AssessmentDraftSaveInput,
  type AssessmentDraftSnapshot
} from "./assessment-attempt-recovery-domain";
import {
  AssessmentAttemptRecoveryRepository,
  toAssessmentDraftSnapshot
} from "./assessment-attempt-recovery-repository";
import { AssessmentAttemptRepository } from "./assessment-attempt-repository";

const QUESTION_VERSION_ID_PATTERN = /^question_version_[A-Za-z0-9_-]{24}$/;
const MAX_REVISION = 2_147_483_646;

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
}
