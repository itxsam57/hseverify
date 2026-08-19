import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Company registration use-server module exports only async runtime actions", async () => {
  const source = await readFile("src/app/company/register/actions.ts", "utf8");
  assert.match(source, /^"use server";/);
  assert.doesNotMatch(
    source,
    /export\s+const\s+/,
    'A "use server" module cannot export runtime constants; keep client initial state in the client module.'
  );
  assert.match(source, /export async function startCompanyRegistrationAction/);
  assert.match(source, /export async function verifyCompanyEmailAction/);
  assert.match(source, /export async function resendCompanyEmailAction/);
  assert.match(source, /export async function verifyCompanyMfaAction/);
});
