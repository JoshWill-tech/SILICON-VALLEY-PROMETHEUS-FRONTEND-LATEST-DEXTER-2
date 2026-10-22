# Gates: source media quota recovery

OWNS: app/api/user/storage/cleanup/route.ts, app/api/projects/[id]/upload-multipart/initiate/route.ts, lib/r2/project-source-multipart.ts, tests/source-upload-quota-handlers.test.ts, package.json, .github/workflows/source-upload-regression.yml, docs/qa/source-media-quota-diagnosis-2026-10-22.md, docs/qa/source-media-quota-diagnostic-2026-10-22.sql, GATES-source-media-quota-recovery.md, .tmp/source-media-quota/**, .tmp/quota-validation-01a1618d/**

Scope: repair demonstrated source-upload accounting and recovery defects without aborting unrelated active uploads; distinguish local verification from the inaccessible affected live account.

- [x] G1: Actual upload and cleanup handlers enforce active-source accounting, surface failed aborts, and preserve unrelated uploads
  CHECK: node --import tsx --test --test-reporter=tap tests/source-upload-quota-handlers.test.ts
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=280beedde89c088567edc3bf8c16e662a1556a011a4d595fd569e6e8fb77d182; exit=0; EXPECT=matched; output-sha256=f0e0138222bc226ab82580149c14939304194a33f08a5f4ad2b48e48e50ca983; output-bytes=2958; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G2: Existing source upload, replacement, transcription sequencing, and source ownership regressions pass
  CHECK: node --import tsx --test --test-reporter=tap tests/source-replacement-upload.test.ts tests/multipart-upload-runtime.test.ts tests/editor-source-transcript-sequencing.test.mjs tests/editor-source-ownership-and-upload-errors.test.mjs
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=58b410a7a42d2146e370599920fb8a4d07a934066a4589ad62f30644938e3c54; exit=0; EXPECT=matched; output-sha256=d1e1ae50424cce7c954dc59bd983655e7f49defeab62d22fb304b4be12482e7a; output-bytes=4640; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G3: Changed production files and new handler tests introduce no lint errors
  CHECK: node node_modules/eslint/bin/eslint.js app/api/user/storage/cleanup/route.ts app/api/projects/[id]/upload-multipart/initiate/route.ts lib/r2/project-source-multipart.ts tests/source-upload-quota-handlers.test.ts --format json
  EXPECT: "errorCount":0
  EVIDENCE: automatic-evidence=v1; definition-sha256=f8bcf027e10158cd6eb7907e1455b7b8a22927aac321319d16fc53ee34740096; exit=0; EXPECT=matched; output-sha256=6fe3334212f40a7edeb501192e57306ba0e054b324bd16abaa3970e45268cdd2; output-bytes=1121; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G4: The full application typecheck passes after the recovery fixes
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=b1f4bb997a1386556f4e4d5acc883d881fd44a425b32e4d71925cb4bab048fd0; exit=0; EXPECT=matched; output-sha256=88603ae6d0804b467cf0223e64644258397c61d0119a5876e07565cc5b2dd279; output-bytes=17; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G9: The normal source-upload test command includes and passes the real-handler regressions
  CHECK: npm run test:source-upload
  EXPECT: cleanup never claims quota was reclaimed when Supabase returns an abort error
  EVIDENCE: automatic-evidence=v1; definition-sha256=5b60343cd2e22ad6b79e1d9527567264ed96145dda5889a802c96f7e96ca47a1; exit=0; EXPECT=matched; output-sha256=3042efba364062e9bb53e410ac752171af2fc9a87a51a517090bbdd49fe32162; output-bytes=7234; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G5: The production application builds after the recovery fixes
  CWD: .tmp/quota-validation-01a1618d
  CHECK: set "NODE_OPTIONS=--max-old-space-size=4096" && npm run build > ..\source-media-quota\build-worktree.log 2>&1 && type ..\source-media-quota\build-worktree.log
  EXPECT: Finalizing page optimization
  EVIDENCE: automatic-evidence=v1; definition-sha256=97411214850aa51fe5d34b1f7bac2bdefa2c847632206e8160b956bdcdcb21c5; exit=0; EXPECT=matched; output-sha256=35a309e90173a627d7409704c63b0892b334dec7acb37589fbafcd8cd6a4e2fb; output-bytes=5581; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS\.tmp\quota-validation-01a1618d; path=ca81aa2e5d24/38 entries

- [ ] G6: The affected live account's actual database quota and original failed upload have been verified
  EVIDENCE: Public credentials cannot call the quota function, no matching native CLI login was available, and no authenticated affected-project session or failed upload response was supplied. The zero-row relationship query succeeded but cannot establish account usage.

- [x] G7: This task contains scoped fixes, integrated regressions, and an evidence-backed diagnosis while preserving unrelated work
  EVIDENCE: Reviewed all three production diffs (59 additions, 24 removals), the 13-case real-handler suite, the one-line test-script integration, both CI trigger lists, report, and SELECT-only SQL. The workflow parses and its test command is correct. git diff --check passed. Runtime/test/workflow/package files match the successful build snapshot byte-for-byte. This task preserves auth and user filters and changes no schema, billing, dependencies, lockfile, or editor page. Concurrent UI/dependency edits and the pre-existing GATES-vincere-backend-diagnosis.md were preserved.

- [x] G8: Repository-wide lint has a completed result beyond the passing scoped lint check
  EVIDENCE: The isolated checkout's npm run lint -- --format json completed with exit 1 after retrying with NODE_OPTIONS=--max-old-space-size=4096. Parsed all 1,259 results: 10 errors, 81 warnings, 0 fatal errors. All three changed runtime files and the new handler test have 0 errors and 0 warnings. The 10 errors occur in seven files absent from the checkout's git diff/untracked list, establishing they are unchanged baseline findings. Aggregate evidence is in .tmp/source-media-quota/lint-summary.json; raw output and process exit are retained beside it. This completed retry resolves the earlier abandoned scan; repository-wide lint is not green.


ABANDON: G6 Authenticated access to the affected Supabase account or its failed request details is required to determine the original live quota and prove recovery.
