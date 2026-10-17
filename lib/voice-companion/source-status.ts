import type {VoiceCompanionBridgeHandlers} from './bridge'
import {safeParseApiResponse} from './safe-response'

type Readiness = {
  sourceAssetId: string | null
  sourceCheckStatus: 'ready' | 'missing' | 'unconfirmed'
  sourceReady: boolean
  sourceDurationMs?: number | null
  output?: {format?: string; width?: number; height?: number; sourceWindowDefaultMs?: number}
}

/** Check durable project metadata afresh; local playback cannot prove an upload was saved. */
export async function readVoiceSourceStatus(getBridge: () => VoiceCompanionBridgeHandlers, fetchImpl: typeof fetch = fetch) {
  const bridge = getBridge()
  const {projectId, sourceAssetId} = bridge
  const unconfirmed = 'I could not verify whether the video is saved. Try checking again; this does not mean you need to upload it again.'
  if (!projectId) return {success: false, phase: 'unconfirmed', summary: 'Open the video project so I can check its saved source.'}
  try {
    let authToken = bridge.accessToken
    if (!authToken && typeof bridge.getAccessToken === 'function') {
      try { authToken = await bridge.getAccessToken() } catch { /* Ignore token resolution failure */ }
    }
    const response = await fetchImpl(`/api/projects/${encodeURIComponent(projectId)}/exports`, {
      cache: 'no-store',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      signal: AbortSignal.timeout(12_000),
    })
    const parsed = await safeParseApiResponse<{readiness?: Readiness}>(response, unconfirmed)
    const current = getBridge()
    if (current.projectId !== projectId || current.sourceAssetId !== sourceAssetId) {
      return {success: false, phase: 'unconfirmed', summary: 'The project or source changed during the check. Check the current video again.'}
    }
    const readiness = parsed.data?.readiness
    if (!parsed.ok || !readiness || typeof readiness.sourceReady !== 'boolean'
      || !['ready', 'missing', 'unconfirmed'].includes(readiness.sourceCheckStatus)
      || (readiness.sourceAssetId !== null && typeof readiness.sourceAssetId !== 'string')
      || readiness.sourceCheckStatus === 'unconfirmed'
      || (readiness.sourceCheckStatus === 'ready' && (!readiness.sourceReady || !readiness.sourceAssetId))
      || (readiness.sourceCheckStatus === 'missing' && readiness.sourceReady)) {
      return {success: false, phase: 'unconfirmed', summary: parsed.status === 401 || parsed.status === 403
        ? 'Refresh your studio session so I can check whether the video is saved.' : unconfirmed}
    }
    const sourceMatchesEditor = readiness.sourceAssetId === (sourceAssetId ?? null)
    const phase = readiness.sourceReady ? sourceMatchesEditor ? 'ready' : 'source_changed' : 'missing'
    return {
      success: true, phase, storedSourceReady: readiness.sourceReady, sourceMatchesEditor,
      sourceAssetId: readiness.sourceAssetId,
      sourceDurationMs: readiness.sourceDurationMs ?? null,
      output: readiness.output ?? null,
      verification: 'saved_project_metadata',
      summary: phase === 'ready'
        ? 'The current video is registered as saved in this project. You do not need to attach it again. This check does not verify the stored bytes or start an MP4 export.'
        : phase === 'source_changed'
          ? 'A saved video is registered in this project, but it differs from the source open in the editor. Let any replacement upload finish, then reload the saved project if needed. Do not upload the saved video again.'
          : 'No saved source is registered for this project yet. If an upload is still running, let it finish; if it failed, use the upload error to decide whether to retry.',
    }
  } catch {
    return {success: false, phase: 'unconfirmed', summary: unconfirmed}
  }
}
