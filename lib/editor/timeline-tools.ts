export type TimelineRange = { start: number; end: number }
export type SourceClip = TimelineRange & { id: string; title: string; type: 'video' }

export function mergeTimelineRanges(ranges: TimelineRange[]): TimelineRange[] {
  if (!ranges.length) return []
  const sorted = [...ranges]
    .filter(r => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start + 0.005)
    .sort((a, b) => a.start - b.start)
  if (!sorted.length) return []
  const merged: TimelineRange[] = []
  let current = { ...sorted[0] }
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]
    if (next.start <= current.end + 0.04) {
      current.end = Math.max(current.end, next.end)
    } else {
      merged.push(current)
      current = { ...next }
    }
  }
  merged.push(current)
  return merged
}

export function sourceClips(duration: number, title: string, splits: number[], cuts: TimelineRange[]): SourceClip[] {
  const mergedCuts = mergeTimelineRanges(cuts)
  const boundaries = [...new Set([0, duration, ...splits, ...mergedCuts.flatMap(cut => [cut.start, cut.end])])]
    .filter(time => Number.isFinite(time) && time >= 0 && time <= duration).sort((a, b) => a - b)
  return boundaries.slice(0, -1).flatMap((start, index) => {
    const end = boundaries[index + 1]
    if (end <= start || mergedCuts.some(cut => start >= cut.start - 0.01 && end <= cut.end + 0.01)) return []
    return [{ id: `source-video:${start.toFixed(3)}:${end.toFixed(3)}`, start, end, title, type: 'video' as const }]
  })
}

export function splitSource(splits: number[], clips: SourceClip[], time: number): number[] {
  if (!clips.some(clip => time > clip.start + 0.05 && time < clip.end - 0.05)) return splits
  return [...new Set([...splits, Number(time.toFixed(3))])].sort((a, b) => a - b)
}

export function trimClipBoundary(
  clips: SourceClip[],
  clipId: string,
  side: 'left' | 'right',
  newTime: number,
  duration: number,
  cuts: TimelineRange[]
): { cuts: TimelineRange[] } {
  const clip = clips.find(c => c.id === clipId)
  if (!clip) return { cuts }
  const clampedTime = Math.max(0, Math.min(duration, newTime))

  if (side === 'left') {
    // Minimum clip duration is 0.1s
    if (clampedTime >= clip.end - 0.1) return { cuts }
    if (clampedTime > clip.start) {
      // Trimming inward from left adds a cut range from clip.start to clampedTime
      return { cuts: mergeTimelineRanges([...cuts, { start: clip.start, end: clampedTime }]) }
    } else {
      // Expanding outward from left un-cuts any cut region between clampedTime and clip.start
      const updatedCuts = cuts.flatMap(c => {
        if (c.end <= clampedTime || c.start >= clip.start) return [c]
        const remaining: TimelineRange[] = []
        if (c.start < clampedTime) remaining.push({ start: c.start, end: clampedTime })
        if (c.end > clip.start) remaining.push({ start: clip.start, end: c.end })
        return remaining
      })
      return { cuts: mergeTimelineRanges(updatedCuts) }
    }
  } else {
    // side === 'right'
    if (clampedTime <= clip.start + 0.1) return { cuts }
    if (clampedTime < clip.end) {
      // Trimming inward from right adds a cut range from clampedTime to clip.end
      return { cuts: mergeTimelineRanges([...cuts, { start: clampedTime, end: clip.end }]) }
    } else {
      // Expanding outward from right un-cuts any cut region between clip.end and clampedTime
      const updatedCuts = cuts.flatMap(c => {
        if (c.end <= clip.end || c.start >= clampedTime) return [c]
        const remaining: TimelineRange[] = []
        if (c.start < clip.end) remaining.push({ start: c.start, end: clip.end })
        if (c.end > clampedTime) remaining.push({ start: clampedTime, end: c.end })
        return remaining
      })
      return { cuts: mergeTimelineRanges(updatedCuts) }
    }
  }
}

export function removeClipRange(
  clips: SourceClip[],
  clipId: string,
  cuts: TimelineRange[]
): { cuts: TimelineRange[] } {
  const clip = clips.find(c => c.id === clipId)
  if (!clip) return { cuts }
  return { cuts: mergeTimelineRanges([...cuts, { start: clip.start, end: clip.end }]) }
}
