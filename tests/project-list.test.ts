import assert from 'node:assert/strict'
import test from 'node:test'

import { mapProjectRowToListItem, matchesProjectStatusFilter, normalizeProjectCardStatus, PROJECT_STATUS_LABELS } from '@/lib/projects/project-list'

const uploadedProject = {
  id: 'proj_1',
  user_id: 'user_1',
  name: 'Launch Cut',
  status: 'draft',
  thumbnail_url: 'https://cdn.example.com/thumb.jpg',
  source_asset_id: 'asset_1',
  created_at: '2026-06-10T00:00:00.000Z',
  updated_at: '2026-06-10T01:00:00.000Z',
  source_profile: { inspection: { durationSec: 42, width: 1920, height: 1080, fps: 30 } },
  editor_state: { projectDescription: 'Premium launch reel' },
}

const completedExport = {
  project_id: 'proj_1',
  status: 'completed',
  created_at: '2026-06-10T02:00:00.000Z',
  metadata: { sourceAssetId: 'asset_1', outputKind: 'mini-run', outputUrl: 'https://cdn.example.com/edited.mp4' },
}

test('the three untouched uploads stay in progress, including failed and completed automatic analysis', () => {
  for (const [index, jobStatus] of ['pending', 'failed', 'completed'].entries()) {
    const project = mapProjectRowToListItem(
      { ...uploadedProject, id: `proj_${index + 1}` },
      { type: 'video_analysis', status: jobStatus, progress: 100, result_metadata: { stage: 'handoff_ready' } },
    )
    assert.equal(project.status, 'draft')
    assert.equal(project.progress, null)
    assert.equal(PROJECT_STATUS_LABELS[project.status], 'In progress')
    assert.equal(matchesProjectStatusFilter(project.status, 'draft'), true)
    assert.equal(matchesProjectStatusFilter(project.status, 'needs_review'), false)
  }
})

test('legacy flags without a finished render cannot advance an upload', () => {
  for (const status of ['draft', 'processing', 'rendering', 'ready', 'completed', 'failed', 'exported', null]) {
    assert.equal(normalizeProjectCardStatus(status), 'draft')
  }
})

test('preparation, enhancement, and unknown jobs never imply that the full edit is finished', () => {
  for (const type of ['video_analysis', 'scene_detection', 'audio_processing', 'ai_enhancement', undefined]) {
    for (const status of ['pending', 'processing', 'failed', 'completed']) {
      assert.equal(normalizeProjectCardStatus('draft', { type, status, result_metadata: { outputUrl: 'analysis.json' } }), 'draft')
    }
  }
})

test('queued and active real renders remain in progress until rendering succeeds', () => {
  for (const status of ['pending', 'queued', 'running', 'processing']) {
    const project = mapProjectRowToListItem(uploadedProject, { type: 'render', status, progress: 45 })
    assert.equal(project.status, 'rendering')
    assert.equal(project.progress, 45)
    assert.equal(matchesProjectStatusFilter(project.status, 'draft'), true)
    assert.equal(matchesProjectStatusFilter(project.status, 'needs_review'), false)
  }
})

test('a completed backend render with output advances to human review', () => {
  const project = mapProjectRowToListItem(uploadedProject, { type: 'video_analysis', status: 'failed' }, completedExport)
  assert.equal(project.status, 'needs_review')
  assert.equal(project.progress, 100)
  assert.equal(PROJECT_STATUS_LABELS[project.status], 'Needs attention')
  assert.equal(matchesProjectStatusFilter(project.status, 'needs_review'), true)
  assert.equal(matchesProjectStatusFilter(project.status, 'draft'), false)
  assert.equal(normalizeProjectCardStatus('draft', { type: 'render', status: 'completed', result_metadata: { outputUrl: 'edited.mp4' } }), 'needs_review')
})

test('completed status without an output and failed renders remain in progress', () => {
  assert.equal(normalizeProjectCardStatus('ready', null, { status: 'completed' }), 'draft')
  assert.equal(normalizeProjectCardStatus('ready', { type: 'render', status: 'completed' }), 'draft')
  assert.equal(normalizeProjectCardStatus('failed', { type: 'render', status: 'failed' }), 'draft')
  assert.equal(normalizeProjectCardStatus('ready', null, { ...completedExport, status: 'failed' }), 'draft')
})

test('a copy of the unedited source is not a finished edit', () => {
  for (const metadata of [{ outputKind: 'source-copy-placeholder' }, { devProof: true }]) {
    assert.equal(normalizeProjectCardStatus('ready', null, { ...completedExport, storage_path: 'source-copy.mp4', metadata }), 'draft')
  }
})

test('renders of a previous source do not move a replacement upload to review', () => {
  assert.equal(mapProjectRowToListItem({ ...uploadedProject, source_asset_id: 'asset_2' }, null, completedExport).status, 'draft')
  assert.equal(normalizeProjectCardStatus('ready', { type: 'render', status: 'completed', result_metadata: { source_asset_id: 'asset_1', outputUrl: 'old.mp4' } }, null, 'asset_2'), 'draft')
})

test('a newer render attempt takes precedence over an older completed render', () => {
  const job = { type: 'render', status: 'processing', progress: 25, created_at: '2026-06-10T03:00:00.000Z' }
  assert.equal(mapProjectRowToListItem(uploadedProject, job, completedExport).status, 'rendering')
  assert.equal(mapProjectRowToListItem(uploadedProject, { ...job, status: 'failed' }, completedExport).status, 'draft')
  assert.equal(mapProjectRowToListItem(uploadedProject, { ...job, created_at: '2026-06-10T01:00:00.000Z' }, completedExport).status, 'needs_review')
})

test('explicitly exported projects retain Ready only with a completed output', () => {
  assert.equal(normalizeProjectCardStatus('exported', null, completedExport), 'completed')
  assert.equal(normalizeProjectCardStatus('exported', null), 'draft')
})

test('render progress comes from the selected render, not an older analysis job', () => {
  const project = mapProjectRowToListItem(uploadedProject, { type: 'video_analysis', status: 'completed', progress: 100 }, { ...completedExport, status: 'processing', metadata: { progressPercent: 64 } })
  assert.equal(project.status, 'rendering')
  assert.equal(project.progress, 64)
})

test('project metadata is preserved independently of the workflow status', () => {
  const project = mapProjectRowToListItem(uploadedProject)
  assert.equal(project.title, 'Launch Cut')
  assert.equal(project.description, 'Premium launch reel')
  assert.equal(project.duration, 42)
  assert.equal(project.width, 1920)
  assert.equal(project.sourceAssetId, 'asset_1')
})
