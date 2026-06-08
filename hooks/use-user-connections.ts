'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'

export type UserConnectionV2 = {
  id: string
  user_id?: string | null
  provider?: string | null
  provider_account_id?: string | null
  connected?: boolean | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: unknown
}

export function useUserConnections() {
  const [connections, setConnections] = React.useState<UserConnectionV2[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let disposed = false

    async function fetchConnections() {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (disposed) return

        if (authError) {
          setError(authError.message)
          setConnections([])
          return
        }

        if (!user) {
          setUserId(null)
          setConnections([])
          return
        }

        setUserId(user.id)

        const { data, error: queryError } = await supabase
          .from('user_connections')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (disposed) return

        if (queryError) {
          setError(queryError.message)
          setConnections([])
          return
        }

        setConnections((data ?? []) as UserConnectionV2[])
      } catch (caught) {
        if (!disposed) setError(caught instanceof Error ? caught.message : 'Unable to load account connections.')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void fetchConnections()

    return () => {
      disposed = true
    }
  }, [])

  const connectedProviders = React.useMemo(
    () =>
      new Set(
        connections
          .filter((connection) => connection.connected !== false && connection.status !== 'disconnected')
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
    isConnected: (provider: string) => connectedProviders.has(provider),
  }
}
