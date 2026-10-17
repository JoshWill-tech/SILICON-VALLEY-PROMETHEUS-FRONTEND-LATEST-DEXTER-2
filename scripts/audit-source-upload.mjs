import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('@next/env').loadEnvConfig(process.cwd())
const { S3Client, GetBucketCorsCommand, GetBucketLifecycleConfigurationCommand, ListMultipartUploadsCommand, ListPartsCommand, ListObjectsV2Command, UploadPartCommand } = await import('@aws-sdk/client-s3')
const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

function safeError(error) {
  return { name: error?.name, status: error?.$metadata?.httpStatusCode, message: error instanceof Error ? error.message : String(error) }
}

for (const suffix of ['', '_3', '_2']) {
  const accountId = process.env[`R2_ACCOUNT_ID${suffix}`]?.trim()
  const accessKeyId = process.env[`R2_ACCESS_KEY_ID${suffix}`]?.trim()
  const secretAccessKey = process.env[`R2_SECRET_ACCESS_KEY${suffix}`]?.trim()
  const bucket = process.env[`R2_BUCKET_SOURCES${suffix}`]?.trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) continue
  const client = new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, maxAttempts: 1 })
  console.log(JSON.stringify({ section: 'r2', configuration: suffix || 'primary', bucket }))
  for (const [name, command, summarize] of [
    ['cors', new GetBucketCorsCommand({ Bucket: bucket }), value => value.CORSRules],
    ['lifecycle', new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }), value => value.Rules],
    ['incompleteUploads', new ListMultipartUploadsCommand({ Bucket: bucket, MaxUploads: 20 }), value => ({ count: value.Uploads?.length ?? 0, truncated: value.IsTruncated, initiated: value.Uploads?.map(upload => upload.Initiated) })],
    ['objectSample', new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 10 }), value => ({ count: value.KeyCount, truncated: value.IsTruncated, objects: value.Contents?.map(object => ({ size: object.Size, modified: object.LastModified })) })],
  ]) {
    try { console.log(JSON.stringify({ check: name, result: summarize(await client.send(command)) })) }
    catch (error) { console.log(JSON.stringify({ check: name, error: safeError(error) })) }
  }
  if (suffix === '') {
    const pending = await client.send(new ListMultipartUploadsCommand({ Bucket: bucket, MaxUploads: 100 })).catch(() => null)
    for (const upload of (pending?.Uploads ?? []).sort((a, b) => new Date(b.Initiated) - new Date(a.Initiated)).slice(0, 5)) {
      try {
        const parts = await client.send(new ListPartsCommand({ Bucket: bucket, Key: upload.Key, UploadId: upload.UploadId }))
        console.log(JSON.stringify({ check: 'recentUploadParts', initiated: upload.Initiated, parts: parts.Parts?.map(part => ({ number: part.PartNumber, size: part.Size })), totalUploadedBytes: (parts.Parts ?? []).reduce((sum, part) => sum + Number(part.Size ?? 0), 0) }))
      } catch (error) { console.log(JSON.stringify({ check: 'recentUploadParts', error: safeError(error) })) }
    }
    const upload = pending?.Uploads?.[0]
    if (upload) {
      const url = await getSignedUrl(client, new UploadPartCommand({ Bucket: bucket, Key: upload.Key, UploadId: upload.UploadId, PartNumber: 1 }), { expiresIn: 60 })
      for (const origin of ['http://localhost:3000', 'http://localhost:3001', 'https://prometheusstudio.tech', 'https://www.prometheusstudio.tech']) {
        try {
          const response = await fetch(url, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type' }, signal: AbortSignal.timeout(15000) })
          console.log(JSON.stringify({ check: 'browserPreflight', origin, status: response.status, allowOrigin: response.headers.get('access-control-allow-origin'), allowMethods: response.headers.get('access-control-allow-methods'), allowHeaders: response.headers.get('access-control-allow-headers'), exposeHeaders: response.headers.get('access-control-expose-headers') }))
        } catch (error) { console.log(JSON.stringify({ check: 'browserPreflight', origin, error: safeError(error) })) }
      }
    }
  }
  client.destroy()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim()
if (supabaseUrl && anonKey) {
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' }
  const probes = [
    ['/rest/v1/source_upload_sessions?select=id&limit=0', undefined],
    ['/rest/v1/rpc/maul_reserve_source_upload', { p_project_id: '00000000-0000-4000-8000-000000000000', p_asset_id: '00000000-0000-4000-8000-000000000000', p_client_request_id: '00000000-0000-4000-8000-000000000000', p_filename: 'diagnostic.mp4', p_mime_type: 'video/mp4', p_size_bytes: 114 * 1024 * 1024, p_bucket: 'diagnostic', p_object_key: 'diagnostic', p_expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString() }],
  ]
  for (const [path, body] of probes) {
    try {
      const response = await fetch(`${supabaseUrl}${path}`, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) })
      const result = await response.json()
      console.log(JSON.stringify({ section: 'databaseReadiness', check: path.split('?')[0], status: response.status, result }))
    } catch (error) { console.log(JSON.stringify({ section: 'databaseReadiness', error: safeError(error) })) }
  }
}
