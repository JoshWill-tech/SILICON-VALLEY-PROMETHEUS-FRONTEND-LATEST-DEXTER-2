import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

type Row = Record<string, any>
const projectId = 'proj-subaccount-test-1111'
const ownerId = 'owner-account-user-0001'
const collaboratorSubAccountId = 'subaccount-collab-user-0002'
const sourceAssetId = 'source-asset-uuid-3333'

function mockProject() {
  return {
    id: projectId,
    user_id: ownerId,
    source_asset_id: sourceAssetId,
    name: 'Shared Collaborator Project',
    editor_state: {
      songTitle: 'Test Ambient Beat',
      brollPreference: 'urban',
    },
    source_profile: null,
  }
}

function mockSourceAsset() {
  return {
    id: sourceAssetId,
    project_id: projectId,
    user_id: ownerId, // Uploaded by project owner
    storage_path: 'sources/shared-video.mp4',
    storage_bucket: 'prometheus-sources',
    mime_type: 'video/mp4',
    duration_ms: 25000,
    width: 1080,
    height: 1920,
    created_at: '2026-10-25T00:00:00Z',
    source_revisions: [],
  }
}

function createSubAccountEnvironment() {
  const dispatches: Row[] = []
  const assets = [mockSourceAsset()]
  const project = mockProject()

  class Query implements PromiseLike<{ data: Row[] | Row | null; error: Row | null }> {
    filters: ((row: Row) => boolean)[] = []
    columns = '*'
    maximum = Infinity
    descending = false
    constructor(readonly table: string) {}

    select(columns = '*') {
      this.columns = columns
      return this
    }

    eq(key: string, value: unknown) {
      this.filters.push((row) => {
        if (key === 'source_revisions.state') {
          return row.source_revisions?.some((rev: Row) => rev.state === value)
        }
        return row[key] === value
      })
      return this
    }

    in(key: string, values: unknown[]) {
      this.filters.push((row) => values.includes(row[key]))
      return this
    }

    is(key: string, value: unknown) {
      this.filters.push((row) => key === 'source_revisions' ? !row.source_revisions?.length : row[key] === value)
      return this
    }

    order(_key: string, options: { ascending?: boolean }) {
      this.descending = options.ascending === false
      return this
    }

    limit(count: number) {
      this.maximum = count
      return this
    }

    update() {
      return this
    }

    result() {
      let rows: Row[] = []
      if (this.table === 'projects') {
        rows = [project]
      } else if (this.table === 'source_assets') {
        rows = assets
      } else if (this.table === 'project_exports') {
        rows = [{ id: 'export-collab-1', user_id: collaboratorSubAccountId, status: 'pending', metadata: { miniRunJobId: 'job-collab-1' } }]
      }
      rows = rows.filter((row) => this.filters.every((filter) => filter(row)))
      if (this.descending) rows = [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      return { data: rows.slice(0, this.maximum), error: null }
    }

    async maybeSingle() {
      const res = this.result()
      return { data: (res.data as Row[])?.[0] ?? null, error: null }
    }

    async single() {
      return this.maybeSingle()
    }

    then<T1, T2>(
      ok?: ((value: ReturnType<Query['result']>) => T1 | PromiseLike<T1>) | null,
      fail?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
    ): PromiseLike<T1 | T2> {
      return Promise.resolve(this.result()).then(ok, fail)
    }
  }

  // Client authenticated as the sub-account / collaborator
  const db = {
    auth: {
      getUser: async () => ({ data: { user: { id: collaboratorSubAccountId } }, error: null }),
      getSession: async () => ({ data: { session: { access_token: 'collab-bearer-token' } }, error: null }),
    },
    from: (table: string) => new Query(table),
  }

  const mocks: Row = {
    'server-only': {},
    '@aws-sdk/client-s3': {
      DeleteObjectCommand: class {},
      HeadObjectCommand: class {},
    },
    'next/server': {
      after: (fn: any) => {},
      NextResponse: {
        json: (body: unknown, options?: ResponseInit) => Response.json(body, options),
      },
    },
    'next/headers': {
      cookies: async () => ({
        getAll: () => [],
      }),
    },
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/supabase/dev-bypass': { isDevBypassActive: () => false },
    '@/lib/media/source-profile': { normalizeSourceProfile: (p: unknown) => p },
    '@/lib/projects/project-list': {},
    '@/lib/workspaces/service': {},
    '@/lib/api/source-control-plane-errors': { sourceControlPlaneErrorResponse: (err: any) => Response.json({ error: String(err) }, { status: 400 }) },
    '@/lib/r2/presigned-url': { getPresignedGetUrl: async () => 'https://r2.cloud/sources/shared-video.mp4' },
    '@/lib/r2/client': { r2Client: {} },
    '@/lib/server/source-transcript': { startSourceAssetTranscription: async () => {} },
    '@/lib/exports/service': {
      ExportService: {
        findActiveProjectExport: async () => null,
        createProjectExport: async (_project: string, options: Row) => ({ id: 'export-collab-1', metadata: options.metadata }),
      },
    },
    '@/lib/server/mini-run-proxy': {
      resolveMiniRunConfig: () => ({ baseUrl: 'http://mini-run' }),
      getMiniRunEnvironment: () => ({ MINI_RUN_AWS_API_URL: 'http://mini-run' }),
    },
    '@/lib/server/mini-run-dispatch': {
      dispatchMiniRunRender: async (input: Row) => {
        dispatches.push(input)
        return { jobId: 'job-collab-1', pipelineJobId: 'pipeline-collab-1', status: 'queued' }
      },
      extractExportDirectives: (state: any) => ({
        songTitle: state?.songTitle,
        brollPreference: state?.brollPreference,
      }),
    },
  }

  function load(path: string): Row {
    const exports = {}
    const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText
    vm.runInNewContext(compiled, {
      exports,
      Response,
      Request,
      crypto,
      console,
      process: { env: { MINI_RUN_AWS_API_URL: 'http://mini-run' } },
      require(name: string) {
        if (name in mocks) return mocks[name]
        if (name.startsWith('@/') && existsSync(`${name.slice(2)}.ts`)) return load(`${name.slice(2)}.ts`)
        throw new Error(`Unexpected dependency: ${name}`)
      },
    }, { filename: path })
    return exports
  }

  const exportRoute = load('app/api/projects/[id]/exports/route.ts')
  const assetsRoute = load('app/api/projects/[id]/assets/route.ts')
  const context = { params: Promise.resolve({ id: projectId }) }

  return {
    dispatches,
    getExportReadiness: async () => {
      const res = await exportRoute.GET(new Request('http://localhost'), context)
      return { status: res.status, body: await res.json() }
    },
    submitExportRender: async (sourceId = sourceAssetId) => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer collab-bearer-token' },
        body: JSON.stringify({ sourceAssetId: sourceId, prompt: 'Make it high energy' }),
      })
      const res = await exportRoute.POST(req, context)
      return { status: res.status, body: await res.json() }
    },
    getAssetsRecovery: async () => {
      const req = new Request('http://localhost', {
        method: 'GET',
        headers: { Authorization: 'Bearer collab-bearer-token' },
      })
      const res = await assetsRoute.GET(req, context)
      return { status: res.status, body: await res.json() }
    },
  }
}

