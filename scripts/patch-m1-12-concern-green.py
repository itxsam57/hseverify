from pathlib import Path
import re

AUDIT = Path('src/lib/audit/audit-domain.ts')
MIGRATION = Path('database/migrations/0031_public_verification_foundation.up.sql')
REPOSITORY = Path('src/lib/public-verification/public-verification-repository.ts')
SERVICE = Path('src/lib/public-verification/public-verification-service.ts')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)


def insert_before_final_brace(text: str, block: str, label: str) -> str:
    index = text.rfind('\n}')
    if index < 0:
        raise RuntimeError(f'{label}: final class brace not found')
    return text[:index] + '\n' + block.rstrip() + text[index:]


audit = AUDIT.read_text()
audit = replace_once(
    audit,
    '  "worker_evidence.leaving_letter.replaced"\n] as const;',
    '  "worker_evidence.leaving_letter.replaced",\n  "public_verification.concern.received"\n] as const;',
    'audit action vocabulary'
)
audit = replace_once(
    audit,
    '  systemComponent: "outbox-worker";\n',
    '  systemComponent: "outbox-worker" | "public-verification-intake";\n',
    'trusted system actor type'
)
audit = replace_once(
    audit,
    '  component: "outbox-worker",\n',
    '  component: "outbox-worker" | "public-verification-intake",\n',
    'trusted system actor binder'
)
audit = replace_once(
    audit,
    '      actor.systemComponent !== "outbox-worker"\n',
    '      (actor.systemComponent !== "outbox-worker" &&\n       actor.systemComponent !== "public-verification-intake")\n',
    'trusted system actor validator'
)
AUDIT.write_text(audit)

action_section = re.search(
    r'export const AUDIT_ACTIONS = \[(.*?)\] as const;', audit, re.S
)
if not action_section:
    raise RuntimeError('audit action list could not be parsed')
actions = re.findall(r'"([a-z0-9._-]+)"', action_section.group(1))
if 'public_verification.concern.received' not in actions:
    raise RuntimeError('new public concern action is absent from audit list')
quoted_actions = ',\n      '.join(f"'{value}'" for value in actions)
audit_constraint = f'''\n-- M1.12 concern intake uses the accepted centralized audit table with a\n-- purpose-specific anonymous system actor. Extend the bounded action vocabulary\n-- before the first concern transaction can append its immutable audit event.\nALTER TABLE platform_audit_events\n  DROP CONSTRAINT IF EXISTS platform_audit_events_action_key_check;\nALTER TABLE platform_audit_events\n  ADD CONSTRAINT platform_audit_events_action_key_check CHECK (\n    action_key IN (\n      {quoted_actions}\n    )\n  );\n'''

migration = MIGRATION.read_text()
if 'public_verification.concern.received' not in migration:
    marker = 'CREATE TABLE IF NOT EXISTS public_verification_rate_limits ('
    migration = replace_once(
        migration,
        marker,
        audit_constraint + '\n' + marker,
        '0031 audit action extension'
    )
MIGRATION.write_text(migration)

