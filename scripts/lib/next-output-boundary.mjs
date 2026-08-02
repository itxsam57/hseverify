import { rm } from "node:fs/promises";
import { resolve } from "node:path";

export const RUNTIME_SMOKE_DIST_DIR_NAME = ".next-runtime-smoke";

async function removeDirectory(path) {
  await rm(path, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 125
  });
}

export async function cleanGeneratedDevelopmentOutput(projectRoot = process.cwd()) {
  const nextDevelopmentRoot = resolve(projectRoot, ".next", "dev");
  const runtimeSmokeRoot = resolve(projectRoot, RUNTIME_SMOKE_DIST_DIR_NAME);

  await removeDirectory(nextDevelopmentRoot);
  await removeDirectory(runtimeSmokeRoot);

  return {
    nextDevelopmentRoot,
    runtimeSmokeRoot
  };
}

export async function cleanRuntimeSmokeOutput(projectRoot = process.cwd()) {
  const runtimeSmokeRoot = resolve(projectRoot, RUNTIME_SMOKE_DIST_DIR_NAME);
  await removeDirectory(runtimeSmokeRoot);
  return runtimeSmokeRoot;
}
