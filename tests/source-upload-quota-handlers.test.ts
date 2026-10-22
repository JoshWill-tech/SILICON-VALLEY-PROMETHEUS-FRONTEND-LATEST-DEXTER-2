import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import * as storageLimits from '../lib/storage-limits'

// Execute production handlers; replace only their external database/R2/runtime
// boundaries. Fixtures honor query filters so workspace scoping is observable.
type Row = Record<string, unknown>
type DbResult = { data: Row[] | null; error: { message: string } | null }
type Options = {
  sessions?: Row[]
  assets?: Row[]
  abortError?: string
  abortStatus?: string
  queryError?: string
  reserveQuotaError?: boolean
}
const projectId = '11111111-1111-4111-8111-111111111111'
const otherProjectId = '22222222-2222-4222-8222-222222222222'
const GiB = 1024 ** 3

function load<T>(path: string, dependencies: Record<string, unknown>): T {
  const exports = {}
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  vm.runInNewContext(code, {
    exports, Request, Response, URL, crypto: { randomUUID },
    process: { env: { R2_BUCKET_SOURCES: 'sources' } },
    console: { error() {}, warn() {} },
    require(name: string) {
      assert.ok(name in dependencies, `unexpected dependency ${name} in ${path}`)
      return dependencies[name]
    },
  }, { filename: path })
  return exports as T
}

function session(overrides: Row = {}): Row {
  return {
    id: 'pending', user_id: 'user', project_id: projectId, asset_id: 'old-asset',
    status: 'uploading', expected_size_bytes: GiB, bucket: 'sources',
    object_key: 'source.mp4', multipart_upload_id: 'multipart',
    expires_at: new Date(Date.now() + 3600000).toISOString(), ...overrides,
  }
}

