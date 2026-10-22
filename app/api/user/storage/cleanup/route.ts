import { AbortMultipartUploadCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

import { r2Client } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import { isDevBypassActive } from '@/lib/supabase/dev-bypass'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const resolvedUserId = user?.id || (isDevBypassActive() ? (process.env.DEV_AUTH_BYPASS_USER_ID || 'e261b522-9d57-4bfe-90c8-38b3720cec36') : null)

    if (!resolvedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const projectId = body?.projectId
    if (projectId !== undefined && (
      typeof projectId !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId)
    )) {
      return NextResponse.json({ success: false, error: 'Invalid project ID.' }, { status: 400 })
    }

    let clearedSessionsCount = 0
    let reclaimedReservationBytes = 0
    const errors: string[] = []

    // Explicit recovery is project-scoped. Existing callers without a scope
    // may only clean expired sessions; another project's active upload is valid.
    try {
      let sessionsQuery = supabase
        .from('source_upload_sessions')
        .select('id, bucket, object_key, multipart_upload_id, expected_size_bytes')
        .eq('user_id', resolvedUserId)
        .in('status', ['reserved', 'uploading', 'verified'])

      sessionsQuery = projectId
        ? sessionsQuery.eq('project_id', projectId)
        : sessionsQuery.lte('expires_at', new Date().toISOString())
      const { data: uncommittedSessions, error: sessionsError } = await sessionsQuery
      if (sessionsError) throw new Error(sessionsError.message)

      if (uncommittedSessions && uncommittedSessions.length > 0) {
        for (const session of uncommittedSessions) {
          try {
            const { data: aborted, error: abortError } = await supabase.rpc('maul_abort_source_upload', { p_session_id: session.id })
            if (abortError) throw new Error(abortError.message)
            // The RPC returns committed sessions unchanged if commit won a race.
            if (aborted?.status !== 'aborted') throw new Error('Upload session was not aborted.')
            clearedSessionsCount++
            reclaimedReservationBytes += Number(session.expected_size_bytes) || 0
          } catch (abortErr) {
            errors.push(`Session ${session.id}: ${abortErr instanceof Error ? abortErr.message : String(abortErr)}`)
            continue
          }

          if (session.multipart_upload_id && session.bucket && session.object_key) {
            await r2Client.send(new AbortMultipartUploadCommand({
              Bucket: session.bucket,
              Key: session.object_key,
              UploadId: session.multipart_upload_id,
            })).catch(() => undefined)
          }
        }
      }
    } catch (sessionErr) {
      errors.push(`Failed querying sessions: ${sessionErr instanceof Error ? sessionErr.message : String(sessionErr)}`)
    }

    // 2. Fetch current storage summary
    const { data: activeAssets, error: assetsError } = await supabase
      .from('source_assets')
      .select('id, size_bytes, project_id, source_revisions!inner(state)')
      .eq('user_id', resolvedUserId)
      .eq('source_revisions.state', 'current')

    if (assetsError) errors.push(`Failed reading storage summary: ${assetsError.message}`)

    const usedBytes = (activeAssets ?? []).reduce((acc, a) => acc + (Number(a.size_bytes) || 0), 0)

    return NextResponse.json({
      success: errors.length === 0,
      clearedSessionsCount,
      reclaimedReservationBytes,
      currentUsedBytes: assetsError ? null : usedBytes,
      activeAssetsCount: assetsError ? null : activeAssets?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: errors.length > 0 ? 500 : 200 })
  } catch (err) {
    console.error('[api/user/storage/cleanup] Error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Storage cleanup failed' },
      { status: 500 },
    )
  }
}
