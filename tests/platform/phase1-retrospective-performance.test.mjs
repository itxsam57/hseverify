import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runner = await readFile("scripts/run-phase1-retrospective-performance.mjs", "utf8");

const requiredPurposeChecks = [
  "Worker registration and authentication concurrency",
  "Tenant-scope concurrency and isolation",
  "M1.05 audit outbox concurrency",
  "M2.02 review claim and terminal-decision races",
  "M2.04 Question Bank stale revision race",
  "M2.05 randomized-form concurrency and non-repetition"
];

test("retrospective performance runner measures every high-risk completed concurrency boundary", () => {
  for (const name of requiredPurposeChecks) {
    assert.match(runner, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(runner, /elapsedMs/);
  assert.match(runner, /performance-concurrency\.json/);
  assert.match(runner, /not a production latency or Internet-scale throughput SLA/i);
});

test("mixed-role real-server burst remains explicitly pending until reusable live sessions are provisioned", () => {
  assert.match(runner, /pendingHttpBurst:\s*true/);
  assert.match(runner, /50-request authenticated mixed-role real-server burst/);
});
