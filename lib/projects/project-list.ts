import type { ProjectListItem, ProjectCardStatus } from '@/lib/projects/types'

export const PROJECT_STATUS_LABELS: Record<ProjectCardStatus, string> = {
  draft: 'In progress',
  rendering: 'Rendering',
  needs_review: 'Needs attention',
  completed: 'Ready',
}

export type DurableJobRecord = {
  progress?: number | null
  project_id?: string | null
  status?: string | null
  type?: string | null
  created_at?: string | null
  result_metadata?: Record<string, unknown> | null
}

export type ProjectExportRecord = {
  project_id?: string | null
  status?: string | null
  created_at?: string | null
  storage_path?: string | null
  metadata?: Record<string, unknown> | null
}

type ProjectRowRecord = {
  id: string
  user_id: string
  name?: string | null
  title?: string | null
  status?: string | null
  thumbnail_url?: string | null
  created_at: string
  updated_at: string
  source_profile?: Record<string, unknown> | null
  editor_state?: Record<string, unknown> | null
  source_asset_id?: string | null
}

export function normalizeProjectCardStatus(
  projectStatus: string | null | undefined,
  latestJob?: DurableJobRecord | null,
  latestExport?: ProjectExportRecord | null,
  sourceAssetId?: string | null,
): ProjectCardStatus {
  const render = getLatestRender(latestJob, latestExport, sourceAssetId)
  if (!render) return 'draft'
  if (['pending', 'queued', 'running', 'processing'].includes(render.status ?? '')) return 'rendering'
  if (render.status !== 'completed' || !render.hasOutput) return 'draft'
  return projectStatus === 'exported' ? 'completed' : 'needs_review'
}

// Source analysis happens automatically after upload. Only a real render can
// advance a project to human review, regardless of legacy project flags.
function getLatestRender(
  latestJob?: DurableJobRecord | null,
  latestExport?: ProjectExportRecord | null,
  sourceAssetId?: string | null,
) {
  const jobMetadata = latestJob?.result_metadata ?? {}
  const exportMetadata = latestExport?.metadata ?? {}
  const job = latestJob && ['render', 'export'].includes(latestJob.type ?? '') && matchesSource(jobMetadata, sourceAssetId)
    ? { status: latestJob.status, createdAt: latestJob.created_at, metadata: jobMetadata, storagePath: jobMetadata.storage_path, progress: latestJob.progress }
    : null
  const exported = latestExport && matchesSource(exportMetadata, sourceAssetId)
    ? { status: latestExport.status, createdAt: latestExport.created_at, metadata: exportMetadata, storagePath: latestExport.storage_path, progress: exportMetadata.progressPercent }
    : null
  const render = job && (!exported || Date.parse(job.createdAt ?? '') > Date.parse(exported.createdAt ?? '')) ? job : exported
  if (!render || render.metadata.devProof === true || render.metadata.outputKind === 'source-copy-placeholder') return null
  return {
    ...render,
    hasOutput: [render.storagePath, render.metadata.outputUrl, render.metadata.output_url, render.metadata.r2Key]
      .some((value) => typeof value === 'string' && value.trim().length > 0),
  }
}

function matchesSource(metadata: Record<string, unknown>, sourceAssetId?: string | null) {
  const renderedSource = metadata.sourceAssetId ?? metadata.source_asset_id
  return !sourceAssetId || typeof renderedSource !== 'string' || renderedSource === sourceAssetId
}

export function matchesProjectStatusFilter(status: ProjectCardStatus, filter: 'all' | ProjectCardStatus) {
  return filter === 'all' || (filter === 'draft' ? status === 'draft' || status === 'rendering' : status === filter)
}

export function mapProjectRowToListItem(
  row: ProjectRowRecord,
  latestJob?: DurableJobRecord | null,
  latestExport?: ProjectExportRecord | null,
): ProjectListItem {
  const inspection = extractInspection(row.source_profile)
  const editorState = row.editor_state && typeof row.editor_state === 'object' ? row.editor_state : {}
  const status = normalizeProjectCardStatus(row.status, latestJob, latestExport, row.source_asset_id)
  const render = getLatestRender(latestJob, latestExport, row.source_asset_id)
  const renderProgress = render?.progress

  return {
    id: row.id,
    userId: row.user_id,
    title: (row.name || row.title || 'Untitled project').trim() || 'Untitled project',
    description: extractDescription(editorState),
    thumbnailUrl: row.thumbnail_url ?? null,
    status,
    progress: status === 'rendering' ? numberOrNull(renderProgress) ?? 0 : status === 'needs_review' || status === 'completed' ? 100 : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    duration: numberOrNull(inspection.durationSec),
    width: numberOrNull(inspection.width),
    height: numberOrNull(inspection.height),
    fps: numberOrNull(inspection.fps),
    sourceAssetId: row.source_asset_id ?? null,
  }
}

function extractInspection(sourceProfile: Record<string, unknown> | null | undefined) {
  if (!sourceProfile || typeof sourceProfile !== 'object') return {}
  const inspection = sourceProfile.inspection
  if (!inspection || typeof inspection !== 'object') return {}
  return inspection as Record<string, unknown>
}

function extractDescription(editorState: Record<string, unknown>) {
  const value = editorState.projectDescription ?? editorState.description ?? editorState.initialPrompt
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
