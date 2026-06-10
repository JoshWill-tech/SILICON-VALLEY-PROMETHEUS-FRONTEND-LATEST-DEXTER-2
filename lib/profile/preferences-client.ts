import type { NotificationPreferences } from '@/lib/notifications/preference-store'
import type { FontId, ThemeId } from '@/lib/theme/theme-tokens'

type ProfilePreferencesPatch = {
  displayName?: string
  bio?: string
  pronouns?: string
  location?: string
  avatarUrl?: string
  themePreference?: ThemeId
  fontPreference?: FontId
}

function parseJsonResponse(response: Response) {
  return response.json().catch(() => null) as Promise<{ error?: { message?: string } | string } | null>
}

export async function syncProfilePreferences(patch: ProfilePreferencesPatch) {
  const response = await fetch('/api/user/preferences', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  })

  const payload = await parseJsonResponse(response)
  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : payload?.error?.message || 'Failed to save preferences.'
    throw new Error(message)
  }

  return payload
}

export async function syncNotificationPreferences(preferences: NotificationPreferences) {
  const response = await fetch('/api/user/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ preferences }),
  })

  const payload = await parseJsonResponse(response)
  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : payload?.error?.message || 'Failed to save notification preferences.'
    throw new Error(message)
  }

  return payload
}
