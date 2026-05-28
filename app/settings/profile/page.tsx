'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  Copy,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  Monitor,
  Moon,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Upload,
  X,
} from 'lucide-react'
import { useForm, useWatch, type FieldPath, type FieldPathValue } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAuth } from '@/components/auth/auth-provider'
import { PrometheusShell } from '@/components/prometheus-shell'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const SAVE_DELAY_MS = 800

const themeSchema = z.enum(['midnight', 'obsidian', 'deep-space'])
const accentSchema = z.enum(['indigo', 'violet', 'cyan', 'emerald', 'amber', 'rose'])
const densitySchema = z.enum(['compact', 'comfortable', 'spacious'])
const sidebarSchema = z.enum(['left', 'right', 'collapsed'])
const exportQualitySchema = z.enum(['draft', 'standard', 'maximum'])
const exportFormatSchema = z.enum(['mp4', 'mov', 'prores'])

const profileSettingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters')
    .max(32, 'Keep username under 32 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Use letters, numbers, dots, dashes, or underscores'),
  displayName: z.string().trim().min(1, 'Display name is required').max(80, 'Keep display name under 80 characters'),
  avatarUrl: z.string().optional(),
  theme: themeSchema,
  accent: accentSchema,
  density: densitySchema,
  sidebar: sidebarSchema,
  emailNotifications: z.object({
    exportCompletions: z.boolean(),
    aiTaskCompletions: z.boolean(),
    billingReminders: z.boolean(),
  }),
  inAppNotifications: z.object({
    showToasts: z.boolean(),
    playSound: z.boolean(),
    showBadges: z.boolean(),
  }),
  defaultExportQuality: exportQualitySchema,
  defaultFormat: exportFormatSchema,
  twoFactorEnabled: z.boolean(),
  apiKey: z.string().min(10),
  usageAnalytics: z.boolean(),
})

type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>
type ThemeValue = z.infer<typeof themeSchema>
type AccentValue = z.infer<typeof accentSchema>
type DensityValue = z.infer<typeof densitySchema>
type SidebarValue = z.infer<typeof sidebarSchema>
type ExportQualityValue = z.infer<typeof exportQualitySchema>
type ExportFormatValue = z.infer<typeof exportFormatSchema>
type SaveTarget = 'username' | 'displayName' | 'resetPassword' | 'twoFactor' | 'apiKey' | 'session' | null
type PreferenceTarget =
  | 'theme'
  | 'accent'
  | 'density'
  | 'sidebar'
  | 'notifications'
  | 'export'
  | 'analytics'
  | null

const DEFAULT_VALUES: ProfileSettingsFormValues = {
  username: 'creator',
  displayName: 'Creative Operator',
  avatarUrl: '',
  theme: 'midnight',
  accent: 'indigo',
  density: 'comfortable',
  sidebar: 'left',
  emailNotifications: {
    exportCompletions: true,
    aiTaskCompletions: true,
    billingReminders: false,
  },
  inAppNotifications: {
    showToasts: true,
    playSound: false,
    showBadges: true,
  },
  defaultExportQuality: 'standard',
  defaultFormat: 'mp4',
  twoFactorEnabled: false,
  apiKey: 'pk_live_demo_cinema_access_key',
  usageAnalytics: false,
}

const THEME_OPTIONS: Array<{
  value: ThemeValue
  label: string
  description: string
  previewClassName: string
  implemented: boolean
}> = [
  {
    value: 'midnight',
    label: 'Midnight',
    description: 'Current dark',
    previewClassName: 'bg-[linear-gradient(180deg,rgba(19,20,26,0.9)_0%,rgba(9,10,13,0.94)_100%)]',
    implemented: true,
  },
  {
    value: 'obsidian',
    label: 'Obsidian',
    description: 'OLED black',
    previewClassName: 'bg-black',
    implemented: false,
  },
  {
    value: 'deep-space',
    label: 'Deep Space',
    description: 'Blue tint',
    previewClassName: 'bg-[linear-gradient(180deg,rgba(17,24,39,0.92)_0%,rgba(5,10,20,0.98)_100%)]',
    implemented: false,
  },
]

const ACCENT_OPTIONS: Array<{
  value: AccentValue
  label: string
  className: string
  hex: string
}> = [
  { value: 'indigo', label: 'Indigo', className: 'bg-[#6366f1]', hex: '#6366f1' },
  { value: 'violet', label: 'Violet', className: 'bg-violet-500', hex: '#8b5cf6' },
  { value: 'cyan', label: 'Cyan', className: 'bg-cyan-400', hex: '#22d3ee' },
  { value: 'emerald', label: 'Emerald', className: 'bg-emerald-400', hex: '#34d399' },
  { value: 'amber', label: 'Amber', className: 'bg-amber-400', hex: '#fbbf24' },
  { value: 'rose', label: 'Rose', className: 'bg-rose-400', hex: '#fb7185' },
]

