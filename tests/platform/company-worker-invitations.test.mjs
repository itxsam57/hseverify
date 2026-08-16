import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const runtime = process.env.HSE_COMPANY_WORKFORCE_RUNTIME_DIST;
assert.ok(runtime, "HSE_COMPANY_WORKFORCE_RUNTIME_DIST is required");

const serviceModule = await import(pathToFileURL(join(runtime, "company", "company-workforce-service.js")).href);
const domainModule = await import(pathToFileURL(join(runtime, "company", "company-workforce-domain.js")).href);

const REQUIRED_SERVICE_METHODS = Object.freeze([
  "inviteWorker",
  "bulkInviteWorkers",
  "resendInvitation",
  "revokeInvitation",
  "createRegistrationCode",
  "revokeRegistrationCode",
  "acceptInvitation",
  "redeemRegistrationCode",
  "requestPermanentWorkerLink",
  "acceptWorkerLink"
]);

for (const method of REQUIRED_SERVICE_METHODS) {
  test(`M1.10 service exposes ${method} through one Company↔Worker authority`, () => {
    assert.equal(typeof serviceModule.CompanyWorkforceService?.prototype?.[method], "function");
  });
}

test("M1.10 domain exposes neutral access/conflict/secret errors instead of tenant-enumerating variants", () => {
  for (const name of ["CompanyWorkforceAccessError", "CompanyWorkforceConflictError", "CompanyWorkforceSecretError"]) {
    assert.equal(typeof domainModule[name], "function", `${name} must be exported`);
  }
  assert.equal("CompanyWorkforceCrossTenantError" in domainModule, false);
  assert.equal("CompanyWorkforceUnknownTenantError" in domainModule, false);
});

test("M1.10 domain bounds payment responsibility to Company or Worker", () => {
  assert.deepEqual([...domainModule.COMPANY_WORKFORCE_PAYMENT_RESPONSIBILITIES].sort(), ["company", "worker"]);
});
