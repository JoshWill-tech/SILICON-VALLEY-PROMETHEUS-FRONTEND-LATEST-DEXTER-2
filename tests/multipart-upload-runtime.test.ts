import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import vm from 'node:vm'
import { buildSync } from 'esbuild'
import { readFileSync } from 'node:fs'

// Run the real uploader with a browser transport double. File slices describe
// byte ranges without allocating a multi-gigabyte fixture in the test process.
const bundled = buildSync({
  stdin: { contents: readFileSync('lib/r2/multipart-client.ts', 'utf8').replace("import { get, set, del } from 'idb-keyval'", 'const get = async (key: string) => cache.get(key); const set = async (key: string, value: unknown) => { cache.set(key, value) }; const del = async (key: string) => { cache.delete(key) };'), loader: 'ts', resolveDir: process.cwd() },
  bundle: false, write: false, format: 'iife', globalName: 'multipart', platform: 'browser', target: 'es2022',
}).outputFiles[0].text

function harness(options: { serverPartSize?: number; initiateFailure?: boolean; missingEtag?: boolean; failPartOnce?: number; failPartAlways?: number; signFailure?: boolean } = {}) {
  const chunks: number[] = []
  const signedParts: number[] = []
  const requests: { endpoint: string; body: any }[] = []
  const cache = new Map()
  let failedOnce = false
  const context = vm.createContext({
    cache, Response, DOMException, crypto: { randomUUID }, Set, Date, URL,
    console: { log() {}, warn() {}, error() {} },
    window: { setTimeout: (fn: () => void) => setTimeout(fn, 0), clearTimeout },
    fetch: async (endpoint: string, request: any) => {
      const body = JSON.parse(request.body)
      requests.push({ endpoint, body })
      if (endpoint.endsWith('/initiate')) {
        if (options.initiateFailure) return new Response(JSON.stringify({ error: 'Storage quota exceeded.', code: 'STORAGE_QUOTA_EXCEEDED', retryable: false }), { status: 413 })
        return Response.json({ asset: { id: body.assetId, bucket: 'sources', objectKey: 'source', projectId: 'project', uploadSessionId: 'session', sizeBytes: body.sizeBytes }, upload: { sessionId: 'session', key: 'source', uploadId: 'upload', partSize: options.serverPartSize ?? 50 * 1024 * 1024, status: 'uploading' } })
      }
      if (endpoint.endsWith('/sign-part')) {
        signedParts.push(body.partNumber)
        if (options.signFailure) return Response.json({ error: 'Upload session is no longer active.', code: 'UPLOAD_SESSION_INACTIVE', retryable: false }, { status: 409 })
        return Response.json({ url: `https://example.r2.cloudflarestorage.com/part/${body.partNumber}` })
      }
      return Response.json({ bucket: 'sources', key: 'source', verified: true })
    },
    XMLHttpRequest: class {
      upload = { onprogress: null as any }
      status = 200
      responseText = ''
      url = ''
      onload: any
      onerror: any
      onabort: any
      open(_method: string, url: string) { this.url = url }
      setRequestHeader() {}
      getAllResponseHeaders() { return 'etag: "part"' }
      getResponseHeader() { return options.missingEtag ? null : '"part"' }
      abort() { this.onabort?.() }
      send(body: { size: number }) {
        chunks.push(body.size)
        if (Number(this.url.split('/').at(-1)) === options.failPartAlways) { this.onerror(); return }
        if (!failedOnce && Number(this.url.split('/').at(-1)) === options.failPartOnce) { failedOnce = true; this.onerror(); return }
        this.upload.onprogress?.({ lengthComputable: true, loaded: body.size })
        this.onload()
      }
    },
  })
  vm.runInContext(bundled, context)
  const client = context.multipart
  const file = (size: number) => ({ size, name: 'long.mp4', type: 'video/mp4', lastModified: 123, slice: (start: number, end: number) => ({ size: end - start }) })
  return { client, file, chunks, signedParts, requests, cache }
}

test('114 MiB follows the real three-part upload and completion path', async () => {
  const h = harness()
  await h.client.uploadProjectSourceMultipart({ file: h.file(114 * 1024 * 1024), projectId: 'project' })
  assert.deepEqual(h.chunks, [50, 50, 14].map(mb => mb * 1024 * 1024))
  assert.equal(h.requests.at(-1)!.body.parts.length, 3)
})

test('a simulated 4 GiB file runs through 82 bounded chunks and completes', async () => {
  const h = harness()
  const size = 4 * 1024 ** 3
  await h.client.uploadProjectSourceMultipart({ file: h.file(size), projectId: 'project' })
  assert.equal(h.chunks.length, 82)
  assert.equal(h.chunks.reduce((a, b) => a + b, 0), size)
  assert.ok(h.chunks.every(bytes => bytes <= 50 * 1024 * 1024))
})

