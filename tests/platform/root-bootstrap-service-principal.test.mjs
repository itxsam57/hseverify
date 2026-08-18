import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const repositorySource = await readFile(
  resolve("src/lib/auth/auth-access-repository.ts"),
  "utf8"
);
const provisioningSource = await readFile(
  resolve("src/lib/auth/staff-provisioning-service.ts"),
  "utf8"
);

test("Root bootstrap counts only interactive active Root accounts", () => {
  assert.match(repositorySource, /countInteractiveRoleAssignments\s*\(/);
  assert.match(
    repositorySource,
    /FROM auth_account_roles[\s\S]*JOIN auth_accounts[\s\S]*account_status\s*=\s*'active'/
  );
  assert.match(
    provisioningSource,
    /countInteractiveRoleAssignments\("root"\)/
  );
  assert.doesNotMatch(
    provisioningSource,
    /countRoleAssignments\("root"\)/
  );
});
