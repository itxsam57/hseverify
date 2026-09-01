"use server";

import { redirect } from "next/navigation";

import {
  AssessmentAttemptDraftInputError,
  type AssessmentAttemptDraftSnapshot,
  type AssessmentAttemptDraftValue
} from "@/lib/assessment-attempt/assessment-attempt-draft-domain";
import { AssessmentAttemptAnswerInputError } from "@/lib/assessment-attempt/assessment-attempt-domain";
import {
  AssessmentAttemptAccessError,
  AssessmentAttemptConflictError,
  AssessmentAttemptInputError,
  getAssessmentAttemptService
} from "@/lib/assessment-attempt/assessment-attempt-service";
import { requirePlatformPermission } from "@/lib/authorization/authorization-service";

export type AssessmentAnswerActionState = Readonly<{
  status: "idle" | "error" | "conflict";
  message: string;
}>;

export type AssessmentDraftActionState = Readonly<{
  status: "idle" | "saved" | "error" | "conflict";
  message: string;
  serverDraft: Readonly<{
    value: AssessmentAttemptDraftValue;
    revision: number;
    updatedAt: string;
  }> | null;
}>;

function state(
  status: AssessmentAnswerActionState["status"],
  message: string
): AssessmentAnswerActionState {
  return Object.freeze({ status, message });
}

function draftState(
  status: AssessmentDraftActionState["status"],
  message: string,
  serverDraft: AssessmentAttemptDraftSnapshot | null = null
): AssessmentDraftActionState {
  return Object.freeze({ status, message, serverDraft });
}

function positiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function saveAssessmentDraftAction(
  _previousState: AssessmentDraftActionState,
  formData: FormData
): Promise<AssessmentDraftActionState> {
  const rawAttemptId = formData.get("attemptId");
  const rawPosition = formData.get("position");
  const rawQuestionVersionId = formData.get("questionVersionId");
  const rawDraft = formData.get("draft");
  const rawExpectedRevision = formData.get("expectedRevision");
  const rawMutationKey = formData.get("mutationKey");

  const attemptId = typeof rawAttemptId === "string" ? rawAttemptId.trim() : "";
  const position = positiveInteger(typeof rawPosition === "string" ? rawPosition : "");
  const questionVersionId =
    typeof rawQuestionVersionId === "string" ? rawQuestionVersionId.trim() : "";
  const encodedDraft = typeof rawDraft === "string" ? rawDraft : "";
  const mutationKey = typeof rawMutationKey === "string" ? rawMutationKey.trim() : "";

  if (
    !attemptId ||
    position === null ||
    !questionVersionId ||
    !encodedDraft ||
    typeof rawExpectedRevision !== "string" ||
    !mutationKey
  ) {
    return draftState("error", "This assessment draft is stale. Reload it and try again.");
  }

  const revisionText = rawExpectedRevision.trim();
  const expectedRevision =
    revisionText === "" || revisionText === "null" ? null : positiveInteger(revisionText);
  if (expectedRevision === null && revisionText !== "" && revisionText !== "null") {
    return draftState("error", "This assessment draft is stale. Reload it and try again.");
  }

  let draft: unknown;
  try {
    draft = JSON.parse(encodedDraft) as unknown;
  } catch {
    return draftState("error", "This assessment draft could not be saved.");
  }

  const principal = await requirePlatformPermission({
    expectedRole: "worker",
    permission: "worker.assessments.read"
  });
  const service = await getAssessmentAttemptService();

  try {
    const saved = await service.saveCurrentDraft(
      principal,
      {
        attemptId,
        position,
        questionVersionId,
        value: draft as AssessmentAttemptDraftValue,
        expectedRevision,
        mutationKey
      }
    );
    return draftState("saved", "Draft saved.", saved);
  } catch (error) {
    if (error instanceof AssessmentAttemptConflictError) {
      try {
        const latest = await service.getOwnedView(principal, attemptId);
        const sameQuestion =
          latest.currentQuestion !== null &&
          latest.currentQuestion.position === position &&
          latest.currentQuestion.questionVersionId === questionVersionId;
        return draftState(
          "conflict",
          sameQuestion
            ? "A newer saved draft exists. Choose which version to keep."
            : "This assessment changed. Reload the current question before continuing.",
          sameQuestion ? latest.currentDraft : null
        );
      } catch (refreshError) {
        if (refreshError instanceof AssessmentAttemptAccessError) {
          return draftState(
            "error",
            "This assessment is no longer available in the current session."
          );
        }
        if (
          refreshError instanceof AssessmentAttemptConflictError ||
          refreshError instanceof AssessmentAttemptInputError
        ) {
          return draftState(
            "conflict",
            "This assessment changed. Reload the current question before continuing."
          );
        }
        throw refreshError;
      }
    }
    if (
      error instanceof AssessmentAttemptDraftInputError ||
      error instanceof AssessmentAttemptInputError
    ) {
      return draftState("error", "This assessment draft could not be saved.");
    }
    if (error instanceof AssessmentAttemptAccessError) {
      return draftState(
        "error",
        "This assessment is no longer available in the current session."
      );
    }
    throw error;
  }
}

export async function submitAssessmentAnswerAction(
  _previousState: AssessmentAnswerActionState,
  formData: FormData
): Promise<AssessmentAnswerActionState> {
  const rawAttemptId = formData.get("attemptId");
  const rawPosition = formData.get("position");
  const rawQuestionVersionId = formData.get("questionVersionId");
  const rawAnswer = formData.get("answer");
  const attemptId = typeof rawAttemptId === "string" ? rawAttemptId.trim() : "";
  const position = positiveInteger(typeof rawPosition === "string" ? rawPosition : "");
  const questionVersionId =
    typeof rawQuestionVersionId === "string" ? rawQuestionVersionId.trim() : "";
  const encodedAnswer = typeof rawAnswer === "string" ? rawAnswer : "";

  if (!attemptId || position === null || !questionVersionId || !encodedAnswer) {
    return state("error", "This assessment question is stale. Reload it and try again.");
  }

  let answer: unknown;
  try {
    answer = JSON.parse(encodedAnswer) as unknown;
  } catch {
    return state("error", "Enter a valid answer before continuing.");
  }

  try {
    const principal = await requirePlatformPermission({
      expectedRole: "worker",
      permission: "worker.assessments.read"
    });
    await (
      await getAssessmentAttemptService()
    ).submitCurrentAnswer(
      principal,
      { attemptId, position, questionVersionId, answer }
    );
  } catch (error) {
    if (error instanceof AssessmentAttemptConflictError) {
      return state(
        "conflict",
        "This assessment changed in another request. Reload the current question before continuing."
      );
    }
    if (
      error instanceof AssessmentAttemptAnswerInputError ||
      error instanceof AssessmentAttemptInputError
    ) {
      return state("error", "Enter a valid answer before continuing.");
    }
    if (error instanceof AssessmentAttemptAccessError) {
      return state("error", "This assessment is no longer available in the current session.");
    }
    throw error;
  }

  redirect(`/worker/assessments/${attemptId}`);
}
