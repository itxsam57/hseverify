import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actionPath = "src/app/worker/(portal)/assessments/[attemptId]/actions.ts";
const action = readFileSync(actionPath, "utf8");

function functionBody(name) {
  const start = action.indexOf(`export async function ${name}`);
  assert.ok(start >= 0, `${name} must exist`);
  const nextExport = action.indexOf("\nexport async function ", start + 1);
  return action.slice(start, nextExport >= 0 ? nextExport : action.length);
}

function requireWorkerPermission(sourceText) {
  assert.match(sourceText, /requirePlatformPermission\s*\(/);
  assert.match(sourceText, /expectedRole:\s*["']worker["']/);
  assert.match(sourceText, /permission:\s*["']worker\.assessments\.read["']/);
}

test("M2.08 draft action accepts only current-question stale guards, raw draft edit state and CAS metadata", () => {
  const save = functionBody("saveAssessmentDraftAction");
  assert.match(action, /^[\s\S]*["']use server["']/);
  requireWorkerPermission(save);

  for (const field of [
    "attemptId",
    "position",
    "questionVersionId",
    "draft",
    "expectedRevision",
    "mutationKey"
  ]) {
    assert.match(save, new RegExp(`formData\\.get\\(["']${field}["']\\)`));
  }

  for (const forbidden of [
    "workerAccountId",
    "formId",
    "formItemId",
    "questionId"
  ]) {
    assert.doesNotMatch(
      save,
      new RegExp(`formData\\.get\\(["']${forbidden}["']\\)`),
      `draft action must not accept browser authority field ${forbidden}`
    );
  }

  assert.match(save, /JSON\.parse\s*\(\s*encodedDraft\s*\)/);
  assert.doesNotMatch(save, /parseFloat\s*\(|parseInt\s*\(|Number\s*\(\s*encodedDraft/);
  assert.match(save, /saveCurrentDraft\s*\(/);
  assert.doesNotMatch(save, /submitCurrentAnswer\s*\(/);
  assert.doesNotMatch(save, /redirect\s*\(/, "draft save must return bounded state instead of navigating");
});

test("M2.08 draft action returns bounded safe save/conflict state and maps expected failures coarsely", () => {
  const save = functionBody("saveAssessmentDraftAction");

  assert.match(action, /export type AssessmentDraftActionState/);
  for (const status of ["idle", "saved", "error", "conflict"]) {
    assert.match(action, new RegExp(`["']${status}["']`));
  }
  assert.match(action, /serverDraft\s*:/);
  assert.match(action, /revision/);
  assert.match(action, /updatedAt/);

  assert.match(save, /AssessmentAttemptConflictError/);
  assert.match(save, /AssessmentAttemptInputError/);
  assert.match(save, /AssessmentAttemptAccessError/);
  assert.match(save, /getOwnedView\s*\(/, "same-question conflict must recover latest safe server state");
  assert.match(save, /currentQuestion/);
  assert.match(save, /currentDraft/);
  assert.match(save, /position/);
  assert.match(save, /questionVersionId/);

  assert.doesNotMatch(save, /console\.(?:log|error|warn|info)\s*\(/);
  assert.doesNotMatch(save, /String\s*\(\s*error\s*\)/);
  assert.doesNotMatch(save, /error\.message/);
});

test("M2.08 keeps submitAssessmentAnswerAction as the only commit action", () => {
  const save = functionBody("saveAssessmentDraftAction");
  const submit = functionBody("submitAssessmentAnswerAction");

  assert.match(submit, /submitCurrentAnswer\s*\(/);
  assert.match(submit, /redirect\s*\(\s*`\/worker\/assessments\/\$\{/);
  assert.doesNotMatch(save, /submitCurrentAnswer\s*\(/);

  const commitCalls = action.match(/\.submitCurrentAnswer\s*\(/g) ?? [];
  assert.equal(commitCalls.length, 1, "only the existing submit action may commit an answer");
});
