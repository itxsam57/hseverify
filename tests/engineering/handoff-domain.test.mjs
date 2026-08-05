import assert from "node:assert/strict";
import test from "node:test";

import {
  buildManualTests,
  classifyChangedFiles,
  decideHandoffStatus,
  summarizeUnaffectedFeatures
} from "../../scripts/lib/handoff-domain.mjs";

test("engineering-only changes require no manual feature test", () => {
  const result = classifyChangedFiles([
    "docs/engineering/PROJECT-PROFILE.md",
    ".github/workflows/worker-foundation-ci.yml",
    "scripts/run-engineering-gate.mjs",
    "package.json"
  ]);

  assert.equal(result.visibleFeatures.length, 0);
  assert.equal(
    decideHandoffStatus({ gatePassed: true, visibleFeatureCount: 0 }),
    "NO MANUAL FEATURE TEST REQUIRED"
  );
  assert.deepEqual(buildManualTests(result.visibleFeatures), []);
});

test("authentication changes map to exact Worker and Company manual workflows", () => {
  const result = classifyChangedFiles([
    "src/lib/auth/auth-session-service.ts",
    "src/proxy.ts"
  ]);
  const tests = buildManualTests(result.visibleFeatures);

  assert.ok(result.visibleFeatures.some((feature) => feature.id === "AUTH"));
  assert.ok(tests.some((manual) => manual.role === "Worker"));
  assert.ok(tests.some((manual) => manual.role === "Company"));
  assert.match(tests[0].expected, /never visible after logout/);
});

test("authorization changes include all fixed roles and block readiness on gate failure", () => {
  const result = classifyChangedFiles([
    "src/lib/authorization/authorization-service.ts"
  ]);
  const authorization = result.visibleFeatures.find(
    (feature) => feature.id === "AUTHORIZATION"
  );

  assert.deepEqual(authorization.roles, [
    "Worker",
    "Company",
    "Assessor",
    "Verifier",
    "Administrator",
    "Root"
  ]);
  assert.equal(
    decideHandoffStatus({
      gatePassed: false,
      visibleFeatureCount: result.visibleFeatures.length
    }),
    "NOT READY — AUTOMATED ENGINEERING GATE FAILED"
  );
});

test("Company tenant-scope changes generate the exact protected CRUD and copied-role handoff", () => {
  const result = classifyChangedFiles([
    "src/app/company/(portal)/tenant-scope/page.tsx",
    "src/app/company/(portal)/tenant-scope/actions.ts",
    "src/components/company/tenant-scope-demonstration.tsx",
    "src/lib/authorization/company-scope-demonstration-domain.ts"
  ]);
  const feature = result.visibleFeatures.find(
    (item) => item.id === "COMPANY_SCOPE_DEMO"
  );
  const manual = buildManualTests(result.visibleFeatures).find(
    (item) => item.feature === feature.label
  );

  assert.ok(feature);
  assert.deepEqual(feature.roles, ["Company", "Worker"]);
  assert.ok(manual);
  assert.equal(manual.start, "/company/login");
  assert.match(manual.steps.join(" "), /Create one record/);
  assert.match(manual.steps.join(" "), /Edit that record/);
  assert.match(manual.steps.join(" "), /Delete the record/);
  assert.match(manual.steps.join(" "), /\/company\/tenant-scope/);
  assert.match(manual.expected, /current Company tenant/);
  assert.match(manual.refresh, /Do not manually refresh/);
});

test("shared UI changes produce responsive manual coverage and indirect impact", () => {
  const result = classifyChangedFiles([
    "src/components/ui/button.tsx",
    "src/app/design-system.css"
  ]);
  const tests = buildManualTests(result.visibleFeatures);
  const unaffected = summarizeUnaffectedFeatures(result);

  assert.ok(result.visibleFeatures.some((feature) => feature.id === "SHARED_UI"));
  assert.ok(tests.some((manual) => /mobile width/.test(manual.steps.join(" "))));
  assert.ok(!unaffected.includes("Worker Dashboard/Profile"));
});

test("unknown application UI fails safe into a visible manual handoff", () => {
  const result = classifyChangedFiles(["src/app/new-surface/page.tsx"]);

  assert.equal(result.visibleFeatures[0].id, "APPLICATION_UI");
  assert.equal(
    decideHandoffStatus({
      gatePassed: true,
      visibleFeatureCount: result.visibleFeatures.length
    }),
    "READY FOR MANUAL BROWSER TESTING"
  );
});
