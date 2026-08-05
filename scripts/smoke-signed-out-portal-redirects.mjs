import assert from "node:assert/strict";
import { createServer } from "node:net";

import { runDevelopmentServer } from "./lib/development-server.mjs";

async function findFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a portal redirect smoke-test port."));
        return;
      }
      server.close((error) => {
        if (error) reject(error);
        else resolvePort(address.port);
      });
    });
  });
}

function expectedLocation(role) {
  return `/${role}/login?reason=session-required`;
}

async function assertSignedOutRedirect(baseUrl, role, output) {
  const dashboardUrl = `${baseUrl}/${role}/dashboard`;
  const response = await fetch(dashboardUrl, { redirect: "manual" });
  assert.equal(
    response.status,
    307,
    `${role} dashboard returned HTTP ${response.status} instead of the pre-render temporary redirect.\n${output()}`
  );

  const expected = expectedLocation(role);
  const location = response.headers.get("location");
  assert.equal(
    location,
    expected,
    `${role} dashboard redirected to ${location ?? "no location"}.\n${output()}`
  );

  const redirectBody = await response.text();
  assert.ok(
    redirectBody === "" || redirectBody === expected,
    `${role} missing-cookie redirect returned unexpected content: ${redirectBody}.\n${output()}`
  );
  assert.doesNotMatch(redirectBody, /<!DOCTYPE|<html|<main|Not available|requested record/i);

  const loginResponse = await fetch(new URL(location, baseUrl), {
    redirect: "manual"
  });
  assert.equal(
    loginResponse.status,
    200,
    `${role} login target returned HTTP ${loginResponse.status}.\n${output()}`
  );
  const body = await loginResponse.text();
  assert.match(body, /<main class="auth-page" id="main-content">/);
  assert.match(body, /Sign in to continue to this portal\./);
}

const port = await findFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const result = await runDevelopmentServer({
  args: ["--hostname", "127.0.0.1", "--port", String(port)],
  probeUrl: `${baseUrl}/worker/login`,
  probe: async ({ initialResponse, output }) => {
    assert.equal(initialResponse.status, 200, output());
    await assertSignedOutRedirect(baseUrl, "worker", output);
    await assertSignedOutRedirect(baseUrl, "company", output);
  }
});

assert.equal(result.requestedSignal, "SMOKE_COMPLETE");
console.log(
  "Signed-out Worker and Company dashboard requests received minimal pre-render redirects to their fixed-role login pages, and both login pages rendered successfully."
);
