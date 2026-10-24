import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('Video Playback Synchronization and Pause Immunity', async () => {
  const pageFile = path.resolve('app/editor/[id]/page.tsx')
  assert.ok(fs.existsSync(pageFile), 'page.tsx must exist')
  const pageContent = fs.readFileSync(pageFile, 'utf8')

  // Check 1: handlePreviewVideoPlay must synchronize setPreviewPlaying(true) unconditionally when video plays
  assert.match(
    pageContent,
    /handlePreviewVideoPlay[\s\S]*?setPreviewPlaying\(true\)/,
    'handlePreviewVideoPlay must set previewPlaying to true when play event fires'
  )

  // Check 2: togglePreviewPlayback must inspect actual video.paused state to avoid desync
  assert.match(
    pageContent,
    /togglePreviewPlayback[\s\S]*?paused/,
    'togglePreviewPlayback must check video.paused to accurately toggle playback'
  )

  // Check 3: MiniRunLiveOverlay must NOT force play on mouse enter/hover when video is paused
  const overlayFile = path.resolve('components/editor/mini-run-live-overlay.tsx')
  assert.ok(fs.existsSync(overlayFile), 'mini-run-live-overlay.tsx must exist')
  const overlayContent = fs.readFileSync(overlayFile, 'utf8')

  assert.doesNotMatch(
    overlayContent,
    /handleMouseEnter[\s\S]*?vid\.paused[\s\S]*?vid\.play\(\)/,
    'Hovering must not force video to play when it was paused by the user'
  )

  // Check 4: PreviewCanvas play/pause toggle button reflects previewPlaying state
  const canvasFile = path.resolve('components/editor/PreviewCanvas.tsx')
  assert.ok(fs.existsSync(canvasFile), 'PreviewCanvas.tsx must exist')
  const canvasContent = fs.readFileSync(canvasFile, 'utf8')

  assert.match(
    canvasContent,
    /data-preview-playback[\s\S]*?previewPlaying\s*\?\s*<Pause[\s\S]*?:[\s\S]*?<Play/,
    'Play button must render Pause when playing and Play when paused'
  )

  console.log('playback sync and pause immunity verified')
})
