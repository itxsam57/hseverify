import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = process.env.HSE_BROWSER_BASE_URL || "http://127.0.0.1:3000";
const SANDBOX_KEY = process.env.HSE_AUTH_SANDBOX_ACCESS_KEY;
const PASSWORD = "RetrospectiveQA!StrongPassword2026";
const artifactsDir = "artifacts/hard-browser-retrospective";
const results = [];

if (!SANDBOX_KEY) throw new Error("HSE_AUTH_SANDBOX_ACCESS_KEY is required.");
await mkdir(artifactsDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function gotoOk(page, path, expectedText) {
  const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
  assert(response, `${path} returned no response`);
  assert(response.status() < 500, `${path} returned HTTP ${response.status()}`);
  if (expectedText) {
    await page.getByText(expectedText, { exact: false }).first().waitFor({ state: "visible", timeout: 15_000 });
  }
  return response.status();
}

function trackErrors(page, label) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${label} console: ${message.text()}`);
  });
  return errors;
}

async function latestSandboxCode(page, channel, destination) {
  await gotoOk(page, "/worker/register/sandbox", "Sandbox inbox");
  await page.getByLabel("Delivery channel").selectOption(channel);
  await page.getByLabel("Delivery destination").fill(destination);
  await page.getByLabel("Sandbox access key").fill(SANDBOX_KEY);
  await page.getByRole("button", { name: "Open latest sandbox delivery" }).click();
  const result = page.getByRole("status", { name: "Latest sandbox verification code" });
  await result.waitFor({ state: "visible", timeout: 15_000 });
  const code = (await result.locator("strong").innerText()).trim();
  assert(/^\d{6}$/.test(code), `Sandbox ${channel} code was not six digits`);
  return code;
}

async function registrationCookieState(context) {
  const cookies = await context.cookies();
  const cookie = cookies.find((candidate) => candidate.name === "hse_worker_registration" || candidate.name === "__Secure-hse_worker_registration");
  return cookie
    ? { present: true, name: cookie.name, path: cookie.path, secure: cookie.secure, sameSite: cookie.sameSite }
    : { present: false };
}

const browser = await chromium.launch({ headless: true });
let activePage = null;
let workerContext = null;
let workerPage = null;
const workerEmail = "worker.retrospective.qa@example.test";
const workerPhone = "+923001112233";

try {
  await checkpoint("Worker registration and contact verification", async () => {
    workerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    workerPage = await workerContext.newPage();
    activePage = workerPage;
    const errors = trackErrors(workerPage, "worker-registration");

    await gotoOk(workerPage, "/worker/register", "Create your Worker account");
    await workerPage.getByLabel("Full name").fill("Retrospective Worker QA");
    await workerPage.getByLabel("Email address").fill(workerEmail);
    await workerPage.getByLabel("Mobile phone").fill(workerPhone);
    await workerPage.getByLabel("Create password").fill(PASSWORD);
    await workerPage.getByLabel("Confirm password").fill(PASSWORD);
    await workerPage.getByRole("button", { name: "Create Worker account" }).click();
    await workerPage.waitForURL(/\/worker\/register\/verify/, { timeout: 15_000 });
    await workerPage.getByText("Step 1 of 2", { exact: false }).waitFor({ timeout: 15_000 });
    const initialCookie = await registrationCookieState(workerContext);
    assert(initialCookie.present, "Worker registration cookie missing immediately after account creation");

    const emailCode = await latestSandboxCode(workerPage, "email", workerEmail);
    await gotoOk(workerPage, "/worker/register/verify", "Step 1 of 2");
    await workerPage.getByLabel("Verification code").fill(emailCode);
    await workerPage.getByRole("button", { name: "Verify email" }).click();
    await workerPage.waitForURL(
      (url) => url.pathname === "/worker/register/verify" || url.pathname === "/worker/register",
      { timeout: 15_000 }
    );
    const afterEmailCookie = await registrationCookieState(workerContext);
    const afterEmailUrl = workerPage.url();
    assert(
      afterEmailCookie.present,
      `Worker registration cookie disappeared after valid email OTP; url=${afterEmailUrl}; initial=${JSON.stringify(initialCookie)}`
    );
    assert(
      new URL(afterEmailUrl).pathname === "/worker/register/verify",
      `Valid email OTP retained the cookie but registration state restarted; url=${afterEmailUrl}; cookie=${JSON.stringify(afterEmailCookie)}`
    );
    await workerPage.getByText("Step 2 of 2", { exact: false }).waitFor({ timeout: 15_000 });

    const phoneCode = await latestSandboxCode(workerPage, "phone", workerPhone);
    await gotoOk(workerPage, "/worker/register/verify", "Step 2 of 2");
    await workerPage.getByLabel("Verification code").fill(phoneCode);
    await workerPage.getByRole("button", { name: "Verify phone" }).click();
    await workerPage.getByText("Activation complete", { exact: false }).waitFor({ timeout: 15_000 });
    await workerPage.getByText("Email and phone verification passed", { exact: false }).waitFor({ timeout: 15_000 });
    await workerPage.screenshot({ path: `${artifactsDir}/worker-registration-complete.png`, fullPage: true });

    await workerPage.getByRole("link", { name: "Worker sign-in", exact: true }).click();
    await workerPage.waitForURL(/\/worker\/login/, { timeout: 15_000 });
    await workerPage.getByLabel("Email address").fill(workerEmail);
    await workerPage.getByLabel("Password").fill(PASSWORD);
    await workerPage.getByRole("button", { name: "Sign in" }).click();
    await workerPage.waitForURL((url) => url.pathname.startsWith("/worker/") && url.pathname !== "/worker/login", { timeout: 15_000 });
    assert(!workerPage.url().includes("/worker/login"), "Verified Worker could not sign in after activation");
    assert(errors.length === 0, `Worker registration browser errors: ${errors.join(" | ")}`);
    return { finalPath: new URL(workerPage.url()).pathname };
  });

  // Additional retrospective checkpoints are intentionally added one TDD slice at a time.
  // The coverage contract remains RED until every completed user-facing milestone has a real journey here or in hard-browser-qa.mjs.
} catch (error) {
  if (activePage) {
    try {
      await activePage.screenshot({ path: `${artifactsDir}/failure.png`, fullPage: true });
    } catch {
      // Keep the original failure as authority.
    }
  }
  throw error;
} finally {
  await writeFile(`${artifactsDir}/results.json`, JSON.stringify(results, null, 2), "utf8");
  if (workerContext) await workerContext.close().catch(() => {});
  await browser.close();
}

if (results.some((result) => result.status !== "PASS")) process.exit(1);
