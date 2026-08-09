import "server-only";

import { isAbsolute, resolve } from "node:path";

import {
  LocalTestPrivateObjectStorage,
  PrivateObjectStorageError,
  type PrivateObjectStorage
} from "./private-object-storage-core";

export {
  PrivateObjectConflictError,
  PrivateObjectStorageError,
  type PrivateObjectStat,
  type PrivateObjectStorage
} from "./private-object-storage-core";

export function createLocalTestPrivateObjectStorage(input: {
  appEnvironment: "development" | "test";
  rootPath?: string;
}): PrivateObjectStorage {
  const rootPath = input.rootPath?.trim() || ".data/private-objects";
  if (
    isAbsolute(rootPath) ||
    rootPath.includes("\u0000") ||
    rootPath.split(/[\\/]+/).some((segment) => segment === "..")
  ) {
    throw new PrivateObjectStorageError(
      "Private storage root must be a server-relative path."
    );
  }
  const trustedBasePath = process.cwd();
  return new LocalTestPrivateObjectStorage({
    appEnvironment: input.appEnvironment,
    trustedBasePath,
    rootPath: resolve(trustedBasePath, rootPath)
  });
}
