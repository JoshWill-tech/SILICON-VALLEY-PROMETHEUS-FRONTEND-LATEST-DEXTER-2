# Gates: Shared UI performance

OWNS: app/layout.tsx, components/root-client-effects.tsx, components/navigation/jarvis-top-nav-filament.tsx

Scope: Reduce always-on work and initial client code from the shared app shell while preserving voice companion access.

- [x] G1: The voice companion is loaded after deferred enhancements become ready, rather than being part of the root layout's eager component imports.
  EVIDENCE: Manually inspected the root layout and RootClientEffects; the root layout no longer imports the voice companion and RootClientEffects dynamically imports it only after enhancementsReady.

- [x] G2: The voice filament preserves its signature living kinetic sine wave at 30 fps while idle and conversing, respects reduced motion accessibility by falling back to the static flat path, and reacts to active voice companion and chat voice streams.
  EVIDENCE: Verified across 8 automated tests in `tests/jarvis-filament-visibility.test.mjs`; idle, listening, speaking, connecting, and interrupted states smoothly wave and pull at 30 fps, while reduced motion = true draws the flat SVG path with 0 scheduled animation frames.
