import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const source = resolve(".next", "standalone");
const bundle = resolve(".preview-bundle");
await stat(resolve(source, "server.js"));
await rm(bundle, { recursive: true, force: true });
await cp(source, bundle, { recursive: true });
await mkdir(resolve(bundle, ".next"), { recursive: true });
await cp(resolve(".next", "static"), resolve(bundle, ".next", "static"), {
  recursive: true
});
await stat(resolve("public"))
  .then(() => cp(resolve("public"), resolve(bundle, "public"), { recursive: true }))
  .catch(() => undefined);

const port = 3107;
const server = spawn(process.execPath, [resolve(bundle, "server.js")], {
  cwd: bundle,
  stdio: ["ignore", "pipe", "pipe"],
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

try {
  const rootStatus = await waitForRoute("/");
  const loginStatus = await waitForRoute("/worker/login");
  console.log(`Preview smoke test passed: / ${rootStatus}, /worker/login ${loginStatus}.`);
} catch (error) {
  console.error(output);
  throw error;
} finally {
  server.kill("SIGTERM");
  await new Promise((resolvePromise) => {
    const timeout = setTimeout(() => {
      server.kill("SIGKILL");
      resolvePromise();
    }, 5_000);
    server.once("exit", () => {
      clearTimeout(timeout);
      resolvePromise();
    });
  });
}
