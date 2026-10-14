import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken } from '@/lib/oauth/refresh'
import { handleHermesTurn, type HermesTurnDeps } from '@/lib/hermes'
import { HERMES_IDENTITY } from '@/lib/hermes/identity'
import { InMemoryHermesMemoryStore } from '@/lib/hermes/memory'
import { SupabaseHermesMemoryStore } from '@/lib/hermes/supabase-memory'
import type { HermesRequest } from '@/lib/hermes/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function miniRunEnv(): HermesTurnDeps['miniRunEnv'] {
  return {
    MINI_RUN_AWS_API_URL: process.env.MINI_RUN_AWS_API_URL,
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    agent: HERMES_IDENTITY,
    model: process.env.HERMES_MODEL || 'gemini-2.5-flash',
    driveConnected: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<HermesRequest>
    const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''
    if (!transcript) {
      return NextResponse.json({ error: '`transcript` is required.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 })
    }

    // Auth: verify authenticated session user.
    let sessionUserId: string | null = null
    let miniRunAccessToken: string | undefined
    let supabase: Awaited<ReturnType<typeof createClient>> | null = null
    try {
      supabase = await createClient()
      const [{data: {user}, error}, {data: {session}}] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ])
      if (user && !error) {
        sessionUserId = user.id
        miniRunAccessToken = session?.access_token
      }
    } catch {
      supabase = null
    }

    // Security: Only verified session users can access persistent Supabase memories and OAuth tokens.
    // When authenticated, the session user ID strictly overrides any caller-supplied body.userId (prevents IDOR).
    // For unauthenticated callers, fallback to ephemeral in-memory storage and NEVER provide Google Drive tokens.
    const isAuthenticated = Boolean(sessionUserId)
    const effectiveUserId = sessionUserId || (typeof body.userId === 'string' && body.userId ? body.userId : 'anonymous')

    const memoryStore = (supabase && isAuthenticated)
      ? new SupabaseHermesMemoryStore(supabase)
      : new InMemoryHermesMemoryStore()

    const getDriveToken = (supabase && isAuthenticated && sessionUserId)
      ? () => getValidAccessToken(sessionUserId, 'google_drive')
      : undefined

    const resolveMiniRunSource = (supabase && isAuthenticated && sessionUserId)
      ? async (projectId: string, sourceAssetId: string) => {
          const {data: project} = await supabase!.from('projects')
            .select('id, source_asset_id')
            .eq('id', projectId)
            .eq('user_id', sessionUserId)
            .maybeSingle()
          if (!project || project.source_asset_id !== sourceAssetId) return null

          const {data: asset} = await supabase!.from('source_assets')
            .select('id, storage_path, storage_bucket, mime_type, duration_ms, width, height')
            .eq('id', sourceAssetId)
            .eq('project_id', projectId)
            .eq('user_id', sessionUserId)
            .maybeSingle()
          if (!asset?.storage_path) return null

          return {
            projectId,
            sourceAssetId,
            bucket: asset.storage_bucket || process.env.R2_BUCKET_SOURCES || 'prometheus-sources',
            storagePath: asset.storage_path,
            mimeType: asset.mime_type || 'video/mp4',
            durationMs: asset.duration_ms ?? undefined,
            width: asset.width ?? undefined,
            height: asset.height ?? undefined,
          }
        }
      : undefined

    const deps: HermesTurnDeps = {
      apiKey,
      memoryStore,
      getDriveToken,
      miniRunAccessToken,
      miniRunEnv: miniRunEnv(),
      resolveMiniRunSource,
      userName: typeof body.userName === 'string' ? body.userName : undefined,
      brand: typeof body.brand === 'string' ? body.brand : undefined,
    }

    const result = await handleHermesTurn({ ...body, transcript, userId: effectiveUserId }, deps)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error while talking to Hermes.'
    console.error('[Hermes Agent]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
