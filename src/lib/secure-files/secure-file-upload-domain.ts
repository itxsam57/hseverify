import { createHash } from "node:crypto";

import {
  deriveSecureFileObjectKey,
  normalizeSecureFileDisplayFilename,
  normalizeSecureFileReference,
  type SecureFileRecord
} from "./secure-file-domain";

export const SECURE_FILE_UPLOAD_CONTENT_KINDS = ["pdf", "png", "jpeg"] as const;
export const SECURE_FILE_UPLOAD_MIMES = [
  "application/pdf",
  "image/png",
  "image/jpeg"
] as const;
export const SECURE_FILE_UPLOAD_PLATFORM_MAX_BYTES = 25 * 1024 * 1024;
export const SECURE_FILE_UPLOAD_DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

export type SecureFileUploadContentKind =
  (typeof SECURE_FILE_UPLOAD_CONTENT_KINDS)[number];
export type SecureFileUploadMime = (typeof SECURE_FILE_UPLOAD_MIMES)[number];
export type SecureFileUploadExtension = "pdf" | "png" | "jpg" | "jpeg";

export type SecureFileUploadRejectionReason =
  | "invalid_policy"
  | "invalid_reservation"
  | "invalid_filename"
  | "invalid_declared_mime"
  | "unsupported_type"
  | "oversize"
  | "invalid_structure"
  | "type_mismatch"
  | "stored_object_inconsistent";

export class SecureFileUploadValidationError extends Error {
  constructor(readonly reason: SecureFileUploadRejectionReason) {
    super("The uploaded file could not be accepted.");
    this.name = "SecureFileUploadValidationError";
  }
}

const TRUSTED_UPLOAD_POLICY = Symbol("trusted-secure-file-upload-policy");
const TRUSTED_UPLOAD_POLICIES = new WeakSet<object>();
const TRUSTED_VALIDATED_UPLOAD = Symbol("trusted-validated-secure-file-upload");
const TRUSTED_VALIDATED_UPLOADS = new WeakSet<object>();
const VALIDATED_UPLOAD_BYTES = new WeakMap<object, Uint8Array>();
const TRUSTED_STORED_UPLOAD = Symbol("trusted-stored-secure-file-upload");
const TRUSTED_STORED_UPLOADS = new WeakSet<object>();

export type TrustedSecureFileUploadPolicy = Readonly<{
  policyKey: string;
  allowedKinds: readonly SecureFileUploadContentKind[];
  maxBytes: number;
  [TRUSTED_UPLOAD_POLICY]: true;
}>;

export type TrustedValidatedSecureFileUpload = Readonly<{
  fileId: string;
  objectKey: string;
  displayFilename: string;
  fileExtension: SecureFileUploadExtension;
  declaredMime: SecureFileUploadMime;
  detectedMime: SecureFileUploadMime;
  byteSize: number;
  contentSha256: string;
  policyKey: string;
  [TRUSTED_VALIDATED_UPLOAD]: true;
}>;

export type TrustedStoredSecureFileUpload = Readonly<{
  fileId: string;
  objectKey: string;
  displayFilename: string;
  fileExtension: SecureFileUploadExtension;
  declaredMime: SecureFileUploadMime;
  detectedMime: SecureFileUploadMime;
  byteSize: number;
  contentSha256: string;
  policyKey: string;
  [TRUSTED_STORED_UPLOAD]: true;
}>;

function isContentKind(value: unknown): value is SecureFileUploadContentKind {
  return (
    typeof value === "string" &&
    SECURE_FILE_UPLOAD_CONTENT_KINDS.includes(value as SecureFileUploadContentKind)
  );
}

function normalizePolicyKey(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 3 ||
    normalized.length > 120 ||
    !/^[a-z0-9][a-z0-9._-]*$/.test(normalized)
  ) {
    throw new SecureFileUploadValidationError("invalid_policy");
  }
  return normalized;
}

export function createTrustedSecureFileUploadPolicy(input: {
  policyKey: string;
  allowedKinds: readonly SecureFileUploadContentKind[];
  maxBytes: number;
}): TrustedSecureFileUploadPolicy {
  const policyKey = normalizePolicyKey(input.policyKey);
  if (
    !Array.isArray(input.allowedKinds) ||
    input.allowedKinds.length < 1 ||
    !input.allowedKinds.every(isContentKind) ||
    new Set(input.allowedKinds).size !== input.allowedKinds.length ||
    !Number.isSafeInteger(input.maxBytes) ||
    input.maxBytes < 1 ||
    input.maxBytes > SECURE_FILE_UPLOAD_PLATFORM_MAX_BYTES
  ) {
    throw new SecureFileUploadValidationError("invalid_policy");
  }
  const uniqueKinds = SECURE_FILE_UPLOAD_CONTENT_KINDS.filter((kind) =>
    input.allowedKinds.includes(kind)
  );
  const policy = Object.freeze({
    policyKey,
    allowedKinds: Object.freeze([...uniqueKinds]),
    maxBytes: input.maxBytes,
    [TRUSTED_UPLOAD_POLICY]: true as const
  });
  TRUSTED_UPLOAD_POLICIES.add(policy);
  return policy;
}

