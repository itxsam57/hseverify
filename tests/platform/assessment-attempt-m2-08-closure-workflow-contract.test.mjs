import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const exactPullRequestHead = /ref:\s*\$\{\{\s*github\.event\.pull_request\.head\.sha\s*\|\|\s*github\.sha\s*\}\}/;
const exactVerifiedSha = /VERIFIED_SHA:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'\s*&&\s*github\.event\.pull_request\.head\.sha\s*\|\|\s*github\.sha\s*\}\}/;
const exactVerifiedRef = /ref:\s*\$\{\{\s*env\.VERIFIED_SHA\s*\}\}/;

async function readRequired(relativePath) {
  try {
    return await readFile(new URL(relativePath, root), "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      assert.fail(`M2.08 closure workflow is missing required file: ${relativePath}`);
    }
    throw error;
  }
}

for (const [label, path] of [
  ["M2.08 real browser QA", ".github/workflows/m2-08-browser.yml"],
  ["M2.07 real browser QA", ".github/workflows/m2-07-browser.yml"]
]) {
  test(`${label} checks out the exact PR head instead of GitHub's synthetic merge ref`, async () => {
    const workflow = await readRequired(path);
    assert.match(workflow, exactPullRequestHead, `${label} must use pull_request.head.sha on PR runs and github.sha on push/manual runs.`);
  });
}

test("Independent full-system audit binds checkout and evidence identity to one exact verified SHA", async () => {
  const workflow = await readRequired(".github/workflows/independent-full-system-audit.yml");
  assert.match(workflow, exactVerifiedSha, "Independent audit must derive VERIFIED_SHA from the PR head or current non-PR SHA.");
  assert.match(workflow, exactVerifiedRef, "Independent audit checkout must use VERIFIED_SHA.");
});
