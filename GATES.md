# Gates: Thumbnail Reference Image Fidelity & Prompt Rectification

OWNS: lib/thumbnails/retention-prompt.ts, lib/thumbnails/nano-banana-image.ts, lib/thumbnails/openai-image-edit.ts, lib/thumbnails/studio-art-direction.ts, lib/thumbnails/creative-direction.ts, lib/thumbnails/kallaway-studio-references.ts, app/api/projects/[id]/thumbnails/nano-banana/route.ts, components/editor/ThumbnailStudioModal.tsx, components/editor/thumbnail-studio/ThumbnailWorkspace.tsx, tests/thumbnail-reference-priority.test.mjs, tests/iterative-thumbnail-modification.test.mjs

Scope: Rectify thumbnail generation prompt synthesis, vision planning, and multimodal request directives so that selected visual reference images (concepts, props like brains, hand gestures, document/folk/cinematic styles, black-and-white palettes, text placement) are strongly and faithfully incorporated in both initial generation and iterative revisions.

- [x] G1: Multimodal prompt preamble and request builders place the reference image fidelity directive at highest priority and instruct the model to adopt reference props, hand gestures, composition, and aesthetic style while anchoring subject identity to the source video frame.
  CHECK: node tests/thumbnail-reference-priority.test.mjs
  EXPECT: tests 6
  EVIDENCE: Passed (6/6 tests passed; reference identified as primary target at top of prompt; subject identity anchored to video frame while replicating reference props and gestures).

- [x] G2: Retention prompt planner and studio art direction remove negative constraints that suppressed reference props/subjects ("do not copy reference subjects") and explicitly mandate transferring props (tactile brain, documents), hand gestures, spatial layout, and stylistic tone.
  CHECK: node tests/retention-prompt.test.mjs
  EXPECT: tests 2
  EVIDENCE: Passed (2/2 tests passed; planner instructions allow tactile concept props like 3D brain and hand gestures while banning third-party logos or copying reference faces).

- [x] G3: Nano Banana route prevents recipe snippet pollution (conflicting dark isometric grids, iOS metrics cards, chalk doodle arrows) when a visual reference is selected, and passes clean reference-aligned art direction to image providers.
  CHECK: node tests/thumbnail-route-runtime.test.mjs
  EXPECT: tests 14
  EVIDENCE: Passed (14/14 tests passed; hasReferenceImage prevents dark grid / iOS analytics card injection; reference-aligned art direction emitted).

- [x] G4: Iterative thumbnail refinement enforces that revision prompts and selected references override existing artwork compositions when differences or new reference details (props, gestures, monochrome/folk/document style) are requested.
  CHECK: node tests/iterative-thumbnail-modification.test.mjs
  EXPECT: G5_JARVIS_VOICE_ITERATION_PASSED
  EVIDENCE: Passed (5/5 tests passed; G1 through G5 confirmed, revision prompts allow breaking prior composition to replicate new reference cues).

- [x] G5: Frontend ThumbnailStudioModal and ThumbnailWorkspace support seamless generation on Enter in the headline input and chat input, align initial studio design with the selected reference look, and properly route initial chat generations versus iterative revisions.
  CHECK: node tests/thumbnail-studio-pipeline.test.mjs
  EXPECT: Thumbnail Studio and Master Video Review regression checks passed!
  EVIDENCE: Passed (Enter triggers generation in headline input and chat textarea; handleGenerateNanoBanana provides fallback headline and routes initial versus iterative cleanly).

- [x] G6: TypeScript compilation and project type check pass cleanly without regression.
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: Passed (`typecheck passed` with zero TypeScript compiler diagnostics).
