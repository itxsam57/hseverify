import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspacePath = "src/components/worker/assessment-workspace.tsx";
const workspace = readFileSync(workspacePath, "utf8");

function requireText(pattern, message) {
  assert.match(workspace, pattern, message);
}

function forbidText(pattern, message) {
  assert.doesNotMatch(workspace, pattern, message);
}

test("M2.08 Save and exit flushes the exact current edit before navigation and never commits it", () => {
  requireText(/useRouter\s*\(/, "Save and exit must navigate through the existing client router");
  requireText(/Save and exit/i, "active assessment must expose a distinct Save and exit control");
  requireText(/async function flushCurrentEditForExit\s*\(/, "Save and exit needs an explicit exact-edit flush boundary");
  requireText(/acknowledgedEditVersionRef\.current/, "exit flush must verify the exact edit version was acknowledged");
  requireText(/pendingRequestRef\.current/, "exit flush must reuse an outstanding mutation identity when retrying the same edit");
  requireText(/await\s+runSave\s*\(/, "exit flush must use the normal draft-save path");
  requireText(/async function saveAndExit\s*\(/, "Save and exit must have a dedicated non-submit handler");
  requireText(/await\s+flushCurrentEditForExit\s*\(/, "Save and exit must wait for the exact draft flush");
  requireText(/router\.push\s*\(\s*["']\/worker\/available-assessments["']\s*\)/, "navigation must return to the Worker assessment surface only after save acknowledgement");
  requireText(/Not saved[^\n]*(?:stay|page|try again)/i, "failed Save and exit must keep truthful unsaved copy");
  forbidText(/saveAndExit[\s\S]{0,900}submitAssessmentAnswerAction/, "Save and exit must not call the committed-answer action");
});

test("M2.08 Emergency exit is bounded, best-effort, non-committing and explicit about the recovery guarantee", () => {
  requireText(/Emergency exit/i, "active assessment must always expose Emergency exit");
  requireText(/EMERGENCY_EXIT_SAVE_WINDOW_MS/, "emergency save attempt must have a short bounded client-side window");
  requireText(/async function emergencyExit\s*\(/, "Emergency exit must have a dedicated handler");
  requireText(/Promise\.race\s*\(/, "Emergency exit must not wait indefinitely for an unreachable save");
  requireText(/saveAssessmentDraftAction|runSave\s*\(/, "Emergency exit may make a best-effort normal draft save");
  requireText(/last server-confirmed Saved version is guaranteed recoverable/i, "Emergency exit copy must state the exact recovery guarantee");
  requireText(/router\.push\s*\(\s*["']\/worker\/available-assessments["']\s*\)/, "Emergency exit must leave the active attempt surface");
  forbidText(/emergencyExit[\s\S]{0,900}submitAssessmentAnswerAction/, "Emergency exit must never commit or advance an answer");
});
