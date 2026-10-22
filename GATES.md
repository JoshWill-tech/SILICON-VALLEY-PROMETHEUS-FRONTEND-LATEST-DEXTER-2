# Gates: Thumbnail Reference Image Fidelity & Configuration Rectification

OWNS: GATES.md, lib/thumbnails/studio-references.ts, lib/thumbnails/studio-art-direction.ts, lib/thumbnails/nano-banana-rulebook.ts, app/api/projects/[id]/thumbnails/nano-banana/route.ts, components/editor/ThumbnailStudioModal.tsx, components/editor/thumbnail-studio/ThumbnailWorkspace.tsx, tests/thumbnail-reference-fidelity.test.mjs

Scope: Rectify thumbnail generation prompt synthesis, frontend reference synchronization, and multimodal request directives so that selected visual reference images (such as charts/graphs, white backdrops, props, and clean editorial layouts) faithfully inspire the generated artwork while keeping the speaker's face simple and authentic.

- [x] G1: Selected visual reference looks (including white backgrounds, charts, and props) drive prompt synthesis without contradictory dark studio or highlighter boilerplate collisions.
  CHECK: node tests/thumbnail-reference-fidelity.test.mjs
  EXPECT: pass 3
  EVIDENCE: pass 3 (all tests passing)

- [x] G2: Thumbnail reference selection in the Studio Modal automatically aligns studio design (background treatment, accent color, and matching visual recipe) with the selected look.
  CHECK: node tests/thumbnail-reference-fidelity.test.mjs
  EXPECT: pass 3
  EVIDENCE: pass 3 (all tests passing)

- [x] G3: Nano Banana route and multimodal vision preserve reference style DNA and prioritize reference-derived retention art direction as the primary instruction.
  CHECK: node tests/thumbnail-reference-priority.test.mjs
  EXPECT: pass 6
  EVIDENCE: pass 6 (all tests passing)

- [x] G4: Route runtime tests continue passing without regression across error handling, timing, and multimodal payload formats.
  CHECK: node tests/thumbnail-route-runtime.test.mjs
  EXPECT: pass 14
  EVIDENCE: pass 14 (all tests passing)

- [x] G5: TypeScript verification passes cleanly across the entire codebase.
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: typecheck passed (tsc --noEmit exited 0)
