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
  "scripts/run-secure-access-tests.mjs",
  "scripts/run-secure-access-runtime-tests.mjs",
  "scripts/verify-affected.mjs",
  "tests/engineering/handoff-domain.test.mjs",
  "tests/secure-files/secure-file-access-request.test.mjs",
  "tests/platform/secure-file-access-migration-stack.test.mjs"
];

const missing = requiredFiles.filter((path) => !existsSync(resolve(path)));
if (missing.length > 0) {
  console.error(`Engineering automation installation is incomplete:\n${missing.join("\n")}`);
  process.exit(1);
}

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
  if (text.includes(marker)) fail(`${label} contains stale/forbidden context: ${marker}`);
}

function requirePattern(text, pattern, label, fact) {
  if (!pattern.test(text)) fail(`${label} is missing current fact: ${fact}`);
}

function requireBrickState(text, label) {
  requirePattern(text, /(?:5\s+of\s+12|5\s*\/\s*12)/i, label, "Milestone 1 progress 5/12");
  requirePattern(text, /M1\.05[\s\S]{0,180}\bDONE\b/i, label, "M1.05 DONE");
  requirePattern(text, /M1\.06[\s\S]{0,180}\bIN PROGRESS\b/i, label, "M1.06 IN PROGRESS");
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
  if (!scripts[name]) fail(`package.json is missing required engineering command: ${name}`);
}
if (scripts["verify:full"] !== "node scripts/run-engineering-gate.mjs") {
  fail("verify:full must use the fail-closed engineering gate orchestrator.");
}
for (const marker of [
  "check:engineering",
  "test:engineering",
  "test:m1-04-final",
  "check:secure-access",
  "test:secure-access",
  "test:secure-access-runtime"
]) {
  requireMarker(scripts.check, marker, "Complete application gate");
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
const handoffDomain = read("scripts/lib/handoff-domain.mjs");
const handoffTests = read("tests/engineering/handoff-domain.test.mjs");
const secureAccessUnitRunner = read("scripts/run-secure-access-tests.mjs");
const secureAccessRuntimeRunner = read("scripts/run-secure-access-runtime-tests.mjs");
const secureAccessMigrationTest = read("tests/platform/secure-file-access-migration-stack.test.mjs");

for (const marker of [
  "Worker",
  "Company",
  "Assessor",
  "Verifier",
  "Administrator",
  "Root",
  "verify:full",
  "PGlite",
  "tenant",
  "docs/NEXT_BUILD_UNIT.md"
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
  "TM-025A",
  "Immutable platform audit",
  "TM-025B",
  "Transactional outbox/background worker",
  "TM-025C",
  "Persisted in-app notifications/deep links",
  "TM-025D",
  "Provider-neutral durable email delivery",
  "TM-026A",
  "Isolated PDF/PNG/JPEG upload validation/quarantine",
  "TM-026B",
  "Durable malware scan foundation",
  "TM-026C",
  "BLOCKED — M1.06 SUBUNIT 4 IN PROGRESS"
]) requireMarker(matrix, marker, "PROJECT-TEST-MATRIX.md");
for (const stale of [
  "TM-026 | Secure evidence upload and preview | Worker, Verifier | Wrong file, cross-tenant download, leaked upload state | Future M1.06",
  "TM-010B: The exact branch gate passed. Final M1.04 brick acceptance still requires"
]) forbidMarker(matrix, stale, "PROJECT-TEST-MATRIX.md");

for (const id of ["REG-001", "REG-003", "REG-018", "REG-020", "REG-024", "REG-025", "REG-026"]) {
  requireMarker(regression, id, "REGRESSION-REGISTER.md");
}
for (let id = 55; id <= 67; id += 1) {
  requireMarker(
    subunit4Regressions,
    `REG-${String(id).padStart(3, "0")}`,
    "M1.06 Subunit 4 regression addendum"
  );
}

// REG-059 + REG-061: validate stable build facts rather than prose/layout.
for (const [label, text] of [
  ["NEXT_BUILD_UNIT.md", nextBuild],
  ["MILESTONE_PATH.md", milestonePath],
  ["HSE_BUILD_MEMORY.md", buildMemory],
  ["PROJECT-PROFILE.md", profile]
]) requireBrickState(text, label);
requirePattern(nextBuild, /Subunit 4[\s\S]{0,220}\bIN PROGRESS\b/i, "NEXT_BUILD_UNIT.md", "Subunit 4 IN PROGRESS");
requirePattern(buildMemory, /Subunit 4[\s\S]{0,220}\bIN PROGRESS\b/i, "HSE_BUILD_MEMORY.md", "Subunit 4 IN PROGRESS");
requirePattern(profile, /Subunit 4[\s\S]{0,220}\bin progress\b/i, "PROJECT-PROFILE.md", "Subunit 4 IN PROGRESS");
requirePattern(
  milestonePath,
  /Active M1\.06 subunit[\s\S]{0,240}\n4\.\s+\*\*Authorized Signed Preview\/Download Pipeline — IN PROGRESS — PR #53\.\*\*/i,
  "MILESTONE_PATH.md",
  "active Subunit 4 signed preview/download IN PROGRESS"
);
requirePattern(milestonePath, /M2\.13\s+—\s+Decision Engine/i, "MILESTONE_PATH.md", "canonical M2.13 endpoint");
requirePattern(milestonePath, /M3\.12\s+—\s+Production Launch and Operational Handover/i, "MILESTONE_PATH.md", "canonical M3.12 endpoint");
for (const stale of [
  "M1.05 — Audit and Notification Foundations\n\n**Status: READY TO BUILD**",
  "M1.06 | Secure storage and upload pipeline | NOT STARTED",
  "M2.01 through M2.15",
  "M3.01 through M3.10 remain frozen"
]) forbidMarker(milestonePath, stale, "MILESTONE_PATH.md");
requireMarker(nextBuild, "PR #53", "NEXT_BUILD_UNIT.md");
for (const accepted of [
  "M1.06 Subunit 1 Secure File Domain",
  "M1.06 Subunit 2 Isolated Upload Intake",
  "M1.06 Subunit 3 Durable Malware Scan Job"
]) requireMarker(nextBuild, accepted, "NEXT_BUILD_UNIT.md");

const laterOpen = later.split("## Active progress record")[0];
for (const resolvedId of [
  "LATER-014",
  "LATER-015",
  "LATER-016",
  "LATER-017",
  "LATER-018",
  "LATER-019",
  "LATER-020",
  "LATER-021"
]) {
  forbidMarker(laterOpen, resolvedId, "LATER.md open register");
  requireMarker(later, resolvedId, "LATER.md resolved history");
}
requireMarker(laterOpen, "LATER-022", "LATER.md open register");
requirePattern(later, /Subunit 4:[^\n]*IN PROGRESS/i, "LATER.md", "Subunit 4 IN PROGRESS");

for (const stale of [
  "M1.04 Authorization and Tenant Isolation — **IN PROGRESS",
  "M1.05 and later bricks remain blocked"
]) forbidMarker(buildMemory, stale, "HSE_BUILD_MEMORY.md");

// REG-060: permanent signed-access platform tests must be executable, not orphan files.
for (const testFile of [
  "secure-file-access-runtime.test.mjs",
  "secure-file-access-audit.test.mjs",
  "secure-file-access-migration-stack.test.mjs",
  "secure-file-access-routes.test.mjs"
]) requireMarker(secureAccessRuntimeRunner, testFile, "Signed-access runtime test runner");

// REG-063: bounded request-body behavior must be part of the executable unit gate.
requireMarker(
  secureAccessUnitRunner,
  "secure-file-access-request.test.mjs",
  "Signed-access unit test runner"
);
requireMarker(
  secureAccessUnitRunner,
  "secure-file-access-request.js",
  "Signed-access unit test runner"
);

// REG-066: runtime verification derives the complete trusted relative import closure.
for (const marker of [
  "const ENTRY_FILES",
  "const RUNTIME_STUBS",
  "function collectRuntimeSources",
  "ts.preProcessFile",
  "normalizeRelativeSourcePath",
  "Secure access runtime dependency escaped src/lib",
  "Secure access runtime dependency could not be resolved"
]) requireMarker(secureAccessRuntimeRunner, marker, "Signed-access runtime dependency compiler");
forbidMarker(
  secureAccessRuntimeRunner,
  "const SOURCE_FILES",
  "Signed-access runtime dependency compiler"
);

// REG-067: migration proof uses the repository's actual guarded migration contract.
for (const marker of [
  "migrationStatus",
  "rollbackLatestMigration(database, ENVIRONMENT)",
  "HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK",
  "checksumMatches",
  "releaseSha"
]) requireMarker(secureAccessMigrationTest, marker, "Signed-access migration stack test");
forbidMarker(
  secureAccessMigrationTest,
  "platform_schema_migrations",
  "Signed-access migration stack test"
);

// REG-062: API-only changes are internal; unknown real pages still fail safe visible.
for (const marker of ["id: \"API_SURFACE\"", "path.startsWith(\"src/app/api/\")", "!path.startsWith(\"src/app/api/\")"]) {
  requireMarker(handoffDomain, marker, "Handoff classifier");
}
requireMarker(
  handoffTests,
  "API-only secure-file changes remain internal and do not invent a browser workflow",
  "Handoff classifier tests"
);
requireMarker(
  handoffTests,
  "unknown application UI still fails safe into a visible manual handoff",
  "Handoff classifier tests"
);

// REG-064: no-visible-feature handoffs must not erase internal product/security scope.
for (const marker of [
  "No browser-visible product behaviour changed. Internal/server changes are covered by the automated engineering gate",
  "This change has no browser-visible surface; any internal product/security changes are listed separately below",
  "No owner browser regression spot-check is required. Internal/server regression coverage is part of the automated engineering gate.",
  "accepted local/test adapters are not live production providers"
]) requireMarker(handoff, marker, "Manual handoff implementation");
for (const stale of [
  "engineering-only installation",
  "Changes are limited to engineering standards, verification orchestration, CI, and handoff tooling.",
  "Live email, SMS, storage, malware scanning, liveness, video/interview, and payment providers remain blocked"
]) forbidMarker(handoff, stale, "Manual handoff implementation");

for (const marker of [
  "finalM104Closure",
  "M1.04 final portal-isolation closure",
  "No hosted preview URL is configured"
]) requireMarker(handoff, marker, "Manual handoff implementation");

console.log(
  "Engineering standards, fail-closed CI controls, semantic build-context consistency, milestone/Later state, signed-access request/runtime/migration wiring, API classification and accurate no-browser handoff wording passed."
);
