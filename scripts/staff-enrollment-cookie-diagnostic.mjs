import { chromium } from "playwright";

const BASE_URL = process.env.HSE_BROWSER_BASE_URL || "http://127.0.0.1:3000";
const SANDBOX_KEY = process.env.HSE_AUTH_SANDBOX_ACCESS_KEY;
if (!SANDBOX_KEY) throw new Error("HSE_AUTH_SANDBOX_ACCESS_KEY is required.");

function summarizeSetCookie(value) {
  if (!value) {
    return {
      present: false,
      expectedName: false,
      expectedPath: false,
      httpOnly: false,
      sameSiteLax: false,
      secure: false
    };
  }
  return {
    present: true,
    expectedName: /(?:^|,|\s)hse_staff_enrollment=/.test(value) || /(?:^|,|\s)__Secure-hse_staff_enrollment=/.test(value),
    expectedPath: /Path=\/staff\/invite/i.test(value),
    httpOnly: /HttpOnly/i.test(value),
    sameSiteLax: /SameSite=Lax/i.test(value),
    secure: /(?:^|;)\s*Secure(?:;|$)/i.test(value)
  };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(`${BASE_URL}/auth/sandbox/bootstrap-root`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("First root email").fill("root.cookie.diagnostic@example.test");
  await page.getByLabel("Authentication sandbox access key").fill(SANDBOX_KEY);
  await page.getByRole("button", { name: "Create first root invitation" }).click();
  const result = page.locator(".security-key-card strong");
  await result.waitFor({ state: "visible", timeout: 15_000 });
  const invitationPath = (await result.innerText()).trim();
  if (!invitationPath.startsWith("/staff/invite/")) throw new Error("Diagnostic Root invitation path was not produced.");

  let redirectCookieSummary = null;
  page.on("response", async (response) => {
    try {
      const pathname = new URL(response.url()).pathname;
      if (pathname === invitationPath) {
        redirectCookieSummary = {
          status: response.status(),
          setCookie: summarizeSetCookie(await response.headerValue("set-cookie"))
        };
      }
    } catch {
      // Diagnostic only; never fail the product flow because response metadata could not be inspected.
    }
  });

  await page.goto(`${BASE_URL}${invitationPath}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/staff\/invite\/accept(?:\?|$)/, { timeout: 15_000 });
  const bodyText = await page.locator("body").innerText();
  const cookies = (await context.cookies(`${BASE_URL}/staff/invite/accept`)).map((cookie) => ({
    name: cookie.name,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite
  }));

  console.log(
    `STAFF_COOKIE_DIAGNOSTIC ${JSON.stringify({
      redirect: redirectCookieSummary,
      finalPath: new URL(page.url()).pathname,
      profileStepVisible: bodyText.includes("Create account credentials"),
      invitationUnavailableVisible: bodyText.includes("Invitation unavailable"),
      cookies
    })}`
  );
} finally {
  await context.close();
  await browser.close();
}
