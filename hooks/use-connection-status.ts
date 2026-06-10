'use client'

import { useCallback } from 'react'

import { useUserConnections } from '@/hooks/use-user-connections'

export type ConnectionStatus = 'active' | 'expiring_soon' | 'expired' | 'disconnected'

export type ConnectionStatusInput = {
  accountName: string | null
  expiresAt: string | null
}

export function deriveConnectionStatus(connection: ConnectionStatusInput): ConnectionStatus {
  const expiresAt = connection.expiresAt ? new Date(connection.expiresAt).getTime() : null
  const now = Date.now()

  if (!expiresAt || Number.isNaN(expiresAt)) return 'active'
  if (expiresAt > now + 60 * 60 * 1000) return 'active'
  if (expiresAt > now) return 'expiring_soon'
  return 'expired'
}

export function getConnectionAccountLabel(connection: ConnectionStatusInput) {
  return connection.accountName
}

export function useConnectionStatus() {
  const { connections, loading, error, refresh } = useUserConnections()

  const getStatus = useCallback(
    (provider: string) => {
      const connection = connections.find((entry) => entry.provider === provider)
      if (!connection) {
        return { status: 'disconnected' as const, accountName: null }
      }

      if (connection.status === 'disconnected') {
        return {
          status: 'disconnected' as const,
          accountName: connection.accountName ?? null,
        }
      }

      return {
        status: deriveConnectionStatus({
          accountName: connection.accountName ?? null,
          expiresAt: connection.expiresAt ?? null,
        }),
        accountName: connection.accountName ?? null,
      }
    },
    [connections],
  )

  const isConnected = useCallback(
    (provider: string) => getStatus(provider).status === 'active',
    [getStatus],
  )

  return { connections, loading, error, refresh, getStatus, isConnected }
}
