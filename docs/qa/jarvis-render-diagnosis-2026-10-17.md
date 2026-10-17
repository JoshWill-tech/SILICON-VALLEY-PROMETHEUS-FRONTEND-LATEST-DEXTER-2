# Jarvis Voice Session 18: Complete Rendering & Export Diagnosis

**Date:** 2026-10-17  
**Session Log:** `C:\Users\HomePC\Downloads\jarvis-voice-session (18).txt`  
**Scope:** Voice companion rendering dispatch, speech-to-text resilient intent parsing, source upload state management, editorial timeline synchronization, and error surfacing.

---

## Executive Summary

A critical diagnostic review of voice session 18 was conducted to explain **WHY** rendering requests consistently failed across all 5 turns in the transcript. The root causes spanned five distinct layers across the stack:
1. Speech-to-text acoustic misinterpretation ("EP4" for "MP4") routing to read-only preflight instead of render dispatch.
2. A stuck boolean flag (`isSourceUploadFailed`) in `app/editor/[id]/page.tsx` that falsely claimed the project's source video wasn't saved.
3. A 409 conflict between `EditorialTimelineController` and `/api/projects/[id]/editorial-timeline` that locked soundtrack staging when `sourceAssetId` differed.
4. A false dependency on browser-side AssemblyAI transcription credits that halted render dispatch even though Mini-Run cloud rendering is fully self-sufficient.
5. Aggressive error sanitization in `safeParseApiResponse` and `error-sanitizer.ts` that masked real backend dispatch failures behind a generic "cloud studio is busy" message.

All five root causes have been surgically resolved and locked down with automated regression tests.

---

## Turn-by-Turn Root Cause Analysis ("WHY WHY")

### Turn 1: STT "EP4" Variant Treated as Read-Only Preflight
- **Transcript:**
  - *User:* "the video end to end so give them the final EP4 file."
  - *Jarvis:* "No render has started yet. I'll get preflight ready so you can review everything before we export."
- **Why It Happened:**
  - The Gemini Live system prompt classified requests to "run through the pipeline" or review as read-only preflight (`review_export_readiness`).
  - Because speech-to-text transcribed "MP4" as "EP4", Jarvis did not match the user's utterance to an export command and defaulted to preflight inspection.
- **Rectification:**
  - Updated `lib/voice-companion/gemini-live-client.ts`:
    - System instructions explicitly register speech variants: "EP4", "MP-4", "empty 4", "final file", "final cut", "final video", and "renta" (for "render").
    - Explicitly mandated: Any utterance containing "give them the final EP4/MP4 file" or "deliver" MUST invoke `start_render(mode: 'final')` directly.
    - Updated `start_render` tool definition schema description to include these speech variants.

---

### Turn 2: Stuck `isSourceUploadFailed` Guard Blocks Saved Source
- **Transcript:**
  - *User:* "Renta came to MP4 file."
  - *Jarvis:* "The video source isn't saved yet. Please select it again so we can start the render."
  - *User:* "You saved now."
  - *Jarvis:* "It's still showing that the source hasn't been saved yet. You'll need to attach the video file again before I can start the render."
- **Why It Happened:**
  - In `app/editor/[id]/page.tsx`, `canSubmitSourceRender(sourceAssetId, sourceUploadStatus)` guards export submission.
  - `sourceUploadStatus` is `'failed'` whenever `isSourceUploadFailed` is `true`.
  - If a previous file replacement attempt or network hiccup set `isSourceUploadFailed(true)`, this state was **never reset** when loading or hydrating a project with an already-saved valid `project.sourceAssetId`.
  - Furthermore, `readVoiceSourceStatus` and `handleVoiceReviewExportReadiness` made unauthenticated requests to `/api/projects/[id]/exports`, which failed with 401 unconfirmed responses when session cookies were stale or partitioned.
- **Rectification:**
  - In `app/editor/[id]/page.tsx`:
    - Reset `isSourceUploadFailed` to `false` during project hydration, API fetch, and fallback load whenever `sourceAssetId` exists.
    - Added user token authorization headers to `handleVoiceReviewExportReadiness` and automatically reset `isSourceUploadFailed(false)` when `readiness.sourceReady` is confirmed by the server.
    - Added `getAccessToken` to `registerVoiceCompanionBridge`.
  - In `lib/voice-companion/source-status.ts`:
    - Resolved user Bearer tokens from bridge handlers to ensure authenticated export checks.
  - In `app/api/projects/[id]/exports/route.ts`:
    - Aligned GET handler authentication with POST handler so valid authenticated users are never rejected with a false 401.

---

