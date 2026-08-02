import "server-only";

import { NodeFS, PGlite } from "@electric-sql/pglite";
import postgres from "postgres";

import { getServerEnvironment } from "@/lib/config/server-environment";
import { normalizePgliteDataDirectory } from "@/lib/database/pglite-path.mjs";

export type DatabaseQueryResult<T> = {
  rows: T[];
  affectedRows: number;
};

export interface DatabaseClient {
  query<T>(statement: string, parameters?: readonly unknown[]): Promise<DatabaseQueryResult<T>>;
  execute(statement: string): Promise<void>;
  close(): Promise<void>;
}

class PGliteDatabaseClient implements DatabaseClient {
  constructor(private readonly database: PGlite) {}

  async query<T>(
    statement: string,
    parameters: readonly unknown[] = []
  ): Promise<DatabaseQueryResult<T>> {
    const result = await this.database.query<T>(statement, [...parameters]);
    return {
      rows: result.rows,
      affectedRows: result.affectedRows ?? 0
    };
  }

  async execute(statement: string): Promise<void> {
    await this.database.exec(statement);
  }

  async close(): Promise<void> {
    await this.database.close();
  }
}

class PostgresDatabaseClient implements DatabaseClient {
  private readonly sql: ReturnType<typeof postgres>;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false
    });
  }

  async query<T>(
    statement: string,
    parameters: readonly unknown[] = []
  ): Promise<DatabaseQueryResult<T>> {
    const result = await this.sql.unsafe(statement, [...parameters] as never[]);
    const count = (result as unknown as { count?: number }).count;
    return {
      rows: Array.from(result) as T[],
      affectedRows: typeof count === "number" ? count : result.length
    };
  }

  async execute(statement: string): Promise<void> {
    await this.sql.unsafe(statement);
  }

  async close(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }
}

async function createDatabaseClient(): Promise<DatabaseClient> {
  const environment = getServerEnvironment();
  if (environment.databaseDriver === "postgres") {
    if (!environment.databaseUrl) {
      throw new Error("Validated PostgreSQL configuration is missing DATABASE_URL.");
    }
    return new PostgresDatabaseClient(environment.databaseUrl);
  }

  const configuredDataDirectory = environment.pgliteDataDir ?? "memory://";
  const dataDirectory = normalizePgliteDataDirectory(configuredDataDirectory);
  const database =
    dataDirectory === "memory://"
      ? await PGlite.create(dataDirectory)
      : await PGlite.create({ fs: new NodeFS(dataDirectory) });

  return new PGliteDatabaseClient(database);
}

declare global {
  var __hseDatabaseClient: Promise<DatabaseClient> | undefined;
}

export function getDatabaseClient(): Promise<DatabaseClient> {
  globalThis.__hseDatabaseClient ??= createDatabaseClient();
  return globalThis.__hseDatabaseClient;
}
