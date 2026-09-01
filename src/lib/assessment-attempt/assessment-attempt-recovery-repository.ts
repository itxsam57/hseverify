import "server-only";

import type { DatabaseClient } from "../database/database";
import type { QuestionType } from "../question-bank/question-bank-domain";
import type { AssessmentAttemptStatus } from "./assessment-attempt-domain";
import type {
  AssessmentDraftSnapshot,
  AssessmentDraftValue,
  AssessmentInterruptionReason,
  AssessmentTechnicalIssueCategory,
  AssessmentTechnicalIssueMode
} from "./assessment-attempt-recovery-domain";

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

type InterruptionRow = {
  interruption_id: string;
  attempt_id: string;
  position: number | string;
  question_version_id: string;
  reason: AssessmentInterruptionReason;
  mutation_key: string;
  mutation_digest: string;
  interrupted_at: string | Date;
};

type TechnicalIssueRow = {
  issue_id: string;
  attempt_id: string;
  position: number | string;
  question_version_id: string;
  category: AssessmentTechnicalIssueCategory;
  description: string;
  mode: AssessmentTechnicalIssueMode;
  mutation_key: string;
  mutation_digest: string;
  reported_at: string | Date;
};

export type StoredAssessmentDraft = Readonly<{
  attemptId: string;
  formId: string;
  formItemId: string;
  position: number;
  questionId: string;
  questionVersionId: string;
  questionType: QuestionType;
  value: AssessmentDraftValue;
  revision: number;
  latestMutationKey: string;
  latestMutationDigest: string;
  createdAt: string;
  updatedAt: string;
}>;

export type StoredAssessmentInterruption = Readonly<{
  interruptionId: string;
  attemptId: string;
  position: number;
  questionVersionId: string;
  reason: AssessmentInterruptionReason;
  mutationKey: string;
  mutationDigest: string;
  interruptedAt: string;
}>;

export type StoredAssessmentTechnicalIssue = Readonly<{
  issueId: string;
  attemptId: string;
  position: number;
  questionVersionId: string;
  category: AssessmentTechnicalIssueCategory;
  description: string;
  mode: AssessmentTechnicalIssueMode;
  mutationKey: string;
  mutationDigest: string;
  reportedAt: string;
}>;

const DRAFT_COLUMNS = `attempt_id,form_id,form_item_id,position,question_id,
question_version_id,question_type,text_value,boolean_value,revision,
latest_mutation_key,latest_mutation_digest,created_at,updated_at`;
const INTERRUPTION_COLUMNS = `interruption_id,attempt_id,position,question_version_id,
reason,mutation_key,mutation_digest,interrupted_at`;
const TECHNICAL_ISSUE_COLUMNS = `issue_id,attempt_id,position,question_version_id,
category,description,mode,mutation_key,mutation_digest,reported_at`;

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function revision(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error("Stored assessment draft revision is invalid.");
  }
  return parsed;
}

function position(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 500) {
    throw new Error("Stored assessment position is invalid.");
  }
  return parsed;
}

function value(row: DraftRow): AssessmentDraftValue {
  if (row.question_type === "TRUE_FALSE") {
    if (row.text_value !== null) {
      throw new Error("Stored TRUE_FALSE draft is invalid.");
    }
    return row.boolean_value;
  }
  if (row.boolean_value !== null) {
    throw new Error("Stored assessment draft boolean value is invalid.");
  }
  if (
    row.question_type !== "MULTIPLE_CHOICE" &&
    row.text_value === null
  ) {
    throw new Error("Stored text draft is invalid.");
  }
  return row.text_value;
}

function stored(row: DraftRow): StoredAssessmentDraft {
  return Object.freeze({
    attemptId: row.attempt_id,
    formId: row.form_id,
    formItemId: row.form_item_id,
    position: position(row.position),
    questionId: row.question_id,
    questionVersionId: row.question_version_id,
    questionType: row.question_type,
    value: value(row),
    revision: revision(row.revision),
    latestMutationKey: row.latest_mutation_key,
    latestMutationDigest: row.latest_mutation_digest,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  });
}

function storedInterruption(row: InterruptionRow): StoredAssessmentInterruption {
  return Object.freeze({
    interruptionId: row.interruption_id,
    attemptId: row.attempt_id,
    position: position(row.position),
    questionVersionId: row.question_version_id,
    reason: row.reason,
    mutationKey: row.mutation_key,
    mutationDigest: row.mutation_digest,
    interruptedAt: iso(row.interrupted_at)
  });
}

function storedTechnicalIssue(row: TechnicalIssueRow): StoredAssessmentTechnicalIssue {
  return Object.freeze({
    issueId: row.issue_id,
    attemptId: row.attempt_id,
    position: position(row.position),
    questionVersionId: row.question_version_id,
    category: row.category,
    description: row.description,
    mode: row.mode,
    mutationKey: row.mutation_key,
    mutationDigest: row.mutation_digest,
    reportedAt: iso(row.reported_at)
  });
}

