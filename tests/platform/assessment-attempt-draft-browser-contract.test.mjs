import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);

async function readRequired(relativePath) {
  try {
    return await readFile(new URL(relativePath, root), "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      assert.fail(`M2.08 real-browser proof is missing required file: ${relativePath}`);
    }
    throw error;
  }
}

function requireAll(source, patterns, label) {
  for (const [pattern, description] of patterns) {
    assert.match(source, pattern, `${label} must ${description}.`);
  }
}

test("M2.08 Chromium harness executes durable draft, interruption, conflict, and secrecy journeys", async () => {
  const script = await readRequired("scripts/m2-08-browser-qa.mjs");

  requireAll(
    script,
    [
      [/from\s+["']playwright["']/, "reuse the repository Playwright/Chromium stack"],
      [/seedBrowserScenario/, "seed authoritative assessment prerequisites"],
      [/loginWorker/, "exercise authenticated Worker sessions"],
      [/waitForSaved|Saved/, "wait for acknowledged server persistence before claiming Saved"],
      [/reload\s*\(/, "reload an in-progress question and prove draft recovery"],
      [/newContext\s*\(/, "open a fresh authenticated browser context"],
      [/localStorage/, "inspect localStorage for answer persistence"],
      [/indexedDB|indexedDB\.databases/, "inspect IndexedDB for answer persistence"],
      [/caches\.(?:keys|open)|CacheStorage/, "inspect browser cache storage for answer persistence"],
      [/Save and exit/i, "exercise Save and exit"],
      [/\/worker\/available-assessments/, "return to the Worker assessment surface"],
      [/Resume assessment/i, "resume through the visible In progress control"],
      [/route\s*\(|abort\s*\(|fulfill\s*\(/, "induce a draft-save transport failure or delay"],
      [/Not saved/i, "verify truthful failed-save state"],
      [/Emergency exit/i, "exercise bounded Emergency exit"],
      [/Use saved version/i, "exercise deterministic saved-version conflict resolution"],
      [/Replace saved version with this tab/i, "exercise deterministic replacement CAS resolution"],
      [/Next/, "commit one answer and advance exactly one position"],
      [/Submit assessment/, "submit the final answer"],
      [/assessment_attempt_drafts/, "verify durable draft rows are created and removed at the database boundary"],
      [/stale|old-position/i, "probe delayed stale autosave after progression"],
      [/cross[- ]Worker|other Worker|second Worker/i, "probe direct access from another Worker"],
      [/assertNoAssessmentSecrets/, "scan browser HTML and retained network payloads for forbidden assessment secrets"],
      [/answerKey|answer_key/, "scan for answer-key leakage"],
      [/rubric/, "scan for rubric leakage"],
      [/score/, "scan for scoring leakage"],
      [/pageerror/, "capture unexpected page errors"],
      [/console/, "capture unexpected browser console errors or hydration warnings"],
      [/caret:\s*["']initial["']/, "avoid harness-induced caret hydration mutations in screenshots"]
    ],
    "M2.08 browser harness"
  );
});

test("M2.08 browser workflow runs targeted tests and the real Chromium script at the exact checked-out SHA", async () => {
  const workflow = await readRequired(".github/workflows/m2-08-browser.yml");

  requireAll(
    workflow,
    [
      [/name:\s*M2\.08 real browser QA/, "have a dedicated M2.08 browser identity"],
      [/feat\/m2-08-server-draft-recovery/, "run on the active M2.08 feature branch"],
      [/branches:\s*\[[^\]]*main[^\]]*\]/, "cover main where appropriate"],
      [/actions\/checkout@v6/, "use the repository checkout action"],
      [/ref:\s*\$\{\{\s*github\.sha\s*\}\}/, "pin checkout to the exact workflow SHA"],
      [/git rev-parse HEAD/, "assert the checked-out commit before browser execution"],
      [/npm ci --no-audit --no-fund/, "install locked application dependencies"],
      [/npm run db:migrate/, "migrate a clean isolated browser database"],
      [/playwright@1\.55\.0/, "reuse the repository-pinned Playwright version"],
      [/playwright install --with-deps chromium/, "install the real Chromium runtime"],
      [/npm run test:m2-08/, "run the permanent targeted M2.08 gate at the browser head"],
      [/node scripts\/m2-08-browser-qa\.mjs --seed-only/, "seed authoritative browser fixtures before application startup"],
      [/npm run dev -- --hostname 127\.0\.0\.1 --port 3004/, "start the real Next.js application"],
      [/node scripts\/m2-08-browser-qa\.mjs(?! --seed-only)/, "directly execute the M2.08 browser journey rather than trusting checkpoint names"],
      [/server\.log|browser-server\.log/, "retain the real application server log"],
      [/grep|check.*server.*log|server.*error/i, "fail on unexpected server-side browser-journey errors"],
      [/artifacts\/m2-08-browser/, "retain M2.08 results, screenshots, and traffic evidence"],
      [/actions\/upload-artifact@v4/, "upload browser evidence even when the journey fails"]
    ],
    "M2.08 browser workflow"
  );

  const targetedIndex = workflow.indexOf("npm run test:m2-08");
  const seedIndex = workflow.indexOf("node scripts/m2-08-browser-qa.mjs --seed-only");
  const serverIndex = workflow.indexOf("npm run dev -- --hostname 127.0.0.1 --port 3004");
  const journeyIndex = workflow.lastIndexOf("node scripts/m2-08-browser-qa.mjs");
  assert.ok(targetedIndex >= 0, "M2.08 targeted gate must execute in the browser workflow.");
  assert.ok(seedIndex > targetedIndex, "Authoritative browser seed must run after the targeted gate.");
  assert.ok(serverIndex > seedIndex, "Real Next.js startup must occur after browser fixture seeding.");
  assert.ok(journeyIndex > serverIndex, "The real M2.08 browser journey must execute after application startup.");
});
