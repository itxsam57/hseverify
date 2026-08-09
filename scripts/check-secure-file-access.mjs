import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function source(path) {
  return readFile(resolve(path), "utf8");
}

function mustContain(text, pattern, message) {
  assert.match(text, pattern, message);
}

function mustNotContain(text, pattern, message) {
  assert.doesNotMatch(text, pattern, message);
}

const [
  migration,
  rollback,
  auditDomain,
  domain,
  auditAdapter,
  core,
  service,
  http,
  issueRoute,
  previewRoute,
  downloadRoute,
  packageJson
] = await Promise.all([
  source("database/migrations/0014_secure_file_signed_access_audit.up.sql"),
  source("database/migrations/0014_secure_file_signed_access_audit.down.sql"),
  source("src/lib/audit/audit-domain.ts"),
  source("src/lib/secure-files/secure-file-access-domain.ts"),
  source("src/lib/secure-files/secure-file-access-audit.ts"),
  source("src/lib/secure-files/secure-file-access-core.ts"),
  source("src/lib/secure-files/secure-file-access-service.ts"),
  source("src/lib/secure-files/secure-file-access-http.ts"),
  source("src/app/api/secure-files/access/route.ts"),
  source("src/app/api/secure-files/preview/route.ts"),
  source("src/app/api/secure-files/download/route.ts"),
  source("package.json")
]);
const definition = JSON.parse(packageJson);

for (const action of [
  "secure_file.access.authorized",
  "secure_file.access.served"
]) {
  mustContain(migration, new RegExp(`'${action.replaceAll(".", "\\.")}'`),
    `${action} must remain in immutable database audit vocabulary.`);
  mustContain(auditDomain, new RegExp(`"${action.replaceAll(".", "\\.")}"`),
    `${action} must remain in runtime audit vocabulary.`);
}
mustNotContain(rollback, /DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE|DROP CONSTRAINT/i,
  "Signed access audit rollback must preserve immutable access history and vocabulary.");

mustContain(domain, /^import "server-only";/,
  "Signed capability cryptography must remain server-only.");
mustContain(domain, /createHmac/,
  "Signed capability must use server HMAC signing.");
mustContain(domain, /timingSafeEqual/,
  "Signed capability comparison must be timing safe.");
mustContain(domain, /SECURE_FILE_ACCESS_TTL_SECONDS = 120/,
  "Signed capability must remain short lived.");
mustContain(domain, /SECURE_FILE_ACCESS_MAX_TTL_SECONDS = 300/,
  "Verifier must cap accepted capability lifetime.");
mustContain(domain, /sessionId[\s\S]*accountId[\s\S]*activeRole[\s\S]*tenantId[\s\S]*membershipId/,
  "Capability scope binding must cover exact session/account/role/tenant membership.");
mustContain(domain, /keys\.length !== 6/,
  "Signed token payload must reject arbitrary extra fields.");
mustContain(domain, /keys\[0\] !== "exp"[\s\S]*keys\[5\] !== "v"/,
  "Signed token payload schema must remain fixed/versioned.");
mustNotContain(domain, /objectKey|storageAdapter|detectedMime|contentSha256|publicUrl|redirectUrl/,
  "Signed token domain must not carry storage/content/browser redirect authority.");

mustContain(auditAdapter, /^import "server-only";/,
  "Signed access audit adapter must remain server-only.");
mustContain(auditAdapter, /bindTrustedAuditActor\(input\.principal\)/,
  "Signed access audits must bind the existing trusted user audit actor.");
mustContain(auditAdapter, /target: \{ type: "secure_file", reference: input\.fileRef \}/,
  "Signed access audit target must be the opaque secure-file reference.");
mustContain(auditAdapter, /purpose: input\.purpose/,
  "Signed access audit metadata may record only the fixed access purpose plus bounded result facts.");
mustNotContain(auditAdapter, /token|accessUrl|objectKey|contentSha256|storageAdapter|sessionSecret|bytes/i,
  "Signed access audit API must not accept tokens, URLs, storage authority, hashes, secrets or file bytes.");

mustContain(core, /^import "server-only";/,
  "Secure file access core must remain server-only.");
mustContain(core, /file\.lifecycleStatus === "available"/,
  "Only available files may pass signed access provenance.");
mustContain(core, /file\.objectKey === deriveSecureFileObjectKey\(file\.fileId\)/,
  "Object key must remain server-derived from the accepted file record.");
mustContain(core, /input\.repository\.findForPrincipal/,
  "Issue/use path must use accepted live owner-scope repository lookup.");
mustContain(core, /verified\.purpose !== expectedPurpose/,
  "Preview/download purpose must be enforced at use time.");
mustContain(core, /stored\.byteLength !== file\.byteSize/,
  "Private bytes must be checked against accepted size.");
mustContain(core, /sha256\(stored\) !== file\.contentSha256/,
  "Private bytes must be rehashed before response.");
mustContain(core, /"Content-Type": input\.file\.detectedMime/,
  "Content type must come only from accepted stored provenance.");
mustContain(core, /filename="\$\{fallbackName\}"/,
  "ASCII Content-Disposition fallback must be server-generated.");
