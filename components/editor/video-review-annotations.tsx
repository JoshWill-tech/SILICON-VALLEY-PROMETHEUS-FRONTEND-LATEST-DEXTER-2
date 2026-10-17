'use client'

import * as React from 'react'
import { get, set } from 'idb-keyval'
import { cn } from '@/lib/utils'
import { ArrowDownToLine, Check, ChevronDown, ChevronUp, Circle, CornerDownLeft, FileJson, Grip, LoaderCircle, MessageSquare, Mic, Pencil, Plus, Redo2, Square, Trash2, Type, Undo2, X } from 'lucide-react'
import { useReviewDictation } from '@/hooks/use-review-dictation'
import { appendReviewNote, canStoreReviewEntries, captureReviewFrame, clampReviewPoint, createAnnotationManifest, createReviewZip, downloadReviewFile, estimateReviewStorageBytes, formatReviewTime, MAX_REVIEW_STORAGE_BYTES, normalizeReviewPillPosition, renderReviewScreenshot, reviewImageBytes, type ReviewEntry, type ReviewMark, type ReviewProject } from '@/lib/editor/video-review-annotations'

type ReviewContextValue = {
  ready: boolean
  capture: (video: HTMLVideoElement | null, source: ReviewEntry['source'], renderId: string | null) => void
  saveNote: (frame: ReviewEntry, text: string) => Promise<void>
  entries: ReviewEntry[]
  draft: ReviewEntry | null
  open: (entry: ReviewEntry) => void
  remove: (id: string) => void
  exportReview: (format: 'json' | 'zip') => void
  error: string | null
  notice: string | null
}

const ReviewContext = React.createContext<ReviewContextValue | null>(null)
// A newly opened comparison waits for the previous instance's final local save.
const reviewWrites = new Map<string, Promise<void>>()
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 text-xs text-white/80 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4fb60] disabled:cursor-not-allowed disabled:opacity-35'

function useReview() {
  const review = React.useContext(ReviewContext)
  if (!review) throw new Error('Video review controls require VideoReviewProvider.')
  return review
}

