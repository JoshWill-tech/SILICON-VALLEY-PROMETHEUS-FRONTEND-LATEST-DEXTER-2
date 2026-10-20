import { NextResponse } from 'next/server'

import { ProjectService } from '@/lib/projects/service'
import { buildMiniRunRenderPayload } from '@/lib/server/mini-run-render-payload'
import { buildMiniRunSourceUrl } from '@/lib/server/mini-run-dispatch'
import { getMiniRunEnvironment, resolveMiniRunConfig } from '@/lib/server/mini-run-proxy'
import { createClient } from '@/lib/supabase/server'
import { isDevBypassActive } from '@/lib/supabase/dev-bypass'

/**
 * Rapid Mini-Run plan synthesis route (Phase 1).
 *
 * Runs ASR transcription, silence timeline analysis, smart typography
 * planning, orchestration, and candidate song selection on the Mini-Run API without
 * rendering video frames. Returns the editable `DraftManifest` to the frontend
 * in 3-5 seconds for live zero-lag interactive preview and voice mutation.
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

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required.', code: 'PLAN_INPUT_REQUIRED' },
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
    jobId = crypto.randomUUID()

    const env = getMiniRunEnvironment()
    const config = resolveMiniRunConfig(env)
    const sourceUrl = await buildMiniRunSourceUrl(bucket, row.storage_path)
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
      prompt,
    })

    const response = await fetch(`${config.baseUrl}/api/pipeline/plan`, {
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
      manifest?: unknown
      source?: unknown
      error?: unknown
    }

    if (!response.ok) {
      const message =
        typeof upstream.error === 'string' ? upstream.error : `Mini-Run plan returned HTTP ${response.status}.`
      return NextResponse.json({ error: message, code: 'PLAN_SYNTHESIS_FAILED' }, { status: 502 })
    }

    const plannedJobId = typeof upstream.jobId === 'string' ? upstream.jobId : jobId
    return NextResponse.json({
      ok: true,
      jobId: plannedJobId,
      manifest: upstream.manifest,
      source: upstream.source,
    })
  } catch (err) {
    console.error('[api/mini-run/plan] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to synthesize Mini-Run plan.' },
      { status: 500 },
    )
  }
}
