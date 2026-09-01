import "server-only";

import { createHash } from "node:crypto";

import type { DatabaseClient } from "../database/database";
import type { QuestionDifficulty, QuestionType } from "../question-bank/question-bank-domain";
import {
  type AssessmentAttemptDraftSnapshot,
  type AssessmentAttemptDraftValue,
  normalizeAssessmentDraftValue
} from "./assessment-attempt-draft-domain";
import {
  AssessmentAttemptConflictError,
  type AssessmentAttemptRecord,
  type NormalizedAssessmentAnswer
} from "./assessment-attempt-domain";

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

type CommittedAnswerRow = {
  position: number | string;
  question_version_id: string;
  question_type: QuestionType;
  options_json: unknown;
  text_value: string | null;
  boolean_value: boolean | null;
  numeric_value: number | string | null;
};

type DraftRow = {
  attempt_id: string;
  form_id: string;
  form_item_id: string;
  position: number | string;
  question_id: string;
  question_version_id: string;
  question_type: QuestionType;
  text_value: string | null;
  boolean_value: boolean | null;
  revision: number | string;
  latest_mutation_key: string;
  latest_mutation_digest: string;
  created_at: string | Date;
  updated_at: string | Date;
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

export type CommittedAssessmentAnswer = Readonly<{
  position: number;
  questionVersionId: string;
  questionType: QuestionType;
  options: readonly string[] | null;
  value: NormalizedAssessmentAnswer;
}>;

const ATTEMPT_COLUMNS = `attempt_id,case_id,worker_account_id,catalogue_version_id,
blueprint_version_id,form_id,status,current_position,question_count,started_at,
submitted_at,created_at,updated_at`;

const DRAFT_COLUMNS = `attempt_id,form_id,form_item_id,position,question_id,
question_version_id,question_type,text_value,boolean_value,revision,
latest_mutation_key,latest_mutation_digest,created_at,updated_at`;

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

function committedAnswer(row: CommittedAnswerRow): CommittedAssessmentAnswer {
  const numericValue = row.numeric_value === null ? null : Number(row.numeric_value);
  if (numericValue !== null && !Number.isFinite(numericValue)) {
    throw new Error("Stored assessment answer numeric value is invalid.");
  }
  return Object.freeze({
    position: integer(row.position, "committed answer position"),
    questionVersionId: row.question_version_id,
    questionType: row.question_type,
    options: row.options_json === null ? null : strings(row.options_json, "question options"),
    value: Object.freeze({
      textValue: row.text_value,
      booleanValue: row.boolean_value,
      numericValue
    })
  });
}

function draftValue(row: DraftRow): AssessmentAttemptDraftValue {
  if (row.question_type === "TRUE_FALSE") {
    if (row.boolean_value !== null && typeof row.boolean_value !== "boolean") {
      throw new Error("Stored assessment draft boolean value is invalid.");
    }
    return row.boolean_value;
  }
  return row.text_value;
}

function draft(row: DraftRow): AssessmentAttemptDraftSnapshot {
  return Object.freeze({
    value: draftValue(row),
    revision: integer(row.revision, "draft revision"),
    updatedAt: iso(row.updated_at)
  });
}

function mutationKey(value: string): string {
  if (typeof value !== "string" || value.trim().length < 1 || [...value].length > 128) {
    throw new AssessmentAttemptConflictError("Assessment draft mutation key is invalid.");
  }
  return value;
}

function mutationDigest(input: {
  attempt: AssessmentAttemptRecord;
  item: PinnedAssessmentAttemptItem;
  value: AssessmentAttemptDraftValue;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        input.attempt.attemptId,
        input.attempt.formId,
        input.item.formItemId,
        input.item.position,
        input.item.questionId,
        input.item.questionVersionId,
        input.item.questionType,
        input.value
      ]),
      "utf8"
    )
    .digest("hex");
}

function draftStorage(
  questionType: QuestionType,
  value: AssessmentAttemptDraftValue
): Readonly<{ textValue: string | null; booleanValue: boolean | null }> {
  if (questionType === "TRUE_FALSE") {
    return Object.freeze({
      textValue: null,
      booleanValue: value === null ? null : (value as boolean)
    });
  }
  return Object.freeze({
    textValue: value === null ? null : (value as string),
    booleanValue: null
  });
}

