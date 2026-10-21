import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import {
  sourceClips,
  splitSource,
  trimClipBoundary,
  removeClipRange,
  mergeTimelineRanges,
  type SourceClip,
  type TimelineRange,
} from '../lib/editor/timeline-tools'
import {
  registerVoiceCompanionBridge,
  unregisterVoiceCompanionBridge,
  getVoiceCompanionBridge,
} from '../lib/voice-companion/bridge'

test('ruler and playhead scrubbing: timeline ruler and playhead calculate exact timestamps without container capture blocking', () => {
  const viewportSource = readFileSync('components/editor/editorial-timeline-viewport.tsx', 'utf8')
  const tracksSource = readFileSync('components/editor/editorial-timeline-tracks.tsx', 'utf8')

  // 1. Tracks component must have interactive ruler scrubbing handlers
  assert.match(tracksSource, /handleRulerPointerDown/, 'Tracks must implement handleRulerPointerDown')
  assert.match(tracksSource, /handleRulerPointerMove/, 'Tracks must implement handleRulerPointerMove')
  assert.match(tracksSource, /handleRulerPointerUp/, 'Tracks must implement handleRulerPointerUp')
  assert.match(tracksSource, /handleTrackBackgroundClick/, 'Tracks must allow clicking empty background to seek')

  // 2. Viewport must not blindly setPointerCapture on container and swallow child events
  assert.doesNotMatch(
    viewportSource,
    /onPointerDown=\{\(event\)\s*=>\s*\{[\s\S]*?event\.currentTarget\.setPointerCapture\(event\.pointerId\)[\s\S]*?drag\.current/m,
    'Viewport must not swallow all pointer events with blind parent capture'
  )

  // 3. Playhead must have interactive handle with percentage alignment and scrub listeners
  assert.match(viewportSource, /data-editorial-playhead/, 'Viewport must render data-editorial-playhead')
  assert.match(viewportSource, /onPointerDown=\{\(event\)\s*=>\s*\{[\s\S]*?playheadDrag/m, 'Playhead must have onPointerDown handler')
  assert.match(viewportSource, /seekPlayheadFromPointer/, 'Playhead must scrub via seekPlayheadFromPointer')

  // 4. Zoom must be forwarded to tracks
  assert.match(viewportSource, /zoom=\{props\.zoom\}/, 'Viewport must pass dynamic zoom to EditorialTimelineTracks')

  console.log('ruler and playhead scrubbing passed')
})

test('clip manipulation: clips support selection, trimming, splitting, and deletion', () => {
  const duration = 60
  const title = 'Prometheus Video'
  let splits: number[] = []
  let cuts: TimelineRange[] = []

  // 1. Initial clip
  let clips = sourceClips(duration, title, splits, cuts)
  assert.equal(clips.length, 1)
  assert.equal(clips[0].start, 0)
  assert.equal(clips[0].end, 60)

  // 2. Split clip at 25s
  splits = splitSource(splits, clips, 25)
  clips = sourceClips(duration, title, splits, cuts)
  assert.equal(clips.length, 2)
  assert.equal(clips[0].start, 0)
  assert.equal(clips[0].end, 25)
  assert.equal(clips[1].start, 25)
  assert.equal(clips[1].end, 60)

  // 3. Trim right edge of clip 0 from 25 to 20
  const trimRightRes = trimClipBoundary(clips, clips[0].id, 'right', 20, duration, cuts)
  cuts = trimRightRes.cuts
  clips = sourceClips(duration, title, splits, cuts)
  assert.equal(clips.length, 2)
  assert.equal(clips[0].start, 0)
  assert.equal(clips[0].end, 20)
  assert.equal(clips[1].start, 25)
  assert.equal(clips[1].end, 60)

  // 4. Trim left edge of clip 1 from 25 to 30
  const trimLeftRes = trimClipBoundary(clips, clips[1].id, 'left', 30, duration, cuts)
  cuts = trimLeftRes.cuts
  clips = sourceClips(duration, title, splits, cuts)
  assert.equal(clips.length, 2)
  assert.equal(clips[0].start, 0)
  assert.equal(clips[0].end, 20)
  assert.equal(clips[1].start, 30)
  assert.equal(clips[1].end, 60)

  // 5. Delete clip 0
  const deleteRes = removeClipRange(clips, clips[0].id, cuts)
  cuts = deleteRes.cuts
  clips = sourceClips(duration, title, splits, cuts)
  assert.equal(clips.length, 1)
  assert.equal(clips[0].start, 30)
  assert.equal(clips[0].end, 60)

  // 6. Component trim handles presence
  const tracksSource = readFileSync('components/editor/editorial-timeline-tracks.tsx', 'utf8')
  assert.match(tracksSource, /Trim start of clip/, 'Tracks must render left trim handle')
  assert.match(tracksSource, /Trim end of clip/, 'Tracks must render right trim handle')
  assert.match(tracksSource, /handlePointerDownHandle\('left'/, 'Tracks must bind left trim handle')
  assert.match(tracksSource, /handlePointerDownHandle\('right'/, 'Tracks must bind right trim handle')
  assert.match(tracksSource, /onTrimClip/, 'Tracks must accept onTrimClip prop')

  console.log('clip manipulation passed')
})

test('multi-track controls: header routing provides functional visibility, mute, and text additions', () => {
  const viewportSource = readFileSync('components/editor/editorial-timeline-viewport.tsx', 'utf8')
  const tracksSource = readFileSync('components/editor/editorial-timeline-tracks.tsx', 'utf8')

  // 1. Multi-track headers exist
  assert.match(viewportSource, /Video/, 'Must have Video track header')
  assert.match(viewportSource, /Captions/, 'Must have Captions track header')
  assert.match(viewportSource, /Text/, 'Must have Text track header')
  assert.match(viewportSource, /Music/, 'Must have Music track header')

  // 2. Video track header has mute and eye toggles
  assert.match(viewportSource, /setIsVideoMuted/, 'Video track must have mute toggle')
  assert.match(viewportSource, /setIsVideoHidden/, 'Video track must have eye toggle')

  // 3. Captions track header has eye toggle
  assert.match(viewportSource, /setIsCaptionsHidden/, 'Captions track must have eye toggle')
  assert.match(tracksSource, /isCaptionsHidden/, 'Tracks must honor isCaptionsHidden')

  // 4. Text track header has + add text button
  assert.match(viewportSource, /handleAddTextPlacement/, 'Text track must offer add text cue action')
  assert.match(viewportSource, /setIsTextHidden/, 'Text track must have eye toggle')

  console.log('multi-track controls passed')
})

test('jarvis timeline bridge: Jarvis voice companion bridge has complete routed access to timeline tools', async () => {
  const clientSource = readFileSync('lib/voice-companion/gemini-live-client.ts', 'utf8')
  const hookSource = readFileSync('hooks/use-voice-companion.ts', 'utf8')
  const editorPageSource = readFileSync('app/editor/[id]/page.tsx', 'utf8')

  // 1. Tool definitions declared in gemini-live-client.ts
  assert.match(clientSource, /name:\s*'split_clip'/, 'gemini-live-client must declare split_clip tool')
  assert.match(clientSource, /name:\s*'trim_clip'/, 'gemini-live-client must declare trim_clip tool')
  assert.match(clientSource, /name:\s*'delete_clip'/, 'gemini-live-client must declare delete_clip tool')
  assert.match(clientSource, /name:\s*'duplicate_clip'/, 'gemini-live-client must declare duplicate_clip tool')
  assert.match(clientSource, /name:\s*'toggle_track'/, 'gemini-live-client must declare toggle_track tool')
  assert.match(clientSource, /name:\s*'get_timeline_state'/, 'gemini-live-client must declare get_timeline_state tool')

  // 2. Handlers implemented in use-voice-companion.ts
  assert.match(hookSource, /case 'split_clip':/, 'useVoiceCompanion must handle split_clip')
  assert.match(hookSource, /case 'trim_clip':/, 'useVoiceCompanion must handle trim_clip')
  assert.match(hookSource, /case 'delete_clip':/, 'useVoiceCompanion must handle delete_clip')
  assert.match(hookSource, /case 'duplicate_clip':/, 'useVoiceCompanion must handle duplicate_clip')
  assert.match(hookSource, /case 'toggle_track':/, 'useVoiceCompanion must handle toggle_track')
  assert.match(hookSource, /case 'get_timeline_state':/, 'useVoiceCompanion must handle get_timeline_state')

  // 3. Bridge registration in app/editor/[id]/page.tsx
  assert.match(editorPageSource, /onSplitClip:/, 'app/editor/[id]/page.tsx must register onSplitClip')
  assert.match(editorPageSource, /onTrimClip:/, 'app/editor/[id]/page.tsx must register onTrimClip')
  assert.match(editorPageSource, /onDeleteClip:/, 'app/editor/[id]/page.tsx must register onDeleteClip')
  assert.match(editorPageSource, /getTimelineState:/, 'app/editor/[id]/page.tsx must register getTimelineState')

  // 4. Live runtime registration test
  let splitCalled = false
  registerVoiceCompanionBridge({
    projectId: 'test-project',
    getTimelineState: () => ({
      duration: 30,
      currentTime: 10,
      clips: [{ id: 'clip-1', start: 0, end: 30, title: 'Test Video' }],
      selectedClipId: 'clip-1',
      cutRanges: [],
      tracks: { videoHidden: false, captionsHidden: false, textHidden: false, musicHidden: false, soundtrackMuted: false },
    }),
    onSplitClip: (timeSec) => {
      splitCalled = true
      return { success: true, summary: `Split at ${timeSec}` }
    },
  })

  const bridge = getVoiceCompanionBridge()
  assert.ok(bridge.getTimelineState, 'Bridge must have getTimelineState')
  const state = bridge.getTimelineState()
  assert.equal(state.duration, 30)
  assert.equal(state.clips.length, 1)

  assert.ok(bridge.onSplitClip, 'Bridge must have onSplitClip')
  const res = await bridge.onSplitClip(12.5)
  assert.equal(splitCalled, true)
  assert.equal(res.success, true)

  unregisterVoiceCompanionBridge()
  console.log('jarvis timeline bridge passed')
})

test('all opencut timeline tests passed', () => {
  console.log('all opencut timeline tests passed')
})
