import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  cleanGeneratedDevelopmentOutput,
  RUNTIME_SMOKE_DIST_DIR_NAME
} from "../../scripts/lib/next-output-boundary.mjs";

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

test("stale development types are removed without deleting production output", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "hse-next-output-boundary-"));
  const staleValidator = join(projectRoot, ".next", "dev", "types", "validator.ts");
  const productionSentinel = join(projectRoot, ".next", "types", "production-sentinel.ts");
  const runtimeValidator = join(
    projectRoot,
    RUNTIME_SMOKE_DIST_DIR_NAME,
    "dev",
    "types",
    "validator.ts"
  );

  try {
    await mkdir(join(staleValidator, ".."), { recursive: true });
    await mkdir(join(productionSentinel, ".."), { recursive: true });
    await mkdir(join(runtimeValidator, ".."), { recursive: true });

    await writeFile(staleValidator, "er = {} as typeof import('broken');\n");
    await writeFile(productionSentinel, "export type ProductionSentinel = true;\n");
    await writeFile(runtimeValidator, "partial generated development output\n");

    await cleanGeneratedDevelopmentOutput(projectRoot);

    assert.equal(await pathExists(staleValidator), false);
    assert.equal(await pathExists(runtimeValidator), false);
    assert.equal(
      await readFile(productionSentinel, "utf8"),
      "export type ProductionSentinel = true;\n"
    );

    await cleanGeneratedDevelopmentOutput(projectRoot);
    assert.equal(await pathExists(staleValidator), false);
  } finally {
    await rm(projectRoot, {
      recursive: true,
      force: true,
      maxRetries: 8,
      retryDelay: 125
    });
  }
});