test('a failed part is retried without uploading completed parts again', async () => {
  const h = harness({ failPartOnce: 2 })
  await h.client.uploadProjectSourceMultipart({ file: h.file(114 * 1024 * 1024), projectId: 'project' })
  assert.deepEqual(h.signedParts, [1, 2, 2, 3])
})

test('the server-issued chunk size controls the uploaded byte ranges', async () => {
  const h = harness({ serverPartSize: 10 * 1024 * 1024 })
  await h.client.uploadProjectSourceMultipart({ file: h.file(114 * 1024 * 1024), projectId: 'project' })
  assert.equal(h.chunks.length, 12)
  assert.ok(h.chunks.every(bytes => bytes <= 10 * 1024 * 1024))
})

test('API failure codes survive the client boundary for actionable upload errors', async () => {
  const h = harness({ initiateFailure: true })
  await assert.rejects(h.client.uploadProjectSourceMultipart({ file: h.file(114 * 1024 * 1024), projectId: 'project' }), (error: any) => {
    assert.equal(error.code, 'STORAGE_QUOTA_EXCEEDED')
    assert.equal(error.retryable, false)
    assert.equal(error.status, 413)
    return true
  })
})

test('a verified checkpoint retries registration without transferring the video again', async () => {
  const h = harness()
  const file = h.file(114 * 1024 * 1024)
  const first = await h.client.uploadProjectSourceMultipart({ file, projectId: 'project', retainCompletedSession: true })
  assert.equal(h.cache.size, 1)
  const requestCount = h.requests.length
  const resumed = await h.client.uploadProjectSourceMultipart({ file, projectId: 'project', assetId: randomUUID(), retainCompletedSession: true })
  assert.equal(resumed.asset.id, first.asset.id)
  assert.equal(h.requests.length, requestCount, 'verified bytes must not be uploaded or completed twice')
  assert.equal(h.chunks.length, 3)
  await h.client.clearResumableSessionForFile(file, 'project')
  assert.equal(h.cache.size, 0)
})

test('an interrupted upload resumes at the first unfinished part with its original identity', async () => {
  const transport: { failPartAlways?: number } = { failPartAlways: 2 }
  const h = harness(transport)
  const file = h.file(114 * 1024 * 1024)
  await assert.rejects(h.client.uploadProjectSourceMultipart({ file, projectId: 'project' }), /Network error/)
  const initialAssetId = h.requests[0].body.assetId
  assert.equal(h.cache.size, 1)
  transport.failPartAlways = undefined
  const start = h.signedParts.length
  const resumed = await h.client.uploadProjectSourceMultipart({ file, projectId: 'project' })
  assert.deepEqual(h.signedParts.slice(start), [2, 3])
  assert.equal(resumed.asset.id, initialAssetId)
  assert.equal(h.requests.filter(request => request.endpoint.endsWith('/initiate')).length, 1)
})

test('retrying before the first part succeeds reuses the reservation instead of consuming quota again', async () => {
  const transport: { failPartAlways?: number } = { failPartAlways: 1 }
  const h = harness(transport)
  const file = h.file(114 * 1024 * 1024)
  await assert.rejects(h.client.uploadProjectSourceMultipart({ file, projectId: 'project' }), /Network error/)
  const initialAssetId = h.requests[0].body.assetId
  assert.equal([...h.cache.values()][0].uploadedParts.length, 0)
  transport.failPartAlways = undefined
  const resumed = await h.client.uploadProjectSourceMultipart({ file, projectId: 'project', assetId: randomUUID() })
  assert.equal(resumed.asset.id, initialAssetId, 'the original zero-part reservation still owns this upload')
  assert.equal(h.requests.filter(request => request.endpoint.endsWith('/initiate')).length, 1, 'retry must not add another storage reservation')
})

test('a terminal session error is surfaced without futile signing retries', async () => {
  const h = harness({ signFailure: true })
  await assert.rejects(h.client.uploadProjectSourceMultipart({ file: h.file(114 * 1024 * 1024), projectId: 'project' }), /no longer active/)
  assert.equal(h.signedParts.length, 1)
  assert.equal(h.chunks.length, 0)
})

test('an unreadable ETag cannot be mistaken for a completed upload', async () => {
  const h = harness({ missingEtag: true })
  await assert.rejects(h.client.uploadProjectSourceMultipart({ file: h.file(114 * 1024 * 1024), projectId: 'project' }), /ETag/)
  assert.equal(h.requests.filter(request => request.endpoint.endsWith('/complete')).length, 0)
})
