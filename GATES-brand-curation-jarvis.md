# Gates: Neil Patel Search, Cross-Platform On-The-Go Recommendations, Jarvis Pop-Up & Feed Curation

OWNS: GATES-brand-curation-jarvis.md, lib/creators/creator-recommendations.ts, lib/creators/video-catalog.ts, components/assets/brand-search-autocomplete.tsx, components/assets/jarvis-assistant-modal.tsx, components/assets/liquid-glass-search.tsx, components/assets/library-collection.tsx, tests/brand-curation-jarvis.test.mjs

Scope: Enable cross-platform (YouTube, Instagram, Web) and related creator recommendations on the go when typing queries like "Neil Patel", wire the search voice icon to launch the Jarvis Creative Intelligence Assistant modal, and dynamically optimize the asset library feed to reflect the selected creator's inspiration, video archetypes, style DNA, and inspiration network.

- [x] G1: Cross-platform creator recommendation engine resolves YouTube, Instagram, and related creator networks on the go.
  CHECK: node --import tsx --test --test-name-pattern="creator-recommendations engine" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: Verified in tests/brand-curation-jarvis.test.mjs. Neil Patel resolves to YouTube (@neilpatel, 1.25M), Instagram (@neilpatel, 500K+), official website, and related inspiration network (Eric Siu, Brian Dean, GaryVee, Vanessa Lau, HubSpot) with authoritative style DNA and rapid <2s hook pacing.

- [x] G2: Creator video catalog contains verified Neil Patel signature video archetypes and frameworks.
  CHECK: node --import tsx --test --test-name-pattern="Neil Patel signature video catalog" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: Verified in CREATOR_VIDEO_CATALOG['Neil Patel']. Contains 5 signature archetypes: Google #1 ranking masterclass, YouTube channel growth, Instagram Reels strategy, short-form retention blueprint, and agency content playbook.

- [x] G3: Liquid-glass autocomplete pop-up renders platform pills and related channel recommendations.
  CHECK: node --import tsx --test --test-name-pattern="brand search autocomplete component" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: Verified in BrandSearchAutocomplete component. Implements role="listbox", ArrowDown/ArrowUp keyboard navigation, Escape dismissal, platform archetypes (YouTube/Instagram/Web), Inspiration Network cards, and Ask Jarvis quick trigger.

- [x] G4: Jarvis Voice Assistant modal triggers from voice waveform icon with audio visualizer and contextual creator intelligence.
  CHECK: node --import tsx --test --test-name-pattern="Jarvis assistant modal integration" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: Verified in JarvisAssistantModal and LiquidGlassSearch. Waveform button in the search bar is labeled "Ask Jarvis AI assistant" with emerald pulse and launches the modal. Supports two-way voice companion stream, holographic status, contextual greeting, and one-click "Calibrate Video Suite" action.

- [x] G5: Asset library feed optimizes dynamically to display creator archetypes, Style DNA, and inspiration network.
  CHECK: node --import tsx --test --test-name-pattern="library collection feed dynamic optimization" tests/brand-curation-jarvis.test.mjs
  EXPECT: passed
  EVIDENCE: Verified in LibraryCollection. Selecting Neil Patel or applying a brand recommendation immediately renders their signature video archetypes, Style DNA badges, and Inspiration Network related creator cards with one-click spirit ingestion.

- [x] G6: Complete brand curation and Jarvis regression test suite passes 100%.
  CHECK: node --import tsx --test tests/brand-curation-jarvis.test.mjs
  EXPECT: all brand curation and jarvis tests passed
  EVIDENCE: 7/7 tests passed in 1061ms with 0 failures.

- [x] G7: Changed production and test modules pass TypeScript check cleanly.
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: npm run typecheck passed with zero errors across the entire codebase. ESLint passed with 0 errors across all changed and created files.
