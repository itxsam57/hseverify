import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "src/app/error.tsx",
  "src/app/global-error.tsx",
  "src/app/worker/login/page.tsx",
  "src/app/worker/(portal)/layout.tsx",
  "src/app/worker/(portal)/dashboard/page.tsx",
  "src/app/worker/(portal)/dashboard/loading.tsx",
  "src/app/worker/(portal)/dashboard/error.tsx",
  "src/app/worker/(portal)/profile/page.tsx",
  "src/app/worker/(portal)/profile/loading.tsx",
  "src/app/worker/(portal)/profile/error.tsx",
  "src/app/worker/(portal)/onboarding/page.tsx",
  "src/app/worker/profile/actions.ts",
  "src/components/worker/profile-forms.tsx",
  "src/lib/config/environment.ts",
  "src/lib/database/database.ts",
  "src/lib/database/pglite-path.mjs",
  "src/lib/worker/profile-domain.ts",
  "src/lib/worker/profile-repository.ts",
  "src/lib/worker/profile-service.ts",
  "database/migrations/0001_platform_foundation.up.sql",
  "database/migrations/0001_platform_foundation.down.sql",
  "src/app/verify/worker/[workerId]/page.tsx"
];

const missing = requiredFiles.filter((path) => !existsSync(resolve(path)));
if (missing.length > 0) {
  console.error(`Missing required Worker Portal or platform files:\n${missing.join("\n")}`);
  process.exit(1);
}

const shell = readFileSync(resolve("src/components/worker/worker-shell.tsx"), "utf8");
for (const label of ["Exit portal", "Sign out", "My profile"]) {
  if (!shell.includes(label)) {
    console.error(`Worker shell is missing the required control: ${label}`);
    process.exit(1);
  }
}

const session = readFileSync(resolve("src/lib/auth/worker-session.ts"), "utf8");
if (!session.includes('role: "worker"')) {
  console.error("Worker session is not explicitly bound to the worker role.");
  process.exit(1);
}

const profileActions = readFileSync(
  resolve("src/app/worker/profile/actions.ts"),
  "utf8"
);
for (const marker of ["requireWorkerSession", "expectedVersion", "revalidatePath"]) {
  if (!profileActions.includes(marker)) {
    console.error(`Worker Profile actions are missing: ${marker}`);
    process.exit(1);
  }
}

const profileRepository = readFileSync(
  resolve("src/lib/worker/profile-repository.ts"),
  "utf8"
);
for (const marker of [
  "DatabaseWorkerProfileRepository",
  "ProfileVersionConflictError",
  "worker_profiles",
  "RETURNING version"
]) {
  if (!profileRepository.includes(marker)) {
    console.error(`Worker Profile database repository is missing: ${marker}`);
    process.exit(1);
  }
}

const applicationDatabase = readFileSync(
  resolve("src/lib/database/database.ts"),
  "utf8"
);
for (const marker of [
  "normalizePgliteDataDirectory",
  "PGlite.create(dataDirectory)"
]) {
  if (!applicationDatabase.includes(marker)) {
    console.error(`Application PGlite boundary is missing: ${marker}`);
    process.exit(1);
  }
}

const nextConfig = readFileSync(resolve("next.config.ts"), "utf8");
if (!nextConfig.includes('serverExternalPackages: ["@electric-sql/pglite"]')) {
  console.error("PGlite must remain external to the Next.js server bundle.");
  process.exit(1);
}
if (nextConfig.includes('transpilePackages: ["@electric-sql/pglite"]')) {
  console.error("PGlite must not be transpiled into the Turbopack server bundle.");
  process.exit(1);
}

const rootError = readFileSync(resolve("src/app/error.tsx"), "utf8");
if (/<html\b|<body\b/i.test(rootError)) {
  console.error("app/error.tsx must render inside the existing root document.");
  process.exit(1);
}

const globalError = readFileSync(resolve("src/app/global-error.tsx"), "utf8");
for (const marker of ["<html", "<body"]) {
  if (!globalError.includes(marker)) {
    console.error(`app/global-error.tsx is missing required document marker: ${marker}`);
    process.exit(1);
  }
}

const migration = readFileSync(
  resolve("database/migrations/0001_platform_foundation.up.sql"),
  "utf8"
);
for (const marker of ["hse_schema_migrations", "worker_profiles", "deployment_releases"]) {
  if (!migration.includes(marker)) {
    console.error(`Platform migration is missing: ${marker}`);
    process.exit(1);
  }
}

const environment = readFileSync(resolve("src/lib/config/environment.ts"), "utf8");
for (const marker of [
  "HSE_APP_ENV",
  "HSE_DATABASE_DRIVER",
  "DATABASE_URL",
  "HSE_RELEASE_SHA"
]) {
  if (!environment.includes(marker)) {
    console.error(`Environment validation is missing: ${marker}`);
    process.exit(1);
  }
}

const dashboardRepository = readFileSync(
  resolve("src/lib/worker/dashboard-repository.ts"),
  "utf8"
);
if (!dashboardRepository.includes("getWorkerProfileView")) {
  console.error("Worker Dashboard is not connected to the Worker Profile projection.");
  process.exit(1);
}

console.log(
  "Worker Portal route, role isolation, native PGlite runtime, error boundary, database persistence and migration manifest passed."
);