test('collaborator/sub-account can inspect export readiness and confirms sourceReady: true', async () => {
  const env = createSubAccountEnvironment()
  const { status, body } = await env.getExportReadiness()
  assert.equal(status, 200)
  assert.equal(body.readiness.sourceReady, true, 'Sub-account must verify sourceReady as true for shared project')
  assert.equal(body.readiness.sourceCheckStatus, 'ready')
  assert.equal(body.readiness.canSubmit, true)
  assert.equal(body.readiness.sourceAssetId, sourceAssetId)
})

test('collaborator/sub-account successfully dispatches final MP4 render without rejection or 502', async () => {
  const env = createSubAccountEnvironment()
  const { status, body } = await env.submitExportRender()
  assert.equal(status, 202, `Expected 202 Accepted, got ${status}: ${JSON.stringify(body)}`)
  assert.equal(body.export.id, 'export-collab-1')
  assert.equal(env.dispatches.length, 1)
  assert.equal(env.dispatches[0].request.sourceAssetId, sourceAssetId)
  assert.equal(env.dispatches[0].request.projectId, projectId)
  assert.equal(env.dispatches[0].request.songTitle, 'Test Ambient Beat')
  assert.equal(env.dispatches[0].request.brollPreference, 'urban')
})

test('collaborator/sub-account recovers cloud video preview URL via /api/projects/[id]/assets', async () => {
  const env = createSubAccountEnvironment()
  const { status, body } = await env.getAssetsRecovery()
  assert.equal(status, 200, `Expected 200 OK from assets route, got ${status}: ${JSON.stringify(body)}`)
  assert.equal(body.success, true)
  assert.equal(body.asset.id, sourceAssetId)
  assert.equal(body.asset.project_id, projectId)
})
