import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";

const runtime = process.env.HSE_PUBLIC_VERIFICATION_RUNTIME_DIST;
assert.ok(runtime, "HSE_PUBLIC_VERIFICATION_RUNTIME_DIST is required");

const OWNED_MIGRATION = "0032_public_verification_concern_evidence";
const evidenceFiles = Object.freeze({
  migrationUp: "database/migrations/0032_public_verification_concern_evidence.up.sql",
  migrationDown: "database/migrations/0032_public_verification_concern_evidence.down.sql",
  service: "src/lib/public-verification/public-concern-file-service.ts",
  secureFileDomain: "src/lib/secure-files/secure-file-domain.ts",
  contactActions: "src/app/contact/actions.ts",
  concernForm: "src/components/public-verification/public-concern-form.tsx"
});

function source(path) {
  return readFileSync(resolve(path), "utf8");
}

function environment(releaseSha) {
  return {
    appEnvironment: "test",
    databaseDriver: "pglite",
    databaseUrl: null,
    pgliteDataDir: "memory://",
    releaseSha,
    sessionSecret: "m1-12-concern-evidence-session-secret-with-more-than-thirty-two-characters",
    authPepper: "m1-12-concern-evidence-auth-pepper-with-more-than-thirty-two-characters",
    authSandboxEnabled: false,
    authSandboxAccessKey: null,
    demoAuthEnabled: false,
    demoDataEnabled: false
  };
}

function listFilesRecursively(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFilesRecursively(absolute));
    else files.push(absolute);
  }
  return files;
}

test("M1.12 concern evidence adds an owned candidate layer without changing the accepted 0031 concern schema", async () => {
  for (const path of Object.values(evidenceFiles)) {
    assert.equal(existsSync(resolve(path)), true, `${path} must exist`);
  }

  const migration = source(evidenceFiles.migrationUp);
  assert.match(migration, /public_verification_concern_evidence_candidates/);
  assert.match(migration, /public_verification_concerns/);
  assert.match(migration, /platform_secure_files/);
  assert.match(migration, /ON DELETE RESTRICT/i);
  assert.match(migration, /pending/);
  assert.match(migration, /bound/);
  assert.match(migration, /rejected/);
  assert.ok(!/ON DELETE CASCADE/i.test(migration));

  const database = await openScriptDatabase(environment("m1-12-concern-evidence-schema"));
  try {
    await applyMigrationsThrough(database, "m1-12-concern-evidence-schema", OWNED_MIGRATION);
    const columns = await database.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_name='public_verification_concern_evidence_candidates'
        ORDER BY ordinal_position`,
      []
    );
    const names = columns.rows.map((row) => row.column_name);
    for (const required of [
      "candidate_id",
      "concern_id",
      "secure_file_id",
      "candidate_status",
      "created_at"
    ]) {
      assert.ok(names.includes(required), required);
    }
  } finally {
    await database.close();
  }
});

test("M1.12 concern evidence authority is server-branded and browser fields cannot select concern/file/storage ownership", () => {
  const service = source(evidenceFiles.service);
  const secureFileDomain = source(evidenceFiles.secureFileDomain);
  const actions = source(evidenceFiles.contactActions);

  assert.match(service, /PublicConcernUploadAuthority/);
  assert.match(service, /uploadConcernEvidence/);
  assert.match(service, /finalizeConcernEvidenceCandidate/);
  assert.match(secureFileDomain, /public_concern/);

  for (const forbiddenField of [
    "concernId",
    "secureFileId",
    "fileId",
    "reservationKey",
    "objectKey",
    "ownerAccountId",
    "ownerRole"
  ]) {
    assert.ok(
      !new RegExp(`formData\\.get\\([\"']${forbiddenField}[\"']\\)`).test(actions),
      forbiddenField
    );
  }
});

test("M1.12 optional concern evidence reuses M1.06 validation, private storage and scan scheduling before binding", async () => {
  const service = source(evidenceFiles.service);
  const form = source(evidenceFiles.concernForm);

  assert.match(service, /validateSecureFileUpload|createDefaultSecureFileUploadPolicy/);
  assert.match(service, /PrivateObjectStorage|private-object-storage/);
  assert.match(service, /scan|schedule/i);
  assert.match(service, /available/);
  assert.match(service, /unsafe|scan_failed/);

  assert.match(form, /name=["']evidence["']/);
  assert.match(form, /application\/pdf/);
  assert.match(form, /image\/png/);
  assert.match(form, /image\/jpeg/);
  assert.ok(!/encType=/.test(form), "React Server Action form encoding must remain framework-owned");

  const runtimeModulePath = resolve(
    runtime,
    "public-verification",
    "public-concern-file-service.js"
  );
  assert.equal(existsSync(runtimeModulePath), true, "compiled concern file service must exist");
  const module = await import(pathToFileURL(runtimeModulePath).href);
  assert.equal(typeof module.PublicConcernFileService, "function");
});

test("M1.12 public routes expose no concern-evidence preview or download authority", () => {
  const publicRoots = [resolve("src/app/contact"), resolve("src/app/verify")];
  const files = publicRoots.flatMap(listFilesRecursively);
  for (const file of files) {
    const relative = file.replace(resolve("."), "").replaceAll("\\", "/");
    const body = readFileSync(file, "utf8");
    assert.ok(!/signed.*(?:preview|download)|(?:preview|download).*signed/i.test(body), relative);
    assert.ok(!/secure-file-access|createSecureFileAccess|authorizeSecureFileAccess/.test(body), relative);
  }
});
