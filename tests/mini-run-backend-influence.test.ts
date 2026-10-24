import test from 'node:test'
import assert from 'node:assert/strict'

import { buildMiniRunRenderPayload, buildPrometheusMinRunProps } from '../lib/server/mini-run-render-payload'
import { extractExportDirectives } from '../lib/server/mini-run-dispatch'

test('G1: buildMiniRunRenderPayload forwards explicit song selection, audio intent, and editorial directives', () => {
  const payload = buildMiniRunRenderPayload({
    sourceUrl: 'https://example.com/video.mp4',
    source: { durationMs: 40_000, width: 1080, height: 1920 },
    shot: {
      preferredDurationSec: 30,
      songTrackId: 'music-preview-cinematic-trailer-epic-intense-trailer',
      songTitle: 'Intense Trailer',
      songArtist: 'Prometheus Original',
      songGenre: 'cinematic',
      songMood: 'intense',
      songUrl: 'https://example.com/custom-track.mp3',
      brollPreference: 'broll_cutaway',
      motionGraphicsPreference: 'high_motion',
      brandPreferences: {
        backgroundPolicy: 'always',
        preferredKind: 'broll_cutaway',
      },
    },
    jobId: 'job_influence_test_001',
    prompt: 'Use B-rolls rather than number one and use higher preponderance of motion graphics with intense trailer music',
  })

  // Verify prompt is preserved
  assert.equal(
    payload.prompt,
    'Use B-rolls rather than number one and use higher preponderance of motion graphics with intense trailer music',
  )

  // Verify audio carries explicit song fields
  const audio = payload.audio as Record<string, unknown>
  assert.ok(audio, 'payload.audio must be populated when song selection is provided')
  assert.equal(audio.songTrackId, 'music-preview-cinematic-trailer-epic-intense-trailer')
  assert.equal(audio.songTitle, 'Intense Trailer')
  assert.equal(audio.songArtist, 'Prometheus Original')
  assert.equal(audio.songGenre, 'cinematic')
  assert.equal(audio.songMood, 'intense')
  assert.equal(audio.songUrl, 'https://example.com/custom-track.mp3')

  // Verify design carries song, B-roll, and motion preferences for downstream pipeline engines
  const design = payload.design as Record<string, unknown>
  assert.ok(design, 'payload.design must be populated')
  assert.equal(design.songTrackId, 'music-preview-cinematic-trailer-epic-intense-trailer')
  assert.equal(design.songTitle, 'Intense Trailer')
  assert.equal(design.brollPreference, 'broll_cutaway')
  assert.equal(design.motionGraphicsPreference, 'high_motion')
  const brandPrefs = design.brandPreferences as Record<string, unknown>
  assert.ok(brandPrefs, 'design.brandPreferences must be forwarded')
  assert.equal(brandPrefs.backgroundPolicy, 'always')
  assert.equal(brandPrefs.preferredKind, 'broll_cutaway')

  console.log('G1 passed: buildMiniRunRenderPayload forwards song and editorial directives')
})

test('G2: Editor export dispatch extracts selected song and editorial preferences from project state', () => {
  const mockEditorState = {
    editorialTimeline: {
      revision: 4,
      music: {
        track: {
          id: 'music-preview-classical-orchestral-prestige-vivaldi',
          title: 'Vivaldi: The Four Seasons, Summer (Presto)',
          artist: 'Antonio Vivaldi',
          category: 'classical',
          audioSrc: 'audio/music/vivaldi.mp3',
        },
        volume: 0.8,
      },
    },
    selectedMusicTrack: {
      id: 'music-preview-classical-orchestral-prestige-vivaldi',
      title: 'Vivaldi: The Four Seasons, Summer (Presto)',
    },
    brollPreference: 'broll_cutaway',
    brandPreferences: {
      backgroundPolicy: 'always',
    },
  }

  const directives = extractExportDirectives(mockEditorState)

  assert.equal(directives.songTrackId, 'music-preview-classical-orchestral-prestige-vivaldi')
  assert.equal(directives.songTitle, 'Vivaldi: The Four Seasons, Summer (Presto)')
  assert.equal(directives.brollPreference, 'broll_cutaway')
  assert.equal(directives.brandPreferences?.backgroundPolicy, 'always')

  console.log('G2 passed: editor export dispatch extracts song and editorial directives')
})

test('G5: AWS Lambda Remotion init for Mini-Runs binds soundtrack, audioTrackSrc, and orchestration props', () => {
  const mockManifest = {
    sourcePath: '/data/source/raw.mp4',
    effectiveDurationMs: 30000,
    chunks: [
      { text: 'First chunk', startMs: 0, endMs: 2000, outputStartMs: 0, outputEndMs: 2000 },
    ],
    orchestrationManifest: {
      backgrounds: [{ kind: 'broll_cutaway', startMs: 500, endMs: 3500 }],
    },
    songProgram: {
      events: [{ localPath: '/data/songs/track1.mp3', trackId: 'track_123', sourceStartMs: 0, sourceEndMs: 30000 }],
    },
  }

  const props = buildPrometheusMinRunProps(mockManifest)

  assert.equal(props.durationMs, 30000)
  assert.ok((props.chunks as unknown[]).length > 0)
  assert.ok(props.orchestration)
  assert.equal(((props.orchestration as any).backgrounds as any[])[0].kind, 'broll_cutaway')
  assert.equal(props.soundtrackSrc, '/data/songs/track1.mp3')

  console.log('G5 passed: AWS Lambda Remotion init binds soundtrack and orchestration')
})

test('G7: buildMiniRunRenderPayload forwards quality, format, safeMode, and textLayers', () => {
  const payload = buildMiniRunRenderPayload({
    sourceUrl: 'https://example.com/source.mp4',
    source: { durationMs: 60_000, width: 1080, height: 1920 },
    shot: { preferredDurationSec: 45 },
    jobId: 'job_user_prefs_001',
    quality: 'maximum',
    format: 'prores',
    safeMode: true,
    textLayers: [
      { id: 'cue_1', text: 'Custom Overlay', fontFamily: 'Inter', fontSizePx: 48, xPct: 50, yPct: 50 },
    ],
  })

  assert.equal(payload.quality, 'maximum')
  assert.equal(payload.exportQuality, 'maximum')
  assert.equal(payload.format, 'prores')
  assert.equal(payload.exportFormat, 'prores')
  assert.equal(payload.safeMode, true)
  assert.ok(Array.isArray(payload.textLayers))
  assert.equal((payload.textLayers as any[])[0].text, 'Custom Overlay')

  const metadata = payload.metadata as Record<string, unknown>
  assert.equal(metadata.quality, 'maximum')
  assert.equal(metadata.format, 'prores')
  assert.equal(metadata.safeMode, true)
  assert.ok(Array.isArray(metadata.textLayers))

  console.log('G7 passed: quality, format, safeMode, and textLayers are forwarded')
})
