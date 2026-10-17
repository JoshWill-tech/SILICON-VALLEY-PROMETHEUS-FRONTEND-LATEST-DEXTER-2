# Gates: Render Pipeline Reliability & Project Re-Download Repairs

OWNS: app/api/exports/[id]/download-url/route.ts, app/api/projects/[id]/exports/route.ts, lib/exports/service.ts, components/projects/project-card.tsx, components/projects/project-details-modal.tsx, hooks/use-voice-companion.ts, app/editor/[id]/page.tsx, lib/voice-companion/safe-response.ts, lib/voice-companion/error-sanitizer.ts, tests/render-pipeline-and-download-repair.test.ts

Scope: Resolve both issues: (1) enable reliable downloads and re-downloads of completed edits and assets, including direct download capability from the projects section and permanent Cloudflare R2 storage mirroring; (2) eliminate the misleading "pipeline temporarily busy/reconnecting" error by ensuring fresh session tokens during Jarvis conversations, pre-validating source upload readiness before render dispatch, and preserving truthful diagnostic error messages.

- [x] G1: Export service archives completed Mini-Run outputs to permanent R2 storage and download-url generates durable presigned R2 URLs.
  CHECK: node --import tsx --test tests/render-pipeline-and-download-repair.test.ts
  VERIFIED: ExportService persists storage_path and download-url generates durable R2 links (Pass).

- [x] G2: Projects dashboard (ProjectCard & ProjectDetailsModal) provides a direct download option for projects with completed renders.
  CHECK: node --import tsx --test tests/render-pipeline-and-download-repair.test.ts
  VERIFIED: Projects dashboard provides direct download option on cards and modal (Pass).

- [x] G3: Editor and Jarvis voice companion ensure fresh session authentication and verify source media readiness before render dispatch.
  CHECK: node --import tsx --test tests/render-pipeline-and-download-repair.test.ts
  VERIFIED: Editor and Jarvis voice companion enforce session freshness and source readiness (Pass).

- [x] G4: Error sanitizer and safe-response preserve truthful upstream error messages and only claim "pipeline reconnecting" when upstream network is genuinely unreachable.
  CHECK: node --import tsx --test tests/render-pipeline-and-download-repair.test.ts
  VERIFIED: Error sanitizer and safe-response preserve informative messages without false reconnecting loop (Pass).

- [x] G5: All existing export, safe-response, and voice companion regression tests pass.
  CHECK: node --test tests/safe-response-and-sanitizer.test.mjs tests/prometheus-jarvis-voice-companion.test.mjs
  VERIFIED: All 5 sanitizer tests and all 22 voice companion/session tests pass with zero regressions (Pass).
