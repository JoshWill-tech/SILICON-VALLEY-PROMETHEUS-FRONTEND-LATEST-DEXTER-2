import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const page = readFileSync('app/editor/[id]/page.tsx', 'utf8')
const multipartClient = readFileSync('lib/r2/multipart-client.ts', 'utf8')
const serverSupabase = readFileSync('lib/supabase/server.ts', 'utf8')

test('server createClient extracts Authorization Bearer token and wraps auth.getUser with token fallback', () => {
  assert.match(serverSupabase, /resolveBearerToken/, 'createClient must include bearer token resolver')
  assert.match(serverSupabase, /Authorization:\s*`Bearer \$\{bearerToken\}`/, 'createClient must forward bearer token in global headers')
  assert.match(serverSupabase, /client\.auth\.getUser\s*=\s*async/, 'createClient must wrap getUser to validate bearer token when cookie session is absent')
})

test('uploadProjectSourceMultipart forwards userToken in Authorization header across initiate, sign-part, complete, and abort', () => {
  assert.match(multipartClient, /userToken\?: string/, 'UploadProjectSourceMultipartOptions must accept userToken')
  assert.match(multipartClient, /resolveAuthToken/, 'multipart client must define resolveAuthToken helper')
  assert.match(multipartClient, /Authorization:\s*`Bearer \$\{token\}`/, 'multipart client must format Bearer header')
  assert.match(multipartClient, /upload-multipart\/initiate[\s\S]*?\.\.\.authHeaders/, 'initiate must send authHeaders')
  assert.match(multipartClient, /upload-multipart\/sign-part[\s\S]*?\.\.\.authHeaders/, 'sign-part must send authHeaders')
  assert.match(multipartClient, /upload-multipart\/complete[\s\S]*?\.\.\.authHeaders/, 'complete must send authHeaders')
})

test('uploadSourceAssetToCloud in editor passes resolved userToken to multipart upload and assets registration', () => {
  assert.match(page, /uploadProjectSourceMultipart\(\{[\s\S]*?userToken[\s\S]*?\}\)/, 'uploadSourceAssetToCloud must pass userToken to multipart upload')
  assert.match(page, /\/api\/projects\/\$\{input\.projectId\}\/assets[\s\S]*?Authorization:\s*`Bearer \$\{userToken\}`/, 'assets registration must send Bearer token')
})

test('startProjectRender auto-recovers when server has sourceReady: true even if staged sourceAssetId differed', async () => {
  const source = page.slice(page.indexOf('  const startProjectRender ='), page.indexOf('  const handleVoiceStartRender ='))
  const js = ts.transpile(source, { target: ts.ScriptTarget.ES2022 })

  let failedStatusCleared = false
  let updatedProjectSourceId: string | null = null
  const requests: any[] = []

  const callback = new Function(
    'React', 'project', 'projectId', 'getEditorialTimelineController', 'fetch', 'toast',
    'setLatestExport', 'setActiveWorkspaceTab', 'setDeliveryOpenToken', 'sourceUploadStatus',
    'canSubmitSourceRender', 'setIsSourceUploadFailed', 'setProject', 'setIsSourceUploadPending',
    `${js}; return startProjectRender;`
  )(
    { useCallback: (fn: any) => fn },
    { id: 'proj-123', sourceAssetId: 'staged-temp-id' },
    'proj-123',
    () => ({ getSnapshot: () => ({ status: 'saved' }) }),
    async (url: string, options: any) => {
      requests.push({ url, options })
      if (url.includes('/exports') && (!options?.method || options.method === 'GET')) {
        return {
          ok: true,
          json: async () => ({
            readiness: {
              sourceReady: true,
              sourceAssetId: 'durable-server-source-uuid',
              canSubmit: true,
              timelineRevision: 1,
            },
          }),
        }
      }
      return {
        ok: true,
        status: 202,
        json: async () => ({
          export: { id: 'export-job-999', status: 'pending' },
        }),
      }
    },
    { error() {}, success() {}, info() {} },
    () => {}, () => {}, () => {},
    'failed', // sourceUploadStatus begins as failed
    (id: any, status: any) => Boolean(id) && status === 'ready',
    (val: boolean) => { if (!val) failedStatusCleared = true },
    (updater: any) => {
      const updated = typeof updater === 'function' ? updater({ id: 'proj-123', sourceAssetId: 'staged-temp-id' }) : updater
      if (updated?.sourceAssetId) updatedProjectSourceId = updated.sourceAssetId
    },
    () => {},
  )

  const result = await callback()
  assert.equal(failedStatusCleared, true, 'isSourceUploadFailed must be cleared when server sourceReady is confirmed')
  assert.equal(updatedProjectSourceId, 'durable-server-source-uuid', 'project state must adopt the verified durable source asset ID from the server')
  assert.equal(result.success, true, 'render dispatch must succeed once recovered')
})

