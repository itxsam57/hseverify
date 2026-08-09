import "server-only";

import { createHash } from "node:crypto";

import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";
import type { PrivateObjectStorage } from "./private-object-storage-core";
import {
  deriveSecureFileObjectKey,
  type SecureFileRecord
} from "./secure-file-domain";
import type { SecureFileRepository } from "./secure-file-repository";
import {
  SecureFileAccessDeniedError,
  issueSecureFileAccessToken,
  normalizeSecureFileAccessPurpose,
  verifySecureFileAccessToken,
  type IssuedSecureFileAccess,
  type SecureFileAccessPurpose
} from "./secure-file-access-domain";

export type SecureFileAccessHeaders = Readonly<{
  "Content-Type": "application/pdf" | "image/png" | "image/jpeg";
  "Content-Length": string;
  "Content-Disposition": string;
  "Cache-Control": "private, no-store, max-age=0";
  Pragma: "no-cache";
  "X-Content-Type-Options": "nosniff";
  "Referrer-Policy": "no-referrer";
  "Cross-Origin-Resource-Policy": "same-origin";
}>;

export type SecureFileAccessContent = Readonly<{
  fileRef: string;
  purpose: SecureFileAccessPurpose;
  bytes: Uint8Array;
  headers: SecureFileAccessHeaders;
}>;

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function isAcceptedMime(
  value: SecureFileRecord["detectedMime"]
): value is "application/pdf" | "image/png" | "image/jpeg" {
  return (
    value === "application/pdf" ||
    value === "image/png" ||
    value === "image/jpeg"
  );
}

function expectedExtension(
  mime: "application/pdf" | "image/png" | "image/jpeg"
): "pdf" | "png" | "jpg" {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  return "jpg";
}

function fileHasAcceptedAvailableProvenance(file: SecureFileRecord): boolean {
  return (
    file.lifecycleStatus === "available" &&
    file.availableAt !== null &&
    isAcceptedMime(file.detectedMime) &&
    file.fileExtension !== null &&
    file.byteSize !== null &&
    Number.isSafeInteger(file.byteSize) &&
    file.byteSize > 0 &&
    file.contentSha256 !== null &&
    /^[a-f0-9]{64}$/.test(file.contentSha256) &&
    file.storageAdapterKey === "local_test" &&
    file.objectKey === deriveSecureFileObjectKey(file.fileId)
  );
}

function encodeRfc5987Filename(value: string): string {
  return encodeURIComponent(value)
    .replace(/['()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );
}

export function buildSecureFileAccessHeaders(input: {
  file: SecureFileRecord;
  purpose: SecureFileAccessPurpose;
  byteSize: number;
}): SecureFileAccessHeaders {
  const purpose = normalizeSecureFileAccessPurpose(input.purpose);
  if (
    !fileHasAcceptedAvailableProvenance(input.file) ||
    !isAcceptedMime(input.file.detectedMime) ||
    !Number.isSafeInteger(input.byteSize) ||
    input.byteSize < 1 ||
    input.byteSize !== input.file.byteSize
  ) {
    throw new SecureFileAccessDeniedError();
  }

  const disposition = purpose === "preview" ? "inline" : "attachment";
  const fallbackName = `secure-file.${expectedExtension(input.file.detectedMime)}`;
  const encodedName = encodeRfc5987Filename(input.file.displayFilename);
  return Object.freeze({
    "Content-Type": input.file.detectedMime,
    "Content-Length": String(input.byteSize),
    "Content-Disposition": `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`,
    "Cache-Control": "private, no-store, max-age=0" as const,
    Pragma: "no-cache" as const,
    "X-Content-Type-Options": "nosniff" as const,
    "Referrer-Policy": "no-referrer" as const,
    "Cross-Origin-Resource-Policy": "same-origin" as const
  });
}

export async function authorizeSecureFileAccessCore(input: {
  principal: AuthorizationPrincipal;
  fileRef: string;
  purpose: SecureFileAccessPurpose;
  signingSecret: string;
  repository: Pick<SecureFileRepository, "findForPrincipal">;
  now?: Date;
}): Promise<IssuedSecureFileAccess> {
  const purpose = normalizeSecureFileAccessPurpose(input.purpose);
  const file = await input.repository.findForPrincipal(
    input.principal,
    input.fileRef
  );
  if (!file || !fileHasAcceptedAvailableProvenance(file)) {
    throw new SecureFileAccessDeniedError();
  }
  return issueSecureFileAccessToken({
    principal: input.principal,
    fileRef: file.fileId,
    purpose,
    signingSecret: input.signingSecret,
    now: input.now
  });
}

export async function readSecureFileAccessCore(input: {
  principal: AuthorizationPrincipal;
  token: string;
  expectedPurpose: SecureFileAccessPurpose;
  signingSecret: string;
  repository: Pick<SecureFileRepository, "findForPrincipal">;
  storage: Pick<PrivateObjectStorage, "read">;
  now?: Date;
}): Promise<SecureFileAccessContent> {
  const expectedPurpose = normalizeSecureFileAccessPurpose(input.expectedPurpose);
  const verified = verifySecureFileAccessToken({
    principal: input.principal,
    token: input.token,
    signingSecret: input.signingSecret,
    now: input.now
  });
  if (verified.purpose !== expectedPurpose) {
    throw new SecureFileAccessDeniedError();
  }

  // Use-time lookup deliberately re-runs the accepted live session/tenant
  // authorization and owner-scope predicates before any private object read.
  const file = await input.repository.findForPrincipal(
    input.principal,
    verified.fileRef
  );
  if (!file || !fileHasAcceptedAvailableProvenance(file)) {
    throw new SecureFileAccessDeniedError();
  }

  let stored: Uint8Array | null;
  try {
    stored = await input.storage.read(file.objectKey);
  } catch {
    throw new SecureFileAccessDeniedError();
  }
  if (
    !stored ||
    stored.byteLength !== file.byteSize ||
    sha256(stored) !== file.contentSha256
  ) {
    throw new SecureFileAccessDeniedError();
  }

  const bytes = Uint8Array.from(stored);
  return Object.freeze({
    fileRef: file.fileId,
    purpose: expectedPurpose,
    bytes,
    headers: buildSecureFileAccessHeaders({
      file,
      purpose: expectedPurpose,
      byteSize: bytes.byteLength
    })
  });
}
