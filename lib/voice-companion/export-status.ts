import type {VoiceCompanionBridgeHandlers} from './bridge'
import type {ProjectExport} from '@/lib/types'
import {isPlayableRender, projectRenderHistory, renderDownloadPath, renderPreviewPath} from '@/lib/editor/render-delivery'
import {safeParseApiResponse} from './safe-response'
import {sanitizeVoiceCompanionError} from './error-sanitizer'

/** Refresh the durable job history; a timeline save is never evidence of rendering. */
export async function readVoiceExportStatus(getBridge: () => VoiceCompanionBridgeHandlers, fetchImpl: typeof fetch = fetch) {
  const bridge = getBridge()
  const {projectId, sourceAssetId} = bridge
  if (!projectId || !sourceAssetId) return {success: false, error: 'Open a project with source video to check its MP4 status.'}
  try {
    let authToken = bridge.accessToken
    if (!authToken && typeof bridge.getAccessToken === 'function') {
      try { authToken = await bridge.getAccessToken() } catch { /* Ignore token resolution failure */ }
    }
    const response = await fetchImpl(`/api/projects/${encodeURIComponent(projectId)}/exports/history`, {
      cache: 'no-store',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      signal: AbortSignal.timeout(12_000),
    })
    const parsed = await safeParseApiResponse<{exports?: ProjectExport[]; error?: string}>(
      response,
      'Could not confirm render status. No progress or completion is confirmed.',
    )
    const current = getBridge()
    if (current.projectId !== projectId || current.sourceAssetId !== sourceAssetId) {
      return {success: false, error: 'The project or source changed during the status check. Check the current project again.'}
    }
    if (!parsed.ok || !parsed.data || !Array.isArray(parsed.data.exports)) {
      throw new Error(parsed.error || 'Could not confirm render status. No progress or completion is confirmed.')
    }
    const payload = parsed.data
    const timelineSync = current.getTimelineSyncState?.() ?? null
    const record = projectRenderHistory(payload.exports as ProjectExport[], projectId, sourceAssetId)[0]
    if (!record) return {
      success: true, phase: 'not_submitted', renderInitiated: false, timelineSync,
      summary: 'No MP4 export has started for this video. Saving editor settings is separate from creating the MP4. An export request can start the supported video output directly.',
    }
    const metadata = record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
      ? record.metadata as Record<string, unknown> : {}
    const reportedProgress = metadata.progressPercent
    const progressPercent = typeof reportedProgress === 'number' && Number.isFinite(reportedProgress) && reportedProgress >= 0 && reportedProgress <= 100
      ? reportedProgress : null
    const ready = isPlayableRender(record, projectId, sourceAssetId)
    const phase = ready ? 'completed' : record.status === 'completed' ? 'finalizing' : record.status
    const summary = ready
      ? 'The completed MP4 is available in project exports for playback and download.'
      : phase === 'failed'
        ? `The render failed: ${record.errorMessage || 'The worker did not report a reason.'} No automatic retry is scheduled.`
        : phase === 'pending'
          ? 'The backend accepted the job and it is queued. Completion time has not been reported.'
          : phase === 'finalizing'
            ? 'The worker reported completion, but no playable MP4 receipt is available yet.'
            : `The backend reports ${phase}${progressPercent === null ? '; no percentage has been reported' : ` at ${progressPercent}%`}. Completion time has not been reported.`
    return {
      success: true, phase, renderInitiated: true, exportId: record.id, progressPercent,
      timelineSync, timelineApplied: typeof metadata.timelineApplied === 'boolean' ? metadata.timelineApplied : null,
      outputKind: metadata.outputKind ?? null, summary,
      ...(ready ? {previewUrl: renderPreviewPath(record.id), downloadEndpoint: renderDownloadPath(record.id)} : {}),
    }
  } catch (cause) {
    return {success: false, error: sanitizeVoiceCompanionError(cause)}
  }
}
