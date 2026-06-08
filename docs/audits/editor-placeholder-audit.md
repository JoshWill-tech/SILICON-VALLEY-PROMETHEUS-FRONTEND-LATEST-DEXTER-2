# Editor Page Placeholder Audit
Date: 2026-06-08
Auditor: Codex 5.5 (Gilfoyle Mode)

## Summary
- Total placeholders found: 38 grouped findings
- Critical, user-facing or production-path: 27
- Minor, dev-only comments or fallback copy: 11
- TODO/backend markers: 5
- Accessibility placeholder-as-label risks: 11
- Explicit `Lorem ipsum`, `Coming soon`, `Not implemented`, and `Work in progress`: 0 found in the editor scan

## Quick Action Items
1. Replace the social posting mock workflow in `app/editor/[id]/page.tsx` with real platform integrations, caption generation, and posting result URLs.
2. Replace `/editor` demo beat/vector data with project transcript, Motion Brain, or Supabase/pgvector-backed data.
3. Replace `MediaBin` hardcoded assets, storage, and sync state with project media inventory.
4. Move timeline visualization clips and transcript/animation hardcoded segments behind real project state.
5. Add explicit accessible labels for inputs that rely on placeholder text or animated custom placeholder copy.
6. Decide whether editor copy is ready for i18n. No editor i18n wrapper was detected in this audit.

## Global Gaps

### i18n
**Severity:** Minor
**Type:** i18n gap
**Current text:** User-facing editor strings are direct JSX/string literals.
**Location:** `app/editor/**/*`, `components/editor/**/*`
**Suggested replacement:** Introduce the project's chosen translation layer, then wrap user-visible editor copy.
**Notes:** No `useTranslation`, `next-intl`, `react-i18next`, or obvious `t(...)` usage was detected in editor scope.

### Accessibility Labels
**Severity:** Critical
**Type:** Accessibility gap
**Current text:** Multiple text inputs use placeholder examples as the primary visible affordance.
**Location:** See findings 19-27.
**Suggested replacement:** Add durable labels or `aria-label`/`aria-describedby` text that does not disappear on input.
**Notes:** Placeholder text is not a label. Screen reader users and cognitive users get a worse editor when instructions vanish.

## Placeholder Inventory

### 1. Editor Demo Beat Data - `app/editor/page.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `mockBeats` with `emphasis`, `build`, `climax`
**Location:** Lines 16-20, rendered at line 48
**Suggested replacement:** Read beats from the current processing job, Motion Brain analysis, or timeline state.
**Notes:** The root editor page renders demo motion events as if they were project-derived.

### 2. Editor Demo Semantic Vectors - `app/editor/page.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `Welcome`, `to`, `Prometheus`, `future`, `content`
**Location:** Lines 22-28, rendered at lines 57 and 60
**Suggested replacement:** Use transcript tokens and embeddings generated for the active project.
**Notes:** This is visible in the Semantic Vector Space panel.

### 3. Editor Redirect Untitled Project - `app/editor/page.tsx`
**Severity:** Critical
**Type:** Generic fallback
**Current text:** `Untitled Project`
**Location:** Line 79
**Suggested replacement:** Route to the most recent real project or prompt for project creation with source upload.
**Notes:** The redirect fallback can create a generic project without user intent.

### 4. Generic Editor Loading Caption - `app/editor/page.tsx`, `app/editor/[id]/loading.tsx`, `components/editor/editor-loading-screen.tsx`
**Severity:** Minor
**Type:** Generic loading state
**Current text:** `Loading...`
**Location:** `app/editor/page.tsx` line 85, `app/editor/[id]/loading.tsx` line 4, `components/editor/editor-loading-screen.tsx` line 13
**Suggested replacement:** Use route-specific copy such as `Opening editor workspace`.
**Notes:** Not broken, just generic.

### 5. Social Posting Mock URLs - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `https://linkedin.com/feed/update/mock-prometheus`, `https://youtube.com/watch?v=mock-prometheus`, and similar platform URLs
**Location:** Lines 1836-1850, used at lines 2362 and 4225
**Suggested replacement:** Store returned URLs from real platform APIs.
**Notes:** This is production-dangerous because the UI can display fake success destinations.

### 6. Social Posting Mock Captions - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `This is a mock Instagram caption...`, `This is a mock LinkedIn caption...`, and platform variants
**Location:** Lines 1853-1884
**Suggested replacement:** Generate captions through the AI caption service with platform-specific constraints.
**Notes:** Several variants are polished enough to look real, which makes the mock risk worse.

### 7. Mock Caption Builder - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** Mock generator
**Current text:** `buildMockCaption(...)`, fallback `your project`
**Location:** Lines 1890-1900
**Suggested replacement:** Replace with persisted caption drafts returned from backend generation.
**Notes:** This feeds the visible posting flow.

