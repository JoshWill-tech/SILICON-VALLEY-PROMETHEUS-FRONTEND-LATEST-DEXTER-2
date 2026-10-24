import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('PreviewCanvas Media Feed Center Visibility and Structural Integrity', async () => {
  const canvasFile = path.resolve('components/editor/PreviewCanvas.tsx')
  assert.ok(fs.existsSync(canvasFile), 'PreviewCanvas.tsx must exist')
  const content = fs.readFileSync(canvasFile, 'utf8')

  // Check 1: motion.div must be a direct child of the centering flex container
  // It must NOT be wrapped in an unconstrained shrink-to-fit flex div that collapses width/height to 0x0
  assert.match(
    content,
    /<div className="relative flex h-full w-full items-center justify-center">\s*<motion\.div/,
    'motion.div must be the direct child of the flex container to preserve aspect-ratio and width calculation'
  )

  // Check 2: motion.div has overflow-visible (or unclipped) so outside HUD can extend to the right
  assert.match(
    content,
    /<motion\.div[\s\S]*?className="relative overflow-visible"/,
    'motion.div must have overflow-visible so the outside HUD rail to the right is not clipped'
  )

  // Check 3: The inner media container has overflow-hidden and rounded-xl to clip the video cleanly
  assert.match(
    content,
    /<div className="relative h-full w-full overflow-hidden rounded-xl">/,
    'Inner media container must have overflow-hidden and rounded-xl to clip the video cleanly'
  )

  // Check 4: MiniRunOutsideHud is positioned outside the video on the right
  assert.match(
    content,
    /<MiniRunOutsideHud[\s\S]*?videoRef={previewVideoRef}/,
    'MiniRunOutsideHud must be embedded with previewVideoRef'
  )

  console.log('preview canvas feed visibility verified')
})
