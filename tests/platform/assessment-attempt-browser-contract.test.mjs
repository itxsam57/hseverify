import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);

async function readRequired(relativePath) {
  try {
    return await readFile(new URL(relativePath, root), "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      assert.fail(`M2.07 browser proof is missing required file: ${relativePath}`);
    }
    throw error;
  }
}

function requireAll(source, patterns, label) {
  for (const [pattern, description] of patterns) {
    assert.match(source, pattern, `${label} must ${description}.`);
  }
}

test("M2.07 browser proof drives the real one-question Worker journey and scans for secret leakage", async () => {
  const script = await readRequired("scripts/m2-07-browser-qa.mjs");

  requireAll(
    script,
    [
      [/from\s+["']playwright["']/, "reuse the repository Playwright/Chromium browser stack"],
      [/HSE_BROWSER_BASE_URL/, "run against the real Next.js application"],
      [/seedBrowserScenario/, "provision authoritative assessment prerequisites before the journey"],
      [/loginWorker/, "exercise authenticated Worker sessions"],
      [/\/worker\/available-assessments/, "start from Available assessments"],
      [/Start assessment/, "launch through the visible POST control"],
      [/MULTIPLE_CHOICE/, "exercise a multiple-choice question"],
      [/SHORT_TEXT|LONG_TEXT/, "exercise a written-answer question"],
      [/Submit assessment/, "exercise the final submission control"],
      [/submitted/i, "verify the submitted receipt"],
      [/reload\s*\(/, "refresh an in-progress attempt and verify committed position recovery"],
      [/cross[- ]Worker|other Worker|second Worker/i, "exercise direct attempt access from a different Worker"],
      [/assertFuturePromptAbsent/, "prove future question prompts are absent before server commit"],
      [/assertNoAssessmentSecrets/, "scan delivered HTML and action/network payloads for forbidden assessment secrets"],
      [/answerKey|answer_key/, "include answer-key leakage in the forbidden-secret scan"],
      [/rubric/, "include rubric leakage in the forbidden-secret scan"],
      [/score/, "include score leakage in the forbidden-secret scan"],
      [/correctness|correct/, "include correctness leakage in the forbidden-secret scan"],
      [/internal attempt metadata/i, "classify internal attempt metadata as browser-forbidden"],
      [/workerAccountId/, "scan for internal Worker account identity leakage"],
      [/formId/, "scan for internal generated-form identity leakage"],
      [/startedAt/, "scan for internal attempt lifecycle timestamp leakage"]
    ],
    "M2.07 browser harness"
  );
});

test("M2.07 browser workflow seeds first, runs the real app, and preserves browser evidence", async () => {
  const workflow = await readRequired(".github/workflows/m2-07-browser.yml");

  requireAll(
    workflow,
    [
      [/name:\s*M2\.07 real browser QA/, "have a dedicated M2.07 browser identity"],
      [/feat\/m2-07-assessment-window/, "run on the M2.07 feature branch"],
      [/npm ci --no-audit --no-fund/, "install the locked repository dependencies"],
      [/npm run db:migrate/, "migrate a clean browser database"],
      [/playwright@1\.55\.0/, "reuse the pinned Playwright version already used by repository browser QA"],
      [/playwright install --with-deps chromium/, "install the Chromium runtime"],
      [/node scripts\/m2-07-browser-qa\.mjs --seed-only/, "seed authoritative browser fixtures before the application starts"],
      [/npm run dev -- --hostname 127\.0\.0\.1 --port 3003/, "start the real Next.js development server"],
      [/node scripts\/m2-07-browser-qa\.mjs(?! --seed-only)/, "run the real browser journey after startup"],
      [/artifacts\/m2-07-browser/, "collect M2.07 browser evidence"],
      [/actions\/upload-artifact@v4/, "upload the browser evidence even when the journey fails"]
    ],
    "M2.07 browser workflow"
  );

  const seedIndex = workflow.indexOf("node scripts/m2-07-browser-qa.mjs --seed-only");
  const serverIndex = workflow.indexOf("npm run dev -- --hostname 127.0.0.1 --port 3003");
  const journeyIndex = workflow.lastIndexOf("node scripts/m2-07-browser-qa.mjs");
  assert.ok(seedIndex >= 0 && serverIndex > seedIndex, "M2.07 browser seed must finish before the real application starts.");
  assert.ok(journeyIndex > serverIndex, "M2.07 real browser journey must run after the application starts.");
});

test("M2.08 browser projection carries only the current safe server draft", async () => {
  const domain = await readRequired("src/lib/assessment-attempt/assessment-attempt-domain.ts");
  const projection = await readRequired("src/lib/assessment-attempt/assessment-attempt-client-view.ts");

  requireAll(
    domain,
    [
      [/AssessmentAttemptClientDraft/, "define a bounded client draft type"],
      [/currentDraft\s*:/, "include the current draft on the client view"],
      [/value\s*:\s*string\s*\|\s*boolean\s*\|\s*null/, "limit client draft values to edit-state primitives"],
      [/revision\s*:\s*number/, "expose only the accepted server revision"],
      [/updatedAt\s*:\s*string/, "expose the server acknowledgement timestamp"]
    ],
    "M2.08 client draft domain"
  );

  requireAll(
    projection,
    [
      [/currentDraft/, "project the current draft explicitly"],
      [/value\s*:/, "project only the draft value"],
      [/revision\s*:/, "project only the draft revision"],
      [/updatedAt\s*:/, "project only the draft timestamp"]
    ],
    "M2.08 client draft projection"
  );

  const draftProjection = projection.slice(projection.indexOf("currentDraft"));
  for (const forbidden of ["mutationKey", "mutationDigest", "formItemId", "formId", "answerKey", "rubric", "score", "correctness"]) {
    assert.equal(draftProjection.includes(forbidden), false, `M2.08 client draft projection must not expose ${forbidden}.`);
  }
});
