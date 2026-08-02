import { resolve } from "node:path";

import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";

import { readProjectEnvironment } from "./environment.mjs";

function wrapPglite(executor) {
  return {
    async query(statement, parameters = []) {
      const result = await executor.query(statement, parameters);
      return {
        rows: result.rows,
        affectedRows: result.affectedRows ?? 0
      };
    },
    async execute(statement) {
      await executor.exec(statement);
    }
  };
}

function wrapPostgres(executor) {
  return {
    async query(statement, parameters = []) {
      const result = await executor.unsafe(statement, parameters);
      return {
        rows: Array.from(result),
        affectedRows: typeof result.count === "number" ? result.count : result.length
      };
    },
    async execute(statement) {
      await executor.unsafe(statement);
    }
  };
}

export async function openScriptDatabase(environment = readProjectEnvironment()) {
  if (environment.databaseDriver === "pglite") {
    const dataDir = environment.pgliteDataDir ?? "memory://";
    const database = await PGlite.create(
      dataDir === "memory://" ? dataDir : resolve(dataDir)
    );
    const client = wrapPglite(database);
    return {
      ...client,
      driver: "pglite",
      async transaction(callback) {
        return database.transaction(async (transaction) => callback(wrapPglite(transaction)));
      },
      async close() {
        await database.close();
      }
    };
  }

  const sql = postgres(environment.databaseUrl, {
    max: 2,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false
  });
  const client = wrapPostgres(sql);
  return {
    ...client,
    driver: "postgres",
    async transaction(callback) {
      return sql.begin(async (transaction) => callback(wrapPostgres(transaction)));
    },
    async close() {
      await sql.end({ timeout: 5 });
    }
  };
}
