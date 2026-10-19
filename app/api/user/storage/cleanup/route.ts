import { AbortMultipartUploadCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

import { r2Client } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import { isDevBypassActive } from '@/lib/supabase/dev-bypass'

export async function POST(_req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const resolvedUserId = user?.id || (isDevBypassActive() ? (process.env.DEV_AUTH_BYPASS_USER_ID || 'e261b522-9d57-4bfe-90c8-38b3720cec36') : null)

    if (!resolvedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let clearedSessionsCount = 0
    let reclaimedReservationBytes = 0
    const errors: string[] = []

    // 1. Reclaim all uncommitted upload sessions
    try {
      const { data: uncommittedSessions } = await supabase
        .from('source_upload_sessions')
        .select('id, bucket, object_key, multipart_upload_id, expected_size_bytes')
        .eq('user_id', resolvedUserId)
        .in('status', ['reserved', 'uploading', 'verified'])

      if (uncommittedSessions && uncommittedSessions.length > 0) {
        for (const session of uncommittedSessions) {
          try {
            await supabase.rpc('maul_abort_source_upload', { p_session_id: session.id })
            clearedSessionsCount++
            reclaimedReservationBytes += Number(session.expected_size_bytes) || 0
          } catch (abortErr) {
            errors.push(`Session ${session.id}: ${abortErr instanceof Error ? abortErr.message : String(abortErr)}`)
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
    const { data: activeAssets } = await supabase
      .from('source_assets')
      .select('id, size_bytes, project_id, filename')
      .eq('user_id', resolvedUserId)

    const usedBytes = (activeAssets ?? []).reduce((acc, a) => acc + (Number(a.size_bytes) || 0), 0)

    return NextResponse.json({
      success: true,
      clearedSessionsCount,
      reclaimedReservationBytes,
      currentUsedBytes: usedBytes,
      activeAssetsCount: activeAssets?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('[api/user/storage/cleanup] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Storage cleanup failed' },
      { status: 500 },
    )
  }
}
