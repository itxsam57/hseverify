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
  "docs/NEXT_BUILD_UNIT.md",
  "docs/bookmarks/MILESTONE_PATH.md",
  "docs/bookmarks/LATER.md",
  "scripts/lib/handoff-domain.mjs",
  "scripts/report-manual-handoff.mjs",
  "scripts/run-engineering-gate.mjs",
  "scripts/run-secure-access-runtime-tests.mjs",
  "scripts/verify-affected.mjs",
  "tests/engineering/handoff-domain.test.mjs"
];

const missing = requiredFiles.filter((path) => !existsSync(resolve(path)));
if (missing.length > 0) {
  console.error(`Engineering automation installation is incomplete:\n${missing.join("\n")}`);
  process.exit(1);
}

function read(path) {
  return readFileSync(resolve(path), "utf8");
}

function requireMarker(text, marker, label) {
  if (!text.includes(marker)) {
    console.error(`${label} is missing current required evidence: ${marker}`);
    process.exit(1);
  }
}

function forbidMarker(text, marker, label) {
  if (text.includes(marker)) {
    console.error(`${label} contains stale/forbidden build context: ${marker}`);
    process.exit(1);
  }
}

const packageDocument = JSON.parse(read("package.json"));
const scripts = packageDocument.scripts ?? {};
for (const name of [
  "verify:quick",
  "verify:affected",
  "verify:full",
  "test:unit",
  "test:integration",
  "test:e2e",
  "test:m1-04-final",
  "report:handoff",
  "check:engineering",
  "test:engineering"
]) {
  if (!scripts[name]) {
    console.error(`package.json is missing required engineering command: ${name}`);
    process.exit(1);
  }
}

if (scripts["verify:full"] !== "node scripts/run-engineering-gate.mjs") {
  console.error("verify:full must use the fail-closed engineering gate orchestrator.");
  process.exit(1);
}
if (
  !scripts.check.includes("check:engineering") ||
  !scripts.check.includes("test:engineering") ||
  !scripts.check.includes("test:m1-04-final") ||
  !scripts.check.includes("check:secure-access") ||
  !scripts.check.includes("test:secure-access") ||
  !scripts.check.includes("test:secure-access-runtime")
) {
  console.error("The complete application gate must retain engineering, accepted isolation and active signed-access checks.");
  process.exit(1);
}

