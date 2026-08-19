import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = process.env.HSE_BROWSER_BASE_URL || "http://127.0.0.1:3000";
const SANDBOX_KEY = process.env.HSE_AUTH_SANDBOX_ACCESS_KEY;
const PASSWORD = "CompanyRetrospectiveQA!2026";
const STAFF_PASSWORD = "CompanyAdminRetrospectiveQA!2026";
const COMPANY_EMAIL = "company.retrospective.qa@example.test";
const COMPANY_PHONE = "+923001114455";
const COMPANY_LEGAL_NAME = "Retrospective Industrial Services Limited";
const COMPANY_TRADING_NAME = "Retrospective Verify Operations";
const artifactsDir = "artifacts/hard-browser-retrospective-company";
const results = [];
const PDF_FIXTURE = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n",
  "utf8"
);

if (!SANDBOX_KEY) throw new Error("HSE_AUTH_SANDBOX_ACCESS_KEY is required.");
await mkdir(artifactsDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = value.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = "";
  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error(`Invalid base32 character: ${char}`);
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function totp(secret, offsetSteps = 0) {
  const counter = Math.floor(Date.now() / 1000 / 30) + offsetSteps;
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, "0");
}

async function checkpoint(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    results.push({ name, status: "PASS", ms: Date.now() - started, detail: detail ?? null });
    console.log(`PASS ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, status: "FAIL", ms: Date.now() - started, error: message });
    console.error(`FAIL ${name}: ${message}`);
    throw error;
  }
}

function trackErrors(page, label) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${label} console: ${message.text()}`);
  });
  return errors;
}

async function gotoOk(page, path, expectedText) {
  const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
  assert(response, `${path} returned no response`);
  assert(response.status() < 500, `${path} returned HTTP ${response.status()}`);
  if (expectedText) {
    await page.getByText(expectedText, { exact: false }).first().waitFor({ state: "visible", timeout: 15_000 });
  }
  return response;
}

async function latestCompanyEmailCode(page) {
  await gotoOk(page, "/company/register/sandbox", "Company verification code");
  await page.getByLabel("Business email").fill(COMPANY_EMAIL);
  await page.getByLabel("Sandbox access key").fill(SANDBOX_KEY);
  await page.getByRole("button", { name: "Open latest email code" }).click();
  const result = page.getByRole("status", { name: "Latest Company registration code" });
  await result.waitFor({ state: "visible", timeout: 15_000 });
  const code = (await result.locator("strong").innerText()).trim();
  assert(/^\d{6}$/.test(code), "Company email OTP was not six digits");
  return code;
}

async function enrollStaff(browser, invitationPath, { role, email, displayName }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = trackErrors(page, `${role}-enrollment`);
  const response = await page.goto(`${BASE_URL}${invitationPath}`, { waitUntil: "domcontentloaded" });
  assert(response && response.status() < 500, `${role} invitation could not be opened`);
  await page.waitForURL(/\/staff\/invite\/accept(?:\?|$)/, { timeout: 15_000 });
  await page.getByText("Create account credentials", { exact: false }).waitFor({ timeout: 15_000 });
  await page.getByLabel("Full name").fill(displayName);
  await page.getByLabel("Create password").fill(STAFF_PASSWORD);
  await page.getByLabel("Confirm password").fill(STAFF_PASSWORD);
  await page.getByRole("button", { name: "Continue to authenticator setup" }).click();
  await page.getByText("Add HSE Verify to an authenticator app", { exact: false }).waitFor({ timeout: 15_000 });
  const secret = (await page.locator(".security-key-card strong").innerText()).trim();
  assert(secret.length >= 16, `${role} authenticator secret was not shown`);
  await page.getByLabel("Authenticator code").fill(totp(secret));
  await page.getByRole("button", { name: "Activate MFA and finish enrollment" }).click();
  await page.getByText("Enrollment complete", { exact: false }).waitFor({ timeout: 15_000 });
  assert(errors.length === 0, `${role} enrollment browser errors: ${errors.join(" | ")}`);
  await context.close();
  return { role, email, secret };
}

async function loginStaff(browser, identity) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = trackErrors(page, `${identity.role}-login`);
  await gotoOk(page, `/${identity.role}/login`, "sign in");
  await page.getByLabel("Email address").fill(identity.email);
  await page.getByLabel("Password").fill(STAFF_PASSWORD);
  await page.getByLabel("Authenticator code").fill(totp(identity.secret, 1));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(
    (url) => url.pathname.startsWith(`/${identity.role}/`) && url.pathname !== `/${identity.role}/login`,
    { timeout: 15_000 }
  );
  assert(errors.length === 0, `${identity.role} login browser errors: ${errors.join(" | ")}`);
  return { context, page, errors };
}

