import{spawnSync}from"node:child_process";const r=spawnSync(process.execPath,['--test','tests/platform/evidence-review-queue-contract.test.mjs'],{stdio:'inherit'});process.exit(r.status??1);
