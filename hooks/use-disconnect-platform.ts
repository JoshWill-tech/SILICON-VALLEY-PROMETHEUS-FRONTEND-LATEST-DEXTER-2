'use client'

import { useCallback, useState } from 'react'

async function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function useDisconnectPlatform() {
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const disconnect = useCallback(async (provider: string) => {
    setIsDisconnecting(provider)
    setError(null)

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(`/api/user/connections/${provider}/disconnect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          const data = (await response.json().catch(() => null)) as
            | { success?: true; message?: string }
            | { success?: false; error?: { message?: string } }
            | null

          if (response.ok && data?.success) {
            return data
          }

          const message =
            data && 'error' in data && data.error?.message ? data.error.message : 'Failed to disconnect'

          if (attempt === 0 && response.status >= 500) {
            await sleep(250)
            continue
          }

          throw new Error(message)
        } catch (caught) {
          if (attempt === 0) {
            await sleep(250)
            continue
          }

          throw caught
        }
      }
    } catch (caught) {
      const normalizedError = caught instanceof Error ? caught : new Error('Disconnect failed')
      setError(normalizedError)
      throw normalizedError
    } finally {
      setIsDisconnecting(null)
    }
  }, [])

  return { disconnect, isDisconnecting, error }
}
