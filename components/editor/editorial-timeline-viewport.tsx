'use client'

import * as React from 'react'
import {
  Eye,
  EyeOff,
  Film,
  Music,
  Plus,
  Sparkles,
  Type,
  Volume2,
  VolumeX,
} from 'lucide-react'

import { EditorialTimelineToolbar } from './editorial-timeline-toolbar'
import { EditorialTimelineTracks, type EditorialTimelineTracksProps } from './editorial-timeline-tracks'
import { cn } from '@/lib/utils'
import { useTimelineTools } from '@/hooks/use-timeline-tools'

export interface EditorialTimelineViewportProps extends EditorialTimelineTracksProps {
  splitPoints?: number[]
  onSplitPointsChange?: (points: number[]) => void
  playing: boolean
  onTogglePlayback?: () => void
  onZoomChange?: (zoom: number) => void
  showToolbar?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  onToggleLayout?: () => void
  onUndo?: () => void
  onRedo?: () => void
}

function shortTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const remaining = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

export function EditorialTimelineViewport({
  playing,
  onTogglePlayback,
  onZoomChange,
  showToolbar = true,
  isFullscreen = false,
  onToggleFullscreen,
  onToggleLayout,
  onUndo,
  onRedo,
  ...props
}: EditorialTimelineViewportProps) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const playheadDrag = React.useRef<number | null>(null)
  const [viewportWidth, setViewportWidth] = React.useState(800)
  const [activeTool, setActiveTool] = React.useState<'select' | 'razor'>('select')
  const [snapping, setSnapping] = React.useState(true)

  // Track lock and visibility states
  const [isVideoHidden, setIsVideoHidden] = React.useState(false)
  const [isVideoMuted, setIsVideoMuted] = React.useState(false)
  const [isCaptionsHidden, setIsCaptionsHidden] = React.useState(false)
  const [isTextHidden, setIsTextHidden] = React.useState(false)
  const [isMusicHidden, setIsMusicHidden] = React.useState(false)

  // Selected clip state & tools
  const tools = useTimelineTools({
    source: props.previewUrl,
    duration: props.effectiveDuration,
    title: props.sourceLabel,
    time: props.currentTime,
    splits: props.splitPoints,
    onSplits: props.onSplitPointsChange,
    cuts: props.cutRanges ?? [],
    cues: props.editorialCues ?? [],
    onCuts: props.onCutRangesChange,
    onCues: props.onEditorialCuesChange,
  })

  const contentWidth = Math.max(1, viewportWidth - 110) * Math.max(1, props.zoom)
  const time = Math.max(0, Math.min(props.effectiveDuration, props.currentTime))

  React.useEffect(() => {
    const element = scroller.current
    if (!element) return
    const observer = new ResizeObserver(() => setViewportWidth(element.clientWidth))
    observer.observe(element)
    setViewportWidth(element.clientWidth)
    return () => observer.disconnect()
  }, [])

  // Auto-scroll when playing
  React.useEffect(() => {
    const element = scroller.current
    if (!element || !playing || playheadDrag.current !== null) return
    const position = 110 + (time / Math.max(props.effectiveDuration, 0.01)) * (contentWidth - 12)
    if (position > element.scrollLeft + element.clientWidth - 32 || position < element.scrollLeft + 110) {
      element.scrollLeft = Math.max(0, position - 110 - (element.clientWidth - 110) * 0.2)
    }
  }, [time, contentWidth, props.effectiveDuration, playing])

  const handleSeekInternal = React.useCallback(
    (timeSec: number) => {
      let target = Math.max(0, Math.min(props.effectiveDuration, timeSec))
      if (snapping) {
        const rounded = Math.round(target)
        if (Math.abs(target - rounded) < 0.25) target = rounded
      }
      props.onSeek?.(target)
    },
    [props, snapping],
  )

  const seekPlayheadFromPointer = React.useCallback(
    (clientX: number) => {
      const tracks = scroller.current?.querySelector<HTMLElement>('[data-editorial-timeline-tracks]')
      const bounds = tracks?.getBoundingClientRect()
      if (!bounds?.width) return
      const fraction = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width))
      handleSeekInternal(fraction * props.effectiveDuration)
    },
    [handleSeekInternal, props.effectiveDuration],
  )

  // Keyboard shortcuts (Space = Play/Pause, S/C = Split, Delete/Backspace = Delete, Cmd+Z = Undo, etc.)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        onTogglePlayback?.()
      } else if (e.key === 's' || e.key === 'c' || e.key === 'S' || e.key === 'C') {
        e.preventDefault()
        tools.split()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (tools.canDelete) {
          e.preventDefault()
          tools.remove()
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleSeekInternal(time - (e.shiftKey ? 5 : 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleSeekInternal(time + (e.shiftKey ? 5 : 1))
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) {
          if (onRedo) onRedo()
          else tools.redo()
        } else {
          if (onUndo) onUndo()
          else tools.undo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSeekInternal, onRedo, onTogglePlayback, onUndo, time, tools])

  const handleAddTextPlacement = React.useCallback(() => {
    if (!props.onEditorialCuesChange) return
    const id = crypto.randomUUID()
    const newCue = {
      id,
      type: 'text' as const,
      title: 'New Text',
      text: 'New Text',
      start: time,
      end: Math.min(props.effectiveDuration, time + 3),
      origin: 'editor' as const,
    }
    props.onEditorialCuesChange([...(props.editorialCues ?? []), newCue])
    tools.select(id)
  }, [props, time, tools])

  const isVideoTrackActive = tools.selected?.startsWith('source-video') || tools.selected === null
  const isTextTrackActive = Boolean(tools.selected && props.editorialCues?.some((c) => c.id === tools.selected && c.type === 'text'))

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#090d14]">
      {/* 1. NLE Top Toolbar */}
      {showToolbar && (
        <EditorialTimelineToolbar
          currentTimeSec={props.currentTime}
          effectiveDuration={props.effectiveDuration}
          zoom={props.zoom}
          onZoomChange={(newZoom) => onZoomChange?.(newZoom)}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onSplitClip={() => tools.split()}
          onUndo={onUndo ?? tools.undo}
          onRedo={onRedo ?? tools.redo}
          canUndo={tools.canUndo}
          canRedo={tools.canRedo}
          onDeleteClip={tools.canDelete ? () => tools.remove() : undefined}
          onDuplicateClip={tools.canDuplicate ? () => tools.duplicate() : undefined}
          onAddMarker={props.onEditorialCuesChange ? tools.marker : undefined}
          onToggleSnapping={() => setSnapping((v) => !v)}
          snapping={snapping}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          onToggleLayout={onToggleLayout ?? onToggleFullscreen}
          playing={playing}
          onTogglePlayback={onTogglePlayback}
        />
      )}

      {/* 2. Track Workspace (Sticky Track Headers on Left + Scrubbable Tracks on Right) */}
      <div
        ref={scroller}
        data-editorial-timeline-viewport
        className="min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-color:rgba(255,255,255,.24)_transparent] [scrollbar-width:thin]"
      >
        <div
          className="grid min-h-full grid-cols-[110px_minmax(0,1fr)]"
          style={{ width: contentWidth + 110 }}
        >
          {/* Left Sticky Column: Track Headers with visibility & mute controls */}
          <div className="sticky left-0 z-20 flex flex-col border-r border-white/10 bg-[#0c1018] pt-[24px] text-[10px] text-white/70 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
            {/* Video Track Header */}
            <div
              className={cn(
                'flex h-[50px] items-center justify-between border-b border-white/[0.04] px-2.5 transition-colors hover:bg-white/[0.02]',
                isVideoTrackActive && 'bg-white/[0.03] border-l-2 border-l-[#9df65a]',
              )}
              style={{ marginTop: 6 }}
            >
              <div className="flex items-center gap-1.5 font-medium text-white/85">
                <Film className="size-3 text-white/50" />
                <span>Video</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsVideoMuted((v) => !v)}
                  aria-label={isVideoMuted ? 'Unmute video audio' : 'Mute video audio'}
                  title={isVideoMuted ? 'Unmute video audio' : 'Mute video audio'}
                  className={cn(
                    'grid size-5 place-items-center rounded hover:bg-white/10 transition-colors',
                    isVideoMuted ? 'text-amber-400' : 'text-white/60 hover:text-white',
                  )}
                >
                  {isVideoMuted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsVideoHidden((v) => !v)}
                  aria-label={isVideoHidden ? 'Show video track' : 'Hide video track'}
                  title={isVideoHidden ? 'Show video track' : 'Hide video track'}
                  className={cn(
                    'grid size-5 place-items-center rounded hover:bg-white/10 transition-colors',
                    isVideoHidden ? 'text-white/30' : 'text-white/60 hover:text-white',
                  )}
                >
                  {isVideoHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </div>
            </div>

            {/* Captions Track Header */}
            <div
              className="flex h-[32px] items-center justify-between border-b border-white/[0.04] px-2.5 transition-colors hover:bg-white/[0.02]"
              style={{ marginTop: 6 }}
            >
              <div className="flex items-center gap-1.5 font-medium text-white/85">
                <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] font-bold text-white/70">
                  CC
                </span>
                <span>Captions</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsCaptionsHidden((v) => !v)}
                  aria-label={isCaptionsHidden ? 'Show captions' : 'Hide captions'}
                  title={isCaptionsHidden ? 'Show captions' : 'Hide captions'}
                  className={cn(
                    'grid size-5 place-items-center rounded hover:bg-white/10 transition-colors',
                    isCaptionsHidden ? 'text-white/30' : 'text-white/60 hover:text-white',
                  )}
                >
                  {isCaptionsHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </div>
            </div>

            {/* Text Placement Track Header */}
            <div
              className={cn(
                'flex h-[30px] items-center justify-between border-b border-white/[0.04] px-2.5 transition-colors hover:bg-white/[0.02]',
                isTextTrackActive && 'bg-white/[0.03] border-l-2 border-l-[#9df65a]',
              )}
              style={{ marginTop: 6 }}
            >
              <div className="flex items-center gap-1.5 font-medium text-white/85">
                <Type className="size-3 text-[#9df65a]" />
                <span>Text</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleAddTextPlacement}
                  aria-label="Add text cue at playhead"
                  title="Add text cue at playhead"
                  className="grid size-5 place-items-center rounded hover:bg-white/10 text-white/60 hover:text-[#9df65a] transition-colors"
                >
                  <Plus className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsTextHidden((v) => !v)}
                  aria-label={isTextHidden ? 'Show text track' : 'Hide text track'}
                  title={isTextHidden ? 'Show text track' : 'Hide text track'}
                  className={cn(
                    'grid size-5 place-items-center rounded hover:bg-white/10 transition-colors',
                    isTextHidden ? 'text-white/30' : 'text-white/60 hover:text-white',
                  )}
                >
                  {isTextHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </div>
            </div>

            {props.editorialCues?.some((cue) => cue.type !== 'text') ? (
              <div
                className="flex h-[30px] items-center justify-between border-b border-white/[0.04] px-2.5 transition-colors hover:bg-white/[0.02]"
                style={{ marginTop: 6 }}
              >
                <div className="flex items-center gap-1.5 font-medium text-white/85">
                  <Sparkles className="size-3 text-sky-300" />
                  <span>Effects &amp; cues</span>
                </div>
              </div>
            ) : null}

            {/* Music Track Header */}
            <div
              className="flex h-[46px] items-center justify-between border-b border-white/[0.04] px-2.5 transition-colors hover:bg-white/[0.02]"
              style={{ marginTop: 6 }}
            >
              <div className="flex items-center gap-1.5 font-medium text-white/85">
                <Music className="size-3 text-[#a8c5b8]" />
                <span>Music</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMusicHidden((v) => !v)}
                  aria-label={isMusicHidden ? 'Show music track' : 'Hide music track'}
                  title={isMusicHidden ? 'Show music track' : 'Hide music track'}
                  className={cn(
                    'grid size-5 place-items-center rounded hover:bg-white/10 transition-colors',
                    isMusicHidden ? 'text-white/30' : 'text-white/60 hover:text-white',
                  )}
                >
                  {isMusicHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </div>
            </div>

            {/* + Add Track Button */}
            <div className="pt-2 px-2">
              <button
                type="button"
                onClick={props.onOpenMusicCatalog}
                aria-label="Add track"
                className="flex w-full items-center gap-1.5 rounded border border-white/10 bg-white/[0.02] px-2 py-1 text-[9px] font-medium text-white/50 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              >
                <Plus className="size-2.5" />
                <span>Add track</span>
              </button>
            </div>
          </div>

          {/* Right Column: Track Area & Scrubbable Playhead */}
          <div
            className="relative min-w-0 pb-2 pr-4 outline-none"
            style={{ width: contentWidth }}
            role="region"
            aria-label="Editorial tracks. Click to seek or use arrow keys."
          >
            <EditorialTimelineTracks
              {...props}
              zoom={props.zoom}
              selectedClipId={tools.selected}
              videoClips={tools.clips}
              onSelectClip={tools.select}
              onSplitClip={tools.split}
              onDeleteClip={tools.remove}
              onDuplicateClip={tools.duplicate}
              onTrimClip={tools.trimClip}
              isVideoHidden={isVideoHidden}
              isCaptionsHidden={isCaptionsHidden}
              isTextHidden={isTextHidden}
              isMusicHidden={isMusicHidden}
              activeTool={activeTool}
              snapping={snapping}
              onSeek={handleSeekInternal}
              onAddTextPlacement={handleAddTextPlacement}
            />

            {/* Scrubbable Playhead matching OpenCut design */}
            <div
              data-editorial-playhead
              role="slider"
              aria-label="Timeline playhead"
              aria-valuemin={0}
              aria-valuemax={props.effectiveDuration}
              aria-valuenow={time}
              tabIndex={0}
              data-editorial-playhead-hit-area
              onPointerDown={(event) => {
                if (event.button !== 0) return
                event.preventDefault()
                event.stopPropagation()
                playheadDrag.current = event.pointerId
                event.currentTarget.setPointerCapture(event.pointerId)
                seekPlayheadFromPointer(event.clientX)
              }}
              onPointerMove={(event) => {
                if (playheadDrag.current !== event.pointerId) return
                event.stopPropagation()
                seekPlayheadFromPointer(event.clientX)
              }}
              onPointerUp={(event) => {
                if (playheadDrag.current !== event.pointerId) return
                event.stopPropagation()
                playheadDrag.current = null
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId)
                }
              }}
              onPointerCancel={() => {
                playheadDrag.current = null
              }}
              className="absolute bottom-0 top-0 z-30 w-6 -translate-x-1/2 cursor-ew-resize touch-none outline-none focus-visible:bg-white/[0.04]"
              style={{
                left: `${(time / Math.max(props.effectiveDuration, 0.01)) * 100}%`,
              }}
            >
              {/* White flag pin marker with rounded top & time badge */}
              <div className="group absolute left-0 top-0 flex h-[24px] w-6 flex-col items-center pointer-events-auto">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-white shadow-md rotate-45" />
                <div className="-mt-1 h-1.5 w-1 bg-white" />
                {/* Time badge floating over needle */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 pointer-events-none rounded bg-black/90 px-1 py-0.2 text-[8px] font-mono text-white whitespace-nowrap border border-white/20 shadow">
                  {shortTime(time)}
                </div>
              </div>
              {/* Playhead vertical line through all tracks */}
              <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
