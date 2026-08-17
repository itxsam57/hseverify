from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


path = Path("scripts/m1-11-task5-atomic-patch.py")
text = path.read_text(encoding="utf-8")

old_matcher = '''block_match = re.search(
    r"ALTER TABLE platform_audit_events\\n  DROP CONSTRAINT IF EXISTS platform_audit_events_action_check;\\n\\n"
    r"ALTER TABLE platform_audit_events\\n  ADD CONSTRAINT platform_audit_events_action_check\\n  CHECK \\(action_key IN \\(.*?\\n  \\)\\);",
    m28,
    flags=re.S,
)'''
new_matcher = '''block_match = re.search(
    r"ALTER TABLE platform_audit_events\\n  DROP CONSTRAINT IF EXISTS platform_audit_events_action_key_check;\\n"
    r"ALTER TABLE platform_audit_events\\n  ADD CONSTRAINT platform_audit_events_action_key_check CHECK \\(\\n"
    r"    action_key IN \\(.*?\\n    \\)\\n  \\);",
    m28,
    flags=re.S,
)'''
text = replace_once(text, old_matcher, new_matcher, "0028 audit matcher")

old_tail = '''    "    'company_workforce.link.revoked'\\n",
    "    'company_workforce.link.revoked',\\n"
    + "\\n".join(f"    '{action}'," for action in ACTIONS[:-1])
    + f"\\n    '{ACTIONS[-1]}'\\n",'''
new_tail = '''    "      'company_workforce.link.revoked'\\n",
    "      'company_workforce.link.revoked',\\n"
    + "\\n".join(f"      '{action}'," for action in ACTIONS[:-1])
    + f"\\n      '{ACTIONS[-1]}'\\n",'''
text = replace_once(text, old_tail, new_tail, "0028 audit tail")

old_create = '''repo = patch_method(
    repo,
    "createDraft",
    ''' + "'''" + '''      await appendWorkerEvidenceAudit(\\n        transaction,\\n        input.principal,\\n        \"worker_evidence.record.created\",\\n        input.recordId,\\n        Object.freeze({ recordKind: input.kind, versionId: input.versionId }),\\n        input.now\\n      );\\n''' + "'''" + ''',
)'''
new_create = '''repo = replace_once(
    repo,
    ''' + "'''" + '''      await transaction.query(\\n        `UPDATE worker_evidence_records\\n            SET current_version_id=$2, updated_at=$3\\n          WHERE record_id=$1 AND worker_account_id=$4`,\\n        [input.recordId, input.versionId, input.now, input.workerAccountId]\\n      );\\n''' + "'''" + ''',
    ''' + "'''" + '''      await transaction.query(\\n        `UPDATE worker_evidence_records\\n            SET current_version_id=$2, updated_at=$3\\n          WHERE record_id=$1 AND worker_account_id=$4`,\\n        [input.recordId, input.versionId, input.now, input.workerAccountId]\\n      );\\n      await appendWorkerEvidenceAudit(\\n        transaction,\\n        input.principal,\\n        \"worker_evidence.record.created\",\\n        input.recordId,\\n        Object.freeze({ recordKind: input.kind, versionId: input.versionId }),\\n        input.now\\n      );\\n''' + "'''" + ''',
    "createDraft transactional audit",
)'''
text = replace_once(text, old_create, new_create, "createDraft patch transport")