export function createDefaultSecureFileUploadPolicy(): TrustedSecureFileUploadPolicy {
  return createTrustedSecureFileUploadPolicy({
    policyKey: "platform.evidence.default",
    allowedKinds: SECURE_FILE_UPLOAD_CONTENT_KINDS,
    maxBytes: SECURE_FILE_UPLOAD_DEFAULT_MAX_BYTES
  });
}

export function assertTrustedSecureFileUploadPolicy(
  policy: TrustedSecureFileUploadPolicy
): TrustedSecureFileUploadPolicy {
  if (
    !policy ||
    policy[TRUSTED_UPLOAD_POLICY] !== true ||
    !TRUSTED_UPLOAD_POLICIES.has(policy) ||
    normalizePolicyKey(policy.policyKey) !== policy.policyKey ||
    !Array.isArray(policy.allowedKinds) ||
    policy.allowedKinds.length < 1 ||
    !policy.allowedKinds.every(isContentKind) ||
    new Set(policy.allowedKinds).size !== policy.allowedKinds.length ||
    !Number.isSafeInteger(policy.maxBytes) ||
    policy.maxBytes < 1 ||
    policy.maxBytes > SECURE_FILE_UPLOAD_PLATFORM_MAX_BYTES
  ) {
    throw new SecureFileUploadValidationError("invalid_policy");
  }
  return policy;
}

function normalizeDeclaredMime(value: string): SecureFileUploadMime {
  if (typeof value !== "string") {
    throw new SecureFileUploadValidationError("invalid_declared_mime");
  }
  const normalized = value.trim().toLowerCase();
  if (!SECURE_FILE_UPLOAD_MIMES.includes(normalized as SecureFileUploadMime)) {
    throw new SecureFileUploadValidationError("invalid_declared_mime");
  }
  return normalized as SecureFileUploadMime;
}

function extensionForFilename(value: string): SecureFileUploadExtension {
  let filename: string;
  try {
    filename = normalizeSecureFileDisplayFilename(value);
  } catch {
    throw new SecureFileUploadValidationError("invalid_filename");
  }
  const dot = filename.lastIndexOf(".");
  if (dot < 1 || dot === filename.length - 1) {
    throw new SecureFileUploadValidationError("invalid_filename");
  }
  const extension = filename.slice(dot + 1).toLowerCase();
  if (
    extension !== "pdf" &&
    extension !== "png" &&
    extension !== "jpg" &&
    extension !== "jpeg"
  ) {
    throw new SecureFileUploadValidationError("unsupported_type");
  }
  return extension;
}

function kindForExtension(extension: SecureFileUploadExtension): SecureFileUploadContentKind {
  if (extension === "pdf") return "pdf";
  if (extension === "png") return "png";
  return "jpeg";
}

function mimeForKind(kind: SecureFileUploadContentKind): SecureFileUploadMime {
  if (kind === "pdf") return "application/pdf";
  if (kind === "png") return "image/png";
  return "image/jpeg";
}

function bytesEqualAt(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  if (offset < 0 || offset + expected.length > bytes.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (bytes[offset + index] !== expected[index]) return false;
  }
  return true;
}

function isAsciiWhitespace(value: number): boolean {
  return value === 0x09 || value === 0x0a || value === 0x0c || value === 0x0d || value === 0x20;
}

function detectPdf(bytes: Uint8Array): boolean {
  const header = [0x25, 0x50, 0x44, 0x46, 0x2d];
  const eof = [0x25, 0x25, 0x45, 0x4f, 0x46];
  if (bytes.length < 12 || !bytesEqualAt(bytes, 0, header)) return false;

  let finalEofOffset = -1;
  for (let index = header.length; index <= bytes.length - eof.length; index += 1) {
    if (bytesEqualAt(bytes, index, eof)) finalEofOffset = index;
  }
  if (finalEofOffset === -1) return false;
  for (let index = finalEofOffset + eof.length; index < bytes.length; index += 1) {
    if (!isAsciiWhitespace(bytes[index])) return false;
  }
  return true;
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    bytes[offset + 1] * 0x10000 +
    bytes[offset + 2] * 0x100 +
    bytes[offset + 3]
  );
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let index = start; index < end; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunkType(bytes: Uint8Array, offset: number): string | null {
  if (offset + 4 > bytes.length) return null;
  let result = "";
  for (let index = 0; index < 4; index += 1) {
    const value = bytes[offset + index];
    const isLetter = (value >= 65 && value <= 90) || (value >= 97 && value <= 122);
    if (!isLetter) return null;
    result += String.fromCharCode(value);
  }
  return result;
}

