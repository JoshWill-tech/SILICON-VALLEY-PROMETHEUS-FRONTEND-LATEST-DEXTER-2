'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'

import { useEditorSidebar } from '@/app/editor/hooks/use-sidebar'

import { BottomToolbar, type EditorTool } from './bottom-toolbar'
import { SidebarDrawer } from './sidebar-drawer'
import { Timeline } from './timeline'
import { ToastContainer } from './toast-container'
import { MobileVideoPlayer } from './mobile-video-player'
import { MiniPlayer } from './mini-player'

const CLIPS = [
  { id: 'hook', duration: 8, thumbnail: '/style-previews/reels-heat-1.webp' },
  { id: 'proof', duration: 14, thumbnail: '/style-previews/podcast-1.jpg' },
  { id: 'payoff', duration: 10, thumbnail: '/style-previews/dark-cinematic-1.jpg' },
  { id: 'cta', duration: 13, thumbnail: '/style-previews/docs-story-1.jpg' },
]

const WAVEFORM = [
  0.34, 0.62, 0.42, 0.78, 0.56, 0.88, 0.48, 0.66, 0.52, 0.94, 0.6, 0.38,
  0.72, 0.5, 0.82, 0.45, 0.7, 0.58, 0.92, 0.4, 0.64, 0.74, 0.54, 0.86,
]

const DURATION = CLIPS.reduce((total, clip) => total + clip.duration, 0)
const DEMO_VIDEO_URL = '/upload-effects/scrolling-effect.mp4'

export function EditorStage() {
  const sidebar = useEditorSidebar('music')
  const [activeTool, setActiveTool] = React.useState<EditorTool>('overlay')
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)

  React.useEffect(() => {
    if (!isPlaying) return

    const interval = window.setInterval(() => {
      setCurrentTime((value) => (value >= DURATION ? 0 : Math.min(DURATION, value + 0.25)))
    }, 250)

    return () => window.clearInterval(interval)
  }, [isPlaying])

  return (
    <div className="youtube-create-editor relative h-screen w-screen overflow-hidden text-white">
      <div
        className={sidebar.isOpen ? 'editor-sidebar-scrim open lg:hidden' : 'editor-sidebar-scrim lg:hidden'}
        onClick={sidebar.close}
        aria-hidden="true"
      />

      <main className="editor-stage flex h-full min-w-0 flex-col overflow-hidden pb-16">
        <div className="flex h-12 items-center justify-between border-b border-white/10 px-3 lg:hidden">
          <button
            type="button"
            onClick={sidebar.toggleOpen}
            className="grid size-10 place-items-center rounded-full text-white/80 hover:bg-white/10"
            aria-label="Open editor sidebar"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Prometheus</div>
          <div className="size-10" />
        </div>

        <MobileVideoPlayer src={DEMO_VIDEO_URL} poster="/style-previews/reels-heat-1.webp" />
        <Timeline
          audioWaveform={WAVEFORM}
          clips={CLIPS}
          currentTime={currentTime}
          duration={DURATION}
          onSeek={(time) => setCurrentTime(Math.max(0, Math.min(DURATION, time)))}
        />
      </main>

      <BottomToolbar activeTool={activeTool} onToolSelect={setActiveTool} />
      <SidebarDrawer
        activePanel={sidebar.activePanel}
        isOpen={sidebar.isOpen}
        onClose={sidebar.close}
        onTogglePanel={sidebar.togglePanel}
      />
      <MiniPlayer />
      <ToastContainer />
    </div>
  )
}
