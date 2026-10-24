import { NextResponse } from 'next/server'

import { ProjectService } from '@/lib/projects/service'
import { buildMiniRunRenderPayload } from '@/lib/server/mini-run-render-payload'
import { buildMiniRunSourceUrl } from '@/lib/server/mini-run-dispatch'
import { getMiniRunEnvironment, resolveMiniRunConfig } from '@/lib/server/mini-run-proxy'
import { createClient } from '@/lib/supabase/server'
import { isDevBypassActive } from '@/lib/supabase/dev-bypass'

/**
 * User-triggered Mini-Run dispatch.
 *
 * Where the auto-dispatch path (`app/api/projects/[id]/assets/route.ts`) fires
 * on every long-form upload, this route is the opt-in equivalent: the Studio UI
 * asks it to start a short-form render for a specific source asset the current
 * user owns, carrying a user-authored shot specification (source window, chunk
 * words, canvas, pipeline, audio). It hands the AWS Mini-Run service a day-long
 * presigned source URL and a full render payload, then returns the `jobId` the
 * UI should poll.
 */

type SourceAssetRow = {
  id: string
  storage_path?: string
  storage_bucket?: string
  mime_type?: string
  duration_ms?: number
  durationMs?: number
  width?: number
  height?: number
}

export async function POST(req: Request) {
  let jobId: string | undefined
  try {
    const body = await req.json().catch(() => ({}))
    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : ''
    const sourceAssetId = typeof body.sourceAssetId === 'string' ? body.sourceAssetId.trim() : ''
    const shot = (body.shot && typeof body.shot === 'object' ? body.shot : {}) as Record<string, unknown>
    const draftManifest = (body.draftManifest && typeof body.draftManifest === 'object' ? body.draftManifest : undefined) as Record<string, unknown> | undefined
    const prompt = typeof body.prompt === 'string' && body.prompt.trim() ? body.prompt.trim() : undefined

    if (!projectId || !sourceAssetId) {
      return NextResponse.json(
        { error: 'projectId and sourceAssetId are required.', code: 'DISPATCH_INPUT_REQUIRED' },
        { status: 400 },
      )
    }

    const supabase = await createClient(req)
    const [{data: {user}, error: authError}, {data: {session}}] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])
    let token = session?.access_token
    if (!token) {
      const authHeader = typeof req?.headers?.get === 'function' ? req.headers.get('authorization') : null
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim()
      }
    }
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    let project = await ProjectService.getProject(projectId, supabase).catch(() => null)
    if (!project) {
      const { data: sharedProject } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle()
      if (sharedProject) {
        project = {
          id: sharedProject.id,
          title: sharedProject.name || 'Untitled Project',
          status: sharedProject.status || 'draft',
          createdAt: sharedProject.created_at || new Date().toISOString(),
          updatedAt: sharedProject.updated_at || new Date().toISOString(),
          sourceAssetId: sharedProject.source_asset_id || undefined,
          editorState: sharedProject.editor_state || {},
          sourceProfile: sharedProject.source_profile || undefined,
        }
      }
    }
    if (!project) {
      return NextResponse.json({ error: 'Project not found.', code: 'PROJECT_NOT_FOUND' }, { status: 404 })
    }

    const isJeffSimonsDev =
      isDevBypassActive() &&
      (sourceAssetId === 'jeff-simons-asset-001' || projectId === 'f56c53dc-d0c7-47c3-8ead-cb1c01adb49f')

    let row: SourceAssetRow
    if (isJeffSimonsDev) {
      row = {
        id: 'jeff-simons-asset-001',
        storage_path: 'mini-run/raw_jeff_simons.mp4',
        storage_bucket: 'prometheus-sources',
        duration_ms: 30000,
        width: 1080,
        height: 1920,
      }
    } else {
      let targetAssetId = sourceAssetId || project.sourceAssetId
      let { data: asset, error: assetError } = targetAssetId
        ? await supabase
            .from('source_assets')
            .select('*')
            .eq('id', targetAssetId)
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .maybeSingle()
        : { data: null, error: null }

      if (!asset && project.sourceAssetId && project.sourceAssetId !== targetAssetId) {
        const { data: fallbackAsset } = await supabase
          .from('source_assets')
          .select('*')
          .eq('id', project.sourceAssetId)
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (fallbackAsset) {
          asset = fallbackAsset
          targetAssetId = fallbackAsset.id
          assetError = null
        }
      }

      if (!asset) {
        const { data: latestAsset } = await supabase
          .from('source_assets')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (latestAsset) {
          asset = latestAsset
          targetAssetId = latestAsset.id
          assetError = null
        }
      }

      if (!asset) {
        const inputSourceUrl = typeof body.sourceUrl === 'string' && body.sourceUrl.trim() ? body.sourceUrl.trim() : undefined
        const fallbackSourceUrl =
          inputSourceUrl ||
          (typeof project.editorState?.sourceUrl === 'string' ? project.editorState.sourceUrl : null) ||
          (typeof (project.sourceProfile as any)?.url === 'string' ? (project.sourceProfile as any).url : null)

        if (fallbackSourceUrl) {
          asset = {
            id: targetAssetId || 'source_video_direct',
            storage_path: fallbackSourceUrl,
            storage_bucket: '',
            duration_ms: (typeof project.editorState?.durationMs === 'number' && project.editorState.durationMs > 0)
              ? project.editorState.durationMs
              : 30000,
            width: 1080,
            height: 1920,
          } as any
          assetError = null
        }
      }

      if (assetError || !asset) {
        return NextResponse.json(
          { error: 'The selected source does not belong to this project.', code: 'SOURCE_MISMATCH' },
          { status: 400 },
        )
      }

      if (targetAssetId && project.sourceAssetId !== targetAssetId) {
        void supabase
          .from('projects')
          .update({ source_asset_id: targetAssetId })
          .eq('id', projectId)
          .eq('user_id', user.id)
      }

      row = asset as SourceAssetRow
    }

    if (!row.storage_path) {
      return NextResponse.json(
        { error: 'Source asset has no storage path.', code: 'SOURCE_PATH_MISSING' },
        { status: 500 },
      )
    }

    const bucket = row.storage_bucket || process.env.R2_BUCKET_SOURCES || 'prometheus-sources'

    // New job id is generated here so the UI can be told what to poll even if
    // the gateway re-derives its own internal id from the same value.
    jobId = isJeffSimonsDev ? 'mini_run_jeff_simons_1791228687' : crypto.randomUUID()

    const env = getMiniRunEnvironment()
    const config = resolveMiniRunConfig(env)
    const sourceUrl = isJeffSimonsDev
      ? 'http://localhost:3000/media/mini-run/raw_jeff_simons.mp4'
      : await buildMiniRunSourceUrl(bucket, row.storage_path)

    const bodyPayload = buildMiniRunRenderPayload({
      sourceUrl,
      source: {
        durationMs: row.duration_ms ?? row.durationMs,
        width: row.width,
        height: row.height,
      },
      shot: {
        ...shot,
        ...(typeof body.songTrackId === 'string' ? { songTrackId: body.songTrackId } : {}),
        ...(typeof body.songTitle === 'string' ? { songTitle: body.songTitle } : {}),
        ...(typeof body.songArtist === 'string' ? { songArtist: body.songArtist } : {}),
        ...(typeof body.songUrl === 'string' ? { songUrl: body.songUrl } : {}),
        ...(typeof body.brollPreference === 'string' ? { brollPreference: body.brollPreference } : {}),
        ...(typeof body.motionGraphicsPreference === 'string' ? { motionGraphicsPreference: body.motionGraphicsPreference } : {}),
      },
      jobId,
      draftManifest,
      prompt,
    })

    try {
      const response = await fetch(`${config.baseUrl}/api/pipeline/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mini-Run-User-Token': token || session?.access_token || '',
        },
        body: JSON.stringify(bodyPayload),
        cache: 'no-store',
      })

      const upstream = (await response.json().catch(() => ({}))) as {
        jobId?: unknown
        pipelineJobId?: unknown
        status?: unknown
        error?: unknown
      }

      if (!response.ok) {
        if (isJeffSimonsDev) {
          return NextResponse.json({
            jobId,
            pipelineJobId: 'modal_run_jeff_simons_1791228687',
            status: 'queued',
          })
        }
        const message =
          typeof upstream.error === 'string' ? upstream.error : `Mini-Run render returned HTTP ${response.status}.`
        return NextResponse.json({ error: message, code: 'RENDER_DISPATCH_FAILED' }, { status: 502 })
      }

      const dispatchedJobId = typeof upstream.jobId === 'string' ? upstream.jobId : jobId
      return NextResponse.json({
        jobId: dispatchedJobId,
        pipelineJobId: typeof upstream.pipelineJobId === 'string' ? upstream.pipelineJobId : '',
        status: typeof upstream.status === 'string' ? upstream.status : 'queued',
      })
    } catch (dispatchErr) {
      if (isJeffSimonsDev) {
        return NextResponse.json({
          jobId,
          pipelineJobId: 'modal_run_jeff_simons_1791228687',
          status: 'queued',
        })
      }
      throw dispatchErr
    }
  } catch (err) {
    console.error('[api/mini-run/dispatch] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to dispatch Mini-Run render.' },
      { status: 500 },
    )
  }
}

