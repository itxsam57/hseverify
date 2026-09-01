import { PGlite } from "@electric-sql/pglite";
import { createCipheriv, createHmac, randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const dataDirectory = process.env.HSE_PGLITE_DATA_DIR;
const pepper = process.env.HSE_AUTH_PEPPER;
if (!dataDirectory || !pepper) throw new Error("HSE_PGLITE_DATA_DIR and HSE_AUTH_PEPPER are required.");

const PASSWORD = "IndependentAudit!Password2026";
const now = new Date().toISOString();
const roles = ["worker", "company", "assessor", "verifier", "admin", "root"];
function token24(value) { return value.replace(/[^A-Za-z0-9_-]/g, "x").padEnd(24, "x").slice(0, 24); }
function scrypt(value, salt, length, options) { return new Promise((resolve, reject) => nodeScrypt(value, salt, length, options, (error, key) => error ? reject(error) : resolve(key))); }
async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(`${password}\u0000${pepper}`, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return ["scrypt", 16384, 8, 1, salt.toString("base64url"), key.toString("base64url")].join("$");
}
function encryptionKey(secret) { return createHmac("sha256", secret).update("hse-auth-encryption-v1").digest(); }
function encryptSecret(plaintext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(pepper), iv);
  cipher.setAAD(Buffer.from("hse-auth-secret-v1"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(value) {
  let bits = 0, accumulator = 0, output = "";
  for (const byte of value) {
    accumulator = (accumulator << 8) | byte; bits += 8;
    while (bits >= 5) { output += BASE32[(accumulator >>> (bits - 5)) & 31]; bits -= 5; accumulator &= bits === 0 ? 0 : (1 << bits) - 1; }
  }
  if (bits > 0) output += BASE32[(accumulator << (5 - bits)) & 31];
  return output;
}

const database = await PGlite.create(dataDirectory);
const credentials = {};
try {
  for (const role of roles) {
    const accountId = `audit_${role}_account_20260901`;
    const email = `independent.audit.${role}@example.test`;
    const passwordHash = await hashPassword(PASSWORD);
    const workerReference = role === "worker" ? "HSE-REG-INDEPENDENTAUDIT" : null;
    await database.query(
      `INSERT INTO auth_accounts(account_id,email_normalized,display_name,account_status,password_hash,worker_reference,email_verified_at,password_set_at,created_at,updated_at)
       VALUES($1,$2,$3,'active',$4,$5,$6,$6,$6,$6)`,
      [accountId, email, `Independent Audit ${role}`, passwordHash, workerReference, now]
    );
    await database.query(`INSERT INTO auth_account_roles(account_id,role,created_at) VALUES($1,$2,$3)`, [accountId, role, now]);
    let totpSecret = null;
    if (role !== "worker") {
      totpSecret = base32Encode(randomBytes(20));
      await database.query(
        `INSERT INTO auth_mfa_factors(factor_id,account_id,factor_type,encrypted_secret,factor_status,last_accepted_counter,created_at,activated_at)
         VALUES($1,$2,'totp',$3,'active',NULL,$4,$4)`,
        [`audit_mfa_${role}_20260901`, accountId, encryptSecret(totpSecret), now]
      );
    }
    credentials[role] = { accountId, email, password: PASSWORD, totpSecret };
  }

  const tenantId = `tenant_${token24("independent-audit-company")}`;
  const membershipId = `membership_${token24("independent-audit-owner")}`;
  const company = credentials.company;
  await database.query(
    `INSERT INTO platform_tenants(tenant_id,tenant_type,display_name,tenant_status,created_by_account_id,created_at,updated_at,activated_at)
     VALUES($1,'company','Independent Audit Company','active',$2,$3,$3,$3)`,
    [tenantId, company.accountId, now]
  );
  await database.query(
    `INSERT INTO auth_tenant_memberships(membership_id,tenant_id,account_id,portal_role,membership_role,membership_status,created_by_account_id,created_at,updated_at,activated_at)
     VALUES($1,$2,$3,'company','owner','active',$3,$4,$4,$4)`,
    [membershipId, tenantId, company.accountId, now]
  );
  credentials.company.tenantId = tenantId;
  credentials.company.membershipId = membershipId;

  const proof = await database.query(`SELECT a.email_normalized,r.role,a.account_status FROM auth_accounts a JOIN auth_account_roles r ON r.account_id=a.account_id WHERE a.account_id LIKE 'audit_%_account_20260901' ORDER BY r.role`);
  if (proof.rows.length !== roles.length) throw new Error(`Expected ${roles.length} audit role accounts, found ${proof.rows.length}.`);
  await writeFile("/tmp/independent-audit-credentials.json", JSON.stringify(credentials, null, 2));
  await mkdir("artifacts/independent-audit", { recursive: true });
  await writeFile("artifacts/independent-audit/seed.json", JSON.stringify({ seededAt: now, roles: proof.rows, companyTenant: tenantId }, null, 2));
  console.log(`Seeded ${proof.rows.length} independent role accounts.`);
} finally {
  await database.close();
}
