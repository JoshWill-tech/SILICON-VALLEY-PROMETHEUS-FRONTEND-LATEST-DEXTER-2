import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type NotificationPreferences = {
  email: {
    marketing: boolean
    security: boolean
    updates: boolean
  }
  push: {
    browser: boolean
  }
  inApp: {
    realtime: boolean
  }
}

export type NotificationPreferencesInput = {
  email?: Partial<NotificationPreferences['email']>
  push?: Partial<NotificationPreferences['push']>
  inApp?: Partial<NotificationPreferences['inApp']>
} | null | undefined

type NotificationPreferenceState = {
  preferences: NotificationPreferences
  setPreferences: (preferences: NotificationPreferences) => void
  patchPreferences: (patch: Partial<NotificationPreferences>) => void
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: {
    marketing: false,
    security: true,
    updates: true,
  },
  push: {
    browser: false,
  },
  inApp: {
    realtime: true,
  },
}

export function normalizeNotificationPreferences(preferences?: NotificationPreferencesInput): NotificationPreferences {
  return {
    email: {
      marketing: preferences?.email?.marketing ?? DEFAULT_NOTIFICATION_PREFERENCES.email.marketing,
      security: preferences?.email?.security ?? DEFAULT_NOTIFICATION_PREFERENCES.email.security,
      updates: preferences?.email?.updates ?? DEFAULT_NOTIFICATION_PREFERENCES.email.updates,
    },
    push: {
      browser: preferences?.push?.browser ?? DEFAULT_NOTIFICATION_PREFERENCES.push.browser,
    },
    inApp: {
      realtime: preferences?.inApp?.realtime ?? DEFAULT_NOTIFICATION_PREFERENCES.inApp.realtime,
    },
  }
}

export const useNotificationPreferenceStore = create<NotificationPreferenceState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      setPreferences: (preferences) => set({ preferences: normalizeNotificationPreferences(preferences) }),
      patchPreferences: (patch) =>
        set((state) => ({
          preferences: normalizeNotificationPreferences({
            email: patch.email ?? state.preferences.email,
            push: patch.push ?? state.preferences.push,
            inApp: patch.inApp ?? state.preferences.inApp,
          }),
        })),
    }),
    {
      name: 'prometheus.notification.preferences.v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
