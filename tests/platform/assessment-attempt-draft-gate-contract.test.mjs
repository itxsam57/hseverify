import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
const runnerSource = readFileSync(
  new URL("../../scripts/run-assessment-attempt-tests.mjs", import.meta.url),
  "utf8"
);
const checkerPath = new URL("../../scripts/check-assessment-attempt-drafts.mjs", import.meta.url);

test("M2.08 exposes permanent focused check and aggregate test commands", () => {
  assert.equal(
    packageJson.scripts?.["check:m2-08"],
    "node scripts/check-assessment-attempt-drafts.mjs"
  );
  assert.equal(
    packageJson.scripts?.["test:m2-08"],
    "node scripts/run-assessment-attempt-tests.mjs --m2-08"
  );
  assert.equal(existsSync(checkerPath), true, "focused M2.08 checker must exist");
  assert.match(
    runnerSource,
    /requested\.has\(["']--m2-08["']\)/,
    "assessment attempt runner must expose an aggregate --m2-08 path"
  );
});
