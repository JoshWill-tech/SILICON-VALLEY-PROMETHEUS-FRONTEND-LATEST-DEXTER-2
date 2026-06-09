'use client'

import { usePathname } from 'next/navigation'
import {
  Activity,
  BarChart3,
  Clock3,
  GitBranch,
  Gauge,
  Loader2,
  MessageSquare,
  Music,
  Pause,
  Play,
  Search,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { useR2Music } from '@/app/editor/hooks/use-r2-music'
import { cn } from '@/lib/utils'
import { EditorNavDrawer, type EditorToolKey } from '@/app/components/editor/mobile/EditorNavDrawer'
import type { EditorSettingsPanelKey } from '@/app/components/editor/mobile/EditorSettingsSubmenu'
import { AwwwardsSidebar } from '@/components/sidebar/AwwwardsSidebar'
import { writeSelectedEditorMusicTrack } from '@/lib/editor-music-selection'
import { isStandaloneMobileEditorRoute } from '@/lib/editor-mobile-routes'
import type { R2Track } from '@/lib/music/r2-sync'

import { CommandZone } from './CommandZone'
import { EditorTopBar } from './EditorTopBar'
import { FocusModeToggle } from './FocusModeToggle'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { SettingsPanel } from './SettingsPanel'

export function EditorRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const projectId = useMemo(() => getEditorProjectIdFromPathname(pathname), [pathname])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<EditorSettingsPanelKey>('appearance')
  const [activeMobileTool, setActiveMobileTool] = useState<EditorToolKey>('motion')
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), [])
  const toggleFocusMode = useCallback(() => setFocusMode((active) => !active), [])
  const closeOverlays = useCallback(() => setSettingsOpen(false), [])
  const openSettingsPanel = useCallback((panel: EditorSettingsPanelKey) => {
    setSettingsInitialTab(panel)
    setSettingsOpen(true)
  }, [])

  if (pathname === '/editor' || isStandaloneMobileEditorRoute(pathname)) {
    return <>{children}</>
  }

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
            'relative z-10 hidden h-full flex-shrink-0 transition-[width,transform,opacity] duration-300 ease-out md:block',
            sidebarOpen ? 'translate-x-0 overflow-visible opacity-100' : 'w-0 -translate-x-full overflow-hidden opacity-0'
          )}
          aria-label="Editor navigation"
        >
          <AwwwardsSidebar />
        </aside>
      )}

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        {!focusMode ? (
          <EditorNavDrawer
            activeItem={activeMobileTool}
            onOpenSettingsPanel={openSettingsPanel}
            onSelectTool={setActiveMobileTool}
          >
            {({ hamburger }) => (
              <>
                <EditorTopBar
                  mobileNavControl={hamburger}
                  onToggleSidebar={toggleSidebar}
                  sidebarOpen={sidebarOpen}
                />
                <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                  {children}
                  <EditorMobileToolPanel activeTool={activeMobileTool} projectId={projectId} onSelectTool={setActiveMobileTool} />
                </div>
                <CommandZone />
              </>
            )}
          </EditorNavDrawer>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
            <CommandZone />
          </>
        )}
      </main>

      <FocusModeToggle active={focusMode} onToggle={toggleFocusMode} />
      <SettingsPanel
        key={settingsInitialTab}
        focusMode={focusMode}
        initialTab={settingsInitialTab}
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

const mobileToolMeta: Record<
  EditorToolKey,
  {
    description: string
    icon: LucideIcon
    label: string
  }
> = {
  motion: {
    label: 'Motion Brain',
    description: 'AI motion planning, animation beats, and suggested scene transitions.',
    icon: Zap,
  },
  music: {
    label: 'Music',
    description: 'Search the mobile music library and select a soundtrack for the edit.',
    icon: Music,
  },
  analytics: {
    label: 'Analytics',
    description: 'Mobile readout for retention, hook strength, and export readiness.',
    icon: BarChart3,
  },
  timeline: {
    label: 'Timeline',
    description: 'Beat markers, transcript segments, and animation timing checkpoints.',
    icon: Clock3,
  },
  chat: {
    label: 'Chat',
    description: 'Command the edit, caption pass, and posting workflow from the project context.',
    icon: MessageSquare,
  },
  versions: {
    label: 'Versions',
    description: 'Review export checkpoints and the latest downloadable version.',
    icon: GitBranch,
  },
  status: {
    label: 'Status',
    description: 'Project health, source metrics, and processing progress.',
    icon: Activity,
  },
}