function isExactMutation(row: DraftRow, key: string, digestValue: string): boolean {
  return row.latest_mutation_key === key && row.latest_mutation_digest === digestValue;
}

export class AssessmentAttemptRepository {
  constructor(readonly database: DatabaseClient) {}

  private async findDraftRowByAttempt(attemptId: string): Promise<DraftRow | null> {
    const result = await this.database.query<DraftRow>(
      `SELECT ${DRAFT_COLUMNS}
       FROM assessment_attempt_drafts
       WHERE attempt_id=$1
       LIMIT 1`,
      [attemptId]
    );
    return result.rows[0] ?? null;
  }

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

  async findCurrentDraft(
    attemptId: string,
    formItemId: string
  ): Promise<AssessmentAttemptDraftSnapshot | null> {
    const result = await this.database.query<DraftRow>(
      `SELECT ${DRAFT_COLUMNS}
       FROM assessment_attempt_drafts
       WHERE attempt_id=$1
         AND form_item_id=$2
       LIMIT 1`,
      [attemptId, formItemId]
    );
    return result.rows[0] ? draft(result.rows[0]) : null;
  }

  async saveCurrentDraftCompareAndSwap(input: {
    attempt: AssessmentAttemptRecord;
    item: PinnedAssessmentAttemptItem;
    value: AssessmentAttemptDraftValue;
    expectedRevision: number | null;
    mutationKey: string;
    now: string;
  }): Promise<AssessmentAttemptDraftSnapshot> {
    const normalizedValue = normalizeAssessmentDraftValue(
      input.item.questionType,
      input.value,
      input.item.options
    );
    const key = mutationKey(input.mutationKey);
    if (
      input.expectedRevision !== null &&
      (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1)
    ) {
      throw new AssessmentAttemptConflictError("Assessment draft revision is invalid.");
    }

    const digestValue = mutationDigest({
      attempt: input.attempt,
      item: input.item,
      value: normalizedValue
    });
    const stored = draftStorage(input.item.questionType, normalizedValue);

    if (input.expectedRevision === null) {
      const inserted = await this.database.query<DraftRow>(
        `INSERT INTO assessment_attempt_drafts(
           attempt_id,form_id,form_item_id,position,question_id,question_version_id,
           question_type,text_value,boolean_value,revision,latest_mutation_key,
           latest_mutation_digest,created_at,updated_at
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,1,$10,$11,$12,$12)
         ON CONFLICT (attempt_id) DO NOTHING
         RETURNING ${DRAFT_COLUMNS}`,
        [
          input.attempt.attemptId,
          input.attempt.formId,
          input.item.formItemId,
          input.item.position,
          input.item.questionId,
          input.item.questionVersionId,
          input.item.questionType,
          stored.textValue,
          stored.booleanValue,
          key,
          digestValue,
          input.now
        ]
      );
      if (inserted.rows[0]) return draft(inserted.rows[0]);

      const existing = await this.findDraftRowByAttempt(input.attempt.attemptId);
      if (existing && isExactMutation(existing, key, digestValue)) return draft(existing);
      throw new AssessmentAttemptConflictError();
    }

    const updated = await this.database.query<DraftRow>(
      `UPDATE assessment_attempt_drafts
       SET text_value=$9,
           boolean_value=$10,
           revision=revision+1,
           latest_mutation_key=$11,
           latest_mutation_digest=$12,
           updated_at=$13
       WHERE attempt_id=$1
         AND form_id=$2
         AND form_item_id=$3
         AND position=$4
         AND question_id=$5
         AND question_version_id=$6
         AND question_type=$7
         AND revision=$8
         AND latest_mutation_key <> $11
       RETURNING ${DRAFT_COLUMNS}`,
      [
        input.attempt.attemptId,
        input.attempt.formId,
        input.item.formItemId,
        input.item.position,
        input.item.questionId,
        input.item.questionVersionId,
        input.item.questionType,
        input.expectedRevision,
        stored.textValue,
        stored.booleanValue,
        key,
        digestValue,
        input.now
      ]
    );
    if (updated.rows[0]) return draft(updated.rows[0]);

    const existing = await this.findDraftRowByAttempt(input.attempt.attemptId);
    if (existing && isExactMutation(existing, key, digestValue)) return draft(existing);
    throw new AssessmentAttemptConflictError();
  }

