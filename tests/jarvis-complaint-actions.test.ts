import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { parseEditorActionDraft } from '../lib/editor-actions'

test('chat can draft concrete caption, silence, soundtrack and thumbnail actions', () => {
  const actions = [
    { kind: 'set_caption_style', style: 'clean_bold', summary: 'Style the existing captions' },
    { kind: 'request_transcription', summary: 'Start caption transcription' },
    { kind: 'cut_silence', minDurationSec: 0.4, summary: 'Cut transcript-timed pauses' },
    { kind: 'select_soundtrack', query: 'energetic', summary: 'Choose an energetic soundtrack' },
    { kind: 'open_thumbnail_studio', creativeDirection: 'Energetic reel cover', generateNow: true, summary: 'Generate a thumbnail' },
  ]

  assert.deepEqual(actions.map(parseEditorActionDraft).map((action) => action?.kind), [
    'set_caption_style', 'request_transcription', 'cut_silence', 'select_soundtrack', 'open_thumbnail_studio',
  ])

  const toolSource = readFileSync('lib/prometheus-assistant/tools.ts', 'utf8')
  assert.doesNotMatch(toolSource, /anything that mutates timeline media.*must be proposed/i)
  assert.match(toolSource, /enum: \[[^\]]*'set_caption_style'/)
  assert.match(toolSource, /enum: \[[^\]]*'request_transcription'/)
  assert.match(toolSource, /current credit quote and require confirmation before starting/i)
  assert.match(toolSource, /enum: \[[^\]]*'select_soundtrack'/)
})

test('Auto-Cut runs the tracked silence workflow and chat auto-applies returned actions', () => {
  const page = readFileSync('app/editor/[id]/page.tsx', 'utf8')
  const chat = readFileSync('components/editor/PrometheusChat.tsx', 'utf8')
  assert.match(page, /command === 'auto-cut'[\s\S]{0,220}executeSilenceCutWorkflow/)
  assert.doesNotMatch(page, /command === 'auto-cut'[\s\S]{0,220}executeTranscriptCut\('silences'\)/)
  assert.match(page, /<PrometheusChat[\s\S]{0,900}autoApplyActions/)
  assert.match(chat, /if \(!autoApplyActions \|\| !onApplyActions\) continue/)
  assert.match(page, /saveVoiceCaptionStyle\(getEditorialTimelineController\(projectId\)/)
  assert.match(page, /requestAssemblyAITranscription\(\)/)
  assert.match(page, /handleVoiceMusicSearch\(draft\.query, \{ recommendation: true \}\)/)
})
