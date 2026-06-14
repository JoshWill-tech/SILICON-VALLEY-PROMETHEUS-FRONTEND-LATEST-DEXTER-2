import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const commandZone = read('components/editor/CommandZone.tsx')
  assert.match(commandZone, /command-zone-backdrop/)
  assert.equal(commandZone.includes('<kbd'), false)
  assert.equal(commandZone.includes('action.shortcut'), false)
  assert.match(commandZone, /aria-label=\{action\.label\}/)

  const inspectorPanel = read('components/editor/InspectorPanel.tsx')
  assert.match(inspectorPanel, /id="lusion-viscous-membrane"/)
  assert.match(inspectorPanel, /liquid-video-size-chip/)
  assert.match(inspectorPanel, /liquid-video-size-chip__membrane/)
  assert.match(inspectorPanel, /liquid-video-fit-toggle/)
  assert.match(inspectorPanel, /liquid-video-fit-option/)

  const globalStyles = read('app/globals.css')
  assert.match(globalStyles, /\.command-zone-backdrop/)
  assert.match(globalStyles, /\.liquid-video-size-chip/)
  assert.match(globalStyles, /filter: url\("#lusion-viscous-membrane"\)/)
  assert.match(globalStyles, /--liquid-size-x/)
  assert.match(globalStyles, /prefers-reduced-motion: reduce/)
}

run()
