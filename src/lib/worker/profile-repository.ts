import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
  writeFile
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import type { WorkerProfileRecord } from "@/lib/worker/profile-domain";

const LOCK_RETRY_COUNT = 40;
const LOCK_RETRY_MS = 25;
const STALE_LOCK_MS = 30_000;

export class ProfileVersionConflictError extends Error {
  constructor() {
    super("The worker profile changed in another request.");
    this.name = "ProfileVersionConflictError";
  }
}

export class ProfileStorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileStorageConfigurationError";
  }
}

export interface WorkerProfileRepository {
  load(workerSub: string): Promise<WorkerProfileRecord | null>;
  save(record: WorkerProfileRecord, expectedVersion: number): Promise<WorkerProfileRecord>;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function assertWorkerProfileRecord(value: unknown): asserts value is WorkerProfileRecord {
  if (!value || typeof value !== "object") {
    throw new Error("Stored worker profile is not an object.");
  }

  const candidate = value as Partial<WorkerProfileRecord>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.workerSub !== "string" ||
    typeof candidate.workerId !== "string" ||
    typeof candidate.version !== "number" ||
    !candidate.personal ||
    !candidate.contact ||
    !candidate.professional ||
    !Array.isArray(candidate.audit)
  ) {
    throw new Error("Stored worker profile does not match schema version 1.");
  }
}

function storageRoot(): string {
  const configured = process.env.HSE_PROFILE_STORAGE_DIR?.trim();
  if (configured) {
    return resolve(configured);
  }

  if (process.env.NODE_ENV === "production") {
    throw new ProfileStorageConfigurationError(
      "HSE_PROFILE_STORAGE_DIR is required in production until the database profile adapter is connected."
    );
  }

  return resolve(process.cwd(), ".data", "worker-profiles");
}

function workerKey(workerSub: string): string {
  return createHash("sha256").update(workerSub, "utf8").digest("hex");
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

export class FileWorkerProfileRepository implements WorkerProfileRepository {
  readonly root: string;

  constructor(root = storageRoot()) {
    this.root = root;
  }

  private profilePath(workerSub: string): string {
    return join(this.root, `${workerKey(workerSub)}.json`);
  }

  private lockPath(workerSub: string): string {
    return join(this.root, `${workerKey(workerSub)}.lock`);
  }

  private async ensureRoot(): Promise<void> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
  }

  private async readUnlocked(workerSub: string): Promise<WorkerProfileRecord | null> {
    try {
      const content = await readFile(this.profilePath(workerSub), "utf8");
      const parsed: unknown = JSON.parse(content);
      assertWorkerProfileRecord(parsed);
      if (parsed.workerSub !== workerSub) {
        throw new Error("Stored worker profile owner does not match the requested worker.");
      }
      return parsed;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  private async removeStaleLock(lockPath: string): Promise<void> {
    try {
      const lockStats = await stat(lockPath);
      if (Date.now() - lockStats.mtimeMs > STALE_LOCK_MS) {
        await unlink(lockPath);
      }
    } catch (error) {
      if (!isNodeError(error) || error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  private async acquireLock(workerSub: string): Promise<Awaited<ReturnType<typeof open>>> {
    await this.ensureRoot();
    const lockPath = this.lockPath(workerSub);

    for (let attempt = 0; attempt < LOCK_RETRY_COUNT; attempt += 1) {
      try {
        const handle = await open(lockPath, "wx", 0o600);
        await handle.writeFile(`${process.pid}:${Date.now()}\n`, "utf8");
        return handle;
      } catch (error) {
        if (!isNodeError(error) || error.code !== "EEXIST") {
          throw error;
        }
        await this.removeStaleLock(lockPath);
        await sleep(LOCK_RETRY_MS + attempt * 5);
      }
    }

    throw new Error("Worker profile is busy. Try the request again.");
  }

  async load(workerSub: string): Promise<WorkerProfileRecord | null> {
    await this.ensureRoot();
    return this.readUnlocked(workerSub);
  }

  async save(record: WorkerProfileRecord, expectedVersion: number): Promise<WorkerProfileRecord> {
    const lockPath = this.lockPath(record.workerSub);
    const lockHandle = await this.acquireLock(record.workerSub);

    try {
      const current = await this.readUnlocked(record.workerSub);
      const currentVersion = current?.version ?? 0;
      if (currentVersion !== expectedVersion) {
        throw new ProfileVersionConflictError();
      }

      const saved: WorkerProfileRecord = {
        ...record,
        version: expectedVersion + 1
      };
      const targetPath = this.profilePath(record.workerSub);
      const temporaryPath = join(
        dirname(targetPath),
        `.${workerKey(record.workerSub)}.${randomUUID()}.tmp`
      );
      const serialized = `${JSON.stringify(saved, null, 2)}\n`;

      await writeFile(temporaryPath, serialized, { encoding: "utf8", mode: 0o600 });
      await rename(temporaryPath, targetPath);
      return saved;
    } finally {
      await lockHandle.close();
      await unlink(lockPath).catch((error: unknown) => {
        if (!isNodeError(error) || error.code !== "ENOENT") {
          throw error;
        }
      });
    }
  }
}

let repository: WorkerProfileRepository | null = null;

export function getWorkerProfileRepository(): WorkerProfileRepository {
  repository ??= new FileWorkerProfileRepository();
  return repository;
}
