# Gates: Jarvis filament visibility

OWNS: components/navigation/jarvis-top-nav-filament.tsx, tests/jarvis-filament-visibility.test.mjs, GATES-jarvis-filament.md, docs/qa/jarvis-filament-2026-10-17.md

Scope: Reproduce the missing Jarvis graphic, repair its SVG rendering, and verify visibility and animation without changing voice behavior.

- [x] G1: The real filament SVG paints a visible line while idle and with reduced motion, and animates while listening and speaking.
  CHECK: node --test --test-reporter=tap tests/jarvis-filament-visibility.test.mjs
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=971b5e909b1d44856fec55b2a9d7b11ab44ee0df437f50ef83177a8f9aa5cf32; exit=0; EXPECT=matched; output-sha256=b3a325448334e8ff0f583cf848dce7a7599c28fc810fbc6404435117303b9cd1; output-bytes=1314; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=d41a910b3480/38 entries

- [x] G2: The changed component and regression test have no lint errors.
  CHECK: node node_modules/eslint/bin/eslint.js components/navigation/jarvis-top-nav-filament.tsx tests/jarvis-filament-visibility.test.mjs
  EXPECT: /^$/
  EVIDENCE: automatic-evidence=v1; definition-sha256=6a311ea2ceb5b776560234535dc0f1ed262f3890210c710f0d285a068515920e; exit=0; EXPECT=matched; output-sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855; output-bytes=0; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=d41a910b3480/38 entries

- [x] G3: Project typechecking passes.
  CHECK: npm run typecheck
  EXPECT: typecheck
  EVIDENCE: automatic-evidence=v1; definition-sha256=76388f26347f05e1f895f0972f35b7f88220aceefeccd7b739f0da5db21ef179; exit=0; EXPECT=matched; output-sha256=2c4af01fb1a5f9597841244575659986624ce8ada13bbc89dce9491fd48c4a46; output-bytes=93; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=d41a910b3480/38 entries

- [ ] G4: Production build and repository lint results are compared with the baseline and any pre-existing failures are documented.
  EVIDENCE: pending

- [ ] G5: The original invisible flat-line rendering is demonstrated and the final rendered SVG and animation lifecycle are reviewed.
  EVIDENCE: Before the production fix, actual component/SVG raster tests passed 4 animated cases and failed 3 flat-line visibility cases (idle and reduced-motion listening/speaking). After the fix all 7 passed, including independent core/glow rasterization, an invisible control, and animation-frame cleanup. Voice services and reduced-motion input are isolated; live browser connection attempts timed out. See docs/qa/jarvis-filament-2026-10-17.md.