repository = REPOSITORY.read_text()
repository = replace_once(
    repository,
    'import "server-only";\n\nimport type { DatabaseClient } from "@/lib/database/database";',
    'import "server-only";\n\nimport { bindTrustedSystemAuditActor } from "@/lib/audit/audit-domain";\nimport { DatabaseAuditRepository } from "@/lib/audit/audit-repository";\nimport type { DatabaseClient } from "@/lib/database/database";',
    'repository audit imports'
)
repository = replace_once(
    repository,
    'export type PublicVerificationRateLimitInput = {\n  action: PublicVerificationRateLimitAction;\n  bucketKey: string;\n  now: string;\n  resetBefore: string;\n};\n',
    '''export type PublicVerificationRateLimitInput = {\n  action: PublicVerificationRateLimitAction;\n  bucketKey: string;\n  now: string;\n  resetBefore: string;\n};\n\nexport const PUBLIC_VERIFICATION_CONCERN_CATEGORIES = Object.freeze([\n  "identity_mismatch",\n  "suspected_fraud",\n  "status_dispute",\n  "document_concern",\n  "other"\n] as const);\n\nexport type PublicVerificationConcernCategory =\n  (typeof PUBLIC_VERIFICATION_CONCERN_CATEGORIES)[number];\n\nexport type CreatePublicVerificationConcernInput = Readonly<{\n  concernId: string;\n  subjectReferenceHash: string;\n  category: PublicVerificationConcernCategory;\n  description: string;\n  contactName: string | null;\n  contactEmail: string | null;\n  contactPhone: string | null;\n  idempotencyKey: string;\n  requestFingerprintHash: string;\n}>;\n\nexport type CreatePublicVerificationConcernResult = Readonly<{\n  concernId: string;\n  created: boolean;\n}>;\n''',
    'repository concern types'
)
repository = replace_once(
    repository,
    'const HEX_64_PATTERN = /^[a-f0-9]{64}$/;\n',
    '''const HEX_64_PATTERN = /^[a-f0-9]{64}$/;\nconst CONCERN_ID_PATTERN = /^public_concern_[A-Za-z0-9_-]{24}$/;\n\nfunction assertConcernInput(input: CreatePublicVerificationConcernInput): void {\n  if (!CONCERN_ID_PATTERN.test(input.concernId)) {\n    throw new Error("Public verification concern ID is invalid.");\n  }\n  if (!HEX_64_PATTERN.test(input.subjectReferenceHash)) {\n    throw new Error("Public verification concern subject hash is invalid.");\n  }\n  if (!PUBLIC_VERIFICATION_CONCERN_CATEGORIES.includes(input.category)) {\n    throw new Error("Public verification concern category is invalid.");\n  }\n  if (\n    input.description.length < 10 ||\n    input.description.length > 4000 ||\n    input.description !== input.description.trim()\n  ) {\n    throw new Error("Public verification concern description is invalid.");\n  }\n  if (\n    input.contactName !== null &&\n    (input.contactName.length < 1 ||\n      input.contactName.length > 160 ||\n      input.contactName !== input.contactName.trim())\n  ) {\n    throw new Error("Public verification concern contact name is invalid.");\n  }\n  if (\n    input.contactEmail !== null &&\n    (input.contactEmail.length < 3 ||\n      input.contactEmail.length > 320 ||\n      input.contactEmail !== input.contactEmail.trim())\n  ) {\n    throw new Error("Public verification concern contact email is invalid.");\n  }\n  if (\n    input.contactPhone !== null &&\n    (input.contactPhone.length < 8 ||\n      input.contactPhone.length > 32 ||\n      input.contactPhone !== input.contactPhone.trim())\n  ) {\n    throw new Error("Public verification concern contact phone is invalid.");\n  }\n  if (input.contactEmail === null && input.contactPhone === null) {\n    throw new Error("Public verification concern requires a contact method.");\n  }\n  if (!HEX_64_PATTERN.test(input.idempotencyKey)) {\n    throw new Error("Public verification concern idempotency key is invalid.");\n  }\n  if (!HEX_64_PATTERN.test(input.requestFingerprintHash)) {\n    throw new Error("Public verification concern request fingerprint is invalid.");\n  }\n}\n''',
    'repository concern validation'
)
concern_method = r'''  async createConcernWithAudit(
    input: CreatePublicVerificationConcernInput
  ): Promise<CreatePublicVerificationConcernResult> {
    assertConcernInput(input);

    return this.database.transaction(async (transaction) => {
      const inserted = await transaction.query<{ concern_id: string }>(
        `INSERT INTO public_verification_concerns (
           concern_id,
           subject_reference_hash,
           category,
           description,
           contact_name,
           contact_email,
           contact_phone,
           intake_status,
           idempotency_key,
           created_at,
           updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,'received',$8,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING concern_id`,
        [
          input.concernId,
          input.subjectReferenceHash,
          input.category,
          input.description,
          input.contactName,
          input.contactEmail,
          input.contactPhone,
          input.idempotencyKey
        ]
      );

      const created = Boolean(inserted.rows[0]);
      let concernId = inserted.rows[0]?.concern_id ?? null;
      if (!concernId) {
        const existing = await transaction.query<{ concern_id: string }>(
          `SELECT concern_id
             FROM public_verification_concerns
            WHERE idempotency_key=$1`,
          [input.idempotencyKey]
        );
        concernId = existing.rows[0]?.concern_id ?? null;
      }
      if (!concernId) {
        throw new Error("Public verification concern could not be resolved.");
      }

      if (created) {
        const audit = new DatabaseAuditRepository(Promise.resolve(transaction));
        await audit.append(
          bindTrustedSystemAuditActor("public-verification-intake"),
          {
            action: "public_verification.concern.received",
            outcome: "succeeded",
            target: { type: "resource", reference: concernId },
            requestFingerprintHash: input.requestFingerprintHash,
            metadata: {
              category: input.category,
              systemComponent: "public-verification-intake"
            }
          }
        );
      }

      return Object.freeze({ concernId, created });
    });
  }
'''
if 'async createConcernWithAudit(' not in repository:
    repository = insert_before_final_brace(
        repository, concern_method, 'repository concern method'
    )
