from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_between(text: str, start: str, end: str, replacement: str, label: str) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{label}: start marker missing")
    end_index = text.find(end, start_index)
    if end_index < 0:
        raise SystemExit(f"{label}: end marker missing")
    return text[:start_index] + replacement + text[end_index:]


profile_path = Path("docs/engineering/PROJECT-PROFILE.md")
profile = profile_path.read_text(encoding="utf-8")
profile = replace_once(
    profile,
    "- **M1.10 Worker Invitations and Company Codes:** **IN PROGRESS**; only active product brick.\n- **M1.11+:** blocked.\n",
    "- **M1.10 Worker Invitations and Company Codes:** **ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO M1.13**; PR #76, exact head `9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725`, targeted gate `31971156192`, full gate `31971157867`, merge `3b32287fecb30f16d682cb130be0e8f1eb466616`, merged-main gate `31971506738`.\n- **M1.11 Employment, Experience, Qualification, Skill and Leaving Records:** **IN PROGRESS**; only active product brick.\n- **M1.12+:** blocked.\n",
    "project profile current position",
)
profile = replace_between(
    profile,
    "## Current M1.10 architecture\n",
    "## Release discipline\n",
    "## Current M1.11 architecture\n\nM1.11 extends accepted primitives rather than creating parallel systems:\n- Worker ownership derives only from the live authenticated Worker principal; browser-supplied owner/account authority is never trusted.\n- Qualifications, experience, employment and skills use typed relational records with immutable submitted versions and explicit revisions/history.\n- Qualification metadata and its primary certificate remain one integrated record/version; submission requires the exact active primary certificate.\n- Evidence files reuse the M1.06 private reservation/quarantine/scan pipeline and bind to the exact record, version and attachment slot.\n- Employment end-state and skill inactivation preserve history and are terminal at the transaction boundary; crafted repeat/reopen requests fail closed.\n- Leaving letters bind only to the exact ended employment/version and preserve replacement lineage.\n- Skill assurance states remain distinct; Worker writes cannot self-promote beyond `self_declared`.\n- Material record/file/version transitions append centralized immutable audit with the true Worker actor inside the same transaction.\n- Reviewer verification remains M2.02, public verification remains M1.12, and assessment behavior remains blocked for M2.\n\n",
    "project profile active architecture",
)
profile = profile.replace("M1.10–M1.12 advance", "M1.11–M1.12 advance")
profile_path.write_text(profile, encoding="utf-8")

memory_path = Path("docs/engineering/HSE_BUILD_MEMORY.md")
memory = memory_path.read_text(encoding="utf-8")
memory = replace_once(
    memory,
    "## Current position — 12 August 2026",
    "## Current position — 17 August 2026",
    "build memory date",
)
memory = replace_once(
    memory,
    "- M1.10 Worker Invitations and Company Codes — **IN PROGRESS** on `build/m1-10-worker-invitations-company-codes`.\n- M1.11+ — blocked.\n",
    "- M1.10 Worker Invitations and Company Codes — **IMPLEMENTATION MERGED / ENGINEERING PASS / OWNER ACCEPTANCE DEFERRED TO M1.13**.\n  - PR #76; exact head `9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725`; targeted gate `31971156192` PASS; exact-head full gate `31971157867` PASS; merge `3b32287fecb30f16d682cb130be0e8f1eb466616`; merged-main gate `31971506738` PASS.\n- M1.11 Employment, Experience, Qualification, Skill and Leaving Records — **IN PROGRESS** on `build/m1-11-worker-evidence-records`.\n- M1.12+ — blocked.\n",
    "build memory current brick",
)
memory = replace_between(
    memory,
    "## Active M1.10 invariants\n",
    "## Engineering discipline\n",
    "## Active M1.11 invariants\n\n- Worker ownership is live-session-derived; copied IDs cannot transfer authority or enumerate another Worker.\n- Qualification metadata and the primary certificate bind to the exact record/version; submission is blocked without that active certificate.\n- Experience/employment support independent multiple records and never overwrite one another.\n- Submitted versions are immutable; later edits create a new draft/version and preserve history.\n- Evidence files reuse M1.06 reservation/quarantine/scan/private-file controls with exact business-reference binding.\n- Same-slot file replacement is optimistic and history-preserving; files cannot leak across records/forms.\n- Employment ending and skill inactivation are terminal transaction states and cannot be repeated or reopened through crafted calls.\n- Leaving letters bind only to the exact current submitted ended employment version and retain replacement lineage.\n- Worker skill writes remain `self_declared`; evidence and competency assurance states cannot be self-promoted.\n- Material mutations write centralized immutable audit with the true Worker actor inside the same transaction.\n- M1.12/M2 implementation leakage is forbidden while M1.11 is active.\n\n",
    "build memory active invariants",
)
memory_path.write_text(memory, encoding="utf-8")

