import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path) { return readFileSync(resolve(path), "utf8"); }
function fail(message) { console.error(message); process.exit(1); }
function requireMarker(text, marker, label) {
  if (!text.includes(marker)) fail(`${label} is missing required evidence: ${marker}`);
}
function forbidMarker(text, marker, label) {
  if (text.includes(marker)) fail(`${label} contains forbidden bypass/stale evidence: ${marker}`);
}
function requirePattern(text, pattern, label, fact) {
  if (!pattern.test(text)) fail(`${label} is missing current fact: ${fact}`);
}

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
  "docs/engineering/M1_09_REGRESSIONS.md",
  "docs/testing/results/M1_06_FINAL_ACCEPTANCE.md",
  "docs/testing/results/M1_06_FINAL_CLOSURE.md",
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
  "scripts/check-worker-identity-foundation.mjs",
  "scripts/check-worker-identity-draft.mjs",
  "scripts/check-worker-identity-corrections.mjs",
  "scripts/check-company-verification.mjs",
  "scripts/check-company-organization-team.mjs",
  "scripts/check-company-worker-invitations.mjs",
  "scripts/run-company-worker-invitation-tests.mjs",
  "tests/engineering/handoff-domain.test.mjs",
  "tests/platform/m1-07-final-acceptance.test.mjs",
  "tests/platform/company-verification.test.mjs",
  "tests/platform/company-organization-team.test.mjs",
  "tests/platform/company-worker-invitations.test.mjs",
  "tests/platform/company-worker-registration-binding.test.mjs",
  "tests/platform/company-worker-login-return.test.mjs",
  "tests/platform/company-worker-invitations-migration-stack.test.mjs"
];
for (const path of requiredFiles) if (!existsSync(resolve(path))) fail(`Engineering automation installation is incomplete: ${path}`);

const packageDocument = JSON.parse(read("package.json"));
const scripts = packageDocument.scripts ?? {};
for (const command of [
  "verify:quick", "verify:affected", "verify:full", "test:unit", "test:integration", "test:e2e",
  "check:engineering", "test:engineering", "check:m1-06-final", "test:m1-06-final",
  "check:worker-identity", "test:worker-identity", "check:worker-identity-draft", "test:worker-identity-draft",
  "check:worker-identity-corrections", "test:worker-identity-corrections", "test:m1-07-final",
  "check:company-verification", "test:m1-08-final", "check:m1-09", "test:m1-09", "check:m1-10", "test:m1-10", "report:handoff"
]) if (!scripts[command]) fail(`package.json is missing required engineering command: ${command}`);
if (scripts["verify:full"] !== "node scripts/run-engineering-gate.mjs") fail("verify:full must use the fail-closed engineering gate orchestrator.");
for (const marker of [
  "check:engineering", "check:m1-06-final", "check:worker-identity", "check:worker-identity-draft",
  "check:worker-identity-corrections", "check:company-verification", "check:m1-09", "check:m1-10", "test:m1-06-final", "test:m1-07-final",
  "test:m1-08-final", "test:m1-09", "test:m1-10", "typecheck", "lint", "build"
]) requireMarker(scripts.check, marker, "Complete application gate");
for (const marker of ["check:engineering", "check:m1-06-final", "check:worker-identity", "check:company-verification", "check:m1-09", "check:m1-10", "typecheck", "lint"])
  requireMarker(scripts["verify:quick"], marker, "Quick engineering gate");

const workflow = read(".github/workflows/worker-foundation-ci.yml");
for (const marker of [
  "pull_request:", "push:", "workflow_dispatch:", "concurrency:", "cancel-in-progress: true", "cache: npm",
  "fetch-depth: 0", "VERIFIED_SHA:", "github.event.pull_request.head.sha", "ref: ${{ env.VERIFIED_SHA }}",
  "HSE_RELEASE_SHA: ${{ env.VERIFIED_SHA }}", "npm run verify:full", "retention-days: 7", "if: always()"
]) requireMarker(workflow, marker, "Engineering CI workflow");
for (const forbidden of ["continue-on-error", "|| true", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "playwright install"])
  forbidMarker(workflow, forbidden, "Engineering CI workflow");

const nextBuild = read("docs/NEXT_BUILD_UNIT.md");
const implementationStatus = read("docs/IMPLEMENTATION_STATUS.md");
const milestonePath = read("docs/bookmarks/MILESTONE_PATH.md");
const profile = read("docs/engineering/PROJECT-PROFILE.md");
const matrix = read("docs/engineering/PROJECT-TEST-MATRIX.md");
const buildMemory = read("docs/engineering/HSE_BUILD_MEMORY.md");