export function VideoReviewProvider({ children, ...project }: ReviewProject & { children: React.ReactNode }) {
  const [entries, setEntries] = React.useState<ReviewEntry[]>([])
  const entriesRef = React.useRef(entries)
  const updateEntries = React.useCallback((update: React.SetStateAction<ReviewEntry[]>) => {
    const next = typeof update === 'function' ? update(entriesRef.current) : update
    entriesRef.current = next
    setEntries(next)
  }, [])
  const [draft, setDraft] = React.useState<ReviewEntry | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [ready, setReady] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const key = `prometheus.video-review.v1:${project.projectId}:${project.sourceAssetId ?? 'none'}`
  const pendingSnapshot = React.useRef<{ key: string; entries: ReviewEntry[]; draft: ReviewEntry | null } | null>(null)
  const flushDraft = React.useCallback(() => {
    const snapshot = pendingSnapshot.current
    pendingSnapshot.current = null
    if (!snapshot) return
    const write = (reviewWrites.get(snapshot.key) ?? Promise.resolve()).catch(() => {}).then(() => set(snapshot.key, { entries: snapshot.entries, draft: snapshot.draft })).catch(() => {
      setError('Could not save this review on this device. Download it before closing the page.')
    })
    reviewWrites.set(snapshot.key, write)
    void write.finally(() => { if (reviewWrites.get(snapshot.key) === write) reviewWrites.delete(snapshot.key) })
  }, [])

  React.useEffect(() => {
    let cancelled = false
    void (reviewWrites.get(key) ?? Promise.resolve()).then(() => get<{ entries: ReviewEntry[]; draft: ReviewEntry | null }>(key)).then(saved => {
      if (cancelled) return
      if (saved && Array.isArray(saved.entries)) {
        entriesRef.current = saved.entries
        setEntries(saved.entries)
        setDraft(saved.draft ?? null)
      }
    }).catch(() => {
      if (!cancelled) setError('Local recovery is unavailable. Download your review before closing this page.')
    }).finally(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [key])

  // Coalesce typing updates and serialize writes so an older draft cannot overwrite a save.
  React.useEffect(() => {
    if (!ready) return
    pendingSnapshot.current = { key, entries, draft }
    const timer = window.setTimeout(flushDraft, 200)
    return () => window.clearTimeout(timer)
  }, [key, entries, draft, ready, flushDraft])

  React.useEffect(() => {
    const flushWhenHidden = () => { if (document.visibilityState === 'hidden') flushDraft() }
    document.addEventListener('visibilitychange', flushWhenHidden)
    window.addEventListener('pagehide', flushDraft)
    return () => {
      document.removeEventListener('visibilitychange', flushWhenHidden)
      window.removeEventListener('pagehide', flushDraft)
      flushDraft()
    }
  }, [flushDraft])

  const capture: ReviewContextValue['capture'] = (video, source, renderId) => {
    setError(null)
    setNotice(null)
    if (draft) {
      setEditing(true)
      setNotice('Finish or discard your current frame before capturing another.')
      return
    }
    try {
      const snapshot = captureReviewFrame(video, source, renderId)
      const existing = entries.find(entry => entry.source === source && entry.renderId === renderId && Math.round(entry.timeSec * 1000) === Math.round(snapshot.timeSec * 1000))
      const nextDraft = existing ?? snapshot
      if (!canStoreReviewEntries(entries, MAX_REVIEW_STORAGE_BYTES, nextDraft)) {
        setError('This project reached its 50 MiB local screenshot limit. Download the review and remove older frames before adding another.')
        return
      }
      setDraft(nextDraft)
      setEditing(true)
    } catch (cause) {
      setError(cause instanceof DOMException && cause.name === 'SecurityError'
        ? 'This video host blocks frame capture. Use a video served with cross-origin image access enabled.'
        : cause instanceof Error ? cause.message : 'Could not capture this video frame. Try again.')
    }
  }

  const saveNote: ReviewContextValue['saveNote'] = async (frame, text) => {
    if (!text.trim()) return
    const currentEntries = entriesRef.current
    const entry = appendReviewNote(currentEntries, frame, text, crypto.randomUUID())
    entry.annotatedImage = await renderReviewScreenshot(entry)
    const nextEntries = [...entriesRef.current.filter(item => item.id !== entry.id), entry]
    if (!canStoreReviewEntries(nextEntries)) {
      const limitMiB = Math.round(MAX_REVIEW_STORAGE_BYTES / (1024 * 1024))
      throw new Error(`This project's review screenshots reached ${limitMiB} MiB on this device. Download the review and remove older frames before saving another note.`)
    }
    updateEntries(nextEntries)
    setError(null)
  }

  const exportReview = (format: 'json' | 'zip') => {
    try {
      const name = `${project.projectTitle.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'video'}-review`
      const manifest = createAnnotationManifest(project, entries)
      if (format === 'json') {
        downloadReviewFile(new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }), `${name}.json`)
        return
      }
      const encoder = new TextEncoder()
      const files: { name: string; data: Uint8Array }[] = []
      const transcript = [`# ${project.projectTitle} — video review`, '', `Project: ${project.projectId}`, '']
      const bundledEntries = manifest.entries.map((entry, index) => {
        const stem = `frames/${String(index + 1).padStart(3, '0')}-${entry.source}-${entry.timestamp.replaceAll(':', '-')}`
        files.push({ name: `${stem}-original.png`, data: reviewImageBytes(entry.image) }, { name: `${stem}-annotated.png`, data: reviewImageBytes(entry.annotatedImage) })
        transcript.push(`## ${index + 1}. ${entry.source === 'original' ? 'Original' : 'Rendered MP4'} · ${entry.timestamp}`, entry.renderId ? `Render: ${entry.renderId}` : '', `Captured: ${entry.createdAt}`, '', ...entry.marks.filter(mark => mark.type === 'text').map(mark => mark.text), '', `Drawing marks: ${entry.marks.filter(mark => mark.type !== 'text').length}`, `Screenshot: ${stem}-annotated.png`, '')
        return { ...entry, image: `${stem}-original.png`, annotatedImage: `${stem}-annotated.png` }
      })
      files.unshift({ name: 'annotations.json', data: encoder.encode(JSON.stringify({ ...manifest, entries: bundledEntries }, null, 2)) }, { name: 'transcript.md', data: encoder.encode(transcript.join('\n')) })
      downloadReviewFile(createReviewZip(files), `${name}.zip`)
    } catch {
      setError('Could not prepare the review download. Your saved entries are still here; please try again.')
    }
  }

  return <ReviewContext.Provider value={{ ready, capture, saveNote, entries, draft, error, notice, exportReview,
    open: entry => {
      if (draft && draft.id !== entry.id) { setNotice('Finish or discard your current frame before opening another.'); setEditing(true); return }
      if (!canStoreReviewEntries(entries, MAX_REVIEW_STORAGE_BYTES, entry)) {
        setError('This project reached its 50 MiB local screenshot limit. Download the review and remove older frames before editing another.')
        return
      }
      setDraft(entry); setEditing(true)
    },
    remove: id => { updateEntries(current => current.filter(entry => entry.id !== id)); if (draft?.id === id) setDraft(null) },
  }}>
    {children}
    {editing && draft ? <ReviewFrameEditor key={draft.id} entry={draft} onChange={setDraft}
      onClose={() => setEditing(false)} onDiscard={() => { setDraft(null); setEditing(false); setNotice(null) }}
      onSave={entry => {
        const nextEntries = [...entriesRef.current.filter(item => item.id !== entry.id), entry]
        if (!canStoreReviewEntries(nextEntries)) {
          const limitMiB = Math.round(MAX_REVIEW_STORAGE_BYTES / (1024 * 1024))
          setError(`This project's review screenshots reached ${limitMiB} MiB on this device. Download the review and remove older frames before saving.`)
          return false
        }
        updateEntries(nextEntries)
        setDraft(null); setEditing(false); setNotice('Frame saved. Add another moment or download your review.'); setError(null)
        return true
      }} /> : null}
  </ReviewContext.Provider>
}

