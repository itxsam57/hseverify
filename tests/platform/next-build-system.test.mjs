import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  assertProjectConfigurationUnchanged,
  cleanAllNextGeneratedOutput,
  cleanNextMode,
  GENERATED_NEXT_ROOT_NAME,
  prepareNextMode,
  PRODUCTION_DIST_DIR_NAME,
  RUNTIME_SMOKE_DIST_DIR_NAME,
  snapshotProjectConfiguration,
  TYPECHECK_DIST_DIR_NAME
} from "../../scripts/lib/next-build-system.mjs";

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function createProtectedConfiguration(projectRoot) {
  const files = {
    "package.json": "{}\n",
    "package-lock.json": "{}\n",
    "next.config.ts": "export default {};\n",
    "tsconfig.json": "{}\n"
  };

  for (const [path, content] of Object.entries(files)) {
    await writeFile(join(projectRoot, path), content, "utf8");
  }
}

test("repository keeps generated Next files outside tracked source", async () => {
  const projectRoot = resolve(import.meta.dirname, "..", "..");
  const ignoreFile = await readFile(join(projectRoot, ".gitignore"), "utf8");
  const eslintConfig = await readFile(join(projectRoot, "eslint.config.mjs"), "utf8");
  const tsconfig = JSON.parse(await readFile(join(projectRoot, "tsconfig.json"), "utf8"));
  const packageJson = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));

  for (const ignoredPath of [
    "/.next/",
    "/.next-typecheck/",
    "/.next-runtime-smoke/",
    "/.hse-next/",
    "next-env.d.ts"
  ]) {
    assert.match(ignoreFile, new RegExp(ignoredPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  for (const lintIgnore of [
    ".next-typecheck/**",
    ".next-runtime-smoke/**",
    ".hse-next/**"
  ]) {
    assert.match(eslintConfig, new RegExp(lintIgnore.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.equal(tsconfig.compilerOptions.jsx, "preserve");
  assert.equal(tsconfig.compilerOptions.forceConsistentCasingInFileNames, true);
  assert.equal(packageJson.scripts.typecheck, "node scripts/typecheck-project.mjs");
  assert.equal(packageJson.scripts.build, "node scripts/build-production.mjs");
  assert.match(packageJson.scripts.check, /test:next-system/);

  const trackedGeneratedFile = spawnSync(
    "git",
    ["ls-files", "--error-unmatch", "next-env.d.ts"],
    { cwd: projectRoot, encoding: "utf8", windowsHide: true }
  );
  assert.notEqual(
    trackedGeneratedFile.status,
    0,
    "next-env.d.ts must remain generated, ignored and untracked."
  );

  for (const obsoletePath of [
    "scripts/clean-next-development-output.mjs",
    "scripts/lib/next-output-boundary.mjs",
    "tests/platform/next-output-boundary.test.mjs"
  ]) {
    assert.equal(await pathExists(join(projectRoot, obsoletePath)), false);
  }
});

test("all Next commands use isolated generated configs and outputs", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "hse-next-system-"));

  try {
    await createProtectedConfiguration(projectRoot);
    const snapshot = await snapshotProjectConfiguration(projectRoot);

    for (const staleRoot of [
      TYPECHECK_DIST_DIR_NAME,
      RUNTIME_SMOKE_DIST_DIR_NAME,
      PRODUCTION_DIST_DIR_NAME,
      GENERATED_NEXT_ROOT_NAME
    ]) {
      await mkdir(join(projectRoot, staleRoot), { recursive: true });
      await writeFile(join(projectRoot, staleRoot, "stale.txt"), "stale\n");
    }

    const typecheck = await prepareNextMode("typecheck", projectRoot);
    const typecheckConfig = JSON.parse(await readFile(typecheck.tsconfigPath, "utf8"));
    assert.equal(typecheck.commandMode, "typegen");
    assert.equal(typecheck.distDir, join(projectRoot, TYPECHECK_DIST_DIR_NAME));
    assert.ok(
      typecheckConfig.include.includes(`../${TYPECHECK_DIST_DIR_NAME}/types/**/*.ts`)
    );
    assert.equal(
      await pathExists(join(projectRoot, TYPECHECK_DIST_DIR_NAME, "stale.txt")),
      false
    );
    await assertProjectConfigurationUnchanged(snapshot, projectRoot);
    await cleanNextMode("typecheck", projectRoot);

    const runtime = await prepareNextMode("runtime-smoke", projectRoot);
    const runtimeConfig = JSON.parse(await readFile(runtime.tsconfigPath, "utf8"));
    assert.equal(runtime.commandMode, "runtime-smoke");
    assert.ok(
      runtimeConfig.include.includes(
        `../${RUNTIME_SMOKE_DIST_DIR_NAME}/dev/types/**/*.ts`
      )
    );
    await cleanNextMode("runtime-smoke", projectRoot);

    const production = await prepareNextMode("production-build", projectRoot);
    const productionConfig = JSON.parse(
      await readFile(production.tsconfigPath, "utf8")
    );
    assert.equal(production.commandMode, "production-build");
    assert.ok(
      productionConfig.include.includes(`../${PRODUCTION_DIST_DIR_NAME}/types/**/*.ts`)
    );
    assert.equal(
      productionConfig.include.includes(`../${PRODUCTION_DIST_DIR_NAME}/dev/types/**/*.ts`),
      false
    );
    await cleanNextMode("production-build", projectRoot);

    await assert.rejects(
      () => prepareNextMode("unknown", projectRoot),
      /Unsupported Next command mode/
    );
  } finally {
    await rm(projectRoot, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 150
    });
  }
});

test("protected project configuration mutation is detected", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "hse-next-config-"));

  try {
    await createProtectedConfiguration(projectRoot);
    const snapshot = await snapshotProjectConfiguration(projectRoot);
    await writeFile(join(projectRoot, "tsconfig.json"), "{\"changed\":true}\n", "utf8");

    await assert.rejects(
      () => assertProjectConfigurationUnchanged(snapshot, projectRoot),
      /tsconfig\.json/
    );
  } finally {
    await rm(projectRoot, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 150
    });
  }
});

test("complete cleanup removes every generated Next workspace", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "hse-next-clean-"));

  try {
    for (const generatedRoot of [
      TYPECHECK_DIST_DIR_NAME,
      RUNTIME_SMOKE_DIST_DIR_NAME,
      PRODUCTION_DIST_DIR_NAME,
      GENERATED_NEXT_ROOT_NAME
    ]) {
      await mkdir(join(projectRoot, generatedRoot), { recursive: true });
      await writeFile(join(projectRoot, generatedRoot, "partial.txt"), "partial\n");
    }

    await cleanAllNextGeneratedOutput(projectRoot);

    for (const generatedRoot of [
      TYPECHECK_DIST_DIR_NAME,
      RUNTIME_SMOKE_DIST_DIR_NAME,
      PRODUCTION_DIST_DIR_NAME,
      GENERATED_NEXT_ROOT_NAME
    ]) {
      assert.equal(await pathExists(join(projectRoot, generatedRoot)), false);
    }
  } finally {
    await rm(projectRoot, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 150
    });
  }
});