async function bootstrapAdministrator(browser) {
  const bootstrapContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const bootstrapPage = await bootstrapContext.newPage();
  await gotoOk(bootstrapPage, "/auth/sandbox/bootstrap-root", "Create the one-time invitation");
  await bootstrapPage.getByLabel("First root email").fill("root.company.retrospective.qa@example.test");
  await bootstrapPage.getByLabel("Authentication sandbox access key").fill(SANDBOX_KEY);
  await bootstrapPage.getByRole("button", { name: "Create first root invitation" }).click();
  const rootInvitationPath = (await bootstrapPage.locator(".security-key-card strong").innerText()).trim();
  assert(rootInvitationPath.startsWith("/staff/invite/"), "Root bootstrap did not return an invitation path");
  await bootstrapContext.close();

  const root = await enrollStaff(browser, rootInvitationPath, {
    role: "root",
    email: "root.company.retrospective.qa@example.test",
    displayName: "Company Retrospective Root"
  });
  const rootSession = await loginStaff(browser, root);
  await gotoOk(rootSession.page, "/root/staff", "Create invitation");
  await rootSession.page.getByLabel("Staff email").fill("admin.company.retrospective.qa@example.test");
  await rootSession.page.getByLabel("Portal role").selectOption("admin");
  await rootSession.page.getByRole("button", { name: "Create one-time invitation" }).click();
  const adminInvitationPath = (await rootSession.page.locator(".security-key-card strong").innerText()).trim();
  assert(adminInvitationPath.startsWith("/staff/invite/"), "Root did not create an Administrator invitation");
  await rootSession.context.close();

  const admin = await enrollStaff(browser, adminInvitationPath, {
    role: "admin",
    email: "admin.company.retrospective.qa@example.test",
    displayName: "Company Retrospective Admin"
  });
  return loginStaff(browser, admin);
}

