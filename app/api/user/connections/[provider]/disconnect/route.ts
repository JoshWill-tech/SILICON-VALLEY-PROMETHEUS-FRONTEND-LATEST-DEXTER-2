import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { unsealToken } from '@/lib/crypto/token-vault'
import { PROVIDER_CONFIGS } from '@/lib/oauth/providers'
import { type OAuthProvider } from '@/lib/oauth/types'
import { createClient } from '@/lib/supabase/server'

const providerSchema = z.enum(['youtube', 'tiktok', 'instagram', 'x', 'google_drive', 'dropbox', 'facebook', 'linkedin'])

function errorResponse(status: number, code: string, message: string, details: unknown = null) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
    },
    { status },
  )
}

async function bestEffortRevoke(provider: OAuthProvider, accessToken: string) {
  const config = PROVIDER_CONFIGS[provider]
  if (!config?.revokeUrl) return

  switch (provider) {
    case 'youtube':
    case 'google_drive': {
      await fetch(`${config.revokeUrl}?token=${encodeURIComponent(accessToken)}`, { method: 'POST' })
      return
    }
    case 'dropbox': {
      await fetch(config.revokeUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      return
    }
    case 'x': {
      await fetch(config.revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: accessToken,
          client_id: process.env.X_CLIENT_ID || '',
        }),
      })
      return
    }
    case 'tiktok': {
      await fetch(config.revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY || '',
          token: accessToken,
        }),
      })
      return
    }
    default:
      return
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const parsedProvider = providerSchema.safeParse((await params).provider)
  if (!parsedProvider.success) {
    return errorResponse(400, 'INVALID_PROVIDER', 'Unsupported provider.')
  }

  const provider = parsedProvider.data as OAuthProvider
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized')
  }

  const { data: connection, error: connectionError } = await supabase
    .from('user_connections')
    .select('id, encrypted_access_token, iv, key_version')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .maybeSingle()

  if (connectionError) {
    return errorResponse(500, 'CONNECTION_LOOKUP_FAILED', connectionError.message, connectionError.details ?? null)
  }

  if (!connection) {
    return errorResponse(404, 'NOT_FOUND', 'Connection not found.')
  }

  if (connection.encrypted_access_token) {
    try {
      const accessToken = await unsealToken({
        ciphertext: connection.encrypted_access_token,
        iv: connection.iv,
        keyVersion: connection.key_version,
      })
      await bestEffortRevoke(provider, accessToken)
    } catch (error) {
      console.error(`[connections/disconnect] token revocation failed for ${provider}:`, error)
    }
  }

  const { error: deleteError } = await supabase
    .from('user_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider)

  if (deleteError) {
    return errorResponse(500, 'DISCONNECT_FAILED', deleteError.message, deleteError.details ?? null)
  }

  const platformName = PROVIDER_CONFIGS[provider]?.name ?? provider

  return NextResponse.json({
    success: true,
    message: `${platformName} disconnected successfully`,
  })
}
