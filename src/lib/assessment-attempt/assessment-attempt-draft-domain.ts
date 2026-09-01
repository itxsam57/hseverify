import type { QuestionType } from "../question-bank/question-bank-domain";

export type AssessmentAttemptDraftValue = string | boolean | null;

export type AssessmentAttemptDraftSnapshot = Readonly<{
  value: AssessmentAttemptDraftValue;
  revision: number;
  updatedAt: string;
}>;

export type AssessmentAttemptDraftSaveInput = Readonly<{
  attemptId: string;
  position: number;
  questionVersionId: string;
  value: AssessmentAttemptDraftValue;
  expectedRevision: number | null;
  mutationKey: string;
}>;

export class AssessmentAttemptDraftInputError extends Error {
  constructor(message = "The current draft is invalid.") {
    super(message);
    this.name = "AssessmentAttemptDraftInputError";
  }
}

function boundedExactString(value: unknown, maximumCodePoints: number): string {
  if (typeof value !== "string" || [...value].length > maximumCodePoints) {
    throw new AssessmentAttemptDraftInputError();
  }
  return value;
}

export function normalizeAssessmentDraftValue(
  questionType: QuestionType,
  rawValue: unknown,
  options: readonly string[] | null
): AssessmentAttemptDraftValue {
  if (questionType === "MULTIPLE_CHOICE") {
    if (rawValue === null) return null;
    if (
      typeof rawValue !== "string" ||
      !Array.isArray(options) ||
      !options.includes(rawValue)
    ) {
      throw new AssessmentAttemptDraftInputError();
    }
    return rawValue;
  }

  if (questionType === "TRUE_FALSE") {
    if (rawValue === null || typeof rawValue === "boolean") return rawValue;
    throw new AssessmentAttemptDraftInputError();
  }

  if (questionType === "SHORT_TEXT") {
    return boundedExactString(rawValue, 2_000);
  }

  if (questionType === "LONG_TEXT") {
    return boundedExactString(rawValue, 20_000);
  }

  if (questionType === "INTEGER" || questionType === "DECIMAL") {
    return boundedExactString(rawValue, 128);
  }

  throw new AssessmentAttemptDraftInputError();
}
