import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "docs/engineering/01-MASTER-INSTRUCTIONS.md",
  "docs/engineering/02-ENGINEERING-STANDARD.md",
  "docs/engineering/03-TESTING-STANDARD.md",
  "docs/engineering/04-SECURITY-STANDARD.md",
  "docs/engineering/05-UI-WORKFLOW-STANDARD.md",
  "docs/engineering/06-AI-DEVELOPER-WORKFLOW.md",
  "docs/engineering/07-MANUAL-TEST-HANDOFF-STANDARD.md",
  "docs/engineering/08-CI-COST-AND-CREDIT-STANDARD.md",
  "docs/engineering/PROJECT-PROFILE.md",
  "docs/engineering/PROJECT-TEST-MATRIX.md",
  "docs/engineering/REGRESSION-REGISTER.md",
  "docs/engineering/HSE_BUILD_MEMORY.md",
  "docs/engineering/M1_06_SUBUNIT4_REGRESSIONS.md",
  "docs/engineering/M1_06_SUBUNIT5_REGRESSIONS.md",
  "docs/engineering/M1_07_SUBUNIT6_REGRESSIONS.md",
  "docs/testing/results/M1_06_SIGNED_ACCESS_FINAL_ACCEPTANCE.md",
  "docs/testing/results/M1_06_FINAL_ACCEPTANCE.md",
  "docs/testing/results/M1_06_FINAL_CLOSURE.md",
  "docs/testing/results/M1_07_SUBUNIT1_ACCEPTANCE.md",
  "docs/testing/results/M1_07_SUBUNIT2_ACCEPTANCE.md",
  "docs/testing/results/M1_07_SUBUNIT3_ACCEPTANCE.md",
  "docs/testing/results/M1_07_SUBUNIT4_ACCEPTANCE.md",
  "docs/testing/results/M1_07_SUBUNIT5_ACCEPTANCE.md",
  "docs/testing/results/M1_07_FINAL_ACCEPTANCE.md",
  "docs/testing/results/M1_07_FINAL_CLOSURE.md",
  "docs/NEXT_BUILD_UNIT.md",
  "docs/IMPLEMENTATION_STATUS.md",
  "docs/bookmarks/MILESTONE_PATH.md",
  "docs/bookmarks/LATER.md",
  "scripts/lib/handoff-domain.mjs",
  "scripts/report-manual-handoff.mjs",
  "scripts/run-engineering-gate.mjs",
  "scripts/check-m1-06-final-acceptance.mjs",
  "scripts/run-m1-06-final-tests.mjs",
  "scripts/check-worker-identity-foundation.mjs",
  "scripts/check-worker-identity-draft.mjs",
  "scripts/check-worker-identity-corrections.mjs",
  "scripts/run-worker-identity-correction-tests.mjs",
  "tests/engineering/handoff-domain.test.mjs",
  "tests/platform/m1-07-final-acceptance.test.mjs",
  "tests/platform/worker-identity-submission-readiness.test.mjs"
];

