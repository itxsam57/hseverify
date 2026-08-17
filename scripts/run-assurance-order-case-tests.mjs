import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const tests = [
  "assurance-order-case-domain.test.mjs",
  "assurance-order-case-migration.test.mjs",
  "assurance-order-case-service.test.mjs",
  "assurance-order-case-routes.test.mjs"
].map((name) => resolve("tests", "platform", name));

const result = spawnSync(process.execPath, ["--test", ...tests], {
  stdio: "inherit",
  env: { ...process.env }
});

process.exitCode = result.status ?? 1;
