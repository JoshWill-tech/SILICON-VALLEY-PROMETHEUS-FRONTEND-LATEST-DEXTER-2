# Gates: Jarvis Voice Session 18 Rendering Repairs

OWNS: app/editor/[id]/page.tsx, lib/voice-companion/gemini-live-client.ts, lib/voice-companion/safe-response.ts, lib/voice-companion/source-status.ts, lib/voice-companion/error-sanitizer.ts, lib/editor/editorial-timeline-client.ts, app/api/projects/[id]/exports/route.ts, tests/jarvis-mp4-session.test.mjs, docs/qa/jarvis-render-diagnosis-2026-10-17.md

Scope: Diagnose and rectify all rendering and export failures from Jarvis voice session 18:
1. Turn 1: STT "EP4" variant handled as final MP4 render command rather than read-only preflight.
2. Turn 2: Stuck `isSourceUploadFailed` state in editor page cleared when saved source exists; authenticated export readiness check prevents false 401 unconfirmed responses.
3. Turn 3: Editorial timeline 409 "The source video changed" error handled by refreshing server source and re-syncing without wedging editor in error state.
4. Turn 4: "edit this vid and gimme the final mp4 file" carries through to start_render(mode: 'final') even when browser-side transcription is pending.
5. Turn 5: Backend dispatch errors preserved and surfaced informatively rather than being masked by generic "cloud studio is busy" fallback.

- [x] G1: Root cause diagnosis of all 5 turns from jarvis-voice-session (18).txt documented in docs/qa/jarvis-render-diagnosis-2026-10-17.md.
  CHECK: node -e "const fs = require('fs'); if (!fs.existsSync('docs/qa/jarvis-render-diagnosis-2026-10-17.md')) process.exit(1); console.log('DOCS_OK');"
  EXPECT: DOCS_OK
  EVIDENCE: PASS - DOCS_OK. Full timestamped analysis and technical resolutions documented in docs/qa/jarvis-render-diagnosis-2026-10-17.md.

- [x] G2: STT variant "EP4" and broad edit/deliver commands map to start_render(mode: 'final'), not stopping at review_export_readiness or pending transcription.
  CHECK: npx tsx --test tests/jarvis-mp4-session.test.mjs
  EXPECT: # pass
  EVIDENCE: PASS - 21 tests pass, 0 fail. Gemini Live client recognizes EP4, renta, and deliver variants and mandates start_render(mode: 'final').

- [x] G3: Editor page clears isSourceUploadFailed when project has valid saved sourceAssetId and passes user auth token in export readiness checks.
  CHECK: npx tsx --test tests/jarvis-mp4-session.test.mjs
  EXPECT: # pass
  EVIDENCE: PASS - 21 tests pass, 0 fail. Page resets isSourceUploadFailed upon project cache hydration and API fetch, and attaches Bearer token to export checks.

- [x] G4: EditorialTimelineController resolves sourceAssetId from projects cache and reconciles 409 source mismatch by re-fetching and applying queued edits.
  CHECK: npx tsx --test tests/jarvis-mp4-session.test.mjs
  EXPECT: # pass
  EVIDENCE: PASS - 21 tests pass, 0 fail. Controller drain loop auto-recovers from 409 by refreshing server timeline and re-submitting patch.

- [x] G5: safeParseApiResponse and sanitizeVoiceCompanionError preserve real backend dispatch error messages instead of collapsing into generic busy fallback.
  CHECK: npx tsx --test tests/jarvis-mp4-session.test.mjs
  EXPECT: # pass
  EVIDENCE: PASS - 21 tests pass, 0 fail. Non-HTML plain text and JSON error messages on 502/503 are preserved without dropping into generic busy string.

- [x] G6: Complete test suite passes with zero failures.
  CHECK: npx tsx --test tests/jarvis-mp4-session.test.mjs
  EXPECT: # fail 0
  EVIDENCE: PASS - tests 21, pass 21, fail 0, cancelled 0, skipped 0.

- [x] G7: TypeScript type checking passes cleanly with zero errors.
  CHECK: npx tsc --noEmit
  EXPECT: 0
  EVIDENCE: PASS - npx tsc --noEmit completed with exit code 0 and zero type errors.
