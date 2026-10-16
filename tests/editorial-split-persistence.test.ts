import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  applyEditorialTimelinePatch,
  emptyEditorialTimeline,
  readEditorialTimeline,
} from '../lib/editor/editorial-timeline-state'
import { sourceClips, splitSource } from '../lib/editor/timeline-tools'

test('Motion split history enables undo and redo through the controlled split boundary', async () => {
  const { JSDOM } = await import('jsdom')
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost' })
  const browserWindow = dom.window as unknown as typeof globalThis
  Object.assign(globalThis, {
    window: browserWindow,
    document: browserWindow.document,
    HTMLElement: browserWindow.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  })
  try {
    const React = await import('react')
    const { createRoot } = await import('react-dom/client')
    const { useTimelineTools } = await import('../hooks/use-timeline-tools')
    let tools!: ReturnType<typeof useTimelineTools>
    function Harness() {
      const [splits, setSplits] = React.useState([4])
      tools = useTimelineTools({ source: 'source-a', duration: 12, title: 'Source', time: 2, cuts: [], cues: [], splits, onSplits: setSplits })
      return null
    }
    const root = createRoot(browserWindow.document.getElementById('root')!)
    React.act(() => root.render(React.createElement(Harness)))
    React.act(() => tools.split())
    assert.deepEqual(tools.canUndo, true)
    React.act(() => tools.undo())
    assert.deepEqual(tools.canRedo, true)
    React.act(() => tools.redo())
    assert.deepEqual(tools.canUndo, true)
    React.act(() => root.unmount())
  } finally {
    dom.window.close()
    Reflect.deleteProperty(globalThis, 'window')
    Reflect.deleteProperty(globalThis, 'document')
    Reflect.deleteProperty(globalThis, 'HTMLElement')
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT')
  }
})

test('split boundaries persist for the current source and reset when the source changes', () => {
  const initial = emptyEditorialTimeline('source-a')
  const split = applyEditorialTimelinePatch(initial, {
    type: 'split_points',
    points: [6.74],
  })

  assert.ok(split, 'the split action returns a new timeline revision')
  const reloaded = readEditorialTimeline(
    { editorialTimeline: JSON.parse(JSON.stringify(split)) },
    'source-a',
  )
  assert.deepEqual(reloaded.splitPoints, [6.74])

  const replaced = readEditorialTimeline(
    { editorialTimeline: split },
    'source-b',
  )
  assert.deepEqual(replaced.splitPoints, [])
})

test('splitting adds one interior boundary and ignores existing edges and removed ranges', () => {
  const clips = sourceClips(12, 'Source', [6.74], [{ start: 8, end: 10 }])
  assert.deepEqual(splitSource([6.74], clips, 2.5), [2.5, 6.74])
  assert.deepEqual(splitSource([6.74], clips, 6.74), [6.74])
  assert.deepEqual(splitSource([6.74], clips, 9), [6.74])
})
