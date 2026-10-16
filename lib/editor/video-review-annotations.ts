export type ReviewPoint = { x: number; y: number }
export type ReviewMark =
  | { id: string; type: 'pen'; color: string; points: ReviewPoint[] }
  | { id: string; type: 'circle' | 'rectangle'; color: string; start: ReviewPoint; end: ReviewPoint }
  | { id: string; type: 'text'; color: string; x: number; y: number; text: string }

export type ReviewEntry = {
  id: string
  createdAt: string
  source: 'original' | 'rendered'
  renderId: string | null
  timeSec: number
  width: number
  height: number
  image: string
  annotatedImage: string
  marks: ReviewMark[]
}

export type ReviewProject = { projectId: string; sourceAssetId: string | null; projectTitle: string }

export const MAX_REVIEW_STORAGE_BYTES = 50 * 1024 * 1024

function dataUrlBytes(value: string): number {
  // Count the ASCII data URL as stored. Counting decoded PNG bytes would miss
  // base64's roughly 33% expansion and understate the IndexedDB quota used.
  return value.length
}

export function estimateReviewStorageBytes(entries: readonly Pick<ReviewEntry, 'id' | 'image' | 'annotatedImage'>[], draft: Pick<ReviewEntry, 'id' | 'image' | 'annotatedImage'> | null = null): number {
  const savedBytes = entries.reduce((total, entry) => total + dataUrlBytes(entry.image) + dataUrlBytes(entry.annotatedImage), 0)
  return draft && !entries.some(entry => entry.id === draft.id)
    ? savedBytes + dataUrlBytes(draft.image) + dataUrlBytes(draft.annotatedImage)
    : savedBytes
}

export function canStoreReviewEntries(entries: readonly Pick<ReviewEntry, 'id' | 'image' | 'annotatedImage'>[], limit = MAX_REVIEW_STORAGE_BYTES, draft: Pick<ReviewEntry, 'id' | 'image' | 'annotatedImage'> | null = null): boolean {
  return estimateReviewStorageBytes(entries, draft) <= limit
}

export function appendReviewNote(entries: ReviewEntry[], frame: ReviewEntry, text: string, noteId: string): ReviewEntry {
  const existing = entries.find(entry => entry.source === frame.source && entry.renderId === frame.renderId && Math.round(entry.timeSec * 1000) === Math.round(frame.timeSec * 1000))
  const target = existing ?? frame
  const count = target.marks.filter(mark => mark.type === 'text').length
  return { ...target, marks: [...target.marks, { id: noteId, type: 'text', color: '#b4fb60', x: 0.06, y: Math.min(0.06 + count * 0.13, 0.7), text: text.trim() }] }
}

export function captureReviewFrame(video: HTMLVideoElement | null, source: ReviewEntry['source'], renderId: string | null): ReviewEntry {
  if (!video || video.readyState < 2 || video.seeking || !video.videoWidth) throw new Error('Wait for the video frame to load, then try again.')
  video.pause()
  const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Frame capture is unavailable in this browser.')
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const image = canvas.toDataURL('image/png')
  return { id: crypto.randomUUID(), createdAt: new Date().toISOString(), source, renderId, timeSec: video.currentTime, width: canvas.width, height: canvas.height, image, annotatedImage: '', marks: [] }
}

export function reviewTextLines(value: string): string[] {
  return value.split('\n').flatMap(line => {
    const chars = Array.from(line)
    if (!chars.length) return ['']
    const lines: string[] = []
    while (chars.length) lines.push(chars.splice(0, 25).join(''))
    return lines
  })
}

export async function renderReviewScreenshot(entry: ReviewEntry): Promise<string> {
  const image = new Image()
  image.src = entry.image
  await image.decode()
  const canvas = document.createElement('canvas')
  const { width, height } = entry
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Screenshot export is unavailable in this browser.')
  context.drawImage(image, 0, 0, width, height)
  for (const mark of entry.marks) {
    context.strokeStyle = mark.color
    context.lineWidth = Math.max(width, height) * 0.0035
    context.lineCap = 'round'
    context.lineJoin = 'round'
    if (mark.type === 'text') {
      const lines = reviewTextLines(mark.text)
      const font = Math.min(width * 0.028, height * 0.9 / (lines.length * 1.4 + 1))
      const noteHeight = (lines.length * 1.4 + 1) * font
      const top = Math.max(0, Math.min(mark.y * height, height - noteHeight - height * 0.03))
      context.fillStyle = 'rgba(11,16,24,.94)'
      context.fillRect(mark.x * width, top, width * 0.46, noteHeight)
      context.font = `${font}px Arial, sans-serif`
      context.fillStyle = mark.color
      lines.forEach((line, index) => context.fillText(line, mark.x * width + font * 0.5, top + font * 1.4 * (index + 1)))
    } else {
      context.beginPath()
      if (mark.type === 'pen') {
        mark.points.forEach((point, index) => index ? context.lineTo(point.x * width, point.y * height) : context.moveTo(point.x * width, point.y * height))
      } else {
        const x = Math.min(mark.start.x, mark.end.x) * width, y = Math.min(mark.start.y, mark.end.y) * height
        const w = Math.abs(mark.end.x - mark.start.x) * width, h = Math.abs(mark.end.y - mark.start.y) * height
        if (mark.type === 'circle') context.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
        else context.rect(x, y, w, h)
      }
      context.stroke()
    }
  }
  context.fillStyle = 'rgba(0,0,0,.75)'
  context.fillRect(0, height - width * 0.035, width, width * 0.035)
  context.font = `${width * 0.02}px Arial, sans-serif`
  context.fillStyle = '#ffffff'
  context.fillText(`${entry.source === 'original' ? 'Original' : 'Rendered MP4'} · ${formatReviewTime(entry.timeSec)}`, width * 0.012, height - width * 0.01)
  return canvas.toDataURL('image/png')
}