const workflow = read(".github/workflows/worker-foundation-ci.yml");
for (const marker of [
  "pull_request:",
  "push:",
  "workflow_dispatch:",
  "concurrency:",
  "cancel-in-progress: true",
  "cache: npm",
  "fetch-depth: 0",
  "timeout-minutes:",
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

const profile = read("docs/engineering/PROJECT-PROFILE.md");
const matrix = read("docs/engineering/PROJECT-TEST-MATRIX.md");
const regression = read("docs/engineering/REGRESSION-REGISTER.md");
const buildMemory = read("docs/engineering/HSE_BUILD_MEMORY.md");
const subunit4Regressions = read("docs/engineering/M1_06_SUBUNIT4_REGRESSIONS.md");
const nextBuild = read("docs/NEXT_BUILD_UNIT.md");
const milestonePath = read("docs/bookmarks/MILESTONE_PATH.md");
const later = read("docs/bookmarks/LATER.md");
const handoff = read("scripts/report-manual-handoff.mjs");
const secureAccessRuntimeRunner = read("scripts/run-secure-access-runtime-tests.mjs");

for (const marker of [
  "Worker", "Company", "Assessor", "Verifier", "Administrator", "Root",
  "verify:full", "PGlite", "tenant", "docs/NEXT_BUILD_UNIT.md", "M1.06 IN PROGRESS"
]) requireMarker(profile, marker, "PROJECT-PROFILE.md");
for (const stale of [
  "M1.04 Authorization and Tenant Isolation is in progress",
  "Secure object/evidence storage is not built yet",
  "No durable outbox or background-job runner yet",
  "M1.05 durable audit/outbox/notification foundation is not complete"
]) forbidMarker(profile, stale, "PROJECT-PROFILE.md");

for (const status of ["PASS", "BLOCKED", "NOT CONFIGURED"]) {
  requireMarker(matrix, status, "PROJECT-TEST-MATRIX.md");
}
for (const marker of [
  "TM-025A", "Immutable platform audit",
  "TM-025B", "Transactional outbox/background worker",
  "TM-025C", "Persisted in-app notifications/deep links",
  "TM-025D", "Provider-neutral durable email delivery",
  "TM-026A", "Isolated PDF/PNG/JPEG upload validation/quarantine",
  "TM-026B", "Durable malware scan foundation",
  "TM-026C", "BLOCKED — M1.06 SUBUNIT 4 IN PROGRESS"
]) requireMarker(matrix, marker, "PROJECT-TEST-MATRIX.md");
for (const stale of [
  "TM-026 | Secure evidence upload and preview | Worker, Verifier | Wrong file, cross-tenant download, leaked upload state | Future M1.06",
  "TM-010B: The exact branch gate passed. Final M1.04 brick acceptance still requires"
]) forbidMarker(matrix, stale, "PROJECT-TEST-MATRIX.md");

for (const id of ["REG-001", "REG-003", "REG-018", "REG-020", "REG-024", "REG-025", "REG-026"]) {
  requireMarker(regression, id, "REGRESSION-REGISTER.md");
}
for (const id of ["REG-055", "REG-056", "REG-057", "REG-058", "REG-059", "REG-060"]) {
  requireMarker(subunit4Regressions, id, "M1.06 Subunit 4 regression addendum");
}

// REG-059: mandatory current-context sources must agree instead of allowing
// stale copies of volatile milestone state to silently coexist.
for (const [label, text] of [
  ["NEXT_BUILD_UNIT.md", nextBuild],
  ["HSE_BUILD_MEMORY.md", buildMemory]
]) {
  requireMarker(text, "5 of 12 Milestone 1 bricks are DONE", label);
  requireMarker(text, "M1.06", label);
  requireMarker(text, "IN PROGRESS", label);
  requireMarker(text, "Subunit 4", label);
}
requireMarker(profile, "Milestone 1 is 5/12 DONE", "PROJECT-PROFILE.md");
requireMarker(milestonePath, "Milestone 1 progress: 5 of 12 bricks are DONE", "MILESTONE_PATH.md");
requireMarker(milestonePath, "M1.05 | Audit and notification foundations | **DONE**", "MILESTONE_PATH.md");
requireMarker(milestonePath, "M1.06 | Secure storage and upload pipeline | **IN PROGRESS**", "MILESTONE_PATH.md");
requireMarker(milestonePath, "M2.13 — Decision Engine", "MILESTONE_PATH.md");
requireMarker(milestonePath, "M3.12 — Production Launch and Operational Handover", "MILESTONE_PATH.md");
for (const stale of [
  "M1.05 — Audit and Notification Foundations\n\n**Status: READY TO BUILD**",
  "M1.06 | Secure storage and upload pipeline | NOT STARTED",
  "M2.01 through M2.15",
  "M3.01 through M3.10 remain frozen"
]) forbidMarker(milestonePath, stale, "MILESTONE_PATH.md");

requireMarker(nextBuild, "Authorized Signed Preview/Download Pipeline — IN PROGRESS — PR #53", "NEXT_BUILD_UNIT.md");
for (const accepted of [
  "M1.05 Audit and Notification Foundations — **DONE",
  "M1.06 Subunit 1 Secure File Domain",
  "M1.06 Subunit 2 Isolated Upload Intake",
  "M1.06 Subunit 3 Durable Malware Scan Job"
]) requireMarker(nextBuild, accepted, "NEXT_BUILD_UNIT.md");

const laterOpen = later.split("## Active progress record")[0];
for (const resolvedId of [
  "LATER-014", "LATER-015", "LATER-016", "LATER-017",
  "LATER-018", "LATER-019", "LATER-020", "LATER-021"
]) {
  forbidMarker(laterOpen, resolvedId, "LATER.md open register");
  requireMarker(later, resolvedId, "LATER.md resolved history");
}
requireMarker(laterOpen, "LATER-022", "LATER.md open register");
requireMarker(later, "M1.06 — Secure Storage and Upload Pipeline", "LATER.md");
requireMarker(later, "Subunit 4: authorized signed preview/download — IN PROGRESS", "LATER.md");

for (const stale of [
  "M1.04 Authorization and Tenant Isolation — **IN PROGRESS",
  "M1.05 and later bricks remain blocked"
]) forbidMarker(buildMemory, stale, "HSE_BUILD_MEMORY.md");

// REG-060: the two source/migration platform tests discovered during audit are
// not protection unless the executable signed-access integration runner invokes them.
for (const testFile of [
  "secure-file-access-runtime.test.mjs",
  "secure-file-access-audit.test.mjs",
  "secure-file-access-migration-stack.test.mjs",
  "secure-file-access-routes.test.mjs"
]) requireMarker(secureAccessRuntimeRunner, testFile, "Signed-access runtime test runner");

for (const marker of [
  "finalM104Closure",
  "M1.04 final portal-isolation closure",
  "No hosted preview URL is configured"
]) requireMarker(handoff, marker, "Manual handoff implementation");

console.log(
  "Engineering standards, fail-closed CI controls, current build-context consistency, milestone/Later state, signed-access regression/test wiring and handoff tooling passed."
);
