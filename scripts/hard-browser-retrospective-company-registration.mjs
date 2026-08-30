import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = process.env.HSE_BROWSER_BASE_URL || "http://127.0.0.1:3000";
const SANDBOX_KEY = process.env.HSE_AUTH_SANDBOX_ACCESS_KEY;
const COMPANY_PASSWORD = "CompanyRetrospectiveQA!2026";
const STAFF_PASSWORD = "CompanyAdminRetrospectiveQA!2026";
const WORKER_PASSWORD = "RetrospectiveQA!StrongPassword2026";
const CODE_WORKER_PASSWORD = "CompanyCodeWorkerQA!2026";
const COMPANY_EMAIL = "company.retrospective.qa@example.test";
const COMPANY_PHONE = "+923001114455";
const COMPANY_LEGAL_NAME = "Retrospective Industrial Services Limited";
const COMPANY_TRADING_NAME = "Retrospective Verify Operations";
const EXISTING_WORKER_EMAIL = "worker.retrospective.qa@example.test";
const CODE_WORKER_EMAIL = "worker.company.code.retrospective@example.test";
const CODE_WORKER_PHONE = "+923001119977";
const SITE_NAME = "Retrospective Riyadh Site";
const DEPARTMENT_NAME = "Retrospective Safety Department";
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

