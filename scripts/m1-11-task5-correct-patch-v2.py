from pathlib import Path

base_path = Path("scripts/m1-11-task5-correct-patch.py")
base_source = base_path.read_text(encoding="utf-8")
audit_label = base_source.find('"accepted audit import"')
if audit_label < 0:
    raise SystemExit("Could not locate the temporary audit correction boundary.")
audit_start = base_source.rfind("\ntext = replace_once(", 0, audit_label)
if audit_start < 0:
    raise SystemExit("Could not isolate the proven Task 5 correction prefix.")

# Reuse only the already-proven 0028/createDraft/bindAttachment corrections.
prefix = base_source[:audit_start]
exec(prefix + '\npath.write_text(text, encoding="utf-8")\n', {})

patch_path = Path("scripts/m1-11-task5-atomic-patch.py")
text = patch_path.read_text(encoding="utf-8")


def one(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    text = text.replace(old, new, 1)


one(
    "import type { AuditAction, AuditMetadata }",
    "import { bindTrustedAuditActor, type AuditAction }",
    "accepted audit import",
)
one("metadata: AuditMetadata,", "metadata: unknown,", "audit metadata type")
one("occurredAt: string", "_occurredAt: string", "audit timestamp parameter")
one(
    "  await audit.appendNative(principal, {",
    r"  const actor = bindTrustedAuditActor(principal);\n  await audit.append(actor, {",
    "accepted audit append method",
)
one(
    r"    targetType: \"resource\",\n    targetReference: recordId,\n    metadata,\n    occurredAt\n",
    r"    target: Object.freeze({ type: \"resource\", reference: recordId }),\n    metadata\n",
    "accepted audit target shape",
)

patch_path.write_text(text, encoding="utf-8")
print("M1.11 Task 5 corrected patch v2 is ready.")
