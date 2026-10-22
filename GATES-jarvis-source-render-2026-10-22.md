# Gates: Jarvis attached source to finished render

Scope: Fix the reported saved-source rejection and verify Jarvis can carry the attached source through a tracked render to a playable, downloadable MP4. Earlier quota unit tests alone do not establish this outcome.

OWNS: GATES-jarvis-source-render-2026-10-22.md, lib/projects/source-asset.ts, lib/projects/service.ts, app/api/projects/[id]/exports/route.ts, components/editor/editorial-delivery-studio.tsx, tests/jarvis-source-registration.test.ts, tests/jarvis-render-receipts.test.ts, tests/jarvis-end-to-end-session.test.mjs, tests/jarvis-mp4-session.test.mjs, tests/project-lifecycle-services.test.mjs, tests/source-render-readiness.test.ts, package.json, .github/workflows/source-upload-regression.yml, .tmp/jarvis-render-20261022/**

- [x] G1: Reproduce and identify the actual source-attachment or saved-source failure at the production code boundary
  EVIDENCE: Session (20) records repeated missing registration after reattachment. A real ProjectService plus GET/POST export-route fixture reproduced an editor-recovered saved source reported missing by readiness and rejected as changed by dispatch: 5 failed, 3 controls passed before fixing; all 8 passed after. The actual delivery component's registered callback separately produced 10 expected assertion failures and 1 positive control: false dispatch after blocked/failed submissions, false preview receipt, and duplicate concurrent submissions. Initial CSS harness failures were corrected before recording that reproduction.

- [x] G2: Repair the identified cause while preserving project/source ownership, replacement-upload guards, and truthful render receipts
  CHECK: npm run test:jarvis-render
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=3e088b7fca521341053927219876f5c561d2f6761474c55328e5e4a593f4e6c0; exit=0; EXPECT=matched; output-sha256=3eb7f4a604bcb52de6b19c1a682633e9b64cb00ed688f124549d033532e46b2e; output-bytes=15517; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [ ] G3: Verify the affected or explicitly identified diagnostic source is durably registered and its real stored video is readable
  EVIDENCE: Pending authenticated live source/project evidence. Object inventory alone is insufficient.

- [ ] G4: Run the actual Jarvis render path and verify its tracked job finishes with a playable, downloadable MP4
  EVIDENCE: Pending. A mocked dispatcher, queued job, source-copy placeholder, or Motion preview cannot satisfy this gate.

- [x] G8: Existing upload and quota-handler regressions still pass with the source resolver changes
  CHECK: npm run test:source-upload
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=5e9625fbca36d7a3b219746ceb5e5289cfac94824a802d673583e1548c1da057; exit=0; EXPECT=matched; output-sha256=3de8d47141e77ebcd7863081e48b7bf94759fea0aa167d4db9ee0c78b6038f42; output-bytes=7222; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G5: The full application typecheck passes on the final source
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=b1f4bb997a1386556f4e4d5acc883d881fd44a425b32e4d71925cb4bab048fd0; exit=0; EXPECT=matched; output-sha256=88603ae6d0804b467cf0223e64644258397c61d0119a5876e07565cc5b2dd279; output-bytes=17; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G7: The production application builds with the final scoped changes
  CWD: .tmp/jarvis-render-20261022/validation
  CHECK: set "NODE_OPTIONS=--max-old-space-size=4096" && npm run build > ..\production-build.log 2>&1 && type ..\production-build.log
  EXPECT: Finalizing page optimization
  EVIDENCE: automatic-evidence=v1; definition-sha256=205880ffd9ad007264ea0a42d8a75eeb02e898b35a03b40214a28037ac3cf83a; exit=0; EXPECT=matched; output-sha256=ec0b1ad4156ba4e7552c02aeb1f60b1cbb84fbf7b60d2ba671ea505b7d2d0aaf; output-bytes=6357; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS\.tmp\jarvis-render-20261022\validation; path=ca81aa2e5d24/38 entries

- [x] G6: Changed runtime and regression files introduce no lint errors
  CHECK: node node_modules/eslint/bin/eslint.js lib/projects/source-asset.ts lib/projects/service.ts "app/api/projects/[id]/exports/route.ts" components/editor/editorial-delivery-studio.tsx tests/jarvis-source-registration.test.ts tests/jarvis-render-receipts.test.ts tests/jarvis-end-to-end-session.test.mjs tests/jarvis-mp4-session.test.mjs tests/project-lifecycle-services.test.mjs tests/source-render-readiness.test.ts --format json
  EXPECT: "errorCount":0
  EVIDENCE: automatic-evidence=v1; definition-sha256=437ee2c1fef31a629f8bafdb152cb1af5b5f74932f37b174e2ca474304dc994f; exit=0; EXPECT=matched; output-sha256=93099bba8f290f9be7b02c32cc0259ca3e0f14af05a0c0b868f274e4374c925e; output-bytes=49784; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [ ] G9: The final diff, source snapshot, and CI integration preserve unrelated work and contain no secret, auth-policy, billing, or dependency changes
  EVIDENCE: Workflow YAML parses and both event filters include the new regression paths; final review and snapshot comparison are pending.

- [ ] G10: Full repository lint findings are reviewed against the unchanged baseline
  EVIDENCE: Pending a completed full scan on the final snapshot. Passing scoped lint alone is not a full-repository verdict.
