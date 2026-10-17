# Jarvis filament visibility repair

The top navigation could show the Listening capsule while the cyan filament above it was invisible.

## Confirmed cause

`JarvisTopNavFilament` renders the straight path `M 0 16 L 200 16` before its first animation frame, while idle, and when reduced motion is enabled. That path has a zero-height geometry bounding box. Both the gradient and the glow filter previously used SVG's default object-bounding-box coordinates, which cannot render that degenerate case.

The regression fixture mounts the actual component with isolated voice services and rasterizes its actual SVG with Sharp. Before the fix, the idle case and the reduced-motion listening/speaking cases failed the visible-pixel assertion; all four animated states passed (4 passing, 3 failing). This reproduces the missing graphic independently of any voice connection.

## Repair

- Set `gradientUnits="userSpaceOnUse"` and define the gradient across the existing 200-unit view box.
- Set `filterUnits="userSpaceOnUse"` with a nonzero region around the waveform.
- Preserve the waveform, colors, reduced-motion behavior, animation cadence, and voice/session controls.

Only `components/navigation/jarvis-top-nav-filament.tsx` changes in production code. Existing editor and upload changes in the workspace are outside this repair. The existing root `GATES.md` tracks a different incident, so this task uses `GATES-jarvis-filament.md`.

## Verification

The regression test covers idle visibility, reduced-motion visibility while listening and speaking, and animation while listening, speaking, connecting, and interrupted. It separately rasterizes the core and bloom layers, verifies that an invisible control produces no painted pixels, and checks animation-frame cleanup on unmount. Voice services, the expanded dock, and Framer Motion's reduced-motion preference are isolated in this fixture; it is a component/SVG rendering check rather than an authenticated browser session.

- Before-fix reproduction: `node --test --test-reporter=tap tests/jarvis-filament-visibility.test.mjs` — 4 passed, 3 failed on flat-line visibility.
- After-fix rendering regression: the same command passed all 7 tests, including independent core/glow visibility and animation cleanup.
- Final regression, lint, and typecheck evidence: recorded by the task gate checker in `GATES-jarvis-filament.md`.
- Baseline project typecheck passed.
- Baseline and final production builds were both blocked with “Another next build process is already running.” No unrelated process or build lock was removed. Repository lint is still pending.
- Browser connection attempts timed out, so visual verification uses actual SVG rasterization rather than a live browser screenshot.

No dependency, authentication, billing, or editor-logic changes are required.
