# Gates: OpenCut Timeline Functionality, Interactivity & Jarvis Routing

OWNS: components/editor/editorial-timeline-viewport.tsx, components/editor/editorial-timeline-tracks.tsx, components/editor/editorial-timeline-toolbar.tsx, hooks/use-timeline-tools.ts, lib/editor/timeline-tools.ts, lib/voice-companion/bridge.ts, lib/voice-companion/gemini-live-client.ts, hooks/use-voice-companion.ts, tests/opencut-timeline-interaction.test.ts, GATES.md

Scope: Restore and map full OpenCut-grade timeline interactivity (interactive ruler scrubbing, clip trimming, moving, splitting, deletion, track controls) and wire complete Jarvis autonomous access.

- [ ] G1: Interactive ruler and track seeking routes playhead scrub and click-to-seek without container capture blocking.
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts --test-name-pattern="ruler and playhead scrubbing"
  EXPECT: ruler and playhead scrubbing passed
  EVIDENCE: pending

- [ ] G2: Video clips support full NLE interactivity: clip selection, left and right trim handles, horizontal dragging, splitting, and deletion.
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts --test-name-pattern="clip manipulation"
  EXPECT: clip manipulation passed
  EVIDENCE: pending

- [ ] G3: Multi-track header routing provides functional visibility, mute, and track actions for Video, Captions, Text, and Music.
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts --test-name-pattern="multi-track controls"
  EXPECT: multi-track controls passed
  EVIDENCE: pending

- [ ] G4: Jarvis voice companion bridge has complete routed access to timeline state and manipulation tools (inspect, seek, split, trim, move, delete, track mute/visibility).
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts --test-name-pattern="jarvis timeline bridge"
  EXPECT: jarvis timeline bridge passed
  EVIDENCE: pending

- [ ] G5: Entire timeline interaction and Jarvis routing test suite executes and passes.
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts
  EXPECT: all opencut timeline tests passed
  EVIDENCE: pending

- [ ] G6: TypeScript typecheck passes cleanly with zero errors across the entire codebase.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: pending
