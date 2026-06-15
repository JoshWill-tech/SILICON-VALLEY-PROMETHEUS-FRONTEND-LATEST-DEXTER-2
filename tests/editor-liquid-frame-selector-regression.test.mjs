import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const selectorPath = 'components/editor/liquid-frame-selector.tsx'
  assert.equal(existsSync(join(root, selectorPath)), true)

  const selector = read(selectorPath)
  assert.match(selector, /LiquidFrameSelector/)
  assert.match(selector, /Refractive Gel Thumb-Track Selector/)
  assert.match(selector, /logarithmicRatioStops/)
  assert.match(selector, /magneticDetents/)
  assert.match(selector, /layoutId="liquid-frame-selector-thumb"/)
  assert.match(selector, /aria-label="Frame aspect selector"/)
  assert.match(selector, /onPresetChange/)
  assert.match(selector, /onFitModeChange/)

  const inspectorPanel = read('components/editor/InspectorPanel.tsx')
  for (const removedText of ['Motion Brain', 'Frame Controls', 'Output frame', 'Canvas format', 'Add source']) {
    assert.equal(inspectorPanel.includes(removedText), false, removedText)
  }
  assert.match(inspectorPanel, /<LiquidFrameSelector/)
  assert.match(inspectorPanel, /onPresetChange=\{handlePresetChange\}/)
  assert.match(inspectorPanel, /onFitModeChange=\{onSetFitMode\}/)

  const previewCanvas = read('components/editor/PreviewCanvas.tsx')
  assert.equal(previewCanvas.includes('Transcribing source'), false)

  const editorHeader = read('components/editor/EditorHeader.tsx')
  assert.equal(editorHeader.includes('ArrowLeft'), false)
  assert.equal(editorHeader.includes('onBack'), false)

  const awwwardsSidebar = read('components/sidebar/AwwwardsSidebar.tsx')
  assert.equal(awwwardsSidebar.includes('ChevronLeft'), false)
  assert.equal(awwwardsSidebar.includes('ChevronRight'), false)
  assert.equal(awwwardsSidebar.includes('Collapse sidebar'), false)
  assert.equal(awwwardsSidebar.includes('Expand sidebar'), false)

  const editorPage = read('app/editor/[id]/page.tsx')
  assert.match(editorPage, /handleEditorHistoryKeyDown/)
  assert.match(editorPage, /event\.altKey/)
  assert.match(editorPage, /event\.key === 'ArrowLeft'/)
  assert.match(editorPage, /event\.key === 'ArrowRight'/)
  assert.match(editorPage, /router\.forward\(\)/)
}

run()
