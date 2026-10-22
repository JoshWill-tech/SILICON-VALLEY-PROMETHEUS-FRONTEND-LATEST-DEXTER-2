# Gates: Brand Discovery Animation & Resolution Rectification

OWNS: components/assets/brand-voice-path-animation.tsx, components/assets/library-collection.tsx, lib/brand/resolve.ts, app/api/brand/resolve/route.ts, tests/brand-resolve.test.mjs, GATES-brand-discovery-repair.md

Scope: Fix brand search voice path animation so it initializes from the start point (-75%) rather than flashing at 1.6%, animates smoothly along the roller-coaster curve, and properly resolves real brand and creator metadata via the backend (e.g. YouTube oEmbed for watch/shorts URLs, website metadata, social handles) instead of outputting raw URL query strings like Watch?v=....

- [x] G1: Brand resolution correctly identifies YouTube videos, creators, handles, and websites without raw parameter leakage.
  CHECK: node --import tsx --test tests/brand-resolve.test.mjs
  EXPECT: resolveBrand YouTube watch test passed: Lock In Music

- [x] G2: Brand voice path animation geometry, dynamic puns, and library collection integration tests pass.
  CHECK: node --import tsx --test tests/brand-voice-animation-path.test.mjs
  EXPECT: all brand voice animation tests passed

- [x] G3: Runtime DOM lifecycle preserves animation on search click, starts from start point, and transitions smoothly.
  CHECK: node --test tests/brand-discovery-animation.test.mjs
  EXPECT: brand discovery runtime checks passed

- [x] G4: Brand search prompts and canvas interaction regressions remain green.
  CHECK: node --import tsx --test tests/brand-search-prompts-regression.test.mjs tests/brand-canvas-interaction-regression.test.mjs
  EXPECT: brand canvas interaction regression checks passed

- [x] G5: TypeScript type checking accepts all modified and new brand files across the codebase.
  CHECK: npm run typecheck
  EXPECT: typecheck passed

- [x] G6: ESLint accepts all changed brand sources and test files with zero errors.
  CHECK: node --max-old-space-size=1024 node_modules/eslint/bin/eslint.js components/assets/brand-voice-path-animation.tsx components/assets/library-collection.tsx lib/brand/resolve.ts app/api/brand/resolve/route.ts tests/brand-resolve.test.mjs
  EXPECT: 0
