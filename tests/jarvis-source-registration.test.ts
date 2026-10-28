import assert from 'node:assert/strict'
import {readFileSync, existsSync} from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

type Row = Record<string, any>
const projectId = '11111111-1111-4111-8111-111111111111'
const sourceId = '22222222-2222-4222-8222-222222222222'
const userId = 'owner'

function savedAsset(patch: Row = {}): Row {
  return {id: sourceId, project_id: projectId, user_id: userId, storage_path: 'saved-source.mp4',
    storage_bucket: 'sources', mime_type: 'video/mp4', duration_ms: 10000,
    created_at: '2026-10-20T00:00:00Z', source_revisions: [], ...patch}
}

// Run the real project service and export route against the same records.
// Database fixtures apply actual query filters, including ownership and joins.
function scenario({pointer = null, assets = [savedAsset()], assetError = false}: {
  pointer?: string | null; assets?: Row[]; assetError?: boolean
} = {}) {
  const dispatches: Row[] = []
  class Query implements PromiseLike<{data: Row[] | null; error: Row | null}> {
    filters: ((row: Row) => boolean)[] = []
    columns = '*'
    maximum = Infinity
    descending = false
    constructor(readonly table: string) {}
    select(columns = '*') {this.columns = columns; return this}
    eq(key: string, value: unknown) {
      this.filters.push(row => key === 'source_revisions.state'
        ? row.source_revisions?.some((revision: Row) => revision.state === value)
        : row[key] === value)
      return this
    }
    is(key: string, value: unknown) {
      this.filters.push(row => key === 'source_revisions' ? !row.source_revisions?.length : row[key] === value)
      return this
    }
    order(_key: string, options: {ascending?: boolean}) {this.descending = options.ascending === false; return this}
    limit(count: number) {this.maximum = count; return this}
    update() {return this}
    result() {
      if (this.table === 'source_assets' && assetError) return {data: null, error: {message: 'Source lookup unavailable'}}
      let rows = this.table === 'projects'
        ? [{id: projectId, user_id: userId, source_asset_id: pointer, name: 'Saved project', editor_state: {}}]
        : this.table === 'source_assets' ? assets
          : this.table === 'project_exports' ? [{id: 'export', user_id: userId, status: 'pending', metadata: {miniRunJobId: 'job'}}] : []
      rows = rows.filter(row => this.filters.every(filter => filter(row)))
      if (this.columns.includes('source_revisions!inner')) rows = rows.filter(row => row.source_revisions?.length)
      if (this.descending) rows = [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      return {data: rows.slice(0, this.maximum), error: null}
    }
    async maybeSingle() {const result = this.result(); return {...result, data: result.data?.[0] ?? null}}
    async single() {return this.maybeSingle()}
    then<T1, T2>(ok?: ((value: ReturnType<Query['result']>) => T1 | PromiseLike<T1>) | null,
      fail?: ((reason: unknown) => T2 | PromiseLike<T2>) | null): PromiseLike<T1 | T2> {
      return Promise.resolve(this.result()).then(ok, fail)
    }
  }
  const db = {
    auth: {
      getUser: async () => ({data: {user: {id: userId}}, error: null}),
      getSession: async () => ({data: {session: {access_token: 'test-session'}}, error: null}),
    },
    from: (table: string) => new Query(table),
  }
  const mocks: Row = {
    'server-only': {},
    'next/server': {NextResponse: {json: (body: unknown, options?: ResponseInit) => Response.json(body, options)}},
    'next/headers': {},
    '@/lib/supabase/server': {createClient: async () => db},
    '@/lib/supabase/dev-bypass': {isDevBypassActive: () => false},
    '@/lib/media/source-profile': {normalizeSourceProfile: (profile: unknown) => profile},
    '@/lib/projects/project-list': {},
    '@/lib/workspaces/service': {},
    '@/lib/exports/service': {ExportService: {
      findActiveProjectExport: async () => null,
      createProjectExport: async (_project: string, options: Row) => ({id: 'export', metadata: options.metadata}),
    }},
    '@/lib/server/mini-run-proxy': {resolveMiniRunConfig: () => ({}), getMiniRunEnvironment: () => ({})},
    '@/lib/server/mini-run-dispatch': {dispatchMiniRunRender: async (input: Row) => {
      dispatches.push(input)
      return {jobId: 'job', pipelineJobId: 'pipeline', status: 'queued'}
    }, extractExportDirectives: () => ({})},
  }
  function load(path: string): Row {
    const exports = {}
    const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS},
    }).outputText
    vm.runInNewContext(compiled, {exports, Response, Request, crypto, console,
      process: {env: {}}, require(name: string) {
        if (name in mocks) return mocks[name]
        if (name.startsWith('@/') && existsSync(`${name.slice(2)}.ts`)) return load(`${name.slice(2)}.ts`)
        throw new Error(`Unexpected dependency ${name}`)
      }}, {filename: path})
    return exports
  }
  const {ProjectService} = load('lib/projects/service.ts')
  const route = load('app/api/projects/[id]/exports/route.ts')
  const context = {params: Promise.resolve({id: projectId})}
  return {
    dispatches,
    editorProject: () => ProjectService.getProject(projectId),
    readiness: async () => (await route.GET(new Request('http://localhost'), context)).json(),
    submit: (id = sourceId) => route.POST(new Request('http://localhost', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({sourceAssetId: id}),
    }), context) as Promise<Response>,
  }
}

