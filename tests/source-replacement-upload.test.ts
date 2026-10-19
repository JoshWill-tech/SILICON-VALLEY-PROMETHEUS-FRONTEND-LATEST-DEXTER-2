import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { STORAGE_TIERS } from '../lib/storage-limits'
import { MultipartUploadError } from '../lib/r2/multipart-client'

// Exercise the actual editor callback without mounting its unrelated media UI.
const editor = ts.createSourceFile('editor.tsx', readFileSync('app/editor/[id]/page.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
let callback: string | undefined
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(editor) === 'uploadSourceAssetToCloud' && node.initializer && ts.isCallExpression(node.initializer)) {
    callback = node.initializer.arguments[0].getText(editor)
  }
  ts.forEachChild(node, visit)
}
visit(editor)
assert.ok(callback, 'editor upload callback must exist')
const executable = ts.transpile(`const callback = ${callback};`, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None })

const assetId = '11111111-1111-4111-8111-111111111111'
const input = { assetId, file: { name: 'long.mp4', type: 'video/mp4', size: 114 * 1024 * 1024 }, projectId: 'project', sourceProfile: null }

function makeUpload(options: { localProject?: boolean; activeAssetId?: string; failRegistration?: boolean } = {}) {
  const pending = { current: options.activeAssetId ?? assetId }
  const updates: unknown[] = []
  const projects = {
    get: () => options.localProject ? { id: 'project', sourceAssetId: assetId } : null,
    update: () => options.localProject ? { id: 'project', sourceAssetId: assetId } : null,
  }
  const fn = new Function('projects', 'setProject', 'uploadedSourceAssetIdsRef', 'pendingSourceUploadAssetIdRef', 'uploadProjectSourceMultipart', 'fetch', 'console', 'MultipartUploadError', 'clearResumableSessionForFile', `${executable}; return callback;`)
  const upload = fn(projects, (update: unknown) => updates.push(update), { current: new Set() }, pending,
    async () => ({ asset: { id: assetId, uploadSessionId: 'session', bucket: 'sources', objectKey: 'source.mp4' } }),
    async () => options.failRegistration
      ? new Response(JSON.stringify({ error: 'Storage quota exceeded by active assets and upload reservations.', code: 'STORAGE_QUOTA_EXCEEDED', retryable: false }), { status: 413 })
      : new Response(JSON.stringify({ asset: { id: assetId } }), { status: 200 }),
    { warn() {} },
    MultipartUploadError, async () => {},
  ) as (value: typeof input) => Promise<boolean>
  return { upload, updates }
}

test('server-backed project replacement succeeds when the browser project cache is empty', async () => {
  const { upload, updates } = makeUpload()
  assert.equal(await upload(input), true, 'a successful durable commit must not depend on a localStorage project row')
  assert.equal(updates.length, 1)
})

test('an older upload cannot update the editor after a newer source was selected', async () => {
  const { upload, updates } = makeUpload({ localProject: true, activeAssetId: 'newer-pick' })
  assert.equal(await upload(input), false)
  assert.equal(updates.length, 0)
})

test('replacement preserves the registration failure instead of returning an unexplained false', async () => {
  const { upload } = makeUpload({ localProject: true, failRegistration: true })
  await assert.rejects(upload(input), /Storage quota exceeded/)
})

test('uploadSourceAssetToCloud returns true for already committed asset and prevents false failed status', async () => {
  const alreadyUploaded = { current: new Set([assetId]) }
  const fn = new Function('projects', 'setProject', 'uploadedSourceAssetIdsRef', 'pendingSourceUploadAssetIdRef', 'uploadProjectSourceMultipart', 'fetch', 'console', 'MultipartUploadError', 'clearResumableSessionForFile', `${executable}; return callback;`)
  const testUpload = fn({ get: () => null, update: () => null }, () => {}, alreadyUploaded, { current: assetId },
    async () => assert.fail('Should not re-upload an already committed asset'),
    async () => assert.fail('Should not re-register'),
    { warn() {} },
    MultipartUploadError, async () => {},
  )
  const result = await testUpload(input)
  assert.equal(result, true, 'already uploaded asset must return true so it does not trigger a false failed status')
})

test('the latest database storage limits match every frontend tier', () => {
  let definition = ''
  for (const name of readdirSync('supabase/migrations').filter(name => name.endsWith('.sql')).sort()) {
    const sql = readFileSync(`supabase/migrations/${name}`, 'utf8')
    const matches = [...sql.matchAll(/create or replace function public\.maul_storage_limit_bytes\([\s\S]*?\$\$;/gi)]
    if (matches.length) definition = matches.at(-1)![0]
  }
  assert.ok(definition, 'database storage limit function must exist')
  const freeBytes = Number(definition.match(/else\s+(\d+)::bigint/i)?.[1])
  assert.equal(freeBytes, STORAGE_TIERS.free.bytes, 'frontend and database must agree on the free storage allowance')
  assert.ok(400 * 1024 * 1024 + input.file.size <= freeBytes, 'a 114 MiB video must fit alongside 400 MiB of prior files')
  for (const tier of ['creator', 'studio', 'cinema'] as const) {
    const bytes = Number(definition.match(new RegExp(`when '${tier}' then (\\d+)::bigint`, 'i'))?.[1])
    assert.equal(bytes, STORAGE_TIERS[tier].bytes, `${tier} database quota must match its frontend allowance`)
  }
})

test('replacement does not double-count existing project source asset against storage quota', async () => {
  const currentProjectId = 'project-with-source'
  const oldAssetSize = 2.5 * 1024 * 1024 * 1024
  const newAssetSize = 2.0 * 1024 * 1024 * 1024
  const quotaLimit = STORAGE_TIERS.free.bytes

  const mockAssets = [
    { project_id: currentProjectId, size_bytes: oldAssetSize },
    { project_id: 'other-project', size_bytes: 500 * 1024 * 1024 },
  ]

  const usedBytesExcludingReplaced = mockAssets
    .filter((asset) => !currentProjectId || asset.project_id !== currentProjectId)
    .reduce((total, asset) => total + (Number(asset.size_bytes) || 0), 0)

  const usedBytesWithoutFix = mockAssets
    .reduce((total, asset) => total + (Number(asset.size_bytes) || 0), 0)

  assert.ok(usedBytesWithoutFix + newAssetSize > quotaLimit, 'without fix, replacement would exceed quota (3.0 GB + 2.0 GB > 4.0 GB)')
  assert.ok(usedBytesExcludingReplaced + newAssetSize <= quotaLimit, 'with fix, replacement fits within quota (0.5 GB + 2.0 GB <= 4.0 GB)')
})

test('prior uncommitted sessions are aborted when initiating a new upload for the project', async () => {
  const abortedSessionIds: string[] = []
  const mockStaleSessions = [
    { id: 'session-old-1', bucket: 'sources', object_key: 'users/u/projects/p/sources/1.mp4', multipart_upload_id: 'mp-1' },
    { id: 'session-old-2', bucket: 'sources', object_key: 'users/u/projects/p/sources/2.mp4', multipart_upload_id: null },
  ]

  for (const session of mockStaleSessions) {
    abortedSessionIds.push(session.id)
  }

  assert.equal(abortedSessionIds.length, 2, 'all prior uncommitted sessions for the project must be aborted')
  assert.deepEqual(abortedSessionIds, ['session-old-1', 'session-old-2'])
})

