# Gates: inline video review and main release

Scope: Preserve the comparison layout, provide a persistent floating text and voice pill, save screenshots and notes per frame on Enter, export one portable JSON, verify deployment readiness, and publish the authorized frontend changes to main.

- [x] G1: The comparison retains its original two-player layout with compact floating pills
  EVIDENCE: Desktop and mobile screenshots in artifacts/video-review-pill/ inspected. Existing player layout and native controls preserved; no extra review toolbar; drawing opens only through the pencil.
- [x] G2: Enter saves repeated text notes against the correct frame and one download contains every screenshot and note
  EVIDENCE: video-review-pill.browser.mjs passed using actual component, canvas and downloads. Repeated notes share one frame; distinct timestamps and render identity remain separate. JSON includes notes plus original and annotated PNG data.
- [x] G3: Voice input pins the reviewed frame, transcribes into the pill, and releases microphone resources
  EVIDENCE: Browser test passed with deterministic PCM through real MediaRecorder and intercepted transcription responses, including Enter during recording, seeking during transcription and ending all microphone tracks on stop/close. Live speech-provider recognition is not claimed.
- [x] G4: Regression tests and production checks pass or have a diagnosed and explicitly reported blocker
  EVIDENCE: Feature browser checks, annotation tests, the voice MediaRecorder flow, targeted ESLint and typecheck passed. The full production build completed and its postbuild security check passed. GitHub's CodeQL job failed before acquiring a runner (zero steps; runner_name empty). No Vercel deployment record exists for this SHA; the linked Vercel CLI reports the current account is not authorized for the configured team, so deployment state cannot be verified from this workspace.
- [ ] G5: The system design document follows the retained template and is rendered and inspected
  EVIDENCE: Document content and template parts were validated, but visual inspection is pending because Word COM hangs during startup/export and LibreOffice is unavailable in this environment.
- [x] G6: All authorized frontend source changes are reviewed for secrets and published to remote main without overwriting remote changes
  EVIDENCE: Reviewed and committed twelve frontend source/documentation/test files as 6e2c2933070795343f357defd0b23ee7db42d2b0, including existing projects changes. Fetched and preserved 60ba9fe before publishing. Git push succeeded main to main without force. Generated local reports, review images, recordings and temporary files were excluded.
