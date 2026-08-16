from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def patch_method(text: str, method: str, code: str) -> str:
    start_marker = f"  async {method}"
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f"Missing method {method}")
    next_start = text.find("\n  async ", start + len(start_marker))
    end = len(text) if next_start < 0 else next_start
    section = text[start:end]
    marker = "      return true;\n"
    if section.count(marker) != 1:
        raise SystemExit(f"{method}: expected one transaction success return, found {section.count(marker)}")
    section = section.replace(marker, code + marker, 1)
    return text[:start] + section + text[end:]


ACTIONS = [
    "worker_evidence.record.created",
    "worker_evidence.draft.saved",
    "worker_evidence.file.attached",
    "worker_evidence.file.replaced",
    "worker_evidence.version.submitted",
    "worker_evidence.revision.started",
    "worker_evidence.employment.ended",
    "worker_evidence.skill.inactivated",
    "worker_evidence.leaving_letter.attached",
    "worker_evidence.leaving_letter.replaced",
]

# 1. TypeScript audit vocabulary.
audit_path = Path("src/lib/audit/audit-domain.ts")
audit = audit_path.read_text(encoding="utf-8")
audit = replace_once(
    audit,
    '  "company_workforce.link.accepted",\n  "company_workforce.link.revoked"\n] as const;',
    '  "company_workforce.link.accepted",\n  "company_workforce.link.revoked",\n'
    + "\n".join(f'  "{action}",' for action in ACTIONS[:-1])
    + f'\n  "{ACTIONS[-1]}"\n] as const;',
    "audit-domain actions",
)
audit_path.write_text(audit, encoding="utf-8")

# 2. Database audit action CHECK inherits the accepted 0028 list and adds M1.11.
m28 = Path("database/migrations/0028_company_worker_invitations_codes.up.sql").read_text(encoding="utf-8")
block_match = re.search(
    r"ALTER TABLE platform_audit_events\n  DROP CONSTRAINT IF EXISTS platform_audit_events_action_check;\n\n"
    r"ALTER TABLE platform_audit_events\n  ADD CONSTRAINT platform_audit_events_action_check\n  CHECK \(action_key IN \(.*?\n  \)\);",
    m28,
    flags=re.S,
)
if not block_match:
    raise SystemExit("Could not locate accepted 0028 audit action constraint block")
audit_block = block_match.group(0)
audit_block = replace_once(
    audit_block,
    "    'company_workforce.link.revoked'\n",
    "    'company_workforce.link.revoked',\n"
    + "\n".join(f"    '{action}'," for action in ACTIONS[:-1])
    + f"\n    '{ACTIONS[-1]}'\n",
    "0028 inherited audit action tail",
)
m30_path = Path("database/migrations/0030_worker_evidence_records.up.sql")
m30 = m30_path.read_text(encoding="utf-8")
if "worker_evidence.record.created" in m30:
    raise SystemExit("0030 already contains M1.11 audit action constraint")
m30 += (
    "\n-- M1.11 extends the accepted immutable audit vocabulary without weakening prior actions.\n"
    + audit_block
    + "\n"
)
m30_path.write_text(m30, encoding="utf-8")

# 3. Transactional repository audit + exact certificate submission guard.
repo_path = Path("src/lib/worker-evidence/worker-evidence-repository.ts")
repo = repo_path.read_text(encoding="utf-8")
repo = replace_once(
    repo,
    'import type { DatabaseClient } from "../database/database";\n',
    'import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";\n'
    'import type { AuditAction, AuditMetadata } from "../audit/audit-domain";\n'
    'import { DatabaseAuditRepository } from "../audit/audit-repository";\n'
    'import type { DatabaseClient } from "../database/database";\n',
    "repository imports",
)
repo = replace_once(
    repo,
    '  WorkerEvidenceConflictError,\n',
    '  WorkerEvidenceAttachmentUnavailableError,\n  WorkerEvidenceConflictError,\n',
    "repository attachment error import",
)
repo = replace_once(
    repo,
    'function timestamp(value: string | Date): string {\n',
    '''async function appendWorkerEvidenceAudit(\n  database: DatabaseClient,\n  principal: AuthorizationPrincipal,\n  action: AuditAction,\n  recordId: string,\n  metadata: AuditMetadata,\n  occurredAt: string\n): Promise<void> {\n  const audit = new DatabaseAuditRepository(Promise.resolve(database));\n  await audit.appendNative(principal, {\n    action,\n    outcome: "succeeded",\n    targetType: "resource",\n    targetReference: recordId,\n    metadata,\n    occurredAt\n  });\n}\n\nfunction timestamp(value: string | Date): string {\n''',
    "repository audit helper",
)
repo = replace_once(
    repo,
    '  async createDraft(input: {\n    workerAccountId: string;\n',
    '  async createDraft(input: {\n    principal: AuthorizationPrincipal;\n    workerAccountId: string;\n',
    "createDraft principal",
)
repo = patch_method(
    repo,
    "createDraft",
    '''      await appendWorkerEvidenceAudit(\n        transaction,\n        input.principal,\n        "worker_evidence.record.created",\n        input.recordId,\n        Object.freeze({ recordKind: input.kind, versionId: input.versionId }),\n        input.now\n      );\n''',
)

