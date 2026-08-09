import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, resolve } from "node:path";

const outputDirectory = resolve(".email-delivery-runtime-test-dist");
rmSync(outputDirectory, { recursive: true, force: true });

const compiler = spawnSync(
  process.execPath,
  [
    resolve("node_modules", "typescript", "bin", "tsc"),
    "-p",
    "tsconfig.email-delivery-runtime-tests.json"
  ],
  { stdio: "inherit" }
);
if (compiler.status !== 0) {
  process.exit(compiler.status ?? 1);
}

// These runtime tests inject the real PGlite script client explicitly. Replace only
// the compiled default environment/database factories so Node can execute the
// compiled server modules without resolving application-only @ aliases. Product
// source is untouched and the real repository/handler SQL still executes.
const databaseStub = resolve(outputDirectory, "database", "database.js");
mkdirSync(dirname(databaseStub), { recursive: true });
writeFileSync(
  databaseStub,
  '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.getDatabaseClient = async function getDatabaseClient() { throw new Error("Runtime test must inject a database client."); };\n',
  "utf8"
);

const environmentStub = resolve(
  outputDirectory,
  "config",
  "server-environment.js"
);
mkdirSync(dirname(environmentStub), { recursive: true });
writeFileSync(
  environmentStub,
  '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.getServerEnvironment = function getServerEnvironment() { throw new Error("Runtime test must inject the local/test adapter environment."); };\n',
  "utf8"
);

const tests = spawnSync(
  process.execPath,
  [
    "--conditions=react-server",
    "--test",
    resolve("tests", "platform", "email-delivery-runtime.test.mjs")
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      HSE_EMAIL_DELIVERY_RUNTIME_DIST: outputDirectory
    }
  }
);

rmSync(outputDirectory, { recursive: true, force: true });
process.exit(tests.status ?? 1);