export function formatReviewTime(seconds: number): string {
  const ms = Math.max(0, Math.round((Number.isFinite(seconds) ? seconds : 0) * 1000))
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor(ms / 60_000) % 60
  const rest = `${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`
  return `${hours ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${rest}`
}

export function normalizeReviewPillPosition(centerX: number, centerY: number, hostWidth: number, hostHeight: number, pillWidth: number, pillHeight: number, gutter = 8): ReviewPoint {
  const clampCenter = (center: number, host: number, pill: number) => {
    if (host <= 0 || !Number.isFinite(center)) return 0.5
    const min = Math.min(0.5, (pill / 2 + gutter) / host)
    const max = Math.max(0.5, 1 - min)
    return Math.max(min, Math.min(max, center / host))
  }
  return { x: clampCenter(centerX, hostWidth, pillWidth), y: clampCenter(centerY, hostHeight, pillHeight) }
}

export function clampReviewPoint(x: number, y: number, width: number, height: number): ReviewPoint {
  return { x: Math.max(0, Math.min(1, x / width || 0)), y: Math.max(0, Math.min(1, y / height || 0)) }
}

export function createAnnotationManifest(project: ReviewProject, entries: ReviewEntry[]) {
  return {
    schemaVersion: 1,
    ...project,
    exportedAt: new Date().toISOString(),
    coordinateSystem: 'normalized-frame',
    entries: entries.map(entry => ({ ...entry, timestamp: formatReviewTime(entry.timeSec), notes: entry.marks.filter(mark => mark.type === 'text').map(mark => mark.text) })),
  }
}

// Uncompressed ZIP: small review bundles need no additional dependency or compression worker.
export function createReviewZip(files: { name: string; data: Uint8Array }[]): Blob {
  const encoder = new TextEncoder()
  const parts: ArrayBuffer[] = []
  const directory: ArrayBuffer[] = []
  let offset = 0
  let directorySize = 0
  for (const file of files) {
    const name = encoder.encode(file.name)
    let crc = 0xffffffff
    for (const byte of file.data) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
    }
    crc = (crc ^ 0xffffffff) >>> 0
    const header = new ArrayBuffer(30 + name.length)
    const local = new DataView(header)
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true)
    local.setUint16(12, 0x21, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, file.data.length, true)
    local.setUint32(22, file.data.length, true)
    local.setUint16(26, name.length, true)
    new Uint8Array(header).set(name, 30)
    parts.push(header, Uint8Array.from(file.data).buffer)
    const central = new ArrayBuffer(46 + name.length)
    const record = new DataView(central)
    record.setUint32(0, 0x02014b50, true)
    record.setUint16(4, 20, true)
    record.setUint16(6, 20, true)
    record.setUint16(8, 0x0800, true)
    record.setUint16(14, 0x21, true)
    record.setUint32(16, crc, true)
    record.setUint32(20, file.data.length, true)
    record.setUint32(24, file.data.length, true)
    record.setUint16(28, name.length, true)
    record.setUint32(42, offset, true)
    new Uint8Array(central).set(name, 46)
    directory.push(central)
    directorySize += central.byteLength
    offset += header.byteLength + file.data.length
  }
  const end = new ArrayBuffer(22)
  const footer = new DataView(end)
  footer.setUint32(0, 0x06054b50, true)
  footer.setUint16(8, files.length, true)
  footer.setUint16(10, files.length, true)
  footer.setUint32(12, directorySize, true)
  footer.setUint32(16, offset, true)
  return new Blob([...parts, ...directory, end], { type: 'application/zip' })
}

export function reviewImageBytes(image: string): Uint8Array {
  return Uint8Array.from(atob(image.slice(image.indexOf(',') + 1)), char => char.charCodeAt(0))
}

export function downloadReviewFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
