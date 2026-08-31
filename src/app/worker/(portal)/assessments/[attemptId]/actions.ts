"use server";

import { redirect } from "next/navigation";

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

function state(
  status: AssessmentAnswerActionState["status"],
  message: string
): AssessmentAnswerActionState {
  return Object.freeze({ status, message });
}

function positiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
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
