import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";

const runtime = process.env.HSE_PUBLIC_VERIFICATION_RUNTIME_DIST;
assert.ok(runtime, "HSE_PUBLIC_VERIFICATION_RUNTIME_DIST is required");

const repositoryModule = await import(
  pathToFileURL(
    join(runtime, "public-verification", "public-verification-repository.js")
  ).href
);
const { PublicVerificationRepository } = repositoryModule;

const OWNED_MIGRATION = "0031_public_verification_foundation";
const NOW = "2026-08-17T13:30:00.000Z";
const WORKER_ID = "worker_id_PUBLICLOOKUPWORKER123456";
const IDENTITY_ID = "worker_identity_PUBLICLOOKUPIDENTITY1234";
const VERSION_ID = "identity_version_PUBLICLOOKUPVERSION12345";
const CHECK_ID = "identity_duplicate_check_PUBLICLOOKUPCHECK1234567";

function environment(releaseSha) {
  return {
    appEnvironment: "test",
    databaseDriver: "pglite",
    databaseUrl: null,
    pgliteDataDir: "memory://",
    releaseSha,
    sessionSecret: "m1-12-rate-limit-session-secret-with-more-than-thirty-two-characters",
    authPepper: "m1-12-rate-limit-auth-pepper-with-more-than-thirty-two-characters",
    authSandboxEnabled: false,
    authSandboxAccessKey: null,
    demoAuthEnabled: false,
    demoDataEnabled: false
  };
}

async function setupDatabase(releaseSha) {
  const database = await openScriptDatabase(environment(releaseSha));
  await applyMigrationsThrough(database, releaseSha, OWNED_MIGRATION);
  return database;
}

async function seedVerifiedWorker(database) {
  const accountId = "account_public_lookup_worker";
  await database.query(
    `INSERT INTO auth_accounts (
       account_id, email_normalized, phone_e164, display_name, account_status,
       email_verified_at, phone_verified_at, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,'active',$5,$5,$5,$5)`,
    [
      accountId,
      "private.worker@example.com",
      "+966500000001",
      "Private Account Display Name",
      NOW
    ]
  );
  await database.query(
    `INSERT INTO auth_account_roles (account_id, role, created_at)
     VALUES ($1,'worker',$2)`,
    [accountId, NOW]
  );
  await database.query(
    `INSERT INTO worker_identities (
       identity_id, worker_account_id, lifecycle_status,
       current_version_number, lock_version, created_at, updated_at
     ) VALUES ($1,$2,'draft',1,1,$3,$3)`,
    [IDENTITY_ID, accountId, NOW]
  );
  await database.query(
    `INSERT INTO worker_identity_versions (
       identity_version_id, identity_id, version_number, parent_version_id,
       version_kind, version_status, created_by_account_id,
       created_at, submitted_at
     ) VALUES ($1,$2,1,NULL,'initial','draft',$3,$4,NULL)`,
    [VERSION_ID, IDENTITY_ID, accountId, NOW]
  );
  await database.query(
    `INSERT INTO worker_identity_version_drafts (
       identity_version_id, draft_revision,
       legal_first_name, legal_last_name, previous_legal_name,
       date_of_birth, nationality, country_of_residence,
       verified_email_normalized, email_verified_at,
       verified_phone_e164, phone_verified_at,
       contact_snapshot_at, created_at, updated_at
     ) VALUES (
       $1,1,'Public','Worker','Private Previous Name',
       '1990-01-02','Private Nationality','Private Residence',
       'browser-supplied@example.invalid',$2,
       '+10000000000',$2,$2,$2,$2
     )`,
    [VERSION_ID, NOW]
  );
  await database.query(
    `UPDATE worker_identity_versions
        SET version_status='submitted', submitted_at=$2
      WHERE identity_version_id=$1`,
    [VERSION_ID, NOW]
  );

  for (const [status, lockVersion] of [
    ["submitted", 2],
    ["automated_checks", 3],
    ["manual_review", 4],
    ["verified", 5]
  ]) {
    await database.query(
      `UPDATE worker_identities
          SET lifecycle_status=$2, lock_version=$3
        WHERE identity_id=$1`,
      [IDENTITY_ID, status, lockVersion]
    );
  }

  await database.query(
    `INSERT INTO worker_identity_duplicate_checks (
       check_id, identity_id, identity_version_id, worker_account_id,
       check_sequence, check_status, created_at
     ) VALUES ($1,$2,$3,$4,1,'clear',$5)`,
    [CHECK_ID, IDENTITY_ID, VERSION_ID, accountId, NOW]
  );
  await database.query(
    `INSERT INTO worker_identity_worker_ids (
       permanent_worker_id, identity_id, identity_version_id,
       worker_account_id, issued_by_component, issued_at
     ) VALUES ($1,$2,$3,$4,'identity-assurance',$5)`,
    [WORKER_ID, IDENTITY_ID, VERSION_ID, accountId, NOW]
  );
}