old_bind = '''repo = patch_method(
    repo,
    "bindAttachment",
    ''' + "'''" + '''      await appendWorkerEvidenceAudit(\\n        transaction,\\n        input.principal,\\n        input.expectedActiveAttachmentId\\n          ? \"worker_evidence.file.replaced\"\\n          : \"worker_evidence.file.attached\",\\n        input.recordId,\\n        Object.freeze({\\n          versionId: input.versionId,\\n          attachmentId: input.attachmentId,\\n          attachmentKind: input.attachmentKind\\n        }),\\n        input.now\\n      );\\n''' + "'''" + ''',
)'''
new_bind = '''repo = replace_once(
    repo,
    ''' + "'''" + '''      await transaction.query(\\n        `INSERT INTO worker_evidence_attachments (\\n           attachment_id, record_id, version_id, attachment_kind,\\n           secure_file_id, display_filename, created_at, superseded_at\\n         ) VALUES ($1,$2,$3,$4,$5,$6,$7,NULL)`,\\n        [\\n          input.attachmentId,\\n          input.recordId,\\n          input.versionId,\\n          input.attachmentKind,\\n          input.secureFileId,\\n          input.displayFilename,\\n          input.now\\n        ]\\n      );\\n      return Object.freeze({\\n''' + "'''" + ''',
    ''' + "'''" + '''      await transaction.query(\\n        `INSERT INTO worker_evidence_attachments (\\n           attachment_id, record_id, version_id, attachment_kind,\\n           secure_file_id, display_filename, created_at, superseded_at\\n         ) VALUES ($1,$2,$3,$4,$5,$6,$7,NULL)`,\\n        [\\n          input.attachmentId,\\n          input.recordId,\\n          input.versionId,\\n          input.attachmentKind,\\n          input.secureFileId,\\n          input.displayFilename,\\n          input.now\\n        ]\\n      );\\n      await appendWorkerEvidenceAudit(\\n        transaction,\\n        input.principal,\\n        input.expectedActiveAttachmentId\\n          ? \"worker_evidence.file.replaced\"\\n          : \"worker_evidence.file.attached\",\\n        input.recordId,\\n        Object.freeze({\\n          versionId: input.versionId,\\n          attachmentId: input.attachmentId,\\n          attachmentKind: input.attachmentKind\\n        }),\\n        input.now\\n      );\\n      return Object.freeze({\\n''' + "'''" + ''',
    "bindAttachment transactional audit",
)'''
text = replace_once(text, old_bind, new_bind, "bindAttachment patch transport")

old_imports = '''    'import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";\\n'
    'import type { AuditAction, AuditMetadata } from "../audit/audit-domain";\\n'
    'import { DatabaseAuditRepository } from "../audit/audit-repository";\\n' '''
new_imports = '''    'import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";\\n'
    'import { bindTrustedAuditActor, type AuditAction } from "../audit/audit-domain";\\n'
    'import { DatabaseAuditRepository } from "../audit/audit-repository";\\n' '''
text = replace_once(text, old_imports, new_imports, "accepted audit imports")

old_helper = '''    ''' + "'''" + '''async function appendWorkerEvidenceAudit(\\n  database: DatabaseClient,\\n  principal: AuthorizationPrincipal,\\n  action: AuditAction,\\n  recordId: string,\\n  metadata: AuditMetadata,\\n  occurredAt: string\\n): Promise<void> {\\n  const audit = new DatabaseAuditRepository(Promise.resolve(database));\\n  await audit.appendNative(principal, {\\n    action,\\n    outcome: \"succeeded\",\\n    targetType: \"resource\",\\n    targetReference: recordId,\\n    metadata,\\n    occurredAt\\n  });\\n}\\n\\nfunction timestamp(value: string | Date): string {\\n''' + "'''" + ''','''
new_helper = '''    ''' + "'''" + '''async function appendWorkerEvidenceAudit(\\n  database: DatabaseClient,\\n  principal: AuthorizationPrincipal,\\n  action: AuditAction,\\n  recordId: string,\\n  metadata: unknown,\\n  _occurredAt: string\\n): Promise<void> {\\n  const audit = new DatabaseAuditRepository(Promise.resolve(database));\\n  const actor = bindTrustedAuditActor(principal);\\n  await audit.append(actor, {\\n    action,\\n    outcome: \"succeeded\",\\n    target: Object.freeze({ type: \"resource\", reference: recordId }),\\n    metadata\\n  });\\n}\\n\\nfunction timestamp(value: string | Date): string {\\n''' + "'''" + ''','''
text = replace_once(text, old_helper, new_helper, "accepted audit repository API")

path.write_text(text, encoding="utf-8")
print("M1.11 Task 5 patch corrections applied.")