save_methods = [
    ("saveQualificationDraft", "qualification"),
    ("saveExperienceDraft", "experience"),
    ("saveEmploymentDraft", "employment"),
    ("saveSkillDraft", "skill"),
]
for method, kind in save_methods:
    repo = replace_once(
        repo,
        f'  async {method}(\n    workerAccountId: string,\n',
        f'  async {method}(\n    principal: AuthorizationPrincipal,\n    workerAccountId: string,\n',
        f"{method} principal",
    )
    repo = patch_method(
        repo,
        method,
        f'''      await appendWorkerEvidenceAudit(\n        transaction,\n        principal,\n        "worker_evidence.draft.saved",\n        input.recordId,\n        Object.freeze({{ recordKind: "{kind}", versionId: current.versionId }}),\n        now\n      );\n''',
    )

repo = replace_once(
    repo,
    '  async submitDraft(input: {\n    workerAccountId: string;\n',
    '  async submitDraft(input: {\n    principal: AuthorizationPrincipal;\n    workerAccountId: string;\n',
    "submitDraft principal",
)
repo = replace_once(
    repo,
    '''      if (current.status !== "draft" || current.revision !== input.expectedRevision) {\n        throw new WorkerEvidenceConflictError();\n      }\n      if (current.supersedesVersionId) {\n''',
    '''      if (current.status !== "draft" || current.revision !== input.expectedRevision) {\n        throw new WorkerEvidenceConflictError();\n      }\n      if (current.kind === "qualification") {\n        const primaryCertificate = await transaction.query(\n          `SELECT 1\n             FROM worker_evidence_attachments\n            WHERE record_id=$1\n              AND version_id=$2\n              AND attachment_kind='primary_certificate'\n              AND superseded_at IS NULL\n            LIMIT 1`,\n          [input.recordId, current.versionId]\n        );\n        if (primaryCertificate.rows.length !== 1) {\n          throw new WorkerEvidenceAttachmentUnavailableError(\n            "Attach the primary qualification certificate before submitting."\n          );\n        }\n      }\n      if (current.supersedesVersionId) {\n''',
    "qualification primary certificate transaction guard",
)
repo = patch_method(
    repo,
    "submitDraft",
    '''      await appendWorkerEvidenceAudit(\n        transaction,\n        input.principal,\n        "worker_evidence.version.submitted",\n        input.recordId,\n        Object.freeze({ versionId: current.versionId, versionNumber: current.versionNumber }),\n        input.now\n      );\n''',
)

for method, action in [
    ("startRevision", "worker_evidence.revision.started"),
    ("endEmployment", "worker_evidence.employment.ended"),
    ("markSkillInactive", "worker_evidence.skill.inactivated"),
]:
    repo = replace_once(
        repo,
        f'  async {method}(input: {{\n    workerAccountId: string;\n',
        f'  async {method}(input: {{\n    principal: AuthorizationPrincipal;\n    workerAccountId: string;\n',
        f"{method} principal",
    )
    repo = patch_method(
        repo,
        method,
        f'''      await appendWorkerEvidenceAudit(\n        transaction,\n        input.principal,\n        "{action}",\n        input.recordId,\n        Object.freeze({{ previousVersionId: current.versionId, newVersionId: input.newVersionId }}),\n        input.now\n      );\n''',
    )

repo = replace_once(
    repo,
    '  async bindAttachment(input: {\n    workerAccountId: string;\n',
    '  async bindAttachment(input: {\n    principal: AuthorizationPrincipal;\n    workerAccountId: string;\n',
    "bindAttachment principal",
)
repo = patch_method(
    repo,
    "bindAttachment",
    '''      await appendWorkerEvidenceAudit(\n        transaction,\n        input.principal,\n        input.expectedActiveAttachmentId\n          ? "worker_evidence.file.replaced"\n          : "worker_evidence.file.attached",\n        input.recordId,\n        Object.freeze({\n          versionId: input.versionId,\n          attachmentId: input.attachmentId,\n          attachmentKind: input.attachmentKind\n        }),\n        input.now\n      );\n''',
)
repo_path.write_text(repo, encoding="utf-8")

