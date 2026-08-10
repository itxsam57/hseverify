import { WorkerIdentityContractError } from "./worker-identity-domain";

export type WorkerIdentityDraftInput = Readonly<{
  legalFirstName: string;
  legalLastName: string;
  previousLegalName?: string | null;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
}>;

export type WorkerIdentityVerifiedContacts = Readonly<{
  emailNormalized: string;
  emailVerifiedAt: string;
  phoneE164: string;
  phoneVerifiedAt: string;
}>;

export type WorkerIdentityDraftRecord = Readonly<{
  identityVersionId: string;
  draftRevision: number;
  legalFirstName: string | null;
  legalLastName: string | null;
  previousLegalName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  countryOfResidence: string | null;
  verifiedContacts: WorkerIdentityVerifiedContacts;
  createdAt: string;
  updatedAt: string;
}>;

function normalizeHumanText(
  value: string,
  label: string,
  minimum: number,
  maximum: number
): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (
    normalized.length < minimum ||
    normalized.length > maximum ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    throw new WorkerIdentityContractError(`${label} is invalid.`);
  }
  return normalized;
}

export function normalizeIdentityName(value: string, label: string): string {
  return normalizeHumanText(value, label, 1, 120);
}

export function normalizePreviousLegalName(
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined || value.trim().length === 0) {
    return null;
  }
  return normalizeHumanText(value, "Previous legal name", 1, 160);
}

export function normalizeIdentityCountryFact(
  value: string,
  label: string
): string {
  return normalizeHumanText(value, label, 2, 100);
}

export function normalizeIdentityDateOfBirth(value: string): string {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new WorkerIdentityContractError("Date of birth is invalid.");
  }
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
  ) {
    throw new WorkerIdentityContractError("Date of birth is invalid.");
  }
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  if (parsed.getTime() > todayUtc) {
    throw new WorkerIdentityContractError("Date of birth cannot be in the future.");
  }
  return normalized;
}

export function normalizeWorkerIdentityDraftInput(
  input: WorkerIdentityDraftInput
): WorkerIdentityDraftInput {
  return Object.freeze({
    legalFirstName: normalizeIdentityName(input.legalFirstName, "Legal first name"),
    legalLastName: normalizeIdentityName(input.legalLastName, "Legal last name"),
    previousLegalName: normalizePreviousLegalName(input.previousLegalName),
    dateOfBirth: normalizeIdentityDateOfBirth(input.dateOfBirth),
    nationality: normalizeIdentityCountryFact(input.nationality, "Nationality"),
    countryOfResidence: normalizeIdentityCountryFact(
      input.countryOfResidence,
      "Country of residence"
    )
  });
}

export function normalizeWorkerIdentityDraftRevision(
  value: number | null
): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new WorkerIdentityContractError("Worker identity draft revision is invalid.");
  }
  return value;
}
