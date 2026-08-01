import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "src/app/worker/login/page.tsx",
  "src/app/worker/(portal)/layout.tsx",
  "src/app/worker/(portal)/dashboard/page.tsx",
  "src/app/worker/(portal)/dashboard/loading.tsx",
  "src/app/worker/(portal)/dashboard/error.tsx",
  "src/app/verify/worker/[workerId]/page.tsx"
];

const missing = requiredFiles.filter((path) => !existsSync(resolve(path)));
if (missing.length > 0) {
  console.error(`Missing required Worker Portal files:\n${missing.join("\n")}`);
  process.exit(1);
}

const shell = readFileSync(resolve("src/components/worker/worker-shell.tsx"), "utf8");
for (const label of ["Exit portal", "Sign out"]) {
  if (!shell.includes(label)) {
    console.error(`Worker shell is missing the required control: ${label}`);
    process.exit(1);
  }
}

const session = readFileSync(resolve("src/lib/auth/worker-session.ts"), "utf8");
if (!session.includes('role: "worker"')) {
  console.error("Worker session is not explicitly bound to the worker role.");
  process.exit(1);
}

console.log("Worker Portal route and isolation manifest passed.");
