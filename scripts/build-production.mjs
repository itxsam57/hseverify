import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { cleanGeneratedDevelopmentOutput } from "./lib/next-output-boundary.mjs";

await cleanGeneratedDevelopmentOutput();

const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "build"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    HSE_NEXT_DIST_DIR: ""
  },
  stdio: "inherit",
  windowsHide: true
});

const result = await new Promise((resolveResult, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => resolveResult({ code, signal }));
});

if (result.signal) {
  throw new Error(`Next production build stopped by signal ${result.signal}.`);
}

if (result.code !== 0) {
  process.exitCode = result.code ?? 1;
}