matrix_path = Path("docs/engineering/PROJECT-TEST-MATRIX.md")
matrix = matrix_path.read_text(encoding="utf-8")
matrix = replace_once(
    matrix,
    "| TM-029A | Worker invitations/Company codes/Company↔Worker linking | M1.10 permanent source/runtime/migration suites | Combined Milestone 1 test | IN PROGRESS |\n| TM-030 | Employment/experience/qualification/skill/leaving records | Future M1.11 | Combined Milestone 1 test | BLOCKED |",
    "| TM-029A | Worker invitations/Company codes/Company↔Worker linking | Exact head `9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725`, targeted gate `31971156192`, full gate `31971157867`; merge `3b32287fecb30f16d682cb130be0e8f1eb466616`, merged-main gate `31971506738` | Combined Milestone 1 test | OWNER ACCEPTANCE DEFERRED |\n| TM-030 | Employment/experience/qualification/skill/leaving records | M1.11 permanent source/runtime/migration/file-binding/lifecycle suites | Combined Milestone 1 test | IN PROGRESS |",
    "test matrix M1.10/M1.11 rows",
)
matrix = replace_between(
    matrix,
    "## Current acceptance semantics\n",
    "## Test quality rules\n",
    "## Current acceptance semantics\n\nM1.08, M1.09 and M1.10 have engineering acceptance but **not owner/browser PASS**. The owner explicitly requested one combined Milestone 1 browser test after M1.12 is engineering-green, so TM-028, TM-029 and TM-029A remain `OWNER ACCEPTANCE DEFERRED`.\n\nTM-030 is the only active test target. M1.11 must permanently prove:\n- exact Worker ownership and non-enumerating copied-ID failures;\n- integrated qualification metadata plus primary-certificate binding and submission readiness;\n- multiple independent experience/employment records without overwrite;\n- immutable submitted versions and safe optimistic revisions;\n- cross-form and cross-record file isolation through the accepted M1.06 secure-file lifecycle;\n- terminal employment/skill lifecycle guards and preserved history;\n- distinct skill assurance states without Worker self-promotion;\n- leaving letters scoped to the exact ended employment/version with replacement lineage;\n- material transactional audit with the true Worker actor;\n- migration restart/rollback/reapply compatibility and no hard lower-brick ownership;\n- no M1.12/M2 business implementation leakage.\n\nM1.12+ remain blocked until TM-030 passes exact-head and merged-main engineering release gates. There is no intermediate browser acceptance stop under the current owner instruction.\n\n",
    "test matrix active semantics",
)
matrix_path.write_text(matrix, encoding="utf-8")

