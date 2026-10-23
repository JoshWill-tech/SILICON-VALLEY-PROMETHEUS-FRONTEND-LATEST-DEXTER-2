import 'server-only'

import { createServerClient } from '@supabase/ssr'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'

import { getSupabaseConfig } from '@/lib/supabase/config'
import { getDevSession } from '@/lib/supabase/dev-bypass'

function withDevSession(client: SupabaseClient): SupabaseClient {
  const devSession = getDevSession()
  if (!devSession) return client

  const session = devSession as unknown as Session
  const user = devSession.user as unknown as User
  const auth = new Proxy(client.auth, {
    get(target, property, receiver) {
      if (property === 'getSession' || property === 'refreshSession') {
        return async () => ({ data: { session }, error: null })
      }

      if (property === 'getUser') {
        return async () => ({ data: { user }, error: null })
      }

      return Reflect.get(target, property, receiver)
    },
  })

  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === 'auth') return auth
      return Reflect.get(target, property, receiver)
    },
  })
}

function resolveBearerToken(input?: string | Request | Headers | { headers?: Headers | { get(name: string): string | null } }): string | undefined {
  if (typeof input === 'string') {
    const cleaned = input.replace(/^Bearer\s+/i, '').trim()
    return cleaned && cleaned !== 'local-token' ? cleaned : undefined
  }
  if (input && typeof (input as any).headers?.get === 'function') {
    const authHeader = (input as any).headers.get('authorization')
    if (authHeader && typeof authHeader === 'string') {
      const cleaned = authHeader.replace(/^Bearer\s+/i, '').trim()
      return cleaned && cleaned !== 'local-token' ? cleaned : undefined
    }
  }
  if (input && typeof (input as any).get === 'function') {
    const authHeader = (input as any).get('authorization')
    if (authHeader && typeof authHeader === 'string') {
      const cleaned = authHeader.replace(/^Bearer\s+/i, '').trim()
      return cleaned && cleaned !== 'local-token' ? cleaned : undefined
    }
  }
  return undefined
}

export async function createClient(customTokenOrRequest?: string | Request | Headers | { headers?: Headers | { get(name: string): string | null } }) {
  let bearerToken = resolveBearerToken(customTokenOrRequest)

  if (!bearerToken) {
    try {
      const headerStore = await headers()
      const authHeader = headerStore.get('authorization')
      if (authHeader && typeof authHeader === 'string') {
        const cleaned = authHeader.replace(/^Bearer\s+/i, '').trim()
        if (cleaned && cleaned !== 'local-token') {
          bearerToken = cleaned
        }
      }
    } catch {
      // headers() might not be available in non-request contexts or mock tests
    }
  }

  let cookieStore: any = null
  try {
    cookieStore = await cookies()
  } catch {
    // cookies() might not be available in non-request contexts
  }

  const { url, publishableKey } = getSupabaseConfig()

  const client = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore?.getAll ? cookieStore.getAll() : []
      },
      setAll(cookiesToSet) {
        try {
          if (cookieStore?.set) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          }
        } catch {
          // Server components cannot write cookies. Proxy handles refreshes.
        }
      },
    },
    ...(bearerToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
          },
        }
      : {}),
  })

  // If a bearer token is present, wrap auth.getUser() to fall back to validating the token directly
  // if cookie-based getUser() returns no user or throws.
  if (bearerToken) {
    const originalGetUser = client.auth.getUser.bind(client.auth)
    client.auth.getUser = async (jwt?: string) => {
      const tokenToUse = jwt || bearerToken
      if (jwt) {
        return await originalGetUser(jwt)
      }
      try {
        const cookieResult = await originalGetUser()
        if (cookieResult?.data?.user) {
          return cookieResult
        }
      } catch {
        // Fall back to bearer token validation
      }
      return await originalGetUser(tokenToUse)
    }
  }

  return withDevSession(client)
}
