'use client'

import * as React from 'react'
import {
  Activity,
  ChevronDown,
  GitBranch,
  Loader2,
  MessageSquare,
  Music,
  Search,
  Sparkles,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useR2Music } from '@/app/editor/hooks/use-r2-music'
import type { EditorSidebarPanel } from '@/app/editor/hooks/use-sidebar'
import type { R2Track } from '@/lib/music/r2-sync'
import { cn } from '@/lib/utils'

type SidebarDrawerProps = {
  activePanel: EditorSidebarPanel | null
  isOpen: boolean
  onClose: () => void
  onTogglePanel: (panel: EditorSidebarPanel) => void
}

const PANELS: Array<{
  id: EditorSidebarPanel
  label: string
  icon: LucideIcon
}> = [
  { id: 'music', label: 'Music', icon: Music },
  { id: 'motion', label: 'Motion Brain', icon: Zap },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'versions', label: 'Versions', icon: GitBranch },
  { id: 'status', label: 'Status', icon: Activity },
]

export function SidebarDrawer({ activePanel, isOpen, onClose, onTogglePanel }: SidebarDrawerProps) {
  const router = useRouter()

  return (
    <aside
      className={cn(
        'sidebar-drawer flex flex-col border-l border-white/10 bg-[#08080d]/95 text-white shadow-[0_0_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl',
        isOpen && 'open',
      )}
      aria-label="Prometheus editor sidebar"
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={() => {
            if (isOpen && window.innerWidth < 1024) {
              onClose()
              return
            }

            router.back()
          }}
          className="grid size-9 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close sidebar"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <h2 className="text-sm font-semibold tracking-[0.24em] text-white/80">PROMETHEUS</h2>
        <div className="size-9" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-2">
          {PANELS.map((panel) => {
            const expanded = activePanel === panel.id
            const Icon = panel.icon

            return (
              <section key={panel.id} className="rounded-xl border border-white/10 bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => onTogglePanel(panel.id)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                  aria-expanded={expanded}
                >
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      expanded ? 'bg-accent-purple shadow-[0_0_16px_rgba(168,85,247,0.8)]' : 'bg-white/18',
                    )}
                    aria-hidden="true"
                  />
                  <Icon className="size-4 shrink-0 text-white/70" aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-sm font-medium text-white/86">{panel.label}</span>
                  <ChevronDown
                    className={cn('size-4 text-white/45 transition-transform', expanded && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>

                {expanded ? (
                  <div className="border-t border-white/10 px-3 pb-3 pt-3">
                    {panel.id === 'music' ? <MusicPanel /> : null}
                    {panel.id === 'motion' ? <MotionPanel /> : null}
                    {panel.id === 'chat' ? <ChatPanel /> : null}
                    {panel.id === 'versions' ? <VersionsPanel /> : null}
                    {panel.id === 'status' ? <StatusPanel /> : null}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      </div>

      <footer className="border-t border-white/10 px-4 py-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">Navigation Live</div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-accent-purple to-accent-cyan" />
        </div>
      </footer>
    </aside>
  )
}

function MusicPanel() {
  const { error, isLoading, tracks } = useR2Music()
  const [query, setQuery] = React.useState('')
  const [selectedTrackId, setSelectedTrackId] = React.useState<string | null>(null)
  const filteredTracks = React.useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return tracks
    return tracks.filter((track) =>
      [track.title, track.artist, track.genre].some((value) => value.toLowerCase().includes(normalized)),
    )
  }, [query, tracks])

  return (
    <div className="space-y-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tracks..."
          className="h-10 w-full rounded-lg border border-white/10 bg-black/35 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent-cyan/70"
        />
      </label>

      <div className="flex items-center justify-between gap-3 text-xs text-white/45">
        <span>{isLoading ? 'Syncing R2 library' : `${tracks.length} songs available`}</span>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-accent-purple/25 bg-accent-purple/10 px-2.5 py-1 font-medium text-accent-purple"
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI Auto-Match
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-accent-cyan" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</div>
      ) : filteredTracks.length === 0 ? (
        <div className="py-8 text-center text-sm text-white/40">No tracks found in R2 bucket</div>
      ) : (
        <div className="space-y-2">
          {filteredTracks.map((track) => (
            <TrackItem
              key={track.id}
              selected={selectedTrackId === track.id}
              track={track}
              onSelect={() => setSelectedTrackId(track.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TrackItem({ onSelect, selected, track }: { onSelect: () => void; selected: boolean; track: R2Track }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors',
        selected ? 'border-accent-cyan/60 bg-accent-cyan/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white/10 text-white/50">
        <Music className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white/86">{track.title}</span>
        <span className="block truncate text-xs text-white/40">
          {track.artist} / {track.genre} / {formatDuration(track.duration)}
        </span>
      </span>
    </button>
  )
}

function MotionPanel() {
  return (
    <div className="space-y-3 text-sm text-white/64">
      <Metric label="Scene intelligence" value="Hook lift detected" />
      <Metric label="Suggested move" value="Push-in at 0:02.4" />
      <Metric label="Animation engine" value="Beat-synced captions ready" />
    </div>
  )
}

function ChatPanel() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-white/60">
        Ask for a tighter hook, caption rewrite, or export variant.
      </div>
      <textarea
        rows={3}
        placeholder="Message Prometheus..."
        className="w-full resize-none rounded-lg border border-white/10 bg-black/35 p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent-cyan/70"
      />
    </div>
  )
}

function VersionsPanel() {
  return (
    <div className="space-y-2">
      {['Draft 03', 'Music pass', 'Source import'].map((label, index) => (
        <Metric key={label} label={label} value={index === 0 ? 'Current' : `${index + 1} checkpoints ago`} />
      ))}
    </div>
  )
}

function StatusPanel() {
  return (
    <div className="space-y-2">
      <Metric label="Duration" value="0:45" />
      <Metric label="Resolution" value="1080 x 1920" />
      <Metric label="File size" value="82 MB estimate" />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="mt-1 text-sm font-medium text-white/78">{value}</div>
    </div>
  )
}

function formatDuration(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return '0:00'
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
