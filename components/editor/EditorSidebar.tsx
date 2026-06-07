'use client'

import { useState } from 'react'
import { BarChart3, ChevronRight, Clock, Folder, Plus, Zap } from 'lucide-react'

const navItems = [
  { id: 'projects', label: 'Projects', icon: Folder, count: 3 },
  { id: 'recent', label: 'Recent', icon: Clock, count: 0 },
  { id: 'motion', label: 'Motion Brain', icon: Zap, count: 0 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, count: 0 },
]

export function EditorSidebar() {
  const [active, setActive] = useState('projects')

  return (
    <div className="glass-panel flex h-full w-64 flex-col rounded-none border-y-0 border-l-0 border-r border-border-subtle">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle px-4">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Workspace</span>
        <button
          type="button"
          className="glass-button flex h-6 w-6 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          aria-label="Create project"
        >
          <Plus className="h-3.5 w-3.5 text-text-secondary" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Editor sections">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan ${
                isActive
                  ? 'border border-accent-cyan/20 bg-accent-cyan-glow text-accent-cyan'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.count > 0 && (
                  <span className="rounded-full bg-surface-floating px-2 py-0.5 text-xs text-text-tertiary">
                    {item.count}
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
              </div>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border-subtle p-4">
        <div className="glass-button rounded-lg p-3">
          <p className="text-xs text-text-tertiary">Storage</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-floating">
            <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-accent-cyan to-accent-cyan-dim" />
          </div>
          <p className="mt-1 text-xs text-text-secondary">60% used</p>
        </div>
      </div>
    </div>
  )
}
