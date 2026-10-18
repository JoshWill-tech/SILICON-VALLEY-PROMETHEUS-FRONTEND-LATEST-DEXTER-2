import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { downloadMedia, isCrossOriginHttpUrl } from '../lib/editor/browser-download'

test('D1: downloadMedia throws descriptive error when response is not ok', async () => {
  const fakeFetcher = async () => new Response(JSON.stringify({ error: 'Mini-Run output is not ready.' }), {
    status: 409,
    headers: { 'Content-Type': 'application/json' },
  })

  await assert.rejects(
    downloadMedia('/api/mini-run/job/123/output?download=1', 'test.mp4', fakeFetcher as any),
    /Mini-Run output is not ready\./,
    'downloadMedia must reject and throw backend error message instead of saving corrupt file',
  )
})

test('D2: downloadMedia throws descriptive error when response is 200 but content-type is application/json', async () => {
  const fakeFetcher = async () => new Response(JSON.stringify({ error: 'Render failed during video assembly.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

  await assert.rejects(
    downloadMedia('/api/mini-run/job/123/output?download=1', 'test.mp4', fakeFetcher as any),
    /Render failed during video assembly\./,
    'downloadMedia must reject JSON payloads delivered with 200 status',
  )
})

test('D3: downloadMedia throws descriptive error when payload is tiny corrupted byte stream (<64 bytes)', async () => {
  // Simulates a 7-byte string like "running" or "unknown"
  const fakeFetcher = async () => new Response('running', {
    status: 200,
    headers: { 'Content-Type': 'video/mp4' },
  })

  await assert.rejects(
    downloadMedia('/api/mini-run/job/123/output?download=1', 'test.mp4', fakeFetcher as any),
    /running|incomplete|invalid|corrupt/i,
    'downloadMedia must detect corrupt small byte streams and reject them',
  )
})

test('D4: browser-download utility correctly identifies cross-origin URLs', () => {
  assert.equal(isCrossOriginHttpUrl('https://r2.cloudflarestorage.com/bucket/key', 'http://localhost:3000'), true)
  assert.equal(isCrossOriginHttpUrl('/api/mini-run/job/123/output', 'http://localhost:3000'), false)
  assert.equal(isCrossOriginHttpUrl('http://localhost:3000/api/exports/123/download-url', 'http://localhost:3000'), false)
})

test('D5: static analysis: all download entry points use downloadMedia instead of raw unvalidated anchor clicks', () => {
  const projectCard = readFileSync('components/projects/project-card.tsx', 'utf8')
  assert.match(projectCard, /downloadMedia\(/, 'project-card.tsx must use downloadMedia')
  assert.doesNotMatch(projectCard, /link\.setAttribute\('download'/, 'project-card.tsx must not use raw unvalidated link.setAttribute download')

  const detailsModal = readFileSync('components/projects/project-details-modal.tsx', 'utf8')
  assert.match(detailsModal, /downloadMedia\(/, 'project-details-modal.tsx must use downloadMedia')
  assert.doesNotMatch(detailsModal, /link\.setAttribute\('download'/, 'project-details-modal.tsx must not use raw unvalidated link.setAttribute download')

  const editorPage = readFileSync('app/editor/[id]/page.tsx', 'utf8')
  assert.match(editorPage, /downloadMedia\(/, 'app/editor/[id]/page.tsx must use downloadMedia in handleConfirmDownload')
  assert.doesNotMatch(editorPage, /link\.setAttribute\('download'/, 'app/editor/[id]/page.tsx must not use raw unvalidated link.setAttribute download')

  const editorialDelivery = readFileSync('components/editor/editorial-delivery-studio.tsx', 'utf8')
  assert.match(editorialDelivery, /downloadMedia\(/, 'editorial-delivery-studio.tsx must use downloadMedia')
})

test('D6: static analysis: ExportService provides dev fallback for Jeff Simons project', () => {
  const exportService = readFileSync('lib/exports/service.ts', 'utf8')
  assert.match(exportService, /f56c53dc-d0c7-47c3-8ead-cb1c01adb49f|DEV_JEFF_SIMONS_PROJECT_ID/, 'ExportService must recognize DEV_JEFF_SIMONS_PROJECT_ID')
  assert.match(exportService, /mini_run_jeff_simons_1791228687/, 'ExportService must link Jeff Simons project to its mini-run media')
})

test('D7: static analysis: mini-run output route sets Content-Disposition on local dev delivery', () => {
  const outputRoute = readFileSync('app/api/mini-run/job/[id]/output/route.ts', 'utf8')
  assert.match(outputRoute, /Content-Disposition/i, 'output route must set Content-Disposition on responses')
})
