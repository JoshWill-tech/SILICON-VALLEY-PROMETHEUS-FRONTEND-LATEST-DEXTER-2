# Gates: Video Subtitle Overlay 960 Reference Frame Proportional Scaling

OWNS: GATES.md, lib/editor/video-frame-scaling.ts, hooks/use-video-frame-scale.ts, components/editor/mini-run-live-overlay.tsx, components/editor/PreviewCanvas.tsx, components/mini-run/mini-run-studio.tsx, tests/video-frame-scaling.test.ts

Scope: Implement proportional scaling for the video preview and live draft manifest subtitles referencing the canonical 960 frame (540x960 for 9:16 portrait), ensuring font size, padding, gaps, stroke, and layout bounds scale seamlessly relative to the video dimensions across all screen sizes, devices, and video resolutions without wrapping one word per line or overflowing the video frame.

- [x] G1: Automated test suite validates video frame scale metrics, 960 reference frame conversion, and proportional typography calculations across arbitrary resolutions and display viewports.
  CHECK: node --import tsx --test tests/video-frame-scaling.test.ts
  EXPECT: video frame scaling tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=c575ae1488dc12e7be8b9d0f83d99e98991f01f873c8f1b30caa98cd67927ac1; exit=0; EXPECT=matched; output-sha256=176af1758287475d8aadb747577d4f9513d671e9e093c08ed08fd0c5d4156e85; output-bytes=748; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: MiniRunLiveOverlay uses dynamic video frame scaling referencing the 960 frame rather than hardcoded static 26px font size or fixed padding.
  CHECK: node -e "const fs = require('fs'); const code = fs.readFileSync('components/editor/mini-run-live-overlay.tsx', 'utf8'); if (!code.includes('useVideoFrameScale') || !code.includes('REFERENCE_FRAME_HEIGHT')) process.exit(1); console.log('mini run live overlay 960 scaling verified');"
  EXPECT: mini run live overlay 960 scaling verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=f03226647e270b2e5b7c4d77c3d04f315a3b1a8e29da486da7c60a7a731f07cc; exit=0; EXPECT=matched; output-sha256=d5f644bb411b1ec70514f22af17ead1a4c5f0a5e09bea0a969a298a3229aca4a; output-bytes=43; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Existing collapsible overlay tests pass without regressions.
  CHECK: node --import tsx --test tests/mini-run-collapsible-overlay.test.ts
  EXPECT: mini-run collapsible overlay test passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=bd9d729d86a4358bc0cfef7c9d68da69dfed49e79d094a1acfb396d665a8b0e6; exit=0; EXPECT=matched; output-sha256=7a39547cc28bc23f5e26fae60da64df828d2ed8b077b667ce7f6a4e9ade20404; output-bytes=217; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Full TypeScript compilation passes with zero errors across the entire codebase.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=9aeeb689bde5257e0a85c8ecb0aad3fdaf9ace3e9e5076bbf6758c22760ccfe3; exit=0; EXPECT=matched; output-sha256=2c4af01fb1a5f9597841244575659986624ce8ada13bbc89dce9491fd48c4a46; output-bytes=93; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
