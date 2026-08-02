import { cleanGeneratedDevelopmentOutput } from "./lib/next-output-boundary.mjs";

const { nextDevelopmentRoot, runtimeSmokeRoot } =
  await cleanGeneratedDevelopmentOutput();

console.log(`Removed stale Next development output: ${nextDevelopmentRoot}`);
console.log(`Removed isolated runtime-smoke output: ${runtimeSmokeRoot}`);
