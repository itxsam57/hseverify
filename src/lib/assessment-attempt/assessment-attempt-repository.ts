import "server-only";

import type { DatabaseClient } from "../database/database";
import type { QuestionDifficulty, QuestionType } from "../question-bank/question-bank-domain";
import type { AssessmentAttemptRecord } from "./assessment-attempt-domain";

type AttemptRow = {
  attempt_id: string;
  case_id: string;
  worker_account_id: string;
  catalogue_version_id: string;
  blueprint_version_id: string;
  form_id: string;
  status: AssessmentAttemptRecord["status"];
  current_position: number | string;
  question_count: number | string;
  started_at: string | Date;
  submitted_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type CurrentItemRow = {
  form_item_id: string;
  position: number | string;
  question_id: string;
  question_version_id: string;
  question_type: QuestionType;
  prompt: string;
  options_json: unknown;
  domain_reference: string;
  difficulty: QuestionDifficulty;
  tags_json: unknown;
};

export type PinnedAssessmentAttemptItem = Readonly<{
  formItemId: string;
  position: number;
  questionId: string;
  questionVersionId: string;
  questionType: QuestionType;
  prompt: string;
  options: readonly string[] | null;
  domainReference: string;
  difficulty: QuestionDifficulty;
  tags: readonly string[];
}>;

const ATTEMPT_COLUMNS = `attempt_id,case_id,worker_account_id,catalogue_version_id,
blueprint_version_id,form_id,status,current_position,question_count,started_at,
submitted_at,created_at,updated_at`;

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function maybeIso(value: string | Date | null): string | null {
  return value === null ? null : iso(value);
}

function integer(value: number | string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`Stored assessment attempt ${label} is invalid.`);
  }
  return parsed;
}

function strings(value: unknown, label: string): readonly string[] {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new Error(`Stored assessment attempt ${label} is invalid.`);
    }
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error(`Stored assessment attempt ${label} is invalid.`);
  }
  return Object.freeze([...(parsed as string[])]);
}

function attempt(row: AttemptRow): AssessmentAttemptRecord {
  const currentPosition = integer(row.current_position, "current position");
  const questionCount = integer(row.question_count, "question count");
  if (currentPosition > questionCount) {
    throw new Error("Stored assessment attempt position is inconsistent.");
  }
  if (
    (row.status === "IN_PROGRESS" && row.submitted_at !== null) ||
    (row.status === "SUBMITTED" &&
      (row.submitted_at === null || currentPosition !== questionCount))
  ) {
    throw new Error("Stored assessment attempt completion state is inconsistent.");
  }
  return Object.freeze({
    attemptId: row.attempt_id,
    caseId: row.case_id,
    workerAccountId: row.worker_account_id,
    catalogueVersionId: row.catalogue_version_id,
    blueprintVersionId: row.blueprint_version_id,
    formId: row.form_id,
    status: row.status,
    currentPosition,
    questionCount,
    startedAt: iso(row.started_at),
    submittedAt: maybeIso(row.submitted_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  });
}

function item(row: CurrentItemRow): PinnedAssessmentAttemptItem {
  return Object.freeze({
    formItemId: row.form_item_id,
    position: integer(row.position, "item position"),
    questionId: row.question_id,
    questionVersionId: row.question_version_id,
    questionType: row.question_type,
    prompt: row.prompt,
    options: row.options_json === null ? null : strings(row.options_json, "question options"),
    domainReference: row.domain_reference,
    difficulty: row.difficulty,
    tags: strings(row.tags_json, "question tags")
  });
}

export class AssessmentAttemptRepository {
  constructor(readonly database: DatabaseClient) {}

  async findByCaseCatalogueOwned(
    workerAccountId: string,
    caseId: string,
    catalogueVersionId: string
  ): Promise<AssessmentAttemptRecord | null> {
    const result = await this.database.query<AttemptRow>(
      `SELECT ${ATTEMPT_COLUMNS}
       FROM assessment_attempts
       WHERE worker_account_id=$1 AND case_id=$2 AND catalogue_version_id=$3
       ORDER BY created_at,attempt_id
       LIMIT 1`,
      [workerAccountId, caseId, catalogueVersionId]
    );
    return result.rows[0] ? attempt(result.rows[0]) : null;
  }

  async findByForm(
    workerAccountId: string,
    formId: string
  ): Promise<AssessmentAttemptRecord | null> {
    const result = await this.database.query<AttemptRow>(
      `SELECT ${ATTEMPT_COLUMNS}
       FROM assessment_attempts
       WHERE worker_account_id=$1 AND form_id=$2`,
      [workerAccountId, formId]
    );
    return result.rows[0] ? attempt(result.rows[0]) : null;
  }

  async findOwned(
    workerAccountId: string,
    attemptId: string
  ): Promise<AssessmentAttemptRecord | null> {
    const result = await this.database.query<AttemptRow>(
      `SELECT ${ATTEMPT_COLUMNS}
       FROM assessment_attempts
       WHERE worker_account_id=$1 AND attempt_id=$2`,
      [workerAccountId, attemptId]
    );
    return result.rows[0] ? attempt(result.rows[0]) : null;
  }

  async lockOwned(
    workerAccountId: string,
    attemptId: string
  ): Promise<AssessmentAttemptRecord | null> {
    const result = await this.database.query<AttemptRow>(
      `SELECT ${ATTEMPT_COLUMNS}
       FROM assessment_attempts
       WHERE worker_account_id=$1 AND attempt_id=$2
       FOR UPDATE`,
      [workerAccountId, attemptId]
    );
    return result.rows[0] ? attempt(result.rows[0]) : null;
  }

  async insertAttempt(input: {
    attemptId: string;
    caseId: string;
    workerAccountId: string;
    catalogueVersionId: string;
    blueprintVersionId: string;
    formId: string;
    questionCount: number;
    now: string;
  }): Promise<AssessmentAttemptRecord> {
    const result = await this.database.query<AttemptRow>(
      `INSERT INTO assessment_attempts(
         attempt_id,case_id,worker_account_id,catalogue_version_id,blueprint_version_id,
         form_id,status,current_position,question_count,started_at,submitted_at,created_at,updated_at
       ) VALUES($1,$2,$3,$4,$5,$6,'IN_PROGRESS',1,$7,$8,NULL,$8,$8)
       RETURNING ${ATTEMPT_COLUMNS}`,
      [
        input.attemptId,
        input.caseId,
        input.workerAccountId,
        input.catalogueVersionId,
        input.blueprintVersionId,
        input.formId,
        input.questionCount,
        input.now
      ]
    );
    if (!result.rows[0]) throw new Error("Assessment attempt was not persisted.");
    return attempt(result.rows[0]);
  }

  async loadCurrentPinnedItem(
    workerAccountId: string,
    attemptId: string
  ): Promise<PinnedAssessmentAttemptItem | null> {
    const result = await this.database.query<CurrentItemRow>(
      `SELECT i.form_item_id,i.position,i.question_id,i.question_version_id,
              v.question_type,v.prompt,v.options_json,v.domain_reference,v.difficulty,v.tags_json
       FROM assessment_attempts a
       JOIN generated_assessment_form_items i
         ON i.form_id=a.form_id
        AND i.position=a.current_position
       JOIN assessment_question_versions v
         ON v.question_version_id=i.question_version_id
        AND v.question_id=i.question_id
       WHERE a.worker_account_id=$1
         AND a.attempt_id=$2
       LIMIT 1`,
      [workerAccountId, attemptId]
    );
    return result.rows[0] ? item(result.rows[0]) : null;
  }
}
