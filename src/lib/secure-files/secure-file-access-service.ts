import "server-only";

import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";
import { getServerEnvironment } from "../config/server-environment";
import { createLocalTestPrivateObjectStorage } from "./private-object-storage";
import {
  authorizeSecureFileAccessCore,
  readSecureFileAccessCore,
  type SecureFileAccessContent
} from "./secure-file-access-core";
import {
  SecureFileAccessDeniedError,
  normalizeSecureFileAccessRequest,
  normalizeSecureFileAccessPurpose,
  type IssuedSecureFileAccess,
  type SecureFileAccessPurpose
} from "./secure-file-access-domain";
import { getSecureFileRepository } from "./secure-file-repository";

export async function authorizeSecureFileAccess(input: {
  principal: AuthorizationPrincipal;
  request: unknown;
  now?: Date;
}): Promise<IssuedSecureFileAccess> {
  const request = normalizeSecureFileAccessRequest(input.request);
  const environment = getServerEnvironment();
  return authorizeSecureFileAccessCore({
    principal: input.principal,
    fileRef: request.fileRef,
    purpose: request.purpose,
    signingSecret: environment.sessionSecret,
    repository: getSecureFileRepository(),
    now: input.now
  });
}

export async function readSecureFileAccess(input: {
  principal: AuthorizationPrincipal;
  token: string;
  expectedPurpose: SecureFileAccessPurpose;
  now?: Date;
}): Promise<SecureFileAccessContent> {
  const expectedPurpose = normalizeSecureFileAccessPurpose(input.expectedPurpose);
  const environment = getServerEnvironment();

  // M1.06 has a complete local/test private-storage adapter only. Preview and
  // production must fail closed until a later production provider is configured;
  // never reinterpret a server filesystem path as a production object store.
  if (
    environment.appEnvironment !== "development" &&
    environment.appEnvironment !== "test"
  ) {
    throw new SecureFileAccessDeniedError();
  }

  return readSecureFileAccessCore({
    principal: input.principal,
    token: input.token,
    expectedPurpose,
    signingSecret: environment.sessionSecret,
    repository: getSecureFileRepository(),
    storage: createLocalTestPrivateObjectStorage(environment.appEnvironment),
    now: input.now
  });
}
