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
  "docs/testing/results/M1_06_SIGNED_ACCESS_FINAL_ACCEPTANCE.md",
  "docs/testing/results/M1_06_FINAL_ACCEPTANCE.md",
  "docs/testing/results/M1_06_FINAL_CLOSURE.md",
  "docs/NEXT_BUILD_UNIT.md",
  "docs/bookmarks/MILESTONE_PATH.md",
  "docs/bookmarks/LATER.md",
  "scripts/lib/handoff-domain.mjs",
  "scripts/report-manual-handoff.mjs",
  "scripts/run-engineering-gate.mjs",
  "scripts/run-secure-access-tests.mjs",
  "scripts/run-secure-access-runtime-tests.mjs",
  "scripts/check-m1-06-final-acceptance.mjs",
  "scripts/run-m1-06-final-tests.mjs",
  "scripts/verify-affected.mjs",
  "src/lib/secure-files/secure-file-access-core.ts",
  "tests/engineering/handoff-domain.test.mjs",
  "tests/secure-files/secure-file-access-core.test.mjs",
  "tests/secure-files/secure-file-access-request.test.mjs",
  "tests/platform/secure-file-access-migration-stack.test.mjs",
  "tests/platform/m1-06-final-acceptance.test.mjs",
  "tests/platform/m1-06-final-restart-migration.test.mjs",
  "tests/platform/migration-checksum-repair.test.mjs"
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
  requirePattern(text, /(?:6\s+of\s+12|6\s*\/\s*12)/i, label, "Milestone 1 progress 6/12");
  requirePattern(text, /M1\.06[\s\S]{0,220}\bDONE\b/i, label, "M1.06 DONE");
  requirePattern(
    text,
    /M1\.07[\s\S]{0,260}(?:READY TO BUILD|IN PROGRESS)/i,
    label,
    "M1.07 current/next brick"
  );
}

function requireM106FinalAcceptanceState(text, label) {
  requirePattern(
    text,
    /Authorized Signed Preview\/Download Pipeline[\s\S]{0,220}\bDONE\b/i,
    label,
    "M1.06 Subunit 4 DONE"
  );
  requirePattern(
    text,
    /Complete M1\.06 Isolation, Migration, Recovery and Acceptance[\s\S]{0,260}\bDONE\b/i,
    label,
    "M1.06 Subunit 5 DONE"
  );
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
  "check:m1-06-final",
  "test:m1-06-final",
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
  "test:secure-access-runtime",
  "check:m1-06-final",
  "test:m1-06-final"
]) requireMarker(scripts.check, marker, "Complete application gate");
requireMarker(scripts["verify:quick"], "check:m1-06-final", "Quick engineering gate");
requireMarker(scripts["test:integration"], "test:m1-06-final", "Integration test aggregate");

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
const subunit5Regressions = read("docs/engineering/M1_06_SUBUNIT5_REGRESSIONS.md");
const signedAccessAcceptance = read("docs/testing/results/M1_06_SIGNED_ACCESS_FINAL_ACCEPTANCE.md");
const m106FinalAcceptance = read("docs/testing/results/M1_06_FINAL_ACCEPTANCE.md");
const m106FinalClosure = read("docs/testing/results/M1_06_FINAL_CLOSURE.md");
const nextBuild = read("docs/NEXT_BUILD_UNIT.md");
const milestonePath = read("docs/bookmarks/MILESTONE_PATH.md");
const later = read("docs/bookmarks/LATER.md");
const handoff = read("scripts/report-manual-handoff.mjs");
const handoffDomain = read("scripts/lib/handoff-domain.mjs");
const handoffTests = read("tests/engineering/handoff-domain.test.mjs");
const secureAccessCore = read("src/lib/secure-files/secure-file-access-core.ts");
const secureAccessCoreTests = read("tests/secure-files/secure-file-access-core.test.mjs");
const secureAccessUnitRunner = read("scripts/run-secure-access-tests.mjs");
const secureAccessRuntimeRunner = read("scripts/run-secure-access-runtime-tests.mjs");
const secureAccessMigrationTest = read("tests/platform/secure-file-access-migration-stack.test.mjs");
const m106FinalCheck = read("scripts/check-m1-06-final-acceptance.mjs");
const m106FinalRunner = read("scripts/run-m1-06-final-tests.mjs");

