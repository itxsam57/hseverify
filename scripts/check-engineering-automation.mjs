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
  "scripts/lib/handoff-domain.mjs",
  "scripts/report-manual-handoff.mjs",
  "scripts/run-engineering-gate.mjs",
  "scripts/verify-affected.mjs",
  "tests/engineering/handoff-domain.test.mjs"
];

const missing = requiredFiles.filter((path) => !existsSync(resolve(path)));
if (missing.length > 0) {
  console.error(`Engineering automation installation is incomplete:\n${missing.join("\n")}`);
  process.exit(1);
}

const packageDocument = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
const scripts = packageDocument.scripts ?? {};
for (const name of [
  "verify:quick",
  "verify:affected",
  "verify:full",
  "test:unit",
  "test:integration",
  "test:e2e",
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
if (!scripts.check.includes("check:engineering") || !scripts.check.includes("test:engineering")) {
  console.error("The permanent complete application gate must include engineering source and domain checks.");
  process.exit(1);
}

const workflow = readFileSync(
  resolve(".github/workflows/worker-foundation-ci.yml"),
  "utf8"
);
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
]) {
  if (!workflow.includes(marker)) {
    console.error(`Engineering CI workflow is missing: ${marker}`);
    process.exit(1);
  }
}

for (const forbidden of [
  "continue-on-error",
  "|| true",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "playwright install"
]) {
  if (workflow.includes(forbidden)) {
    console.error(`Engineering CI workflow contains forbidden or unnecessary behaviour: ${forbidden}`);
    process.exit(1);
  }
}

const gitignore = readFileSync(resolve(".gitignore"), "utf8");
for (const marker of [
  "/.engineering/",
  "/.reports/",
  "/playwright-report/",
  "/test-results/",
  "/screenshots/",
  "/videos/",
  "/traces/",
  "/full-terminal-logs/"
]) {
  if (!gitignore.includes(marker)) {
    console.error(`.gitignore is missing generated evidence path: ${marker}`);
    process.exit(1);
  }
}

const profile = readFileSync(
  resolve("docs/engineering/PROJECT-PROFILE.md"),
  "utf8"
);
const matrix = readFileSync(
  resolve("docs/engineering/PROJECT-TEST-MATRIX.md"),
  "utf8"
);
const regression = readFileSync(
  resolve("docs/engineering/REGRESSION-REGISTER.md"),
  "utf8"
);

for (const marker of [
  "Worker",
  "Company",
  "Assessor",
  "Verifier",
  "Administrator",
  "Root",
  "verify:full",
  "PGlite",
  "tenant"
]) {
  if (!profile.includes(marker)) {
    console.error(`PROJECT-PROFILE.md is missing repository-specific evidence: ${marker}`);
    process.exit(1);
  }
}

for (const status of ["PASS", "BLOCKED", "NOT CONFIGURED"]) {
  if (!matrix.includes(status)) {
    console.error(`PROJECT-TEST-MATRIX.md must use explicit status: ${status}`);
    process.exit(1);
  }
}

for (const id of ["REG-001", "REG-003", "REG-018", "REG-020"]) {
  if (!regression.includes(id)) {
    console.error(`REGRESSION-REGISTER.md is missing stable regression ID: ${id}`);
    process.exit(1);
  }
}

console.log(
  "Project-specific engineering standards, verification commands, CI controls, generated-evidence exclusions, handoff mapping and regression register passed."
);