test('Jarvis recognizes the same legacy saved source that the editor recovered', async () => {
  const current = scenario()
  const project = await current.editorProject()
  assert.equal(project.sourceAssetId, sourceId)
  const {readiness} = await current.readiness()
  assert.equal(readiness.sourceAssetId, project.sourceAssetId)
  assert.equal(readiness.sourceCheckStatus, 'ready')
  assert.equal(readiness.sourceReady, true)
})

test('the editor recovered source can reach the real export route and dispatcher', async () => {
  const current = scenario()
  const project = await current.editorProject()
  const response = await current.submit(project.sourceAssetId)
  assert.equal(response.status, 202, JSON.stringify(await response.clone().json()))
  assert.equal(current.dispatches.length, 1)
  assert.equal(current.dispatches[0].request.sourceAssetId, project.sourceAssetId)
  assert.equal(current.dispatches[0].request.storagePath, 'saved-source.mp4')
})

test('an explicit current source continues to submit normally', async () => {
  const current = scenario({pointer: sourceId})
  assert.equal((await current.readiness()).readiness.sourceReady, true)
  assert.equal((await current.submit()).status, 202)
  assert.equal(current.dispatches.length, 1)
})

test('source recovery never borrows another account or project asset', async () => {
  for (const asset of [savedAsset({user_id: 'other'}), savedAsset({project_id: 'other'})]) {
    const current = scenario({assets: [asset]})
    assert.equal((await current.editorProject()).sourceAssetId, null)
    assert.equal((await current.readiness()).readiness.sourceReady, false)
    assert.notEqual((await current.submit()).status, 202)
    assert.equal(current.dispatches.length, 0)
  }
})

test('an explicit pointer is authoritative over newer historical assets', async () => {
  const current = scenario({pointer: sourceId, assets: [savedAsset(), savedAsset({id: 'newer-history', created_at: '2026-10-22T00:00:00Z'})]})
  assert.equal((await current.editorProject()).sourceAssetId, sourceId)
  assert.equal((await current.readiness()).readiness.sourceAssetId, sourceId)
  assert.equal((await current.submit('newer-history')).status, 409)
  assert.equal(current.dispatches.length, 0)
})

test('a lost pointer recovers the current revision rather than superseded history', async () => {
  const current = scenario({assets: [
    savedAsset({source_revisions: [{state: 'current'}]}),
    savedAsset({id: 'history', created_at: '2026-10-22T00:00:00Z', source_revisions: [{state: 'superseded'}]}),
  ]})
  assert.equal((await current.editorProject()).sourceAssetId, sourceId)
  assert.equal((await current.readiness()).readiness.sourceAssetId, sourceId)
})

test('superseded revisions cannot be revived as a legacy source', async () => {
  const current = scenario({assets: [savedAsset({source_revisions: [{state: 'superseded'}]})]})
  assert.equal((await current.editorProject()).sourceAssetId, null)
  assert.equal((await current.readiness()).readiness.sourceReady, false)
  assert.notEqual((await current.submit()).status, 202)
})

test('failed recovery queries report an unconfirmed source rather than missing media', async () => {
  const current = scenario({assetError: true})
  const {readiness} = await current.readiness()
  assert.equal(readiness.sourceCheckStatus, 'unconfirmed')
  assert.equal(readiness.sourceReady, false)
  assert.equal((await current.submit()).status, 503)
  assert.equal(current.dispatches.length, 0)
})