### 8. Mock Project Browser Copy - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** User-facing mock copy
**Current text:** `Use recent edits or search across mock projects without leaving the chat.`
**Location:** Line 2034
**Suggested replacement:** `Choose a recent edit or search your projects without leaving the chat.`
**Notes:** The word `mock` is visible to users.

### 9. Project Browser Search Placeholder - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** Placeholder-as-label risk
**Current text:** `Search projects or videos`
**Location:** Line 2041
**Suggested replacement:** Add a visible or screen-reader label, keep placeholder as optional hint.
**Notes:** Current wrapper is a `label`, but there is no explicit text label for the input.

### 10. Visible Mock Caption Fallback - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** User-facing mock copy
**Current text:** `This is a mock ${platform.label} caption for your video about ...`
**Location:** Line 2192
**Suggested replacement:** Show an empty draft state or request generation before displaying copy.
**Notes:** This directly exposes mock language inside caption review.

### 11. Recent Posting Files TODO and Fake Durations - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** TODO plus mock data
**Current text:** `TODO: Backend - Fetch real projects and videos from Supabase`, durations `0:42`, `1:18`, `2:04`, `0:56`
**Location:** Lines 3811-3822
**Suggested replacement:** Query project media records with real durations, thumbnails, topics, and updated timestamps.
**Notes:** The UI pretends to search real videos while synthesizing metadata.

### 12. Posting Project Groups Mock Library - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `Launch Cuts`, `Client Social Package`, `Founder story reel`, `Vertical hero cut`
**Location:** Lines 3840-3890
**Suggested replacement:** Use Supabase project folders or recent edits grouped by actual project.
**Notes:** This is a full fake project library.

### 13. Caption Generation TODOs - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** TODO/backend marker
**Current text:** `TODO: Backend - AI caption generation per platform`
**Location:** Lines 4013 and 4060
**Suggested replacement:** Call the caption generation endpoint and persist draft/version metadata.
**Notes:** Regeneration is currently template rotation.

### 14. Mock Posting Completion - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** Mock workflow
**Current text:** `completePostingMock`, `Math.random() > 0.8`, fake rate limit, `platform.mockUrl`
**Location:** Lines 4158-4225
**Suggested replacement:** Replace with social API job state, deterministic error handling, and real result URLs.
**Notes:** Random failure is not acceptable in user-facing publishing.

### 15. Export Empty State - `app/editor/[id]/page.tsx`
**Severity:** Minor
**Type:** Empty state
**Current text:** `No exports yet`, `Start an export when this cut is ready to share.`
**Location:** Lines 5802-5803
**Suggested replacement:** Acceptable if intentional; consider adding a clear export CTA.
**Notes:** Generic, but not fake.

### 16. Repeated Untitled Project Fallbacks - `app/editor/[id]/page.tsx`
**Severity:** Critical
**Type:** Generic fallback
**Current text:** `Untitled Project`, `Untitled`
**Location:** Lines 6629, 6641, 6662, 6871, 7142, 7205, 7547, 7583, 7630, 7891, 7901, 8073
**Suggested replacement:** Require a project title before key workflows or use source filename-derived titles.
**Notes:** Some fallbacks feed prompt builders and recommendation context, not just display.

### 17. Media Bin Mock Assets - `components/editor/MediaBin.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `Raw Interview A.mp4`, `B-Roll Forest.mp4`, `Background Theme.wav`, `Headline Bold`, `Logo Vector.svg`
**Location:** Lines 27-33, rendered at line 111
**Suggested replacement:** Render actual project media assets from Supabase/R2 metadata.
**Notes:** Includes Unsplash thumbnails, making fake assets look plausible.

### 18. Media Search Placeholder and Fake Sync State - `components/editor/MediaBin.tsx`
**Severity:** Critical
**Type:** Placeholder-as-label and mock status
**Current text:** `Search media...`, `Storage: 4.2GB / 100GB`, `Syncing...`
**Location:** Lines 77 and 149-150
**Suggested replacement:** Add accessible search label and use real storage/sync metrics.
**Notes:** The storage footer is a hardcoded system status.

### 19. Motion Brain Demo Beats - `components/editor/MotionBrainPanel.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `Prometheus`, `future`, `content`
**Location:** Lines 21-25, set into state at line 64
**Suggested replacement:** Return beats from Motion Brain analysis of the active project.
**Notes:** The `Generate Beats` button produces hardcoded output.

### 20. Motion Brain Demo Semantic Vectors - `components/editor/MotionBrainPanel.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `Welcome`, `to`, `Prometheus`, `future`, `content`, `motion`, `export`, `signal`
**Location:** Lines 27-36, rendered at line 103
**Suggested replacement:** Use real transcript token embeddings.
**Notes:** This duplicates the root editor demo vector issue.

