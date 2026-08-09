import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputDirectory = resolve(".secure-access-test-dist");
rmSync(outputDirectory, { recursive: true, force: true });

const compiler = spawnSync(
  process.execPath,
  [
    resolve("node_modules", "typescript", "bin", "tsc"),
    "-p",
    "tsconfig.secure-access-tests.json"
  ],
  { stdio: "inherit" }
);
if (compiler.status !== 0) process.exit(compiler.status ?? 1);

// The production module deliberately imports `server-only`. Standalone Node
// tests do not run with Next's react-server condition, so remove only the
// emitted marker import from the isolated test copy after strict TypeScript
// has already compiled the real source. Production source remains unchanged.
const compiledDomain = resolve(
  outputDirectory,
  "secure-files",
  "secure-file-access-domain.js"
);
const compiledSource = readFileSync(compiledDomain, "utf8");
const testSource = compiledSource.replace(/require\(["']server-only["']\);\r?\n/, "");
if (testSource === compiledSource) {
  throw new Error("Secure access test harness could not isolate the server-only marker.");
}
writeFileSync(compiledDomain, testSource, "utf8");

const tests = spawnSync(
  process.execPath,
  [
    "--test",
    resolve("tests", "secure-files", "secure-file-access-domain.test.mjs")
  ],
  { stdio: "inherit" }
);

rmSync(outputDirectory, { recursive: true, force: true });
process.exit(tests.status ?? 1);
