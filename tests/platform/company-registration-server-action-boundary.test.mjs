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
