# Gates: Frontend Push & Remote Synchronization Verification

OWNS: GATES.md

Scope: Verify and prove that all source replacement quota fixes, database migrations, regression tests, and QA documentation are committed to branch main and fully pushed to both remote repositories (origin: joshwilsonwill-boop/SILICON-VALLEY-PROMETHEUS-FRONTEND-LATEST-DEXTER and upstream: JoshWill-tech/SILICON-VALLEY-PROMETHEUS-FRONTEND-LATEST-DEXTER-2).

- [ ] G1: Working directory is clean and up to date on branch main with zero uncommitted changes.
  CHECK: node -e "const cp=require('child_process'); const out=cp.execSync('git status --porcelain').toString().trim(); if(!out) console.log('WORKING_TREE_CLEAN'); else console.log(out);"
  EXPECT: WORKING_TREE_CLEAN
  EVIDENCE: pending

- [ ] G2: Remote repository 'origin' (joshwilsonwill-boop) main branch is in exact lockstep with local HEAD.
  CHECK: node -e "const cp=require('child_process'); const h=cp.execSync('git rev-parse HEAD').toString().trim(); const r=cp.execSync('git ls-remote origin main').toString().split('\t')[0].trim(); if(h===r) console.log('ORIGIN_SYNC_MATCH'); else process.exit(1);"
  EXPECT: ORIGIN_SYNC_MATCH
  EVIDENCE: pending

- [ ] G3: Remote repository 'upstream' (JoshWill-tech) main branch is in exact lockstep with local HEAD.
  CHECK: node -e "const cp=require('child_process'); const h=cp.execSync('git rev-parse HEAD').toString().trim(); const r=cp.execSync('git ls-remote upstream main').toString().split('\t')[0].trim(); if(h===r) console.log('UPSTREAM_SYNC_MATCH'); else process.exit(1);"
  EXPECT: UPSTREAM_SYNC_MATCH
  EVIDENCE: pending

- [ ] G4: Full source upload and replacement test suite passes with 100% success.
  CHECK: npm run test:source-upload
  EXPECT: pass 17
  EVIDENCE: pending

- [ ] G5: Full project TypeScript compilation check passes without diagnostics.
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: pending