function harness(options: Options = {}) {
  const sessions = (options.sessions ?? []).map(row => ({ ...row }))
  const rpcCalls: { name: string; args: Row }[] = []
  const r2Calls: { kind: string; input: Row }[] = []
  class Query implements PromiseLike<DbResult> {
    filters: ((row: Row) => boolean)[] = []
    selection = ''
    constructor(readonly table: string) {}
    select(columns: string) { this.selection = columns; return this }
    eq(key: string, value: unknown) {
      this.filters.push(row => {
        if (key === 'source_revisions.state') {
          return Array.isArray(row.source_revisions)
            && row.source_revisions.some((revision: Row) => revision.state === value)
        }
        return row[key] === value
      })
      return this
    }
    neq(key: string, value: unknown) { this.filters.push(row => row[key] !== value); return this }
    in(key: string, values: unknown[]) { this.filters.push(row => values.includes(row[key])); return this }
    lte(key: string, value: string) { this.filters.push(row => String(row[key]) <= value); return this }
    order() { return this }
    limit() { return this }
    result(): DbResult {
      if (options.queryError === this.table) return { data: null, error: { message: 'database query failed' } }
      let rows = this.table === 'source_upload_sessions' ? sessions
        : this.table === 'source_assets' ? options.assets ?? [] : []
      if (this.selection.includes('source_revisions!inner')) {
        rows = rows.filter(row => Array.isArray(row.source_revisions) && row.source_revisions.length > 0)
      }
      return { data: rows.filter(row => this.filters.every(filter => filter(row))), error: null }
    }
    async maybeSingle() { const result = this.result(); return { ...result, data: result.data?.[0] ?? null } }
    then<T1 = DbResult, T2 = never>(
      fulfilled?: ((value: DbResult) => T1 | PromiseLike<T1>) | null,
      rejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
    ): PromiseLike<T1 | T2> { return Promise.resolve(this.result()).then(fulfilled, rejected) }
  }
  const current = session({ id: 'current-session', asset_id: 'new-asset' })
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) },
    from: (table: string) => new Query(table),
    async rpc(name: string, args: Row) {
      rpcCalls.push({ name, args })
      if (name === 'maul_abort_source_upload') {
        if (options.abortError) return { data: null, error: { message: options.abortError } }
        const row = sessions.find(item => item.id === args.p_session_id)
        assert.ok(row, 'abort must address a fixture session')
        row.status = options.abortStatus ?? 'aborted'
        return { data: row, error: null }
      }
      assert.equal(name, 'maul_reserve_source_upload')
      return options.reserveQuotaError
        ? { data: null, error: { message: 'STORAGE_QUOTA_EXCEEDED', details: '{"limitBytes":524288000}' } }
        : { data: current, error: null }
    },
  }
  class AbortMultipartUploadCommand { kind = 'abort'; constructor(readonly input: Row) {} }
  class CreateMultipartUploadCommand { kind = 'create'; constructor(readonly input: Row) {} }
  const common = {
    'next/server': { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } },
    '@aws-sdk/client-s3': { AbortMultipartUploadCommand, CreateMultipartUploadCommand },
    '@/lib/r2/client': { r2Client: { send: async (command: { kind: string; input: Row }) => {
      r2Calls.push(command)
      return {}
    } } },
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/supabase/dev-bypass': { isDevBypassActive: () => false },
  }
  const cleanup = load<{ POST: (request: Request) => Promise<Response> }>(
    'app/api/user/storage/cleanup/route.ts', common,
  )
  const errors = load('lib/api/source-control-plane-errors.ts', common)
  const context = { assetId: 'new-asset', projectId, userId: 'user', filename: 'video.mp4', contentType: 'video/mp4', sizeBytes: GiB, bucket: 'sources', key: 'source.mp4' }
  const initiate = load<{ POST: (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response> }>(
    'app/api/projects/[id]/upload-multipart/initiate/route.ts', {
      ...common,
      '@/lib/api/source-control-plane-errors': errors,
      '@/lib/r2/project-source-multipart': {
        PROJECT_SOURCE_MULTIPART_PART_SIZE: 50 * 1024 ** 2,
        requireProjectSourceUploadContext: async () => context,
      },
    },
  )
  const uploadContext = load<{ requireProjectSourceUploadContext: (id: string, input: Row) => Promise<Row> }>(
    'lib/r2/project-source-multipart.ts', {
      ...common,
      '@/lib/projects/service': { ProjectService: { getProject: async () => ({ id: projectId }) } },
      '@/lib/r2/keys': { R2Keys: { sourceAsset: () => 'source.mp4' } },
      '@/lib/storage-limits': storageLimits,
    },
  )
  return {
    rpcCalls, r2Calls,
    cleanup: (body?: Row) => cleanup.POST(new Request('http://localhost/api/user/storage/cleanup', {
      method: 'POST', ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
    })),
    initiate: () => initiate.POST(new Request(`http://localhost/api/projects/${projectId}/upload-multipart/initiate`, {
      method: 'POST', body: JSON.stringify({ assetId: 'new-asset', sizeBytes: GiB, filename: 'video.mp4' }),
    }), { params: Promise.resolve({ id: projectId }) }),
    context: (sizeBytes: number, filename = 'video.mp4', contentType = 'video/mp4') =>
      uploadContext.requireProjectSourceUploadContext(projectId, { sizeBytes, filename, contentType }),
  }
}

test('cleanup never claims quota was reclaimed when Supabase returns an abort error', async () => {
  const h = harness({ sessions: [session()], abortError: 'permission denied' })
  const response = await h.cleanup({ projectId })
  const body = await response.json()
  assert.equal(body.clearedSessionsCount, 0)
  assert.equal(body.reclaimedReservationBytes, 0)
  assert.equal(body.success, false)
  assert.equal(response.status, 500)
  assert.equal(h.r2Calls.length, 0, 'an unsuccessful database abort cannot authorize an R2 abort')
})

test('a session committed during cleanup is preserved in R2 and contributes no reclaimed bytes', async () => {
  const h = harness({ sessions: [session()], abortStatus: 'committed' })
  const body = await (await h.cleanup({ projectId })).json()
  assert.equal(body.reclaimedReservationBytes, 0)
  assert.equal(h.r2Calls.length, 0)
})

