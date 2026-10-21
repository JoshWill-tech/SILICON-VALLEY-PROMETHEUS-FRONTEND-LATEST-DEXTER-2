import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const gate = args.find((a, i) => args[i - 1] === '--gate') || 'all'

const readSource = (file) => readFileSync(join(process.cwd(), file), 'utf8')

if (gate === 'g1' || gate === 'all') {
  const antiTamperSource = readSource('lib/security/client-anti-tamper.ts')
  // Verify throttling and/or edge tracking exists to prevent repetitive console.clear() loops
  assert.ok(
    /devToolsDetectionCount|lastDevToolsDetectedAt|wasOpen|isOpen && !wasOpen/.test(antiTamperSource),
    'Anti-tamper must gate repetitive handleDevToolsDetected calls or track state transitions'
  )
  assert.match(antiTamperSource, /export function isDevToolsOpen/)
  assert.match(antiTamperSource, /export function handleDevToolsDetected/)

  // Run test
  const res = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'tests/mobile-view-performance-rectification.test.ts'], {
    encoding: 'utf8',
    env: process.env,
  })
  if (res.status !== 0) {
    console.error(res.stdout, res.stderr)
    process.exit(1)
  }
  console.log('g1 anti-tamper mobile inspection verification passed')
}

if (gate === 'g2' || gate === 'all') {
  const luxurySource = readSource('components/luxury-motion-controller.tsx')
  // Verify mobile viewport check exists to prevent pointer tracking and rAF loops on mobile
  assert.ok(
    /innerWidth < 768|max-width: 768px|isMobileViewport/.test(luxurySource),
    'LuxuryMotionController must detect mobile viewport and avoid continuous pointermove rAF updates'
  )
  assert.match(luxurySource, /RESTING_POSITION/)
  console.log('g2 luxury motion mobile gating verification passed')
}

if (gate === 'g3' || gate === 'all') {
  const swipeSource = readSource('app/hooks/useSwipeGesture.ts')
  // Verify passive event listeners on window
  assert.match(swipeSource, /'pointermove',\s*handleMove,\s*\{\s*passive:\s*true\s*\}/)
  assert.match(swipeSource, /'mousemove',\s*handleMove,\s*\{\s*passive:\s*true\s*\}/)
  console.log('g3 swipe gesture passive listeners verification passed')
}

if (gate === 'g4' || gate === 'all') {
  const gooeySource = readSource('components/ui/gooey-text-morphing.tsx')
  const jarvisSource = readSource('components/navigation/jarvis-top-nav-filament.tsx')

  // Verify GooeyText checks visibility or offsetParent before running rAF
  assert.ok(
    /offsetParent|getClientRects|isVisible/.test(gooeySource),
    'GooeyText must verify container visibility before running rAF animation loops'
  )

  // Verify Jarvis filament gates mobile viewport
  assert.ok(
    /innerWidth < 768|max-width: 768px|isMobileScreen/.test(jarvisSource),
    'Jarvis filament must gate rAF animation loop on mobile viewports'
  )

  console.log('g4 mobile animation gating verification passed')
}

if (gate === 'g5' || gate === 'all') {
  // Run both original anti-tamper tests and mobile performance rectification tests
  const test1 = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'tests/client-anti-tamper.test.ts'], {
    encoding: 'utf8',
    env: process.env,
  })
  if (test1.status !== 0) {
    console.error(test1.stdout, test1.stderr)
    process.exit(1)
  }

  const test2 = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'tests/mobile-view-performance-rectification.test.ts'], {
    encoding: 'utf8',
    env: process.env,
  })
  if (test2.status !== 0) {
    console.error(test2.stdout, test2.stderr)
    process.exit(1)
  }

  const test3 = spawnSync(process.execPath, ['--test', 'tests/gooey-animation-performance.test.mjs'], {
    encoding: 'utf8',
    env: process.env,
  })
  if (test3.status !== 0) {
    console.error(test3.stdout, test3.stderr)
    process.exit(1)
  }

  console.log('g5 mobile performance regression tests passed')
}
