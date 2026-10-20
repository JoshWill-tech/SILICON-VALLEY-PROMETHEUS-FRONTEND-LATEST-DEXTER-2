import assert from 'node:assert/strict'
import test from 'node:test'

import { isAllowedMiniRunRequest } from '../lib/server/mini-run-proxy'
import { createMiniRunClient } from '../lib/api/mini-run'
import { buildMiniRunRenderPayload } from '../lib/server/mini-run-render-payload'
import { useMiniRunDraftStore } from '../lib/editor/mini-run-draft-store'

test('Mini-Run Proxy allowlist permits manifest edit and manifest retrieval', () => {
  assert.equal(isAllowedMiniRunRequest('POST', ['api', 'pipeline', 'manifest', 'edit']), true)
  assert.equal(isAllowedMiniRunRequest('GET', ['api', 'pipeline', 'job', 'job_abc123', 'manifest']), true)
  assert.equal(isAllowedMiniRunRequest('GET', ['api', 'pipeline', 'job', 'job_abc123']), true)
  assert.equal(isAllowedMiniRunRequest('POST', ['api', 'pipeline', 'render']), true)
  assert.equal(isAllowedMiniRunRequest('POST', ['api', 'pipeline', 'plan']), true)

  // Disallow invalid paths
  assert.equal(isAllowedMiniRunRequest('DELETE', ['api', 'pipeline', 'manifest', 'edit']), false)
  assert.equal(isAllowedMiniRunRequest('GET', ['api', 'pipeline', 'arbitrary']), false)
})

test('buildMiniRunRenderPayload forwards creative prompt directive and draftManifest', () => {
  const payload = buildMiniRunRenderPayload({
    sourceUrl: 'https://example.com/source.mp4',
    source: { durationMs: 45_000, width: 1080, height: 1920 },
    shot: { preferredDurationSec: 30 },
    jobId: 'job_test_001',
    prompt: 'Bias heavily towards Vox explainer animations and high motion graphics',
    draftManifest: {
      songProgram: { title: 'vox_kinetic_beat.mp3' },
      customParam: 123,
    },
  })

  assert.equal(payload.jobId, 'job_test_001')
  assert.equal(payload.prompt, 'Bias heavily towards Vox explainer animations and high motion graphics')
  assert.deepEqual(payload.draftManifest, {
    songProgram: { title: 'vox_kinetic_beat.mp3' },
    customParam: 123,
  })
  assert.equal((payload.metadata as Record<string, unknown>).durationMs, 30_000)
})

test('createMiniRunClient.editManifest sends POST to /api/pipeline/manifest/edit', async () => {
  let capturedUrl = ''
  let capturedBody: any = null

  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input)
    capturedBody = JSON.parse(String(init?.body || '{}'))
    return Response.json({
      ok: true,
      manifest: {
        ...capturedBody.manifest,
        song_plan: { title: 'custom_music.mp3' },
      },
      diff: {
        changes: [{ field: 'song', after: 'custom_music.mp3' }],
        summary: 'Changed song to custom_music.mp3',
      },
      modelUsed: 'gemini-2.5-flash',
    })
  }

  const client = createMiniRunClient(mockFetch as any, { shielded: false })
  const result = await client.editManifest({
    manifest: { jobId: 'job_123', chunks: [] },
    instruction: 'Change music to custom_music.mp3',
  })

  assert.equal(capturedUrl, '/api/mini-run/api/pipeline/manifest/edit')
  assert.equal(capturedBody.instruction, 'Change music to custom_music.mp3')
  assert.equal(result.ok, true)
  assert.equal((result.manifest as any).song_plan.title, 'custom_music.mp3')
  assert.equal(result.diff.changes.length, 1)
  assert.equal(result.modelUsed, 'gemini-2.5-flash')
})

test('createMiniRunClient.getManifest fetches /api/pipeline/job/<jobId>/manifest', async () => {
  let capturedUrl = ''

  const mockFetch = async (input: RequestInfo | URL) => {
    capturedUrl = String(input)
    return Response.json({
      ok: true,
      jobId: 'job_xyz999',
      manifest: {
        job_id: 'job_xyz999',
        chunks: [{ text: 'Hello world', startMs: 0, endMs: 2000 }],
        songProgram: { title: 'epic.mp3' },
      },
    })
  }

  const client = createMiniRunClient(mockFetch as any, { shielded: false })
  const result = await client.getManifest('job_xyz999')

  assert.equal(capturedUrl, '/api/mini-run/api/pipeline/job/job_xyz999/manifest')
  assert.equal(result.ok, true)
  assert.equal((result.manifest as any).job_id, 'job_xyz999')
})

test('createMiniRunClient.getRenderStatus extracts manifest and inputProps', async () => {
  const mockFetch = async () => {
    return Response.json({
      jobId: 'job_rendered_1',
      status: 'completed',
      outputUrl: 'https://cdn.example.com/render.mp4',
      manifest: {
        chunks: [{ text: 'Rendered chunk' }],
        songProgram: { title: 'final_song.mp3' },
      },
      inputProps: {
        orchestration: { cutDensity: 'high' },
      },
    })
  }

  const client = createMiniRunClient(mockFetch as any, { shielded: false })
  const status = await client.getRenderStatus('job_rendered_1')

  assert.equal(status.status, 'completed')
  assert.ok(status.manifest)
  assert.equal((status.manifest as any).songProgram.title, 'final_song.mp3')
  assert.ok(status.inputProps)
  assert.equal((status.inputProps as any).orchestration.cutDensity, 'high')
})

test('useMiniRunDraftStore handles full manifest updates with non-destructive diffs', () => {
  const store = useMiniRunDraftStore.getState()
  store.reset()

  // 1. Initial plan loaded
  store.setPlan({
    job_id: 'job_plan_001',
    source: { url: 'https://example.com/source.mp4', width: 1080, height: 1920 },
    chunks: [
      {
        chunkIndex: 0,
        text: 'Autonomous AI editing',
        startMs: 0,
        endMs: 2500,
        words: [
          { text: 'Autonomous', startMs: 0, endMs: 700 },
          { text: 'AI', startMs: 750, endMs: 1200 },
          { text: 'editing', startMs: 1250, endMs: 2500 },
        ],
      },
    ],
    song_plan: { title: 'original_track.mp3' },
    scenes: [{ sceneIndex: 0, visualPrompt: 'Office wide shot' }],
  })

  assert.equal(useMiniRunDraftStore.getState().status, 'planned')
  assert.equal(useMiniRunDraftStore.getState().isDirty, false)
  assert.equal(useMiniRunDraftStore.getState().chunks.length, 1)

  // 2. Full manifest update from AI edit
  const updatedManifest = {
    ...useMiniRunDraftStore.getState().getDraftManifest(),
    song_plan: { title: 'vox_electronic_beat.mp3' },
    orchestration_plan: { voxAnimationBias: true },
    sfx: [{ type: 'whoosh', timeMs: 2000 }],
  }

  useMiniRunDraftStore.getState().updateFullManifest(updatedManifest)

  const currentState = useMiniRunDraftStore.getState()
  assert.equal(currentState.isDirty, true)
  assert.equal((currentState.rawManifest as any)?.song_plan?.title, 'vox_electronic_beat.mp3')

  const exportedManifest = currentState.getDraftManifest()
  assert.equal((exportedManifest.song_plan as any)?.title, 'vox_electronic_beat.mp3')
  assert.deepEqual((exportedManifest as any).sfx, [{ type: 'whoosh', timeMs: 2000 }])
  assert.equal((exportedManifest as any).orchestration_plan.voxAnimationBias, true)
})