# 4. Service passes the authenticated Worker principal into every transaction.
service_path = Path("src/lib/worker-evidence/worker-evidence-service.ts")
service = service_path.read_text(encoding="utf-8")
service = replace_once(
    service,
    '    return this.repository.createDraft({\n      workerAccountId: worker.accountId,\n',
    '    return this.repository.createDraft({\n      principal: worker,\n      workerAccountId: worker.accountId,\n',
    "service create principal",
)
for method in [
    "saveQualificationDraft",
    "saveExperienceDraft",
    "saveEmploymentDraft",
    "saveSkillDraft",
]:
    service = replace_once(
        service,
        f'    const saved = await this.repository.{method}(\n      worker.accountId,\n',
        f'    const saved = await this.repository.{method}(\n      worker,\n      worker.accountId,\n',
        f"service {method} principal",
    )
for marker, label in [
    ('    const submitted = await this.repository.submitDraft({\n      workerAccountId:', "service submit principal"),
    ('    const revised = await this.repository.startRevision({\n      workerAccountId:', "service revision principal"),
    ('    const ended = await this.repository.endEmployment({\n      workerAccountId:', "service employment principal"),
    ('    const inactive = await this.repository.markSkillInactive({\n      workerAccountId:', "service skill principal"),
]:
    service = replace_once(
        service,
        marker,
        marker.replace("workerAccountId:", "principal: this.worker(principal),\n      workerAccountId:"),
        label,
    )
service_path.write_text(service, encoding="utf-8")

# 5. Attachment transaction records the true Worker actor.
attachment_path = Path("src/lib/worker-evidence/worker-evidence-attachment-service.ts")
attachment = attachment_path.read_text(encoding="utf-8")
attachment = replace_once(
    attachment,
    '    const attached = await this.repository.bindAttachment({\n      workerAccountId: worker.accountId,\n',
    '    const attached = await this.repository.bindAttachment({\n      principal: worker,\n      workerAccountId: worker.accountId,\n',
    "attachment principal",
)
attachment_path.write_text(attachment, encoding="utf-8")

# 6. Static guard accepts the stronger transactional repository boundary.
check_path = Path("scripts/check-worker-evidence-records.mjs")
check = check_path.read_text(encoding="utf-8")
check = replace_once(
    check,
    'requireMarker(service, "DatabaseAuditRepository", paths.service);\n',
    'requireMarker(\n  `${repository}\\n${service}\\n${attachments}`,\n  "DatabaseAuditRepository",\n  "M1.11 transactional audit layer"\n);\n',
    "static transactional audit marker",
)
check_path.write_text(check, encoding="utf-8")

# 7. Runtime test principals now satisfy the accepted immutable audit actor FK.
seed_helper = '''\nasync function seedAuditActor(database, actor) {\n  await database.query(\n    `INSERT INTO auth_accounts (\n       account_id, email_normalized, display_name, account_status,\n       password_hash, email_verified_at, password_set_at, created_at, updated_at\n     ) VALUES ($1,$2,$3,'active',$4,$5,$5,$5,$5)\n     ON CONFLICT (account_id) DO NOTHING`,\n    [\n      actor.accountId,\n      actor.email,\n      actor.displayName,\n      "scrypt$16384$8$1$salt$hash",\n      NOW\n    ]\n  );\n}\n\n'''

for test_name in [
    "tests/platform/worker-evidence-records.test.mjs",
    "tests/platform/worker-evidence-attachments.test.mjs",
    "tests/platform/worker-qualification-flow.test.mjs",
]:
    path = Path(test_name)
    test_text = path.read_text(encoding="utf-8")
    if "async function seedAuditActor" in test_text:
        raise SystemExit(f"{test_name}: audit actor helper already exists")
    first_test = test_text.find('test("')
    if first_test < 0:
        raise SystemExit(f"{test_name}: no test marker found")
    test_text = test_text[:first_test] + seed_helper + test_text[first_test:]

    # Seed every principal variable immediately after creation. This intentionally
    # targets only the test fixtures in these three M1.11 files.
    pattern = re.compile(r'(?P<indent>    )const (?P<name>workerA|workerB|worker|actor) = principal\([^\n]*\);\n')
    def seed_match(match):
        indent = match.group("indent")
        name = match.group("name")
        return match.group(0) + f"{indent}await seedAuditActor(database, {name});\n"
    test_text, count = pattern.subn(seed_match, test_text)
    if count < 1:
        raise SystemExit(f"{test_name}: no principal fixtures were seeded")
    path.write_text(test_text, encoding="utf-8")

print("M1.11 Task 5 atomic patch staged successfully.")
