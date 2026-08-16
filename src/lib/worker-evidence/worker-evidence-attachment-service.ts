import "server-only";

import { randomBytes } from "node:crypto";

import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";
import type { DatabaseClient } from "../database/database";
import {
  bindTrustedSecureFileOwner,
  createSecureFileReservationIntent,
  type SecureFileRecord
} from "../secure-files/secure-file-domain";
import type { SecureFileScanService } from "../secure-files/secure-file-scan-service";
import type { SecureFileService } from "../secure-files/secure-file-service";
import {
  createTrustedSecureFileUploadPolicy,
  SECURE_FILE_UPLOAD_DEFAULT_MAX_BYTES
} from "../secure-files/secure-file-upload-domain";
import type { SecureFileUploadService } from "../secure-files/secure-file-upload-service";
import {
  assertWorkerEvidencePrincipal,
  createWorkerEvidenceId,
  normalizeOptionalText,
  WorkerEvidenceAttachmentUnavailableError,
  WorkerEvidenceConflictError,
  WorkerEvidenceContractError,
  WorkerEvidenceNotFoundError,
  type WorkerEvidenceRecordKind
} from "./worker-evidence-domain";
import { DatabaseWorkerEvidenceRepository } from "./worker-evidence-repository";

export const WORKER_EVIDENCE_ATTACHMENT_KINDS = [
  "primary_certificate",
  "supporting_evidence",
  "experience_evidence",
  "employment_evidence",
  "skill_evidence"
] as const;

export type WorkerEvidenceAttachmentKind =
  (typeof WORKER_EVIDENCE_ATTACHMENT_KINDS)[number];

export type WorkerEvidenceAttachmentRecord = Readonly<{
  attachmentId: string;
  recordId: string;
  versionId: string;
  attachmentKind: WorkerEvidenceAttachmentKind;
  secureFileId: string;
  displayFilename: string;
  createdAt: string;
  supersededAt: string | null;
}>;

type SecureFiles = Pick<
  SecureFileService,
  "reserveForPrincipal" | "findForPrincipal"
>;
type SecureUploads = Pick<SecureFileUploadService, "quarantineForPrincipal">;
type SecureScans = Pick<SecureFileScanService, "scheduleForPrincipal">;
type SettleFileScan = (
  principal: AuthorizationPrincipal,
  fileId: string
) => Promise<void>;

function assertAttachmentKindForRecord(
  kind: WorkerEvidenceRecordKind,
  attachmentKind: WorkerEvidenceAttachmentKind
): void {
  const valid =
    (kind === "qualification" &&
      (attachmentKind === "primary_certificate" ||
        attachmentKind === "supporting_evidence")) ||
    (kind === "experience" && attachmentKind === "experience_evidence") ||
    (kind === "employment" && attachmentKind === "employment_evidence") ||
    (kind === "skill" && attachmentKind === "skill_evidence");
  if (!valid) {
    throw new WorkerEvidenceContractError(
      "That evidence file type does not belong to this Worker record."
    );
  }
}

function assertExpectedSecureFile(
  file: SecureFileRecord | null,
  input: {
    accountId: string;
    reservationKey: string;
    displayFilename: string;
    lifecycleStatus?: "reserved" | "available";
  }
): SecureFileRecord {
  if (
    !file ||
    file.ownerAccountId !== input.accountId ||
    file.ownerRole !== "worker" ||
    file.tenantId !== null ||
    file.membershipId !== null ||
    file.reservationKey !== input.reservationKey ||
    file.displayFilename !== input.displayFilename ||
    (input.lifecycleStatus !== undefined &&
      file.lifecycleStatus !== input.lifecycleStatus)
  ) {
    throw new WorkerEvidenceAttachmentUnavailableError();
  }
  return file;
}

function workerEvidenceBusinessReference(input: {
  recordId: string;
  versionId: string;
  attachmentKind: WorkerEvidenceAttachmentKind;
}): string {
  const nonce = randomBytes(6).toString("hex");
  const businessReference = [
    "worker-evidence",
    input.recordId,
    input.versionId,
    input.attachmentKind,
    nonce
  ].join(":");
  return businessReference;
}

export class WorkerEvidenceAttachmentService {
  private readonly repository: DatabaseWorkerEvidenceRepository;