### 21. Motion Brain Canvas Mock State - `components/editor/MotionBrainCanvas.tsx`
**Severity:** Critical
**Type:** Mock state
**Current text:** `const isProcessing = true // Mock state`
**Location:** Line 45
**Suggested replacement:** Bind to actual processing state.
**Notes:** The canvas always appears active.

### 22. Motion Brain Canvas Hardcoded Analysis Copy - `components/editor/MotionBrainCanvas.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `4K ProRes`, `Detected 12 semantic anchors`, `Noise Floor: -42dB`, `Neural Grade`, `Cinematic Motion`
**Location:** Lines 107-151
**Suggested replacement:** Bind each node to source inspection, audio analysis, and active motion job data.
**Notes:** These are product-looking metrics without data provenance.

### 23. Export Drawer Hardcoded Payload - `components/editor/ExportDrawer.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `Prometheus Cinematic Export`
**Location:** Lines 29-61
**Suggested replacement:** Use the active project title, export title, caption draft, and output filename.
**Notes:** The comment says this is mock data for export; the value is sent in the API payload.

### 24. Timeline Mock Segments - `components/editor/TimelinePanel.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `Intro`, `Main Content`, `Outro`
**Location:** Lines 49-58
**Suggested replacement:** Render real timeline segments, scenes, or detected chapters.
**Notes:** The comment explicitly labels them mock segments.

### 25. Timeline Hover Mockup - `components/editor/TimelinePanel.tsx`
**Severity:** Minor
**Type:** Mock tooltip
**Current text:** `Hover Tooltip Mockup`, `Seek to Frame`
**Location:** Lines 98-100
**Suggested replacement:** Wire tooltip position and frame/time value to the range input hover state.
**Notes:** Mostly an unfinished interaction marker.

### 26. Cinematic Timeline Mock Clips - `components/editor/CinematicTimeline.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `Source Clip Alpha`, `Cinematic Bed.wav`
**Location:** Lines 247-263
**Suggested replacement:** Render clips from the project timeline model.
**Notes:** The comment says `Mock clips for visualization`.

### 27. Cinematic Timeline Empty State - `components/editor/CinematicTimeline.tsx`
**Severity:** Minor
**Type:** Empty state
**Current text:** `No iterations saved. Shift+Drag to select ranges.`
**Location:** Lines 213-215
**Suggested replacement:** Acceptable if keyboard/mouse instructions are valid; add mobile alternative if needed.
**Notes:** Not fake, but incomplete for touch-only users.

### 28. Transcript Strip Hardcoded Words - `components/editor/TranscriptStrip.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `Welcome to Prometheus the future of content`
**Location:** Lines 3-11
**Suggested replacement:** Use transcript words from job artifacts.
**Notes:** This is visible timeline content.

### 29. Animation Track Hardcoded Segments - `components/editor/AnimationTrack.tsx`
**Severity:** Critical
**Type:** Mock data
**Current text:** `fade-in`, `slide-up`, `pulse`
**Location:** Lines 7-11
**Suggested replacement:** Use animation plan/keyframe data from the project.
**Notes:** The component accepts duration/zoom but not the segment data it renders.

### 30. Preview Feedback Timestamp Placeholder - `components/editor/preview-feedback-shell.tsx`
**Severity:** Critical
**Type:** Placeholder-as-label risk
**Current text:** `e.g. 0:15 or 1:20-1:30`
**Location:** Line 496
**Suggested replacement:** Add a visible label like `Timestamp or range`; keep this as helper text.
**Notes:** Input has no durable text label nearby in the field itself.

### 31. Preview Feedback Notes Placeholder - `components/editor/preview-feedback-shell.tsx`
**Severity:** Critical
**Type:** Placeholder-as-label risk
**Current text:** `Tell Prometheus exactly what felt off...`
**Location:** Line 586
**Suggested replacement:** Add a durable label and shorter placeholder example.
**Notes:** The placeholder carries the instruction.

### 32. Preview Feedback Summary Fallbacks - `components/editor/preview-feedback-shell.tsx`
**Severity:** Minor
**Type:** Generic fallback
**Current text:** `Not specified`
**Location:** Lines 639, 652, 670, 683, 699, 710
**Suggested replacement:** More specific empty copy per section, or omit empty sections.
**Notes:** Repetition makes the summary feel like a form dump.

### 33. Command Bubble Prompt Placeholder and Vague Submit - `components/editor/CommandBubble.tsx`
**Severity:** Critical
**Type:** Placeholder-as-label and vague button
**Current text:** `Describe how you want to modify this segment...`, `DONE`
**Location:** Lines 87 and 110
**Suggested replacement:** Add a label and rename the button to `Apply edit` or `Send edit`.
**Notes:** `DONE` does not describe the action.

