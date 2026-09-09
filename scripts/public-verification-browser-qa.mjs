import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const base = process.env.HSE_BROWSER_BASE_URL || "http://127.0.0.1:3012";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.HSE_CHROMIUM_PATH || undefined,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"]
});
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.cameraTracks = [];
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      canvas.getContext("2d").fillRect(0, 0, 32, 32);
      const stream = canvas.captureStream(1);
      window.cameraTracks.push(...stream.getTracks());
      return stream;
    };
    // A stalled native detector must never prevent releasing the real media track.
    window.BarcodeDetector = class {
      detect() { return new Promise(() => {}); }
    };
  });
  await page.goto(`${base}/verify`);
  await page.getByRole("button", { name: "Scan QR", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.cameraTracks.length), 0, "No camera on page load");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Scan QR", exact: true }).click();
  await page.waitForFunction(() => window.cameraTracks.some(track => track.readyState === "live"), null, { timeout: 10000 }).catch(async error => {
    console.error({ errors, body: await page.locator("body").innerText(), camera: await page.evaluate(() => ({ secure: isSecureContext, devices: !!navigator.mediaDevices, detector: !!window.BarcodeDetector, tracks: window.cameraTracks.length })) });
    throw error;
  });
  // Client navigation preserves this window and lets us inspect the old track.
  await page.locator("a.brand-mark").click();
  await page.waitForURL(`${base}/`);
  await page.waitForFunction(() => window.cameraTracks.every(track => track.readyState === "ended"), null, { timeout: 2000 });
  assert.deepEqual(await page.evaluate(() => window.cameraTracks.map(track => track.readyState)), ["ended"],
    "Leaving verification must immediately release camera even if detect never resolves");
  await page.goto(`${base}/verify`);
  await page.waitForLoadState("networkidle");
  for (let retry = 0; retry < 2; retry += 1) {
    await page.getByRole("button", { name: "Scan QR", exact: true }).click();
    await page.waitForFunction(() => window.cameraTracks.some(track => track.readyState === "live"));
    await page.getByRole("button", { name: "Stop scanning", exact: true }).click();
    assert.ok(await page.evaluate(() => window.cameraTracks.every(track => track.readyState === "ended")));
  }
  await page.evaluate(() => {
    window.acquireCamera = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = () => new Promise(resolve => {
      window.grantCamera = async () => resolve(await window.acquireCamera());
    });
  });
  await page.getByRole("button", { name: "Scan QR", exact: true }).click();
  await page.getByRole("button", { name: "Stop scanning", exact: true }).click();
  await page.evaluate(() => window.grantCamera());
  await page.waitForFunction(() => window.cameraTracks.length === 3 && window.cameraTracks.every(track => track.readyState === "ended"));
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = window.acquireCamera; });
  await page.getByRole("button", { name: "Scan QR", exact: true }).click();
  await page.waitForFunction(() => window.cameraTracks.some(track => track.readyState === "live"));
  await page.waitForFunction(() => window.cameraTracks.every(track => track.readyState === "ended"), null, { timeout: 18000 });
  assert.equal(await page.getByRole("button", { name: "Scan QR", exact: true }).isEnabled(), true);
  console.log("PASS: navigation, explicit cancellation, retry, late permission and stalled-detector deadline release media tracks");

  const field = page.getByLabel("Worker ID or Credential ID", { exact: true });
  for (let index = 0; index < 31; index += 1) {
    await context.setExtraHTTPHeaders({
      "x-forwarded-for": `203.0.113.${index + 1}`,
      "x-real-ip": `198.51.100.${index + 1}`,
      "user-agent": `rotating-client-${index}`
    });
    await field.fill(`worker_id_${String(index).padStart(24, "0")}`);
    const response = page.waitForResponse(response => response.request().method() === "POST" && response.url().endsWith("/verify"));
    await page.getByRole("button", { name: "Verify", exact: true }).click();
    assert.equal((await response).status(), 200);
    await page.getByRole("button", { name: "Verify", exact: true }).waitFor();
    const expected = index < 30 ? "We could not verify that identifier. Check it and try again." : "Public verification is temporarily unavailable. Wait a few minutes and try again.";
    await page.getByText(expected, { exact: true }).waitFor({ timeout: 3000 });
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  assert.deepEqual(errors, []);
  console.log("PASS: 31 spoofed-header requests share the enforced budget; mobile has no overflow or browser errors");
} finally {
  await browser.close();
}
