# Video review annotations

Open **Compare versions** from the editor preview. Each video has a small floating
pill. Seek to a moment, type a note, and press **Enter**. The note and screenshot
are saved for that frame and the pill stays ready for the next note. Repeated
notes at the same timestamp are grouped under that frame.

Choose the pill's microphone to dictate. The current frame is captured before
microphone access starts. Stop recording to review the transcript, then press
Enter to save. Pressing Enter while recording stops dictation and saves after
transcription. Closing comparison cancels the microphone and pending requests.
The existing authenticated speech endpoint handles transcription; permission or
service errors leave text entry available. Recordings stop after 60 seconds and
transcription has a 90 second client timeout.

The download icon in the comparison header exports all saved frames as one
self-contained JSON, including every note and both original and marked-up PNGs.
The icon badge counts saved frames. The marked-up image includes the timestamp
and original/rendered label. The existing MP4 download continues to export video.

The pencil in the pill opens drawing tools only when needed. Use Freehand,
Circle, Rectangle, multiple text boxes, colors and Undo/Redo, then **Save frame**.
The pencil also resumes an unfinished drawing draft after closing or reloading.

Each entry preserves the video time in seconds and as a millisecond timestamp,
the source type, render ID where applicable, capture date, screenshot dimensions,
and editable drawing/text marks using normalized frame coordinates. The `notes`
array contains the plain-text transcript; JSON embeds the image data URLs.
Expiring media URLs are not included.

Saved entries and unfinished drawing drafts are kept in IndexedDB, scoped to the project
and source asset, on the current device/browser. Closing/reopening comparison or
reloading the page restores them. This frontend feature does not sync reviews
between accounts or devices; download a review to share it with the team.

Frame capture requires the video host to permit cross-origin access. Capture
failures and local storage failures are shown in the review controls. Screenshots
are capped at 1600 pixels on the longest edge to bound local memory/storage use.

Validation:

```powershell
node --import tsx --test tests/video-review-annotations.test.ts
node scripts/video-review-proof.mjs
# In a second terminal, with the local fixture running:
node tests/video-review-annotations.browser.mjs
node tests/video-review-pill.browser.mjs
```

The browser test uses an isolated Edge session and the real comparison/editor
components. The tests exercise text, drawing, synthetic microphone recording,
transcription responses, screenshot JSON, timestamps, recovery, and mobile layout.
Proof files are written to `artifacts/video-review-proof/` and
`artifacts/video-review-pill/`.
