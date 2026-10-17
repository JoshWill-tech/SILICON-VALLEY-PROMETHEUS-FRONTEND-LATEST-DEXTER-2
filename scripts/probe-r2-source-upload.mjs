import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('@next/env').loadEnvConfig(process.cwd())
const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, HeadObjectCommand, AbortMultipartUploadCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3')
const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
const requestedMiB = Number(process.argv[2] || 114)
assert.ok(Number.isInteger(requestedMiB) && requestedMiB > 0 && requestedMiB <= 4096, 'probe size must be 1 through 4096 MiB')
const origin = process.argv[3] || 'http://localhost:3000'
assert.ok(['http://localhost:3000', 'http://localhost:3001', 'https://prometheusstudio.tech', 'https://www.prometheusstudio.tech'].includes(origin), 'use a known frontend origin')
const accountId = process.env.R2_ACCOUNT_ID?.trim()
const bucket = process.env.R2_BUCKET_SOURCES?.trim()
assert.ok(accountId && bucket && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY, 'primary R2 configuration must be complete')
const client = new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(), secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim() }, maxAttempts: 2 })
// This command only creates and cleans up its own unique diagnostic object.
const key = `_diagnostics/source-upload/${randomUUID()}.bin`
let uploadId
let completed = false
const startedAt = Date.now()
try {
  const created = await client.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key, ContentType: 'video/mp4', Metadata: { diagnostic: 'large-source-upload', 'size-bytes': String(requestedMiB * 1024 * 1024) } }))
  uploadId = created.UploadId
  assert.ok(uploadId)
  const parts = []
  for (let offsetMiB = 0, partNumber = 1; offsetMiB < requestedMiB; offsetMiB += 50, partNumber++) {
    const size = Math.min(50, requestedMiB - offsetMiB) * 1024 * 1024
    const url = await getSignedUrl(client, new UploadPartCommand({ Bucket: bucket, Key: key, UploadId: uploadId, PartNumber: partNumber }), { expiresIn: 900 })
    if (partNumber === 1) {
      const preflight = await fetch(url, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type' }, signal: AbortSignal.timeout(20000) })
      assert.ok(preflight.status === 200 || preflight.status === 204, `preflight failed for ${origin}: HTTP ${preflight.status}`)
      assert.ok([origin, '*'].includes(preflight.headers.get('access-control-allow-origin')), `CORS does not allow ${origin}`)
    }
    const response = await fetch(url, { method: 'PUT', headers: { Origin: origin, 'Content-Type': 'video/mp4' }, body: Buffer.alloc(size, partNumber % 251), signal: AbortSignal.timeout(600000) })
    assert.equal(response.status, 200, `part ${partNumber} failed: ${response.ok ? '' : await response.text()}`)
    assert.ok([origin, '*'].includes(response.headers.get('access-control-allow-origin')), 'PUT response must allow the browser origin')
    assert.match(response.headers.get('access-control-expose-headers') ?? '', /etag/i, 'browser must be able to read the uploaded part ETag')
    const ETag = response.headers.get('etag')
    assert.ok(ETag)
    parts.push({ ETag, PartNumber: partNumber })
    console.log(JSON.stringify({ stage: 'partUploaded', partNumber, bytes: size, uploadedMiB: Math.min(offsetMiB + 50, requestedMiB) }))
  }
  await client.send(new CompleteMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId, MultipartUpload: { Parts: parts } }))
  completed = true
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  assert.equal(Number(head.ContentLength), requestedMiB * 1024 * 1024)
  assert.equal(head.Metadata?.['size-bytes'], String(requestedMiB * 1024 * 1024))
  console.log(JSON.stringify({ result: 'R2_SOURCE_PROBE_PASSED', bytes: Number(head.ContentLength), partCount: parts.length, origin, elapsedSeconds: Math.round((Date.now() - startedAt) / 1000) }))
} finally {
  if (completed) await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  else if (uploadId) await client.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId }))
  console.log('R2_SOURCE_PROBE_CLEANUP_COMPLETE')
  client.destroy()
}