const DENSITY_OPTIONS: Array<{ value: DensityValue; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
]

const SIDEBAR_OPTIONS: Array<{ value: SidebarValue; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'collapsed', label: 'Collapsed' },
]

const EXPORT_QUALITY_OPTIONS: Array<{ value: ExportQualityValue; label: string }> = [
  { value: 'draft', label: 'Draft (fast)' },
  { value: 'standard', label: 'Standard' },
  { value: 'maximum', label: 'Maximum (slow)' },
]

const EXPORT_FORMAT_OPTIONS: Array<{ value: ExportFormatValue; label: string }> = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mov', label: 'MOV' },
  { value: 'prores', label: 'ProRes' },
]

const MOCK_SESSIONS = [
  {
    id: 'current',
    icon: Monitor,
    device: 'Chrome on macOS',
    location: 'San Francisco, CA',
    updatedAt: 'Current session',
    current: true,
  },
  {
    id: 'ios',
    icon: Smartphone,
    device: 'Safari on iPhone',
    location: 'Los Angeles, CA',
    updatedAt: '2 hours ago',
    current: false,
  },
  {
    id: 'laptop',
    icon: Laptop,
    device: 'Edge on Windows',
    location: 'New York, NY',
    updatedAt: 'Yesterday',
    current: false,
  },
]

function delay(ms = SAVE_DELAY_MS) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getEmailUsername(email: string | undefined | null) {
  return email?.split('@')[0]?.trim() || 'creator'
}

function getInitial(email: string | undefined | null, username: string) {
  return (getEmailUsername(email) || username || 'P').charAt(0).toUpperCase()
}

