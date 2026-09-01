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

test("M2.08 initializes the editable answer only from the current acknowledged server draft", () => {
  requireText(/view\.currentDraft/, "workspace must initialize from the server-projected current draft");
  requireText(/currentDraft\?\.value|currentDraft\s*\?/, "workspace must handle a missing draft explicitly");
  requireText(/currentDraft\?\.revision|currentDraft\.revision/, "workspace must seed the acknowledged CAS revision");

  for (const type of [
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "SHORT_TEXT",
    "LONG_TEXT",
    "INTEGER",
    "DECIMAL"
  ]) {
    requireText(new RegExp(type), `workspace must preserve ${type} draft editing`);
  }
});

test("M2.08 autosaves raw edit state through the draft action without browser persistence", () => {
  requireText(/saveAssessmentDraftAction/, "workspace must use the dedicated non-commit draft action");
  requireText(/expectedRevision/, "autosave must send CAS revision metadata");
  requireText(/mutationKey/, "autosave must send a mutation identity");
  requireText(/JSON\.stringify\s*\(/, "draft value must be encoded losslessly for the action boundary");
  requireText(/setTimeout\s*\(/, "editing must use a debounce before routine autosave");
  requireText(/clearTimeout\s*\(/, "superseded debounce work must be cancelled");

  requireText(
    /id=["']assessment-integer-answer["'][\s\S]{0,220}type=["']text["'][\s\S]{0,220}inputMode=["']numeric["']/,
    "integer editing must use a text-backed numeric keyboard so partial states such as - are observable"
  );
  requireText(
    /id=["']assessment-decimal-answer["'][\s\S]{0,220}type=["']text["'][\s\S]{0,220}inputMode=["']decimal["']/,
    "decimal editing must use a text-backed decimal keyboard so states such as 1. remain lossless"
  );

  forbidText(/localStorage/i, "assessment answers must not persist in localStorage");
  forbidText(/sessionStorage/i, "assessment answers must not persist in sessionStorage");
  forbidText(/indexedDB/i, "assessment answers must not persist in IndexedDB");
  forbidText(/serviceWorker/i, "assessment answers must not use a service-worker cache");
  forbidText(/parseFloat\s*\(|parseInt\s*\(/, "partial numeric draft strings must not be coerced during autosave");
  forbidText(/Number\s*\([^)]*(?:draft|answer)/i, "partial numeric draft strings must not be coerced during autosave");
});

test("M2.08 persistence status is truthful under races, network failure and CAS conflict", () => {
  requireText(/useRef\s*\(/, "autosave must retain request/edit identity across renders");
  requireText(/Saving…|Saving\.\.\./, "editing must immediately expose a saving state");
  requireText(/Saved/, "an acknowledged latest edit must expose a saved state");
  requireText(/Not saved[^\n]*reconnect/i, "network failure must truthfully expose that the edit is not saved");
  requireText(/conflict/i, "stale CAS state must enter a controlled conflict state");
  requireText(/Use saved version/i, "conflict UI must let the Worker restore the acknowledged server draft");
  requireText(/Replace saved version with this tab/i, "conflict UI must let the Worker explicitly retry this tab against the latest revision");
  requireText(/serverDraft/, "conflict resolution must use the server-returned draft snapshot");
  requireText(/revision/, "conflict replacement must use the latest acknowledged revision instead of force-writing");
  requireText(/role=["']status["']|aria-live=/, "autosave status must be announced accessibly");

  forbidText(/forceWrite|forceSave|overwriteWithoutRevision/i, "conflict resolution must not introduce a force-write path");
});

test("M2.08 preserves the accepted one-question commit controls while adding autosave", () => {
  requireText(/currentQuestion/, "workspace must remain bound to one current question");
  requireText(/["']Next["']/, "non-final commit control must remain Next");
  requireText(/Submit assessment/, "final commit control must remain Submit assessment");
  requireText(/submitAssessmentAnswerAction/, "explicit answer commit must remain on the existing commit action");
  forbidText(/>\s*Previous\s*</i, "M2.08 must not add committed-answer back navigation");
});

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
