import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const MIGRATIONS_DIRECTORY = resolve("database", "migrations");

function sha256(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export async function listMigrations() {
  const files = (await readdir(MIGRATIONS_DIRECTORY))
    .filter((file) => /^\d+_[a-z0-9_]+\.up\.sql$/.test(file))
    .sort();

  return Promise.all(
    files.map(async (file) => {
      const id = file.replace(/\.up\.sql$/, "");
      const upSql = await readFile(resolve(MIGRATIONS_DIRECTORY, file), "utf8");
      const downPath = resolve(MIGRATIONS_DIRECTORY, `${id}.down.sql`);
      const downSql = await readFile(downPath, "utf8").catch(() => null);
      return {
        id,
        upSql,
        downSql,
        checksum: sha256(upSql)
      };
    })
  );
}

export async function ensureMigrationTable(database) {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS hse_schema_migrations (
      migration_id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      release_sha TEXT NOT NULL
    );
  `);
}

export async function migrationStatus(database) {
  await ensureMigrationTable(database);
  const migrations = await listMigrations();
  const appliedResult = await database.query(
    "SELECT migration_id, checksum, applied_at, release_sha FROM hse_schema_migrations ORDER BY migration_id"
  );
  const applied = new Map(appliedResult.rows.map((row) => [row.migration_id, row]));

  return migrations.map((migration) => {
    const record = applied.get(migration.id) ?? null;
    return {
      ...migration,
      applied: Boolean(record),
      checksumMatches: !record || record.checksum === migration.checksum,
      appliedAt: record?.applied_at ?? null,
      releaseSha: record?.release_sha ?? null
    };
  });
}

export async function applyPendingMigrations(database, releaseSha) {
  const status = await migrationStatus(database);
  const mismatched = status.filter((migration) => !migration.checksumMatches);
  if (mismatched.length > 0) {
    throw new Error(
      `Applied migration checksum mismatch: ${mismatched.map((item) => item.id).join(", ")}`
    );
  }

  const pending = status.filter((migration) => !migration.applied);
  for (const migration of pending) {
    await database.transaction(async (transaction) => {
      await transaction.execute(migration.upSql);
      await transaction.query(
        `INSERT INTO hse_schema_migrations (migration_id, checksum, release_sha)
         VALUES ($1, $2, $3)`,
        [migration.id, migration.checksum, releaseSha]
      );
    });
  }

  return pending.map((migration) => migration.id);
}

export async function rollbackLatestMigration(database, environment) {
  if (environment.appEnvironment === "preview" || environment.appEnvironment === "production") {
    throw new Error(
      "Destructive database rollback is prohibited in preview and production. Build and validate a previous release artifact instead."
    );
  }
  if (process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK !== "true") {
    throw new Error(
      "Set HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK=true to acknowledge a local/test destructive rollback."
    );
  }

  const status = await migrationStatus(database);
  const latest = [...status].reverse().find((migration) => migration.applied);
  if (!latest) {
    return null;
  }
  if (!latest.downSql) {
    throw new Error(`Migration ${latest.id} has no down migration.`);
  }

  await database.transaction(async (transaction) => {
    await transaction.execute(latest.downSql);
    await transaction.query(
      "DELETE FROM hse_schema_migrations WHERE migration_id = $1",
      [latest.id]
    );
  });
  return latest.id;
}

export async function migrationSetChecksum() {
  const migrations = await listMigrations();
  return sha256(
    migrations.map((migration) => `${migration.id}:${migration.checksum}`).join("\n")
  );
}