function safeRead(key: string) {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

function safeWrite(key: string, value: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

function readJson<T>(key: string, fallback: T): T {
  const raw = safeRead(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function readBoolean(key: string, fallback: boolean) {
  const raw = safeRead(key)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return fallback
}

function loadSettings(email: string | undefined | null): ProfileSettingsFormValues {
  const emailUsername = getEmailUsername(email)
  const notifications = readJson('prometheus_profile_notifications', {
    emailNotifications: DEFAULT_VALUES.emailNotifications,
    inAppNotifications: DEFAULT_VALUES.inAppNotifications,
  })
  const exportDefaults = readJson('prometheus_default_export_settings', {
    defaultExportQuality: DEFAULT_VALUES.defaultExportQuality,
    defaultFormat: DEFAULT_VALUES.defaultFormat,
  })

  const candidate = {
    ...DEFAULT_VALUES,
    username: safeRead('prometheus_username') || emailUsername,
    displayName: safeRead('prometheus_display_name') || emailUsername,
    theme: safeRead('prometheus_theme') || DEFAULT_VALUES.theme,
    accent: safeRead('prometheus_accent') || DEFAULT_VALUES.accent,
    density: safeRead('prometheus_density') || DEFAULT_VALUES.density,
    sidebar: safeRead('prometheus_sidebar_position') || DEFAULT_VALUES.sidebar,
    emailNotifications: notifications.emailNotifications || DEFAULT_VALUES.emailNotifications,
    inAppNotifications: notifications.inAppNotifications || DEFAULT_VALUES.inAppNotifications,
    defaultExportQuality: exportDefaults.defaultExportQuality || DEFAULT_VALUES.defaultExportQuality,
    defaultFormat: exportDefaults.defaultFormat || DEFAULT_VALUES.defaultFormat,
    twoFactorEnabled: readBoolean('prometheus_two_factor_enabled', DEFAULT_VALUES.twoFactorEnabled),
    apiKey: safeRead('prometheus_api_key') || DEFAULT_VALUES.apiKey,
    usageAnalytics: readBoolean('prometheus_usage_analytics', DEFAULT_VALUES.usageAnalytics),
  }

  const parsed = profileSettingsSchema.safeParse(candidate)
  return parsed.success ? parsed.data : { ...DEFAULT_VALUES, username: emailUsername, displayName: emailUsername }
}

function persistSettings(values: ProfileSettingsFormValues) {
  safeWrite('prometheus_username', values.username)
  safeWrite('prometheus_display_name', values.displayName)
  safeWrite('prometheus_theme', values.theme)
  safeWrite('prometheus_accent', values.accent)
  safeWrite('prometheus_density', values.density)
  safeWrite('prometheus_sidebar_position', values.sidebar)
  safeWrite(
    'prometheus_profile_notifications',
    JSON.stringify({
      emailNotifications: values.emailNotifications,
      inAppNotifications: values.inAppNotifications,
    }),
  )
  safeWrite(
    'prometheus_default_export_settings',
    JSON.stringify({
      defaultExportQuality: values.defaultExportQuality,
      defaultFormat: values.defaultFormat,
    }),
  )
  safeWrite('prometheus_two_factor_enabled', String(values.twoFactorEnabled))
  safeWrite('prometheus_api_key', values.apiKey)
  safeWrite('prometheus_usage_analytics', String(values.usageAnalytics))
}

function applyUiPreferences(theme: ThemeValue, accent: AccentValue, density: DensityValue) {
  if (typeof document === 'undefined') return
  const accentOption = ACCENT_OPTIONS.find((option) => option.value === accent) ?? ACCENT_OPTIONS[0]
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.accent = accent
  document.documentElement.style.setProperty('--accent', accentOption.hex)
  document.body.dataset.density = density
}

function getMaskedApiKey(apiKey: string, revealed: boolean) {
  if (revealed) return apiKey
  return 'pk_live_••••••••••••••••'
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { session, isLoading: authLoading } = useAuth()
  const email = session?.user?.email ?? ''
  const supabase = React.useMemo(() => createClient(), [])
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const form = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  const {
    control,
    formState: { errors },
    getValues,
    register,
    reset,
    setValue,
    trigger,
  } = form

  const watchedValues = useWatch({ control })
  const username = watchedValues.username ?? DEFAULT_VALUES.username
  const selectedTheme = watchedValues.theme ?? DEFAULT_VALUES.theme
  const selectedAccent = watchedValues.accent ?? DEFAULT_VALUES.accent
  const selectedDensity = watchedValues.density ?? DEFAULT_VALUES.density
  const selectedSidebar = watchedValues.sidebar ?? DEFAULT_VALUES.sidebar
  const emailNotifications = {
    ...DEFAULT_VALUES.emailNotifications,
    ...watchedValues.emailNotifications,
  }
  const inAppNotifications = {
    ...DEFAULT_VALUES.inAppNotifications,
    ...watchedValues.inAppNotifications,
  }
  const defaultExportQuality = watchedValues.defaultExportQuality ?? DEFAULT_VALUES.defaultExportQuality
  const defaultFormat = watchedValues.defaultFormat ?? DEFAULT_VALUES.defaultFormat
  const twoFactorEnabled = watchedValues.twoFactorEnabled ?? DEFAULT_VALUES.twoFactorEnabled
  const apiKey = watchedValues.apiKey ?? DEFAULT_VALUES.apiKey
  const usageAnalytics = watchedValues.usageAnalytics ?? DEFAULT_VALUES.usageAnalytics

  const [settingsReady, setSettingsReady] = React.useState(false)
  const [avatarPreview, setAvatarPreview] = React.useState('')
  const [savingTarget, setSavingTarget] = React.useState<SaveTarget>(null)
  const [savedTarget, setSavedTarget] = React.useState<SaveTarget>(null)
  const [savingPreference, setSavingPreference] = React.useState<PreferenceTarget>(null)
  const [apiRevealed, setApiRevealed] = React.useState(false)
  const [twoFactorMode, setTwoFactorMode] = React.useState<'enable' | 'disable' | null>(null)
  const [twoFactorPassword, setTwoFactorPassword] = React.useState('')
  const [sessions, setSessions] = React.useState(MOCK_SESSIONS)
  const [dangerRevealed, setDangerRevealed] = React.useState(false)
  const [dangerChecked, setDangerChecked] = React.useState(false)
  const [deactivateOpen, setDeactivateOpen] = React.useState(false)

  React.useEffect(() => {
    const nextSettings = loadSettings(email)
    reset(nextSettings)
    applyUiPreferences(nextSettings.theme, nextSettings.accent, nextSettings.density)
    setSettingsReady(true)
  }, [email, reset])

  React.useEffect(() => {
    if (!settingsReady) return
    applyUiPreferences(selectedTheme, selectedAccent, selectedDensity)
  }, [selectedAccent, selectedDensity, selectedTheme, settingsReady])

  React.useEffect(() => {
    if (!avatarPreview.startsWith('blob:')) return
    return () => URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  async function markPreferenceSaved(target: PreferenceTarget) {
    setSavingPreference(target)
    await delay()
    setSavingPreference(null)
  }

  function persistCurrentSettings() {
    const parsed = profileSettingsSchema.safeParse(getValues())
    if (parsed.success) persistSettings(parsed.data)
  }

  async function saveTextField(target: 'username' | 'displayName') {
    const isValid = await trigger(target)
    if (!isValid) return

    setSavingTarget(target)
    await delay()
    persistCurrentSettings()
    setSavingTarget(null)
    setSavedTarget(target)
    toast.success(target === 'username' ? 'Username saved' : 'Display name saved')
    window.setTimeout(() => setSavedTarget(null), 1400)
  }

  function updatePreference<T extends FieldPath<ProfileSettingsFormValues>>(
    target: PreferenceTarget,
    field: T,
    value: FieldPathValue<ProfileSettingsFormValues, T>,
  ) {
    setValue(field, value, { shouldDirty: true, shouldValidate: true })
    window.setTimeout(persistCurrentSettings, 0)
    void markPreferenceSaved(target)
  }

  function updateNestedPreference(
    target: PreferenceTarget,
    field:
      | 'emailNotifications.exportCompletions'
      | 'emailNotifications.aiTaskCompletions'
      | 'emailNotifications.billingReminders'
      | 'inAppNotifications.showToasts'
      | 'inAppNotifications.playSound'
      | 'inAppNotifications.showBadges',
    value: boolean,
  ) {
    setValue(field, value, { shouldDirty: true, shouldValidate: true })
    window.setTimeout(persistCurrentSettings, 0)
    void markPreferenceSaved(target)
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setValue('avatarUrl', previewUrl, { shouldDirty: true })
    toast.success('Avatar preview updated')
  }

  async function handleResetPassword() {
    if (!email) {
      toast.error('Sign in before requesting a password reset')
      return
    }

    setSavingTarget('resetPassword')
    await delay()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSavingTarget(null)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Check your email for reset instructions.')
  }

  async function completeTwoFactorSetup() {
    setSavingTarget('twoFactor')
    await delay()
    setValue('twoFactorEnabled', twoFactorMode === 'enable', { shouldDirty: true, shouldValidate: true })
    window.setTimeout(persistCurrentSettings, 0)
    setSavingTarget(null)
    setTwoFactorMode(null)
    setTwoFactorPassword('')
    toast.success(twoFactorMode === 'enable' ? '2FA enabled' : '2FA disabled')
  }

  async function copyApiKey() {
    await navigator.clipboard.writeText(apiKey)
    toast.success('API key copied')
  }

  async function regenerateApiKey() {
    setSavingTarget('apiKey')
    await delay()
    const nextKey = `pk_live_mock_${crypto.randomUUID().replaceAll('-', '').slice(0, 22)}`
    setValue('apiKey', nextKey, { shouldDirty: true, shouldValidate: true })
    window.setTimeout(persistCurrentSettings, 0)
    setSavingTarget(null)
    toast.success('API key regenerated')
  }

  async function revokeSession(sessionId: string) {
    setSavingTarget('session')
    await delay()
    setSessions((current) => current.filter((item) => item.id !== sessionId))
    setSavingTarget(null)
    toast.success('Session revoked.')
  }

  const currentAccent = ACCENT_OPTIONS.find((option) => option.value === selectedAccent) ?? ACCENT_OPTIONS[0]
  const initials = getInitial(email, username)

  return (
    <PrometheusShell>
      <div className="min-h-full bg-[linear-gradient(180deg,rgba(19,20,26,0.9)_0%,rgba(9,10,13,0.94)_100%)] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 text-white/62">
                <Link href="/settings">
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight text-white">Profile Settings</h1>
              <p className="mt-2 text-sm text-white/50">Manage your account, security, and workspace preferences</p>
            </div>
            <StatusPill saving={savingPreference !== null} accent={currentAccent.hex} />
          </header>

          <div className="space-y-5">
            <ProfileCard>
              <SectionTitle title="Account Info" />
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="flex shrink-0 flex-col items-start gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex size-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#6366f1] text-2xl font-bold text-white shadow-[0_18px_54px_-24px_rgba(99,102,241,0.95)]"
                    style={{ background: avatarPreview ? undefined : 'var(--accent, #6366f1)' }}
                    aria-label="Upload avatar"
                  >
                    {avatarPreview ? (
                      // Local object URLs are not compatible with next/image.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      <Upload className="size-5" />
                    </span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <div className="text-xs text-white/42">Click to upload</div>
                </div>

                <div className="min-w-0 flex-1 space-y-5">
                  <FieldRow label="Username" error={errors.username?.message}>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        {...register('username')}
                        className="h-10 rounded-[14px] border-white/16 bg-white/[0.06] text-white/90 focus:border-[#6366f1]/70 focus:ring-[#6366f1]/20"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingTarget === 'username'}
                        onClick={() => void saveTextField('username')}
                        className="h-10 rounded-[16px] border-[#6366f1]/80 bg-[#6366f1] px-4 text-white shadow-[0_18px_54px_-24px_rgba(99,102,241,0.95)] hover:border-[#818cf8] hover:bg-[#5558e8]"
                      >
                        {savingTarget === 'username' ? <Loader2 className="size-4 animate-spin" /> : null}
                        {savedTarget === 'username' ? 'Saved ✓' : 'Change Username'}
                      </Button>
                    </div>
                  </FieldRow>

                  <FieldRow label="Email Address">
                    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/42">
                      {authLoading ? 'Loading email...' : email || 'No email available'}
                    </div>
                  </FieldRow>

                  <FieldRow
                    label="Display Name"
                    description="How you appear to team members and clients. Separate from username."
                    error={errors.displayName?.message}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        {...register('displayName')}
                        className="h-10 rounded-[14px] border-white/16 bg-white/[0.06] text-white/90 focus:border-[#6366f1]/70 focus:ring-[#6366f1]/20"
                      />
                      <Button type="button" size="sm" variant="secondary" disabled={savingTarget === 'displayName'} onClick={() => void saveTextField('displayName')}>
                        {savingTarget === 'displayName' ? <Loader2 className="size-4 animate-spin" /> : null}
                        {savedTarget === 'displayName' ? 'Saved ✓' : 'Save Name'}
                      </Button>
                    </div>
                  </FieldRow>
                </div>
              </div>
            </ProfileCard>

            <ProfileCard>
              <SectionTitle title="Workspace Customization" withDivider />
              <div className="space-y-6">
                <PreferenceBlock label="Interface Theme" saving={savingPreference === 'theme'}>
                  <ThemeSelector
                    value={selectedTheme}
                    onChange={(nextTheme) => {
                      if (nextTheme !== 'midnight') toast.info('Coming soon')
                      updatePreference('theme', 'theme', nextTheme)
                    }}
                  />
                </PreferenceBlock>

                <PreferenceBlock label="Accent Color" saving={savingPreference === 'accent'}>
                  <AccentPicker value={selectedAccent} onChange={(accent) => updatePreference('accent', 'accent', accent)} />
                </PreferenceBlock>

                <PreferenceBlock label="Interface Density" saving={savingPreference === 'density'}>
                  <SegmentedControl
                    options={DENSITY_OPTIONS}
                    value={selectedDensity}
                    onChange={(density) => updatePreference('density', 'density', density)}
                  />
                </PreferenceBlock>

                <PreferenceBlock label="Sidebar" saving={savingPreference === 'sidebar'}>
                  <SegmentedControl
                    options={SIDEBAR_OPTIONS}
                    value={selectedSidebar}
                    onChange={(sidebar) => updatePreference('sidebar', 'sidebar', sidebar)}
                  />
                </PreferenceBlock>
              </div>
            </ProfileCard>

            <ProfileCard>
              <SectionTitle title="Notifications & Preferences" withDivider />
              <div className="space-y-6">
                <PreferenceBlock label="Email Notifications" saving={savingPreference === 'notifications'}>
                  <div className="space-y-3">
                    <NotificationToggle
                      label="Export completions"
                      checked={emailNotifications.exportCompletions}
                      onChange={(checked) => updateNestedPreference('notifications', 'emailNotifications.exportCompletions', checked)}
                    />
                    <NotificationToggle
                      label="AI task completions"
                      checked={emailNotifications.aiTaskCompletions}
                      onChange={(checked) => updateNestedPreference('notifications', 'emailNotifications.aiTaskCompletions', checked)}
                    />
                    <NotificationToggle
                      label="Billing reminders"
                      checked={emailNotifications.billingReminders}
                      onChange={(checked) => updateNestedPreference('notifications', 'emailNotifications.billingReminders', checked)}
                    />
                  </div>
                </PreferenceBlock>

                <PreferenceBlock label="In-App Notifications" saving={savingPreference === 'notifications'}>
                  <div className="space-y-3">
                    <NotificationToggle
                      label="Show toast notifications"
                      checked={inAppNotifications.showToasts}
                      onChange={(checked) => updateNestedPreference('notifications', 'inAppNotifications.showToasts', checked)}
                    />
                    <NotificationToggle
                      label="Play sound on task completion"
                      checked={inAppNotifications.playSound}
                      onChange={(checked) => updateNestedPreference('notifications', 'inAppNotifications.playSound', checked)}
                    />
                    <NotificationToggle
                      label="Show badge counts on project cards"
                      checked={inAppNotifications.showBadges}
                      onChange={(checked) => updateNestedPreference('notifications', 'inAppNotifications.showBadges', checked)}
                    />
                  </div>
                </PreferenceBlock>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PreferenceBlock label="Default Export Quality" saving={savingPreference === 'export'}>
                    <SelectField
                      value={defaultExportQuality}
                      options={EXPORT_QUALITY_OPTIONS}
                      onChange={(value) => updatePreference('export', 'defaultExportQuality', value)}
                    />
                  </PreferenceBlock>
                  <PreferenceBlock label="Default Format" saving={savingPreference === 'export'}>
                    <SelectField
                      value={defaultFormat}
                      options={EXPORT_FORMAT_OPTIONS}
                      onChange={(value) => updatePreference('export', 'defaultFormat', value)}
                    />
                  </PreferenceBlock>
                </div>
              </div>
            </ProfileCard>

            <ProfileCard>
              <SectionTitle title="Security" withDivider />
              <div className="space-y-4">
                <SecurityRow
                  icon={Lock}
                  label="Password"
                  value="••••••••"
                  action={
                    <Button type="button" size="sm" variant="ghost" disabled={savingTarget === 'resetPassword'} onClick={() => void handleResetPassword()}>
                      {savingTarget === 'resetPassword' ? <Loader2 className="size-4 animate-spin" /> : null}
                      Reset Password
                    </Button>
                  }
                />

                <SecurityRow
                  icon={ShieldCheck}
                  label="Two-Factor Authentication"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <span className={cn('size-2 rounded-full', twoFactorEnabled ? 'bg-emerald-400' : 'bg-rose-400')} />
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  }
                  action={
                    <Button type="button" size="sm" variant="secondary" onClick={() => setTwoFactorMode(twoFactorEnabled ? 'disable' : 'enable')}>
                      {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </Button>
                  }
                />

                <ApiKeyField
                  apiKey={apiKey}
                  revealed={apiRevealed}
                  saving={savingTarget === 'apiKey'}
                  onCopy={() => void copyApiKey()}
                  onRegenerate={() => void regenerateApiKey()}
                  onRevealChange={setApiRevealed}
                />

                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">Active Sessions</div>
                      <div className="mt-1 text-xs text-white/42">Current browser and recent mock sign-ins.</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sessions.map((item) => {
                      const SessionIcon = item.icon
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/54">
                              <SessionIcon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm font-medium text-white/82">
                                <span className="truncate">{item.device}</span>
                                {item.current ? (
                                  <span className="rounded-full border border-[#6366f1]/36 bg-[#6366f1]/14 px-2 py-0.5 text-[10px] text-[#c7d2fe]">
                                    Current
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-1 truncate text-xs text-white/42">
                                {item.location} · {item.updatedAt}
                              </div>
                            </div>
                          </div>
                          {!item.current ? (
                            <Button type="button" size="sm" variant="ghost" disabled={savingTarget === 'session'} onClick={() => void revokeSession(item.id)}>
                              Revoke
                            </Button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </ProfileCard>

            <ProfileCard>
              <SectionTitle title="Data & Privacy" withDivider />
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">Data Export</div>
                    <div className="mt-1 text-xs leading-5 text-white/42">Download a ZIP of all your project metadata and settings.</div>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => toast.info('Preparing your data export…')}>
                    <Database className="size-4" />
                    Export My Data
                  </Button>
                </div>

                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                  <NotificationToggle
                    label="Share anonymized usage data to improve AI recommendations"
                    description="Helps us tune song matching and clip detection for your workflow."
                    checked={usageAnalytics}
                    onChange={(checked) => updatePreference('analytics', 'usageAnalytics', checked)}
                  />
                </div>
              </div>
            </ProfileCard>

            <DangerZone
              checked={dangerChecked}
              revealed={dangerRevealed}
              onCheckedChange={setDangerChecked}
              onDeactivateClick={() => setDeactivateOpen(true)}
              onReveal={() => setDangerRevealed(true)}
            />
          </div>
        </div>
      </div>

      <TwoFactorDialog
        mode={twoFactorMode}
        password={twoFactorPassword}
        saving={savingTarget === 'twoFactor'}
        onClose={() => {
          setTwoFactorMode(null)
          setTwoFactorPassword('')
        }}
        onPasswordChange={setTwoFactorPassword}
        onSubmit={() => void completeTwoFactorSetup()}
      />

      <DeactivateModal
        open={deactivateOpen}
        projectCount={12}
        onClose={() => setDeactivateOpen(false)}
        onDeactivate={() => router.push('/goodbye')}
      />
    </PrometheusShell>
  )
}

function ProfileCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_34px_90px_-58px_rgba(0,0,0,0.95)] backdrop-blur-xl',
        className,
      )}
    >
      {children}
    </motion.section>
  )
}

function SectionTitle({ title, withDivider = false }: { title: string; withDivider?: boolean }) {
  return (
    <div className={cn('mb-5', withDivider && 'border-t border-white/10 pt-5')}>
      <h2 className="text-base font-semibold text-white">{title}</h2>
    </div>
  )
}

function FieldRow({
  children,
  description,
  error,
  label,
}: {
  children: React.ReactNode
  description?: string
  error?: string
  label: string
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/50">{label}</span>
      {description ? <span className="mt-1 block text-xs leading-5 text-white/38">{description}</span> : null}
      <div className="mt-2">{children}</div>
      {error ? <span className="mt-1 block text-xs text-rose-400">{error}</span> : null}
    </label>
  )
}

function PreferenceBlock({
  children,
  label,
  saving,
}: {
  children: React.ReactNode
  label: string
  saving?: boolean
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white/82">{label}</div>
        {saving ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/42">
            <Loader2 className="size-3 animate-spin" />
            Saving
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function ThemeSelector({ onChange, value }: { onChange: (value: ThemeValue) => void; value: ThemeValue }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {THEME_OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            title={option.implemented ? option.label : 'Coming soon'}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-[18px] border bg-white/[0.03] p-3 text-left transition-all duration-150 ease-out hover:-translate-y-1 hover:border-white/[0.12]',
              selected ? 'border-[#6366f1]/36 shadow-[0_0_30px_rgba(99,102,241,0.24)]' : 'border-white/10',
            )}
          >
            <div className={cn('h-12 rounded-[12px] border border-white/10', option.previewClassName)} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-white">{option.label}</div>
                <div className="mt-1 text-xs text-white/42">{option.description}</div>
              </div>
              {selected ? (
                <span className="flex size-6 items-center justify-center rounded-full bg-[#6366f1] text-white">
                  <Check className="size-3.5" />
                </span>
              ) : null}
            </div>
            {!option.implemented ? <div className="mt-2 text-[11px] text-white/35">Coming soon</div> : null}
          </button>
        )
      })}
    </div>
  )
}

function AccentPicker({ onChange, value }: { onChange: (value: AccentValue) => void; value: AccentValue }) {
  return (
    <div className="flex flex-wrap gap-3">
      {ACCENT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.label}
          onClick={() => onChange(option.value)}
          className={cn(
            'size-8 rounded-full border border-white/10 transition-transform duration-150 ease-out hover:scale-110',
            option.className,
            value === option.value && 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0d]',
          )}
        >
          <span className="sr-only">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

function SegmentedControl<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  value: T
}) {
  return (
    <div className="flex flex-wrap rounded-[18px] border border-white/10 bg-white/[0.03] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-8 flex-1 rounded-[14px] px-3 text-sm transition-all duration-150 ease-out',
            value === option.value ? 'bg-[#6366f1] text-white shadow-[0_0_30px_rgba(99,102,241,0.24)]' : 'text-white/52 hover:bg-white/[0.06] hover:text-white',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function NotificationToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean
  description?: string
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button type="button" className="min-w-0 text-left" onClick={() => onChange(!checked)}>
        <span className="block text-sm text-white/72">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-white/38">{description}</span> : null}
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-all duration-150 ease-out',
          checked ? 'border-[#6366f1]/36 bg-[#6366f1]' : 'border-white/10 bg-white/[0.06]',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white transition-transform duration-150 ease-out',
            checked ? 'translate-x-[22px]' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}

function SelectField<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  value: T
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="h-10 w-full rounded-[14px] border border-white/16 bg-[#0a0a0d] px-3 text-sm text-white/90 outline-none transition-colors focus:border-[#6366f1]/70 focus:ring-2 focus:ring-[#6366f1]/20"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function SecurityRow({
  action,
  icon: Icon,
  label,
  value,
}: {
  action: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/54">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="mt-1 text-sm text-white/42">{value}</div>
        </div>
      </div>
      {action}
    </div>
  )
}

function ApiKeyField({
  apiKey,
  onCopy,
  onRegenerate,
  onRevealChange,
  revealed,
  saving,
}: {
  apiKey: string
  onCopy: () => void
  onRegenerate: () => void
  onRevealChange: (revealed: boolean) => void
  revealed: boolean
  saving: boolean
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <KeyRound className="size-4 text-white/54" />
            API Key
          </div>
          <div className="mt-2 break-all rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white/62">
            {getMaskedApiKey(apiKey, revealed)}
          </div>
          <Link href="/pricing" className="mt-2 inline-flex text-xs text-[#c7d2fe] hover:text-white">
            Upgrade to Cinema for API access
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => onRevealChange(!revealed)}>
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {revealed ? 'Hide' : 'Reveal'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCopy}>
            <Copy className="size-4" />
            Copy
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={onRegenerate}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Regenerate
          </Button>
        </div>
      </div>
    </div>
  )
}

function TwoFactorDialog({
  mode,
  onClose,
  onPasswordChange,
  onSubmit,
  password,
  saving,
}: {
  mode: 'enable' | 'disable' | null
  onClose: () => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  password: string
  saving: boolean
}) {
  const enabling = mode === 'enable'

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[#0a0a0d]/95 text-white">
        <DialogHeader>
          <DialogTitle>{enabling ? 'Enable Two-Factor Authentication' : 'Disable Two-Factor Authentication'}</DialogTitle>
          <DialogDescription>
            {enabling ? 'Scan the placeholder code with your authenticator app.' : 'Confirm your password before disabling this protection.'}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          {enabling ? (
            <div className="mx-auto flex size-44 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.03]">
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 25 }).map((_, index) => (
                  <span key={index} className={cn('size-4 rounded-[4px]', index % 3 === 0 ? 'bg-white/80' : 'bg-white/12')} />
                ))}
              </div>
            </div>
          ) : (
            <Input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Confirm password"
              className="h-10 rounded-[14px] border-white/16 bg-white/[0.06] text-white/90"
            />
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={saving || (!enabling && password.trim().length === 0)} onClick={onSubmit}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {enabling ? 'I Scanned It' : 'Disable 2FA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DangerZone({
  checked,
  onCheckedChange,
  onDeactivateClick,
  onReveal,
  revealed,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onDeactivateClick: () => void
  onReveal: () => void
  revealed: boolean
}) {
  return (
    <section className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-5 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/10 text-rose-400">
          <ShieldAlert className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-rose-400">Danger Zone</h2>
          <p className="mt-1 text-sm text-rose-300/60">Irreversible account actions. Proceed with caution.</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onReveal}
            className="mt-4 justify-start border-rose-400/20 text-rose-400 hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
          >
            Deactivate Account
          </Button>

          <AnimatePresence initial={false}>
            {revealed ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-[18px] border border-rose-400/20 bg-rose-500/[0.03] p-4">
                  <label className="flex items-start gap-3 text-sm text-rose-300/80">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onCheckedChange(event.target.checked)}
                      className="mt-1"
                    />
                    I understand this will permanently delete all my projects, exports, and account data.
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={!checked}
                    onClick={onDeactivateClick}
                    className="mt-4 bg-rose-500 text-white hover:bg-rose-500/90"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function DeactivateModal({
  onClose,
  onDeactivate,
  open,
  projectCount,
}: {
  onClose: () => void
  onDeactivate: () => void
  open: boolean
  projectCount: number
}) {
  const [countdown, setCountdown] = React.useState(5)

  React.useEffect(() => {
    if (!open) {
      setCountdown(5)
      return
    }

    if (countdown === 0) return
    const timer = window.setTimeout(() => setCountdown((current) => Math.max(0, current - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, open])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="border-white/10 bg-[#0a0a0d]/95 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-rose-400">Are you absolutely sure?</DialogTitle>
          <DialogDescription className="text-rose-300/70">This is a permanent account action.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          <ul className="space-y-2 text-sm text-rose-300/80">
            <li>All {projectCount} projects and their versions will be deleted</li>
            <li>All AI-generated exports and renders will be lost</li>
            <li>Your subscription and billing history will be removed</li>
            <li>This action is irreversible</li>
          </ul>
        </div>
        <DialogFooter className="flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="ghost" className="text-white" onClick={onClose}>
            No, Keep My Account
          </Button>
          <Button
            type="button"
            disabled={countdown > 0}
            onClick={onDeactivate}
            className="border-rose-400/20 bg-rose-500 text-white hover:bg-rose-500/90"
          >
            Deactivate Account{countdown > 0 ? ` (${countdown})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatusPill({ accent, saving }: { accent: string; saving: boolean }) {
  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/50">
      <span className="size-2 rounded-full" style={{ background: accent }} />
      {saving ? 'Saving preferences' : 'Local preferences'}
    </div>
  )
}
