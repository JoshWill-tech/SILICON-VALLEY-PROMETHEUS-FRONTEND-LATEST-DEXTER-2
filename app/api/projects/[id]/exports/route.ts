import {NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {createClient} from '@/lib/supabase/server'
import {ExportService} from '@/lib/exports/service'
import {dispatchMiniRunRender} from '@/lib/server/mini-run-dispatch'
import {getMiniRunEnvironment, resolveMiniRunConfig} from '@/lib/server/mini-run-proxy'

export const maxDuration = 60

function safeGetMiniRunEnvironment(override?: any) {
  return typeof getMiniRunEnvironment === 'function'
    ? getMiniRunEnvironment(override)
    : (override || {
        MINI_RUN_AWS_API_URL: process.env.MINI_RUN_AWS_API_URL,
        MINI_RUN_BACKEND_URL: process.env.MINI_RUN_BACKEND_URL,
      })
}

async function resolveUserAccessToken(sessionAccessToken?: string, requestAuthorization?: string | null): Promise<string> {
  if (requestAuthorization) {
    const bearer = requestAuthorization.replace(/^Bearer\s+/i, '').trim()
    if (bearer && bearer !== 'local-token') {
      return bearer
    }
  }
  if (sessionAccessToken && sessionAccessToken !== 'local-token') {
    return sessionAccessToken
  }
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies
      .filter((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
      .sort((a, b) => a.name.localeCompare(b.name))
    if (authCookies.length > 0) {
      const combined = authCookies.map((c) => c.value).join('')
      let decoded = combined
      if (decoded.startsWith('base64-')) {
        decoded = Buffer.from(decoded.slice(7), 'base64').toString('utf-8')
      }
      const parsed = JSON.parse(decoded) as { access_token?: string }
      if (typeof parsed.access_token === 'string' && parsed.access_token) {
        return parsed.access_token
      }
    }
  } catch {
    // Fall back to provided token if extraction fails
  }
  return sessionAccessToken || 'local-token'
}

type RouteContext = {params: Promise<{id: string}>}

export async function GET(_request: Request, {params}: RouteContext) {
  const {id: projectId} = await params
  const supabase = await createClient()
  const [{data: {user}, error: authError}, {data: {session}}] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ])
  if (authError || !user || !session?.access_token) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

  const {data: project, error: projectError} = await supabase.from('projects')
    .select('id, source_asset_id, editor_state').eq('id', projectId).eq('user_id', user.id).maybeSingle()
  if (projectError || !project) return NextResponse.json({error: 'Project not found.'}, {status: 404})

  const sourceAssetId = typeof project.source_asset_id === 'string' ? project.source_asset_id : ''
  const {data: asset, error: assetError} = sourceAssetId
    ? await supabase.from('source_assets').select('id, storage_path, duration_ms, width, height')
      .eq('id', sourceAssetId).eq('project_id', projectId).eq('user_id', user.id).maybeSingle()
    : {data: null, error: null}
  const sourceReady = !assetError && Boolean(asset?.storage_path)

  const editorState = project.editor_state && typeof project.editor_state === 'object' ? project.editor_state as Record<string, unknown> : {}
  const timeline = editorState.editorialTimeline && typeof editorState.editorialTimeline === 'object'
    ? editorState.editorialTimeline as Record<string, unknown> : {}
  const timelineRevision = typeof timeline.revision === 'number' && Number.isSafeInteger(timeline.revision) && timeline.revision >= 0
    ? timeline.revision as number : 0

  let backendConfigured = true
  try {
    resolveMiniRunConfig(safeGetMiniRunEnvironment({
      MINI_RUN_AWS_API_URL: process.env.MINI_RUN_AWS_API_URL,
      MINI_RUN_BACKEND_URL: process.env.MINI_RUN_BACKEND_URL,
    }))
  } catch {
    backendConfigured = false
  }

  const blockers = [
    ...(!sourceReady ? ['A stored source video is not available for this project.'] : []),
    ...(!backendConfigured ? ['Mini-Run server configuration is unavailable.'] : []),
  ]
  return NextResponse.json({readiness: {
    canSubmit: blockers.length === 0,
    sourceReady,
    sourceDurationMs: asset?.duration_ms ?? null,
    sourceWidth: asset?.width ?? null,
    sourceHeight: asset?.height ?? null,
    backendConfigured,
    timelineRevision,
    timelineApplied: false,
    output: {format: 'mp4', width: 1080, height: 1920, sourceWindowDefaultMs: 30_000, musicPolicy: 'auto'},
    blockers,
    liveWorkerHealthChecked: false,
  }}, {headers: {'Cache-Control': 'no-store'}})
}