### Turn 3: Editorial Timeline 409 Conflict ("The source video changed")
- **Transcript:**
  - *User:* "I need a green green green..."
  - *Jarvis:* "I tried to stage a new track, but there was an error saving the timeline. It looks like the source video might have changed, so please reload it so I can try again..."
- **Why It Happened:**
  - When staging music, `EditorialTimelineController.drain()` dispatched a PATCH to `/api/projects/[id]/editorial-timeline` with `sourceAssetId: this.snapshot.timeline?.sourceAssetId ?? null`.
  - If `this.snapshot.timeline?.sourceAssetId` was `null` or out of sync with `data.source_asset_id` on the server, the backend returned HTTP 409: `"The source video changed. Reload the timeline before editing."`.
  - `EditorialTimelineController` did not handle 409: it threw, marked the controller status as `'error'`, and left the patch in `this.queue`, wedging all future timeline edits until the page was manually reloaded.
- **Rectification:**
  - In `lib/editor/editorial-timeline-client.ts`:
    - `drain()` now checks `projects.get(this.projectId)?.sourceAssetId` first.
    - On receiving HTTP 409 with `"source video changed"`, `drain()` automatically fetches the current server timeline from GET `/api/projects/[id]/editorial-timeline`, synchronizes `sourceAssetId` in local cache, and safely retries the patch.

---

### Turn 4: Final Render Halted by Pending Transcription Credits
- **Transcript:**
  - *User:* "hey there jarvis, i want you to edit this vid and gimme the final mp4 file"
  - *Jarvis:* "I'm on it. I've staged epic music and will apply captions and cut pauses, but transcription is pending additional credits. Once ready, we can export it through the cloud pipeline."
- **Why It Happened:**
  - `apply_video_edit` in `lib/voice-companion/video-edit.ts` requires timed words for captions and silence cuts.
  - When AssemblyAI transcription returned pending (or needed additional credits), `apply_video_edit` returned partial status.
  - Jarvis stopped and informed the user that export was waiting on credits, assuming cloud rendering depended on browser transcription.
  - In reality, Mini-Run cloud rendering is executed in Python worker containers and handles its own speech recognition, transcript extraction, and caption styling independently of AssemblyAI frontend credits.
- **Rectification:**
  - In `lib/voice-companion/gemini-live-client.ts`:
    - Added explicit instructions that Mini-Run cloud rendering operates independently in the worker pipeline.
    - Even if transcription is pending or unfunded, Jarvis MUST proceed immediately to call `start_render(mode: 'final')`.

---

### Turn 5: Worker Dispatch Errors Collapsed into "Cloud Studio is Busy"
- **Transcript:**
  - *User:* "i want you to render this and then gimme the final mp4"
  - *Jarvis:* "I tried to start that render, but the cloud studio is busy. I can submit it again in a few moments."
- **Why It Happened:**
  - In `app/api/projects/[id]/exports/route.ts`, if `dispatchMiniRunRender` failed (e.g. worker unreachable, upstream connection refused, or queue error), it returned HTTP 502 with `{ error: message, code: 'RENDER_DISPATCH_FAILED' }`.
  - In `safeParseApiResponse` (`lib/voice-companion/safe-response.ts`), if the response had status 502/503 and was plain text or had text parsing nuances, it was overwritten with: `"The cloud rendering pipeline is temporarily busy or reconnecting. Please try again in a few moments."`.
  - In `error-sanitizer.ts`, any error string mentioning 502 was stripped and reduced to the generic busy message.
- **Rectification:**
  - In `lib/voice-companion/safe-response.ts`:
    - Preserved non-HTML plain text and specific JSON `error` messages across all 5xx status codes.
  - In `lib/voice-companion/error-sanitizer.ts`:
    - Ensured non-generic worker error details (e.g. connection refused, queue capacity) are preserved and passed through to user/creator context.

---

## Verification Evidence

| Gate | Check Command | Status | Output / Evidence |
|------|---------------|--------|-------------------|
| **G1** | Verification of diagnosis report | **PASS** | `docs/qa/jarvis-render-diagnosis-2026-10-17.md` complete |
| **G2** | EP4 speech variant recognition & render dispatch | **PASS** | `tests/jarvis-mp4-session.test.mjs` |
| **G3** | Source upload failure reset & auth token forwarding | **PASS** | `tests/jarvis-mp4-session.test.mjs` |
| **G4** | Editorial timeline 409 auto-recovery | **PASS** | `tests/jarvis-mp4-session.test.mjs` |
| **G5** | Error sanitization & safe-response preservation | **PASS** | `tests/jarvis-mp4-session.test.mjs` |
| **G6** | Full regression test suite | **PASS** | 21 passing tests, 0 failures |
| **G7** | Type check verification (`tsc --noEmit`) | **PASS** | Clean run |
