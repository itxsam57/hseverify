import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = process.env.HSE_BROWSER_BASE_URL || "http://127.0.0.1:3000";
const SANDBOX_KEY = process.env.HSE_AUTH_SANDBOX_ACCESS_KEY;
const PASSWORD = "CompanyRetrospectiveQA!2026";
const COMPANY_EMAIL = "company.retrospective.qa@example.test";
const COMPANY_PHONE = "+923001114455";
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

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = trackErrors(page, "company-registration-verification");

try {
  await checkpoint("Company registration and verification workflow", async () => {
    await gotoOk(page, "/company/register", "Create a verified Company workspace.");
    await page.getByLabel("Legal Company name").fill("Retrospective Industrial Services Limited");
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

    await gotoOk(page, "/company/settings/profile", "Company profile and verification");
    await page.getByRole("heading", { name: "Draft", exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    await page.getByLabel("Trading name").fill("Retrospective Verify Operations");
    await page.getByRole("button", { name: "Save Company details" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    assert(
      (await page.getByLabel("Trading name").inputValue()) === "Retrospective Verify Operations",
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
      finalStatus: "submitted",
      evidence: "retrospective-company-registration.pdf",
      mfa: "activated-and-reused-for-login-with-next-counter"
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
