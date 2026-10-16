import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  applyEditorialTimelinePatch,
  emptyEditorialTimeline,
  readEditorialTimeline,
} from '../lib/editor/editorial-timeline-state'
import { sourceClips, splitSource } from '../lib/editor/timeline-tools'

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
