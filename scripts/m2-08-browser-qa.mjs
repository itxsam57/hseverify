import { chromium } from "playwright";
import { createHash, randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

import { openScriptDatabase } from "./lib/database.mjs";
import { readProjectEnvironment } from "./lib/environment.mjs";

const BASE_URL = process.env.HSE_BROWSER_BASE_URL || "http://127.0.0.1:3004";
const PASSWORD = "M208Browser!StrongPassword2026";
const WORKER_A = Object.freeze({
  email: "worker-a.m208.browser@example.test",
  displayName: "M2.08 Worker A"
});
const WORKER_B = Object.freeze({
  email: "worker-b.m208.browser@example.test",
  displayName: "M2.08 Worker B"
});
const TEXT_PROMPT = "Describe the immediate safe response for the M2.08 browser recovery scenario.";
const DECIMAL_PROMPT = "Enter the measured exposure value for the M2.08 browser recovery scenario.";
const TEXT_RUBRIC_SECRET = "M208-RUBRIC-SECRET-SHOULD-NEVER-LEAK";
const NOW = "2026-09-01T15:45:00.000Z";
const artifactsDir = "artifacts/m2-08-browser";
const results = [];
const scrypt = promisify(nodeScrypt);

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableId(prefix, seed) {
  return `${prefix}_${digest(`${prefix}:${seed}`).slice(0, 24)}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function passwordHash(password, pepper) {
  const salt = randomBytes(16);
  const derived = await scrypt(`${password}\u0000${pepper}`, salt, 64, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024
  });
  return [
    "scrypt",
    "16384",
    "8",
    "1",
    salt.toString("base64url"),
    Buffer.from(derived).toString("base64url")
  ].join("$");
}

async function checkpoint(name, operation) {
  const beganAt = Date.now();
  try {
    const detail = await operation();
    results.push({ name, status: "PASS", ms: Date.now() - beganAt, detail: detail ?? null });
    console.log(`PASS ${name}`);
    return detail;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, status: "FAIL", ms: Date.now() - beganAt, error: message });
    console.error(`FAIL ${name}: ${message}`);
    throw error;
  }
}

function trackErrors(page, label) {
  const entries = [];
  const allowed = new Set();
  page.on("pageerror", (error) => entries.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" || /hydration|hydrated|did not match/i.test(text)) {
      entries.push(`${label} console: ${text}`);
    }
  });
  return { entries, allowed };
}

function allowExpectedTransportErrors(log, fromIndex) {
  for (let index = fromIndex; index < log.entries.length; index += 1) {
    const entry = log.entries[index];
    if (/failed to fetch|networkerror|net::err_|server action|fetch failed/i.test(entry)) {
      log.allowed.add(index);
    }
  }
}

function assertNoUnexpectedBrowserErrors(logs) {
  const unexpected = [];
  for (const log of logs) {
    for (let index = 0; index < log.entries.length; index += 1) {
      if (!log.allowed.has(index)) unexpected.push(log.entries[index]);
    }
  }
  assert(unexpected.length === 0, `Unexpected browser console/page errors: ${unexpected.join(" | ")}`);
}

async function insertWorker(database, seed, worker, pepper) {
  const accountId = `account_m208_browser_${digest(seed).slice(0, 18)}`;
  const workerReference = `M208-BROWSER-${seed.toUpperCase()}`;
  const hash = await passwordHash(PASSWORD, pepper);
  await database.query(
    `INSERT INTO auth_accounts(
       account_id,email_normalized,display_name,account_status,password_hash,worker_reference,
       email_verified_at,password_set_at,created_at,updated_at
     ) VALUES($1,$2,$3,'active',$4,$5,$6,$6,$6,$6)`,
    [accountId, worker.email, worker.displayName, hash, workerReference, NOW]
  );
  await database.query(
    `INSERT INTO auth_account_roles(account_id,role,created_at) VALUES($1,'worker',$2)`,
    [accountId, NOW]
  );
  return accountId;
}

export async function seedBrowserScenario() {
  const environment = readProjectEnvironment();
  assert(environment.databaseDriver === "pglite", "M2.08 browser seed requires the isolated PGlite test database.");
  assert(environment.pgliteDataDir && environment.pgliteDataDir !== "memory://", "M2.08 browser seed requires a persisted PGlite directory shared with Next.js.");

  const database = await openScriptDatabase(environment);
  try {
    const existing = await database.query(
      `SELECT account_id FROM auth_accounts WHERE email_normalized=$1`,
      [WORKER_A.email]
    );
    if (existing.rows.length > 0) {
      throw new Error("M2.08 browser seed database is not clean; refuse to reuse stale draft state.");
    }

    const workerAId = await insertWorker(database, "worker-a", WORKER_A, environment.authPepper);
    await insertWorker(database, "worker-b", WORKER_B, environment.authPepper);

    const frameworkId = stableId("framework", "m208-browser");
    const blueprintId = stableId("assessment_blueprint", "m208-browser");
    const blueprintVersionId = stableId("blueprint_version", "m208-browser");
    const catalogueEntryId = stableId("assessment_catalogue", "m208-browser");
    const catalogueVersionId = stableId("catalogue_version", "m208-browser");
    const tenantId = stableId("tenant", "m208-browser");
    const orderId = stableId("assurance_order", "m208-browser");
    const targetId = stableId("assurance_target", "m208-browser");
    const caseId = stableId("assurance_case", "m208-browser");

    await database.query(
      `INSERT INTO assurance_frameworks(
         framework_id,framework_reference,title,framework_status,created_by_account_id,created_at,updated_at
       ) VALUES($1,'M208-BROWSER','M2.08 Browser Framework','ACTIVE',$2,$3,$3)`,
      [frameworkId, workerAId, NOW]
    );

    await database.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO assessment_blueprints(
           blueprint_id,blueprint_reference,blueprint_status,current_version_id,
           created_by_account_id,created_at,updated_at
         ) VALUES($1,'BP-M208-BROWSER','INACTIVE',NULL,$2,$3,$3)`,
        [blueprintId, workerAId, NOW]
      );
      await tx.query(
        `INSERT INTO assessment_blueprint_versions(
           blueprint_version_id,blueprint_id,version_no,framework_id,title,
           selectors_json,created_by_account_id,created_at
         ) VALUES($1,$2,1,$3,'M2.08 Browser Blueprint',$4::jsonb,$5,$6)`,
        [
          blueprintVersionId,
          blueprintId,
          frameworkId,
          JSON.stringify([
            { count: 1, questionType: "SHORT_TEXT", tagsAll: [] },
            { count: 1, questionType: "DECIMAL", tagsAll: [] }
          ]),
          workerAId,
          NOW
        ]
      );
      await tx.query(
        `UPDATE assessment_blueprints
         SET current_version_id=$2,blueprint_status='ACTIVE',updated_at=$3
         WHERE blueprint_id=$1`,
        [blueprintId, blueprintVersionId, NOW]
      );
    });

    await database.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO assessment_catalogue_entries(
           catalogue_entry_id,catalogue_reference,catalogue_status,current_version_id,
           created_by_account_id,created_at,updated_at
         ) VALUES($1,'CAT-M208-BROWSER','INACTIVE',NULL,$2,$3,$3)`,
        [catalogueEntryId, workerAId, NOW]
      );
      await tx.query(
        `INSERT INTO assessment_catalogue_versions(
           catalogue_version_id,catalogue_entry_id,version_no,title,description,framework_id,
           blueprint_version_id,minimum_verified_qualifications,created_by_account_id,created_at
         ) VALUES($1,$2,1,'M2.08 Browser Assessment','Real durable draft and recovery browser proof',$3,$4,0,$5,$6)`,
        [catalogueVersionId, catalogueEntryId, frameworkId, blueprintVersionId, workerAId, NOW]
      );
      await tx.query(
        `UPDATE assessment_catalogue_entries
         SET current_version_id=$2,catalogue_status='ACTIVE',updated_at=$3
         WHERE catalogue_entry_id=$1`,
        [catalogueEntryId, catalogueVersionId, NOW]
      );
    });

    const questions = [
      {
        seed: "text",
        type: "SHORT_TEXT",
        prompt: TEXT_PROMPT,
        answerKey: null,
        rubric: { maxScore: 1, criteria: [{ description: TEXT_RUBRIC_SECRET, points: 1 }] },
        domainReference: "Interruption Recovery"
      },
      {
        seed: "decimal",
        type: "DECIMAL",
        prompt: DECIMAL_PROMPT,
        answerKey: null,
        rubric: null,
        domainReference: "Measurement"
      }
    ];

    for (const question of questions) {
      const questionId = stableId("assessment_question", `m208-browser-${question.seed}`);
      const questionVersionId = stableId("question_version", `m208-browser-${question.seed}`);
      const fingerprint = digest(`${question.type}:${question.prompt}:${question.seed}`);
      await database.transaction(async (tx) => {
        await tx.query(
          `INSERT INTO assessment_questions(
             question_id,question_reference,question_status,current_version_id,current_content_fingerprint,
             created_by_account_id,created_at,updated_at
           ) VALUES($1,$2,'INACTIVE',NULL,NULL,$3,$4,$4)`,
          [questionId, `M208-Q-${question.seed.toUpperCase()}`, workerAId, NOW]
        );
        await tx.query(
          `INSERT INTO assessment_question_versions(
             question_version_id,question_id,version_no,question_type,prompt,options_json,
             answer_key_json,rubric_json,framework_id,domain_reference,difficulty,tags_json,
             content_fingerprint,created_by_account_id,created_at
           ) VALUES($1,$2,1,$3,$4,NULL,$5::jsonb,$6::jsonb,$7,$8,'MEDIUM','[]'::jsonb,$9,$10,$11)`,
          [
            questionVersionId,
            questionId,
            question.type,
            question.prompt,
            question.answerKey === null ? null : JSON.stringify(question.answerKey),
            question.rubric === null ? null : JSON.stringify(question.rubric),
            frameworkId,
            question.domainReference,
            fingerprint,
            workerAId,
            NOW
          ]
        );
        await tx.query(
          `UPDATE assessment_questions
           SET current_version_id=$2,current_content_fingerprint=$3,question_status='ACTIVE',updated_at=$4
           WHERE question_id=$1`,
          [questionId, questionVersionId, fingerprint, NOW]
        );
      });
    }

    const workerLinkId = `worker_link_${digest("m208-browser-link").slice(0, 24)}`;
    const membershipId = `membership_${digest("m208-browser-membership").slice(0, 24)}`;
    await database.query(
      `INSERT INTO assurance_orders(
         order_id,tenant_id,created_by_membership_id,order_name,order_reference,
         requested_identity_checks,requested_evidence_checks,assessment_framework_references,
         interview_required,order_status,validation_errors,scope_version,created_at,updated_at
       ) VALUES($1,$2,$3,'M2.08 Browser Order','M208-BROWSER-ORDER',
                '[]'::jsonb,'[]'::jsonb,'[]'::jsonb,FALSE,'DRAFT','[]'::jsonb,1,$4,$4)`,
      [orderId, tenantId, membershipId, NOW]
    );
    await database.query(
      `INSERT INTO assurance_order_workers(
         target_id,order_id,tenant_id,worker_link_id,worker_account_id,funding_method,
         target_status,created_at,updated_at
       ) VALUES($1,$2,$3,$4,$5,'company','eligible',$6,$6)`,
      [targetId, orderId, tenantId, workerLinkId, workerAId, NOW]
    );
    await database.query(
      `INSERT INTO assurance_cases(
         case_id,order_id,target_id,tenant_id,worker_link_id,worker_account_id,
         case_status,owner_kind,next_action,created_at,updated_at
       ) VALUES($1,$2,$3,$4,$5,$6,'Assessment pending','worker','View available assessments',$7,$7)`,
      [caseId, orderId, targetId, tenantId, workerLinkId, workerAId, NOW]
    );
    await database.query(
      `INSERT INTO assurance_case_policy_snapshots(
         snapshot_id,case_id,tenant_id,framework_id,policy_id,global_policy_version_id,
         tenant_override_id,policy_source,effective_value_json,reference_time,resolved_at,
         created_by_account_id
       ) VALUES($1,$2,$3,$4,$5,$6,NULL,'GLOBAL','{}'::jsonb,$7,$7,NULL)`,
      [
        stableId("policy_snapshot", "m208-browser"),
        caseId,
        tenantId,
        frameworkId,
        stableId("policy", "m208-browser"),
        stableId("policy_version", "m208-browser"),
        NOW
      ]
    );

    const seeded = {
      caseId,
      catalogueVersionId,
      frameworkId,
      workerA: WORKER_A.email,
      workerB: WORKER_B.email,
      questionOrder: ["SHORT_TEXT", "DECIMAL"]
    };
    await mkdir(artifactsDir, { recursive: true });
    await writeFile(`${artifactsDir}/seed.json`, JSON.stringify(seeded, null, 2));
    console.log(`Seeded M2.08 browser scenario for case ${caseId}.`);
    return seeded;
  } finally {
    await database.close();
  }
}

async function goto(page, path) {
  const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
  assert(response, `${path} returned no response.`);
  return response;
}

async function loginWorker(browser, credentials, label) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const response = await goto(page, "/worker/login");
  assert(response.status() === 200, `${label} Worker login returned HTTP ${response.status()}.`);
  await page.getByLabel("Email address").fill(credentials.email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(
    (url) => url.origin === BASE_URL && url.pathname.startsWith("/worker/") && !url.pathname.includes("/login"),
    { timeout: 20_000 }
  );
  return { context, page };
}

function captureAssessmentTraffic(page, records) {
  page.on("request", (request) => {
    try {
      const url = new URL(request.url());
      if (url.origin !== BASE_URL || request.method() !== "POST") return;
      const body = request.postData();
      if (body) records.push({ kind: "request", url: request.url(), body });
    } catch {
      // Ignore malformed or unrelated browser requests.
    }
  });
  page.on("response", async (response) => {
    try {
      const url = new URL(response.url());
      if (url.origin !== BASE_URL) return;
      const contentType = response.headers()["content-type"] ?? "";
      if (!/(?:text\/html|text\/x-component|application\/json)/i.test(contentType)) return;
      const body = await response.text();
      records.push({ kind: "response", url: response.url(), status: response.status(), contentType, body });
    } catch {
      // Navigation can cancel a body read; absence is safer than treating it as evidence.
    }
  });
}

async function assertFuturePromptAbsent(page, futurePrompt, records) {
  const delivered = [await page.content(), ...records.map((record) => record.body)];
  for (const body of delivered) {
    assert(!body.includes(futurePrompt), "Future question prompt leaked before the current answer was committed.");
  }
}

async function assertNoAssessmentSecrets(page, records) {
  const delivered = [await page.content(), ...records.map((record) => record.body)];
  const forbidden = [
    { pattern: /["']?answerKey["']?\s*[:=]|answer_key/i, label: "answerKey/answer_key" },
    { pattern: /["']?rubric["']?\s*[:=]/i, label: "rubric" },
    { pattern: /["']?score["']?\s*[:=]/i, label: "score" },
    { pattern: /["']?correctness["']?\s*[:=]/i, label: "correctness" },
    { pattern: /["']?(?:passFail|pass_fail|passed)["']?\s*[:=]/i, label: "pass/fail" },
    { pattern: /["']?(?:reviewer|reviewerId|reviewer_id)["']?\s*[:=]/i, label: "reviewer" },
    { pattern: new RegExp(TEXT_RUBRIC_SECRET, "i"), label: "rubric sentinel" },
    { pattern: /["']workerAccountId["']\s*[:=]/i, label: "internal workerAccountId" },
    { pattern: /["']formId["']\s*[:=]/i, label: "internal formId" },
    { pattern: /["']startedAt["']\s*[:=]/i, label: "internal startedAt" }
  ];
  for (const body of delivered) {
    for (const item of forbidden) {
      assert(!item.pattern.test(body), `Forbidden assessment secret marker leaked to browser: ${item.label}.`);
    }
  }
}

async function waitForSaved(page) {
  await page.getByRole("status").filter({ hasText: "Saved" }).first().waitFor({ state: "visible", timeout: 20_000 });
}

async function waitForNotSaved(page) {
  await page.getByRole("status").filter({ hasText: "Not saved" }).first().waitFor({ state: "visible", timeout: 20_000 });
}

async function assertNoPersistentBrowserAnswer(page, sentinels) {
  const inspection = await page.evaluate(async () => {
    const local = Object.entries(localStorage);
    const indexed = [];
    if (typeof indexedDB !== "undefined" && typeof indexedDB.databases === "function") {
      const databases = await indexedDB.databases();
      for (const descriptor of databases) {
        if (!descriptor.name) continue;
        const values = await new Promise((resolve) => {
          const request = indexedDB.open(descriptor.name);
          request.onerror = () => resolve([]);
          request.onsuccess = () => {
            const database = request.result;
            const stores = [...database.objectStoreNames];
            if (stores.length === 0) {
              database.close();
              resolve([]);
              return;
            }
            const collected = [];
            let remaining = stores.length;
            const transaction = database.transaction(stores, "readonly");
            for (const storeName of stores) {
              const all = transaction.objectStore(storeName).getAll();
              all.onsuccess = () => {
                collected.push({ storeName, values: all.result });
                remaining -= 1;
                if (remaining === 0) {
                  database.close();
                  resolve(collected);
                }
              };
              all.onerror = () => {
                remaining -= 1;
                if (remaining === 0) {
                  database.close();
                  resolve(collected);
                }
              };
            }
          };
        });
        indexed.push({ name: descriptor.name, values });
      }
    }

    const cacheEntries = [];
    if (typeof caches !== "undefined") {
      for (const cacheName of await caches.keys()) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        for (const request of requests) {
          const response = await cache.match(request);
          let text = "";
          try {
            text = response ? await response.clone().text() : "";
          } catch {
            text = "";
          }
          cacheEntries.push({ cacheName, url: request.url, text });
        }
      }
    }
    return { local, indexed, cacheEntries };
  });

  const serialized = JSON.stringify(inspection);
  for (const sentinel of sentinels) {
    assert(!serialized.includes(sentinel), "M2.08 answer content was persisted in browser storage.");
  }
  return {
    localStorageEntries: inspection.local.length,
    indexedDbDatabases: inspection.indexed.length,
    cacheEntries: inspection.cacheEntries.length
  };
}

async function runBrowserJourney() {
  await mkdir(artifactsDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const traffic = [];
  const errorLogs = [];
  let primary;
  let active;
  let tabTwo;
  let attemptId;

  const firstDraft = "  M2.08 server draft with exact whitespace  ";
  const saveExitDraft = "  M2.08 exact save and exit draft  ";
  const failedDraft = "  M2.08 transport failure must not replace server draft  ";
  const tabAValue = "M2.08 tab A accepted revision";
  const tabBLosingValue = "M2.08 tab B stale revision";
  const tabANewerValue = "M2.08 tab A newer revision";
  const tabBReplacement = "M2.08 tab B explicit replacement";
  const staleOldPositionValue = "M2.08 old-position delayed autosave";
  const partialDecimal = "987654321.";
  const finalDecimal = "987654321.25";
  const browserSentinels = [firstDraft, saveExitDraft, failedDraft, tabAValue, tabBLosingValue, tabANewerValue, tabBReplacement, staleOldPositionValue, partialDecimal, finalDecimal];

  try {
    primary = await checkpoint("login real Worker A", () => loginWorker(browser, WORKER_A, "primary"));
    active = primary;
    const primaryErrors = trackErrors(primary.page, "primary");
    errorLogs.push(primaryErrors);
    captureAssessmentTraffic(primary.page, traffic);

    await checkpoint("start assessment and open current SHORT_TEXT question only", async () => {
      const response = await goto(primary.page, "/worker/available-assessments");
      assert(response.status() === 200, `Available assessments returned HTTP ${response.status()}.`);
      await primary.page.getByRole("heading", { name: "M2.08 Browser Assessment" }).waitFor({ timeout: 20_000 });
      await assertFuturePromptAbsent(primary.page, DECIMAL_PROMPT, traffic);
      await primary.page.getByRole("button", { name: "Start assessment" }).click();
      await primary.page.waitForURL(/\/worker\/assessments\/assessment_attempt_[A-Za-z0-9_-]{24}$/, { timeout: 20_000 });
      attemptId = primary.page.url().split("/").pop();
      assert(attemptId && /^assessment_attempt_[A-Za-z0-9_-]{24}$/.test(attemptId), "Visible Start assessment did not create a valid attempt ID.");
      await primary.page.getByText("Question 1 of 2", { exact: true }).waitFor({ timeout: 20_000 });
      await primary.page.getByText(TEXT_PROMPT, { exact: true }).waitFor({ timeout: 20_000 });
      await assertFuturePromptAbsent(primary.page, DECIMAL_PROMPT, traffic);
      await assertNoAssessmentSecrets(primary.page, traffic);
      await writeFile(`${artifactsDir}/state.json`, JSON.stringify({ attemptId }, null, 2));
      await primary.page.screenshot({ path: `${artifactsDir}/question-1-open.png`, fullPage: true, caret: "initial" });
      return { currentPosition: 1, questionType: "SHORT_TEXT" };
    });

    await checkpoint("autosave reaches Saved only after server acknowledgement and reload restores exact whitespace", async () => {
      const input = primary.page.getByLabel("Your answer");
      await input.fill(firstDraft);
      await primary.page.getByRole("status").filter({ hasText: "Saving" }).first().waitFor({ state: "visible", timeout: 5_000 });
      await waitForSaved(primary.page);
      assert(await input.inputValue() === firstDraft, "Acknowledged draft did not preserve exact whitespace before reload.");
      await primary.page.reload({ waitUntil: "domcontentloaded" });
      await primary.page.getByText("Question 1 of 2", { exact: true }).waitFor({ timeout: 20_000 });
      assert(await primary.page.getByLabel("Your answer").inputValue() === firstDraft, "Reload did not restore the exact acknowledged whitespace draft.");
      await assertFuturePromptAbsent(primary.page, DECIMAL_PROMPT, traffic);
      await assertNoAssessmentSecrets(primary.page, traffic);
      await primary.page.screenshot({ path: `${artifactsDir}/question-1-reloaded-draft.png`, fullPage: true, caret: "initial" });
      return { restoredExactDraft: true };
    });

    await checkpoint("fresh authenticated context restores server draft without browser persistence", async () => {
      const storage = await assertNoPersistentBrowserAnswer(primary.page, browserSentinels);
      const fresh = await loginWorker(browser, WORKER_A, "fresh same Worker");
      const freshErrors = trackErrors(fresh.page, "fresh-worker-a");
      errorLogs.push(freshErrors);
      captureAssessmentTraffic(fresh.page, traffic);
      try {
        const response = await goto(fresh.page, `/worker/assessments/${attemptId}`);
        assert(response.status() === 200, `Fresh same-Worker attempt GET returned HTTP ${response.status()}.`);
        await fresh.page.getByText("Question 1 of 2", { exact: true }).waitFor({ timeout: 20_000 });
        assert(await fresh.page.getByLabel("Your answer").inputValue() === firstDraft, "Fresh authenticated context did not restore the server draft.");
        await assertNoPersistentBrowserAnswer(fresh.page, browserSentinels);
        await assertNoAssessmentSecrets(fresh.page, traffic);
      } finally {
        await fresh.context.close();
      }
      return storage;
    });

    await checkpoint("Save and exit flushes exact current edit then Resume restores it", async () => {
      const input = primary.page.getByLabel("Your answer");
      await input.fill(saveExitDraft);
      await primary.page.getByRole("button", { name: "Save and exit", exact: true }).click();
      await primary.page.waitForURL((url) => url.pathname === "/worker/available-assessments", { timeout: 20_000 });
      await primary.page.getByRole("heading", { name: "In progress", exact: true }).waitFor({ timeout: 20_000 });
      await primary.page.getByText("Question 1 of 2", { exact: true }).waitFor({ timeout: 20_000 });
      await primary.page.getByRole("link", { name: "Resume assessment", exact: true }).click();
      await primary.page.waitForURL(new RegExp(`/worker/assessments/${attemptId}$`), { timeout: 20_000 });
      assert(await primary.page.getByLabel("Your answer").inputValue() === saveExitDraft, "Resume did not restore the exact Save-and-exit draft.");
      await waitForSaved(primary.page);
      return { saveAndExitRecovered: true };
    });

    await checkpoint("cross-Worker direct attempt and Resume probes fail closed", async () => {
      const otherWorker = await loginWorker(browser, WORKER_B, "second Worker");
      const otherErrors = trackErrors(otherWorker.page, "worker-b");
      errorLogs.push(otherErrors);
      try {
        const response = await goto(otherWorker.page, `/worker/assessments/${attemptId}`);
        const body = (await otherWorker.page.textContent("body")) ?? "";
        assert(response.status() === 404 || /not found|404/i.test(body), `Cross-Worker attempt request was not denied; HTTP ${response.status()}.`);
        assert(!body.includes(TEXT_PROMPT) && !body.includes(DECIMAL_PROMPT) && !body.includes(saveExitDraft), "Other Worker received protected assessment or draft content.");
        await goto(otherWorker.page, "/worker/available-assessments");
        assert(await otherWorker.page.getByRole("link", { name: "Resume assessment", exact: true }).count() === 0, "Other Worker received the owned Resume control.");
        await otherWorker.page.screenshot({ path: `${artifactsDir}/cross-worker-denied.png`, fullPage: true, caret: "initial" });
        return { crossWorkerDenied: true };
      } finally {
        await otherWorker.context.close();
      }
    });

    await checkpoint("failed Save and exit stays on page and Emergency exit remains bounded", async () => {
      const pathPattern = `**/worker/assessments/${attemptId}**`;
      await primary.page.route(pathPattern, async (route) => {
        if (route.request().method() === "POST") {
          await route.abort("failed");
          return;
        }
        await route.continue();
      });
      const errorBaseline = primaryErrors.entries.length;
      const input = primary.page.getByLabel("Your answer");
      await input.fill(failedDraft);
      await primary.page.getByRole("button", { name: "Save and exit", exact: true }).click();
      await waitForNotSaved(primary.page);
      assert(new URL(primary.page.url()).pathname === `/worker/assessments/${attemptId}`, "Failed Save and exit navigated away despite no server acknowledgement.");

      const emergencyBeganAt = Date.now();
      await primary.page.getByRole("button", { name: "Emergency exit", exact: true }).click();
      await primary.page.waitForURL((url) => url.pathname === "/worker/available-assessments", { timeout: 4_000 });
      const emergencyMs = Date.now() - emergencyBeganAt;
      assert(emergencyMs < 3_000, `Emergency exit was not bounded; elapsed=${emergencyMs}ms.`);
      await primary.page.unroute(pathPattern);
      await primary.page.waitForTimeout(250);
      allowExpectedTransportErrors(primaryErrors, errorBaseline);

      await primary.page.getByRole("link", { name: "Resume assessment", exact: true }).click();
      await primary.page.waitForURL(new RegExp(`/worker/assessments/${attemptId}$`), { timeout: 20_000 });
      assert(await primary.page.getByLabel("Your answer").inputValue() === saveExitDraft, "Emergency exit recovery did not return the last server-confirmed draft.");
      return { failedSaveStayed: true, emergencyBounded: true };
    });

    await checkpoint("two same-Worker tabs conflict without silent overwrite and resolve deterministically", async () => {
      tabTwo = await primary.context.newPage();
      const tabTwoErrors = trackErrors(tabTwo, "worker-a-tab-two");
      errorLogs.push(tabTwoErrors);
      captureAssessmentTraffic(tabTwo, traffic);
      await goto(tabTwo, `/worker/assessments/${attemptId}`);
      await tabTwo.getByText("Question 1 of 2", { exact: true }).waitFor({ timeout: 20_000 });
      assert(await tabTwo.getByLabel("Your answer").inputValue() === saveExitDraft, "Second tab did not begin from the same acknowledged revision.");

      await primary.page.getByLabel("Your answer").fill(tabAValue);
      await waitForSaved(primary.page);
      await tabTwo.getByLabel("Your answer").fill(tabBLosingValue);
      await tabTwo.getByRole("button", { name: "Use saved version", exact: true }).waitFor({ state: "visible", timeout: 20_000 });
      await tabTwo.getByRole("button", { name: "Use saved version", exact: true }).click();
      assert(await tabTwo.getByLabel("Your answer").inputValue() === tabAValue, "Use saved version did not restore the authoritative server draft.");

      await primary.page.getByLabel("Your answer").fill(tabANewerValue);
      await waitForSaved(primary.page);
      await tabTwo.getByLabel("Your answer").fill(tabBReplacement);
      await tabTwo.getByRole("button", { name: "Replace saved version with this tab", exact: true }).waitFor({ state: "visible", timeout: 20_000 });
      await tabTwo.getByRole("button", { name: "Replace saved version with this tab", exact: true }).click();
      await waitForSaved(tabTwo);
      assert(await tabTwo.getByLabel("Your answer").inputValue() === tabBReplacement, "Explicit replacement did not preserve the selected tab value.");
      await tabTwo.reload({ waitUntil: "domcontentloaded" });
      assert(await tabTwo.getByLabel("Your answer").inputValue() === tabBReplacement, "Explicit replacement was not durable on reload.");
      return { staleConflictControlled: true, explicitResolutionDurable: true };
    });

    await checkpoint("Next deletes current draft and delayed old-position autosave cannot recreate it", async () => {
      await primary.page.reload({ waitUntil: "domcontentloaded" });
      await primary.page.getByText("Question 1 of 2", { exact: true }).waitFor({ timeout: 20_000 });
      assert(await primary.page.getByLabel("Your answer").inputValue() === tabBReplacement, "Primary tab did not refresh to latest server revision before stale-save probe.");

      const pathPattern = `**/worker/assessments/${attemptId}**`;
      let releaseDelayed;
      let interceptionResolved = false;
      let resolveIntercepted;
      const intercepted = new Promise((resolve) => {
        resolveIntercepted = resolve;
      });
      await primary.page.route(pathPattern, async (route) => {
        if (route.request().method() !== "POST" || interceptionResolved) {
          await route.continue();
          return;
        }
        interceptionResolved = true;
        const release = new Promise((resolve) => {
          releaseDelayed = resolve;
        });
        resolveIntercepted();
        await release;
        await route.continue();
      });

      await primary.page.getByLabel("Your answer").fill(staleOldPositionValue);
      await Promise.race([
        intercepted,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Old-position autosave was not intercepted.")), 5_000))
      ]);

      await tabTwo.reload({ waitUntil: "domcontentloaded" });
      assert(await tabTwo.getByLabel("Your answer").inputValue() === tabBReplacement, "Committing tab did not retain the last acknowledged q1 draft.");
      await tabTwo.getByRole("button", { name: "Next", exact: true }).click();
      await tabTwo.getByText("Question 2 of 2", { exact: true }).waitFor({ timeout: 20_000 });
      await tabTwo.getByText(DECIMAL_PROMPT, { exact: true }).waitFor({ timeout: 20_000 });
      assert(typeof releaseDelayed === "function", "Delayed autosave release was unavailable after interception.");
      releaseDelayed();
      await primary.page.unroute(pathPattern);
      await primary.page.waitForTimeout(1_000);

      await tabTwo.reload({ waitUntil: "domcontentloaded" });
      await tabTwo.getByText("Question 2 of 2", { exact: true }).waitFor({ timeout: 20_000 });
      assert(await tabTwo.getByLabel("Your answer").inputValue() === "", "Delayed q1 autosave recreated an old-position draft on q2.");
      await assertNoAssessmentSecrets(tabTwo, traffic);
      await tabTwo.screenshot({ path: `${artifactsDir}/question-2-after-stale-save.png`, fullPage: true, caret: "initial" });
      return { advancedExactlyOne: true, staleOldPositionRejected: true };
    });

    await checkpoint("partial DECIMAL draft survives reload and final submission leaves no visible draft", async () => {
      const input = tabTwo.getByLabel("Your answer");
      await input.fill(partialDecimal);
      await waitForSaved(tabTwo);
      await tabTwo.reload({ waitUntil: "domcontentloaded" });
      await tabTwo.getByText("Question 2 of 2", { exact: true }).waitFor({ timeout: 20_000 });
      assert(await tabTwo.getByLabel("Your answer").inputValue() === partialDecimal, "Partial numeric edit state was coerced or lost on reload.");
      await assertNoPersistentBrowserAnswer(tabTwo, browserSentinels);
      await tabTwo.getByLabel("Your answer").fill(finalDecimal);
      await waitForSaved(tabTwo);
      await tabTwo.getByRole("button", { name: "Submit assessment", exact: true }).click();
      await tabTwo.getByText("Assessment submitted", { exact: true }).waitFor({ timeout: 20_000 });
      await tabTwo.getByText("Submission received. You may leave this page safely.", { exact: true }).waitFor({ timeout: 20_000 });
      await assertNoAssessmentSecrets(tabTwo, traffic);
      await tabTwo.screenshot({ path: `${artifactsDir}/submitted.png`, fullPage: true, caret: "initial" });
      return { partialDecimalRecovered: true, submitted: true };
    });

    await checkpoint("browser storage and retained traffic stay bounded after submission", async () => {
      const storage = await assertNoPersistentBrowserAnswer(tabTwo, browserSentinels);
      const safeTraffic = traffic.map((record) => ({
        kind: record.kind,
        url: record.url,
        ...(record.status ? { status: record.status } : {}),
        ...(record.contentType ? { contentType: record.contentType } : {}),
        bodyLength: record.body.length
      }));
      await writeFile(`${artifactsDir}/traffic-summary.json`, JSON.stringify(safeTraffic, null, 2));
      return { ...storage, trafficRecords: safeTraffic.length };
    });

    assertNoUnexpectedBrowserErrors(errorLogs);
  } finally {
    await writeFile(`${artifactsDir}/results.json`, JSON.stringify(results, null, 2));
    if (primary?.context) await primary.context.close();
    await browser.close();
  }
}

async function verifyBrowserScenario() {
  const environment = readProjectEnvironment();
  const state = JSON.parse(await readFile(`${artifactsDir}/state.json`, "utf8"));
  assert(state.attemptId, "M2.08 browser verification state is missing attemptId.");
  const database = await openScriptDatabase(environment);
  try {
    const attempt = await database.query(
      `SELECT status,current_position,question_count FROM assessment_attempts WHERE attempt_id=$1`,
      [state.attemptId]
    );
    assert(attempt.rows.length === 1, "M2.08 browser verification could not find the assessment attempt.");
    const row = attempt.rows[0];
    assert(row.status === "SUBMITTED", `Final browser attempt status is ${row.status}, expected SUBMITTED.`);
    assert(Number(row.current_position) === 2 && Number(row.question_count) === 2, "Final browser attempt did not finish at question 2 of 2.");

    const committed = await database.query(
      `SELECT COUNT(*)::int AS count FROM assessment_attempt_answers WHERE attempt_id=$1`,
      [state.attemptId]
    );
    const drafts = await database.query(
      `SELECT COUNT(*)::int AS count FROM assessment_attempt_drafts WHERE attempt_id=$1`,
      [state.attemptId]
    );
    assert(Number(committed.rows[0]?.count) === 2, "Browser journey did not commit exactly two answers.");
    assert(Number(drafts.rows[0]?.count) === 0, "Final submitted browser attempt retained an M2.08 draft row.");

    const verification = {
      submitted: true,
      currentPosition: 2,
      questionCount: 2,
      committedAnswers: 2,
      draftsRemaining: 0
    };
    await writeFile(`${artifactsDir}/verification.json`, JSON.stringify(verification, null, 2));
    console.log("PASS M2.08 post-browser database verification");
  } finally {
    await database.close();
  }
}

if (process.argv.includes("--seed-only")) {
  await seedBrowserScenario();
} else if (process.argv.includes("--verify-only")) {
  await verifyBrowserScenario();
} else {
  await runBrowserJourney();
}