### 34. Command Overlay Reference Samples - `components/editor/command-overlay-shell.tsx`
**Severity:** Minor
**Type:** Seed/mock reference data
**Current text:** Repeated `10s sample`
**Location:** Starts at lines 244-252, repeated throughout `REFERENCES`
**Suggested replacement:** If these are curated style presets, rename from sample duration or bind to actual preview assets.
**Notes:** This may be product seed data, but the repeated sample duration should be verified.

### 35. Command Overlay Textarea Placeholders - `components/editor/command-overlay-shell.tsx`
**Severity:** Critical
**Type:** Placeholder-as-label risk
**Current text:** `e.g. Make this feel like a high-end tech commercial...`, `e.g. Keep the captions on the left side...`
**Location:** Lines 1037 and 1497
**Suggested replacement:** Add explicit labels and helper text for creative direction and strategic notes.
**Notes:** Both examples are useful, but they are doing label work.

### 36. Motion Note Placeholder - `components/editor/motion-property-canvas.tsx`
**Severity:** Critical
**Type:** Placeholder-as-label risk
**Current text:** `Describe the motion change...`
**Location:** Line 521
**Suggested replacement:** Add a text label tied to the textarea.
**Notes:** Motion edits need durable instructions because the placeholder disappears.

### 37. Chat Workspace Placeholder - `components/editor/chat-workspace-panel.tsx`
**Severity:** Critical
**Type:** Placeholder-as-label risk
**Current text:** `Describe an edit or ask for music...`
**Location:** Line 267
**Suggested replacement:** Add `aria-label` or visible label, preserve placeholder as hint.
**Notes:** The input is central to editor operation.

### 38. Music Search and Empty States - `components/editor/music-tab-panel.tsx`
**Severity:** Minor
**Type:** Placeholder-as-label and empty state
**Current text:** `Search title or artist`, `No soundtracks found`, `Try a different song, artist, or soundtrack phrase.`
**Location:** Lines 790-797, 854, 908-909, 997, 1035-1036
**Suggested replacement:** Add explicit search labels; verify empty state is driven by real catalog failure/search results.
**Notes:** Music catalog internals were audited read-only and left untouched.

## Supporting Mock Sources

### Editor State Uses Mock Store - `hooks/use-editor-state.ts`
**Severity:** Critical
**Type:** Mock dependency
**Current text:** Imports `getProject`, `getJobStatus`, `upsertProject` from `@/lib/mock`
**Location:** Lines 7-11
**Suggested replacement:** Move active editor project/job state to Supabase and durable backend job status.
**Notes:** This explains why multiple editor surfaces can show mock-backed values.

### Upload Dialog Uses Mock Project/Job Helpers - `components/editor/editor-new-project-upload-dialog.tsx`
**Severity:** Critical
**Type:** Mock dependency
**Current text:** Imports `createProcessingJob`, `startProcessing`, `upsertProject` from `@/lib/mock`
**Location:** Line 21
**Suggested replacement:** Use backend project creation and processing job endpoints after R2 upload.
**Notes:** The upload UI itself is real-looking, but persistence is still mock-backed.

### Local Mock Project Store - `lib/mock/index.ts`
**Severity:** Critical
**Type:** Mock data layer
**Current text:** `Untitled Project`, `transcriptProvider: 'mock'`, `Mock transcription finishing...`
**Location:** Lines 69, 120, 137, 262, 343
**Suggested replacement:** Retire for production editor paths; keep only as isolated test fixture if needed.
**Notes:** This is the backing source for several active editor flows.

### Mock Revisionable Regions - `lib/editorial-frame/mock-revisionable-regions.ts`
**Severity:** Critical
**Type:** Mock data
**Current text:** `MOCK_REVISIONABLE_REGIONS`, `Opener Typography Entrance`, `Graph Rise Animation`, preview images
**Location:** Lines 3-64
**Suggested replacement:** Generate revisionable regions from real render metadata/backend logs.
**Notes:** The `source` fields claim `backend_log` even though the file is mock data.

### Mock Preview Revision API - `lib/editorial-frame/mock-preview-api.ts`
**Severity:** Critical
**Type:** Mock async API
**Current text:** `sleep(220)`, synthetic `preview-revision-${Date.now()}`, status `queued`
**Location:** Lines 7-22
**Suggested replacement:** Queue revision requests through the real preview/render backend.
**Notes:** `app/editor/[id]/page.tsx` imports this path directly.

## Migration Notes For Replacement Pass
- Keep this audit as the tracking baseline.
- Replace active imports from `@/lib/mock` and `mock-preview-api` before polishing copy; otherwise new copy will still describe fake state.
- Prioritize mock workflows that send payloads or produce URLs: export, social posting, upload/job creation, and preview revision queue.
- Treat input placeholders as UX hints only after adding labels.
- Music catalog internals were not modified during this audit.
