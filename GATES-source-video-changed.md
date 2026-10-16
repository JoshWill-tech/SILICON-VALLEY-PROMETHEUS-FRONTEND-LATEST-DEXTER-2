# Gates: source-video-changed render rejection

Scope: explain the source identity mismatch, prevent render submission while a replacement source is not durably committed, and verify the committed-source path still works.

- [x] G1: The client/database source identity race is traced to concrete code boundaries
  EVIDENCE: handleInlineSourceSelection stages a browser-local preview and updates BrowserProjectManager/localStorage immediately, then starts uploadProjectSourceMultipart in the background. The server's maul_commit_source_revision updates the durable project source only after upload verification. During that gap the render UI had only checked that sourceAssetId existed, while POST /api/projects/[id]/exports compared the request ID against projects.source_asset_id and returned the reported 409. This is the source identity race; the server fence is correct and must remain.
- [x] G2: Render submission is blocked while source upload is pending or failed and re-enabled after commit
  EVIDENCE: Both desktop/mobile delivery controls receive ready/uploading/failed state. Their button and handler share canSubmitSourceRender. Voice and other page render submissions use the same guard. The upload is marked successful only after server commit and local source ID replacement; failures remain blocked with a reselect prompt.
- [x] G3: A regression check covers pending, failed, missing-source, and committed-source cases
  EVIDENCE: node --import tsx tests/source-render-readiness.test.ts passed; it also asserts that the delivery button/handler, parent render path, failure state, and all component call sites are wired to the guard. The test failed before the helper existed and passed after implementation.
- [x] G4: Focused checks and production build pass; unrelated repository type errors are diagnosed and the server-side source-change fence remains intact
  EVIDENCE: Regression test, existing delivery test, targeted ESLint, focused TypeScript project check, git diff --check, and clean-shell production build all passed. The full repository typecheck still reports errors in unrelated in-progress split-source code (page.tsx line 6292) and a separate volume-control test; it reports no error in this fix. POST /api/projects/[id]/exports still performs the authoritative project source ID comparison before loading or dispatching the asset.
