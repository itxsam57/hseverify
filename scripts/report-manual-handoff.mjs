import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildManualTests,
  classifyChangedFiles,
  decideHandoffStatus,
  summarizeUnaffectedFeatures
} from "./lib/handoff-domain.mjs";

const outputDirectory = resolve(".engineering");
const resultPath = resolve(outputDirectory, "verification-result.json");
const reportPath = resolve(outputDirectory, "manual-test-handoff.md");

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  }).trim();
}

function canResolve(ref) {
  try {
    git(["rev-parse", "--verify", ref]);
    return true;
  } catch {
    return false;
  }
}

function resolveBaseRef() {
  const candidates = [
    process.env.HANDOFF_BASE_REF,
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null,
    "origin/main",
    "main",
    "HEAD^"
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (canResolve(candidate)) return candidate;
  }
  return null;
}

function changedFiles(baseRef) {
  if (!baseRef) return [];
  const output = git(["diff", "--name-only", "--diff-filter=ACMRDTUXB", `${baseRef}...HEAD`]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function safeJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function requestedChange(baseRef) {
  if (process.env.HANDOFF_REQUEST?.trim()) return process.env.HANDOFF_REQUEST.trim();
  if (baseRef) {
    try {
      const messages = git(["log", "--format=%s", `${baseRef}..HEAD`])
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(0, 3);
      if (messages.length > 0) return messages.join("; ");
    } catch {
      // Fall through to the current commit subject.
    }
  }
  try {
    return git(["log", "-1", "--format=%s"]);
  } catch {
    return "Repository engineering verification.";
  }
}

function formatManualTests(tests) {
  if (tests.length === 0) {
    return "No visible product behaviour changed. The owner does not need to run a browser test for this engineering-only installation.";
  }

  return tests
    .map(
      (test) => `### ${test.id}

- **Related feature:** ${test.feature}
- **Role/account:** ${test.role}
- **Starting page:** \`${test.start}\`
- **Required test data:** ${test.data}
- **Steps:**
${test.steps.map((step, index) => `  ${index + 1}. ${step}`).join("\n")}
- **Expected visible result:** ${test.expected}
- **Refresh expectation:** ${test.refresh}`
    )
    .join("\n\n");
}

function verificationSummary(result) {
  if (!result) return "- Automated gate result is unavailable. Run `npm run verify:full` before handoff.";
  return result.checks
    .map((check) => `- **${check.name}:** ${check.status}`)
    .join("\n");
}

function selectVisibleHandoffFeatures(classification) {
  const companyScope = classification.visibleFeatures.find(
    (feature) => feature.id === "COMPANY_SCOPE_DEMO"
  );
  if (companyScope) {
    // This exact workflow already includes Company login/TOTP, dashboard entry,
    // no-refresh CRUD, Worker copied-route denial and session continuity. Do not
    // make the owner repeat generic Company/auth/authorization variants.
    return [companyScope];
  }
  return classification.visibleFeatures;
}

mkdirSync(outputDirectory, { recursive: true });

const baseRef = resolveBaseRef();
const files = changedFiles(baseRef);
const classification = classifyChangedFiles(files);
const handoffFeatures = selectVisibleHandoffFeatures(classification);
const result = safeJson(resultPath);
const gatePassed = result?.status === "PASS";
const status = decideHandoffStatus({
  gatePassed,
  visibleFeatureCount: handoffFeatures.length
});
const tests = buildManualTests(handoffFeatures);
const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || (() => {
  try {
    return git(["branch", "--show-current"]) || "detached";
  } catch {
    return "unknown";
  }
})();
const commit = (() => {
  try {
    return git(["rev-parse", "HEAD"]);
  } catch {
    return "unknown";
  }
})();
const preview =
  process.env.PREVIEW_URL ||
  process.env.DEPLOYMENT_URL ||
  "No hosted preview URL is configured. CI produces a provider-neutral preview artifact.";
const unaffected = summarizeUnaffectedFeatures(classification);

const report = `${status}

# HSE Verify Manual Test Handoff

## Build information

- **Project:** HSE Verify
- **Branch:** \`${branch}\`
- **Commit:** \`${commit}\`
- **Base:** \`${baseRef ?? "unresolved"}\`
- **Preview/runnable link:** ${preview}
- **Automated gate:** ${gatePassed ? "PASS" : result?.status ?? "NOT RUN"}

## Requested change

${requestedChange(baseRef)}

## Visible features changed

${
  handoffFeatures.length === 0
    ? "- None. Changes are limited to engineering standards, verification orchestration, CI, and handoff tooling."
    : handoffFeatures
        .map(
          (feature) =>
            `- **${feature.label}** — ${feature.roles.join(", ")} — ${feature.risk.toUpperCase()} risk`
        )
        .join("\n")
}

## Internal engineering areas changed

${
  classification.internalFeatures.length === 0
    ? "- None identified."
    : classification.internalFeatures
        .map((feature) => `- ${feature.label}`)
        .join("\n")
}

## Exact manual tests

${formatManualTests(tests)}

## Regression areas to spot-check

${
  handoffFeatures.length === 0
    ? "- None required for this engineering-only installation."
    : "- Use only the regression areas named inside the manual tests above; do not retest the whole product."
}

## Unaffected areas

${
  unaffected.length === 0
    ? "- No major area can be confidently excluded because shared high-impact code changed."
    : unaffected.map((item) => `- ${item}`).join("\n")
}

## Setup requirements

${
  tests.length === 0
    ? "- None."
    : "- Use only synthetic local accounts and data. Never use production credentials, users, documents, or tenant records."
}

## Automated evidence

${verificationSummary(result)}

## Known limitations

- There is no repository-controlled hosted preview URL.
- Full browser automation is not installed; current stable runtime/security workflows use real Next.js HTTP and PGlite tests.
- Live email, SMS, storage, malware scanning, liveness, video/interview, and payment providers remain blocked by later milestones and credentials.
- Generated reports are intentionally concise; complete successful logs remain in CI only.

## Classification diagnostics

- Changed files examined: ${classification.files.length}
- Handoff-visible features after overlap consolidation: ${handoffFeatures.length}
- Unmatched non-UI files: ${classification.unmatched.length}
`;

writeFileSync(reportPath, report, "utf8");
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`, "utf8");
}
console.log(report);
