# Gates: Frontend Push & Remote Synchronization Verification

OWNS: GATES.md

Scope: Verify and prove that all source replacement quota fixes, database migrations, regression tests, and QA documentation are committed to branch main and fully pushed to the primary remote repository (origin: joshwilsonwill-boop/SILICON-VALLEY-PROMETHEUS-FRONTEND-LATEST-DEXTER).

- [x] G1: Working directory is clean and up to date on branch main with zero uncommitted changes.
  CHECK: node -e "const cp=require('child_process'); const out=cp.execSync('git status --porcelain').toString().trim(); if(!out) console.log('WORKING_TREE_CLEAN'); else console.log(out);"
  EXPECT: WORKING_TREE_CLEAN
  EVIDENCE: Passed (Working tree verified clean on branch main).

- [x] G2: Remote repository 'origin' (joshwilsonwill-boop) main branch is in exact lockstep with local HEAD.
  CHECK: node -e "const cp=require('child_process'); const h=cp.execSync('git rev-parse HEAD').toString().trim(); const r=cp.execSync('git ls-remote origin main').toString().split('\t')[0].trim(); if(h===r) console.log('ORIGIN_SYNC_MATCH'); else process.exit(1);"
  EXPECT: ORIGIN_SYNC_MATCH
  EVIDENCE: Passed (origin/main commit e845bc7 verified identical to local HEAD).

- [x] G3: Full source upload and replacement test suite passes with 100% success.
  CHECK: npm run test:source-upload
  EXPECT: pass 17
  EVIDENCE: Passed (17/17 tests passing, including replacement quota deduction and prior session aborting).

- [x] G4: Full project TypeScript compilation check passes without diagnostics.
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: Passed (`typecheck passed` with zero TypeScript compiler diagnostics).
