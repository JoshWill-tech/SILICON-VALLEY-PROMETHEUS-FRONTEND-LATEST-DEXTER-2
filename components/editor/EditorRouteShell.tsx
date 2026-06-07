'use client'

import { useCallback, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { AwwwardsSidebar } from '@/components/sidebar/AwwwardsSidebar'

import { CommandZone } from './CommandZone'
import { EditorTopBar } from './EditorTopBar'
import { FocusModeToggle } from './FocusModeToggle'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { SettingsPanel } from './SettingsPanel'

export function EditorRouteShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), [])
  const toggleFocusMode = useCallback(() => setFocusMode((active) => !active), [])
  const closeOverlays = useCallback(() => setSettingsOpen(false), [])

  return (
    <div
      className={cn(
        'editor-root relative flex h-screen w-screen overflow-hidden bg-chrome-950 bg-chrome-radial text-text-primary',
        focusMode && 'prometheus-focus-mode'
      )}
      data-focus-mode={focusMode ? 'on' : 'off'}
    >
      <div className="pointer-events-none fixed inset-0 z-0 bg-chrome-radial" aria-hidden />
      <div id="ambient-orb-container" className="pointer-events-none fixed inset-0 z-0" aria-hidden />

      {!focusMode && (
        <aside
          className={cn(
            'relative z-10 h-full flex-shrink-0 transition-[width,transform,opacity] duration-300 ease-out',
            sidebarOpen ? 'translate-x-0 overflow-visible opacity-100' : 'w-0 -translate-x-full overflow-hidden opacity-0'
          )}
          aria-label="Editor navigation"
        >
          <AwwwardsSidebar />
        </aside>
      )}

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        {!focusMode && (
          <EditorTopBar
            onOpenSettings={() => setSettingsOpen(true)}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        )}
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        <CommandZone />
      </main>

      <FocusModeToggle active={focusMode} onToggle={toggleFocusMode} />
      <SettingsPanel
        focusMode={focusMode}
        onClose={() => setSettingsOpen(false)}
        onFocusModeChange={setFocusMode}
        open={settingsOpen}
      />
      <KeyboardShortcuts
        onCloseOverlays={closeOverlays}
        onToggleFocusMode={toggleFocusMode}
        onToggleSidebar={toggleSidebar}
      />
    </div>
  )
}
