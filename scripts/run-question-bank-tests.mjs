import { spawnSync } from "node:child_process";
for(const args of [["--test","tests/platform/question-bank-contract.test.mjs"],["scripts/run-question-bank-runtime-tests.mjs"]]){const r=spawnSync(process.execPath,args,{stdio:"inherit"});if(r.status!==0)process.exit(r.status??1);}