mustContain(core, /filename\*=UTF-8''\$\{encodedName\}/,
  "Stored filename must use encoded RFC5987-style parameter.");
for (const header of [
  "private, no-store, max-age=0",
  "nosniff",
  "no-referrer",
  "same-origin"
]) {
  mustContain(core, new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `Safe response header contract must include ${header}.`);
}
mustNotContain(core, /public[_A-Z-]?url|https?:\/\//i,
  "Core must never produce a public object URL.");

mustContain(service, /function requireLocalTestStorageEnvironment/,
  "Storage support must be decided by one server-owned fail-closed helper.");
mustContain(service, /value !== "development" && value !== "test"/,
  "Unsupported production/preview storage environments must fail closed.");
mustContain(service, /authorizeSecureFileAccess[\s\S]*requireLocalTestStorageEnvironment\(environment\.appEnvironment\)[\s\S]*authorizeSecureFileAccessCore/,
  "Authorization issuance must refuse environments without an accepted private storage provider.");
mustContain(service, /readSecureFileAccess[\s\S]*requireLocalTestStorageEnvironment\([\s\S]*environment\.appEnvironment[\s\S]*\)[\s\S]*readSecureFileAccessCore/,
  "Content use must refuse environments without an accepted private storage provider.");
mustContain(service, /environment\.sessionSecret/,
  "Signed access must reuse the server session secret through domain-separated HMAC.");
mustContain(service, /createLocalTestPrivateObjectStorage\(storageEnvironment\)/,
  "Only accepted local/test private storage may serve bytes in this subunit.");
mustContain(service, /action: "secure_file\.access\.authorized"/,
  "Successful authorization must be audited before the signed capability is returned.");
mustContain(service, /action: "secure_file\.access\.served"/,
  "Successful serve must be audited before validated bytes are returned.");

mustContain(http, /"\/api\/secure-files\/preview"/,
  "Preview signed URL must target the fixed preview endpoint.");
mustContain(http, /"\/api\/secure-files\/download"/,
  "Download signed URL must target the fixed download endpoint.");
mustContain(http, /keys\.length !== 1[\s\S]*keys\[0\] !== "access"/,
  "Content endpoints must accept exactly one access query parameter.");
mustContain(http, /status: 404/,
  "Authorization/file/token denial must remain non-enumerating.");

mustContain(issueRoute, /MAX_REQUEST_BYTES = 4_096/,
  "Capability issue request must remain bounded.");
mustContain(issueRoute, /authorizeSecureFileAccess/,
  "Capability issue route must use the server access service.");
mustContain(issueRoute, /buildSignedSecureFileAccessUrl/,
  "Capability issue route must return only the fixed relative signed URL.");
mustNotContain(issueRoute, /objectKey|detectedMime|contentSha256|storageAdapter|tenantId|membershipId/,
  "Issue route must not accept decisive storage/content/tenant fields.");

mustContain(previewRoute, /expectedPurpose: "preview"/,
  "Preview endpoint must hard-code preview purpose.");
mustContain(downloadRoute, /expectedPurpose: "download"/,
  "Download endpoint must hard-code download purpose.");
for (const route of [previewRoute, downloadRoute]) {
  mustContain(route, /readCurrentSecureFilePrincipal\(\)/,
    "Content route must resolve the live authenticated principal.");
  mustContain(route, /readSingleAccessToken\(request\)/,
    "Content route must accept only the signed access token query.");
  mustNotContain(route, /searchParams\.get\(["'](?:file|mime|path|tenant|role|purpose)/i,
    "Content route must not read browser-selected file/content/scope authority.");
}

for (const [name, text] of [
  ["domain", domain],
  ["audit adapter", auditAdapter],
  ["core", core],
  ["service", service],
  ["http", http],
  ["issue route", issueRoute],
  ["preview route", previewRoute],
  ["download route", downloadRoute]
]) {
  mustNotContain(text, /\bas any\b|as unknown as|@ts-ignore|@ts-expect-error/,
    `Secure access ${name} must not bypass type/security contracts.`);
}

assert.equal(
  definition.scripts["check:secure-access"],
  "node scripts/check-secure-file-access.mjs"
);
assert.equal(
  definition.scripts["test:secure-access"],
  "node scripts/run-secure-access-tests.mjs"
);
assert.equal(
  definition.scripts["test:secure-access-runtime"],
  "node scripts/run-secure-access-runtime-tests.mjs"
);
for (const aggregate of ["verify:quick", "check"]) {
  assert.match(
    definition.scripts[aggregate],
    /npm run check:secure-access(?:\s|$)/,
    `${aggregate} must execute check:secure-access.`
  );
}
for (const aggregate of ["test:unit", "check"]) {
  assert.match(
    definition.scripts[aggregate],
    /npm run test:secure-access(?:\s|$)/,
    `${aggregate} must execute test:secure-access.`
  );
}
for (const aggregate of ["test:integration", "check"]) {
  assert.match(
    definition.scripts[aggregate],
    /npm run test:secure-access-runtime(?:\s|$)/,
    `${aggregate} must execute test:secure-access-runtime.`
  );
}

console.log("Secure file signed access source/authority guard passed.");
