'use client'

import * as React from 'react'
import { getProviderMetadata } from '@/lib/oauth/provider-metadata'

export type UserConnectionV2 = {
  id: string
  provider: string
  platformName?: string | null
  platformIcon?: string | null
  providerAccountId?: string | null
  accountName?: string | null
  connected?: boolean | null
  status?: 'active' | 'expiring_soon' | 'expired' | 'disconnected' | null
  lastSynced?: string | null
  scope?: string[]
  expiresAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export function useUserConnections() {
  const [connections, setConnections] = React.useState<UserConnectionV2[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/connections', {
        method: 'GET',
        cache: 'no-store',
      })
      const payload = (await response.json().catch(() => null)) as
        | {
            success?: true
            userId?: string | null
            connections?: UserConnectionV2[]
          }
        | {
            success?: false
            error?: { message?: string }
          }
        | null

      if (!response.ok || !payload?.success) {
        const message =
          payload && 'error' in payload && payload.error?.message
            ? payload.error.message
            : 'Unable to load account connections.'
        throw new Error(message)
      }

      setUserId(payload.userId ?? null)
      setConnections(payload.connections ?? [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load account connections.')
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const connectedProviders = React.useMemo(
    () =>
      new Set(
        connections
          .filter((connection) => connection.connected === true)
          .map((connection) => connection.provider)
          .filter((provider): provider is string => Boolean(provider)),
      ),
    [connections],
  )

  return {
    connections,
    connectedProviders,
    userId,
    loading,
    error,
    empty: !loading && !error && connections.length === 0,
    refresh,
    isConnected: (provider: string) => connectedProviders.has(provider),
    getMetadata: (provider: string) => getProviderMetadata(provider),
  }
}
