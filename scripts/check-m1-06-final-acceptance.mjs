import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path) {
  const full = resolve(path);
  assert.equal(existsSync(full), true, `${path} must exist.`);
  return readFileSync(full, "utf8");
}

function mustContain(text, pattern, message) {
  assert.match(text, pattern, message);
}

function mustNotContain(text, pattern, message) {
  assert.doesNotMatch(text, pattern, message);
}

const packageDocument = JSON.parse(source("package.json"));
const runner = source("scripts/run-m1-06-final-tests.mjs");
const lifecycle = source("tests/platform/m1-06-final-acceptance.test.mjs");
const recovery = source("tests/platform/m1-06-final-restart-migration.test.mjs");
const nextBuild = source("docs/NEXT_BUILD_UNIT.md");

assert.equal(
  packageDocument.scripts["check:m1-06-final"],
  "node scripts/check-m1-06-final-acceptance.mjs"
);
assert.equal(
  packageDocument.scripts["test:m1-06-final"],
  "node scripts/run-m1-06-final-tests.mjs"
);
for (const aggregate of ["verify:quick", "check"]) {
  mustContain(
    packageDocument.scripts[aggregate],
    /npm run check:m1-06-final(?:\s|$)/,
    `${aggregate} must execute the cumulative M1.06 source guard.`
  );
}
for (const aggregate of ["test:integration", "check"]) {
  mustContain(
    packageDocument.scripts[aggregate],
    /npm run test:m1-06-final(?:\s|$)/,
    `${aggregate} must execute cumulative M1.06 runtime acceptance.`
  );
}

for (const marker of [
  "const ENTRY_FILES",
  "const RUNTIME_STUBS",
  "const LIB_ALIAS_PREFIX = \"@/lib/\"",
  "function resolveSourceImport",
  "specifier.startsWith(LIB_ALIAS_PREFIX)",
  "function runtimeSpecifier",
  "function runtimeSource",
  "function collectRuntimeSources",
  "ts.preProcessFile",
  "normalizeRelativeSourcePath",
  "M1.06 final runtime alias could not be resolved",
  "m1-06-final-acceptance.test.mjs",
  "m1-06-final-restart-migration.test.mjs"
]) {
  mustContain(runner, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Cumulative M1.06 runner must retain ${marker}.`);
}
mustNotContain(runner, /const SOURCE_FILES/,
  "Cumulative M1.06 runner must not regress to a hand-maintained transitive source list.");
mustNotContain(runner, /if \(!specifier\.startsWith\("\."\)\) return null/,
  "Cumulative M1.06 runner must not drop canonical @/lib path-alias dependencies.");

for (const marker of [
  "reserve, quarantine, scan and signed-access boundaries",
  "malicious evidence becomes unsafe",
  "post-scan private-object tampering",
  "Company file remains bound to the exact tenant membership",
  "secure_file.quarantined",
  "secure_file.scan.available",
  "secure_file.access.authorized",
  "secure_file.access.served",
  "revoked session must fail before private storage read"
]) {
  mustContain(lifecycle, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Cumulative lifecycle acceptance must retain ${marker}.`);
}

for (const marker of [
  "survive PGlite/private-storage close and reopen",
  "full M1.06 migration ownership can roll back and reapply",
  "0011_secure_file_foundation",
  "0010_email_delivery_foundation",
  "rollbackLatestMigration",
  "migrationStatus",
  "checksumMatches",
  "secure_file.access.authorized"
]) {
  mustContain(recovery, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Cumulative recovery acceptance must retain ${marker}.`);
}

for (const text of [lifecycle, recovery]) {
  mustNotContain(text, /https?:\/\//i,
    "Cumulative M1.06 acceptance must not introduce public object URLs.");
  mustNotContain(text, /src\/app\/(?:worker|company|assessor|verifier|admin|root)\//,
    "Cumulative M1.06 acceptance is not allowed to create a later product UI workflow.");
  mustNotContain(text, /@ts-ignore|@ts-expect-error|\bas any\b|as unknown as/,
    "Cumulative M1.06 acceptance must not bypass type/security contracts.");
}

mustContain(nextBuild, /Subunit 5[\s\S]{0,260}(?:READY TO BUILD|IN PROGRESS)/i,
  "The canonical build gate must keep Subunit 5 as the active M1.06 unit.");
mustContain(nextBuild, /M1\.07[\s\S]{0,120}blocked/i,
  "M1.07 must remain blocked while M1.06 cumulative acceptance is open.");

console.log("M1.06 cumulative lifecycle, isolation, restart, migration and runtime-alias acceptance guard passed.");
