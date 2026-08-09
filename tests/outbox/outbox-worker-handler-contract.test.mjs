import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

test("shared outbox worker adapts notification dependencies separately from trusted email lease", async () => {
  const worker = await readFile(
    resolve("src/lib/outbox/outbox-worker.ts"),
    "utf8"
  );

  assert.match(
    worker,
    /"notification\.portal\.foundation": async \(job\) =>\s*projectNotificationOutboxJob\(job\)/
  );
  assert.doesNotMatch(
    worker,
    /"notification\.portal\.foundation": projectNotificationOutboxJob/
  );
  assert.match(
    worker,
    /"email\.delivery\.foundation": async \(job, lease\) =>\s*processEmailDeliveryOutboxJob\(job, lease\)/
  );
  assert.doesNotMatch(
    worker,
    /projectNotificationOutboxJob\(job,\s*lease\)/
  );
  assert.match(worker, /handler\(claimed\.job, claimed\.lease\)/);
});