export function toAssessmentDraftSnapshot(
  draft: StoredAssessmentDraft
): AssessmentDraftSnapshot {
  return Object.freeze({
    attemptId: draft.attemptId,
    position: draft.position,
    questionVersionId: draft.questionVersionId,
    questionType: draft.questionType,
    value: draft.value,
    revision: draft.revision,
    updatedAt: draft.updatedAt
  });
}

function storageValues(
  questionType: QuestionType,
  draftValue: AssessmentDraftValue
): { textValue: string | null; booleanValue: boolean | null } {
  if (questionType === "TRUE_FALSE") {
    if (draftValue !== null && typeof draftValue !== "boolean") {
      throw new Error("Assessment draft value type is invalid for TRUE_FALSE.");
    }
    return {
      textValue: null,
      booleanValue: draftValue
    };
  }

  if (questionType === "MULTIPLE_CHOICE") {
    if (draftValue !== null && typeof draftValue !== "string") {
      throw new Error("Assessment draft value type is invalid for MULTIPLE_CHOICE.");
    }
    return {
      textValue: draftValue,
      booleanValue: null
    };
  }

  if (typeof draftValue !== "string") {
    throw new Error("Assessment draft value type is invalid for text or numeric input.");
  }
  return {
    textValue: draftValue,
    booleanValue: null
  };
}

export class AssessmentAttemptRecoveryRepository {
  constructor(readonly database: DatabaseClient) {}

  async findDraft(attemptId: string): Promise<AssessmentDraftSnapshot | null> {
    const result = await this.database.query<DraftRow>(
      `SELECT ${DRAFT_COLUMNS}
       FROM assessment_attempt_drafts
       WHERE attempt_id=$1`,
      [attemptId]
    );
    return result.rows[0]
      ? toAssessmentDraftSnapshot(stored(result.rows[0]))
      : null;
  }

  async findDraftForUpdate(
    attemptId: string
  ): Promise<StoredAssessmentDraft | null> {
    const result = await this.database.query<DraftRow>(
      `SELECT ${DRAFT_COLUMNS}
       FROM assessment_attempt_drafts
       WHERE attempt_id=$1
       FOR UPDATE`,
      [attemptId]
    );
    return result.rows[0] ? stored(result.rows[0]) : null;
  }

  async insertDraft(input: {
    attemptId: string;
    formId: string;
    formItemId: string;
    position: number;
    questionId: string;
    questionVersionId: string;
    questionType: QuestionType;
    value: AssessmentDraftValue;
    mutationKey: string;
    mutationDigest: string;
    now: string;
  }): Promise<StoredAssessmentDraft> {
    const storage = storageValues(input.questionType, input.value);
    const result = await this.database.query<DraftRow>(
      `INSERT INTO assessment_attempt_drafts(
         attempt_id,form_id,form_item_id,position,question_id,question_version_id,
         question_type,text_value,boolean_value,revision,latest_mutation_key,
         latest_mutation_digest,created_at,updated_at
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,1,$10,$11,$12,$12)
       RETURNING ${DRAFT_COLUMNS}`,
      [
        input.attemptId,
        input.formId,
        input.formItemId,
        input.position,
        input.questionId,
        input.questionVersionId,
        input.questionType,
        storage.textValue,
        storage.booleanValue,
        input.mutationKey,
        input.mutationDigest,
        input.now
      ]
    );
    if (!result.rows[0]) throw new Error("Assessment draft was not persisted.");
    return stored(result.rows[0]);
  }

  async updateDraftCas(input: {
    attemptId: string;
    expectedRevision: number;
    formId: string;
    formItemId: string;
    position: number;
    questionId: string;
    questionVersionId: string;
    questionType: QuestionType;
    value: AssessmentDraftValue;
    mutationKey: string;
    mutationDigest: string;
    now: string;
  }): Promise<StoredAssessmentDraft | null> {
    const storage = storageValues(input.questionType, input.value);
    const result = await this.database.query<DraftRow>(
      `UPDATE assessment_attempt_drafts
       SET form_id=$3,
           form_item_id=$4,
           position=$5,
           question_id=$6,
           question_version_id=$7,
           question_type=$8,
           text_value=$9,
           boolean_value=$10,
           revision=revision+1,
           latest_mutation_key=$11,
           latest_mutation_digest=$12,
           updated_at=$13
       WHERE attempt_id=$1 AND revision=$2
       RETURNING ${DRAFT_COLUMNS}`,
      [
        input.attemptId,
        input.expectedRevision,
        input.formId,
        input.formItemId,
        input.position,
        input.questionId,
        input.questionVersionId,
        input.questionType,
        storage.textValue,
        storage.booleanValue,
        input.mutationKey,
        input.mutationDigest,
        input.now
      ]
    );
    return result.rows[0] ? stored(result.rows[0]) : null;
  }