test("M1.12 atomic public rate limits count every concurrent request and isolate actions/buckets", async () => {
  const database = await setupDatabase("m1-12-rate-limit-concurrency");
  try {
    const repository = new PublicVerificationRepository(database);
    const bucketKey = "a".repeat(64);
    const resetBefore = "2026-08-17T13:20:00.000Z";
    const counts = await Promise.all(
      Array.from({ length: 25 }, () =>
        repository.consumeRateLimit({
          action: "lookup",
          bucketKey,
          now: NOW,
          resetBefore
        })
      )
    );
    assert.deepEqual(
      [...counts].sort((a, b) => a - b),
      Array.from({ length: 25 }, (_, index) => index + 1)
    );

    const stored = await database.query(
      `SELECT attempt_count FROM public_verification_rate_limits
       WHERE action='lookup' AND bucket_key=$1`,
      [bucketKey]
    );
    assert.equal(stored.rows[0]?.attempt_count, 25);

    assert.equal(
      await repository.consumeRateLimit({
        action: "result",
        bucketKey,
        now: NOW,
        resetBefore
      }),
      1
    );
    assert.equal(
      await repository.consumeRateLimit({
        action: "lookup",
        bucketKey: "b".repeat(64),
        now: NOW,
        resetBefore
      }),
      1
    );
    assert.equal(
      await repository.consumeRateLimit({
        action: "lookup",
        bucketKey,
        now: "2026-08-17T13:41:00.000Z",
        resetBefore: "2026-08-17T13:31:00.000Z"
      }),
      1
    );
  } finally {
    await database.close();
  }
});

test("M1.12 Worker-ID lookup returns only the explicit public source allow-list", async () => {
  const database = await setupDatabase("m1-12-public-worker-lookup");
  try {
    await seedVerifiedWorker(database);
    const repository = new PublicVerificationRepository(database);
    const row = await repository.findPublicWorkerByPermanentId(WORKER_ID);
    assert.deepEqual(row, {
      permanentWorkerId: WORKER_ID,
      lifecycleStatus: "verified",
      legalFirstName: "Public",
      legalLastName: "Worker",
      issuedAt: NOW
    });
    assert.deepEqual(Object.keys(row).sort(), [
      "issuedAt",
      "legalFirstName",
      "legalLastName",
      "lifecycleStatus",
      "permanentWorkerId"
    ]);

    const serialized = JSON.stringify(row);
    for (const forbidden of [
      "account_public_lookup_worker",
      IDENTITY_ID,
      VERSION_ID,
      "1990-01-02",
      "Private Nationality",
      "Private Residence",
      "private.worker@example.com",
      "+966500000001",
      "Private Previous Name"
    ]) {
      assert.ok(!serialized.includes(forbidden), forbidden);
    }

    assert.equal(
      await repository.findPublicWorkerByPermanentId(
        "worker_id_UNKNOWNPUBLICWORKER123456"
      ),
      null
    );
  } finally {
    await database.close();
  }
});