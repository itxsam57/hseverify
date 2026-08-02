export type HseAppEnvironment = "development" | "test" | "preview" | "production";
export type HseDatabaseDriver = "pglite" | "postgres";

export type RuntimeEnvironment = {
  appEnvironment: HseAppEnvironment;
  databaseDriver: HseDatabaseDriver;
  databaseUrl: string | null;
  pgliteDataDir: string | null;
  releaseSha: string;
  sessionSecret: string;
  demoAuthEnabled: boolean;
  demoDataEnabled: boolean;
};

export class EnvironmentConfigurationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid HSE Verify environment configuration:\n- ${issues.join("\n- ")}`);
    this.name = "EnvironmentConfigurationError";
    this.issues = issues;
  }
}

function readBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function readAppEnvironment(input: NodeJS.ProcessEnv): HseAppEnvironment {
  const value = input.HSE_APP_ENV?.trim();
  if (
    value === "development" ||
    value === "test" ||
    value === "preview" ||
    value === "production"
  ) {
    return value;
  }

  if (input.NODE_ENV === "production") {
    return "production";
  }

  return "development";
}

function defaultDriver(environment: HseAppEnvironment): HseDatabaseDriver {
  return environment === "development" || environment === "test"
    ? "pglite"
    : "postgres";
}

export function validateRuntimeEnvironment(
  input: NodeJS.ProcessEnv = process.env
): RuntimeEnvironment {
  const issues: string[] = [];
  const appEnvironment = readAppEnvironment(input);
  const requestedDriver = input.HSE_DATABASE_DRIVER?.trim();
  const databaseDriver: HseDatabaseDriver =
    requestedDriver === "pglite" || requestedDriver === "postgres"
      ? requestedDriver
      : defaultDriver(appEnvironment);
  const sessionSecret = input.HSE_SESSION_SECRET?.trim() ?? "";
  const databaseUrl = input.DATABASE_URL?.trim() || null;
  const pgliteDataDir =
    input.HSE_PGLITE_DATA_DIR?.trim() ||
    (appEnvironment === "test" ? "memory://" : ".data/postgres");
  const releaseSha = input.HSE_RELEASE_SHA?.trim() || "local-development";
  const demoAuthEnabled = readBoolean(input.HSE_ENABLE_WORKER_DEMO_AUTH);
  const demoDataEnabled = readBoolean(input.HSE_USE_WORKER_DEMO_DATA);

  if (sessionSecret.length < 32) {
    issues.push("HSE_SESSION_SECRET must contain at least 32 characters.");
  }

  if (databaseDriver === "postgres") {
    if (!databaseUrl) {
      issues.push("DATABASE_URL is required when HSE_DATABASE_DRIVER=postgres.");
    } else if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
      issues.push("DATABASE_URL must use the postgres:// or postgresql:// scheme.");
    }
  }

  if (
    databaseDriver === "pglite" &&
    (appEnvironment === "preview" || appEnvironment === "production")
  ) {
    issues.push("PGlite is restricted to development and test environments.");
  }

  if (
    (appEnvironment === "preview" || appEnvironment === "production") &&
    releaseSha === "local-development"
  ) {
    issues.push("HSE_RELEASE_SHA is required in preview and production environments.");
  }

  if (appEnvironment === "production" && demoAuthEnabled) {
    issues.push("HSE_ENABLE_WORKER_DEMO_AUTH must be false in production.");
  }

  if (appEnvironment === "production" && demoDataEnabled) {
    issues.push("HSE_USE_WORKER_DEMO_DATA must be false in production.");
  }

  if (issues.length > 0) {
    throw new EnvironmentConfigurationError(issues);
  }

  return {
    appEnvironment,
    databaseDriver,
    databaseUrl,
    pgliteDataDir: databaseDriver === "pglite" ? pgliteDataDir : null,
    releaseSha,
    sessionSecret,
    demoAuthEnabled,
    demoDataEnabled
  };
}
