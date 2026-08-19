import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function assertUseServerModuleExportsOnlyAsyncRuntimeActions(
  path,
  expectedActionNames
) {
  const source = await readFile(path, "utf8");
  assert.match(source, /^"use server";/);
  assert.doesNotMatch(
    source,
    /export\s+const\s+/,
    `A "use server" module cannot export runtime constants: ${path}`
  );
  for (const actionName of expectedActionNames) {
    assert.match(source, new RegExp(`export async function ${actionName}`));
  }
}

test("Company registration use-server modules export only async runtime actions", async () => {
  await assertUseServerModuleExportsOnlyAsyncRuntimeActions(
    "src/app/company/register/actions.ts",
    [
      "startCompanyRegistrationAction",
      "verifyCompanyEmailAction",
      "resendCompanyEmailAction",
      "verifyCompanyMfaAction"
    ]
  );

  await assertUseServerModuleExportsOnlyAsyncRuntimeActions(
    "src/app/company/register/sandbox/actions.ts",
    ["readCompanySandboxDelivery"]
  );
});

test("successful Company email verification performs a server navigation so the next security step is rendered from committed state", async () => {
  const source = await readFile("src/app/company/register/actions.ts", "utf8");
  const start = source.indexOf("export async function verifyCompanyEmailAction");
  const end = source.indexOf("export async function resendCompanyEmailAction");
  assert.notEqual(start, -1, "verifyCompanyEmailAction is missing");
  assert.notEqual(end, -1, "resendCompanyEmailAction boundary is missing");
  const actionSource = source.slice(start, end);
  assert.match(actionSource, /await service\.verifyEmail\(/);
  assert.match(
    actionSource,
    /redirect\("\/company\/register\/verify"\)/,
    "A successful email verification must force a new server render instead of leaving Step 1 mounted with stale Server Component state."
  );
});
