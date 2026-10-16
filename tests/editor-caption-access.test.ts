import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyEditorialTimelinePatch, emptyEditorialTimeline, readEditorialTimeline } from '../lib/editor/editorial-timeline-state'

test('manual caption cue and style are valid source-bound saved timeline state', () => {
  const sourceAssetId = 'source-clean-footage'
  const initial = emptyEditorialTimeline(sourceAssetId)
  const styled = applyEditorialTimelinePatch(initial, { type: 'caption_style', style: 'lower_third' })
  const edited = applyEditorialTimelinePatch(styled, {
    type: 'cues',
    cues: [{
      id: 'manual-caption-1', type: 'text', title: 'Manual caption', text: 'A manually entered line',
      start: 2, end: 5, origin: 'editor', context: { source: 'manual_caption' },
    }],
  })
  const restored = readEditorialTimeline({ editorialTimeline: edited }, sourceAssetId)
  assert.equal(restored.captionStyle, 'lower_third')
  assert.equal(restored.cues[0]?.text, 'A manually entered line')
  assert.equal(readEditorialTimeline({ editorialTimeline: edited }, 'replacement-source').cues.length, 0)
})

test('Motion captions expose styling and manual text entry while transcription keeps the quote gate', async () => {
  const fs = await import('node:fs/promises')
  const [motion, request] = await Promise.all([
    fs.readFile(new URL('../components/editor/motion-edit-workspace.tsx', import.meta.url), 'utf8'),
    fs.readFile(new URL('../lib/editor/request-transcription.ts', import.meta.url), 'utf8'),
  ])
  assert.match(motion, /aria-label="Caption style"/)
  assert.match(motion, /aria-label="Manual caption text"/)
  assert.match(motion, /source: 'manual_caption'/)
  assert.match(request, /if \(!quote\.canAfford\)/)
  assert.match(request, /confirm\(`Transcribe this video for/)
})