test('cleanup reports a failed session query rather than successful zero-byte recovery', async () => {
  const h = harness({ queryError: 'source_upload_sessions' })
  const response = await h.cleanup({ projectId })
  assert.equal(response.status, 500)
  assert.equal((await response.json()).success, false)
  assert.equal(h.rpcCalls.length, 0)
})

test('cleanup without a project scope preserves all unexpired uploads', async () => {
  const h = harness({ sessions: [session(), session({ id: 'expired', project_id: otherProjectId, expires_at: '2000-01-01T00:00:00.000Z' })] })
  const body = await (await h.cleanup()).json()
  assert.equal(body.clearedSessionsCount, 1)
  assert.deepEqual(h.rpcCalls.map(call => call.args.p_session_id), ['expired'])
})

test('explicit cleanup aborts only the affected project and counts confirmed releases', async () => {
  const h = harness({ sessions: [session(), session({ id: 'other', project_id: otherProjectId })] })
  const response = await h.cleanup({ projectId })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.clearedSessionsCount, 1)
  assert.equal(body.reclaimedReservationBytes, GiB)
  assert.deepEqual(h.rpcCalls.map(call => call.args.p_session_id), ['pending'])
})

test('initiation does not abort R2 uploads when the database refuses cleanup', async () => {
  const h = harness({ sessions: [session()], abortError: 'database abort failed' })
  assert.equal((await h.initiate()).status, 200)
  assert.equal(h.r2Calls.length, 0)
})

test('initiation preserves a source that commits while its old upload is being cleaned', async () => {
  const h = harness({ sessions: [session()], abortStatus: 'committed' })
  assert.equal((await h.initiate()).status, 200)
  assert.equal(h.r2Calls.length, 0)
})

test('quota recovery never cancels another project to make an upload fit', async () => {
  const h = harness({ sessions: [session({ id: 'other', project_id: otherProjectId })], reserveQuotaError: true })
  const response = await h.initiate()
  assert.equal(response.status, 413)
  assert.equal(h.rpcCalls.filter(call => call.name === 'maul_abort_source_upload').length, 0)
  assert.equal(h.r2Calls.length, 0)
  assert.equal((await response.json()).details, '{"limitBytes":524288000}')
})

test('confirmed superseded uploads in the affected project are still cleaned before initiation', async () => {
  const h = harness({ sessions: [session()] })
  assert.equal((await h.initiate()).status, 200)
  assert.equal(h.rpcCalls[0].name, 'maul_abort_source_upload')
  assert.equal(h.r2Calls.length, 1)
})

test('upload preflight excludes superseded sources from other projects', async () => {
  const h = harness({ assets: [
    { user_id: 'user', project_id: otherProjectId, size_bytes: 3.5 * GiB, source_revisions: [{ state: 'superseded' }] },
    { user_id: 'user', project_id: otherProjectId, size_bytes: 0.5 * GiB, source_revisions: [{ state: 'current' }] },
  ] })
  assert.equal((await h.context(GiB)).error, undefined)
})

test('upload preflight still rejects real active-source exhaustion', async () => {
  const h = harness({ assets: [
    { user_id: 'user', project_id: otherProjectId, size_bytes: 3.5 * GiB, source_revisions: [{ state: 'current' }] },
  ] })
  assert.equal((await h.context(GiB)).status, 413)
})

test('replacement preflight excludes the affected project current source', async () => {
  const h = harness({ assets: [
    { user_id: 'user', project_id: projectId, size_bytes: 3.5 * GiB, source_revisions: [{ state: 'current' }] },
    { user_id: 'user', project_id: otherProjectId, size_bytes: 0.5 * GiB, source_revisions: [{ state: 'current' }] },
  ] })
  assert.equal((await h.context(2 * GiB)).error, undefined)
})

test('unsupported files produce format errors independently of quota enforcement', async () => {
  const h = harness()
  const result = await h.context(1024, 'notes.txt', 'text/plain')
  assert.equal(result.status, 400)
  assert.match(String(result.error), /Unsupported format/)
  assert.equal(h.rpcCalls.length, 0)
})
