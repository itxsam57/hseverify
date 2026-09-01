import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

async function source(path) {
  return readFile(resolve(path), "utf8").catch(() => "");
}

test("M2.08 recovery persistence migration defines lifecycle, draft, interruption, issue, and lineage contracts", async () => {
  const migration = await source("database/migrations/0043_assessment_attempt_recovery.up.sql");
  const down = await source("database/migrations/0043_assessment_attempt_recovery.down.sql");
  const m205 = await source("database/migrations/0039_randomized_assessment_forms.up.sql");

  assert.match(migration, /assessment\.attempt\.interrupted/);
  assert.match(migration, /assessment\.technical_issue\.reported/);
  assert.match(migration, /assessment\.attempt\.recovery\.eligible/);
  assert.match(migration, /assessment\.attempt\.resumed/);
  assert.match(migration, /assessment\.attempt\.replacement\.created/);
  assert.match(migration, /assessment\.attempt\.recovery\.failed/);

  assert.match(migration, /IN_PROGRESS/);
  assert.match(migration, /INTERRUPTED/);
  assert.match(migration, /RECOVERABLE/);
  assert.match(migration, /SUBMITTED/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS assessment_attempt_drafts/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS assessment_attempt_interruptions/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS assessment_technical_issue_reports/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS assessment_attempt_recovery_lineage/i);

  assert.match(migration, /revision INTEGER NOT NULL/i);
  assert.match(migration, /revision\s*>?=\s*1/i);
  assert.match(migration, /latest_mutation_key TEXT NOT NULL/i);
  assert.match(migration, /latest_mutation_digest/i);
  assert.match(migration, /created_at TIMESTAMPTZ NOT NULL/i);
  assert.match(migration, /updated_at TIMESTAMPTZ NOT NULL/i);

  assert.match(migration, /form_item_id TEXT NOT NULL/i);
  assert.match(migration, /question_id TEXT NOT NULL/i);
  assert.match(migration, /question_version_id TEXT NOT NULL/i);
  assert.match(migration, /question_type TEXT NOT NULL/i);
  assert.match(migration, /UNIQUE \(attempt_id\)/i);
  assert.match(migration, /FOREIGN KEY \(attempt_id, form_id\)/i);
  assert.match(migration, /FOREIGN KEY \(form_id, form_item_id\)/i);
  assert.match(migration, /FOREIGN KEY \(form_id, form_item_id, position, question_id, question_version_id\)/i);

  assert.match(migration, /EMERGENCY_EXIT/);
  assert.match(migration, /TECHNICAL_ISSUE_EXIT/);
  assert.match(migration, /CONNECTIVITY/);
  assert.match(migration, /DISPLAY_OR_INPUT/);
  assert.match(migration, /BROWSER_OR_DEVICE/);
  assert.match(migration, /ACCESSIBILITY/);
  assert.match(migration, /OTHER/);
  assert.match(migration, /CONTINUE/);
  assert.match(migration, /EXIT/);
  assert.match(migration, /description TEXT NOT NULL/i);
  assert.match(migration, /char_length\(description\).*2000/is);

  assert.match(migration, /predecessor_attempt_id/i);
  assert.match(migration, /successor_attempt_id/i);
  assert.match(migration, /recovery_source_attempt_id/i);
  assert.match(migration, /UNIQUE \(predecessor_attempt_id\)/i);
  assert.match(migration, /UNIQUE \(successor_attempt_id\)/i);
  assert.match(migration, /WHERE recovery_source_attempt_id IS NULL/i);
  assert.match(migration, /WHERE recovery_source_attempt_id IS NOT NULL/i);

  assert.match(m205, /UNIQUE \(worker_account_id, question_id\)/i);
  assert.doesNotMatch(migration, /DROP\s+(?:CONSTRAINT|INDEX)[^;]*worker_account_id[^;]*question_id/is);

  assert.match(down, /NOT VALID/i);
  assert.match(down, /RAISE EXCEPTION/i);
  assert.doesNotMatch(down, /DELETE FROM generated_assessment_form_items/i);
  assert.doesNotMatch(down, /DELETE FROM assessment_attempt_answers/i);
});

test("M2.08 recovery domain preserves mutable draft edit states without weakening committed answer normalization", async () => {
  const attemptDomain = await source("src/lib/assessment-attempt/assessment-attempt-domain.ts");
  const recoveryDomain = await source("src/lib/assessment-attempt/assessment-attempt-recovery-domain.ts");

  assert.match(attemptDomain, /ASSESSMENT_ATTEMPT_STATUSES/);
  assert.match(attemptDomain, /"IN_PROGRESS"/);
  assert.match(attemptDomain, /"INTERRUPTED"/);
  assert.match(attemptDomain, /"RECOVERABLE"/);
  assert.match(attemptDomain, /"SUBMITTED"/);
  assert.match(attemptDomain, /export function normalizeAssessmentAnswer/);
  assert.match(attemptDomain, /Number\.isSafeInteger/);
  assert.match(attemptDomain, /Number\.isFinite/);

  assert.match(recoveryDomain, /export type AssessmentDraftValue\s*=\s*string\s*\|\s*boolean\s*\|\s*null/);
  assert.match(recoveryDomain, /export type AssessmentDraftSnapshot/);
  assert.match(recoveryDomain, /export type AssessmentDraftSaveInput/);
  assert.match(recoveryDomain, /export type AssessmentInterruptionReason/);
  assert.match(recoveryDomain, /export type AssessmentTechnicalIssueCategory/);
  assert.match(recoveryDomain, /export type AssessmentTechnicalIssueMode/);
  assert.match(recoveryDomain, /FORM_INTEGRITY_FAILURE/);
  assert.match(recoveryDomain, /FORM_POLICY_INCOMPATIBLE/);
  assert.match(recoveryDomain, /SERVER_RECOVERY_REQUIRED/);
  assert.match(recoveryDomain, /createIdentifier\("assessment_interruption"\)/);
  assert.match(recoveryDomain, /createIdentifier\("assessment_issue"\)/);
  assert.match(recoveryDomain, /createIdentifier\("assessment_recovery"\)/);
  assert.match(recoveryDomain, /export function normalizeAssessmentDraftValue/);
  assert.match(recoveryDomain, /MULTIPLE_CHOICE/);
  assert.match(recoveryDomain, /TRUE_FALSE/);
  assert.match(recoveryDomain, /SHORT_TEXT/);
  assert.match(recoveryDomain, /LONG_TEXT/);
  assert.match(recoveryDomain, /INTEGER/);
  assert.match(recoveryDomain, /DECIMAL/);
  assert.match(recoveryDomain, /2_000|2000/);
  assert.match(recoveryDomain, /20_000|20000/);
  assert.match(recoveryDomain, /128/);
  assert.doesNotMatch(recoveryDomain, /normalizeAssessmentAnswer\s*\(/);
  assert.doesNotMatch(recoveryDomain, /answerKey|rubric|correctness|isCorrect|score/i);
});