  async deleteMatchingDraft(input: {
    attemptId: string;
    formId: string;
    formItemId: string;
    position: number;
    questionVersionId: string;
  }): Promise<boolean> {
    const result = await this.database.query(
      `DELETE FROM assessment_attempt_drafts
       WHERE attempt_id=$1
         AND form_id=$2
         AND form_item_id=$3
         AND position=$4
         AND question_version_id=$5`,
      [
        input.attemptId,
        input.formId,
        input.formItemId,
        input.position,
        input.questionVersionId
      ]
    );
    return result.affectedRows === 1;
  }

  async findInterruptionForUpdate(
    attemptId: string,
    mutationKey: string
  ): Promise<StoredAssessmentInterruption | null> {
    const result = await this.database.query<InterruptionRow>(
      `SELECT ${INTERRUPTION_COLUMNS}
       FROM assessment_attempt_interruptions
       WHERE attempt_id=$1 AND mutation_key=$2
       FOR UPDATE`,
      [attemptId, mutationKey]
    );
    return result.rows[0] ? storedInterruption(result.rows[0]) : null;
  }

  async insertInterruption(input: {
    interruptionId: string;
    attemptId: string;
    position: number;
    questionVersionId: string;
    reason: AssessmentInterruptionReason;
    mutationKey: string;
    mutationDigest: string;
    now: string;
  }): Promise<StoredAssessmentInterruption> {
    const result = await this.database.query<InterruptionRow>(
      `INSERT INTO assessment_attempt_interruptions(
         interruption_id,attempt_id,position,question_version_id,reason,
         mutation_key,mutation_digest,interrupted_at
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING ${INTERRUPTION_COLUMNS}`,
      [
        input.interruptionId,
        input.attemptId,
        input.position,
        input.questionVersionId,
        input.reason,
        input.mutationKey,
        input.mutationDigest,
        input.now
      ]
    );
    if (!result.rows[0]) throw new Error("Assessment interruption was not persisted.");
    return storedInterruption(result.rows[0]);
  }

  async findTechnicalIssueForUpdate(
    attemptId: string,
    mutationKey: string
  ): Promise<StoredAssessmentTechnicalIssue | null> {
    const result = await this.database.query<TechnicalIssueRow>(
      `SELECT ${TECHNICAL_ISSUE_COLUMNS}
       FROM assessment_technical_issue_reports
       WHERE attempt_id=$1 AND mutation_key=$2
       FOR UPDATE`,
      [attemptId, mutationKey]
    );
    return result.rows[0] ? storedTechnicalIssue(result.rows[0]) : null;
  }

  async insertTechnicalIssue(input: {
    issueId: string;
    attemptId: string;
    position: number;
    questionVersionId: string;
    category: AssessmentTechnicalIssueCategory;
    description: string;
    mode: AssessmentTechnicalIssueMode;
    mutationKey: string;
    mutationDigest: string;
    now: string;
  }): Promise<StoredAssessmentTechnicalIssue> {
    const result = await this.database.query<TechnicalIssueRow>(
      `INSERT INTO assessment_technical_issue_reports(
         issue_id,attempt_id,position,question_version_id,category,description,
         mode,mutation_key,mutation_digest,reported_at
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING ${TECHNICAL_ISSUE_COLUMNS}`,
      [
        input.issueId,
        input.attemptId,
        input.position,
        input.questionVersionId,
        input.category,
        input.description,
        input.mode,
        input.mutationKey,
        input.mutationDigest,
        input.now
      ]
    );
    if (!result.rows[0]) throw new Error("Assessment technical issue was not persisted.");
    return storedTechnicalIssue(result.rows[0]);
  }

  async transitionAttemptStatus(input: {
    attemptId: string;
    workerAccountId: string;
    fromStatus: AssessmentAttemptStatus;
    toStatus: AssessmentAttemptStatus;
    now: string;
  }): Promise<boolean> {
    const result = await this.database.query(
      `UPDATE assessment_attempts
       SET status=$4,updated_at=$5
       WHERE attempt_id=$1
         AND worker_account_id=$2
         AND status=$3`,
      [
        input.attemptId,
        input.workerAccountId,
        input.fromStatus,
        input.toStatus,
        input.now
      ]
    );
    return result.affectedRows === 1;
  }

  async findSuccessorAttemptId(
    predecessorAttemptId: string
  ): Promise<string | null> {
    const result = await this.database.query<{ successor_attempt_id: string }>(
      `SELECT successor_attempt_id
       FROM assessment_attempt_recovery_lineage
       WHERE predecessor_attempt_id=$1
       LIMIT 1`,
      [predecessorAttemptId]
    );
    return result.rows[0]?.successor_attempt_id ?? null;
  }
}
