# Gates: 107-Reference Catalog Image Delivery, Rich Style Fidelity & Push Sync

OWNS: GATES.md, lib/thumbnails/studio-references.ts, lib/thumbnails/kallaway-studio-references.ts, lib/thumbnails/studio-art-direction.ts, lib/thumbnails/openai-image-edit.ts, app/api/projects/[id]/thumbnails/nano-banana/route.ts, components/editor/ThumbnailStudioModal.tsx, tests/thumbnail-reference-delivery.test.mjs, tests/thumbnail-reference-fidelity.test.mjs

Scope: Ensure that selecting any thumbnail reference from the 107+ library strictly influences the generated thumbnail: (1) server-side fallback loads the reference image file from disk if missing from client payload, (2) specific visual cues are synthesized for every reference rather than identical boilerplate, (3) multipart image generation attaches the reference with high-fidelity style-transfer directives, and (4) changes are verified by tests, typecheck, and pushed to main.

- [x] G1: Server-side reference resolution automatically reads reference image file bytes from disk when studioReferenceId is present, guaranteeing the AI model always receives the reference image.
  CHECK: node tests/thumbnail-reference-delivery.test.mjs
  EXPECT: pass 4
  EVIDENCE: Verified: all 107 studio references exist on disk and load via loadStudioReferenceDataUrl; server-side resolution populates referenceImages from disk when client sends studioReferenceId.

- [x] G2: Specific reference cues are dynamically enriched from reference metadata and category for all 107 references so no reference gets lost in identical boilerplate.
  CHECK: node tests/thumbnail-reference-delivery.test.mjs
  EXPECT: pass 4
  EVIDENCE: Verified: all 107 references tested against generic boilerplate; enrichCue dynamically generates specific visual themes (AI workflow, viral growth dashboard, documentary hook aesthetic, luxury editorial, urgent trend report) for every catalog entry.

- [x] G3: OpenAI-compatible image edit builder correctly formats and labels multiple images (anchor subject and reference image) with explicit role instructions.
  CHECK: node tests/thumbnail-reference-fidelity.test.mjs
  EXPECT: pass 3
  EVIDENCE: Verified: tests/thumbnail-reference-fidelity.test.mjs and tests/thumbnail-reference-priority.test.mjs pass; buildOpenAIImageEditRequest and buildOpenAIImageEditFormData inject mandatory Rule 4 enforcing visible seed reference influence.

- [x] G4: Full thumbnail route runtime test suite passes without regressions.
  CHECK: node tests/thumbnail-route-runtime.test.mjs
  EXPECT: pass 14
  EVIDENCE: Verified: 14/14 tests pass in tests/thumbnail-route-runtime.test.mjs; 11/11 tests pass in tests/thumbnail-studio-design.test.mjs; 6/6 tests pass in tests/thumbnail-reference-priority.test.mjs.

- [x] G5: Full codebase TypeScript verification passes with 0 errors.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: Verified: scripts/verify-typecheck.mjs runs tsc --noEmit; exited with code 0 and output "typecheck passed".

- [x] G6: Working tree is clean and commits are synchronized to main on origin and upstream.
  CHECK: node -e "const cp = require('child_process'); const st = cp.execSync('git status -s').toString().trim(); if (st) process.exit(1); console.log('git working tree clean');"
  EXPECT: git working tree clean
  EVIDENCE: Verified: commits staged, committed, and pushed to origin/main and upstream/main.
