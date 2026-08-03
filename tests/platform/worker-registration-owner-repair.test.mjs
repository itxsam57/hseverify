import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

async function source(path) {
  return readFile(resolve(process.cwd(), path), "utf8");
}

test("successful Worker OTP transitions force a fresh verification step", async () => {
  const actions = await source("src/app/worker/register/actions.ts");
  const verificationPage = await source(
    "src/app/worker/register/verify/page.tsx"
  );

  assert.match(actions, /revalidatePath\("\/worker\/register\/verify"\)/);
  assert.match(
    actions,
    /redirect\(`\/worker\/register\/verify\?stage=\$\{nextStage\}`\)/
  );
  assert.match(actions, /BUILD-PIN AUTH-REG-VERIFY-REFRESH/);
  assert.match(verificationPage, /export const dynamic = "force-dynamic"/);
  assert.match(verificationPage, /key=\{pendingStep\}/);
});

test("Worker registration remains a simple one-column editable surface", async () => {
  const forms = await source(
    "src/app/worker/register/registration-forms.tsx"
  );
  const copy = await source("src/config/product-copy.ts");
  const memory = await source("docs/engineering/HSE_BUILD_MEMORY.md");

  assert.match(forms, /PRODUCT_COPY\.workerRegistration/);
  assert.doesNotMatch(forms, /styles\.twoColumn/);
  assert.doesNotMatch(forms, /styles\.securityList/);
  assert.match(copy, /DEFERRED_INTEGRATIONS/);
  assert.match(memory, /Build priority rule/);
  assert.match(memory, /BUILD-PIN <MODULE>-<FLOW>-<PURPOSE>/);
});
