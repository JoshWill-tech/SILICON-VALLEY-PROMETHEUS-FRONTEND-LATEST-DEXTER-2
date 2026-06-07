'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Accessibility, Gauge, Monitor, Palette, X } from 'lucide-react'

import { useDeviceTier } from '@/hooks/useDeviceTier'
import { cn } from '@/lib/utils'

type SettingsTab = 'appearance' | 'performance' | 'accessibility' | 'display'

interface SettingsPanelProps {
  focusMode: boolean
  onClose: () => void
  onFocusModeChange: (active: boolean) => void
  open: boolean
}

const tabs: Array<{ id: SettingsTab; label: string; icon: React.ElementType }> = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
  { id: 'display', label: 'Display', icon: Monitor },
]

const themes = ['Liquid Chrome', 'Midnight', 'Obsidian']

export function SettingsPanel({ focusMode, onClose, onFocusModeChange, open }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [highContrast, setHighContrast] = useState(false)
  const [screenReader, setScreenReader] = useState(false)
  const [denseTimeline, setDenseTimeline] = useState(true)
  const tier = useDeviceTier()

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches)

    mq.addEventListener('change', handleChange)

    return () => mq.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.prometheusReduceMotion = reduceMotion ? 'true' : 'false'
  }, [reduceMotion])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-settings-title"
            className="glass-panel flex h-[min(480px,calc(100vh-2rem))] w-[min(640px,calc(100vw-2rem))] overflow-hidden rounded-lg"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <aside className="w-44 shrink-0 border-r border-border-subtle p-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="editor-settings-title" className="text-sm font-semibold text-text-primary">
                  Settings
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-white/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                  aria-label="Close settings"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="space-y-2" aria-label="Settings sections">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const active = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan',
                        active
                          ? 'border-accent-cyan/20 bg-accent-cyan-glow text-accent-cyan'
                          : 'border-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </aside>

            <section className="min-w-0 flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="space-y-4"
                >
                  {activeTab === 'appearance' && <AppearanceTab />}
                  {activeTab === 'performance' && (
                    <PerformanceTab
                      focusMode={focusMode}
                      onFocusModeChange={onFocusModeChange}
                      reduceMotion={reduceMotion}
                      setReduceMotion={setReduceMotion}
                      tier={tier}
                    />
                  )}
                  {activeTab === 'accessibility' && (
                    <AccessibilityTab
                      highContrast={highContrast}
                      screenReader={screenReader}
                      setHighContrast={setHighContrast}
                      setScreenReader={setScreenReader}
                    />
                  )}
                  {activeTab === 'display' && (
                    <DisplayTab denseTimeline={denseTimeline} setDenseTimeline={setDenseTimeline} />
                  )}
                </motion.div>
              </AnimatePresence>
            </section>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AppearanceTab() {
  return (
    <>
      <PanelHeading title="Appearance" description="Choose the editor surface treatment." />
      <div className="grid grid-cols-3 gap-3">
        {themes.map((theme, index) => (
          <button
            key={theme}
            type="button"
            className={cn(
              'flex aspect-[4/3] min-h-24 flex-col justify-end rounded-lg border p-3 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan',
              index === 0
                ? 'border-accent-cyan/20 bg-accent-cyan-glow text-accent-cyan'
                : 'border-border-subtle bg-surface-elevated text-text-secondary hover:text-text-primary'
            )}
            aria-pressed={index === 0}
          >
            <span className="font-medium">{theme}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function PerformanceTab({
  focusMode,
  onFocusModeChange,
  reduceMotion,
  setReduceMotion,
  tier,
}: {
  focusMode: boolean
  onFocusModeChange: (active: boolean) => void
  reduceMotion: boolean
  setReduceMotion: (active: boolean) => void
  tier: string
}) {
  return (
    <>
      <PanelHeading title="Performance" description="Control motion and rendering cost." />
      <ToggleRow
        description="Hide surrounding chrome and keep the workspace centered."
        label="Focus Mode"
        on={focusMode}
        onToggle={() => onFocusModeChange(!focusMode)}
      />
      <ToggleRow
        description="Prefer static states over transitions and generated movement."
        label="Reduce Motion"
        on={reduceMotion}
        onToggle={() => setReduceMotion(!reduceMotion)}
      />
      <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-elevated p-3">
        <div>
          <div className="text-sm font-medium text-text-primary">Device Tier</div>
          <div className="text-xs text-text-tertiary">Detected runtime performance profile.</div>
        </div>
        <span className="rounded-full border border-accent-cyan/20 bg-accent-cyan-glow px-3 py-1 text-xs uppercase text-accent-cyan">
          {tier}
        </span>
      </div>
    </>
  )
}

function AccessibilityTab({
  highContrast,
  screenReader,
  setHighContrast,
  setScreenReader,
}: {
  highContrast: boolean
  screenReader: boolean
  setHighContrast: (active: boolean) => void
  setScreenReader: (active: boolean) => void
}) {
  return (
    <>
      <PanelHeading title="Accessibility" description="Tune contrast and assistive behavior." />
      <ToggleRow
        description="Increase edge definition on panels and controls."
        label="High Contrast"
        on={highContrast}
        onToggle={() => setHighContrast(!highContrast)}
      />
      <ToggleRow
        description="Expose additional announcements for generated editor states."
        label="Screen Reader"
        on={screenReader}
        onToggle={() => setScreenReader(!screenReader)}
      />
    </>
  )
}

function DisplayTab({
  denseTimeline,
  setDenseTimeline,
}: {
  denseTimeline: boolean
  setDenseTimeline: (active: boolean) => void
}) {
  return (
    <>
      <PanelHeading title="Display" description="Adjust density and timeline readability." />
      <ToggleRow
        description="Show more timeline context in the same vertical space."
        label="Dense Timeline"
        on={denseTimeline}
        onToggle={() => setDenseTimeline(!denseTimeline)}
      />
    </>
  )
}

function PanelHeading({ description, title }: { description: string; title: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-tertiary">{description}</p>
    </div>
  )
}

function ToggleRow({
  description,
  label,
  on,
  onToggle,
}: {
  description: string
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className="flex min-h-16 w-full items-center justify-between gap-4 rounded-lg border border-border-subtle bg-surface-elevated p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        <span className="mt-1 block text-xs text-text-tertiary">{description}</span>
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          on ? 'bg-accent-cyan' : 'bg-surface-floating'
        )}
        aria-hidden
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            on && 'translate-x-5'
          )}
        />
      </span>
    </button>
  )
}
