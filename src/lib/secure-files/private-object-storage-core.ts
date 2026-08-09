import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

export type PrivateObjectStat = Readonly<{
  byteSize: number;
  sha256: string;
}>;

export interface PrivateObjectStorage {
  put(objectKey: string, bytes: Uint8Array): Promise<PrivateObjectStat>;
  read(objectKey: string): Promise<Uint8Array | null>;
  stat(objectKey: string): Promise<PrivateObjectStat | null>;
  delete(objectKey: string): Promise<boolean>;
}

export class PrivateObjectStorageError extends Error {
  constructor(message = "Private object storage operation failed.") {
    super(message);
    this.name = "PrivateObjectStorageError";
  }
}

export class PrivateObjectConflictError extends PrivateObjectStorageError {
  constructor() {
    super("Private object already exists with different content.");
    this.name = "PrivateObjectConflictError";
  }
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function normalizeObjectKey(value: string): string {
  if (
    typeof value !== "string" ||
    !/^secure-files\/[a-f0-9]{64}$/.test(value)
  ) {
    throw new PrivateObjectStorageError("Private object key is invalid.");
  }
  return value;
}

function errnoCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const value = (error as { code?: unknown }).code;
  return typeof value === "string" ? value : null;
}

function isInsideBase(base: string, target: string): boolean {
  const path = relative(base, target);
  return (
    path === "" ||
    (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`))
  );
}

export class LocalTestPrivateObjectStorage implements PrivateObjectStorage {
  private readonly root: string;

  constructor(input: {
    appEnvironment: "development" | "test";
    trustedBasePath: string;
    rootPath: string;
  }) {
    if (
      input.appEnvironment !== "development" &&
      input.appEnvironment !== "test"
    ) {
      throw new PrivateObjectStorageError(
        "Local/test private object storage is not permitted in this environment."
      );
    }
    if (
      typeof input.trustedBasePath !== "string" ||
      input.trustedBasePath.trim().length === 0 ||
      typeof input.rootPath !== "string" ||
      input.rootPath.trim().length === 0
    ) {
      throw new PrivateObjectStorageError("Private storage root is invalid.");
    }
    const base = resolve(input.trustedBasePath);
    const root = resolve(input.rootPath);
    if (!isInsideBase(base, root)) {
      throw new PrivateObjectStorageError(
        "Private storage root must remain inside its trusted server base."
      );
    }
    this.root = root;
  }

  private objectPath(objectKeyInput: string): string {
    const objectKey = normalizeObjectKey(objectKeyInput);
    const target = resolve(this.root, ...objectKey.split("/"));
    if (!isInsideBase(this.root, target) || target === this.root) {
      throw new PrivateObjectStorageError("Private object path escaped its root.");
    }
    return target;
  }

  async put(objectKey: string, bytes: Uint8Array): Promise<PrivateObjectStat> {
    if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1) {
      throw new PrivateObjectStorageError("Private object content is empty.");
    }
    const path = this.objectPath(objectKey);
    await mkdir(dirname(path), { recursive: true });
    const expected = Object.freeze({
      byteSize: bytes.byteLength,
      sha256: sha256(bytes)
    });
    try {
      await writeFile(path, bytes, { flag: "wx", mode: 0o600 });
      return expected;
    } catch (error) {
      if (errnoCode(error) !== "EEXIST") {
        throw new PrivateObjectStorageError();
      }
      const existing = await readFile(path);
      if (
        existing.byteLength !== expected.byteSize ||
        sha256(existing) !== expected.sha256
      ) {
        throw new PrivateObjectConflictError();
      }
      return expected;
    }
  }

  async read(objectKey: string): Promise<Uint8Array | null> {
    const path = this.objectPath(objectKey);
    try {
      return await readFile(path);
    } catch (error) {
      if (errnoCode(error) === "ENOENT") return null;
      throw new PrivateObjectStorageError();
    }
  }

  async stat(objectKey: string): Promise<PrivateObjectStat | null> {
    const path = this.objectPath(objectKey);
    try {
      const metadata = await stat(path);
      if (!metadata.isFile()) {
        throw new PrivateObjectStorageError("Private object is not a regular file.");
      }
      const bytes = await readFile(path);
      return Object.freeze({
        byteSize: bytes.byteLength,
        sha256: sha256(bytes)
      });
    } catch (error) {
      if (errnoCode(error) === "ENOENT") return null;
      if (error instanceof PrivateObjectStorageError) throw error;
      throw new PrivateObjectStorageError();
    }
  }

  async delete(objectKey: string): Promise<boolean> {
    const path = this.objectPath(objectKey);
    try {
      await rm(path, { force: false });
      return true;
    } catch (error) {
      if (errnoCode(error) === "ENOENT") return false;
      throw new PrivateObjectStorageError();
    }
  }
}
