# Gates: Agentic Creator Resolution & Voice Search Routing

OWNS: lib/brand/resolve.ts, lib/creators/creator-recommendations.ts, lib/creators/video-catalog.ts, components/assets/liquid-glass-search.tsx, components/assets/library-collection.tsx, tests/agentic-creator-resolution.test.mjs, tests/voice-search-routing.test.mjs, GATES-agentic-creator-resolution.md

Scope: Implement agentic entity harness resolving spoken/typed creator names (e.g. Gary V) into canonical YouTube and Instagram URLs, extracting videos and style DNA as if a direct reference URL was input, and routing voice typing via useVoiceInput in the search bar.

- [x] G1: Agentic harness resolves Gary V and top creators to canonical YouTube & Instagram URLs with extracted videos
  CHECK: node --import tsx --test tests/agentic-creator-resolution.test.mjs
  EXPECT: pass 2
  EVIDENCE: verified exit 0, pass 2

- [x] G2: Voice typing input and recommendation selection routing in LiquidGlassSearch and LibraryCollection
  CHECK: node --import tsx --test tests/voice-search-routing.test.mjs
  EXPECT: pass 3
  EVIDENCE: verified exit 0, pass 3

- [x] G3: Existing brand resolution regression suite passes without regression
  CHECK: node --import tsx --test tests/brand-resolve.test.mjs
  EXPECT: pass 4
  EVIDENCE: verified exit 0, pass 4

- [x] G4: Full TypeScript typecheck passes
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: verified exit 0, typecheck passed
