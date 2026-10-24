import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('Mini-Run Live Overlay Collapsible Architecture', async () => {
  const overlayFile = path.resolve('components/editor/mini-run-live-overlay.tsx')
  assert.ok(fs.existsSync(overlayFile), 'mini-run-live-overlay.tsx must exist')

  const content = fs.readFileSync(overlayFile, 'utf8')

  // Check 1: Collapsible state support
  assert.match(
    content,
    /isCollapsed|setCollapsed|toggleCollapsed|isExpanded/i,
    'Overlay must support collapsible state to eliminate frame clutter'
  )

  // Check 2: Hover interaction support (image/poster into video on hover, controls reveal on hover)
  assert.match(
    content,
    /isHovered|handleMouseEnter|handleMouseLeave|onMouseEnter|hover/i,
    'Overlay must support hover awareness for seamless preview interactions'
  )

  // Check 3: Presets container should prevent awkward multi-line bloated wrapping
  assert.match(
    content,
    /whitespace-nowrap|no-scrollbar|overflow-x-auto|segmented/i,
    'Style presets container must avoid bloated multi-line wrapping in narrow portrait frames'
  )

  // Check 4: Preserves core store actions
  assert.match(content, /updateWordText/, 'Must preserve word text editing')
  assert.match(content, /toggleWordCut/, 'Must preserve word cut toggling')
  assert.match(content, /setGlobalTypography/, 'Must preserve global typography styling')
  assert.match(content, /reset/, 'Must preserve draft reset')
  assert.match(content, /handleBakeFinal/, 'Must preserve final video bake workflow')

  // Check 5: Minimalist title / Apple-style HUD: no giant 3-line all-caps wrapping title
  assert.doesNotMatch(
    content,
    /text-xs font-semibold text-white tracking-wide uppercase">[\s\S]*?Mini-Run Live Preview/,
    'Must not have the bloated multi-line uppercase static title banner'
  )

  // Check 6: Check PreviewCanvas hover integration and instantaneous autoplay
  const canvasFile = path.resolve('components/editor/PreviewCanvas.tsx')
  assert.ok(fs.existsSync(canvasFile), 'PreviewCanvas.tsx must exist')
  const canvasContent = fs.readFileSync(canvasFile, 'utf8')
  assert.match(
    canvasContent,
    /MiniRunLiveOverlay/,
    'PreviewCanvas must embed MiniRunLiveOverlay'
  )
  assert.match(
    canvasContent,
    /<video[\s\S]*?autoPlay/,
    'PreviewCanvas video element must have autoPlay attribute for instantaneous playback'
  )

  // Check 7: Overlay triggers instantaneous playback without delay
  assert.match(
    content,
    /triggerInstantPlay|canplay|loadeddata/,
    'Overlay must initiate instantaneous playback on mount and media ready'
  )

  // Check 8: MiniRunStudio video has autoPlay
  const studioFile = path.resolve('components/mini-run/mini-run-studio.tsx')
  assert.ok(fs.existsSync(studioFile), 'mini-run-studio.tsx must exist')
  const studioContent = fs.readFileSync(studioFile, 'utf8')
  assert.match(
    studioContent,
    /<video[\s\S]*?autoPlay/,
    'MiniRunStudio video element must have autoPlay attribute'
  )

  console.log('mini-run collapsible overlay test passed')
})