checker_path = Path("scripts/check-engineering-automation.mjs")
checker = checker_path.read_text(encoding="utf-8")
checker = replace_once(
    checker,
    '  "scripts/run-company-worker-invitation-tests.mjs",\n',
    '  "scripts/run-company-worker-invitation-tests.mjs",\n  "scripts/check-worker-evidence-records.mjs",\n  "scripts/run-worker-evidence-record-tests.mjs",\n',
    "checker M1.11 scripts",
)
checker = replace_once(
    checker,
    '  "tests/platform/company-worker-invitations-migration-stack.test.mjs"\n',
    '  "tests/platform/company-worker-invitations-migration-stack.test.mjs",\n  "tests/platform/worker-evidence-records.test.mjs",\n  "tests/platform/worker-evidence-attachments.test.mjs",\n  "tests/platform/worker-evidence-leaving-letter.test.mjs",\n  "tests/platform/worker-evidence-lifecycle.test.mjs",\n  "tests/platform/worker-qualification-flow.test.mjs",\n  "tests/platform/worker-evidence-migration-stack.test.mjs",\n  "tests/platform/worker-evidence-migration-guards.test.mjs"\n',
    "checker M1.11 tests",
)
checker = replace_once(
    checker,
    '  "check:company-verification", "test:m1-08-final", "check:m1-09", "test:m1-09", "check:m1-10", "test:m1-10", "report:handoff"\n',
    '  "check:company-verification", "test:m1-08-final", "check:m1-09", "test:m1-09", "check:m1-10", "test:m1-10", "check:m1-11", "test:m1-11", "report:handoff"\n',
    "checker package commands",
)
checker = replace_once(
    checker,
    '  "check:worker-identity-corrections", "check:company-verification", "check:m1-09", "check:m1-10", "test:m1-06-final", "test:m1-07-final",\n  "test:m1-08-final", "test:m1-09", "test:m1-10", "typecheck", "lint", "build"\n',
    '  "check:worker-identity-corrections", "check:company-verification", "check:m1-09", "check:m1-10", "check:m1-11", "test:m1-06-final", "test:m1-07-final",\n  "test:m1-08-final", "test:m1-09", "test:m1-10", "test:m1-11", "typecheck", "lint", "build"\n',
    "checker full-gate markers",
)
checker = replace_once(
    checker,
    'for (const marker of ["check:engineering", "check:m1-06-final", "check:worker-identity", "check:company-verification", "check:m1-09", "check:m1-10", "typecheck", "lint"])',
    'for (const marker of ["check:engineering", "check:m1-06-final", "check:worker-identity", "check:company-verification", "check:m1-09", "check:m1-10", "check:m1-11", "typecheck", "lint"])',
    "checker quick-gate markers",
)
checker = replace_once(
    checker,
    '  requirePattern(text, /M1\\.10[\\s\\S]{0,300}\\bIN PROGRESS\\b/i, label, "M1.10 IN PROGRESS");\n',
    '  requirePattern(text, /M1\\.10[\\s\\S]{0,420}\\bENGINEERING PASS\\b/i, label, "M1.10 engineering PASS");\n  requirePattern(text, /M1\\.10[\\s\\S]{0,520}\\bOWNER (?:ACCEPTANCE )?DEFERRED\\b/i, label, "M1.10 owner acceptance deferred");\n  requirePattern(text, /M1\\.11[\\s\\S]{0,300}\\bIN PROGRESS\\b/i, label, "M1.11 IN PROGRESS");\n',
    "checker active brick facts",
)
checker = replace_once(
    checker,
    '  requirePattern(text, /M1\\.11[\\s\\S]{0,220}\\bBLOCKED\\b/i, label, "M1.11 blocked");\n  requirePattern(text, /M1\\.12[\\s\\S]{0,220}\\bBLOCKED\\b/i, label, "M1.12 blocked");\n',
    '  requirePattern(text, /M1\\.12[\\s\\S]{0,220}\\bBLOCKED\\b/i, label, "M1.12 blocked");\n',
    "checker blocked brick facts",
)
checker = replace_once(
    checker,
    '  "1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf", "31569898065", "PR #75"\n',
    '  "1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf", "31569898065", "PR #75",\n  "9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725", "31971156192", "31971157867",\n  "3b32287fecb30f16d682cb130be0e8f1eb466616", "31971506738", "PR #76"\n',
    "checker M1.10 release evidence",
)
checker = replace_once(
    checker,
    'for (const marker of ["TM-026C", "Authorized signed preview/download", "TM-026D", "Complete M1.06 cumulative isolation/migration/recovery acceptance", "TM-027", "Worker Identity Engine and permanent Worker ID", "TM-028", "Company registration/verification", "TM-029", "Sites/departments/Company Team", "TM-029A", "Worker invitations/Company codes/Company↔Worker linking"])',
    'for (const marker of ["TM-026C", "Authorized signed preview/download", "TM-026D", "Complete M1.06 cumulative isolation/migration/recovery acceptance", "TM-027", "Worker Identity Engine and permanent Worker ID", "TM-028", "Company registration/verification", "TM-029", "Sites/departments/Company Team", "TM-029A", "Worker invitations/Company codes/Company↔Worker linking", "TM-030", "Employment/experience/qualification/skill/leaving records"])',
    "checker test-matrix markers",
)
checker = replace_once(
    checker,
    'requirePattern(matrix, /TM-029A[^\\n]*\\|\\s*IN PROGRESS\\s*\\|/i, "PROJECT-TEST-MATRIX.md", "TM-029A IN PROGRESS");\n',
    'requirePattern(matrix, /TM-029A[^\\n]*\\|\\s*OWNER ACCEPTANCE DEFERRED\\s*\\|/i, "PROJECT-TEST-MATRIX.md", "TM-029A owner acceptance deferred");\nrequirePattern(matrix, /TM-030[^\\n]*\\|\\s*IN PROGRESS\\s*\\|/i, "PROJECT-TEST-MATRIX.md", "TM-030 IN PROGRESS");\n',
    "checker matrix status facts",
)
checker = replace_once(
    checker,
    'console.log("Engineering standards, exact-head CI identity, fail-closed full-gate wiring, permanent M1.06–M1.09 evidence, deferred combined Milestone 1 owner acceptance and M1.10-only active build context passed.");',
    'console.log("Engineering standards, exact-head CI identity, fail-closed full-gate wiring, permanent M1.06–M1.10 evidence, deferred combined Milestone 1 owner acceptance and M1.11-only active build context passed.");',
    "checker success message",
)
checker_path.write_text(checker, encoding="utf-8")

print("M1.11 governance and engineering self-check synchronization staged.")
