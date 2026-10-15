import { createClient } from '@/lib/supabase/server'
import type { ProjectExport, ProjectExportStatus } from '@/lib/types'
import { R2Keys } from '@/lib/r2/keys'
import { copyR2Object } from '@/lib/r2/copy-object'
import { getMiniRunEnvironment, resolveMiniRunConfig } from '@/lib/server/mini-run-proxy'

export interface ExportOptions {
  preset?: string
  metadata?: Record<string, unknown>
}

export const ExportService = {
  async listLatestProjectExports(projectIds: string[]): Promise<ProjectExport[]> {
    if (projectIds.length === 0) return []
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const {data, error} = await supabase.from('project_exports').select('*')
      .eq('user_id', user.id).in('project_id', projectIds)
      .order('created_at', {ascending: false})
    if (error) throw error

    const latest = new Map<string, ProjectExport>()
    for (const row of data ?? []) {
      if (!latest.has(row.project_id)) latest.set(row.project_id, mapProjectExportFromDb(row))
    }
    // Keep the project list current even when the user leaves the editor while
    // the backend is rendering. Only active renders need backend polling.
    await Promise.all([...latest.values()].map(async (record) => {
      if (!['pending', 'processing'].includes(record.status) || typeof record.metadata?.miniRunJobId !== 'string') return
      try {
        const refreshed = await ExportService.listProjectExports(record.projectId)
        if (refreshed[0]) latest.set(record.projectId, refreshed[0])
      } catch (error) {
        console.error('[EXPORT_LIST_REFRESH]', error instanceof Error ? error.message : 'Unable to refresh render')
      }
    }))
    return [...latest.values()]
  },

  async findActiveProjectExport(projectId: string, sourceAssetId: string, editorialRevision: number): Promise<ProjectExport | null> {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const {data, error} = await supabase.from('project_exports').select('*')
      .eq('project_id', projectId).eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .contains('metadata', {sourceAssetId, editorialRevision, outputKind: 'mini-run'})
      .order('created_at', {ascending: false}).limit(1).maybeSingle()
    if (error) throw error
    return data ? mapProjectExportFromDb(data) : null
  },

  async createProjectExport(projectId: string, options: ExportOptions = {}): Promise<ProjectExport> {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const {data, error} = await supabase.from('project_exports').insert({
      project_id: projectId,
      user_id: user.id,
      status: 'pending' satisfies ProjectExportStatus,
      preset: options.preset || 'mini-run-maul-portrait',
      metadata: options.metadata || {},
      started_at: new Date().toISOString(),
    }).select('*').single()
    if (error || !data) throw error || new Error('Unable to create render record')
    return mapProjectExportFromDb(data)
  },

  async completeExportFromSourceCopy(projectExport: ProjectExport, sourceAssetId: string): Promise<ProjectExport> {
    const supabase = await createClient()
    
    // Fetch source asset details
    const { data: sourceAsset, error: assetError } = await supabase
      .from('source_assets')
      .select('*')
      .eq('id', sourceAssetId)
      .single()

    if (assetError || !sourceAsset) {
      throw new Error('Source asset metadata missing')
    }

    const sourceBucket = sourceAsset.storage_bucket || process.env.R2_BUCKET_SOURCES || 'prometheus-sources'
    const sourceKey = sourceAsset.storage_path
    
    const destBucket = process.env.R2_BUCKET_EXPORTS || 'prometheus-exports'
    const destKey = R2Keys.exportFile(projectExport.userId, projectExport.projectId, projectExport.id, sourceAsset.file_name || 'final.mp4')

    if (!sourceKey) throw new Error('Source asset storage path missing')

    // Perform the copy in R2
    await copyR2Object(sourceBucket, sourceKey, destBucket, destKey)

    // Update metadata to completed
    const { data: updated, error: updateError } = await supabase
      .from('project_exports')
      .update({
        status: 'completed' as ProjectExportStatus,
        storage_bucket: destBucket,
        storage_path: destKey,
        mime_type: sourceAsset.mime_type || 'video/mp4',
        file_size_bytes: sourceAsset.file_size_bytes,
        duration_ms: sourceAsset.duration_ms,
        width: sourceAsset.width,
        height: sourceAsset.height,
        fps: sourceAsset.fps,
        completed_at: new Date().toISOString(),
        metadata: {
          ...projectExport.metadata,
          devProof: true,
          outputKind: 'source-copy-placeholder',
          note: 'Temporary export proof. Replace with real render worker later.',
        }
      })
      .eq('id', projectExport.id)
      .select()
      .single()

    if (updateError) throw updateError
    return mapProjectExportFromDb(updated)
  },

  async getExport(exportId: string): Promise<ProjectExport> {
    const supabase = await createClient()
    const [{data: {user}, error: authError}, {data: {session}}] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])

    if (authError || !user || !session?.access_token) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('project_exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single()

    if (error || !data) throw new Error('Export not found')
    return mapProjectExportFromDb(data)
  },

  async listProjectExports(projectId: string): Promise<ProjectExport[]> {
    const supabase = await createClient()
    const [{data: {user}, error: authError}, {data: {session}}] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])

    if (authError || !user || !session?.access_token) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('project_exports')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    const records = (data || []).map(mapProjectExportFromDb)
    const active = records.filter((record) =>
      (record.status === 'pending' || record.status === 'processing') &&
      typeof record.metadata?.miniRunJobId === 'string',
    )
    if (active.length === 0) return records

    const config = resolveMiniRunConfig(getMiniRunEnvironment())
    await Promise.all(active.map(async (record) => {
      const jobId = record.metadata.miniRunJobId as string
      try {
        const response = await fetch(`${config.baseUrl}/api/pipeline/job/${encodeURIComponent(jobId)}`, {
          headers: {'X-Mini-Run-User-Token': session.access_token},
          cache: 'no-store',
          redirect: 'manual',
          signal: AbortSignal.timeout(8_000),
        })
        const redirectedOutput = response.status === 303 && response.headers.get('location')
        if (!response.ok && !redirectedOutput) return
        const job = redirectedOutput
          ? {status: 'completed', outputUrl: `/api/mini-run/job/${encodeURIComponent(jobId)}/output`} as Record<string, unknown>
          : await response.json() as Record<string, unknown>
        const state = String(job.status ?? job.state ?? '').toLowerCase()
        const result = (job.returnvalue && typeof job.returnvalue === 'object' ? job.returnvalue : {}) as Record<string, unknown>
        const outputUrl = typeof result.outputUrl === 'string' ? result.outputUrl : typeof job.outputUrl === 'string' ? job.outputUrl : undefined
        const hasOutput = [outputUrl, result.r2Key, record.storagePath, record.metadata?.outputUrl, record.metadata?.r2Key]
          .some((value) => typeof value === 'string' && value.trim().length > 0)
        const nextStatus = state === 'completed' || state === 'done' ? hasOutput ? 'completed' : 'processing'
          : state === 'failed' ? 'failed'
          : state === 'pending' || state === 'queued' ? 'pending' : 'processing'
        const progress = job.progressPercent
        const metadata = {
          ...record.metadata,
          ...(typeof progress === 'number' && Number.isFinite(progress) ? {progressPercent: Math.max(0, Math.min(nextStatus === 'completed' ? 100 : 99, progress))} : {}),
          ...(outputUrl ? {outputUrl} : {}),
          ...(typeof result.r2Key === 'string' ? {r2Key: result.r2Key} : {}),
          ...(typeof job.failedReason === 'string' ? {backendError: job.failedReason} : {}),
        }
        const update: Record<string, unknown> = {status: nextStatus, metadata}
        if (nextStatus === 'completed') {
          update.mime_type = 'video/mp4'
          update.completed_at = new Date().toISOString()
        }
        if (nextStatus === 'failed') {
          update.error_message = typeof job.failedReason === 'string' ? job.failedReason : 'Mini-Run render failed.'
          update.failed_at = new Date().toISOString()
        }
        const {error: updateError} = await supabase.from('project_exports').update(update)
          .eq('id', record.id).eq('user_id', user.id)
        if (!updateError) Object.assign(record, {
          status: nextStatus,
          metadata,
          ...(typeof update.error_message === 'string' ? {errorMessage: update.error_message} : {}),
        })
      } catch (error) {
        console.error('[EXPORT_MINI_RUN_STATUS]', error)
      }
    }))
    return records
  },

  async getExportProject(exportId: string): Promise<{ id: string; title: string } | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: exportData, error: exportError } = await supabase
      .from('project_exports')
      .select('project_id')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single()

    if (exportError || !exportData) return null

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, title')
      .eq('id', exportData.project_id)
      .single()

    if (projectError || !projectData) return null

    return {
      id: projectData.id,
      title: projectData.title
    }
  }
}

function mapProjectExportFromDb(dbRow: any): ProjectExport {
  return {
    id: dbRow.id,
    projectId: dbRow.project_id,
    userId: dbRow.user_id,
    status: dbRow.status,
    storageProvider: dbRow.storage_provider,
    storageBucket: dbRow.storage_bucket,
    storagePath: dbRow.storage_path,
    mimeType: dbRow.mime_type,
    fileSizeBytes: dbRow.file_size_bytes,
    durationMs: dbRow.duration_ms,
    width: dbRow.width,
    height: dbRow.height,
    fps: dbRow.fps,
    preset: dbRow.preset,
    metadata: dbRow.metadata,
    errorMessage: dbRow.error_message,
    startedAt: dbRow.started_at,
    completedAt: dbRow.completed_at,
    failedAt: dbRow.failed_at,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  }
}
