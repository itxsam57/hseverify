import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path) {
  return readFileSync(resolve(path), "utf8");
}

const historicalScanMigration = source(
  "database/migrations/0013_secure_file_malware_scan.up.sql"
);
const checksum = createHash("sha256")
  .update(historicalScanMigration, "utf8")
  .digest("hex");

// Diagnostic only until the accepted old -> new checksum repair is pinned.
console.error(`S4_0013_CURRENT_CHECKSUM=${checksum}`);
assert.equal(
  checksum,
  "PENDING_APPROVED_S4_CHECKSUM",
  "Pin the exact widened 0013 checksum before S4 can proceed."
);
