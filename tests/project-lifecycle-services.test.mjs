import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)

function loadModule(path, imports) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  const loaded = { exports: {} }
  const resolve = (name) => Object.hasOwn(imports, name) ? imports[name] : require(name)
  new Function('require', 'module', 'exports', compiled)(resolve, loaded, loaded.exports)
  return loaded.exports
}

function createDatabase(tables) {
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
    from(table) {
      const filters = []
      let selected = '*'
      let sort
      let patch
      const query = {
        select(columns = '*') { selected = columns; return query },
        eq(key, value) { filters.push((row) => row[key] === value); return query },
        in(key, values) { filters.push((row) => values.includes(row[key])); return query },
        order(key, options) { sort = { key, ...options }; return query },
        update(value) { patch = value; return query },
        then(resolve, reject) {
          let rows = tables[table].filter((row) => filters.every((filter) => filter(row)))
          if (patch) rows.forEach((row) => Object.assign(row, patch))
          if (sort) rows = [...rows].sort((first, second) => String(first[sort.key]).localeCompare(String(second[sort.key])) * (sort.ascending ? 1 : -1))
          if (selected !== '*') rows = rows.map((row) => Object.fromEntries(selected.split(',').map((key) => [key.trim(), row[key.trim()]])))
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject)
        },
      }
      return query
    },
  }
}

function fixture() {
  const tables = {
    projects: [1, 2, 3].map((id) => ({ id: `project-${id}`, user_id: 'owner', status: 'draft', source_asset_id: `asset-${id}`, name: `Upload ${id}`, created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z' })),
    durable_jobs: ['pending', 'failed', 'completed'].map((status, index) => ({ project_id: `project-${index + 1}`, user_id: 'owner', type: 'video_analysis', status, progress: 100, created_at: '2026-10-13T00:01:00Z' })),
    project_exports: [],
  }
  const createClient = async () => createDatabase(tables)
  const projectList = loadModule('lib/projects/project-list.ts', {})
  const { ExportService } = loadModule('lib/exports/service.ts', {
    '@/lib/supabase/server': { createClient },
    '@/lib/r2/keys': {},
    '@/lib/r2/copy-object': {},
    '@/lib/server/mini-run-proxy': { resolveMiniRunConfig: () => ({ baseUrl: 'https://backend.example.com' }) },
  })
  const { ProjectService } = loadModule('lib/projects/service.ts', {
    '@/lib/supabase/server': { createClient },
    '@/lib/projects/project-list': projectList,
    '@/lib/exports/service': { ExportService },
    '@/lib/media/source-profile': { normalizeSourceProfile: (profile) => profile },
    '@/lib/workspaces/service': {},
  })
  return { tables, ProjectService, ExportService }
}

function renderRecord(patch = {}) {
  return {
    id: 'render-1', project_id: 'project-1', user_id: 'owner', status: 'processing',
    created_at: '2026-10-13T01:00:00Z', updated_at: '2026-10-13T01:00:00Z',
    metadata: { outputKind: 'mini-run', miniRunJobId: 'backend-job-1', sourceAssetId: 'asset-1' },
    ...patch,
  }
}

test('project list keeps the three unedited uploads in progress and follows the backend render to review', async (t) => {
  const { tables, ProjectService } = fixture()
  tables.projects.push({ ...tables.projects[0], id: 'foreign-project', user_id: 'other-user' })
  tables.project_exports.push(renderRecord({ user_id: 'other-user', status: 'completed', storage_path: 'foreign.mp4' }))
  let fetched = 0
  let backendState = { status: 'processing', progressPercent: 51 }
  t.mock.method(globalThis, 'fetch', async () => { fetched += 1; return Response.json(backendState) })

  assert.deepEqual((await ProjectService.listProjectCards()).map((project) => project.status), ['draft', 'draft', 'draft'])
  assert.equal(fetched, 0, 'upload preparation and another account never trigger render polling')

  tables.project_exports.push(renderRecord())
  let projects = await ProjectService.listProjectCards()
  assert.deepEqual(projects.map((project) => project.status), ['rendering', 'draft', 'draft'])
  assert.equal(projects[0].progress, 51)

  backendState = { status: 'completed', returnvalue: { outputUrl: 'https://cdn.example.com/edited.mp4' } }
  projects = await ProjectService.listProjectCards()
  assert.deepEqual(projects.map((project) => project.status), ['needs_review', 'draft', 'draft'])
  assert.equal(projects[0].progress, 100)
  assert.equal(tables.project_exports[1].status, 'completed')
  assert.equal(tables.project_exports[1].metadata.outputUrl, 'https://cdn.example.com/edited.mp4')
})

test('a finished backend redirect becomes a completed render with a reviewable output', async (t) => {
  const { tables, ProjectService } = fixture()
  tables.project_exports.push(renderRecord())
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.redirect, 'manual')
    return new Response(null, { status: 303, headers: { location: 'https://cdn.example.com/edited.mp4' } })
  })
  const projects = await ProjectService.listProjectCards()
  assert.equal(projects[0].status, 'needs_review')
  assert.equal(tables.project_exports[0].metadata.outputUrl, '/api/mini-run/job/backend-job-1/output')
})

test('a newer failed render stays in progress instead of resurfacing an older completed edit', async (t) => {
  const { tables, ProjectService } = fixture()
  tables.project_exports.push(renderRecord({ status: 'completed', storage_path: 'old.mp4' }))
  tables.project_exports.push(renderRecord({ id: 'render-2', status: 'failed', created_at: '2026-10-13T02:00:00Z' }))
  t.mock.method(globalThis, 'fetch', () => { throw new Error('failed renders must not be polled') })
  assert.equal((await ProjectService.listProjectCards())[0].status, 'draft')
})

test('a late upload-analysis failure cannot override a successful render job', async () => {
  const { tables, ProjectService } = fixture()
  tables.durable_jobs.push({ project_id: 'project-1', user_id: 'owner', type: 'render', status: 'completed', created_at: '2026-10-13T01:00:00Z', result_metadata: { outputUrl: 'edited.mp4' } })
  tables.durable_jobs.push({ project_id: 'project-1', user_id: 'owner', type: 'video_analysis', status: 'failed', created_at: '2026-10-13T02:00:00Z' })
  assert.equal((await ProjectService.listProjectCards())[0].status, 'needs_review')
})

test('backend completion without an output keeps polling until the render is reviewable', async (t) => {
  const { tables, ProjectService } = fixture()
  tables.project_exports.push(renderRecord())
  let backendState = { status: 'completed' }
  t.mock.method(globalThis, 'fetch', async () => Response.json(backendState))
  assert.equal((await ProjectService.listProjectCards())[0].status, 'rendering')
  assert.equal(tables.project_exports[0].status, 'processing')
  backendState = { status: 'completed', outputUrl: 'https://cdn.example.com/edited.mp4' }
  assert.equal((await ProjectService.listProjectCards())[0].status, 'needs_review')
})

test('one unavailable backend refresh preserves the other completed render records', async (t) => {
  const { tables, ProjectService, ExportService } = fixture()
  tables.project_exports.push(renderRecord())
  tables.project_exports.push(renderRecord({ id: 'render-2', project_id: 'project-2', status: 'completed', storage_path: 'edited-2.mp4', metadata: { sourceAssetId: 'asset-2' } }))
  t.mock.method(ExportService, 'listProjectExports', async () => { throw new Error('Render service unavailable') })
  t.mock.method(console, 'error', () => {})
  assert.deepEqual((await ProjectService.listProjectCards()).map((project) => project.status), ['rendering', 'needs_review', 'draft'])
})
