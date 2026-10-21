# Gates: YouTube source ingest and SupoClip panel

OWNS: components/video-upload-interface.tsx, components/clipping/supoclip-matrix-view.tsx, app/editor/[id]/page.tsx, lib/media/youtube-clip-service.ts, GATES-supoclip-url-ingest.md

Scope: Carry YouTube video/channel URLs into the editor's real ingest request, represent request outcomes honestly, and simplify the clip panel around source footage and useful transcript/editor actions.

- [x] G1: A YouTube video or channel URL entered in the source flow is preserved and passed to the authenticated URL-ingest route.
  EVIDENCE: Source review confirms `isYouTubeUrl` accepts video and channel URLs; the raw normalized URL and optional video ID are saved in session state. The editor reads the staged/project source and calls `fetchLiveViralCrops`, which posts it to `/api/mini-run/api/pipeline/url-ingest` with the session token.

- [x] G2: Failed or empty ingest never creates invented clips or leaves the panel in a false processing state; the user sees a useful error and retry action.
  EVIDENCE: Source review confirms HTTP, empty-result, and network errors reject the fetch promise. The editor clears stale clips, ends the processing state, and passes the error plus a retry action to the panel. The panel has no local sample-clip fallback.

- [x] G3: The panel presents real clip imagery, timestamps, transcript detail, and editor selection with a restrained cinematic layout and no redundant score/filter/progress controls.
  EVIDENCE: Source review confirms image-led clip rows with time ranges, a focused source preview with transcript, and one `Use this cut` action. The former score breakdown, top-pick labels, filters, fake four-stage progress, and nonfunctional download toast were removed. A browser visual review was not run.

- [x] G4: Changed files have been reviewed for integration and source-level correctness.
  EVIDENCE: Reviewed the URL form, session/project handoff, editor ingest effect, authenticated proxy allowlist, service response mapping, and panel props. No runtime checks were run.