  constructor(
    clientPromise: Promise<DatabaseClient>,
    private readonly secureFiles: SecureFiles,
    private readonly secureUploads: SecureUploads,
    private readonly secureScans: SecureScans,
    private readonly settleFileScan: SettleFileScan = async () => undefined,
    private readonly now: () => Date = () => new Date()
  ) {
    this.repository = new DatabaseWorkerEvidenceRepository(clientPromise);
  }

  async uploadAndBind(
    principal: AuthorizationPrincipal,
    input: Readonly<{
      recordId: string;
      versionId: string;
      attachmentKind: WorkerEvidenceAttachmentKind;
      expectedActiveAttachmentId: string | null;
      originalFilename: string;
      declaredMime: string;
      bytes: Uint8Array;
    }>
  ): Promise<WorkerEvidenceAttachmentRecord> {
    const worker = assertWorkerEvidencePrincipal(principal);
    const recordId = input.recordId.trim();
    const versionId = input.versionId.trim();
    const current = await this.repository.findCurrentForWorker(
      worker.accountId,
      recordId
    );
    if (!current) throw new WorkerEvidenceNotFoundError();
    if (
      current.currentVersion.versionId !== versionId ||
      current.currentVersion.status !== "draft"
    ) {
      throw new WorkerEvidenceConflictError(
        "Evidence files can only be changed on the current draft version."
      );
    }
    assertAttachmentKindForRecord(current.kind, input.attachmentKind);

    const displayFilename = normalizeOptionalText(input.originalFilename, 240);
    if (!displayFilename) {
      throw new WorkerEvidenceContractError("Evidence filename is required.");
    }
    if (!(input.bytes instanceof Uint8Array) || input.bytes.byteLength < 1) {
      throw new WorkerEvidenceContractError("Evidence file is required.");
    }

    const businessReference = workerEvidenceBusinessReference({
      recordId,
      versionId,
      attachmentKind: input.attachmentKind
    });
    const owner = bindTrustedSecureFileOwner(worker);
    const expectedReservation = createSecureFileReservationIntent({
      owner,
      businessReference,
      displayFilename
    });
    const reservation = await this.secureFiles.reserveForPrincipal({
      principal: worker,
      businessReference,
      displayFilename
    });
    const reserved = assertExpectedSecureFile(reservation.file, {
      accountId: worker.accountId,
      reservationKey: expectedReservation.reservationKey,
      displayFilename,
      lifecycleStatus: "reserved"
    });

    const policy = createTrustedSecureFileUploadPolicy({
      policyKey: `worker.evidence.${input.attachmentKind}`,
      allowedKinds: ["pdf", "png", "jpeg"],
      maxBytes: SECURE_FILE_UPLOAD_DEFAULT_MAX_BYTES
    });
    await this.secureUploads.quarantineForPrincipal({
      principal: worker,
      fileId: reserved.fileId,
      originalFilename: displayFilename,
      declaredMime: input.declaredMime,
      bytes: input.bytes,
      policy
    });
    await this.secureScans.scheduleForPrincipal({
      principal: worker,
      fileRef: reserved.fileId
    });
    await this.settleFileScan(worker, reserved.fileId);

    const scanned = assertExpectedSecureFile(
      await this.secureFiles.findForPrincipal(worker, reserved.fileId),
      {
        accountId: worker.accountId,
        reservationKey: expectedReservation.reservationKey,
        displayFilename,
        lifecycleStatus: "available"
      }
    );

    const attached = await this.repository.bindAttachment({
      workerAccountId: worker.accountId,
      recordId,
      versionId,
      attachmentKind: input.attachmentKind,
      expectedActiveAttachmentId:
        input.expectedActiveAttachmentId?.trim() || null,
      attachmentId: createWorkerEvidenceId("evidence_attachment"),
      secureFileId: scanned.fileId,
      displayFilename,
      now: this.now().toISOString()
    });
    if (!attached) throw new WorkerEvidenceNotFoundError();
    return attached as WorkerEvidenceAttachmentRecord;
  }

  async listForRecord(
    principal: AuthorizationPrincipal,
    recordIdInput: string
  ): Promise<readonly WorkerEvidenceAttachmentRecord[]> {
    const worker = assertWorkerEvidencePrincipal(principal);
    const recordId = recordIdInput.trim();
    const current = await this.repository.findCurrentForWorker(
      worker.accountId,
      recordId
    );
    if (!current) throw new WorkerEvidenceNotFoundError();
    return (await this.repository.listAttachmentsForWorker(
      worker.accountId,
      recordId
    )) as readonly WorkerEvidenceAttachmentRecord[];
  }
}
