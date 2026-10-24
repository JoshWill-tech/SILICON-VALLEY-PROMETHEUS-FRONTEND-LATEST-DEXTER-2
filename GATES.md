# Gates: Expanded Preview Font & Subtitle Carryover

OWNS: components/editor/PreviewCanvas.tsx, components/editor/mini-run-live-overlay.tsx, tests/expanded-preview-fonts.test.ts, GATES.md

Scope: Ensure that when the video preview is expanded into the fullscreen portal in Prometheus Studio, all applied typography presets, custom fonts (Didone, Migra, ZT Otez, Grotesque, Cinzel, etc.), subtitles, and cinematic overlays carry over seamlessly, scaled proportionally to the expanded frame without drift or loss of playback synchronization.

- [x] G1: Expanded preview portal renders MiniRunLiveOverlay bound to fullscreenVideoRef
  CHECK: node --import tsx --test --test-name-pattern="includes MiniRunLiveOverlay" tests/expanded-preview-fonts.test.ts
  EXPECT: pass 1
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; tests=1; pass=1; fail=0

- [x] G2: Expanded preview portal includes CinematicPreviewRuntime for overlay plans
  CHECK: node --import tsx --test --test-name-pattern="includes CinematicPreviewRuntime" tests/expanded-preview-fonts.test.ts
  EXPECT: pass 1
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; tests=1; pass=1; fail=0

- [x] G3: Expanded preview preserves visiblePreviewAspectRatio and bounding metrics
  CHECK: node --import tsx --test --test-name-pattern="aspect ratio preservation" tests/expanded-preview-fonts.test.ts
  EXPECT: pass 1
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; tests=1; pass=1; fail=0

- [x] G4: MiniRun live overlay runs with subtitlesOnly mode in expanded preview
  CHECK: node --import tsx --test --test-name-pattern="subtitlesOnly mode" tests/expanded-preview-fonts.test.ts
  EXPECT: pass 1
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; tests=1; pass=1; fail=0

- [x] G5: Typography presets carry over with proportional scaling across display dimensions
  CHECK: node --import tsx --test --test-name-pattern="Applied fonts from typography presets carry over" tests/expanded-preview-fonts.test.ts
  EXPECT: pass 1
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; tests=1; pass=1; fail=0

- [x] G6: Complete expanded preview font regression suite passes with zero errors
  CHECK: node --import tsx --test tests/expanded-preview-fonts.test.ts
  EXPECT: pass 6
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; tests=6; pass=6; fail=0
