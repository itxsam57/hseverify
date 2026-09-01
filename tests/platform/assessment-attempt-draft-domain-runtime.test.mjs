import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";

const dist = process.env.HSE_ASSESSMENT_ATTEMPT_DRAFT_RUNTIME_DIST;
assert.ok(dist, "HSE_ASSESSMENT_ATTEMPT_DRAFT_RUNTIME_DIST is required");

const require = createRequire(import.meta.url);
const domain = require(
  resolve(dist, "assessment-attempt", "assessment-attempt-draft-domain.js")
);

assert.equal(
  typeof domain.normalizeAssessmentDraftValue,
  "function",
  "draft domain must export normalizeAssessmentDraftValue"
);

function normalizedValue(questionType, rawValue, options = null) {
  const result = domain.normalizeAssessmentDraftValue(questionType, rawValue, options);
  if (
    result !== null &&
    typeof result === "object" &&
    Object.prototype.hasOwnProperty.call(result, "value")
  ) {
    return result.value;
  }
  return result;
}

function overCodePointLimit(limit) {
  return "😀".repeat(limit + 1);
}

test("draft normalization preserves exact editable states instead of committed-answer normalization", () => {
  assert.equal(normalizedValue("MULTIPLE_CHOICE", null, ["A", "B"]), null);
  assert.equal(normalizedValue("MULTIPLE_CHOICE", "A", ["A", "B"]), "A");
  assert.throws(() => normalizedValue("MULTIPLE_CHOICE", "C", ["A", "B"]));

  assert.equal(normalizedValue("TRUE_FALSE", null), null);
  assert.equal(normalizedValue("TRUE_FALSE", true), true);
  assert.equal(normalizedValue("TRUE_FALSE", false), false);
  assert.throws(() => normalizedValue("TRUE_FALSE", "false"));

  assert.equal(normalizedValue("SHORT_TEXT", ""), "");
  assert.equal(normalizedValue("SHORT_TEXT", "  keep whitespace  "), "  keep whitespace  ");
  assert.equal(normalizedValue("LONG_TEXT", "\nexact text\n"), "\nexact text\n");
  assert.throws(() => normalizedValue("SHORT_TEXT", overCodePointLimit(2_000)));
  assert.throws(() => normalizedValue("LONG_TEXT", overCodePointLimit(20_000)));

  for (const value of ["", "-", "+", "0", "001", "123"]) {
    assert.equal(normalizedValue("INTEGER", value), value);
  }
  assert.throws(() => normalizedValue("INTEGER", 1));
  assert.throws(() => normalizedValue("INTEGER", "1".repeat(129)));

  for (const value of ["", "-", ".", "1.", "-.", "0.00", "+1.2"]) {
    assert.equal(normalizedValue("DECIMAL", value), value);
  }
  assert.throws(() => normalizedValue("DECIMAL", 1.5));
  assert.throws(() => normalizedValue("DECIMAL", "1".repeat(129)));
});
