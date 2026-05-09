const DEFAULT_NEXT_PATH = '/'

/**
 * Ensures a "next" path is a safe relative URL within the same application.
 */
export function normalizeNextPath(rawPath: string | null | undefined, fallback = DEFAULT_NEXT_PATH) {
  if (!rawPath) return fallback
  if (!rawPath.startsWith('/') || rawPath.startsWith('//')) return fallback

  try {
    const url = new URL(rawPath, 'http://localhost')

    if (url.origin !== 'http://localhost') return fallback

    return `${url.pathname}${url.search}${url.hash}` || fallback
  } catch {
    return fallback
  }
}

/**
 * Returns the intended public origin of the application.
 * Prefers NEXT_PUBLIC_SITE_URL if present, otherwise falls back to a provided request or window location.
 */
export function getSiteOrigin(input?: Request | URL | string) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    try {
      return new URL(envUrl).origin
    } catch {
      // ignore invalid env URL
    }
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  if (input) {
    try {
      const url = input instanceof Request ? new URL(input.url) : input instanceof URL ? input : new URL(input)
      return url.origin
    } catch {
      // ignore
    }
  }

  return 'http://localhost:3000'
}

/**
 * Builds a reliable /auth/confirm URL for Supabase redirects.
 */
export function buildAuthConfirmUrl(input: Request | URL | string, nextPath?: string) {
  const origin = getSiteOrigin(input)
  const url = new URL('/auth/confirm', origin)
  const next = normalizeNextPath(nextPath)

  if (next !== DEFAULT_NEXT_PATH) {
    url.searchParams.set('next', next)
  }

  return url
}