function EditorMobileToolPanel({
  activeTool,
  onSelectTool,
  projectId,
}: {
  activeTool: EditorToolKey
  onSelectTool: (tool: EditorToolKey) => void
  projectId: string | null
}) {
  const meta = mobileToolMeta[activeTool]
  const Icon = meta.icon

  return (
    <aside className="glass-panel absolute inset-x-3 bottom-3 z-30 flex max-h-[min(68svh,640px)] flex-col overflow-hidden rounded-xl border border-prometheus-border-subtle shadow-[0_24px_80px_-44px_rgba(0,0,0,0.9)] md:hidden">
      <header className="border-b border-prometheus-border-subtle px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-prometheus-text-primary">{meta.label}</h2>
            <p className="truncate text-xs text-prometheus-text-tertiary">{meta.description}</p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {activeTool === 'music' ? <MobileMusicTool projectId={projectId} /> : null}
        {activeTool === 'motion' ? <MobileSummaryTool type="motion" onSelectTool={onSelectTool} /> : null}
        {activeTool === 'analytics' ? <MobileSummaryTool type="analytics" onSelectTool={onSelectTool} /> : null}
        {activeTool === 'timeline' ? <MobileSummaryTool type="timeline" onSelectTool={onSelectTool} /> : null}
        {activeTool === 'chat' ? <MobileSummaryTool type="chat" onSelectTool={onSelectTool} /> : null}
        {activeTool === 'versions' ? <MobileSummaryTool type="versions" onSelectTool={onSelectTool} /> : null}
        {activeTool === 'status' ? <MobileSummaryTool type="status" onSelectTool={onSelectTool} /> : null}
      </div>
    </aside>
  )
}

function MobileMusicTool({ projectId }: { projectId: string | null }) {
  const [query, setQuery] = useState('')
  const [selectedTrackId, setSelectedTrackId] = useState('')
  const [playingTrackId, setPlayingTrackId] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { error, isLoading, tracks } = useR2Music()

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const filteredTracks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return tracks

    return tracks.filter((track) =>
      [track.title, track.artist, track.genre].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [query, tracks])

  const togglePlay = useCallback(async (track: R2Track) => {
    if (audioRef.current && playingTrackId !== track.id) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (playingTrackId === track.id) {
      audioRef.current?.pause()
      setPlayingTrackId('')
      return
    }

    const audio = new Audio(track.url)
    audio.onended = () => setPlayingTrackId('')
    audioRef.current = audio

    try {
      await audio.play()
      setPlayingTrackId(track.id)
    } catch {
      setPlayingTrackId('')
    }
  }, [playingTrackId])

  const handleUseTrack = useCallback((track: R2Track) => {
    if (!projectId) return

    audioRef.current?.pause()
    setPlayingTrackId('')
    setSelectedTrackId(track.id)
    writeSelectedEditorMusicTrack(projectId, track.id)
  }, [projectId])

  return (
    <section className="space-y-4" aria-label="Music library">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-prometheus-text-tertiary" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tracks..."
          className="min-h-11 w-full rounded-xl border border-prometheus-border-subtle bg-black/24 py-3 pl-10 pr-4 text-sm text-prometheus-text-primary outline-none placeholder:text-prometheus-text-tertiary focus:border-prometheus-accent-purple focus:ring-1 focus:ring-prometheus-accent-purple/35"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-prometheus-text-secondary">
          {isLoading ? 'Syncing R2 library' : `${tracks.length} songs available`}
        </span>
        <button
          type="button"
          className="flex min-h-9 items-center gap-2 rounded-full border border-prometheus-accent-purple/20 bg-prometheus-accent-purple/10 px-3 text-sm font-medium text-prometheus-accent-purple transition-colors hover:bg-prometheus-accent-purple/15"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          AI Auto-Match
        </button>
      </div>

      <div className="max-h-[calc(68svh-12rem)] space-y-2 overflow-y-auto overscroll-contain pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-7 animate-spin text-prometheus-accent-cyan" aria-hidden="true" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>
        ) : filteredTracks.length === 0 ? (
          <div className="rounded-xl border border-prometheus-border-subtle bg-white/[0.025] p-4 text-sm text-prometheus-text-secondary">
            No tracks match that search.
          </div>
        ) : (
          filteredTracks.map((track) => (
            <MobileTrackButton
              key={track.id}
              playing={playingTrackId === track.id}
              selected={selectedTrackId === track.id}
              track={track}
              onPlay={() => togglePlay(track)}
              onSelect={() => setSelectedTrackId(track.id)}
              onUse={() => handleUseTrack(track)}
            />
          ))
        )}
      </div>
    </section>
  )
}