for (const [label, text] of [
  ["NEXT_BUILD_UNIT.md", nextBuild], ["IMPLEMENTATION_STATUS.md", implementationStatus],
  ["MILESTONE_PATH.md", milestonePath], ["PROJECT-PROFILE.md", profile], ["HSE_BUILD_MEMORY.md", buildMemory]
]) {
  requirePattern(text, /(?:7\s+of\s+12|7\s*\/\s*12)/i, label, "formal Milestone 1 progress 7/12");
  requirePattern(text, /M1\.07[\s\S]{0,220}\bDONE\b/i, label, "M1.07 DONE");
  requirePattern(text, /M1\.08[\s\S]{0,420}\bENGINEERING PASS\b/i, label, "M1.08 engineering PASS");
  requirePattern(text, /M1\.08[\s\S]{0,500}\bOWNER (?:ACCEPTANCE )?DEFERRED\b/i, label, "M1.08 owner acceptance deferred");
  requirePattern(text, /M1\.09[\s\S]{0,420}\bENGINEERING PASS\b/i, label, "M1.09 engineering PASS");
  requirePattern(text, /M1\.09[\s\S]{0,500}\bOWNER (?:ACCEPTANCE )?DEFERRED\b/i, label, "M1.09 owner acceptance deferred");
  requirePattern(text, /M1\.10[\s\S]{0,300}\bIN PROGRESS\b/i, label, "M1.10 IN PROGRESS");
}
for (const [label, text] of [["NEXT_BUILD_UNIT.md", nextBuild], ["IMPLEMENTATION_STATUS.md", implementationStatus], ["MILESTONE_PATH.md", milestonePath]]) {
  requirePattern(text, /M1\.11[\s\S]{0,220}\bBLOCKED\b/i, label, "M1.11 blocked");
  requirePattern(text, /M1\.12[\s\S]{0,220}\bBLOCKED\b/i, label, "M1.12 blocked");
}
for (const marker of [
  "1da43b43a0c81efaa70c5ccecf19d037d3199c28", "31476983323",
  "c58bac4cb743b78b9e562d6eca179ff857ba8c17", "31483852831",
  "32130f82b661b86d7ad08f5dad7a368346cfe13d", "31569523799",
  "1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf", "31569898065", "PR #75"
]) requireMarker(`${nextBuild}\n${implementationStatus}\n${milestonePath}\n${profile}\n${buildMemory}`, marker, "Current build-state evidence");

for (const marker of ["TM-026C", "Authorized signed preview/download", "TM-026D", "Complete M1.06 cumulative isolation/migration/recovery acceptance", "TM-027", "Worker Identity Engine and permanent Worker ID", "TM-028", "Company registration/verification", "TM-029", "Sites/departments/Company Team", "TM-029A", "Worker invitations/Company codes/Company↔Worker linking"])
  requireMarker(matrix, marker, "PROJECT-TEST-MATRIX.md");
requirePattern(matrix, /TM-027[^\n]*\|\s*PASS\s*\|/i, "PROJECT-TEST-MATRIX.md", "TM-027 PASS");
requirePattern(matrix, /TM-028[^\n]*\|\s*OWNER ACCEPTANCE DEFERRED\s*\|/i, "PROJECT-TEST-MATRIX.md", "TM-028 owner acceptance deferred");
requirePattern(matrix, /TM-029[^\n]*\|\s*OWNER ACCEPTANCE DEFERRED\s*\|/i, "PROJECT-TEST-MATRIX.md", "TM-029 owner acceptance deferred");
requirePattern(matrix, /TM-029A[^\n]*\|\s*IN PROGRESS\s*\|/i, "PROJECT-TEST-MATRIX.md", "TM-029A IN PROGRESS");

for (const marker of ["M2.13 — Decision Engine", "M3.12 — Production Launch and Operational Handover", "37 bricks total", "7 of 12"])
  requireMarker(milestonePath, marker, "MILESTONE_PATH.md");

const m106FinalAcceptance = read("docs/testing/results/M1_06_FINAL_ACCEPTANCE.md");
for (const marker of ["86d135f87a2a2b53f12b8d5b1a2438944cd426fc", "31362444454", "4ee689e244c938d04a7db3d58306cff8e20b6213", "31362848897", "REG-070", "REG-071", "REG-072"])
  requireMarker(m106FinalAcceptance, marker, "M1.06 final acceptance");
const m107FinalAcceptance = read("docs/testing/results/M1_07_FINAL_ACCEPTANCE.md");
for (const marker of ["6dbac3cddeb8bea1ae85b7f92c065fa2716e0bc3", "31446794451", "4858c05fcab9d8e4fa4cc09d4cfc2243dc313177", "31447079334", "OWNER/BROWSER PASS", "REG-077", "REG-078", "REG-079"])
  requireMarker(m107FinalAcceptance, marker, "M1.07 final acceptance");

for (const [path, ids] of [
  ["docs/engineering/M1_06_SUBUNIT4_REGRESSIONS.md", Array.from({ length: 15 }, (_, i) => `REG-${String(55 + i).padStart(3, "0")}`)],
  ["docs/engineering/M1_06_SUBUNIT5_REGRESSIONS.md", ["REG-070", "REG-071", "REG-072"]],
  ["docs/engineering/M1_07_SUBUNIT6_REGRESSIONS.md", ["REG-077", "REG-078", "REG-079"]],
  ["docs/engineering/M1_09_REGRESSIONS.md", ["REG-086", "REG-087", "REG-088", "REG-089", "REG-090", "REG-091"]]
]) {
  const source = read(path);
  for (const id of ids) requireMarker(source, id, path);
}

const handoff = read("scripts/report-manual-handoff.mjs");
const handoffDomain = read("scripts/lib/handoff-domain.mjs");
const handoffTests = read("tests/engineering/handoff-domain.test.mjs");
for (const marker of ['id: "API_SURFACE"', 'path.startsWith("src/app/api/")']) requireMarker(handoffDomain, marker, "Handoff classifier");
for (const marker of ["unknown application UI still fails safe into a visible manual handoff", "engineering procedure remains semantic and product regressions do not own memory prose"])
  requireMarker(handoffTests, marker, "Engineering handoff tests");
requireMarker(handoff, "accepted local/test adapters are not live production providers", "Manual handoff implementation");

const later = read("docs/bookmarks/LATER.md");
requireMarker(later, "LATER-038", "LATER.md provider boundary");
requireMarker(later, "Provider blocked", "LATER.md provider boundary");

console.log("Engineering standards, exact-head CI identity, fail-closed full-gate wiring, permanent M1.06–M1.09 evidence, deferred combined Milestone 1 owner acceptance and M1.10-only active build context passed.");