for (const marker of [
  "Worker", "Company", "Assessor", "Verifier", "Administrator", "Root",
  "verify:full", "PGlite", "tenant", "docs/NEXT_BUILD_UNIT.md",
  "M1.06 DONE", "M1.07"
]) requireMarker(profile, marker, "PROJECT-PROFILE.md");
for (const stale of [
  "M1.04 Authorization and Tenant Isolation is in progress",
  "Secure object/evidence storage is not built yet",
  "No durable outbox or background-job runner yet",
  "M1.05 durable audit/outbox/notification foundation is not complete",
  "Subunit 5 cumulative isolation/migration/recovery/acceptance IN PROGRESS"
]) forbidMarker(profile, stale, "PROJECT-PROFILE.md");

for (const status of ["PASS", "BLOCKED", "NOT CONFIGURED", "READY TO BUILD"]) {
  requireMarker(matrix, status, "PROJECT-TEST-MATRIX.md");
}
for (const marker of [
  "TM-025A", "Immutable platform audit",
  "TM-025B", "Transactional outbox/background worker",
  "TM-025C", "Persisted in-app notifications/deep links",
  "TM-025D", "Provider-neutral durable email delivery",
  "TM-026A", "Isolated PDF/PNG/JPEG upload validation/quarantine",
  "TM-026B", "Durable malware scan foundation",
  "TM-026C", "Authorized signed preview/download",
  "TM-026D", "Complete M1.06 cumulative isolation/migration/recovery acceptance",
  "TM-027", "Worker Identity Engine and permanent Worker ID"
]) requireMarker(matrix, marker, "PROJECT-TEST-MATRIX.md");
requirePattern(matrix, /TM-026C[^\n]*\|\s*PASS\s*\|/i, "PROJECT-TEST-MATRIX.md", "TM-026C PASS");
requirePattern(matrix, /TM-026D[^\n]*\|\s*PASS\s*\|/i, "PROJECT-TEST-MATRIX.md", "TM-026D PASS");
requirePattern(matrix, /TM-027[^\n]*\|\s*READY TO BUILD\s*\|/i, "PROJECT-TEST-MATRIX.md", "TM-027 READY TO BUILD");
for (const stale of [
  "TM-026 | Secure evidence upload and preview | Worker, Verifier | Wrong file, cross-tenant download, leaked upload state | Future M1.06",
  "TM-010B: The exact branch gate passed. Final M1.04 brick acceptance still requires",
  "TM-026D does not duplicate those tests; it proves their accepted modules compose on one real persistence boundary"
]) forbidMarker(matrix, stale, "PROJECT-TEST-MATRIX.md");

for (const id of ["REG-001", "REG-003", "REG-018", "REG-020", "REG-024", "REG-025", "REG-026"]) {
  requireMarker(regression, id, "REGRESSION-REGISTER.md");
}
for (let id = 55; id <= 69; id += 1) {
  requireMarker(
    subunit4Regressions,
    `REG-${String(id).padStart(3, "0")}`,
    "M1.06 Subunit 4 regression addendum"
  );
}
for (const id of ["REG-070", "REG-071", "REG-072"]) {
  requireMarker(subunit5Regressions, id, "M1.06 Subunit 5 regression addendum");
}

// Brick-level state belongs in every compact authority document. Detailed
// internal-subunit evidence is intentionally required only from the documents
// that own that detail; compact memory/profile files must not be coupled to
// headings or numbered prose from another document (REG-061).
for (const [label, text] of [
  ["NEXT_BUILD_UNIT.md", nextBuild],
  ["MILESTONE_PATH.md", milestonePath],
  ["HSE_BUILD_MEMORY.md", buildMemory],
  ["PROJECT-PROFILE.md", profile]
]) {
  requireBrickState(text, label);
}
requireM106FinalAcceptanceState(nextBuild, "NEXT_BUILD_UNIT.md");
requireM106FinalAcceptanceState(milestonePath, "MILESTONE_PATH.md");

