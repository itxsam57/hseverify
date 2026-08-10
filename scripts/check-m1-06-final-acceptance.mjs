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
const checksumRepair = source("tests/platform/migration-checksum-repair.test.mjs");
const repairedUploadMigration = source(
  "database/migrations/0012_secure_file_upload_quarantine.up.sql"
);
const migrationEngine = source("scripts/lib/migrations.mjs");
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
  "m1-06-final-restart-migration.test.mjs",
  "migration-checksum-repair.test.mjs"
]) {
  mustContain(
    runner,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Cumulative M1.06 runner must retain ${marker}.`
  );
}
mustNotContain(
  runner,
  /const SOURCE_FILES/,
  "Cumulative M1.06 runner must not regress to a hand-maintained transitive source list."
);
mustNotContain(
  runner,
  /if \(!specifier\.startsWith\("\."\)\) return null/,
  "Cumulative M1.06 runner must not drop canonical @/lib path-alias dependencies."
);

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
  mustContain(
    lifecycle,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Cumulative lifecycle acceptance must retain ${marker}.`
  );
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
  mustContain(
    recovery,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Cumulative recovery acceptance must retain ${marker}.`
  );
}

// REG-072: current code must be able to replay the historical Subunit 2
// migration without invalidating immutable audit facts created by Subunits 3-4.
for (const action of [
  "secure_file.quarantined",
  "secure_file.scan.queued",
  "secure_file.scan.available",
  "secure_file.scan.unsafe",
  "secure_file.scan.failed",
  "secure_file.access.authorized",
  "secure_file.access.served"
]) {
  mustContain(
    repairedUploadMigration,
    new RegExp(`'${action.replaceAll(".", "\\.")}'`),
    `The repaired 0012 migration must preserve append-only audit action ${action}.`
  );
}
for (const marker of [
  "0012_secure_file_upload_quarantine",
  "98507fbb39bfeba540a2a06b71e727f28123d35489a89b562dce8396e790af1b",
  "ca17b96eb02983a365bf2a560b4e2428f90efa0b9e845ea550e9ff7d227b04e5",
  "migrationChecksumCompatibility",
  "approved_repair",
  "normalizeApprovedChecksumRepair",
  "SET checksum = $1"
]) {
  mustContain(
    migrationEngine,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Migration repair engine must retain ${marker}.`
  );
}
for (const marker of [
  "migration checksum repair is pinned to one legacy/current pair",
  "approved legacy checksum is normalized once while every unknown mismatch still fails closed",
  "a later unapproved edit must not inherit the historical checksum exception",
  "Applied migration checksum mismatch: 0012_secure_file_upload_quarantine"
]) {
  mustContain(
    checksumRepair,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Migration checksum repair regression must retain ${marker}.`
  );
}

for (const text of [lifecycle, recovery, checksumRepair]) {
  mustNotContain(
    text,
    /https?:\/\//i,
    "Cumulative M1.06 acceptance must not introduce public object URLs."
  );
  mustNotContain(
    text,
    /src\/app\/(?:worker|company|assessor|verifier|admin|root)\//,
    "Cumulative M1.06 acceptance is not allowed to create a later product UI workflow."
  );
  mustNotContain(
    text,
    /@ts-ignore|@ts-expect-error|\bas any\b|as unknown as/,
    "Cumulative M1.06 acceptance must not bypass type/security contracts."
  );
}

mustContain(
  nextBuild,
  /Subunit 5[\s\S]{0,260}(?:READY TO BUILD|IN PROGRESS)/i,
  "The canonical build gate must keep Subunit 5 as the active M1.06 unit."
);
mustContain(
  nextBuild,
  /M1\.07[\s\S]{0,120}blocked/i,
  "M1.07 must remain blocked while M1.06 cumulative acceptance is open."
);

console.log(
  "M1.06 cumulative lifecycle, isolation, restart, migration, approved-checksum-repair and runtime-alias acceptance guard passed."
);