export async function POST(request: Request, {params}: RouteContext) {
  const {id: projectId} = await params
  const supabase = await createClient()
  const [userResult, sessionResult] = await Promise.all([
    supabase.auth.getUser(),
    typeof supabase.auth?.getSession === 'function'
      ? supabase.auth.getSession()
      : Promise.resolve({data: {session: {access_token: 'local-token'}}, error: null}),
  ])
  const user = userResult?.data?.user
  const authError = userResult?.error
  const session = sessionResult?.data?.session
  if (authError || !user) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const sourceAssetId = typeof body.sourceAssetId === 'string' ? body.sourceAssetId : ''
  const draftManifest = (body.draftManifest && typeof body.draftManifest === 'object' ? body.draftManifest : undefined) as Record<string, unknown> | undefined
  const editorialRevision = body.editorialRevision
  if (!sourceAssetId || (editorialRevision !== undefined && (!Number.isSafeInteger(editorialRevision) || (editorialRevision as number) < 0))) {
    return NextResponse.json({error: 'A source asset is required; any supplied timeline revision must be a nonnegative integer.'}, {status: 400})
  }

  const {data: project, error: projectError} = await supabase.from('projects')
    .select('id, source_asset_id, editor_state').eq('id', projectId).eq('user_id', user.id).maybeSingle()
  if (projectError || !project) return NextResponse.json({error: 'Project not found.'}, {status: 404})
  if (project.source_asset_id !== sourceAssetId) {
    return NextResponse.json({error: 'The source video changed. Reload the project before rendering.'}, {status: 409})
  }

  const editorState = project.editor_state && typeof project.editor_state === 'object' ? project.editor_state as Record<string, unknown> : {}
  const timeline = editorState.editorialTimeline && typeof editorState.editorialTimeline === 'object'
    ? editorState.editorialTimeline as Record<string, unknown> : {}
  // The revision is informational: Mini-Run does not consume the editor timeline.
  // A stale client revision must not block a source-based export.

  const {data: asset, error: assetError} = await supabase.from('source_assets').select('*')
    .eq('id', sourceAssetId).eq('project_id', projectId).eq('user_id', user.id).maybeSingle()
  if (assetError || !asset?.storage_path) return NextResponse.json({error: 'Project source video is unavailable.'}, {status: 404})

  const currentRevision = typeof timeline.revision === 'number' ? timeline.revision : 0
  const activeExport = await ExportService.findActiveProjectExport(projectId, sourceAssetId, currentRevision)
  if (activeExport) return NextResponse.json({export: activeExport}, {status: 202, headers: {'Cache-Control': 'no-store'}})

  const miniRunJobId = crypto.randomUUID()
  const timelineApplied = Boolean(draftManifest)
  let projectExport
  try {
    projectExport = await ExportService.createProjectExport(projectId, {
      preset: 'mini-run-maul-portrait',
      metadata: {
        sourceAssetId,
        outputKind: 'mini-run',
        miniRunJobId,
        editorialRevision: currentRevision,
        timelineApplied,
        canvas: '1080x1920',
      },
    })
    const dispatched = await dispatchMiniRunRender({
      request: {
        projectId,
        sourceAssetId,
        bucket: asset.storage_bucket || process.env.R2_BUCKET_SOURCES || 'prometheus-sources',
        storagePath: asset.storage_path,
        mimeType: asset.mime_type || 'video/mp4',
        durationMs: asset.duration_ms ?? undefined,
        width: asset.width ?? undefined,
        height: asset.height ?? undefined,
        jobId: miniRunJobId,
        editorialRevision: currentRevision,
        songPolicy: 'auto',
        draftManifest,
        transcriptSegments: (Array.isArray(asset.transcript_segments) && asset.transcript_segments.length > 0)
          ? asset.transcript_segments
          : undefined,
      },
      env: safeGetMiniRunEnvironment({
        MINI_RUN_AWS_API_URL: process.env.MINI_RUN_AWS_API_URL,
        MINI_RUN_BACKEND_URL: process.env.MINI_RUN_BACKEND_URL,
      }),
      accessToken: await resolveUserAccessToken(
        session?.access_token,
        typeof request.headers?.get === 'function'
          ? (request.headers.get('authorization') || request.headers.get('x-mini-run-user-token'))
          : null,
      ),
    })
    const {data: updated, error: updateError} = await supabase.from('project_exports').update({
      status: dispatched.status === 'queued' ? 'pending' : 'processing',
      metadata: {...projectExport.metadata, miniRunJobId: dispatched.jobId, pipelineJobId: dispatched.pipelineJobId},
    }).eq('id', projectExport.id).eq('user_id', user.id).select('*').single()
    if (updateError || !updated) {
      console.error('[PROJECT_EXPORT_JOB_RECEIPT]', updateError || 'Mini-Run dispatch row was not returned')
      // The durable Mini-Run id was saved before dispatch. Keep the export
      // pending so history polling can reconcile it instead of losing a job
      // the backend has already accepted.
      return NextResponse.json({export: projectExport}, {status: 202, headers: {'Cache-Control': 'no-store'}})
    }
    return NextResponse.json({export: {
      ...projectExport,
      status: updated.status,
      metadata: updated.metadata,
      updatedAt: updated.updated_at,
    }}, {status: 202, headers: {'Cache-Control': 'no-store'}})
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mini-Run render dispatch failed.'
    if (projectExport) {
      await supabase.from('project_exports').update({status: 'failed', error_message: message, failed_at: new Date().toISOString()})
        .eq('id', projectExport.id).eq('user_id', user.id)
    }
    const isAuthError = /401|403|unauthorized|user_authentication_required|jwt|token expired/i.test(message)
    const status = isAuthError ? 401 : 502
    const code = isAuthError ? 'AUTH_REQUIRED' : 'RENDER_DISPATCH_FAILED'
    return NextResponse.json({error: message, code}, {status})
  }
}