function detectPng(bytes: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 45 || !bytesEqualAt(bytes, 0, signature)) return false;

  let offset = signature.length;
  let chunkIndex = 0;
  let sawIdat = false;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) return false;
    const length = readUint32BigEndian(bytes, offset);
    const type = chunkType(bytes, offset + 4);
    if (!type || length > bytes.length - offset - 12) return false;
    const dataEnd = offset + 8 + length;
    const storedCrc = readUint32BigEndian(bytes, dataEnd);
    if (crc32(bytes, offset + 4, dataEnd) !== storedCrc) return false;
    const nextOffset = dataEnd + 4;

    if (chunkIndex === 0 && (type !== "IHDR" || length !== 13)) return false;
    if (type === "IDAT") sawIdat = true;
    if (type === "IEND") {
      return length === 0 && sawIdat && nextOffset === bytes.length;
    }
    offset = nextOffset;
    chunkIndex += 1;
  }
  return false;
}

function detectJpeg(bytes: Uint8Array): boolean {
  if (
    bytes.length < 6 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[2] !== 0xff
  ) {
    return false;
  }
  for (let index = 2; index < bytes.length - 1; index += 1) {
    if (bytes[index] === 0xff && bytes[index + 1] === 0xd9) {
      return index + 2 === bytes.length;
    }
  }
  return false;
}

