# Jarvis final-MP4 and saved-source investigation

Input: `jarvis-voice-session (17).txt`, exported October 17, 2026 at 07:05:28 local time. The user asks for an end-to-end edited MP4, objects to “preflight” language, and then disputes repeated claims that the source is unsaved.

## Reproduced causes

The actual voice tool executor defaulted both `start_render` and `export_video` to preview whenever `mode` was omitted. An MP4 request could therefore open a review without submitting anything. The executor also treated a requested final mode as proof of submission even when its callback explicitly returned `renderInitiated: false`. Both paths now use the confirmed callback result; only an explicit preview mode chooses review.

The instructions directed broad editing requests toward a saved timeline/Motion preview, while export submission required a separate explicit request. Updated guidance treats a supported “edit this video” request as a request for an MP4, uses a balanced default direction, allows a brief creative-direction choice when useful, and preserves read-only review requests. It prohibits silently substituting a short clip for an explicitly requested whole longer video or claiming unsupported grading, lighting, B-roll, or timeline rendering.

The editor-state tool exposed local playback and timeline sync but no saved-source verification. The readiness endpoint also reported a failed source database lookup as an unavailable source. It now distinguishes an unconfirmed lookup and includes the durable source identity. The new read-only `get_source_status` tool fetches fresh readiness, compares server and editor source identities, rejects stale results after source/session changes, and distinguishes saved, mismatched, missing, and unconfirmed metadata. The instructions require a fresh check when the user says the video has been saved. A failed check must not become an instruction to upload again.

This check verifies project/source metadata, not the continued existence or readability of R2 bytes. A render submission remains the authority for render acceptance; export history remains the authority for a finished downloadable MP4.

## Upload work already in the workspace

The earlier source-replacement investigation and uncommitted upload fixes were present before this task. They address browser-cache-dependent false failures, zero-part retry reservations, lost registration errors, resumable progress, and a repository mismatch between frontend and database storage limits. Those production changes were preserved. See `docs/qa/source-replacement-upload-2026-10-16.md` for the migration and deployment requirements; this task did not apply a database migration, change bucket configuration, or deploy the app.

The older MP4 test harness had seven baseline failures: it omitted the new upload-state dependencies and attempted to load browser CSS in Node. It now supplies the real source-readiness guard, isolates the visual review wrapper/CSS, and adds an actual callback check that uploading/failed sources do not submit a request.

## Fresh Cloudflare evidence

The sandboxed probe initially failed with local `EACCES` before reaching R2. The approved network retry of `node scripts/probe-r2-source-upload.mjs 1 https://prometheusstudio.tech` passed browser-origin preflight, uploaded 1,048,576 real bytes, completed the multipart upload, and verified its authoritative HEAD size. The probe reported seven seconds and removed its unique diagnostic object (`R2_SOURCE_PROBE_CLEANUP_COMPLETE`). No existing user media was removed.

This rules out a blanket permission or upload failure for that configuration at the test time. It does not measure account bandwidth, determine the affected user's application quota, verify a large-file transfer, or identify the original incident's response. The transcript contains no project ID, upload receipt, request log, or quota error that would establish the original Cloudflare hypothesis.

## Remaining product limitation

The current project export route dispatches a portrait source Mini-Run. Its default window is 30 seconds. `lib/server/mini-run-render-payload.ts` caps Mini-Run windows at 180 seconds; the project export endpoint does not accept an arbitrary full-length render request. Saved timeline layers and several creative controls are not consumed by this route. The voice changes do not create that missing backend capability. A whole longer-video edit requires a renderer/API contract that consumes the complete requested timeline, duration, and supported creative choices. Jarvis must state this limit and obtain a meaningful choice of supported output rather than claiming full-length completion.

## Verification

The targeted executor/readiness reproduction initially passed two checks and failed six for the expected symptoms. All eight passed after the fixes. Expanded source-status coverage, related export/upload regressions, type checking, and baseline-aware lint are recorded by `GATES-jarvis-end-to-end-session.md` and the task's `tmp/jarvis-session-*.log` files. The adjacent inspection, editing-access, action-feedback, session-runtime, and editorial-plan suite passed 21 checks.

The initial production-build attempt was refused because another Next build owned the shared output lock. No other task's build was stopped or its lock removed. This is a validation limitation, not evidence that a production build passed. No live microphone/model conversation or original-project render was replayed; the automated checks exercise actual executor/API/helper code with controlled network and editor dependencies.
