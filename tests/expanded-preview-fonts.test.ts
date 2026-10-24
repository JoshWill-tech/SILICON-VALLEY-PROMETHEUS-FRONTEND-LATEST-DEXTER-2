import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { resolveFontFamily, TYPOGRAPHY_PRESETS } from '../components/editor/mini-run-live-overlay'
import { calculateScaledTypography, calculateVideoFrameScale } from '../lib/editor/video-frame-scaling'
import { useMiniRunDraftStore } from '../lib/editor/mini-run-draft-store'

test('Expanded Preview Font and Subtitle Carryover Architecture', async (t) => {
  const canvasPath = path.resolve('components/editor/PreviewCanvas.tsx')
  assert.ok(fs.existsSync(canvasPath), 'PreviewCanvas.tsx must exist')
  const canvasContent = fs.readFileSync(canvasPath, 'utf8')

  await t.test('Expanded preview portal includes MiniRunLiveOverlay with fullscreen video ref', () => {
    // Check that inside the expanded/fullscreen portal (createPortal / role="dialog" / "Expanded preview"),
    // MiniRunLiveOverlay is rendered with videoRef={fullscreenVideoRef}
    const hasExpandedOverlay = /isFullscreen[\s\S]*?createPortal[\s\S]*?<MiniRunLiveOverlay[\s\S]*?videoRef={fullscreenVideoRef}/.test(
      canvasContent
    )
    assert.ok(
      hasExpandedOverlay,
      'Expanded preview portal must include <MiniRunLiveOverlay> bound to fullscreenVideoRef so applied fonts carry over'
    )
  })

  await t.test('Expanded preview portal includes CinematicPreviewRuntime for kinetic overlay plans', () => {
    const hasCinematicRuntime = /isFullscreen[\s\S]*?createPortal[\s\S]*?<CinematicPreviewRuntime[\s\S]*?animationPlan={previewOverlayPlan}/.test(
      canvasContent
    )
    assert.ok(
      hasCinematicRuntime,
      'Expanded preview portal must include <CinematicPreviewRuntime> so animation cues and speech typography carry over'
    )
  })

  await t.test('Expanded preview video container enforces aspect ratio preservation', () => {
    // The container inside the fullscreen dialog must maintain the video aspect ratio and bounds
    const hasAspectRatioStyle = /isFullscreen[\s\S]*?createPortal[\s\S]*?aspectRatio:\s*visiblePreviewAspectRatio/.test(
      canvasContent
    )
    assert.ok(
      hasAspectRatioStyle,
      'Expanded preview video container must maintain visiblePreviewAspectRatio so scaling engine computes accurate font sizes'
    )
  })

  await t.test('MiniRun live overlay in expanded preview uses subtitlesOnly mode', () => {
    const hasSubtitlesOnly = /isFullscreen[\s\S]*?createPortal[\s\S]*?<MiniRunLiveOverlay[\s\S]*?subtitlesOnly={true}/.test(
      canvasContent
    )
    assert.ok(
      hasSubtitlesOnly,
      'MiniRunLiveOverlay in expanded preview should run with subtitlesOnly={true} for clean presentation'
    )
  })

  await t.test('Applied fonts from typography presets carry over into scaled typography', () => {
    // Test that when any typography preset is applied in store,
    // the typography scaling engine derives the exact font family and scaled sizes for expanded dimensions
    const store = useMiniRunDraftStore.getState()
    store.reset()

    // Test each preset
    for (const preset of TYPOGRAPHY_PRESETS) {
      store.setGlobalTypography(preset.styling, preset.layersTemplate)
      const currentChunks = useMiniRunDraftStore.getState().chunks

      // If we have an active chunk, check that resolveFontFamily maps correctly
      const expectedFamily = resolveFontFamily(preset.styling.fontFamily)
      assert.ok(expectedFamily.length > 0, `Preset ${preset.id} must resolve a valid font family`)

      // Measure scale at expanded dimensions (e.g. 540x960 portrait in 1080p fullscreen)
      const expandedMetrics = calculateVideoFrameScale({
        renderedWidth: 571.5,
        renderedHeight: 1016,
        aspectRatio: 9 / 16,
      })

      assert.ok(expandedMetrics.scale > 1.0, 'Scale at expanded resolution should be > 1.0 relative to 960p reference')

      const scaled = calculateScaledTypography({
        metrics: expandedMetrics,
        typography: preset.styling,
        layers: preset.layersTemplate?.hero ? [
          {
            layerIndex: 0,
            role: 'primary_focus_word',
            text: 'TEST',
            words: [{ text: 'TEST', startMs: 0, endMs: 1000 }],
            isHero: true,
            fontFamily: (preset.layersTemplate.hero as any)?.fontFamily || 'Inter',
            ...preset.layersTemplate.hero,
          }
        ] : null,
      })

      assert.ok(scaled.fontSize > 0, `Preset ${preset.id} scaled fontSize must be positive`)
      if (scaled.layers && scaled.layers.length > 0) {
        assert.ok(scaled.layers[0].fontSize > scaled.fontSize, 'Hero layer font size should scale proportionally larger')
      }
    }
  })
})
