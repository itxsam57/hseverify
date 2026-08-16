import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const result = spawnSync(
  process.execPath,
  [
    "--test",
    resolve("tests", "platform", "worker-evidence-migration-stack.test.mjs")
  ],
  {
    stdio: "inherit",
    env: process.env
  }
);

process.exit(result.status ?? 1);
