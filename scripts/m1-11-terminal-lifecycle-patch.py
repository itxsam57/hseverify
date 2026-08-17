from pathlib import Path

path = Path("src/lib/worker-evidence/worker-evidence-repository.ts")
text = path.read_text(encoding="utf-8")
methods = ("startRevision", "endEmployment", "markSkillInactive")
old = '''      if (current.status !== "submitted" || current.revision !== input.expectedRevision) {
        throw new WorkerEvidenceConflictError();
      }'''
new = '''      if (
        current.lifecycleStatus !== "active" ||
        current.status !== "submitted" ||
        current.revision !== input.expectedRevision
      ) {
        throw new WorkerEvidenceConflictError();
      }'''

for method in methods:
    start = text.find(f"  async {method}(")
    if start < 0:
        raise SystemExit(f"{method}: method not found")
    next_method = text.find("\n  async ", start + 1)
    end = len(text) if next_method < 0 else next_method
    block = text[start:end]
    count = block.count(old)
    if count != 1:
        raise SystemExit(f"{method}: expected one lifecycle condition, found {count}")
    text = text[:start] + block.replace(old, new, 1) + text[end:]

path.write_text(text, encoding="utf-8")
print("M1.11 terminal lifecycle guards staged.")