async function latestWorkerCode(page, channel, destination) {
  await gotoOk(page, "/worker/register/sandbox", "Sandbox inbox");
  await page.getByLabel("Delivery channel").selectOption(channel);
  await page.getByLabel("Delivery destination").fill(destination);
  await page.getByLabel("Sandbox access key").fill(SANDBOX_KEY);
  await page.getByRole("button", { name: "Open latest sandbox delivery" }).click();
  const result = page.getByRole("status", { name: "Latest sandbox verification code" });
  await result.waitFor({ state: "visible", timeout: 15_000 });
  const code = (await result.locator("strong").innerText()).trim();
  assert(/^\d{6}$/.test(code), `Worker ${channel} OTP was not six digits`);
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
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Create unit" }) }).first();
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

async function loginWorker(page, email, password) {
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = trackErrors(page, "company-retrospective");

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
    await page.getByLabel("Create password").fill(COMPANY_PASSWORD);
    await page.getByLabel("Confirm password").fill(COMPANY_PASSWORD);
    await page.getByLabel("I accept the HSE Verify terms for this Company application.").check();
    await page.getByLabel("I accept the privacy notice for Company verification data and evidence.").check();
    await page.getByRole("button", { name: "Create Company application" }).click();
    await page.waitForURL(/\/company\/register\/verify/, { timeout: 15_000 });
    await page.getByText("Step 1 of 2", { exact: true }).waitFor({ timeout: 15_000 });

    const emailCode = await latestCompanyEmailCode(page);
    await gotoOk(page, "/company/register/verify", "Step 1 of 2");
    await page.getByLabel("Email verification code").fill(emailCode);
    await page.getByRole("button", { name: "Verify business email" }).click();
    await page.getByText("Step 2 of 2", { exact: true }).waitFor({ timeout: 15_000 });
    const setupKey = (await page.locator("code").innerText()).trim();
    assert(setupKey.length >= 16, "Company authenticator setup key was not exposed");
    await page.getByLabel("Authenticator code").fill(totp(setupKey));
    await page.getByRole("button", { name: "Activate Company account" }).click();
    await page.waitForURL(/\/company\/login\?reason=registration-complete/, { timeout: 15_000 });

    await page.getByLabel("Email address").fill(COMPANY_EMAIL);
    await page.getByLabel("Password").fill(COMPANY_PASSWORD);
    await page.getByLabel("Authenticator code").fill(totp(setupKey, 1));
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(
      (url) => url.pathname.startsWith("/company/") && url.pathname !== "/company/login",
      { timeout: 15_000 }
    );

    await gotoOk(page, "/company/dashboard", "Company Portal");
    const dashboardText = await page.locator("main").innerText();
    assert(!dashboardText.includes("remain blocked until their canonical bricks"), "Company dashboard still contains obsolete blocked-feature copy");
    assert(dashboardText.includes("Company verification"), "Company dashboard does not explain verification gating");
    await page.getByRole("link", { name: "Open tenant-scope demonstration" }).waitFor({ timeout: 15_000 });

    await gotoOk(page, "/company/settings/profile", "Company profile and verification");
    await page.getByRole("heading", { name: "Draft", exact: true }).waitFor({ timeout: 15_000 });
    await page.getByLabel("Trading name").fill(COMPANY_TRADING_NAME);
    await page.getByRole("button", { name: "Save Company details" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    assert((await page.getByLabel("Trading name").inputValue()) === COMPANY_TRADING_NAME, "Company draft did not persist");

    await page.getByLabel("Choose evidence file").setInputFiles({
      name: "retrospective-company-registration.pdf",
      mimeType: "application/pdf",
      buffer: PDF_FIXTURE
    });
    await page.getByRole("button", { name: "Upload evidence" }).click();
    await page.getByText("Company evidence uploaded, security-scanned and attached to this verification version.", { exact: true }).waitFor({ timeout: 15_000 });

    await page.getByRole("button", { name: "Submit Company verification" }).click();
    await page.getByRole("heading", { name: "Submitted", exact: true }).waitFor({ timeout: 15_000 });
    assert(!(await page.getByRole("button", { name: "Save Company details" }).count()), "Submitted verification remained editable");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Submitted", exact: true }).waitFor({ timeout: 15_000 });
    await page.screenshot({ path: `${artifactsDir}/company-submitted.png`, fullPage: true });
    return { status: "submitted", evidence: "pdf" };
  });

  await checkpoint("Company verification Admin review activates the tenant through visible workflow", async () => {
    const adminSession = await bootstrapAdministrator(browser);
    const adminPage = adminSession.page;
    await gotoOk(adminPage, "/admin/company-verifications", "Company verification review");
    let card = adminPage.locator("article[data-case-id]").filter({ hasText: COMPANY_LEGAL_NAME }).first();
    await card.waitFor({ state: "visible", timeout: 15_000 });
    const previewHref = await card.getByRole("link", { name: "Preview evidence" }).getAttribute("href");
    assert(previewHref?.startsWith("/admin/company-verifications/"), "Admin evidence preview was not case-bound");
    const previewPage = await adminSession.context.newPage();
    const previewResponse = await previewPage.goto(`${BASE_URL}${previewHref}`, { waitUntil: "domcontentloaded" });
    assert(previewResponse?.status() === 200, `Company evidence preview returned ${previewResponse?.status()}`);
    assert((previewResponse?.headers()["content-type"] ?? "").includes("application/pdf"), "Company evidence preview MIME was wrong");
    await previewPage.close();

    await card.getByRole("button", { name: "Begin review" }).click();
    await adminPage.waitForURL(/result=review-started/, { timeout: 15_000 });
    card = adminPage.locator("article[data-case-id]").filter({ hasText: COMPANY_LEGAL_NAME }).first();
    await card.getByText("under_review", { exact: true }).waitFor({ timeout: 15_000 });
    await card.getByRole("button", { name: "Verify Company" }).click();
    await adminPage.waitForURL(/result=decision-recorded/, { timeout: 15_000 });
    await adminPage.getByText("No submitted or in-review Company verification cases are waiting.", { exact: false }).waitFor({ timeout: 15_000 });
    assert(adminSession.errors.length === 0, `Admin review browser errors: ${adminSession.errors.join(" | ")}`);
    await adminSession.context.close();

    await gotoOk(page, "/company/settings/profile", "Company profile and verification");
    await page.getByRole("heading", { name: "Verified", exact: true }).waitFor({ timeout: 15_000 });
    await page.getByText("Company verification is accepted and the tenant is active.", { exact: false }).waitFor({ timeout: 15_000 });
    return { status: "verified", tenant: "active", evidencePreview: "200 application/pdf" };
  });

  await checkpoint("Company sites departments and team workflow", async () => {
    await gotoOk(page, "/company/organization", "Sites and Departments");
    await createCompanyUnit(page, {
      kind: "site",
      name: SITE_NAME,
      address: "Riyadh Industrial Area, Saudi Arabia",
      phone: "+966501234567",
      website: "https://riyadh-site.example.test",
      email: "riyadh.site@example.test",
      registrationNumber: "SITE-RETRO-001"
    });
    await createCompanyUnit(page, {
      kind: "department",
      name: DEPARTMENT_NAME,
      address: "Riyadh Industrial Area, Saudi Arabia",
      phone: "+966501234568",
      website: "https://safety-department.example.test",
      email: "safety.department@example.test",
      registrationNumber: null
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: SITE_NAME, exact: true }).waitFor();
    await page.getByRole("heading", { name: DEPARTMENT_NAME, exact: true }).waitFor();

    let siteCard = page.locator("article").filter({ hasText: SITE_NAME }).first();
    await siteCard.getByRole("button", { name: "Archive site" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Archive site" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    siteCard = page.locator("article").filter({ hasText: SITE_NAME }).first();
    await siteCard.getByText("archived", { exact: true }).waitFor({ timeout: 15_000 });
    await siteCard.getByRole("button", { name: "Restore site" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    siteCard = page.locator("article").filter({ hasText: SITE_NAME }).first();
    await siteCard.getByText("active", { exact: true }).waitFor({ timeout: 15_000 });

    await gotoOk(page, "/company/team", "Company Team");
    const inviteForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create Company Team invitation" }) }).first();
    await inviteForm.getByLabel("Staff email").fill("company.team.retrospective.qa@example.test");
    await inviteForm.getByLabel("Company Team role").selectOption("viewer");
    await inviteForm.getByLabel("Site scope (optional)").selectOption({ label: SITE_NAME });
    await inviteForm.getByLabel("Department scope (optional)").selectOption({ label: DEPARTMENT_NAME });
    await inviteForm.getByRole("button", { name: "Create Company Team invitation" }).click();
    const invitationPathNode = page.locator("p").filter({ hasText: "Local test invitation path:" }).locator("strong");
    await invitationPathNode.waitFor({ timeout: 15_000 });
    const teamInvitationPath = (await invitationPathNode.innerText()).trim();
    assert(teamInvitationPath.startsWith("/staff/invite/"), "Company Team invitation path missing");

    await enrollStaff(browser, teamInvitationPath, {
      role: "company",
      email: "company.team.retrospective.qa@example.test",
      displayName: "Company Team Retrospective QA"
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    let memberCard = page.locator("article").filter({ hasText: "Company Team Retrospective QA" }).first();
    await memberCard.waitFor({ timeout: 15_000 });
    await memberCard.getByText("active", { exact: true }).waitFor({ timeout: 15_000 });
    await memberCard.getByRole("button", { name: "Suspend" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Suspend access" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    memberCard = page.locator("article").filter({ hasText: "Company Team Retrospective QA" }).first();
    await memberCard.getByText("suspended", { exact: true }).waitFor({ timeout: 15_000 });
    await memberCard.getByRole("button", { name: "Reactivate" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    memberCard = page.locator("article").filter({ hasText: "Company Team Retrospective QA" }).first();
    await memberCard.getByText("active", { exact: true }).waitFor({ timeout: 15_000 });
    await page.screenshot({ path: `${artifactsDir}/company-organization-team.png`, fullPage: true });
    return { site: "create-archive-restore", department: "created", team: "invite-enroll-suspend-reactivate" };
  });

  await checkpoint("Company Worker invitation and company-code linking workflow", async () => {
    await gotoOk(page, "/company/invitations", "Worker invitations");

    const singleForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create Worker invitation" }) }).first();
    await singleForm.getByLabel("Worker email").fill(EXISTING_WORKER_EMAIL);
    await singleForm.getByLabel("Site default").selectOption({ label: SITE_NAME });
    await singleForm.getByLabel("Department default").selectOption({ label: DEPARTMENT_NAME });
    await singleForm.getByLabel("Future assessment payment default").selectOption("company");
    await singleForm.getByLabel("Future assessment reference").fill("RETRO-EMAIL-INVITE-001");
    await singleForm.getByRole("button", { name: "Create Worker invitation" }).click();
    const invitationLink = page.locator('a[href^="/worker/company-invitations/"]').last();
    await invitationLink.waitFor({ timeout: 15_000 });
    const invitationPath = await invitationLink.getAttribute("href");
    assert(invitationPath?.startsWith("/worker/company-invitations/"), "Worker invitation link missing");

    const workerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const workerPage = await workerContext.newPage();
    const workerErrors = trackErrors(workerPage, "existing-worker-company-link");
    await gotoOk(workerPage, invitationPath, "Worker invitation ready");
    await workerPage.getByRole("button", { name: "Worker sign-in" }).click();
    await workerPage.waitForURL(/\/worker\/login/, { timeout: 15_000 });
    await loginWorker(workerPage, EXISTING_WORKER_EMAIL, WORKER_PASSWORD);
    await workerPage.waitForURL(/\/worker\/company-access\/complete-invitation/, { timeout: 15_000 });
    await workerPage.getByRole("button", { name: "Finish Company link" }).click();
    await workerPage.waitForURL(/\/worker\/company-access\?status=linked/, { timeout: 15_000 });
    await workerPage.getByText("Company access was linked successfully.", { exact: false }).waitFor({ timeout: 15_000 });
    assert(workerErrors.length === 0, `Existing Worker link browser errors: ${workerErrors.join(" | ")}`);
    await workerContext.close();

    await gotoOk(page, "/company/invitations", "Worker links");
    const existingLinkCard = page.locator("article").filter({ hasText: EXISTING_WORKER_EMAIL }).filter({ hasText: "email invitation" }).first();
    await existingLinkCard.waitFor({ timeout: 15_000 });
    await existingLinkCard.getByText("active", { exact: true }).waitFor({ timeout: 15_000 });
    assert((await existingLinkCard.innerText()).includes(SITE_NAME), "Existing Worker link lost Site default");
    assert((await existingLinkCard.innerText()).includes(DEPARTMENT_NAME), "Existing Worker link lost Department default");

    const codeForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create Company registration code" }) }).first();
    await codeForm.getByLabel("Usage limit").fill("1");
    await codeForm.getByLabel("Expiry").fill(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    await codeForm.getByLabel("Site default").selectOption({ label: SITE_NAME });
    await codeForm.getByLabel("Department default").selectOption({ label: DEPARTMENT_NAME });
    await codeForm.getByLabel("Future assessment payment default").selectOption("company");
    await codeForm.getByLabel("Future assessment reference").fill("RETRO-COMPANY-CODE-001");
    await codeForm.getByRole("button", { name: "Create Company registration code" }).click();
    const codePanel = page.locator(".panel.page-section").filter({ hasText: "Copy this code now" }).first();
    await codePanel.waitFor({ timeout: 15_000 });
    const registrationCode = (await codePanel.locator("strong").innerText()).trim();
    assert(registrationCode.length >= 8, "Company registration code was not shown");

    const codeContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const codePage = await codeContext.newPage();
    const codeErrors = trackErrors(codePage, "company-code-worker-link");
    await gotoOk(codePage, "/worker/register", "Create your Worker account");
    await codePage.getByLabel("Full name").fill("Company Code Retrospective Worker");
    await codePage.getByLabel("Email address").fill(CODE_WORKER_EMAIL);
    await codePage.getByLabel("Mobile phone").fill(CODE_WORKER_PHONE);
    await codePage.getByLabel("Create password").fill(CODE_WORKER_PASSWORD);
    await codePage.getByLabel("Confirm password").fill(CODE_WORKER_PASSWORD);
    await codePage.getByLabel("Company registration code").fill(registrationCode);
    await codePage.getByRole("button", { name: "Create Worker account" }).click();
    await codePage.waitForURL(/\/worker\/register\/verify/, { timeout: 15_000 });

    const codeEmailOtp = await latestWorkerCode(codePage, "email", CODE_WORKER_EMAIL);
    await gotoOk(codePage, "/worker/register/verify", "Step 1 of 2");
    await codePage.getByLabel("Verification code").fill(codeEmailOtp);
    await codePage.getByRole("button", { name: "Verify email" }).click();
    await codePage.getByText("Step 2 of 2", { exact: false }).waitFor({ timeout: 15_000 });

    const codePhoneOtp = await latestWorkerCode(codePage, "phone", CODE_WORKER_PHONE);
    await gotoOk(codePage, "/worker/register/verify", "Step 2 of 2");
    await codePage.getByLabel("Verification code").fill(codePhoneOtp);
    await codePage.getByRole("button", { name: "Verify phone" }).click();
    await codePage.getByText("Activation complete", { exact: false }).waitFor({ timeout: 15_000 });
    await codePage.getByRole("link", { name: "Worker sign-in and finish Company link" }).click();
    await codePage.waitForURL(/\/worker\/login/, { timeout: 15_000 });
    await loginWorker(codePage, CODE_WORKER_EMAIL, CODE_WORKER_PASSWORD);
    await codePage.waitForURL(/\/worker\/company-access\/complete-registration/, { timeout: 15_000 });
    await codePage.getByRole("button", { name: "Finish Company link" }).click();
    await codePage.waitForURL(/\/worker\/company-access\?status=linked/, { timeout: 15_000 });
    await codePage.getByText("Company access was linked successfully.", { exact: false }).waitFor({ timeout: 15_000 });
    assert(codeErrors.length === 0, `Company-code Worker link browser errors: ${codeErrors.join(" | ")}`);
    await codeContext.close();

    await gotoOk(page, "/company/invitations", "Company registration codes");
    const codeCard = page.locator("article").filter({ hasText: "RETRO-COMPANY-CODE-001" }).first();
    await codeCard.waitFor({ timeout: 15_000 });
    assert((await codeCard.innerText()).includes("1 of 1 uses consumed"), "Company code usage did not persist");
    const codeWorkerLink = page.locator("article").filter({ hasText: CODE_WORKER_EMAIL }).filter({ hasText: "registration code" }).first();
    await codeWorkerLink.waitFor({ timeout: 15_000 });
    await codeWorkerLink.getByText("active", { exact: true }).waitFor({ timeout: 15_000 });
    assert((await codeWorkerLink.innerText()).includes(SITE_NAME), "Company-code link lost Site default");
    assert((await codeWorkerLink.innerText()).includes(DEPARTMENT_NAME), "Company-code link lost Department default");

    await page.screenshot({ path: `${artifactsDir}/company-worker-linking.png`, fullPage: true });
    return { emailInvitation: "active", registrationCode: "consumed-and-active", defaults: "site-department-company-pays" };
  });

  assert(errors.length === 0, `Company retrospective browser errors: ${errors.join(" | ")}`);
} catch (error) {
  try {
    await page.screenshot({ path: `${artifactsDir}/failure.png`, fullPage: true });
  } catch {
    // Preserve the original failure.
  }
  throw error;
} finally {
  await writeFile(`${artifactsDir}/results.json`, JSON.stringify(results, null, 2), "utf8");
  await context.close().catch(() => {});
  await browser.close();
}

if (results.some((result) => result.status !== "PASS")) process.exit(1);
