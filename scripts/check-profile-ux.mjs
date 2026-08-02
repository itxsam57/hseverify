import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const layout = readFileSync(resolve("src/app/layout.tsx"), "utf8");
const profileCss = readFileSync(resolve("src/app/profile.css"), "utf8");

if (!layout.includes('import "@/app/profile.css"')) {
  console.error("Root layout does not load the Worker Profile stylesheet.");
  process.exit(1);
}

const requiredMarkers = [
  '.profile-field input:not([type="hidden"]):not([type="checkbox"])',
  ".profile-field select",
  ".profile-field textarea",
  "border: 1px solid #aebdc8",
  ":focus",
  ".profile-field-error",
  ".profile-checkbox",
  "@media (max-width: 760px)"
];

for (const marker of requiredMarkers) {
  if (!profileCss.includes(marker)) {
    console.error(`Worker Profile UX stylesheet is missing: ${marker}`);
    process.exit(1);
  }
}

if (/border:\s*0[^;]*;/.test(profileCss.match(/\.profile-field input[\s\S]*?\}/)?.[0] ?? "")) {
  console.error("Worker Profile text inputs must not remove their visible border.");
  process.exit(1);
}

console.log(
  "Worker Profile fields have visible input, select, textarea, focus, error and responsive styling."
);
