import { createIdentifier } from "../auth/auth-domain";
import type { QuestionType } from "../question-bank/question-bank-domain";

export type AssessmentDraftValue = string | boolean | null;

export type AssessmentDraftSnapshot = Readonly<{
  attemptId: string;
  position: number;
  questionVersionId: string;
  questionType: QuestionType;
  value: AssessmentDraftValue;
  revision: number;
  updatedAt: string;
}>;

export type AssessmentDraftSaveInput = Readonly<{
  attemptId: string;
  position: number;
  questionVersionId: string;
  value: AssessmentDraftValue;
  expectedRevision: number | null;
  mutationKey: string;
}>;

export type AssessmentInterruptionReason =
  | "EMERGENCY_EXIT"
  | "TECHNICAL_ISSUE_EXIT";

export const ASSESSMENT_TECHNICAL_ISSUE_CATEGORIES = Object.freeze([
  "CONNECTIVITY",
  "DISPLAY_OR_INPUT",
  "BROWSER_OR_DEVICE",
  "ACCESSIBILITY",
  "OTHER"
] as const);
export type AssessmentTechnicalIssueCategory =
  (typeof ASSESSMENT_TECHNICAL_ISSUE_CATEGORIES)[number];

export const ASSESSMENT_TECHNICAL_ISSUE_MODES = Object.freeze([
  "CONTINUE",
  "EXIT"
] as const);
export type AssessmentTechnicalIssueMode =
  (typeof ASSESSMENT_TECHNICAL_ISSUE_MODES)[number];

export const ASSESSMENT_REPLACEMENT_REASONS = Object.freeze([
  "FORM_INTEGRITY_FAILURE",
  "FORM_POLICY_INCOMPATIBLE",
  "SERVER_RECOVERY_REQUIRED"
] as const);
export type AssessmentReplacementReason =
  (typeof ASSESSMENT_REPLACEMENT_REASONS)[number];

export class AssessmentDraftInputError extends Error {
  constructor(message = "Assessment draft input is invalid.") {
    super(message);
    this.name = "AssessmentDraftInputError";
  }
}

export class AssessmentDraftConflictError extends Error {
  readonly currentDraft: AssessmentDraftSnapshot | null;

  constructor(
    currentDraft: AssessmentDraftSnapshot | null,
    message = "The assessment draft changed. Reconcile with the saved version."
  ) {
    super(message);
    this.name = "AssessmentDraftConflictError";
    this.currentDraft = currentDraft;
  }
}

export const createAssessmentInterruptionId = (): string =>
  createIdentifier("assessment_interruption");
export const createAssessmentIssueId = (): string =>
  createIdentifier("assessment_issue");
export const createAssessmentRecoveryId = (): string =>
  createIdentifier("assessment_recovery");

function exactString(value: unknown, maximumCodePoints: number): string {
  if (typeof value !== "string" || [...value].length > maximumCodePoints) {
    throw new AssessmentDraftInputError();
  }
  return value;
}

export function normalizeAssessmentDraftValue(
  questionType: QuestionType,
  rawValue: unknown,
  options: readonly string[] | null
): AssessmentDraftValue {
  if (questionType === "MULTIPLE_CHOICE") {
    if (rawValue === null) return null;
    if (
      typeof rawValue !== "string" ||
      !Array.isArray(options) ||
      !options.includes(rawValue)
    ) {
      throw new AssessmentDraftInputError();
    }
    return rawValue;
  }

  if (questionType === "TRUE_FALSE") {
    if (rawValue === null || typeof rawValue === "boolean") return rawValue;
    throw new AssessmentDraftInputError();
  }

  if (questionType === "SHORT_TEXT") {
    return exactString(rawValue, 2_000);
  }

  if (questionType === "LONG_TEXT") {
    return exactString(rawValue, 20_000);
  }

  if (questionType === "INTEGER" || questionType === "DECIMAL") {
    return exactString(rawValue, 128);
  }

  throw new AssessmentDraftInputError();
}