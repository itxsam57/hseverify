import "server-only";

import { bindTrustedAuditActor } from "../audit/audit-domain";
import { DatabaseAuditRepository } from "../audit/audit-repository";
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

function requireLocalTestStorageEnvironment(
  value: string
): "development" | "test" {
  // M1.06 has a complete local/test private-storage adapter only. Preview and
  // production must fail closed until a later real private provider exists;
  // never mint a broken authorization or reinterpret server filesystem paths
  // as production object storage.
  if (value !== "development" && value !== "test") {
    throw new SecureFileAccessDeniedError();
  }
  return value;
}

async function appendAccessAudit(input: {
  principal: AuthorizationPrincipal;
  action: "secure_file.access.authorized" | "secure_file.access.served";
  fileRef: string;
  purpose: SecureFileAccessPurpose;
  expiresAt?: string;
  byteSize?: number;
}): Promise<void> {
  const metadata: Record<string, unknown> = {
    purpose: input.purpose
  };
  if (input.expiresAt !== undefined) metadata.expiresAt = input.expiresAt;
  if (input.byteSize !== undefined) metadata.byteSize = input.byteSize;

  const audit = new DatabaseAuditRepository();
  await audit.append(bindTrustedAuditActor(input.principal), {
    action: input.action,
    outcome: "succeeded",
    target: { type: "secure_file", reference: input.fileRef },
    metadata
  });
}

export async function authorizeSecureFileAccess(input: {
  principal: AuthorizationPrincipal;
  request: unknown;
  now?: Date;
}): Promise<IssuedSecureFileAccess> {
  const request = normalizeSecureFileAccessRequest(input.request);
  const environment = getServerEnvironment();
  requireLocalTestStorageEnvironment(environment.appEnvironment);
  const issued = await authorizeSecureFileAccessCore({
    principal: input.principal,
    fileRef: request.fileRef,
    purpose: request.purpose,
    signingSecret: environment.sessionSecret,
    repository: getSecureFileRepository(),
    now: input.now
  });
  await appendAccessAudit({
    principal: input.principal,
    action: "secure_file.access.authorized",
    fileRef: issued.fileRef,
    purpose: issued.purpose,
    expiresAt: issued.expiresAt
  });
  return issued;
}

export async function readSecureFileAccess(input: {
  principal: AuthorizationPrincipal;
  token: string;
  expectedPurpose: SecureFileAccessPurpose;
  now?: Date;
}): Promise<SecureFileAccessContent> {
  const expectedPurpose = normalizeSecureFileAccessPurpose(input.expectedPurpose);
  const environment = getServerEnvironment();
  const storageEnvironment = requireLocalTestStorageEnvironment(
    environment.appEnvironment
  );

  const content = await readSecureFileAccessCore({
    principal: input.principal,
    token: input.token,
    expectedPurpose,
    signingSecret: environment.sessionSecret,
    repository: getSecureFileRepository(),
    storage: createLocalTestPrivateObjectStorage(storageEnvironment),
    now: input.now
  });
  await appendAccessAudit({
    principal: input.principal,
    action: "secure_file.access.served",
    fileRef: content.fileRef,
    purpose: content.purpose,
    byteSize: content.bytes.byteLength
  });
  return content;
}