// Inline placement keeps correction inputs outside the picture and native player
// controls. Floating remains the default for existing comparison consumers.
export function VideoAnnotateButton({ videoRef, source, renderId = null, placement = 'floating' }: {
  videoRef: React.RefObject<HTMLVideoElement | null>; source: ReviewEntry['source']; renderId?: string | null; placement?: 'floating' | 'below'
}) {
  const review = useReview()
  const [text, setText] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [status, setStatus] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const frame = React.useRef<ReviewEntry | null>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const savingNow = React.useRef(false)
  const saveAfterVoice = React.useRef(false)
  const pillRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef<{ pointerId: number; pointerX: number; pointerY: number; centerX: number; centerY: number } | null>(null)
  const [collapsed, setCollapsed] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [pillPosition, setPillPosition] = React.useState({ x: 0.5, y: 0.84 })
  const pillPositionRef = React.useRef(pillPosition)
  const updatePillPosition = React.useCallback((next: { x: number; y: number }) => {
    const current = pillPositionRef.current
    if (Math.abs(current.x - next.x) < 0.0001 && Math.abs(current.y - next.y) < 0.0001) return
    pillPositionRef.current = next
    setPillPosition(next)
  }, [])
  React.useEffect(() => {
    if (placement === 'below') return
    const pill = pillRef.current
    const host = pill?.parentElement
    if (!pill || !host) return
    const clampToHost = () => {
      const hostRect = host.getBoundingClientRect()
      const pillRect = pill.getBoundingClientRect()
      const current = pillPositionRef.current
      updatePillPosition(normalizeReviewPillPosition(current.x * hostRect.width, current.y * hostRect.height, hostRect.width, hostRect.height, pillRect.width, pillRect.height))
    }
    clampToHost()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(clampToHost)
    observer.observe(host)
    observer.observe(pill)
    return () => observer.disconnect()
  }, [collapsed, placement, updatePillPosition])
  const startPillDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const pill = pillRef.current
    const host = pill?.parentElement
    if (!pill || !host) return
    const hostRect = host.getBoundingClientRect()
    const pillRect = pill.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      centerX: pillRect.left - hostRect.left + pillRect.width / 2,
      centerY: pillRect.top - hostRect.top + pillRect.height / 2,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    event.preventDefault()
  }
  const movePillDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    const pill = pillRef.current
    const host = pill?.parentElement
    if (!drag || drag.pointerId !== event.pointerId || !pill || !host) return
    const hostRect = host.getBoundingClientRect()
    const pillRect = pill.getBoundingClientRect()
    updatePillPosition(normalizeReviewPillPosition(
      drag.centerX + event.clientX - drag.pointerX,
      drag.centerY + event.clientY - drag.pointerY,
      hostRect.width,
      hostRect.height,
      pillRect.width,
      pillRect.height,
    ))
  }
  const stopPillDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const nudgePill = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const directions: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
    }
    const direction = directions[event.key]
    const pill = pillRef.current
    const host = pill?.parentElement
    if (!direction || !pill || !host) return
    event.preventDefault()
    const hostRect = host.getBoundingClientRect()
    const pillRect = pill.getBoundingClientRect()
    const step = event.shiftKey ? 0.05 : 0.01
    updatePillPosition(normalizeReviewPillPosition(
      (pillPositionRef.current.x + direction.x * step) * hostRect.width,
      (pillPositionRef.current.y + direction.y * step) * hostRect.height,
      hostRect.width,
      hostRect.height,
      pillRect.width,
      pillRect.height,
    ))
  }
  const capture = () => {
    if (!frame.current) frame.current = captureReviewFrame(videoRef.current, source, renderId)
    return frame.current
  }
  const save = async (value: string) => {
    if (!value.trim() || savingNow.current) return
    savingNow.current = true
    setSaving(true)
    setError(null)
    try {
      const snapshot = capture()
      await review.saveNote(snapshot, value)
      setText('')
      frame.current = null
      setStatus(`Saved · ${formatReviewTime(snapshot.timeSec)}`)
    } catch (cause) {
      setError(cause instanceof DOMException && cause.name === 'SecurityError' ? 'This video host blocks screenshots. Your note is still here.' : cause instanceof Error ? cause.message : 'Could not save this note. Try again.')
    } finally {
      savingNow.current = false
      setSaving(false)
      input.current?.focus()
    }
  }
  const voice = useReviewDictation(speech => {
    const value = [text.trim(), speech].filter(Boolean).join(' ').slice(0, 2000)
    setText(value)
    input.current?.focus()
    if (saveAfterVoice.current) { saveAfterVoice.current = false; void save(value) }
    else setStatus('Press Enter to save')
  })
  const busy = saving || voice.state === 'requesting' || voice.state === 'transcribing'
  const label = source === 'original' ? 'Original' : 'Rendered'
  const iconButton = cn('grid size-9 shrink-0 place-items-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#b4fb60] disabled:opacity-35', placement === 'below' && 'size-11')
  return <div ref={pillRef} data-review-placement={placement} className={placement === 'below' ? 'relative flex w-full flex-col items-center gap-1.5 border-t border-white/10 p-2' : `pointer-events-none absolute z-10 flex flex-col items-center gap-1.5 ${collapsed ? 'w-auto max-w-[calc(100%-1rem)]' : 'w-[calc(100%-1.5rem)] max-w-sm'}`} style={placement === 'below' ? undefined : { left: `${pillPosition.x * 100}%`, top: `${pillPosition.y * 100}%`, transform: 'translate(-50%, -50%)' }}>
    {collapsed ? <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-blue-300/45 bg-blue-600/95 p-1 text-white shadow-lg shadow-blue-950/35 backdrop-blur-sm">
      <button type="button" aria-label={`Move ${label} frame annotation`} title="Drag to move · Use arrow keys to nudge" className={`grid size-8 touch-none cursor-grab place-items-center rounded-full text-white/75 hover:bg-white/15 active:cursor-grabbing ${dragging ? 'cursor-grabbing' : ''}`} onPointerDown={startPillDrag} onPointerMove={movePillDrag} onPointerUp={stopPillDrag} onPointerCancel={stopPillDrag} onKeyDown={nudgePill}><Grip className="size-4" /></button>
      <button type="button" aria-label={`Expand ${label} frame annotation`} title="Expand frame note" className="grid size-8 place-items-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white" onClick={() => setCollapsed(false)}><ChevronUp className="size-4" /></button>
    </div> : <form aria-label={`${label} frame annotation`} className={cn('pointer-events-auto flex w-full items-center gap-0.5 rounded-full border border-white/15 bg-[#101113]/95 p-1 pl-1.5 shadow-xl backdrop-blur-sm', placement === 'below' && 'rounded-xl shadow-none [&>input]:min-h-11 [&>input]:text-base')} onSubmit={event => {
      event.preventDefault()
      if (voice.state === 'recording') { saveAfterVoice.current = true; voice.stop(); return }
      if (voice.state === 'transcribing') { saveAfterVoice.current = true; return }
      if (!busy && review.ready) void save(text)
    }}>
      <button type="button" aria-label={`Move ${label} frame annotation`} title="Drag to move · Use arrow keys to nudge" className={`grid size-8 shrink-0 touch-none cursor-grab place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white active:cursor-grabbing ${dragging ? 'cursor-grabbing' : ''}`} onPointerDown={startPillDrag} onPointerMove={movePillDrag} onPointerUp={stopPillDrag} onPointerCancel={stopPillDrag} onKeyDown={nudgePill}><Grip className="size-3.5" /></button>
      <input ref={input} type="text" aria-label={`${label} frame note`} value={text} maxLength={2000} disabled={!review.ready} readOnly={saving || voice.state !== 'idle'} placeholder={voice.state === 'recording' ? 'Listening… Enter to save' : voice.state === 'transcribing' ? 'Transcribing…' : 'Add a frame note…'} className="min-w-0 flex-1 bg-transparent py-1.5 text-xs text-white outline-none placeholder:text-white/45" onFocus={() => videoRef.current?.pause()} onChange={event => {
        setText(event.target.value); setStatus(null); setError(null); voice.clearError()
        if (!event.target.value) { frame.current = null; return }
        try { capture() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not capture this frame.') }
      }} onKeyDown={event => { event.stopPropagation(); if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault() }} />
      <button type="button" disabled={!review.ready || busy} aria-label={voice.state === 'recording' ? `Stop ${source} dictation` : `Dictate ${source} frame note`} title={voice.state === 'recording' ? 'Stop dictation' : 'Dictate a note'} className={cn(iconButton, voice.state === 'recording' && 'bg-rose-400/15 text-rose-300')} onClick={() => {
        if (voice.state === 'recording') { voice.stop(); return }
        setError(null); setStatus(null); saveAfterVoice.current = false
        try { capture(); void voice.start() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not capture this frame.') }
      }}>{voice.state === 'requesting' || voice.state === 'transcribing' ? <LoaderCircle className="size-3.5 animate-spin" /> : voice.state === 'recording' ? <Square className="size-3 fill-current" /> : <Mic className="size-3.5" />}</button>
      <button type="button" disabled={!review.ready || busy || voice.state !== 'idle'} aria-label={`Draw on ${source} frame`} title="Draw on this frame" className={iconButton} onClick={() => review.capture(videoRef.current, source, renderId)}><Pencil className="size-3.5" /></button>
      <button type="submit" disabled={!review.ready || saving || (voice.state === 'idle' && !text.trim())} aria-label={`Save ${source} frame note`} title="Save note · Enter" className={cn(iconButton, 'text-[#c9ff88]')}>{saving ? <LoaderCircle className="size-3.5 animate-spin" /> : <CornerDownLeft className="size-3.5" />}</button>
      <button type="button" aria-label={`Collapse ${label} frame annotation`} title="Collapse frame note" className="grid size-8 shrink-0 place-items-center rounded-full text-white/55 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white" onClick={() => setCollapsed(true)}><ChevronDown className="size-4" /></button>
    </form>}
    {error || voice.error || review.error || status ? <p role={error || voice.error || review.error ? 'alert' : 'status'} className="pointer-events-auto max-w-sm rounded-full bg-black/85 px-3 py-1 text-center text-[10px] text-white/80">{error ?? voice.error ?? review.error ?? status}</p> : null}
  </div>
}

export function VideoReviewDownloadButton() {
  const review = useReview()
  const savedMiB = (estimateReviewStorageBytes(review.entries) / (1024 * 1024)).toFixed(1)
  const limitMiB = Math.round(MAX_REVIEW_STORAGE_BYTES / (1024 * 1024))
  return <button type="button" onClick={() => review.exportReview('json')} disabled={!review.entries.length} aria-label="Download annotations JSON" title={`Download annotations and screenshots · ${review.entries.length} frames · ${savedMiB} of ${limitMiB} MiB saved locally`} className="relative grid size-9 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-[#b4fb60] disabled:opacity-30">
    <ArrowDownToLine className="size-4" />
    {review.entries.length ? <span className="absolute -right-0.5 -top-0.5 min-w-3.5 rounded-full bg-[#b4fb60] px-1 text-[9px] font-medium leading-3.5 text-black">{review.entries.length}</span> : null}
  </button>
}

export function VideoReviewToolbar() {
  const review = useReview()
  const [expanded, setExpanded] = React.useState(false)
  return <div className="shrink-0 border-b border-white/8 px-4 py-3 sm:px-6">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={buttonClass} onClick={() => setExpanded(value => !value)} aria-expanded={expanded}><MessageSquare className="size-3.5 text-[#b4fb60]" /> Review notes <span className="rounded bg-white/10 px-1.5 tabular-nums">{review.entries.length}</span></button>
      {review.draft ? <button type="button" className={buttonClass} onClick={() => review.open(review.draft!)}>Resume draft</button> : null}
      <span className="hidden flex-1 text-[11px] text-white/50 lg:block">Pause a moment. Mark what matters.</span>
      <button type="button" className={buttonClass} disabled={!review.entries.length} onClick={() => review.exportReview('json')}><FileJson className="size-3.5" /> JSON</button>
      <button type="button" className={cn(buttonClass, 'border-[#b4fb60]/30 bg-[#b4fb60]/10 text-[#c9ff88]')} disabled={!review.entries.length} onClick={() => review.exportReview('zip')}><ArrowDownToLine className="size-3.5" /> Download review</button>
    </div>
    {review.error ? <p role="alert" className="mt-2 text-xs text-rose-200">{review.error}</p> : null}
    {review.notice ? <p role="status" className="mt-2 text-xs text-[#c9ff88]">{review.notice}</p> : null}
    {expanded ? <div className="mt-3 max-h-44 overflow-y-auto">
      {!review.entries.length ? <p className="py-3 text-xs text-white/55">Choose Annotate on either video to capture your first frame. Reviews are saved on this device; download a bundle to share with your team.</p> : <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {review.entries.map((entry, index) => <li key={entry.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] p-2">
          <button type="button" onClick={() => review.open(entry)} className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[#b4fb60]" aria-label={`Edit review ${index + 1} at ${formatReviewTime(entry.timeSec)}`}>
            {/* Captured data URLs must remain local and do not use image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entry.annotatedImage} alt="Annotated video frame" className="h-14 w-20 shrink-0 rounded bg-black object-contain" />
            <span className="min-w-0"><span className="block text-xs text-white/85">{entry.source === 'original' ? 'Original' : 'Rendered'} <span className="font-mono text-[#c9ff88]">{formatReviewTime(entry.timeSec)}</span></span><span className="mt-1 block truncate text-[11px] text-white/55">{entry.marks.filter(mark => mark.type === 'text').map(mark => mark.text).join(' · ') || 'Drawing annotation'}</span></span>
          </button>
          <button type="button" className={`${buttonClass} border-transparent px-2`} aria-label={`Download review ${index + 1} image`} onClick={() => downloadReviewFile(new Blob([Uint8Array.from(reviewImageBytes(entry.annotatedImage)).buffer], { type: 'image/png' }), `review-${index + 1}.png`)}><ArrowDownToLine className="size-3.5" /></button>
          <button type="button" className={`${buttonClass} border-transparent px-2`} aria-label={`Delete review ${index + 1}`} onClick={() => review.remove(entry.id)}><Trash2 className="size-3.5" /></button>
        </li>)}
      </ul>}
    </div> : null}
  </div>
}

type Tool = 'text' | 'pen' | 'circle' | 'rectangle'
const toolOptions = [{ id: 'text', label: 'Text note', icon: Type }, { id: 'pen', label: 'Freehand', icon: Pencil }, { id: 'circle', label: 'Circle', icon: Circle }, { id: 'rectangle', label: 'Rectangle', icon: Square }] as const
const colors = [{ name: 'Lime', value: '#b4fb60' }, { name: 'Coral', value: '#ff807e' }, { name: 'Sky', value: '#7dd3fc' }, { name: 'White', value: '#ffffff' }]

function textLines(value: string) {
  return value.split('\n').flatMap(line => {
    const chars = Array.from(line)
    if (!chars.length) return ['']
    const lines: string[] = []
    while (chars.length) lines.push(chars.splice(0, 25).join(''))
    return lines
  })
}

function FrameMark({ mark, width, height, onEdit }: { mark: ReviewMark; width: number; height: number; onEdit?: () => void }) {
  const strokeWidth = Math.max(width, height) * 0.0035
  if (mark.type === 'pen') return <polyline points={mark.points.map(point => `${point.x * width},${point.y * height}`).join(' ')} fill="none" stroke={mark.color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  if (mark.type === 'text') {
    const lines = textLines(mark.text || 'Type a note…')
    const fontSize = Math.min(width * 0.028, height * 0.9 / (lines.length * 1.4 + 1))
    const noteHeight = (lines.length * 1.4 + 1) * fontSize
    const top = Math.max(0, Math.min(mark.y * height, height - noteHeight - height * 0.03))
    return <g onPointerDown={event => { if (onEdit) { event.stopPropagation(); onEdit() } }} style={{ cursor: onEdit ? 'text' : undefined }}>
      <rect x={mark.x * width} y={top} width={width * 0.46} height={noteHeight} rx={fontSize * 0.4} fill="#0b1018" fillOpacity="0.94" stroke={mark.color} strokeWidth={strokeWidth * 0.45} />
      <text x={mark.x * width + fontSize * 0.5} y={top + fontSize * 1.4} fill={mark.color} fontSize={fontSize} fontFamily="Arial, sans-serif" xmlSpace="preserve">
        {lines.map((line, index) => <tspan key={index} x={mark.x * width + fontSize * 0.5} dy={index ? fontSize * 1.4 : 0}>{line || '\u00a0'}</tspan>)}
      </text>
    </g>
  }
  const x = Math.min(mark.start.x, mark.end.x) * width
  const y = Math.min(mark.start.y, mark.end.y) * height
  const w = Math.abs(mark.end.x - mark.start.x) * width
  const h = Math.abs(mark.end.y - mark.start.y) * height
  return mark.type === 'circle'
    ? <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill="none" stroke={mark.color} strokeWidth={strokeWidth} />
    : <rect x={x} y={y} width={w} height={h} rx={strokeWidth} fill="none" stroke={mark.color} strokeWidth={strokeWidth} />
}

function ReviewFrameEditor({ entry, onChange, onSave, onClose, onDiscard }: {
  entry: ReviewEntry; onChange: React.Dispatch<React.SetStateAction<ReviewEntry | null>>; onSave: (entry: ReviewEntry) => boolean; onClose: () => void; onDiscard: () => void
}) {
  const [tool, setTool] = React.useState<Tool>('text')
  const [color, setColor] = React.useState(colors[0].value)
  const [marks, setMarks] = React.useState<ReviewMark[]>(entry.marks)
  const [redo, setRedo] = React.useState<ReviewMark[]>([])
  const [drawing, setDrawing] = React.useState<ReviewMark | null>(null)
  const drawingRef = React.useRef<ReviewMark | null>(null)
  const penPreviewRef = React.useRef<HTMLCanvasElement>(null)
  const [selectedText, setSelectedText] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const previousFocus = React.useRef<HTMLElement | null>(null)
  const edited = marks.find(mark => mark.id === selectedText && mark.type === 'text')

  React.useEffect(() => { onChange(current => current ? { ...current, marks } : current) }, [marks, onChange])

  React.useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => previousFocus.current?.focus()
  }, [])

  const commit = (next: ReviewMark[]) => { setMarks(next); setRedo([]) }
  const pointOf = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return clampReviewPoint(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height)
  }
  const save = async () => {
    if (!svgRef.current || saving) return
    setSaving(true)
    setSelectedText(null)
    setError(null)
    let url: string | null = null
    try {
      const serialized = new XMLSerializer().serializeToString(svgRef.current)
      url = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }))
      const image = new Image()
      image.src = url
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = entry.width
      canvas.height = entry.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Image export is unavailable in this browser.')
      context.drawImage(image, 0, 0)
      const saved = onSave({ ...entry, marks: marks.filter(mark => mark.type !== 'text' || mark.text.trim()), annotatedImage: canvas.toDataURL('image/png') })
      if (!saved) setError('The local screenshot limit is 50 MiB. Download your review and remove older frames before saving.')
    } catch {
      setError('Could not save the marked-up screenshot. Your draft is kept; try again.')
    } finally {
      if (url) URL.revokeObjectURL(url)
      setSaving(false)
    }
  }

  return <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/90 p-2 sm:p-6" onKeyDown={event => {
    event.stopPropagation()
    if (event.key === 'Escape') { event.preventDefault(); selectedText ? setSelectedText(null) : onClose() }
    if (event.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, [tabindex="0"]')
      const first = focusable?.[0], last = focusable?.[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
  }}>
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-busy={saving} aria-label="Annotate video frame" className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#090a0b] text-white shadow-2xl outline-none">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div><h3 className="text-sm font-medium">Annotate frame <span className="ml-2 font-mono text-[#c9ff88]">{formatReviewTime(entry.timeSec)}</span></h3><p className="mt-1 text-[11px] text-white/55">{entry.source === 'original' ? 'Original footage' : 'Rendered MP4'} · Local review draft</p></div>
        <button type="button" onClick={onClose} disabled={saving} className={`${buttonClass} border-transparent px-3`} aria-label="Close annotation editor"><X className="size-4" /></button>
      </header>
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-white/8 p-2.5" role="toolbar" aria-label="Annotation tools" inert={saving}>
        {toolOptions.map(option => <button key={option.id} type="button" onClick={() => { setSelectedText(null); setTool(option.id) }} aria-label={option.label} title={option.label} aria-pressed={tool === option.id} className={cn(buttonClass, 'px-3', tool === option.id && 'border-[#b4fb60]/40 bg-[#b4fb60]/10 text-[#c9ff88]')}><option.icon className="size-4" /><span className="hidden sm:inline">{option.label}</span></button>)}
        <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
        {colors.map(option => <button key={option.name} type="button" aria-label={`${option.name} annotation color`} aria-pressed={color === option.value} title={option.name} onClick={() => setColor(option.value)} className={`grid size-11 place-items-center rounded-lg focus-visible:outline-2 focus-visible:outline-[#b4fb60] ${color === option.value ? 'bg-white/10 ring-1 ring-white/35' : ''}`}><span className="size-4 rounded-full" style={{ background: option.value }} /></button>)}
        <button type="button" aria-label="Undo annotation" disabled={!marks.length} className={`${buttonClass} px-3`} onClick={() => { setRedo(current => [...current, marks[marks.length - 1]]); setMarks(current => current.slice(0, -1)); setSelectedText(null) }}><Undo2 className="size-4" /></button>
        <button type="button" aria-label="Redo annotation" disabled={!redo.length} className={`${buttonClass} px-3`} onClick={() => { setMarks(current => [...current, redo[redo.length - 1]]); setRedo(current => current.slice(0, -1)) }}><Redo2 className="size-4" /></button>
      </div>
      <div className="min-h-0 overflow-y-auto bg-[#101214] px-3 py-4 sm:px-6">
        <p className="mb-3 text-center text-xs text-white/60">{tool === 'text' ? 'Click the frame to add a floating note. Click a note to edit it.' : 'Drag on the frame to draw. Switch to Text note to add a comment.'}</p>
        <div className="relative mx-auto [container-type:inline-size]" style={{ width: `min(100%, ${entry.width / entry.height * 53}dvh)` }}>
          <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width={entry.width} height={entry.height} viewBox={`0 0 ${entry.width} ${entry.height}`} aria-label="Captured frame annotation canvas" role="img" className="block h-auto w-full touch-none select-none rounded-lg shadow-xl" style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}
            onPointerDown={event => {
              if (saving || event.button !== 0) return
              const point = pointOf(event)
              if (selectedText) { setSelectedText(null); return }
              if (tool === 'text') {
                const mark: ReviewMark = { id: crypto.randomUUID(), type: 'text', color, x: Math.min(point.x, 0.52), y: Math.min(point.y, 0.7), text: '' }
                commit([...marks, mark]); setSelectedText(mark.id)
              } else {
                const nextDrawing: ReviewMark = tool === 'pen'
                  ? { id: crypto.randomUUID(), type: 'pen', color, points: [point] }
                  : { id: crypto.randomUUID(), type: tool, color, start: point, end: point }
                drawingRef.current = nextDrawing
                event.currentTarget.setPointerCapture(event.pointerId)
                if (nextDrawing.type === 'pen') {
                  const context = penPreviewRef.current?.getContext('2d')
                  if (context) {
                    context.strokeStyle = nextDrawing.color
                    context.lineWidth = Math.max(entry.width, entry.height) * 0.0035
                    context.lineCap = 'round'
                    context.lineJoin = 'round'
                    context.beginPath()
                    context.moveTo(point.x * entry.width, point.y * entry.height)
                  }
                } else {
                  setDrawing(nextDrawing)
                }
              }
            }}
            onPointerMove={event => {
              const activeDrawing = drawingRef.current
              if (!activeDrawing) return
              const point = pointOf(event)
              if (activeDrawing.type === 'pen') {
                const context = penPreviewRef.current?.getContext('2d')
                if (context) {
                  context.lineTo(point.x * entry.width, point.y * entry.height)
                  context.stroke()
                }
                const last = activeDrawing.points[activeDrawing.points.length - 1]
                const bounds = event.currentTarget.getBoundingClientRect()
                if (Math.hypot((point.x - last.x) * bounds.width, (point.y - last.y) * bounds.height) >= 2) {
                  activeDrawing.points.push(point)
                }
              } else if (activeDrawing.type === 'circle' || activeDrawing.type === 'rectangle') {
                const nextDrawing = { ...activeDrawing, end: point }
                drawingRef.current = nextDrawing
                setDrawing(nextDrawing)
              }
            }}
            onPointerUp={event => {
              const activeDrawing = drawingRef.current
              if (!activeDrawing || (activeDrawing.type !== 'pen' && activeDrawing.type !== 'circle' && activeDrawing.type !== 'rectangle')) return
              const point = pointOf(event)
              const completed = activeDrawing.type === 'pen'
                ? { ...activeDrawing, points: [...activeDrawing.points, point] }
                : { ...activeDrawing, end: point }
              drawingRef.current = null
              if (activeDrawing.type === 'pen') {
                const context = penPreviewRef.current?.getContext('2d')
                context?.clearRect(0, 0, entry.width, entry.height)
              }
              commit([...marks, completed])
              setDrawing(null)
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onPointerCancel={() => {
              drawingRef.current = null
              setDrawing(null)
              penPreviewRef.current?.getContext('2d')?.clearRect(0, 0, entry.width, entry.height)
            }}>
            <image href={entry.image} width={entry.width} height={entry.height} />
            {marks.filter(mark => mark.type !== 'text' || mark.text.trim()).map(mark => <FrameMark key={mark.id} mark={mark} width={entry.width} height={entry.height} onEdit={!saving && mark.type === 'text' ? () => setSelectedText(mark.id) : undefined} />)}
            {drawing ? <FrameMark mark={drawing} width={entry.width} height={entry.height} /> : null}
            <g pointerEvents="none">
              <rect x="0" y={entry.height - entry.width * 0.035} width={entry.width} height={entry.width * 0.035} fill="#000000" fillOpacity="0.75" />
              <text x={entry.width * 0.012} y={entry.height - entry.width * 0.01} fill="#ffffff" fontFamily="Arial, sans-serif" fontSize={entry.width * 0.02}>{entry.source === 'original' ? 'Original' : 'Rendered MP4'} · {formatReviewTime(entry.timeSec)}</text>
            </g>
          </svg>
          <canvas ref={penPreviewRef} width={entry.width} height={entry.height} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
          {edited?.type === 'text' ? <div className="absolute z-10 w-[min(16rem,90%)] rounded-lg border border-[#b4fb60]/50 bg-[#0b1018] p-2 shadow-xl" style={{ left: `${edited.x * 100}%`, top: `${edited.y * 100}%`, maxWidth: `${(1 - edited.x) * 100}%` }}>
            <textarea autoFocus aria-label="Floating annotation text" placeholder="What should change?" value={edited.text} maxLength={500} rows={3} onChange={event => commit(marks.map(mark => mark.id === edited.id && mark.type === 'text' ? { ...mark, text: event.target.value } : mark))} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); setSelectedText(null) } }} className="block w-full resize-y bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/45" />
            <div className="mt-1 flex items-center justify-between"><button type="button" aria-label="Delete text note" onClick={() => { commit(marks.filter(mark => mark.id !== edited.id)); setSelectedText(null) }} className="grid size-11 place-items-center text-white/60 hover:text-white"><Trash2 className="size-3.5" /></button><button type="button" onClick={() => setSelectedText(null)} className="inline-flex min-h-11 items-center gap-1 px-2 text-xs text-[#c9ff88]"><Check className="size-3.5" /> Done</button></div>
          </div> : null}
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
        <button type="button" disabled={saving} onClick={() => {
          setTool('text')
          const mark: ReviewMark = { id: crypto.randomUUID(), type: 'text', color, x: 0.06, y: Math.min(0.08 + marks.filter(item => item.type === 'text').length * 0.13, 0.7), text: '' }
          commit([...marks, mark]); setSelectedText(mark.id)
        }} className={buttonClass}><Plus className="size-3.5" /> Add note</button>
        <span className="flex-1 text-[11px] text-white/55">{marks.filter(mark => mark.type === 'text' && mark.text.trim()).length} notes · {marks.filter(mark => mark.type !== 'text').length} drawings</span>
        <button type="button" onClick={onDiscard} disabled={saving} className={buttonClass}>Discard draft</button>
        <button type="button" onClick={() => void save()} disabled={saving || !marks.some(mark => mark.type !== 'text' || mark.text.trim())} className={cn(buttonClass, 'border-[#b4fb60]/40 bg-[#b4fb60] font-medium text-black hover:bg-[#c9ff88]')}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} Save frame</button>
        {error ? <p role="alert" className="w-full text-xs text-rose-200">{error}</p> : null}
      </footer>
    </div>
  </div>
}
