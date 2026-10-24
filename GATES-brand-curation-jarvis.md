# Gates: Neil Patel Search, Cross-Platform On-The-Go Recommendations, Jarvis Pop-Up & Feed Curation

OWNS: GATES-brand-curation-jarvis.md, lib/creators/creator-recommendations.ts, lib/creators/video-catalog.ts, components/assets/brand-search-autocomplete.tsx, components/assets/jarvis-assistant-modal.tsx, components/assets/liquid-glass-search.tsx, components/assets/library-collection.tsx, tests/brand-curation-jarvis.test.mjs

Scope: Enable cross-platform (YouTube, Instagram, Web) and related creator recommendations on the go when typing queries like "Neil Patel", wire the search voice icon to launch the Jarvis Creative Intelligence Assistant modal, and dynamically optimize the asset library feed to reflect the selected creator's inspiration, video archetypes, style DNA, and inspiration network.

- [ ] G1: Cross-platform creator recommendation engine resolves YouTube, Instagram, and related creator networks on the go.
  CHECK: node --import tsx --test --test-name-pattern="creator-recommendations engine" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: pending

- [ ] G2: Creator video catalog contains verified Neil Patel signature video archetypes and frameworks.
  CHECK: node --import tsx --test --test-name-pattern="Neil Patel signature video catalog" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: pending

- [ ] G3: Liquid-glass autocomplete pop-up renders platform pills and related channel recommendations.
  CHECK: node --import tsx --test --test-name-pattern="brand search autocomplete component" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: pending

- [ ] G4: Jarvis Voice Assistant modal triggers from voice waveform icon with audio visualizer and contextual creator intelligence.
  CHECK: node --import tsx --test --test-name-pattern="Jarvis assistant modal integration" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: pending

- [ ] G5: Asset library feed optimizes dynamically to display creator archetypes, Style DNA, and inspiration network.
  CHECK: node --import tsx --test --test-name-pattern="library collection feed dynamic optimization" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: pending

- [ ] G6: Complete brand curation and Jarvis regression test suite passes 100%.
  CHECK: node --import tsx --test tests/brand-curation-jarvis.test.mjs
  EXPECT: all brand curation and jarvis tests passed
  EVIDENCE: pending

- [ ] G7: Changed production and test modules pass TypeScript check cleanly.
  CHECK: node --max-old-space-size=4096 node_modules/typescript/bin/tsc --noEmit
  EXPECT: 0
  EVIDENCE: pending
