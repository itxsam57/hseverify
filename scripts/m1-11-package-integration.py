import json
from pathlib import Path

path = Path("package.json")
data = json.loads(path.read_text(encoding="utf-8"))
scripts = data["scripts"]

scripts["check:m1-11"] = "node scripts/check-worker-evidence-records.mjs"
scripts["test:m1-11"] = "node scripts/run-worker-evidence-record-tests.mjs"

replacements = {
    "test:integration": (
        "npm run test:m1-10 && npm run test:registration-platform",
        "npm run test:m1-10 && npm run test:m1-11 && npm run test:registration-platform",
    ),
    "verify:quick": (
        "npm run check:m1-10 && npm run check:design-system",
        "npm run check:m1-10 && npm run check:m1-11 && npm run check:design-system",
    ),
    "check": (
        "npm run check:m1-10 && npm run check:design-system",
        "npm run check:m1-10 && npm run check:m1-11 && npm run check:design-system",
    ),
}

for key, (old, new) in replacements.items():
    value = scripts[key]
    if value.count(old) != 1:
        raise SystemExit(f"{key}: expected one M1.10 check/integration anchor, found {value.count(old)}")
    scripts[key] = value.replace(old, new, 1)

check_value = scripts["check"]
old_test = "npm run test:m1-10 && npm run test:registration-platform"
new_test = "npm run test:m1-10 && npm run test:m1-11 && npm run test:registration-platform"
if check_value.count(old_test) != 1:
    raise SystemExit(f"check: expected one M1.10 runtime anchor, found {check_value.count(old_test)}")
scripts["check"] = check_value.replace(old_test, new_test, 1)

for key in ("test:integration", "verify:quick", "check"):
    if "m1-11" not in scripts[key]:
        raise SystemExit(f"{key}: M1.11 was not wired")

path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print("M1.11 package verification wiring staged.")
