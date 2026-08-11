import { createHash } from "node:crypto";

import {
  AUTH_ROLES,
  createIdentifier,
  type AuthRole
} from "../auth/auth-domain";
import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";

export const SECURE_FILE_SCHEMA_VERSION = 1 as const;
export const SECURE_FILE_STORAGE_ADAPTER_KEYS = ["local_test"] as const;
export const SECURE_FILE_LIFECYCLE_STATUSES = [
  "reserved",
  "quarantined",
  "scan_pending",
  "available",
  "unsafe",
  "scan_failed"
] as const;
export const SECURE_FILE_AUTHORITY_MODES = [
  "active_tenant",
  "company_application"
] as const;

export type SecureFileStorageAdapterKey =
  (typeof SECURE_FILE_STORAGE_ADAPTER_KEYS)[number];
export type SecureFileLifecycleStatus =
  (typeof SECURE_FILE_LIFECYCLE_STATUSES)[number];
export type SecureFileAuthorityMode =
  (typeof SECURE_FILE_AUTHORITY_MODES)[number];

export type SecureFileRecord = Readonly<{
  sequence: number;
  fileId: string;
  schemaVersion: typeof SECURE_FILE_SCHEMA_VERSION;
  reservationKey: string;
  ownerAccountId: string;
  ownerRole: AuthRole;
  tenantId: string | null;
  membershipId: string | null;
  storageAdapterKey: SecureFileStorageAdapterKey;
  objectKey: string;
  displayFilename: string;
  lifecycleStatus: SecureFileLifecycleStatus;
  fileExtension: "pdf" | "png" | "jpg" | "jpeg" | null;
  declaredMime: "application/pdf" | "image/png" | "image/jpeg" | null;
  detectedMime: "application/pdf" | "image/png" | "image/jpeg" | null;
  byteSize: number | null;
  contentSha256: string | null;
  quarantinedAt: string | null;
  availableAt: string | null;
  unsafeAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

const TRUSTED_SECURE_FILE_OWNER = Symbol("trusted-secure-file-owner");
const TRUSTED_SECURE_FILE_OWNERS = new WeakSet<object>();
const TRUSTED_SECURE_FILE_AUTHORITY_MODES = new WeakMap<object, SecureFileAuthorityMode>();
const TRUSTED_RESERVATION_INTENT = Symbol("trusted-secure-file-reservation-intent");
const TRUSTED_RESERVATION_INTENTS = new WeakSet<object>();

export type TrustedSecureFileOwner = Readonly<{
  accountId: string;
  sessionId: string;
  role: AuthRole;
  tenantId: string | null;
  membershipId: string | null;
  [TRUSTED_SECURE_FILE_OWNER]: true;
}>;

export type TrustedSecureFileReservationIntent = Readonly<{
  businessReference: string;
  displayFilename: string;
  reservationKey: string;
  [TRUSTED_RESERVATION_INTENT]: true;
}>;

export type SecureFileQueryOptions = Readonly<{
  beforeSequence?: number | null;
  limit?: number;
}>;

export class SecureFileContractError extends Error {
  constructor(message = "The secure file contract is invalid.") {
    super(message);
    this.name = "SecureFileContractError";
  }
}

export class SecureFileAccessDeniedError extends Error {
  constructor() {
    super("The secure file could not be accessed.");
    this.name = "SecureFileAccessDeniedError";
  }
}

export class SecureFileReservationConflictError extends Error {
  constructor() {
    super("The secure file reservation could not be completed.");
    this.name = "SecureFileReservationConflictError";
  }
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === "string" && AUTH_ROLES.includes(value as AuthRole);
}

function createTrustedSecureFileOwner(input: {
  principal: AuthorizationPrincipal;
  authorityMode: SecureFileAuthorityMode;
}): TrustedSecureFileOwner {
  const membership = input.principal.tenantMembership;
  const owner = Object.freeze({
    accountId: input.principal.accountId,
    sessionId: input.principal.sessionId,
    role: input.principal.activeRole,
    tenantId: membership?.tenantId ?? null,
    membershipId: membership?.membershipId ?? null,
    [TRUSTED_SECURE_FILE_OWNER]: true as const
  });
  TRUSTED_SECURE_FILE_OWNERS.add(owner);
  TRUSTED_SECURE_FILE_AUTHORITY_MODES.set(owner, input.authorityMode);
  return owner;
}

export function isSecureFileLifecycleStatus(
  value: unknown
): value is SecureFileLifecycleStatus {
  return (
    typeof value === "string" &&
    SECURE_FILE_LIFECYCLE_STATUSES.includes(
      value as SecureFileLifecycleStatus
    )
  );
}

export function isSecureFileStorageAdapterKey(
  value: unknown
): value is SecureFileStorageAdapterKey {
  return (
    typeof value === "string" &&
    SECURE_FILE_STORAGE_ADAPTER_KEYS.includes(
      value as SecureFileStorageAdapterKey
    )
  );
}

export function bindTrustedSecureFileOwner(
  principal: AuthorizationPrincipal
): TrustedSecureFileOwner {
  if (
    principal.accountStatus !== "active" ||
    !nonEmpty(principal.accountId) ||
    !nonEmpty(principal.sessionId) ||
    !isAuthRole(principal.activeRole)
  ) {
    throw new SecureFileAccessDeniedError();
  }

  const membership = principal.tenantMembership;
  if (principal.activeRole === "company") {
    if (
      !membership ||
      membership.tenantStatus !== "active" ||
      membership.status !== "active" ||
      !nonEmpty(membership.tenantId) ||
      !nonEmpty(membership.membershipId)
    ) {
      throw new SecureFileAccessDeniedError();
    }
  } else if (membership !== null) {
    throw new SecureFileAccessDeniedError();
  }

  return createTrustedSecureFileOwner({
    principal,
    authorityMode: "active_tenant"
  });
}

export function bindTrustedCompanyApplicationSecureFileOwner(
  principal: AuthorizationPrincipal
): TrustedSecureFileOwner {
  const membership = principal.tenantMembership;
  if (
    principal.accountStatus !== "active" ||
    principal.activeRole !== "company" ||
    !nonEmpty(principal.accountId) ||
    !nonEmpty(principal.sessionId) ||
    !membership ||
    membership.status !== "active" ||
    (membership.tenantStatus !== "pending" && membership.tenantStatus !== "active") ||
    (membership.role !== "owner" && membership.role !== "admin") ||
    !nonEmpty(membership.tenantId) ||
    !nonEmpty(membership.membershipId)
  ) {
    throw new SecureFileAccessDeniedError();
  }
  return createTrustedSecureFileOwner({
    principal,
    authorityMode: "company_application"
  });
}

export function assertTrustedSecureFileOwner(
  owner: TrustedSecureFileOwner
): TrustedSecureFileOwner {
  const authorityMode = owner && typeof owner === "object"
    ? TRUSTED_SECURE_FILE_AUTHORITY_MODES.get(owner)
    : undefined;
  if (
    !owner ||
    owner[TRUSTED_SECURE_FILE_OWNER] !== true ||
    !TRUSTED_SECURE_FILE_OWNERS.has(owner) ||
    !authorityMode ||
    !SECURE_FILE_AUTHORITY_MODES.includes(authorityMode) ||
    !nonEmpty(owner.accountId) ||
    !nonEmpty(owner.sessionId) ||
    !isAuthRole(owner.role) ||
    ((owner.tenantId === null) !== (owner.membershipId === null)) ||
    (owner.role === "company" && owner.tenantId === null) ||
    (owner.role !== "company" && owner.tenantId !== null) ||
    (owner.role !== "company" && authorityMode !== "active_tenant")
  ) {
    throw new SecureFileAccessDeniedError();
  }
  return owner;
}

export function getTrustedSecureFileAuthorityMode(
  ownerInput: TrustedSecureFileOwner
): SecureFileAuthorityMode {
  const owner = assertTrustedSecureFileOwner(ownerInput);
  const authorityMode = TRUSTED_SECURE_FILE_AUTHORITY_MODES.get(owner);
  if (!authorityMode) throw new SecureFileAccessDeniedError();
  return authorityMode;
}

export function normalizeSecureFileDisplayFilename(value: string): string {
  if (typeof value !== "string") {
    throw new SecureFileContractError("File display name is invalid.");
  }
  const normalized = value.normalize("NFKC").trim();
  if (
    normalized.length < 1 ||
    normalized.length > 180 ||
    normalized === "." ||
    normalized === ".." ||
    /[\\/]/.test(normalized) ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    throw new SecureFileContractError("File display name is invalid.");
  }
  return normalized;
}

export function normalizeSecureFileBusinessReference(value: string): string {
  if (typeof value !== "string") {
    throw new SecureFileContractError("File reservation reference is invalid.");
  }
  const normalized = value.trim();
  if (
    normalized.length < 1 ||
    normalized.length > 160 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:@-]*$/.test(normalized)
  ) {
    throw new SecureFileContractError("File reservation reference is invalid.");
  }
  return normalized;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createSecureFileReservationIntent(input: {
  owner: TrustedSecureFileOwner;
  businessReference: string;
  displayFilename: string;
}): TrustedSecureFileReservationIntent {
  const owner = assertTrustedSecureFileOwner(input.owner);
  const businessReference = normalizeSecureFileBusinessReference(
    input.businessReference
  );
  const displayFilename = normalizeSecureFileDisplayFilename(
    input.displayFilename
  );
  const reservationKey = sha256([
    "hse-secure-file-reservation-v1",
    owner.accountId,
    owner.role,
    owner.tenantId ?? "-",
    owner.membershipId ?? "-",
    businessReference
  ].join("\u0000"));
  const intent = Object.freeze({
    businessReference,
    displayFilename,
    reservationKey,
    [TRUSTED_RESERVATION_INTENT]: true as const
  });
  TRUSTED_RESERVATION_INTENTS.add(intent);
  return intent;
}

export function assertTrustedSecureFileReservationIntent(
  intent: TrustedSecureFileReservationIntent
): TrustedSecureFileReservationIntent {
  if (
    !intent ||
    intent[TRUSTED_RESERVATION_INTENT] !== true ||
    !TRUSTED_RESERVATION_INTENTS.has(intent) ||
    normalizeSecureFileBusinessReference(intent.businessReference) !==
      intent.businessReference ||
    normalizeSecureFileDisplayFilename(intent.displayFilename) !==
      intent.displayFilename ||
    !/^[a-f0-9]{64}$/.test(intent.reservationKey)
  ) {
    throw new SecureFileContractError("File reservation intent is invalid.");
  }
  return intent;
}

export function createSecureFileId(): string {
  return createIdentifier("secure_file");
}

export function deriveSecureFileObjectKey(fileId: string): string {
  const normalized = normalizeSecureFileReference(fileId);
  if (!normalized) {
    throw new SecureFileContractError("Secure file reference is invalid.");
  }
  return `secure-files/${sha256(`hse-secure-file-object-v1\u0000${normalized}`)}`;
}

export function normalizeSecureFileReference(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return /^secure_file_[A-Za-z0-9_-]{24}$/.test(normalized)
    ? normalized
    : null;
}

export function normalizeSecureFileCursor(
  value: number | null | undefined
): number | null {
  if (value === undefined || value === null) return null;
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new SecureFileContractError("Secure file cursor is invalid.");
  }
  return value;
}

export function normalizeSecureFileLimit(value: number | undefined): number {
  if (value === undefined) return 50;
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new SecureFileContractError(
      "Secure file query limit must be between 1 and 100."
    );
  }
  return value;
}