function MobileTrackButton({
  onPlay,
  onSelect,
  onUse,
  playing,
  selected,
  track,
}: {
  onPlay: () => void
  onSelect: () => void
  onUse: () => void
  playing: boolean
  selected: boolean
  track: R2Track
}) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div
      className={cn(
        'flex min-h-[4.75rem] w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150',
        selected
          ? 'border-prometheus-accent-purple/60 bg-prometheus-accent-purple/10 shadow-[0_0_24px_rgba(124,58,237,0.18)]'
          : 'border-prometheus-border-subtle bg-white/[0.025] hover:border-white/14 hover:bg-white/[0.04]',
      )}
    >
      <button
        type="button"
        onClick={onPlay}
        className="group relative size-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-prometheus-accent-purple/35 via-white/[0.05] to-prometheus-accent-cyan/20"
        aria-label={playing ? `Pause ${track.title}` : `Preview ${track.title}`}
      >
        {track.coverUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.coverUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white/78">
            {track.title
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/42 opacity-100 transition-opacity group-hover:bg-black/52">
          {playing ? <Pause className="size-5 text-white" aria-hidden="true" /> : <Play className="ml-0.5 size-5 text-white" aria-hidden="true" />}
        </span>
      </button>

      <button type="button" aria-pressed={selected} onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-prometheus-text-primary">{track.title}</span>
        <span className="block truncate text-xs text-prometheus-text-secondary">
          {track.artist} / {track.genre}
        </span>
      </button>
      <span className="text-xs tabular-nums text-prometheus-text-tertiary">{formatDuration(track.duration)}</span>
      {selected ? (
        <button
          type="button"
          onClick={onUse}
          className="shrink-0 rounded-lg border border-prometheus-accent-cyan/20 bg-prometheus-accent-cyan/12 px-3 py-1.5 text-xs font-medium text-prometheus-accent-cyan transition-colors hover:bg-prometheus-accent-cyan/20"
        >
          Use Track
        </button>
      ) : null}
    </div>
  )
}

function MobileSummaryTool({
  onSelectTool,
  type,
}: {
  onSelectTool: (tool: EditorToolKey) => void
  type: Exclude<EditorToolKey, 'music'>
}) {
  const rows: Record<Exclude<EditorToolKey, 'music'>, Array<{ label: string; value: string }>> = {
    motion: [
      { label: 'Scene intelligence', value: '7 beats mapped' },
      { label: 'Suggested move', value: 'Push-in reveal' },
      { label: 'Animation engine', value: 'GSAP ready' },
    ],
    analytics: [
      { label: 'Hook strength', value: '92%' },
      { label: 'Retention forecast', value: '+18%' },
      { label: 'Export health', value: 'Ready' },
    ],
    timeline: [
      { label: 'Current duration', value: '00:18' },
      { label: 'Beat markers', value: '3 active' },
      { label: 'Transcript segments', value: '5 synced' },
    ],
    chat: [
      { label: 'Prompt lane', value: 'Project-aware' },
      { label: 'Composer', value: 'Ready' },
      { label: 'Posting flow', value: 'Available in editor tabs' },
    ],
    versions: [
      { label: 'Latest export', value: 'Tracked in project' },
      { label: 'Checkpoints', value: 'Local history ready' },
      { label: 'Download', value: 'Use Export tab' },
    ],
    status: [
      { label: 'Project sync', value: 'Live' },
      { label: 'Source metrics', value: 'Loaded from project' },
      { label: 'Processing', value: 'Status tab active' },
    ],
  }

  return (
    <section className="space-y-3">
      {rows[type].map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-xl border border-prometheus-border-subtle bg-white/[0.025] px-3 py-3">
          <span className="text-sm text-prometheus-text-secondary">{row.label}</span>
          <span className="text-sm font-medium text-prometheus-text-primary">{row.value}</span>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onSelectTool('music')}
        className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-prometheus-accent-purple/25 bg-prometheus-accent-purple/10 px-4 text-sm font-medium text-prometheus-accent-purple transition-colors hover:bg-prometheus-accent-purple/15"
      >
        <Gauge className="size-4" aria-hidden="true" />
        Match music to this edit
      </button>
    </section>
  )
}

function formatDuration(durationSec: number) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return '0:00'
  const minutes = Math.floor(durationSec / 60)
  const seconds = Math.floor(durationSec % 60)

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getEditorProjectIdFromPathname(pathname: string | null) {
  if (!pathname) return null

  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'editor' || !segments[1]) return null
  return segments[1]
}
