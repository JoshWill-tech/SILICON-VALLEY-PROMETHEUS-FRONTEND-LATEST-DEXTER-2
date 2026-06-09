'use client'

import { Menu, Settings, Share2 } from 'lucide-react'

import { BackButton } from '@/components/navigation/BackButton'

export function EditorTopBar({
  onToggleSidebar,
  onOpenSettings,
  sidebarOpen,
}: {
  onToggleSidebar: () => void
  onOpenSettings?: () => void
  sidebarOpen: boolean
}) {
  return (
    <header className="glass-panel flex h-14 shrink-0 items-center justify-between rounded-none border-x-0 border-t-0 border-b border-border-subtle px-4">
      <div className="flex min-w-0 items-center gap-3">
        <BackButton className="h-10 w-10" />
        <button
          type="button"
          onClick={onToggleSidebar}
          className="glass-button flex h-8 w-8 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="h-4 w-4 text-text-secondary" />
        </button>
        <span className="chrome-text font-display text-sm font-semibold">PROMETHEUS</span>
        <span className="hidden text-xs text-text-tertiary sm:inline">/editor</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="glass-button flex h-8 items-center gap-2 rounded-lg px-3 text-xs text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          aria-label="Share project"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="glass-button flex h-8 items-center gap-2 rounded-lg px-3 text-xs text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          aria-label="Open settings"
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </header>
  )
}