function read(path) {
  return readFileSync(resolve(path), "utf8");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireMarker(text, marker, label) {
  if (!text.includes(marker)) fail(`${label} is missing required evidence: ${marker}`);
}

function forbidMarker(text, marker, label) {
  if (text.includes(marker)) fail(`${label} contains forbidden bypass/stale evidence: ${marker}`);
}

function requirePattern(text, pattern, label, fact) {
  if (!pattern.test(text)) fail(`${label} is missing current fact: ${fact}`);
}

const missing = requiredFiles.filter((path) => !existsSync(resolve(path)));
if (missing.length > 0) {
  fail(`Engineering automation installation is incomplete:\n${missing.join("\n")}`);
}

const packageDocument = JSON.parse(read("package.json"));
const scripts = packageDocument.scripts ?? {};
for (const command of [
  "verify:quick",
  "verify:affected",
  "verify:full",
  "test:unit",
  "test:integration",
  "test:e2e",
  "check:engineering",
  "test:engineering",
  "check:m1-06-final",
  "test:m1-06-final",
  "check:worker-identity",
  "test:worker-identity",
  "check:worker-identity-draft",
  "test:worker-identity-draft",
  "check:worker-identity-corrections",
  "test:worker-identity-corrections",
  "test:m1-07-final",
  "report:handoff"
]) {
  if (!scripts[command]) fail(`package.json is missing required engineering command: ${command}`);
}
if (scripts["verify:full"] !== "node scripts/run-engineering-gate.mjs") {
  fail("verify:full must use the fail-closed engineering gate orchestrator.");
}
for (const marker of [
  "check:engineering",
  "test:engineering",
  "check:m1-06-final",
  "test:m1-06-final",
  "check:worker-identity",
  "test:worker-identity",
  "check:worker-identity-draft",
  "test:worker-identity-draft",
  "check:worker-identity-corrections",
  "test:worker-identity-corrections",
  "test:m1-07-final",
  "typecheck",
  "lint",
  "build"
]) requireMarker(scripts.check, marker, "Complete application gate");
for (const marker of [
  "check:engineering",
  "check:m1-06-final",
  "check:worker-identity",
  "check:worker-identity-draft",
  "check:worker-identity-corrections",
  "typecheck",
  "lint"
]) requireMarker(scripts["verify:quick"], marker, "Quick engineering gate");
for (const marker of [
  "test:m1-06-final",
  "test:worker-identity",
  "test:worker-identity-draft",
  "test:worker-identity-corrections",
  "test:m1-07-final"
]) requireMarker(scripts["test:integration"], marker, "Integration test aggregate");

const workflow = read(".github/workflows/worker-foundation-ci.yml");
for (const marker of [
  "pull_request:",
  "push:",
  "workflow_dispatch:",
  "concurrency:",
  "cancel-in-progress: true",
  "cache: npm",
  "fetch-depth: 0",
  "VERIFIED_SHA:",
  "github.event.pull_request.head.sha",
  "ref: ${{ env.VERIFIED_SHA }}",
  "HSE_RELEASE_SHA: ${{ env.VERIFIED_SHA }}",
  "hseverify-engineering-${{ env.VERIFIED_SHA }}",
  "npm run verify:full",
  "retention-days: 7",
  "if: always()"
]) requireMarker(workflow, marker, "Engineering CI workflow");
for (const forbidden of [
  "continue-on-error",
  "|| true",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "playwright install"
]) forbidMarker(workflow, forbidden, "Engineering CI workflow");

const gitignore = read(".gitignore");
for (const marker of [
  "/.engineering/",
  "/.reports/",
  "/playwright-report/",
  "/test-results/",
  "/screenshots/",
  "/videos/",
  "/traces/",
  "/full-terminal-logs/"
]) requireMarker(gitignore, marker, ".gitignore");

const nextBuild = read("docs/NEXT_BUILD_UNIT.md");
const implementationStatus = read("docs/IMPLEMENTATION_STATUS.md");
const milestonePath = read("docs/bookmarks/MILESTONE_PATH.md");
const profile = read("docs/engineering/PROJECT-PROFILE.md");
const matrix = read("docs/engineering/PROJECT-TEST-MATRIX.md");
const buildMemory = read("docs/engineering/HSE_BUILD_MEMORY.md");
const later = read("docs/bookmarks/LATER.md");

// Brick-level context is permanent engineering authority after final closure.
for (const [label, text] of [
  ["NEXT_BUILD_UNIT.md", nextBuild],
  ["IMPLEMENTATION_STATUS.md", implementationStatus],
  ["MILESTONE_PATH.md", milestonePath],
  ["PROJECT-PROFILE.md", profile],
  ["HSE_BUILD_MEMORY.md", buildMemory]
]) {
  requirePattern(text, /(?:7\s+of\s+12|7\s*\/\s*12)/i, label, "Milestone 1 progress 7/12");
  requirePattern(text, /M1\.07[\s\S]{0,280}\bDONE\b/i, label, "M1.07 DONE");
  requirePattern(text, /M1\.08[\s\S]{0,320}\bREADY TO BUILD\b/i, label, "M1.08 READY TO BUILD");
}
for (const [label, text] of [
  ["NEXT_BUILD_UNIT.md", nextBuild],
  ["MILESTONE_PATH.md", milestonePath]
]) {
  requirePattern(text, /M1\.09[\s\S]{0,320}\bBLOCKED\b/i, label, "M1.09 remains blocked");
}
for (const [label, text] of [
  ["IMPLEMENTATION_STATUS.md", implementationStatus],
  ["MILESTONE_PATH.md", milestonePath]
]) {
  forbidMarker(text, "M1.07 Worker Onboarding and Identity Engine — **IN PROGRESS**", label);
}

for (const marker of [
  "TM-026C",
  "Authorized signed preview/download",
  "TM-026D",
  "Complete M1.06 cumulative isolation/migration/recovery acceptance",
  "TM-027",
  "Worker Identity Engine and permanent Worker ID",
  "TM-028",
  "Company registration/verification"
]) requireMarker(matrix, marker, "PROJECT-TEST-MATRIX.md");
requirePattern(matrix, /TM-027[^\n]*\|\s*PASS\s*\|/i, "PROJECT-TEST-MATRIX.md", "TM-027 PASS");
requirePattern(matrix, /TM-028[^\n]*\|\s*READY TO BUILD\s*\|/i, "PROJECT-TEST-MATRIX.md", "TM-028 READY TO BUILD");

for (const marker of [
  "M2.13 — Decision Engine",
  "M3.12 — Production Launch and Operational Handover",
  "37 bricks total",
  "7 of 12"
]) requireMarker(milestonePath, marker, "MILESTONE_PATH.md");
for (const stale of [
  "M2.01 through M2.15",
  "M3.01 through M3.10 remain frozen"
]) forbidMarker(milestonePath, stale, "MILESTONE_PATH.md");

const subunit4Regressions = read("docs/engineering/M1_06_SUBUNIT4_REGRESSIONS.md");
const subunit5Regressions = read("docs/engineering/M1_06_SUBUNIT5_REGRESSIONS.md");
const m107S6Regressions = read("docs/engineering/M1_07_SUBUNIT6_REGRESSIONS.md");
for (let id = 55; id <= 69; id += 1) {
  requireMarker(subunit4Regressions, `REG-${String(id).padStart(3, "0")}`, "M1.06 Subunit 4 regression addendum");
}
for (const id of ["REG-070", "REG-071", "REG-072"]) {
  requireMarker(subunit5Regressions, id, "M1.06 Subunit 5 regression addendum");
}
for (const id of ["REG-077", "REG-078", "REG-079"]) {
  requireMarker(m107S6Regressions, id, "M1.07 Subunit 6 regression addendum");
}

const signedAccessAcceptance = read("docs/testing/results/M1_06_SIGNED_ACCESS_FINAL_ACCEPTANCE.md");
const m106FinalAcceptance = read("docs/testing/results/M1_06_FINAL_ACCEPTANCE.md");
const m106FinalClosure = read("docs/testing/results/M1_06_FINAL_CLOSURE.md");
for (const marker of [
  "b370142658238b47d842366f1af343f72533d0b1",
  "d03ce5322c2ffa0214c90ee5dc19c15e22da9d51",
  "NOT REQUIRED — no browser-visible product surface"
]) requireMarker(signedAccessAcceptance, marker, "M1.06 signed-access acceptance");
for (const marker of [
  "86d135f87a2a2b53f12b8d5b1a2438944cd426fc",
  "31362444454",
  "4ee689e244c938d04a7db3d58306cff8e20b6213",
  "31362848897",
  "REG-070",
  "REG-071",
  "REG-072"
]) requireMarker(m106FinalAcceptance, marker, "M1.06 final acceptance");
for (const marker of [
  "03ac4ac48ee8477833999829c56f829365b92a9e",
  "31363206957",
  "M1.06: IN PROGRESS -> DONE",
  "M1.07: BLOCKED -> READY TO BUILD"
]) requireMarker(m106FinalClosure, marker, "M1.06 final closure");

const s1Acceptance = read("docs/testing/results/M1_07_SUBUNIT1_ACCEPTANCE.md");
const s2Acceptance = read("docs/testing/results/M1_07_SUBUNIT2_ACCEPTANCE.md");
const s3Acceptance = read("docs/testing/results/M1_07_SUBUNIT3_ACCEPTANCE.md");
const s4Acceptance = read("docs/testing/results/M1_07_SUBUNIT4_ACCEPTANCE.md");
const s5Acceptance = read("docs/testing/results/M1_07_SUBUNIT5_ACCEPTANCE.md");
const m107FinalAcceptance = read("docs/testing/results/M1_07_FINAL_ACCEPTANCE.md");
const m107FinalClosure = read("docs/testing/results/M1_07_FINAL_CLOSURE.md");
for (const marker of [
  "f7ca497d5becdf7f0a828943c833a8e8915278b6",
  "31374028751",
  "19a5ccc877834e78a6568a75099484aebdec0d1c",
  "31374492294",
  "REG-073",
  "REG-074"
]) requireMarker(s1Acceptance, marker, "M1.07 S1 acceptance");
for (const marker of [
  "29350dd47b51471462e21cdebbe6f5b67ebc2c18",
  "31378294472",
  "61bdbde805ac4e27ade7a9c787559ff87b2dfb9d",
  "31378748392"
]) requireMarker(s2Acceptance, marker, "M1.07 S2 acceptance");
for (const marker of [
  "db40d8be93b1ea9064f86a16e2e1915d11b67d96",
  "31384894092",
  "REG-075"
]) requireMarker(s3Acceptance, marker, "M1.07 S3 acceptance");
for (const marker of [
  "f606caec4844fe1886e4a2365905f353b1c0d896",
  "31409916231"
]) requireMarker(s4Acceptance, marker, "M1.07 S4 acceptance");
for (const marker of [
  "8d7d3485a4d1f8017e0b5f0dab46ef8d9be5cb8c",
  "31415441023",
  "b7e9b7cd68a7ba4fd6227bf266c6fa89c0a2fd0a"
]) requireMarker(s5Acceptance, marker, "M1.07 S5 acceptance");
for (const marker of [
  "6dbac3cddeb8bea1ae85b7f92c065fa2716e0bc3",
  "31446794451",
  "4858c05fcab9d8e4fa4cc09d4cfc2243dc313177",
  "31447079334",
  "OWNER/BROWSER PASS",
  "REG-077",
  "REG-078",
  "REG-079"
]) requireMarker(m107FinalAcceptance, marker, "M1.07 final acceptance");
for (const marker of [
  "M1.07: **IN PROGRESS -> DONE — OWNER PASS**",
  "6/12 -> 7/12 DONE",
  "M1.08 Company Registration and Verification: **BLOCKED -> READY TO BUILD**",
  "4858c05fcab9d8e4fa4cc09d4cfc2243dc313177",
  "31447079334",
  "REG-073",
  "REG-074",
  "REG-075",
  "REG-076",
  "REG-077",
  "REG-078",
  "REG-079"
]) requireMarker(m107FinalClosure, marker, "M1.07 final closure");

const laterOpen = later.split("## Active progress record")[0];
for (const resolvedId of [
  "LATER-014",
  "LATER-015",
  "LATER-016",
  "LATER-017",
  "LATER-018",
  "LATER-019",
  "LATER-020",
  "LATER-021",
  "LATER-022",
  "LATER-023",
  "LATER-024",
  "LATER-025",
  "LATER-026",
  "LATER-027",
  "LATER-028"
]) {
  forbidMarker(laterOpen, resolvedId, "LATER.md open register");
  requireMarker(later, resolvedId, "LATER.md resolved history");
}
for (const marker of ["LATER-029", "Ready to build", "LATER-038", "Provider blocked"]) {
  requireMarker(laterOpen, marker, "LATER.md open register");
}

const handoff = read("scripts/report-manual-handoff.mjs");
const handoffDomain = read("scripts/lib/handoff-domain.mjs");
const handoffTests = read("tests/engineering/handoff-domain.test.mjs");
for (const marker of [
  'id: "API_SURFACE"',
  'path.startsWith("src/app/api/")',
  '!path.startsWith("src/app/api/")'
]) requireMarker(handoffDomain, marker, "Handoff classifier");
for (const marker of [
  "API-only secure-file changes remain internal and do not invent a browser workflow",
  "unknown application UI still fails safe into a visible manual handoff",
  "engineering procedure remains semantic and product regressions do not own memory prose"
]) requireMarker(handoffTests, marker, "Engineering handoff tests");
for (const marker of [
  "No browser-visible product behaviour changed. Internal/server changes are covered by the automated engineering gate",
  "This change has no browser-visible surface; any internal product/security changes are listed separately below",
  "No owner browser regression spot-check is required. Internal/server regression coverage is part of the automated engineering gate.",
  "accepted local/test adapters are not live production providers"
]) requireMarker(handoff, marker, "Manual handoff implementation");

console.log(
  "Engineering standards, exact-head CI identity, fail-closed full-gate wiring, permanent M1.06/M1.07 evidence/regressions, M1.07 owner closure state, M1.08-only next-build context and handoff controls passed."
);
