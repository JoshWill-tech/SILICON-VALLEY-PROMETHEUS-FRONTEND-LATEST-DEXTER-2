import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('Expanded Video Playback Seamlessness and Zero-Lag Subtitle Scrub Architecture', async (t) => {
  const canvasPath = path.resolve('components/editor/PreviewCanvas.tsx')
  assert.ok(fs.existsSync(canvasPath), 'PreviewCanvas.tsx must exist')
  const canvasContent = fs.readFileSync(canvasPath, 'utf8')

  const overlayPath = path.resolve('components/editor/mini-run-live-overlay.tsx')
  assert.ok(fs.existsSync(overlayPath), 'mini-run-live-overlay.tsx must exist')
  const overlayContent = fs.readFileSync(overlayPath, 'utf8')

  await t.test('PreviewCanvas pauses and silences inline video when expanded preview is opened', () => {
    // When isFullscreen is active, the background/inline video must be paused and muted
    // so two desynced videos are not playing simultaneously.
    const pausesInlineOnFullscreen =
      /isFullscreen[\s\S]*?previewVideoRef\.current[\s\S]*?pause\(\)/.test(canvasContent) ||
      /inlineVideo[\s\S]*?pause\(\)/.test(canvasContent)
    assert.ok(
      pausesInlineOnFullscreen,
      'PreviewCanvas must pause the inline video when expanded preview is opened'
    )
  })

  await t.test('Expanded video does NOT continuously seek inline video on normal timeupdate', () => {
    // On the fullscreen video element, onTimeUpdate must NOT call onSeekPreview(currentTime)
    // which previously forced inline video to seek on every single playhead tick.
    const callsSeekOnTimeUpdate = /fullscreenVideoRef[\s\S]*?onTimeUpdate=\{\(event\)\s*=>\s*onSeekPreview\(/.test(
      canvasContent
    )
    assert.ok(
      !callsSeekOnTimeUpdate,
      'fullscreenVideoRef must NOT seek inline video on every timeupdate, preventing dual-video seek fighting'
    )
  })

  await t.test('Inline overlay is marked inactive when expanded preview is open to stop redundant RAF loops', () => {
    // The inline MiniRunLiveOverlay must receive active={!isFullscreen} so its 60fps RAF loop
    // and rendering cycle are suspended while the expanded modal is open.
    const hasInactiveInlineOverlay =
      /<MiniRunLiveOverlay[\s\S]*?videoRef={previewVideoRef}[\s\S]*?active={!isFullscreen}/.test(
        canvasContent
      ) ||
      /<MiniRunLiveOverlay[\s\S]*?active={!isFullscreen}[\s\S]*?videoRef={previewVideoRef}/.test(
        canvasContent
      )
    assert.ok(
      hasInactiveInlineOverlay,
      'Inline MiniRunLiveOverlay must be suspended when isFullscreen is active'
    )
  })

  await t.test('MiniRunLiveOverlay subtitle transitions do NOT use blocking mode="wait"', () => {
    // mode="wait" blocks the active chunk at the scrubbed timestamp from rendering
    // until previous exiting chunks complete, causing lag that increments linearly with each scrub.
    const hasModeWaitInOverlay = /<AnimatePresence\s+mode="wait">[\s\S]*?activeChunk/.test(overlayContent)
    assert.ok(
      !hasModeWaitInOverlay,
      'MiniRunLiveOverlay must not use mode="wait" for activeChunk subtitle display to allow instant scrubbing'
    )
  })

  await t.test('MiniRunLiveOverlay word spans avoid layout-thrashing transition-all', () => {
    // transition-all on every word span forces layout recalculation on every frame.
    // It must use targeted GPU-friendly transitions such as transition-[transform,color,opacity].
    const usesTransitionAllOnWords = /className=\{`cursor-pointer transition-all duration-75/.test(
      overlayContent
    )
    assert.ok(
      !usesTransitionAllOnWords,
      'MiniRunLiveOverlay words must not use transition-all, preventing layout reflows during playback and scrub'
    )
  })

  await t.test('Playhead and playback state synchronize cleanly upon exiting expanded mode', () => {
    // When closing expanded preview, playhead time is handed back to inline video and resumed if playing.
    const syncsOnExit =
      /inlineVideo\.currentTime\s*=\s*fsVideo\.currentTime/.test(canvasContent) ||
      /previewVideoRef\.current\.currentTime\s*=\s*fullscreenVideoRef\.current\.currentTime/.test(canvasContent)
    assert.ok(
      syncsOnExit,
      'Exiting expanded preview must synchronize currentTime back to inline video'
    )
  })
})
