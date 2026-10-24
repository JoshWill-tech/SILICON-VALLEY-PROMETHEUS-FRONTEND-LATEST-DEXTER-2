import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('Mini-Run Outside Morphing HUD Architecture', async () => {
  // Check 1: PreviewCanvas embeds the outside HUD rail anchored to the right of the video
  const canvasFile = path.resolve('components/editor/PreviewCanvas.tsx')
  assert.ok(fs.existsSync(canvasFile), 'PreviewCanvas.tsx must exist')
  const canvasContent = fs.readFileSync(canvasFile, 'utf8')

  assert.match(
    canvasContent,
    /left-\[calc\(100%\+[\s\S]*?\)|left-full[\s\S]*?MiniRunOutsideHud|outside-hud|MiniRunOutsideRail/i,
    'PreviewCanvas must position the outside HUD rail to the right side of the video frame'
  )

  // Check 2: Outside HUD component exists and provides morphing/expand on hover
  const hudFile = path.resolve('components/editor/mini-run-outside-hud.tsx')
  assert.ok(fs.existsSync(hudFile), 'mini-run-outside-hud.tsx must exist')
  const hudContent = fs.readFileSync(hudFile, 'utf8')

  // Status & Bake Pill morphs/expands
  assert.match(
    hudContent,
    /Live Draft|Rendered MP4/,
    'Outside HUD must display Draft and Render status'
  )
  assert.match(
    hudContent,
    /handleBakeFinal|Bake Video/,
    'Outside HUD must include Bake Video action'
  )

  // Typography preset switcher morphs/expands
  assert.match(
    hudContent,
    /TYPOGRAPHY_PRESETS|setGlobalTypography/,
    'Outside HUD must support typography styling presets'
  )

  // Chunk stats & navigation
  assert.match(
    hudContent,
    /chunks\.length| ch/,
    'Outside HUD must present chunk count and navigation'
  )

  // Spring animations for morphing/expansion
  assert.match(
    hudContent,
    /spring|motion\.div|layout/,
    'Outside HUD must use Framer Motion layout / spring transitions for morphing expansion on hover'
  )

  // Check 3: MiniRunLiveOverlay in subtitles-only mode does not squish control docks inside video
  const overlayFile = path.resolve('components/editor/mini-run-live-overlay.tsx')
  assert.ok(fs.existsSync(overlayFile), 'mini-run-live-overlay.tsx must exist')
  const overlayContent = fs.readFileSync(overlayFile, 'utf8')

  assert.match(
    overlayContent,
    /subtitlesOnly|showControls|hideControls|mode/i,
    'MiniRunLiveOverlay must support decoupling subtitles from control docks to prevent squishing'
  )

  console.log('outside morphing hud architecture verified')
})
