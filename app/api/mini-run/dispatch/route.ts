import { NextResponse } from 'next/server'

import { ProjectService } from '@/lib/projects/service'
import { buildMiniRunRenderPayload } from '@/lib/server/mini-run-render-payload'
import { buildMiniRunSourceUrl } from '@/lib/server/mini-run-dispatch'
import { resolveMiniRunConfig } from '@/lib/server/mini-run-proxy'
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

    if (!projectId || !sourceAssetId) {
      return NextResponse.json(
        { error: 'projectId and sourceAssetId are required.', code: 'DISPATCH_INPUT_REQUIRED' },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const [{data: {user}, error: authError}, {data: {session}}] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])
    if (authError || !user || !session?.access_token) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found.', code: 'PROJECT_NOT_FOUND' }, { status: 404 })
    }
    if (project.sourceAssetId !== sourceAssetId) {
      return NextResponse.json(
        { error: 'The selected source does not belong to this project.', code: 'SOURCE_MISMATCH' },
        { status: 400 },
      )
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
      const { data: asset, error: assetError } = await supabase
        .from('source_assets')
        .select('*')
        .eq('id', sourceAssetId)
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      if (assetError || !asset) {
        return NextResponse.json(
          { error: 'Source asset record not found.', code: 'SOURCE_ASSET_NOT_FOUND' },
          { status: 404 },
        )
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

    const env = {
      MINI_RUN_AWS_API_URL: process.env.MINI_RUN_AWS_API_URL || process.env.MINI_RUN_BACKEND_URL,
    }
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
      shot,
      jobId,
      draftManifest,
    })

    try {
      const response = await fetch(`${config.baseUrl}/api/pipeline/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mini-Run-User-Token': session.access_token,
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

