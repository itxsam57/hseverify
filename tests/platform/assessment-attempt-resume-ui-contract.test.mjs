import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagePath = "src/app/worker/(portal)/available-assessments/page.tsx";
const page = readFileSync(pagePath, "utf8");

test("M2.08 Available Assessments GET renders a separate owned In progress resume section", () => {
  assert.match(page, /requirePlatformPermission\s*\(/);
  assert.match(page, /expectedRole:\s*["']worker["']/);
  assert.match(page, /permission:\s*["']worker\.assessments\.read["']/);
  assert.match(page, /getAssessmentAttemptService/);
  assert.match(page, /listOwnedInProgress\s*\(\s*principal\s*\)/);
  assert.match(page, />\s*In progress\s*</i);
  assert.match(page, /Resume assessment/i);
  assert.match(page, /\/worker\/assessments\/\$\{[^}]*attemptId[^}]*\}/);

  assert.doesNotMatch(page, /\.begin\s*\(/);
  assert.doesNotMatch(page, /saveCurrentDraft\s*\(/);
  assert.doesNotMatch(page, /submitCurrentAnswer\s*\(/);
});

test("M2.08 resume listing exposes bounded progress only and never renders draft/question bodies", () => {
  assert.match(page, /currentPosition/);
  assert.match(page, /questionCount/);
  assert.doesNotMatch(page, /currentDraft/);
  assert.doesNotMatch(page, /serverDraft/);
  assert.doesNotMatch(page, /draft\.value|draftValue|answerValue/i);
  assert.doesNotMatch(page, /questionVersionId|questionId|prompt|options/);
  assert.doesNotMatch(page, /SUBMITTED/);
});