  async deleteCurrentDraft(input: {
    attemptId: string;
    formItemId: string;
    position: number;
  }): Promise<void> {
    await this.database.query(
      `DELETE FROM assessment_attempt_drafts
       WHERE attempt_id=$1
         AND form_item_id=$2
         AND position=$3`,
      [input.attemptId, input.formItemId, input.position]
    );
  }

  async findCommittedAnswer(
    workerAccountId: string,
    attemptId: string,
    position: number
  ): Promise<CommittedAssessmentAnswer | null> {
    const result = await this.database.query<CommittedAnswerRow>(
      `SELECT ans.position,ans.question_version_id,ans.question_type,
              v.options_json,ans.text_value,ans.boolean_value,ans.numeric_value
       FROM assessment_attempt_answers ans
       JOIN assessment_attempts a
         ON a.attempt_id=ans.attempt_id
        AND a.form_id=ans.form_id
       JOIN assessment_question_versions v
         ON v.question_version_id=ans.question_version_id
         AND v.question_id=ans.question_id
       WHERE a.worker_account_id=$1
         AND ans.attempt_id=$2
         AND ans.position=$3
       LIMIT 1`,
      [workerAccountId, attemptId, position]
    );
    return result.rows[0] ? committedAnswer(result.rows[0]) : null;
  }

  async insertCommittedAnswer(input: {
    answerId: string;
    attempt: AssessmentAttemptRecord;
    item: PinnedAssessmentAttemptItem;
    value: NormalizedAssessmentAnswer;
    now: string;
  }): Promise<void> {
    const result = await this.database.query(
      `INSERT INTO assessment_attempt_answers(
         answer_id,attempt_id,form_id,form_item_id,position,question_id,
         question_version_id,question_type,text_value,boolean_value,numeric_value,committed_at
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        input.answerId,
        input.attempt.attemptId,
        input.attempt.formId,
        input.item.formItemId,
        input.item.position,
        input.item.questionId,
        input.item.questionVersionId,
        input.item.questionType,
        input.value.textValue,
        input.value.booleanValue,
        input.value.numericValue,
        input.now
      ]
    );
    if (result.affectedRows !== 1) {
      throw new Error("Assessment answer was not persisted.");
    }
  }

  async advancePosition(
    workerAccountId: string,
    attemptId: string,
    expectedPosition: number,
    now: string
  ): Promise<AssessmentAttemptRecord | null> {
    const result = await this.database.query<AttemptRow>(
      `UPDATE assessment_attempts
       SET current_position=current_position+1,updated_at=$4
       WHERE worker_account_id=$1
         AND attempt_id=$2
         AND status='IN_PROGRESS'
         AND current_position=$3
         AND current_position < question_count
       RETURNING ${ATTEMPT_COLUMNS}`,
      [workerAccountId, attemptId, expectedPosition, now]
    );
    return result.rows[0] ? attempt(result.rows[0]) : null;
  }

  async markSubmitted(
    workerAccountId: string,
    attemptId: string,
    expectedPosition: number,
    now: string
  ): Promise<AssessmentAttemptRecord | null> {
    const result = await this.database.query<AttemptRow>(
      `UPDATE assessment_attempts
       SET status='SUBMITTED',submitted_at=$4,updated_at=$4
       WHERE worker_account_id=$1
         AND attempt_id=$2
         AND status='IN_PROGRESS'
         AND current_position=$3
         AND current_position=question_count
       RETURNING ${ATTEMPT_COLUMNS}`,
      [workerAccountId, attemptId, expectedPosition, now]
    );
    return result.rows[0] ? attempt(result.rows[0]) : null;
  }
}
