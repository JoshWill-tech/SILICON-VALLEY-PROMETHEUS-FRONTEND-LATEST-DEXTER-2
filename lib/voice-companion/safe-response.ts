/**
 * Resilient API response parser for frontend and voice companion calls.
 * Ensures HTML error pages (e.g. 500, 502, 504 from Vercel/Cloudflare/Nginx)
 * never trigger unhandled `SyntaxError: Unexpected token '<'` crashes.
 */

export interface SafeApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
  status: number
}

export async function safeParseApiResponse<T>(
  response: Response | { ok: boolean; status?: number; json?: () => Promise<any>; text?: () => Promise<string> },
  defaultErrorMessage: string = 'The server returned an unexpected response.',
): Promise<SafeApiResponse<T>> {
  const status = typeof response.status === 'number' ? response.status : (response.ok ? 200 : 500)

  if (typeof response.text === 'function') {
    let text = ''
    try {
      text = await response.text()
    } catch {
      return { ok: false, error: 'Network connection was interrupted. Please try again.', status }
    }

    const trimmed = text.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as T & { error?: string; errorMessage?: string; message?: string }
        if (!response.ok) {
          const errorMsg = parsed.error || parsed.errorMessage || parsed.message || defaultErrorMessage
          return { ok: false, error: errorMsg, status }
        }
        return { ok: true, data: parsed as T, status }
      } catch {
        // Fall through to non-JSON error handling
      }
    }

    if (!response.ok && trimmed && !trimmed.startsWith('<') && !/<[a-z][\s\S]*>/i.test(trimmed) && trimmed.length < 500) {
      return { ok: false, error: trimmed, status }
    }
  } else if (typeof response.json === 'function') {
    try {
      const parsed = await response.json()
      if (!response.ok) {
        const errorMsg = parsed?.error || parsed?.errorMessage || parsed?.message || defaultErrorMessage
        return { ok: false, error: errorMsg, status }
      }
      return { ok: true, data: parsed as T, status }
    } catch {
      // Fall through to non-JSON error handling
    }
  }

  // Non-JSON or HTML response (e.g. gateway timeout or service crash)
  if (status === 504 || status === 408) {
    return {
      ok: false,
      error: 'The cloud render service is taking longer than usual to acknowledge the request. Your job may still be queuing in the background.',
      status,
    }
  }
  if (status === 502 || status === 503) {
    return {
      ok: false,
      error: 'The cloud rendering pipeline is temporarily busy or reconnecting. Please try again in a few moments.',
      status,
    }
  }
  if (status === 401 || status === 403) {
    return {
      ok: false,
      error: 'Your studio session has expired. Please refresh the page to continue.',
      status,
    }
  }

  return { ok: false, error: defaultErrorMessage, status }
}
