# Gates: Source URL handoff and Vincere backend diagnosis

OWNS: GATES-vincere-backend-diagnosis.md

Scope: Trace the empty source panel back to its frontend state boundary, inspect the available Prometheus/Vincere backend implementation and deployment facts, and deliver a supported diagnosis with an actionable handoff.

- [x] G1: The screenshot symptom is reproduced or localized to the URL-to-panel boundary with concrete code evidence.
  EVIDENCE: Screenshot shows the panel's empty-source copy. `SupoClipMatrixView` receives only `urlClippingState.sourceUrl || project?.editorState?.sourceUrl` and `resolvedClippingVideoId`; the panel falls back to “Source video” when both URL and ID are absent. The panel is opened by `?clipping=true` even when no source handoff exists. The ingest effect exits without a request if its derived `rawUrl` is empty. This localizes the failure before the backend request.

- [x] G2: The backend implementation is inspected for URL ingest, media download, segmentation/transcription, and AWS deployment wiring.
  EVIDENCE: `PROMETHEUS-VINCERE-BACKEND/mini_run_pipeline/lambda_gateway.py` exposes authenticated `POST /api/pipeline/url-ingest`; `mini_run_gateway.py` dispatches to `mini_run_pipeline.url_ingest.ingest_url_and_extract_viral_crops`. `url_ingest.py` reads metadata/captions with yt-dlp `skip_download`, falls back to AssemblyAI on a remote audio URL, then returns transcript-derived clip windows, crop rectangles, and thumbnail URLs; it does not produce separate video files in this route. `scripts/deploy_mini_run_lambda_gateway.py` packages the gateway and pipeline for Lambda (`prometheus-mini-run-gateway`, 60-second timeout, 512 MB). Existing `GATES-mini-run-aws-sync.md` records a local AWS health success and a production health 503 at the time checked (`MINI_RUN_BACKEND_URL is not configured`); no live AWS URL-ingest request was verified in this diagnosis.

- [x] G3: Findings distinguish confirmed facts from unknowns and include an agent-ready next-step prompt.
  EVIDENCE: Final report separates the proven frontend state boundary and backend source capability from unverified current production deployment/runtime behavior, and supplies a focused implementation prompt.
