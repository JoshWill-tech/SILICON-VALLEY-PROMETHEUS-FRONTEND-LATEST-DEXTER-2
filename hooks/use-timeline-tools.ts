'use client'

import * as React from 'react'
import {
  sourceClips,
  splitSource,
  trimClipBoundary,
  removeClipRange,
  type TimelineRange,
  type SourceClip,
} from '@/lib/editor/timeline-tools'
import type { EditorialCue } from '@/lib/editor/editorial-timeline-state'

type Edit = { splits: number[]; cuts: TimelineRange[]; cues: EditorialCue[] }

export function useTimelineTools({
  source,
  duration,
  title,
  time,
  cuts,
  cues,
  splits: controlledSplits,
  onSplits,
  onCuts,
  onCues,
}: {
  source: string
  duration: number
  title: string
  time: number
  cuts: TimelineRange[]
  cues: EditorialCue[]
  splits?: number[]
  onSplits?: (splits: number[]) => void
  onCuts?: (cuts: TimelineRange[]) => void
  onCues?: (cues: EditorialCue[]) => void
}) {
  const [localSplits, setLocalSplits] = React.useState<number[]>([])
  const splits = controlledSplits ?? localSplits
  const [selected, setSelected] = React.useState<string | null>(null)
  const [history, setHistory] = React.useState<{ past: Edit[]; future: Edit[] }>({ past: [], future: [] })

  React.useEffect(() => {
    setLocalSplits([])
    setSelected(null)
    setHistory({ past: [], future: [] })
  }, [source])

  const clips = React.useMemo(() => sourceClips(duration, title, splits, cuts), [duration, title, splits, cuts])
  const selectedClip = clips.find((clip) => clip.id === selected) ?? (selected === null ? clips.find((clip) => time >= clip.start && time < clip.end) : undefined)
  const selectedCue = cues.find((cue) => cue.id === selected)
  const current: Edit = { splits, cuts, cues }

  const restore = (edit: Edit) => {
    if (JSON.stringify(edit.splits) !== JSON.stringify(splits)) {
      if (onSplits) onSplits(edit.splits)
      else setLocalSplits(edit.splits)
    }
    if (JSON.stringify(edit.cuts) !== JSON.stringify(cuts)) onCuts?.(edit.cuts)
    if (JSON.stringify(edit.cues) !== JSON.stringify(cues)) onCues?.(edit.cues)
    setSelected(null)
  }

  const commit = (edit: Edit) => {
    if (JSON.stringify(edit) === JSON.stringify(current)) return
    setHistory((value) => ({ past: [...value.past, current], future: [] }))
    restore(edit)
  }

  return {
    clips,
    selected: selected ?? selectedClip?.id ?? null,
    select: setSelected,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    canDelete: Boolean((selectedClip && onCuts) || (selectedCue && onCues)),
    canDuplicate: Boolean(selectedCue && onCues),
    split: (targetTime?: number) => {
      const splitAt = targetTime !== undefined ? targetTime : time
      if (selectedCue && onCues && splitAt > selectedCue.start && splitAt < selectedCue.end) {
        const id = crypto.randomUUID()
        commit({
          ...current,
          cues: cues.flatMap((cue) =>
            cue.id === selectedCue.id
              ? [{ ...cue, end: splitAt }, { ...cue, id, start: splitAt, origin: 'editor' as const }]
              : [cue]
          ),
        })
      } else {
        const latestClips = sourceClips(duration, title, splits, cuts)
        commit({ ...current, splits: splitSource(splits, latestClips, splitAt) })
      }
    },
    trimClip: (clipId: string, side: 'left' | 'right', newTime: number) => {
      if (!onCuts) return
      const res = trimClipBoundary(clips, clipId, side, newTime, duration, cuts)
      commit({ ...current, cuts: res.cuts })
    },
    remove: (targetId?: string) => {
      const idToRemove = targetId ?? selected ?? selectedClip?.id
      const cue = cues.find((c) => c.id === idToRemove)
      const clip = clips.find((c) => c.id === idToRemove)
      if (cue && onCues) {
        commit({ ...current, cues: cues.filter((c) => c.id !== cue.id) })
        setSelected(null)
      } else if (clip && onCuts) {
        const res = removeClipRange(clips, clip.id, cuts)
        commit({ ...current, cuts: res.cuts })
        setSelected(null)
      }
    },
    duplicate: (targetId?: string) => {
      const idToDup = targetId ?? selected
      const cue = cues.find((c) => c.id === idToDup)
      if (cue && onCues) {
        const length = cue.end - cue.start
        const start = Math.min(duration - length, cue.end)
        commit({
          ...current,
          cues: [...cues, { ...cue, id: crypto.randomUUID(), start, end: start + length, origin: 'editor' }],
        })
      }
    },
    marker: () => {
      if (!onCues || time >= duration) return
      commit({
        ...current,
        cues: [
          ...cues,
          {
            id: crypto.randomUUID(),
            type: 'transition',
            title: 'Timeline marker',
            start: time,
            end: Math.min(duration, time + 0.1),
            origin: 'editor',
            context: { marker: true },
          },
        ],
      })
    },
    undo: () => {
      const previous = history.past.at(-1)
      if (!previous) return
      setHistory({ past: history.past.slice(0, -1), future: [current, ...history.future] })
      restore(previous)
    },
    redo: () => {
      const next = history.future[0]
      if (!next) return
      setHistory({ past: [...history.past, current], future: history.future.slice(1) })
      restore(next)
    },
  }
}
