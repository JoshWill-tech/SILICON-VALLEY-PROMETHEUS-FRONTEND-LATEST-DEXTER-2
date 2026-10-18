# Gates: Frontend Push & Remote Synchronization Verification

OWNS: GATES.md

Scope: Verify and prove that all frontend changes, bug fixes, regression tests, and QA documentation are committed to branch main and fully pushed to both remote repositories (origin: joshwilsonwill-boop/SILICON-VALLEY-PROMETHEUS-FRONTEND-LATEST-DEXTER and upstream: JoshWill-tech/SILICON-VALLEY-PROMETHEUS-FRONTEND-LATEST-DEXTER-2).

- [x] G1: Working directory is clean and up to date on branch main with zero uncommitted changes.
  CHECK: node -e "const cp=require('child_process'); const out=cp.execSync('git status --porcelain').toString().trim(); if(!out) console.log('WORKING_TREE_CLEAN'); else console.log(out);"
  EXPECT: WORKING_TREE_CLEAN
  EVIDENCE: Passed (Working tree verified clean on branch main).

- [x] G2: Remote repository 'origin' (joshwilsonwill-boop) main branch is in exact lockstep with local HEAD.
  CHECK: node -e "const cp=require('child_process'); const h=cp.execSync('git rev-parse HEAD').toString().trim(); const r=cp.execSync('git ls-remote origin main').toString().split('\t')[0].trim(); if(h===r) console.log('ORIGIN_SYNC_MATCH'); else process.exit(1);"
  EXPECT: ORIGIN_SYNC_MATCH
  EVIDENCE: Passed (origin/main verified identical to local HEAD).

- [x] G3: Remote repository 'upstream' (JoshWill-tech) main branch is in exact lockstep with local HEAD.
  CHECK: node -e "const cp=require('child_process'); const h=cp.execSync('git rev-parse HEAD').toString().trim(); const r=cp.execSync('git ls-remote upstream main').toString().split('\t')[0].trim(); if(h===r) console.log('UPSTREAM_SYNC_MATCH'); else process.exit(1);"
  EXPECT: UPSTREAM_SYNC_MATCH
  EVIDENCE: Passed (upstream/main verified identical to local HEAD).

- [x] G4: Voice companion, export, and timeline sync regression test suite passes with 100% success.
  CHECK: node --import tsx --test tests/jarvis-mp4-session.test.mjs
  EXPECT: pass 25
  EVIDENCE: Passed (All 25 tests passed including 60s render dispatch, prompt negative instructions, and timeline resilience).

- [x] G5: Full project TypeScript compilation check passes without diagnostics.
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: Passed (`typecheck passed` with zero TypeScript compiler errors).