test('startProjectRender reports "Upload a source video before rendering." when source is null, never blaming a replacement source', async () => {
  const source = page.slice(page.indexOf('  const startProjectRender ='), page.indexOf('  const handleVoiceStartRender ='))
  const js = ts.transpile(source, { target: ts.ScriptTarget.ES2022 })

  let errorToastMessage = ''

  const callback = new Function(
    'React', 'project', 'projectId', 'getEditorialTimelineController', 'fetch', 'toast',
    'setLatestExport', 'setActiveWorkspaceTab', 'setDeliveryOpenToken', 'sourceUploadStatus',
    'canSubmitSourceRender', 'setIsSourceUploadFailed', 'setProject', 'setIsSourceUploadPending',
    `${js}; return startProjectRender;`
  )(
    { useCallback: (fn: any) => fn },
    { id: 'proj-empty', sourceAssetId: null },
    'proj-empty',
    () => ({ getSnapshot: () => ({ status: 'saved' }) }),
    async () => ({
      ok: true,
      json: async () => ({ readiness: { sourceReady: false } }),
    }),
    {
      error(msg: string) { errorToastMessage = msg },
      success() {},
      info() {},
    },
    () => {}, () => {}, () => {},
    'failed', // failed latch from a previous session
    (id: any, status: any) => Boolean(id) && status === 'ready',
    () => {},
    () => {},
    () => {},
  )

  const result = await callback()
  assert.equal(result.success, false)
  assert.equal(result.summary, 'Upload a source video before rendering.')
  assert.equal(errorToastMessage, 'Upload a source video before rendering.')
})

test('ProjectService and ExportService methods forward authenticated client and accept Bearer token', () => {
  const projectService = readFileSync('lib/projects/service.ts', 'utf8')
  const exportService = readFileSync('lib/exports/service.ts', 'utf8')
  const r2Context = readFileSync('lib/r2/project-source-multipart.ts', 'utf8')
  const exportsRoute = readFileSync('app/api/projects/[id]/exports/route.ts', 'utf8')
  const assetsRoute = readFileSync('app/api/projects/[id]/assets/route.ts', 'utf8')

  assert.match(projectService, /getProject\(id:\s*string,\s*reqOrClient\?:/, 'ProjectService.getProject must accept reqOrClient')
  assert.match(projectService, /updateProject\(id:\s*string,\s*patch:\s*ProjectPatch,\s*reqOrClient\?:/, 'ProjectService.updateProject must accept reqOrClient')
  assert.match(projectService, /deleteProject\(id:\s*string,\s*reqOrClient\?:/, 'ProjectService.deleteProject must accept reqOrClient')
  assert.match(projectService, /listProjects\(reqOrClient\?:/, 'ProjectService.listProjects must accept reqOrClient')

  assert.match(exportService, /getExport\(exportId:\s*string,\s*reqOrClient\?:/, 'ExportService.getExport must accept reqOrClient')
  assert.match(exportService, /getExportProject\(exportId:\s*string,\s*reqOrClient\?:/, 'ExportService.getExportProject must accept reqOrClient')
  assert.match(exportService, /findActiveProjectExport\([\s\S]*?reqOrClient\?:/, 'ExportService.findActiveProjectExport must accept reqOrClient')
  assert.match(exportService, /createProjectExport\([\s\S]*?reqOrClient\?:/, 'ExportService.createProjectExport must accept reqOrClient')

  assert.match(r2Context, /ProjectService\.getProject\(projectId,\s*supabase\)/, 'requireProjectSourceUploadContext must pass authenticated supabase client to ProjectService.getProject')
  assert.match(r2Context, /getUserStorageQuota\(user\.id,\s*projectId,\s*supabase\)/, 'requireProjectSourceUploadContext must pass authenticated supabase client to getUserStorageQuota')

  assert.match(assetsRoute, /ProjectService\.getProject\(projectId,\s*supabase\)/, 'assets route must forward supabase client to ProjectService.getProject')
  assert.match(exportsRoute, /const supabase = await createClient\(request\)/, 'exports route must forward request to createClient')
})

test('database migration resolves PGRST203 overload ambiguity and sets source_control_plane guard during commit', () => {
  const migration = readFileSync('supabase/migrations/20261023000000_unlimited_storage_and_quota_prophylaxis.sql', 'utf8')

  assert.match(migration, /drop function if exists public\.maul_reserve_source_upload\(uuid, uuid, uuid,/, 'migration must drop legacy uuid client_request_id overload to prevent PGRST203')
  assert.match(migration, /alter table if exists public\.source_upload_sessions alter column client_request_id type text;/, 'migration must ensure client_request_id column is text')
  assert.match(migration, /perform set_config\('prometheus\.source_control_plane',\s*'on',\s*true\);/, 'maul_commit_source_revision must set prometheus.source_control_plane on')
  assert.match(migration, /and status in \('pending', 'processing'\);/, 'maul_commit_source_revision must use valid job_status enum values')
})