function detectContentKind(bytes: Uint8Array): SecureFileUploadContentKind {
  const matches: SecureFileUploadContentKind[] = [];
  if (detectPdf(bytes)) matches.push("pdf");
  if (detectPng(bytes)) matches.push("png");
  if (detectJpeg(bytes)) matches.push("jpeg");
  if (matches.length !== 1) {
    throw new SecureFileUploadValidationError("invalid_structure");
  }
  return matches[0];
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function validateSecureFileUpload(input: {
  policy: TrustedSecureFileUploadPolicy;
  fileId: string;
  objectKey: string;
  reservedDisplayFilename: string;
  originalFilename: string;
  declaredMime: string;
  bytes: Uint8Array;
}): TrustedValidatedSecureFileUpload {
  const policy = assertTrustedSecureFileUploadPolicy(input.policy);
  const fileId = normalizeSecureFileReference(input.fileId);
  if (
    !fileId ||
    input.objectKey !== deriveSecureFileObjectKey(fileId) ||
    !/^secure-files\/[a-f0-9]{64}$/.test(input.objectKey)
  ) {
    throw new SecureFileUploadValidationError("invalid_reservation");
  }

  let reservedDisplayFilename: string;
  let originalFilename: string;
  try {
    reservedDisplayFilename = normalizeSecureFileDisplayFilename(input.reservedDisplayFilename);
    originalFilename = normalizeSecureFileDisplayFilename(input.originalFilename);
  } catch {
    throw new SecureFileUploadValidationError("invalid_filename");
  }
  if (
    reservedDisplayFilename !== input.reservedDisplayFilename ||
    originalFilename !== reservedDisplayFilename
  ) {
    throw new SecureFileUploadValidationError("invalid_filename");
  }
  if (!(input.bytes instanceof Uint8Array) || input.bytes.byteLength < 1) {
    throw new SecureFileUploadValidationError("invalid_structure");
  }
  if (input.bytes.byteLength > policy.maxBytes) {
    throw new SecureFileUploadValidationError("oversize");
  }

  const extension = extensionForFilename(originalFilename);
  const extensionKind = kindForExtension(extension);
  if (!policy.allowedKinds.includes(extensionKind)) {
    throw new SecureFileUploadValidationError("unsupported_type");
  }
  const declaredMime = normalizeDeclaredMime(input.declaredMime);
  const expectedMime = mimeForKind(extensionKind);
  if (declaredMime !== expectedMime) {
    throw new SecureFileUploadValidationError("type_mismatch");
  }

  const immutableBytes = Uint8Array.from(input.bytes);
  const detectedKind = detectContentKind(immutableBytes);
  const detectedMime = mimeForKind(detectedKind);
  if (detectedKind !== extensionKind || detectedMime !== declaredMime) {
    throw new SecureFileUploadValidationError("type_mismatch");
  }

  const validated = Object.freeze({
    fileId,
    objectKey: input.objectKey,
    displayFilename: reservedDisplayFilename,
    fileExtension: extension,
    declaredMime,
    detectedMime,
    byteSize: immutableBytes.byteLength,
    contentSha256: sha256(immutableBytes),
    policyKey: policy.policyKey,
    [TRUSTED_VALIDATED_UPLOAD]: true as const
  });
  TRUSTED_VALIDATED_UPLOADS.add(validated);
  VALIDATED_UPLOAD_BYTES.set(validated, immutableBytes);
  return validated;
}

export function assertTrustedValidatedSecureFileUpload(
  upload: TrustedValidatedSecureFileUpload
): TrustedValidatedSecureFileUpload {
  if (
    !upload ||
    upload[TRUSTED_VALIDATED_UPLOAD] !== true ||
    !TRUSTED_VALIDATED_UPLOADS.has(upload) ||
    !VALIDATED_UPLOAD_BYTES.has(upload) ||
    !normalizeSecureFileReference(upload.fileId) ||
    upload.objectKey !== deriveSecureFileObjectKey(upload.fileId) ||
    !Number.isSafeInteger(upload.byteSize) ||
    upload.byteSize < 1 ||
    !/^[a-f0-9]{64}$/.test(upload.contentSha256)
  ) {
    throw new SecureFileUploadValidationError("invalid_reservation");
  }
  return upload;
}

export function materializeValidatedSecureFileUploadBytes(
  uploadInput: TrustedValidatedSecureFileUpload
): Uint8Array {
  const upload = assertTrustedValidatedSecureFileUpload(uploadInput);
  const bytes = VALIDATED_UPLOAD_BYTES.get(upload);
  if (!bytes) throw new SecureFileUploadValidationError("invalid_reservation");
  return Uint8Array.from(bytes);
}

export function confirmStoredSecureFileUpload(
  uploadInput: TrustedValidatedSecureFileUpload,
  stored: Readonly<{ byteSize: number; sha256: string }>
): TrustedStoredSecureFileUpload {
  const upload = assertTrustedValidatedSecureFileUpload(uploadInput);
  if (
    !stored ||
    !Number.isSafeInteger(stored.byteSize) ||
    stored.byteSize !== upload.byteSize ||
    stored.sha256 !== upload.contentSha256
  ) {
    throw new SecureFileUploadValidationError("stored_object_inconsistent");
  }
  const trusted = Object.freeze({
    fileId: upload.fileId,
    objectKey: upload.objectKey,
    displayFilename: upload.displayFilename,
    fileExtension: upload.fileExtension,
    declaredMime: upload.declaredMime,
    detectedMime: upload.detectedMime,
    byteSize: upload.byteSize,
    contentSha256: upload.contentSha256,
    policyKey: upload.policyKey,
    [TRUSTED_STORED_UPLOAD]: true as const
  });
  TRUSTED_STORED_UPLOADS.add(trusted);
  return trusted;
}

export function assertTrustedStoredSecureFileUpload(
  upload: TrustedStoredSecureFileUpload
): TrustedStoredSecureFileUpload {
  if (
    !upload ||
    upload[TRUSTED_STORED_UPLOAD] !== true ||
    !TRUSTED_STORED_UPLOADS.has(upload) ||
    !normalizeSecureFileReference(upload.fileId) ||
    upload.objectKey !== deriveSecureFileObjectKey(upload.fileId) ||
    !Number.isSafeInteger(upload.byteSize) ||
    upload.byteSize < 1 ||
    !/^[a-f0-9]{64}$/.test(upload.contentSha256)
  ) {
    throw new SecureFileUploadValidationError("stored_object_inconsistent");
  }
  return upload;
}

export function secureFileMatchesStoredUpload(
  file: SecureFileRecord,
  uploadInput: TrustedStoredSecureFileUpload
): boolean {
  const upload = assertTrustedStoredSecureFileUpload(uploadInput);
  return (
    file.fileId === upload.fileId &&
    file.objectKey === upload.objectKey &&
    file.displayFilename === upload.displayFilename &&
    file.fileExtension === upload.fileExtension &&
    file.declaredMime === upload.declaredMime &&
    file.detectedMime === upload.detectedMime &&
    file.byteSize === upload.byteSize &&
    file.contentSha256 === upload.contentSha256
  );
}