for (const marker of [
  "b370142658238b47d842366f1af343f72533d0b1",
  "31354949426 / 93352838153",
  "d03ce5322c2ffa0214c90ee5dc19c15e22da9d51",
  "31355234897 / 93353573069",
  "NOT REQUIRED — no browser-visible product surface"
]) requireMarker(signedAccessAcceptance, marker, "M1.06 signed access final acceptance");

for (const marker of [
  "86d135f87a2a2b53f12b8d5b1a2438944cd426fc",
  "31362444454",
  "4ee689e244c938d04a7db3d58306cff8e20b6213",
  "31362848897",
  "REG-070", "REG-071", "REG-072"
]) requireMarker(m106FinalAcceptance, marker, "M1.06 final cumulative acceptance");
for (const marker of [
  "03ac4ac48ee8477833999829c56f829365b92a9e",
  "31363206957",
  "M1.06: IN PROGRESS -> DONE",
  "M1.07: BLOCKED -> READY TO BUILD"
]) requireMarker(m106FinalClosure, marker, "M1.06 final closure record");

requirePattern(milestonePath, /M2\.13\s+—\s+Decision Engine/i, "MILESTONE_PATH.md", "canonical M2.13 endpoint");
requirePattern(milestonePath, /M3\.12\s+—\s+Production Launch and Operational Handover/i, "MILESTONE_PATH.md", "canonical M3.12 endpoint");
for (const stale of [
  "M1.05 — Audit and Notification Foundations\n\n**Status: READY TO BUILD**",
  "M1.06 | Secure storage and upload pipeline | NOT STARTED",
  "M2.01 through M2.15",
  "M3.01 through M3.10 remain frozen"
]) forbidMarker(milestonePath, stale, "MILESTONE_PATH.md");

for (const accepted of [
  "Secure File Domain, Metadata Schema and Private Object Storage Adapter",
  "Isolated Upload Intake, Validation and Quarantine",
  "Durable Malware Scan Job and Local/Test Scanner Adapter",
  "Authorized Signed Preview/Download Pipeline",
  "Complete M1.06 Isolation, Migration, Recovery and Acceptance"
]) requireMarker(nextBuild, accepted, "NEXT_BUILD_UNIT.md");
requirePattern(nextBuild, /Complete M1\.06 Isolation, Migration, Recovery and Acceptance[\s\S]{0,220}DONE/i, "NEXT_BUILD_UNIT.md", "Subunit 5 DONE");
requirePattern(nextBuild, /M1\.07[\s\S]{0,220}READY TO BUILD/i, "NEXT_BUILD_UNIT.md", "M1.07 READY TO BUILD");

const laterOpen = later.split("## Active progress record")[0];
for (const resolvedId of [
  "LATER-014", "LATER-015", "LATER-016", "LATER-017",
  "LATER-018", "LATER-019", "LATER-020", "LATER-021", "LATER-022"
]) {
  forbidMarker(laterOpen, resolvedId, "LATER.md open register");
  requireMarker(later, resolvedId, "LATER.md resolved history");
}
requirePattern(later, /Subunit 4:[^\n]*DONE/i, "LATER.md", "Subunit 4 DONE");
requirePattern(later, /Subunit 5:[^\n]*DONE/i, "LATER.md", "Subunit 5 DONE");
requirePattern(later, /M1\.07[\s\S]{0,220}READY TO BUILD/i, "LATER.md", "M1.07 READY TO BUILD");