REPOSITORY.write_text(repository)

service = SERVICE.read_text()
service = replace_once(
    service,
    'import "server-only";\n\nimport {\n  mintPublicVerificationCapability,',
    'import "server-only";\n\nimport { createHmac, randomBytes } from "node:crypto";\n\nimport {\n  mintPublicVerificationCapability,',
    'service crypto imports'
)
service = replace_once(
    service,
    'import type {\n  PublicVerificationRateLimitAction,\n  PublicVerificationRateLimitInput\n} from "@/lib/public-verification/public-verification-repository";',
    '''import {\n  PUBLIC_VERIFICATION_CONCERN_CATEGORIES,\n  type CreatePublicVerificationConcernInput,\n  type CreatePublicVerificationConcernResult,\n  type PublicVerificationConcernCategory,\n  type PublicVerificationRateLimitAction,\n  type PublicVerificationRateLimitInput\n} from "@/lib/public-verification/public-verification-repository";''',
    'service repository imports'
)
service = replace_once(
    service,
    '  findPublicWorkerByPermanentId(\n    workerId: string\n  ): Promise<PublicWorkerVerificationSource | null>;\n}',
    '''  findPublicWorkerByPermanentId(\n    workerId: string\n  ): Promise<PublicWorkerVerificationSource | null>;\n  createConcernWithAudit(\n    input: CreatePublicVerificationConcernInput\n  ): Promise<CreatePublicVerificationConcernResult>;\n}''',
    'service repository port'
)
service = replace_once(
    service,
    'const RESULT_LIMIT = 60;\n',
    '''const RESULT_LIMIT = 60;\nconst CONCERN_LIMIT = 10;\nconst CONCERN_NONCE_PATTERN = /^concern_nonce_[A-Za-z0-9_-]{24}$/;\nconst EMAIL_PATTERN = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nconst PHONE_PATTERN = /^\\+[0-9]{7,31}$/;\nconst CONCERN_SUBJECT_CONTEXT = "hseverify:m1.12:public-concern-subject:v1";\nconst CONCERN_IDEMPOTENCY_CONTEXT = "hseverify:m1.12:public-concern-idempotency:v1";\n\nexport type PublicVerificationConcernResult =\n  | PublicVerificationStatusResult\n  | Readonly<{ kind: "validation_error"; message: string }>\n  | Readonly<{ kind: "accepted"; concernReference: string }>;\n\nfunction digestConcernValue(secret: string, context: string, value: string): string {\n  return createHmac("sha256", secret)\n    .update(context, "utf8")\n    .update("\\0", "utf8")\n    .update(value, "utf8")\n    .digest("hex");\n}\n\nfunction normalizeConcernText(\n  value: unknown,\n  maximumLength: number\n): string {\n  if (typeof value !== "string" || value.length > maximumLength + 64) return "";\n  return value\n    .replace(/[\\u0000-\\u001f\\u007f]/g, "")\n    .trim()\n    .replace(/\\s+/g, " ");\n}\n\nfunction normalizeConcernCategory(\n  value: unknown\n): PublicVerificationConcernCategory | null {\n  return typeof value === "string" &&\n    PUBLIC_VERIFICATION_CONCERN_CATEGORIES.includes(\n      value as PublicVerificationConcernCategory\n    )\n    ? (value as PublicVerificationConcernCategory)\n    : null;\n}\n\nfunction createPublicConcernId(): string {\n  return `public_concern_${randomBytes(18).toString("base64url")}`;\n}\n''',
    'service concern constants'
)
concern_method_service = r'''  async submitPublicVerificationConcern(input: {
    publicToken: string;
    requestFingerprint: string;
    category: unknown;
    description: unknown;
    contactName?: unknown;
    contactEmail?: unknown;
    contactPhone?: unknown;
    idempotencyNonce: unknown;
    now?: Date;
    [key: string]: unknown;
  }): Promise<PublicVerificationConcernResult> {
    const now = normalizeClock(input.now ?? new Date());
    let requestFingerprint: string;
    try {
      requestFingerprint = normalizeRequestFingerprint(input.requestFingerprint);
    } catch {
      return Object.freeze({
        kind: "validation_error",
        message: "Concern request metadata is invalid."
      });
    }

    const category = normalizeConcernCategory(input.category);
    const description = normalizeConcernText(input.description, 4000);
    const contactName = normalizeConcernText(input.contactName ?? "", 160) || null;
    const contactEmailRaw = normalizeConcernText(input.contactEmail ?? "", 320);
    const contactEmail = contactEmailRaw ? contactEmailRaw.toLowerCase() : null;
    const contactPhone = normalizeConcernText(input.contactPhone ?? "", 32) || null;
    const idempotencyNonce =
      typeof input.idempotencyNonce === "string" ? input.idempotencyNonce.trim() : "";

    if (
      !category ||
      description.length < 10 ||
      description.length > 4000 ||
      (contactEmail !== null && !EMAIL_PATTERN.test(contactEmail)) ||
      (contactPhone !== null && !PHONE_PATTERN.test(contactPhone)) ||
      (contactEmail === null && contactPhone === null) ||
      !CONCERN_NONCE_PATTERN.test(idempotencyNonce)
    ) {
      return Object.freeze({
        kind: "validation_error",
        message: "Check the concern details and contact information."
      });
    }

    const capability = verifyPublicVerificationCapability(
      input.publicToken,
      this.secret,
      now
    );
    if (!capability || capability.identifierKind !== "worker") {
      return SAFE_MISS;
    }

    const concernCount = await this.consume("concern", requestFingerprint, now);
    if (concernCount === null || concernCount > CONCERN_LIMIT) {
      return TEMPORARILY_UNAVAILABLE;
    }

    let source: PublicWorkerVerificationSource | null;
    try {
      source = await this.repository.findPublicWorkerByPermanentId(
        capability.normalizedIdentifier
      );
    } catch {
      return TEMPORARILY_UNAVAILABLE;
    }
    if (
      !source ||
      mapWorkerIdentityStatusToPublicStatus(source.lifecycleStatus) ===
        "not_found_or_invalid"
    ) {
      return SAFE_MISS;
    }

    const subjectReferenceHash = digestConcernValue(
      this.secret,
      CONCERN_SUBJECT_CONTEXT,
      `${capability.identifierKind}:${capability.normalizedIdentifier}`
    );
    const idempotencyKey = digestConcernValue(
      this.secret,
      CONCERN_IDEMPOTENCY_CONTEXT,
      `${subjectReferenceHash}:${idempotencyNonce}`
    );

    try {
      const concern = await this.repository.createConcernWithAudit({
        concernId: createPublicConcernId(),
        subjectReferenceHash,
        category,
        description,
        contactName,
        contactEmail,
        contactPhone,
        idempotencyKey,
        requestFingerprintHash: requestFingerprint
      });
      return Object.freeze({
        kind: "accepted",
        concernReference: concern.concernId
      });
    } catch {
      return TEMPORARILY_UNAVAILABLE;
    }
  }
'''
if 'async submitPublicVerificationConcern(' not in service:
    service = insert_before_final_brace(
        service, concern_method_service, 'service concern method'
    )
SERVICE.write_text(service)

print('M1.12 concern green patch staged.')
