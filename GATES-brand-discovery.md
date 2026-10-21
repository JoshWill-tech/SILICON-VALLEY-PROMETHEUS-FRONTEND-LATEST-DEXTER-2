# Gates: Submitted brand discovery animation

OWNS: components/assets/library-collection.tsx, components/assets/liquid-glass-search.tsx, components/assets/brand-voice-path-animation.tsx, tests/brand-discovery-animation.test.mjs, tests/brand-voice-animation-path.test.mjs, tests/brand-search-prompts-regression.test.mjs, tests/brand-canvas-interaction-regression.test.mjs, GATES-brand-discovery.md, .tmp/brand-discovery-lint.log

Scope: Show the brand animation only for an intentional nonempty submission, reset it on edits, and automatically rotate relevant brand identity and preference messages.

Baseline findings: The initial full build exhausted its roughly 512 MB Node heap; verification below uses a 4096 MB heap. Existing brand regression assertions expected the old Apply label encoding and removed canvas voice choices / fixed gradient class; those assertions now check the current Apply label, unavailable voice state, and palette configuration. No canvas product code was changed.

Final scope review: The shared checkout's animation changes were committed and shipped by another task as 08c227f53f00c351074437543e8dd9eddfa4eca6 (7 source/test files, +197/-60), while this task retained local validation ownership. Independently inspected GitHub's combined status for that exact SHA: Vercel production deployment succeeded at https://vercel.com/joshwilsonwill-7779s-projects/silicon-valley-prometheus-frontend-latest-dexter/7MUCCF1xqc9Me6gExz7zSQbJYjMZ. Local runtime tests, brand regressions, typecheck, production build, and changed-file lint passed. Unrelated Jarvis files are being edited concurrently and were left untouched by this task.

Repository lint handoff: `.tmp/brand-discovery-lint.log` records 10 errors across LiquidCarveButton, mini-run-comparison, jarvis-top-nav-filament, project-details-modal, the vendored liquidGL script, editorial-split-persistence, and safe-response-and-sanitizer. All are outside this task's changed brand files; the Jarvis file also belongs to concurrent work. G4 is explicitly abandoned for separate repository owners rather than claiming whole-repository lint success. G6 verifies every shipped brand source/test file without disabling rules.

- [x] G1: Runtime interactions keep the animation hidden before submission and after edits, support click and Enter submissions, and rotate contextual copy without repeating it.
  CHECK: set "NODE_OPTIONS=--max-old-space-size=4096" && node --test tests/brand-discovery-animation.test.mjs
  EXPECT: brand discovery runtime checks passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=09b542768eccd5153e9de5ba10160a1dc76e310de708df0c59f6bcb3622b8f1f; exit=0; EXPECT=matched; output-sha256=b55e787e59188159b3f67e32e107fd9ad5bd15abee97d37b1fd6538df69da983; output-bytes=232; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G2: Existing brand geometry, search, canvas, and studio regressions remain green.
  CHECK: node --import tsx --test tests/brand-voice-animation-path.test.mjs tests/brand-search-prompts-regression.test.mjs tests/brand-canvas-interaction-regression.test.mjs tests/brand-dna-studio-regression.test.mjs
  EXPECT: all brand voice animation tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=4c967d668eb5fb33edea4861b5b195904c40f43af6a084c648766138aba97351; exit=0; EXPECT=matched; output-sha256=137b49d50a36e50bb6ee5a47892cc58185d86e775b4b6c8e3b027aed55167e3a; output-bytes=819; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G3: The project type checker accepts the updated components.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=9aeeb689bde5257e0a85c8ecb0aad3fdaf9ace3e9e5076bbf6758c22760ccfe3; exit=0; EXPECT=matched; output-sha256=2c4af01fb1a5f9597841244575659986624ce8ada13bbc89dce9491fd48c4a46; output-bytes=93; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [ ] G4: Project lint completes successfully.
  CHECK: set "NODE_OPTIONS=--max-old-space-size=4096" && npm run lint -- --quiet > .tmp/brand-discovery-lint.log 2>&1 && echo brand discovery lint passed
  EXPECT: brand discovery lint passed
  EVIDENCE: pending

ABANDON: G4 Whole-repository lint has 10 errors outside the changed brand files, including a Jarvis file owned by concurrent work. Separate owners must resolve those errors; the complete diagnostic log is .tmp/brand-discovery-lint.log. Every shipped brand file is checked by G6.

- [x] G6: ESLint accepts every shipped brand source and regression test file.
  CHECK: node --max-old-space-size=1024 node_modules/eslint/bin/eslint.js components/assets/brand-voice-path-animation.tsx components/assets/library-collection.tsx components/assets/liquid-glass-search.tsx tests/brand-canvas-interaction-regression.test.mjs tests/brand-search-prompts-regression.test.mjs tests/brand-voice-animation-path.test.mjs tests/brand-discovery-animation.test.mjs && echo brand changed files lint passed
  EXPECT: brand changed files lint passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=b8b3eb3d87ced5204877d15fde306b42336ba92a180ab1a0d12245de2fe602db; exit=0; EXPECT=matched; output-sha256=724173d1c69d0fb8468eee4dd8d958d8b410afcef23810aff308929caca9908e; output-bytes=33; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G5: The production application builds successfully.
  CHECK: set "NODE_OPTIONS=--max-old-space-size=4096" && npm run build
  EXPECT: postbuild
  EVIDENCE: automatic-evidence=v1; definition-sha256=884d7562fd118ba6cbd84f6d65e8fe8e08394fc0a8e999a338b6eaa17d062b75; exit=0; EXPECT=matched; output-sha256=8058ba206ae9c40e1ea4518343bdd5f166bb5a156ad4ccb2e1ab30aa144ff543; output-bytes=5583; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries
