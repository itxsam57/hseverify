import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputDirectory = resolve(".engineering");
const resultPath = resolve(outputDirectory, "verification-result.json");

const checks = [
  { name: "Complete application gate", command: "npm", args: ["run", "check"] },
  { name: "Deployable preview smoke", command: "npm", args: ["run", "preview:smoke"] },
  { name: "Release evidence manifest", command: "npm", args: ["run", "release:manifest"] }
];

mkdirSync(outputDirectory, { recursive: true });

const startedAt = new Date().toISOString();
const results = [];
let failed = false;

for (const check of checks) {
  if (failed) {
    results.push({ name: check.name, status: "BLOCKED" });
    continue;
  }

  console.log(`\n=== ${check.name} ===`);
  const processResult = spawnSync(check.command, check.args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  const status = processResult.status === 0 ? "PASS" : "FAIL";
  results.push({ name: check.name, status });
  if (status === "FAIL") failed = true;
}

const result = {
  status: failed ? "FAIL" : "PASS",
  startedAt,
  completedAt: new Date().toISOString(),
  checks: results
};

writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

const handoff = spawnSync(process.execPath, ["scripts/report-manual-handoff.mjs"], {
  stdio: "inherit",
  env: {
    ...process.env,
    ENGINEERING_GATE_STATUS: result.status
  }
});

if (handoff.status !== 0) {
  console.error("Manual-test handoff generation failed.");
  process.exit(1);
}

if (failed) {
  console.error("Automated engineering gate failed. Read .engineering/manual-test-handoff.md for the concise summary.");
  process.exit(1);
}

console.log("Automated engineering gate passed and the manual-test handoff was generated.");
