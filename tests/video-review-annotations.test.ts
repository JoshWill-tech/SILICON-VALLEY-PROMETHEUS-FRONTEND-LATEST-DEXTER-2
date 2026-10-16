import assert from 'node:assert/strict'
import test from 'node:test'
import { canStoreReviewEntries, createAnnotationManifest, estimateReviewStorageBytes, formatReviewTime, createReviewZip, clampReviewPoint, appendReviewNote, MAX_REVIEW_STORAGE_BYTES, normalizeReviewPillPosition } from '../lib/editor/video-review-annotations'

test('Enter submissions group notes by the exact frame and keep other versions separate', () => {
  const frame = { id: 'frame-1', createdAt: '2026-10-15T12:00:00Z', source: 'original' as const, renderId: null, timeSec: 1.25, width: 720, height: 1280, image: 'data:image/png;base64,a', annotatedImage: '', marks: [] }
  const first = appendReviewNote([], frame, 'First note', 'note-1')
  const second = appendReviewNote([first], { ...frame, id: 'frame-2' }, 'Second note', 'note-2')
  assert.equal(second.id, first.id)
  assert.deepEqual(second.marks.filter(mark => mark.type === 'text').map(mark => mark.text), ['First note', 'Second note'])
  assert.equal(second.image, first.image)
  const nextFrame = appendReviewNote([second], { ...frame, id: 'next', timeSec: 1.251 }, 'Another frame', 'note-3')
  assert.equal(nextFrame.id, 'next')
  const otherVersion = appendReviewNote([second], { ...frame, id: 'rendered', source: 'rendered', renderId: 'render-2' }, 'Rendered note', 'note-4')
  assert.equal(otherVersion.id, 'rendered')
})

test('review timestamps retain milliseconds and hours', () => {
  assert.equal(formatReviewTime(12.345), '00:12.345')
  assert.equal(formatReviewTime(3661.02), '01:01:01.020')
  assert.equal(formatReviewTime(Number.NaN), '00:00.000')
})

test('pointer coordinates stay inside the captured frame', () => {
  assert.deepEqual(clampReviewPoint(-10, 250, 200, 100), { x: 0, y: 1 })
  assert.deepEqual(clampReviewPoint(50, 25, 200, 100), { x: 0.25, y: 0.25 })
})

test('draggable review pill stays inside the video at desktop and mobile sizes', () => {
  const desktop = normalizeReviewPillPosition(-20, 200, 600, 338, 384, 44)
  assert.ok(Math.abs(desktop.x - 1 / 3) < 1e-12)
  assert.ok(Math.abs(desktop.y - 200 / 338) < 1e-12)
  assert.deepEqual(normalizeReviewPillPosition(500, 200, 360, 640, 336, 44), { x: 0.5111111111111111, y: 0.3125 })
  assert.deepEqual(normalizeReviewPillPosition(50, 50, 20, 20, 100, 100), { x: 0.5, y: 0.5 })
})

test('local screenshot storage estimates base64 bytes and enforces its cap without deleting saved entries', () => {
  const entry = { id: 'saved', image: 'data:image/png;base64,QUJDRA==', annotatedImage: 'data:image/png;base64,QUJDRA==' }
  const encodedBytes = entry.image.length + entry.annotatedImage.length
  assert.equal(estimateReviewStorageBytes([entry]), encodedBytes)
  assert.equal(canStoreReviewEntries([entry], encodedBytes), true)
  assert.equal(canStoreReviewEntries([entry], encodedBytes - 1), false)
  assert.equal(estimateReviewStorageBytes([entry], entry), encodedBytes, 'editing a saved frame does not double-count its existing screenshot')
  assert.equal(canStoreReviewEntries([], encodedBytes, entry), true, 'unsaved drawing drafts count toward the same limit')
  assert.equal(MAX_REVIEW_STORAGE_BYTES, 50 * 1024 * 1024)
})

test('portable review JSON preserves exact source, timestamp, marks and screenshots without media URLs', () => {
  const entry = {
    id: 'entry-1', createdAt: '2026-10-15T12:00:00.000Z', source: 'rendered' as const,
    renderId: 'render-42', timeSec: 12.345, width: 720, height: 1280,
    image: 'data:image/png;base64,b3JpZ2luYWw=', annotatedImage: 'data:image/png;base64,bWFya2Vk',
    marks: [{ id: 'text-1', type: 'text' as const, color: '#b4fb60', x: 0.1, y: 0.2, text: 'Move this caption\nKeep the timing' }],
  }
  const manifest = createAnnotationManifest({ projectId: 'project-1', sourceAssetId: 'asset-2', projectTitle: 'Review' }, [entry])
  const portable = JSON.parse(JSON.stringify(manifest))
  assert.equal(portable.entries[0].timestamp, '00:12.345')
  assert.equal(portable.entries[0].renderId, 'render-42')
  assert.equal(portable.entries[0].image, entry.image)
  assert.equal(portable.entries[0].annotatedImage, entry.annotatedImage)
  assert.equal(portable.entries[0].marks[0].text, entry.marks[0].text)
  assert.equal(portable.sourceAssetId, 'asset-2')
  assert.equal(portable.coordinateSystem, 'normalized-frame')
})

test('ZIP stores every screenshot and Unicode transcript with valid directory offsets', async () => {
  const files = [{ name: 'transcript.md', data: new TextEncoder().encode('Résumé — ملاحظة') }, { name: 'frames/01.png', data: new Uint8Array([137, 80, 78, 71]) }]
  const zip = createReviewZip(files)
  const bytes = new Uint8Array(await zip.arrayBuffer())
  const view = new DataView(bytes.buffer)
  assert.equal(view.getUint32(0, true), 0x04034b50)
  const end = bytes.length - 22
  assert.equal(view.getUint32(end, true), 0x06054b50)
  assert.equal(view.getUint16(end + 10, true), 2)
  let directory = view.getUint32(end + 16, true)
  for (const file of files) {
    assert.equal(view.getUint32(directory, true), 0x02014b50)
    const offset = view.getUint32(directory + 42, true)
    const nameLength = view.getUint16(offset + 26, true)
    assert.equal(new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + nameLength)), file.name)
    assert.deepEqual(bytes.slice(offset + 30 + nameLength, offset + 30 + nameLength + file.data.length), file.data)
    directory += 46 + view.getUint16(directory + 28, true)
  }
})

test('ZIP checksums match the standard CRC-32 reference vector', async () => {
  const zip = createReviewZip([{ name: 'checksum.txt', data: new TextEncoder().encode('123456789') }])
  const view = new DataView(await zip.arrayBuffer())
  assert.equal(view.getUint32(14, true), 0xcbf43926)
})
