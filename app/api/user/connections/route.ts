import { formatDistanceToNow } from 'date-fns'
import { NextResponse } from 'next/server'

import { getProviderMetadata, parseConnectionScopes, type ProviderStatus } from '@/lib/oauth/provider-metadata'
import { createClient } from '@/lib/supabase/server'

function errorResponse(status: number, code: string, message: string, details: unknown = null) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
    },
    { status },
  )
}

function deriveStatus(expiresAt: string | null): ProviderStatus {
  if (!expiresAt) return 'active'

  const expiresAtTime = new Date(expiresAt).getTime()
  const now = Date.now()

  if (Number.isNaN(expiresAtTime) || expiresAtTime <= now) return 'expired'
  if (expiresAtTime <= now + 60 * 60 * 1000) return 'expiring_soon'
  return 'active'
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized')
  }

  const { data, error } = await supabase
    .from('user_connections')
    .select('id, user_id, provider, provider_user_id, provider_username, scope, expires_at, updated_at, is_active')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return errorResponse(500, 'CONNECTIONS_FETCH_FAILED', error.message, error.details ?? null)
  }

  const connections =
    data?.map((connection) => {
      const metadata = getProviderMetadata(connection.provider)
      const status = connection.is_active === false ? 'disconnected' : deriveStatus(connection.expires_at)

      return {
        id: connection.id,
        provider: connection.provider,
        platformName: metadata?.name ?? connection.provider,
        platformIcon: metadata?.iconName ?? 'Link2',
        providerAccountId: connection.provider_user_id ?? null,
        accountName: connection.provider_username ?? connection.provider_user_id ?? null,
        status,
        connected: status === 'active',
        lastSynced: connection.updated_at ? formatDistanceToNow(new Date(connection.updated_at), { addSuffix: true }) : null,
        scope: parseConnectionScopes(connection.scope),
        expiresAt: connection.expires_at,
        updatedAt: connection.updated_at,
      }
    }) ?? []

  return NextResponse.json({
    success: true,
    userId: user.id,
    connections,
  })
}
