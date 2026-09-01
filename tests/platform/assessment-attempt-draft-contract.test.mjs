import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

async function source(path) {
  return readFile(resolve(path), "utf8").catch(() => "");
}

test("M2.08 adds one mutable current-question draft without expanding attempt lifecycle", async () => {
  const migration = await source("database/migrations/0043_assessment_attempt_drafts.up.sql");
  const down = await source("database/migrations/0043_assessment_attempt_drafts.down.sql");
  const attemptDomain = await source("src/lib/assessment-attempt/assessment-attempt-domain.ts");
  const draftDomain = await source("src/lib/assessment-attempt/assessment-attempt-draft-domain.ts");

  const statusBlock = attemptDomain.match(
    /ASSESSMENT_ATTEMPT_STATUSES\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\s*as const\)/
  );
  assert.ok(statusBlock, "M2.07 attempt status contract must remain present");
  assert.match(statusBlock[1], /"IN_PROGRESS"/);
  assert.match(statusBlock[1], /"SUBMITTED"/);
  assert.doesNotMatch(statusBlock[1], /INTERRUPTED|RECOVERABLE|PAUSED|ABANDONED/);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS assessment_attempt_drafts/i);
  assert.ok(
    /attempt_id\s+TEXT\s+PRIMARY KEY/i.test(migration) ||
      /UNIQUE\s*\(\s*attempt_id\s*\)/i.test(migration),
    "there must be at most one draft row per attempt"
  );

  for (const column of [
    "attempt_id",
    "form_id",
    "form_item_id",
    "position",
    "question_id",
    "question_version_id",
    "question_type",
    "revision",
    "latest_mutation_key",
    "latest_mutation_digest",
    "created_at",
    "updated_at"
  ]) {
    assert.match(migration, new RegExp(`\\b${column}\\b`, "i"), `missing ${column}`);
  }

  assert.match(migration, /revision\s+INTEGER\s+NOT NULL/i);
  assert.match(migration, /revision[^;]*>=\s*1/is);
  assert.match(migration, /char_length\s*\(\s*latest_mutation_key\s*\)/i);
  assert.ok(
    /char_length\s*\(\s*latest_mutation_digest\s*\)\s*=\s*64/i.test(migration) ||
      /octet_length\s*\(\s*latest_mutation_digest\s*\)\s*=\s*32/i.test(migration) ||
      /latest_mutation_digest\s+(?:CHAR|CHARACTER)\s*\(\s*64\s*\)/i.test(migration),
    "mutation digest must have a fixed SHA-256 representation"
  );

  assert.match(migration, /FOREIGN KEY\s*\(\s*attempt_id\s*,\s*form_id\s*\)/i);
  assert.match(migration, /REFERENCES\s+assessment_attempts/i);
  assert.match(
    migration,
    /FOREIGN KEY\s*\(\s*form_id\s*,\s*form_item_id\s*,\s*position\s*,\s*question_id\s*,\s*question_version_id\s*\)/i
  );
  assert.match(migration, /REFERENCES\s+generated_assessment_form_items/i);
  assert.match(
    migration,
    /FOREIGN KEY\s*\(\s*question_id\s*,\s*question_version_id\s*,\s*question_type\s*\)/i
  );
  assert.match(migration, /REFERENCES\s+assessment_question_versions/i);

  for (const questionType of [
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "SHORT_TEXT",
    "LONG_TEXT",
    "INTEGER",
    "DECIMAL"
  ]) {
    assert.match(migration, new RegExp(questionType));
    assert.match(draftDomain, new RegExp(questionType));
  }

  assert.match(draftDomain, /export\s+type\s+AssessmentAttemptDraftValue/);
  assert.match(draftDomain, /export\s+type\s+AssessmentAttemptDraftSnapshot/);
  assert.match(draftDomain, /export\s+function\s+normalizeAssessmentDraftValue/);
  assert.doesNotMatch(draftDomain, /normalizeAssessmentAnswer\s*\(/);
  assert.doesNotMatch(draftDomain, /answerKey|rubric|correctness|isCorrect|score/i);
  assert.doesNotMatch(draftDomain, /localStorage|indexedDB|serviceWorker|crypto\.subtle/i);

  assert.match(down, /DROP TABLE IF EXISTS assessment_attempt_drafts/i);
  assert.doesNotMatch(down, /DROP TABLE IF EXISTS assessment_attempt_answers/i);
  assert.doesNotMatch(down, /DROP TABLE IF EXISTS assessment_attempts/i);
  assert.doesNotMatch(down, /DELETE\s+FROM\s+assessment_attempt_answers/i);
  assert.doesNotMatch(down, /DELETE\s+FROM\s+assessment_attempts/i);
});
