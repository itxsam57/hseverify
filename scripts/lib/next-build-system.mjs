import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const GENERATED_NEXT_ROOT_NAME = ".hse-next";
export const TYPECHECK_DIST_DIR_NAME = ".next-typecheck";
export const RUNTIME_SMOKE_DIST_DIR_NAME = ".next-runtime-smoke";
export const PRODUCTION_DIST_DIR_NAME = ".next";

const NEXT_MODES = new Set(["typecheck", "runtime-smoke", "production-build"]);
const PROTECTED_CONFIGURATION_FILES = [
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "tsconfig.json"
];

function assertMode(mode) {
  if (!NEXT_MODES.has(mode)) {
    throw new Error(`Unsupported Next command mode: ${mode}`);
  }
}

async function removeDirectory(path) {
  await rm(path, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 150
  });
}

async function fileDigest(path) {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex");
}

function modeDefinition(mode) {
  assertMode(mode);

  if (mode === "typecheck") {
    return {
      commandMode: "typegen",
      distDirName: TYPECHECK_DIST_DIR_NAME,
      tsconfigName: "tsconfig.typecheck.json",
      generatedTypeIncludes: [
        `../${TYPECHECK_DIST_DIR_NAME}/types/**/*.ts`,
        `../${TYPECHECK_DIST_DIR_NAME}/dev/types/**/*.ts`
      ]
    };
  }

  if (mode === "runtime-smoke") {
    return {
      commandMode: "runtime-smoke",
      distDirName: RUNTIME_SMOKE_DIST_DIR_NAME,
      tsconfigName: "tsconfig.runtime-smoke.json",
      generatedTypeIncludes: [
        `../${RUNTIME_SMOKE_DIST_DIR_NAME}/types/**/*.ts`,
        `../${RUNTIME_SMOKE_DIST_DIR_NAME}/dev/types/**/*.ts`
      ]
    };
  }

  return {
    commandMode: "production-build",
    distDirName: PRODUCTION_DIST_DIR_NAME,
    tsconfigName: "tsconfig.production.json",
    generatedTypeIncludes: [
      `../${PRODUCTION_DIST_DIR_NAME}/types/**/*.ts`
    ]
  };
}

function generatedTsconfig(definition, mode) {
  return {
    extends: "../tsconfig.json",
    compilerOptions: {
      tsBuildInfoFile: `./cache/${mode}.tsbuildinfo`
    },
    include: [
      "../next-env.d.ts",
      ...definition.generatedTypeIncludes,
      "../src/**/*.ts",
      "../src/**/*.tsx",
      "../next.config.ts"
    ],
    exclude: [
      "../node_modules",
      `../${TYPECHECK_DIST_DIR_NAME}`,
      `../${RUNTIME_SMOKE_DIST_DIR_NAME}`,
      `../${PRODUCTION_DIST_DIR_NAME}/dev`
    ]
  };
}

export async function snapshotProjectConfiguration(projectRoot = process.cwd()) {
  const snapshot = new Map();

  for (const relativePath of PROTECTED_CONFIGURATION_FILES) {
    const absolutePath = resolve(projectRoot, relativePath);
    snapshot.set(relativePath, await fileDigest(absolutePath));
  }

  return snapshot;
}

export async function assertProjectConfigurationUnchanged(
  snapshot,
  projectRoot = process.cwd()
) {
  const changed = [];

  for (const [relativePath, beforeDigest] of snapshot.entries()) {
    const afterDigest = await fileDigest(resolve(projectRoot, relativePath));
    if (afterDigest !== beforeDigest) changed.push(relativePath);
  }

  if (changed.length > 0) {
    throw new Error(
      `Next command modified protected project configuration: ${changed.join(", ")}`
    );
  }
}

export async function prepareNextMode(mode, projectRoot = process.cwd()) {
  const definition = modeDefinition(mode);
  const generatedRoot = resolve(projectRoot, GENERATED_NEXT_ROOT_NAME);
  const distDir = resolve(projectRoot, definition.distDirName);

  await removeDirectory(generatedRoot);
  await removeDirectory(distDir);
  await mkdir(resolve(generatedRoot, "cache"), { recursive: true });

  const tsconfigPath = resolve(generatedRoot, definition.tsconfigName);
  await writeFile(
    tsconfigPath,
    `${JSON.stringify(generatedTsconfig(definition, mode), null, 2)}\n`,
    "utf8"
  );

  return {
    ...definition,
    distDir,
    generatedRoot,
    tsconfigPath,
    environment: {
      HSE_NEXT_COMMAND_MODE: definition.commandMode
    }
  };
}

export async function cleanNextMode(mode, projectRoot = process.cwd()) {
  const definition = modeDefinition(mode);
  await removeDirectory(resolve(projectRoot, definition.distDirName));
  await removeDirectory(resolve(projectRoot, GENERATED_NEXT_ROOT_NAME));
}

export async function cleanAllNextGeneratedOutput(projectRoot = process.cwd()) {
  const removed = [
    resolve(projectRoot, TYPECHECK_DIST_DIR_NAME),
    resolve(projectRoot, RUNTIME_SMOKE_DIST_DIR_NAME),
    resolve(projectRoot, PRODUCTION_DIST_DIR_NAME),
    resolve(projectRoot, GENERATED_NEXT_ROOT_NAME)
  ];

  for (const path of removed) await removeDirectory(path);
  return removed;
}

export async function verifyNextGeneratedFiles(projectRoot = process.cwd()) {
  await stat(resolve(projectRoot, "next-env.d.ts"));
}
