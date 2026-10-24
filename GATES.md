# Gates: Video Subtitle Overlay 960 Reference Frame Proportional Scaling and Feed Visibility

OWNS: GATES.md, lib/editor/video-frame-scaling.ts, hooks/use-video-frame-scale.ts, components/editor/mini-run-live-overlay.tsx, components/editor/PreviewCanvas.tsx, components/editor/mini-run-outside-hud.tsx, tests/video-frame-scaling.test.ts, tests/preview-canvas-feed-visibility.test.ts

Scope: Implement proportional scaling for the video preview and live draft manifest subtitles referencing the canonical 960 frame (540x960 for 9:16 portrait), ensure the center video media feed remains uncollapsed and fully visible, and anchor the outside morphing HUD rail directly to the right of the video.

- [x] G1: Automated test suite validates video frame scale metrics, 960 reference frame conversion, and proportional typography calculations across arbitrary resolutions and display viewports.
  CHECK: node --import tsx --test tests/video-frame-scaling.test.ts
  EXPECT: video frame scaling tests passed

- [x] G2: MiniRunLiveOverlay uses dynamic video frame scaling referencing the 960 frame rather than hardcoded static 26px font size or fixed padding.
  CHECK: node -e "const fs = require('fs'); const code = fs.readFileSync('components/editor/mini-run-live-overlay.tsx', 'utf8'); if (!code.includes('useVideoFrameScale') || !code.includes('REFERENCE_FRAME_HEIGHT')) process.exit(1); console.log('mini run live overlay 960 scaling verified');"
  EXPECT: mini run live overlay 960 scaling verified

- [x] G3: Existing collapsible overlay tests pass without regressions.
  CHECK: node --import tsx --test tests/mini-run-collapsible-overlay.test.ts
  EXPECT: mini-run collapsible overlay test passed

- [x] G4: Center video feed remains uncollapsed with direct flex hierarchy and outside HUD properly anchored to the right.
  CHECK: node --import tsx --test tests/preview-canvas-feed-visibility.test.ts
  EXPECT: preview canvas feed visibility verified

- [x] G5: Full TypeScript compilation passes with zero errors across the entire codebase.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
