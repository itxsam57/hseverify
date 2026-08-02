import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { buildPortablePreviewBundle } from "./lib/preview-bundle.mjs";

const { bundleRoot: bundle, pgliteManifest } = await buildPortablePreviewBundle();
console.log(`Portable preview bundle created with PGlite at ${pgliteManifest}.`);

const port = 3107;
const server = spawn(process.execPath, [resolve(bundle, "server.js")], {
  cwd: bundle,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
  env: {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    HSE_APP_ENV: "test",
    HSE_DATABASE_DRIVER: "pglite",
    HSE_PGLITE_DATA_DIR: "memory://",
    HSE_SESSION_SECRET:
      process.env.HSE_SESSION_SECRET ||
      "preview-smoke-session-secret-with-at-least-thirty-two-characters",
    HSE_ENABLE_WORKER_DEMO_AUTH: "false",
    HSE_USE_WORKER_DEMO_DATA: "false"
  }
});

let output = "";
server.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

async function waitForRoute(pathname) {
  const deadline = Date.now() + 30_000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
        redirect: "manual"
      });
      if (response.status >= 200 && response.status < 400) {
        return response.status;
      }
      lastError = new Error(`${pathname} returned ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
  }
  throw lastError ?? new Error(`Timed out waiting for ${pathname}.`);
}

async function stopServer() {
  if (server.exitCode !== null || server.signalCode !== null) {
    return;
  }

  server.kill();
  await new Promise((resolvePromise) => {
    const timeout = setTimeout(() => {
      if (server.exitCode === null && server.signalCode === null) {
        server.kill("SIGKILL");
      }
      resolvePromise();
    }, 5_000);
    server.once("exit", () => {
      clearTimeout(timeout);
      resolvePromise();
    });
  });
}

try {
  const rootStatus = await waitForRoute("/");
  const loginStatus = await waitForRoute("/worker/login");
  console.log(`Preview smoke test passed: / ${rootStatus}, /worker/login ${loginStatus}.`);
} catch (error) {
  console.error(output);
  throw error;
} finally {
  await stopServer();
  console.log("Preview smoke server stopped.");
}
