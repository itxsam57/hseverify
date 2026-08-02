import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { rm } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { openScriptDatabase } from "./lib/database.mjs";
import { applyPendingMigrations } from "./lib/migrations.mjs";

const SESSION_SECRET = "runtime-smoke-session-secret-with-at-least-thirty-two-characters";
const WORKER_EMAIL = "runtime@example.com";
const WORKER_SUB = `worker:${WORKER_EMAIL}`;
const WORKER_ID = "HSE-WRK-RUNTIME-0001";
const RELEASE_SHA = "runtime-smoke-release";
const DATA_DIRECTORY = resolve(
  process.cwd(),
  ".data",
  "runtime smoke",
  "existing migrated database"
);

function encode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function createSessionCookie() {
  const now = Math.floor(Date.now() / 1000);
  const payload = encode(
    JSON.stringify({
      sub: WORKER_SUB,
      role: "worker",
      email: WORKER_EMAIL,
      displayName: "Demo Runtime Worker",
      workerId: WORKER_ID,
      issuedAt: now,
      expiresAt: now + 3600
    })
  );
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `hse_worker_session=${payload}.${signature}`;
}

async function findFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a runtime smoke-test port."));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) reject(error);
        else resolvePort(port);
      });
    });
  });
}

async function waitForServer(url, child, output) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Next development server exited early.\n${output.join("")}`);
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // The server is still starting.
    }
    await delay(500);
  }
  throw new Error(`Next development server did not become ready.\n${output.join("")}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveExit) => child.once("exit", resolveExit)),
    delay(5_000)
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

function persistedProfile() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    workerSub: WORKER_SUB,
    workerId: WORKER_ID,
    version: 1,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    sensitiveFieldsLocked: false,
    personal: {
      legalFirstName: "Persisted",
      legalLastName: "Runtime",
      preferredName: "Persisted Runtime Worker",
      dateOfBirth: "1990-01-01",
      nationality: "Test Nation",
      countryOfResidence: "Test Country",
      primaryLanguage: "English"
    },
    contact: {
      phoneCountryCode: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      region: "",
      postalCode: ""
    },
    professional: {
      primaryOccupation: "",
      yearsExperience: null,
      employmentStatus: "",
      willingToRelocate: false,
      preferredWorkCountries: ""
    },
    correctionRequest: null,
    audit: []
  };
}

async function prepareExistingDatabase(environment) {
  const database = await openScriptDatabase(environment);
  try {
    await applyPendingMigrations(database, RELEASE_SHA);
    const profile = persistedProfile();
    await database.query(
      `INSERT INTO worker_profiles (
         worker_sub, worker_id, schema_version, version, status,
         profile_document, created_at, updated_at, submitted_at
       ) VALUES ($1, $2, 1, 1, 'draft', $3::jsonb, $4, $4, NULL)`,
      [WORKER_SUB, WORKER_ID, JSON.stringify(profile), profile.createdAt]
    );
  } finally {
    await database.close();
  }
}

async function verifyDatabaseWasNotReset(environment) {
  const database = await openScriptDatabase(environment);
  try {
    const result = await database.query(
      `SELECT version, profile_document
       FROM worker_profiles
       WHERE worker_sub = $1`,
      [WORKER_SUB]
    );
    assert.equal(result.rows.length, 1, "The existing Worker Profile must remain present.");
    assert.equal(Number(result.rows[0].version), 1, "The runtime must not reset the profile version.");
  } finally {
    await database.close();
  }
}

await rm(DATA_DIRECTORY, { recursive: true, force: true });

const databaseEnvironment = {
  appEnvironment: "development",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: DATA_DIRECTORY,
  releaseSha: RELEASE_SHA,
  sessionSecret: SESSION_SECRET,
  demoAuthEnabled: true,
  demoDataEnabled: false
};

let child;
try {
  await prepareExistingDatabase(databaseEnvironment);
  const port = await findFreePort();
  const output = [];
  const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  child = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        HSE_APP_ENV: "development",
        HSE_RELEASE_SHA: RELEASE_SHA,
        HSE_DEPLOYMENT_ID: RELEASE_SHA,
        HSE_SESSION_SECRET: SESSION_SECRET,
        HSE_DATABASE_DRIVER: "pglite",
        HSE_PGLITE_DATA_DIR: DATA_DIRECTORY,
        HSE_ENABLE_WORKER_DEMO_AUTH: "true",
        HSE_WORKER_DEMO_EMAIL: WORKER_EMAIL,
        HSE_WORKER_DEMO_PASSWORD: "RuntimeSmokePassword123!",
        HSE_WORKER_DEMO_NAME: "Demo Runtime Worker",
        HSE_WORKER_DEMO_ID: WORKER_ID,
        HSE_USE_WORKER_DEMO_DATA: "false",
        HSE_DEMO_PROFILE_IDENTITY_LOCKED: "false"
      },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));

  const origin = `http://127.0.0.1:${port}`;
  await waitForServer(`${origin}/worker/login`, child, output);
  const headers = { Cookie: createSessionCookie() };

  const dashboardResponse = await fetch(`${origin}/worker/dashboard`, { headers });
  const dashboardHtml = await dashboardResponse.text();
  assert.equal(dashboardResponse.status, 200, dashboardHtml);
  assert.match(dashboardHtml, /Worker Dashboard/);
  assert.match(dashboardHtml, /Persisted Runtime Worker/);
  assert.doesNotMatch(dashboardHtml, /Temporary problem/);
  assert.equal((dashboardHtml.match(/<html\b/gi) ?? []).length, 1);
  assert.equal((dashboardHtml.match(/<body\b/gi) ?? []).length, 1);

  const profileResponse = await fetch(`${origin}/worker/profile`, { headers });
  const profileHtml = await profileResponse.text();
  assert.equal(profileResponse.status, 200, profileHtml);
  assert.match(profileHtml, /Persisted/);
  assert.doesNotMatch(profileHtml, /Temporary problem/);
  assert.equal((profileHtml.match(/<html\b/gi) ?? []).length, 1);
  assert.equal((profileHtml.match(/<body\b/gi) ?? []).length, 1);

  await stopServer(child);
  child = undefined;
  await verifyDatabaseWasNotReset(databaseEnvironment);
  console.log("Application PGlite runtime smoke test passed with an existing filesystem database.");
} finally {
  if (child) await stopServer(child);
  await rm(DATA_DIRECTORY, { recursive: true, force: true });
}