for (const stale of [
  "M1.04 Authorization and Tenant Isolation — **IN PROGRESS",
  "M1.05 and later bricks remain blocked",
  "build/m1-06-final-acceptance"
]) forbidMarker(buildMemory, stale, "HSE_BUILD_MEMORY.md");
requireMarker(buildMemory, "M1.06 Secure Storage and Upload Pipeline — **DONE", "HSE_BUILD_MEMORY.md");
requireMarker(buildMemory, "M1.07 Worker Onboarding and Identity Engine — **READY TO BUILD", "HSE_BUILD_MEMORY.md");

for (const testFile of [
  "secure-file-access-runtime.test.mjs",
  "secure-file-access-audit.test.mjs",
  "secure-file-access-migration-stack.test.mjs",
  "secure-file-access-routes.test.mjs"
]) requireMarker(secureAccessRuntimeRunner, testFile, "Signed-access runtime test runner");

requireMarker(secureAccessUnitRunner, "secure-file-access-request.test.mjs", "Signed-access unit test runner");
requireMarker(secureAccessUnitRunner, "secure-file-access-request.js", "Signed-access unit test runner");

for (const marker of [
  "repository authorization denial is translated but operational failures are not hidden",
  "private storage operational failure is not disguised as access denial"
]) requireMarker(secureAccessCoreTests, marker, "Signed-access core boundary tests");
requireMarker(secureAccessCore, "const stored = await input.storage.read(file.objectKey);", "Signed-access core storage boundary");

for (const marker of [
  "const ENTRY_FILES", "const RUNTIME_STUBS", "function collectRuntimeSources",
  "ts.preProcessFile", "normalizeRelativeSourcePath",
  "Secure access runtime dependency escaped src/lib",
  "Secure access runtime dependency could not be resolved"
]) requireMarker(secureAccessRuntimeRunner, marker, "Signed-access runtime dependency compiler");
forbidMarker(secureAccessRuntimeRunner, "const SOURCE_FILES", "Signed-access runtime dependency compiler");

for (const marker of [
  "migrationStatus",
  "rollbackLatestMigration(database, ENVIRONMENT)",
  "HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK",
  "checksumMatches",
  "releaseSha"
]) requireMarker(secureAccessMigrationTest, marker, "Signed-access migration stack test");
forbidMarker(secureAccessMigrationTest, "platform_schema_migrations", "Signed-access migration stack test");

for (const marker of [
  "check:m1-06-final",
  "test:m1-06-final",
  "m1-06-final-acceptance.test.mjs",
  "m1-06-final-restart-migration.test.mjs",
  "migration-checksum-repair.test.mjs"
]) {
  requireMarker(m106FinalCheck + m106FinalRunner, marker, "M1.06 cumulative acceptance installation");
}
for (const marker of [
  "const LIB_ALIAS_PREFIX = \"@/lib/\"",
  "function resolveSourceImport",
  "specifier.startsWith(LIB_ALIAS_PREFIX)",
  "function runtimeSpecifier",
  "function runtimeSource",
  "function collectRuntimeSources",
  "ts.preProcessFile",
  "M1.06 final runtime alias could not be resolved"
]) {
  requireMarker(m106FinalRunner, marker, "M1.06 cumulative runtime runner");
}
forbidMarker(m106FinalRunner, "const SOURCE_FILES", "M1.06 cumulative runtime runner");
forbidMarker(
  m106FinalRunner,
  "if (!specifier.startsWith(\".\")) return null",
  "M1.06 cumulative runtime runner"
);

for (const marker of [
  "id: \"API_SURFACE\"",
  "path.startsWith(\"src/app/api/\")",
  "!path.startsWith(\"src/app/api/\")"
]) requireMarker(handoffDomain, marker, "Handoff classifier");
requireMarker(handoffTests, "API-only secure-file changes remain internal and do not invent a browser workflow", "Handoff classifier tests");
requireMarker(handoffTests, "unknown application UI still fails safe into a visible manual handoff", "Handoff classifier tests");
requireMarker(handoffTests, "engineering procedure remains semantic and product regressions do not own memory prose", "Engineering procedure tests");

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
  "Engineering standards, exact-head CI identity, fail-closed controls, accepted M1.06 permanent regression wiring, M1.07 build-state context and handoff controls passed."
);
