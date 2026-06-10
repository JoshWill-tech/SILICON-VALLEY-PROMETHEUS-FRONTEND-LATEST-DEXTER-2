'use client'

import * as React from 'react'

import { useProfile } from '@/hooks/use-profile'
import {
  normalizeNotificationPreferences,
  type NotificationPreferences,
  useNotificationPreferenceStore,
} from '@/lib/notifications/preference-store'
import { type FontId, type ThemeId } from '@/lib/theme/theme-tokens'
import { useThemePreferenceStore } from '@/lib/theme/theme-store'

export function useUserPreferencesHydrator() {
  const { profile } = useProfile()
  const hydrateTheme = useThemePreferenceStore((state) => state.setThemeAndFont)
  const hydrateNotifications = useNotificationPreferenceStore((state) => state.setPreferences)
  const hydratedUserIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!profile?.id) return
    if (hydratedUserIdRef.current === profile.id) return

    hydrateTheme({
      themeId: (profile.theme_preference as ThemeId | null | undefined) ?? undefined,
      fontId: (profile.font_preference as FontId | null | undefined) ?? undefined,
    })
    hydrateNotifications(normalizeNotificationPreferences(profile.notification_preferences as Partial<NotificationPreferences> | null))

    hydratedUserIdRef.current = profile.id
  }, [hydrateNotifications, hydrateTheme, profile])
}