async function createCompanyUnit(page, input) {
  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: "Create unit" })
  }).first();
  await form.getByLabel("Unit type").selectOption(input.kind);
  await form.getByLabel("Name").fill(input.name);
  await form.getByLabel("Formatted address").fill(input.address);
  await form.getByLabel("Phone").fill(input.phone);
  await form.getByLabel("Website").fill(input.website);
  await form.getByLabel("Email").fill(input.email);
  if (input.registrationNumber) {
    await form.getByLabel("Registration number (optional)").fill(input.registrationNumber);
  }
  await form.getByRole("button", { name: "Create unit" }).click();
  await page.getByRole("heading", { name: input.name, exact: true }).waitFor({ timeout: 15_000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = trackErrors(page, "company-registration-verification");

try {
  await checkpoint("Company registration and verification workflow", async () => {
    await gotoOk(page, "/company/register", "Create a verified Company workspace.");
    await page.getByLabel("Legal Company name").fill(COMPANY_LEGAL_NAME);
    await page.getByLabel("Trading name").fill("Retrospective Industrial Services");
    await page.getByLabel("Registration number").fill("RETRO-COMPANY-2026-001");
    await page.getByLabel("Registration country").fill("Pakistan");
    await page.getByLabel("Industry").fill("Industrial construction and safety services");
    await page.getByLabel("Company size").selectOption("11-50");
    await page.getByLabel("Company website").fill("https://retrospective-industrial.example.test");
    await page.getByLabel("Authorized representative").fill("Retrospective Company QA");
    await page.getByLabel("Business email").fill(COMPANY_EMAIL);
    await page.getByLabel("Business phone").fill(COMPANY_PHONE);
    await page.getByLabel("Create password").fill(PASSWORD);
    await page.getByLabel("Confirm password").fill(PASSWORD);
    await page.getByLabel("I accept the HSE Verify terms for this Company application.").check();
    await page.getByLabel("I accept the privacy notice for Company verification data and evidence.").check();
    await page.getByRole("button", { name: "Create Company application" }).click();
    await page.waitForURL(/\/company\/register\/verify/, { timeout: 15_000 });
    await page.getByText("Step 1 of 2", { exact: true }).waitFor({ state: "visible", timeout: 15_000 });

    const emailCode = await latestCompanyEmailCode(page);
    await gotoOk(page, "/company/register/verify", "Step 1 of 2");
    await page.getByLabel("Email verification code").fill(emailCode);
    await page.getByRole("button", { name: "Verify business email" }).click();
    await page.getByText("Step 2 of 2", { exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    const setupKey = (await page.locator("code").innerText()).trim();
    assert(setupKey.length >= 16, "Company authenticator setup key was not exposed after email verification");
    await page.getByLabel("Authenticator code").fill(totp(setupKey));
    await page.getByRole("button", { name: "Activate Company account" }).click();
    await page.waitForURL(/\/company\/login\?reason=registration-complete/, { timeout: 15_000 });

    await page.getByLabel("Email address").fill(COMPANY_EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByLabel("Authenticator code").fill(totp(setupKey, 1));
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => url.pathname.startsWith("/company/") && url.pathname !== "/company/login", { timeout: 15_000 });

    await gotoOk(page, "/company/dashboard", "Company Portal");
    const dashboardText = await page.locator("main").innerText();
    assert(
      !dashboardText.includes("remain blocked until their canonical bricks"),
      "Company dashboard still tells users completed Company features are waiting for later canonical bricks"
    );
    assert(
      dashboardText.includes("Company verification"),
      "Company dashboard does not explain that verification state controls access to workforce operations"
    );
    await page.getByRole("link", { name: "Open tenant-scope demonstration" }).waitFor({ timeout: 15_000 });

    await gotoOk(page, "/company/settings/profile", "Company profile and verification");
    await page.getByRole("heading", { name: "Draft", exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    await page.getByLabel("Trading name").fill(COMPANY_TRADING_NAME);
    await page.getByRole("button", { name: "Save Company details" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    assert(
      (await page.getByLabel("Trading name").inputValue()) === COMPANY_TRADING_NAME,
      "Company verification draft details did not persist after reload"
    );

    await page.getByLabel("Upload evidence").setInputFiles({
      name: "retrospective-company-registration.pdf",
      mimeType: "application/pdf",
      buffer: PDF_FIXTURE
    });
    await page.getByRole("button", { name: "Upload evidence" }).click();
    await page.getByText("Evidence attached to Company verification version", { exact: false }).waitFor({ state: "visible", timeout: 15_000 });

    await page.getByRole("button", { name: "Submit Company verification" }).click();
    await page.getByRole("heading", { name: "Submitted", exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    await page.getByText("Tenant-scoped workforce operations remain disabled", { exact: false }).waitFor({ state: "visible", timeout: 15_000 });
    assert(!(await page.getByRole("button", { name: "Save Company details" }).count()), "Submitted Company verification remained editable");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Submitted", exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    await page.getByText("Evidence attached to Company verification version", { exact: false }).waitFor({ state: "visible", timeout: 15_000 });
    await page.screenshot({
      path: `${artifactsDir}/company-registration-verification-submitted.png`,
      fullPage: true,
      caret: "initial"
    });

    assert(errors.length === 0, `Company registration/verification browser errors: ${errors.join(" | ")}`);
    return {
      status: "submitted",
      evidence: "retrospective-company-registration.pdf",
      mfa: "activated-and-reused-for-login-with-next-counter"
    };
  });

  await checkpoint("Company verification Admin review activates the tenant through visible workflow", async () => {
    const adminSession = await bootstrapAdministrator(browser);
    const adminPage = adminSession.page;
    await gotoOk(adminPage, "/admin/company-verifications", "Company verification review");
    let card = adminPage.locator("article[data-case-id]").filter({ hasText: COMPANY_LEGAL_NAME }).first();
    await card.waitFor({ state: "visible", timeout: 15_000 });
    await card.getByText("submitted", { exact: true }).waitFor({ timeout: 15_000 });

    const previewHref = await card.getByRole("link", { name: "Preview evidence" }).getAttribute("href");
    assert(previewHref?.startsWith("/admin/company-verifications/"), "Admin evidence preview URL was not case-bound");
    const previewPage = await adminSession.context.newPage();
    const previewResponse = await previewPage.goto(`${BASE_URL}${previewHref}`, { waitUntil: "domcontentloaded" });
    assert(previewResponse?.status() === 200, `Company evidence preview returned ${previewResponse?.status()}`);
    assert(
      (previewResponse?.headers()["content-type"] ?? "").includes("application/pdf"),
      "Company evidence preview did not preserve validated PDF content type"
    );
    await previewPage.close();

    await card.getByRole("button", { name: "Begin review" }).click();
    await adminPage.waitForURL(/result=review-started/, { timeout: 15_000 });
    card = adminPage.locator("article[data-case-id]").filter({ hasText: COMPANY_LEGAL_NAME }).first();
    await card.getByText("under_review", { exact: true }).waitFor({ timeout: 15_000 });
    await card.getByRole("button", { name: "Verify Company" }).click();
    await adminPage.waitForURL(/result=decision-recorded/, { timeout: 15_000 });
    await adminPage.getByText("No submitted or in-review Company verification cases are waiting.", { exact: false }).waitFor({ timeout: 15_000 });
    await adminPage.screenshot({ path: `${artifactsDir}/admin-company-verification-decided.png`, fullPage: true });
    assert(adminSession.errors.length === 0, `Administrator review browser errors: ${adminSession.errors.join(" | ")}`);
    await adminSession.context.close();

    await gotoOk(page, "/company/settings/profile", "Company profile and verification");
    await page.getByRole("heading", { name: "Verified", exact: true }).waitFor({ timeout: 15_000 });
    await page.getByText("Company verification is accepted and the tenant is active.", { exact: false }).waitFor({ timeout: 15_000 });
    await gotoOk(page, "/company/organization", "Sites and Departments");
    return { status: "verified", tenant: "active", evidencePreview: "200 application/pdf" };
  });

  await checkpoint("Company sites departments and team workflow", async () => {
    const siteName = "Retrospective Riyadh Site";
    const departmentName = "Retrospective Safety Department";
    await gotoOk(page, "/company/organization", "Sites and Departments");
    await createCompanyUnit(page, {
      kind: "site",
      name: siteName,
      address: "Riyadh Industrial Area, Saudi Arabia",
      phone: "+966501234567",
      website: "https://riyadh-site.example.test",
      email: "riyadh.site@example.test",
      registrationNumber: "SITE-RETRO-001"
    });
    await createCompanyUnit(page, {
      kind: "department",
      name: departmentName,
      address: "Riyadh Industrial Area, Saudi Arabia",
      phone: "+966501234568",
      website: "https://safety-department.example.test",
      email: "safety.department@example.test",
      registrationNumber: null
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: siteName, exact: true }).waitFor();
    await page.getByRole("heading", { name: departmentName, exact: true }).waitFor();

    let siteCard = page.locator("article").filter({ hasText: siteName }).first();
    await siteCard.getByRole("button", { name: "Archive site" }).click();
    const archiveDialog = page.getByRole("dialog");
    await archiveDialog.getByRole("button", { name: "Archive site" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    siteCard = page.locator("article").filter({ hasText: siteName }).first();
    await siteCard.getByText("archived", { exact: true }).waitFor({ timeout: 15_000 });
    await siteCard.getByRole("button", { name: "Restore site" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    siteCard = page.locator("article").filter({ hasText: siteName }).first();
    await siteCard.getByText("active", { exact: true }).waitFor({ timeout: 15_000 });

    await gotoOk(page, "/company/team", "Company Team");
    const inviteForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Create Company Team invitation" })
    }).first();
    await inviteForm.getByLabel("Staff email").fill("company.team.retrospective.qa@example.test");
    await inviteForm.getByLabel("Company Team role").selectOption("viewer");
    await inviteForm.getByLabel("Site scope (optional)").selectOption({ label: siteName });
    await inviteForm.getByLabel("Department scope (optional)").selectOption({ label: departmentName });
    await inviteForm.getByRole("button", { name: "Create Company Team invitation" }).click();
    const invitationPathNode = page.locator("p").filter({ hasText: "Local test invitation path:" }).locator("strong");
    await invitationPathNode.waitFor({ state: "visible", timeout: 15_000 });
    const teamInvitationPath = (await invitationPathNode.innerText()).trim();
    assert(teamInvitationPath.startsWith("/staff/invite/"), "Company Team invitation did not expose the local test path");

    await enrollStaff(browser, teamInvitationPath, {
      role: "company",
      email: "company.team.retrospective.qa@example.test",
      displayName: "Company Team Retrospective QA"
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    let memberCard = page.locator("article").filter({ hasText: "Company Team Retrospective QA" }).first();
    await memberCard.waitFor({ state: "visible", timeout: 15_000 });
    await memberCard.getByText("active", { exact: true }).waitFor({ timeout: 15_000 });
    await memberCard.getByRole("button", { name: "Suspend" }).click();
    const suspendDialog = page.getByRole("dialog");
    await suspendDialog.getByRole("button", { name: "Suspend access" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    memberCard = page.locator("article").filter({ hasText: "Company Team Retrospective QA" }).first();
    await memberCard.getByText("suspended", { exact: true }).waitFor({ timeout: 15_000 });
    await memberCard.getByRole("button", { name: "Reactivate" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    memberCard = page.locator("article").filter({ hasText: "Company Team Retrospective QA" }).first();
    await memberCard.getByText("active", { exact: true }).waitFor({ timeout: 15_000 });
    await page.screenshot({ path: `${artifactsDir}/company-organization-team.png`, fullPage: true });

    assert(errors.length === 0, `Company organization/team browser errors: ${errors.join(" | ")}`);
    return {
      site: "create-archive-restore",
      department: "created-persisted",
      team: "invite-enroll-suspend-reactivate"
    };
  });
} catch (error) {
  try {
    await page.screenshot({ path: `${artifactsDir}/failure.png`, fullPage: true, caret: "initial" });
  } catch {
    // Preserve original error.
  }
  throw error;
} finally {
  await writeFile(`${artifactsDir}/results.json`, JSON.stringify(results, null, 2), "utf8");
  await context.close().catch(() => {});
  await browser.close();
}

if (results.some((result) => result.status !== "PASS")) process.exit(1);
