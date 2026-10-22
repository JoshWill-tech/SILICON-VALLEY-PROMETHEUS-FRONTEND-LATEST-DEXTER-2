import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const {readVoiceSourceStatus} = require('../lib/voice-companion/source-status.ts')

const hook = readFileSync('hooks/use-voice-companion.ts', 'utf8')
const source = hook.slice(hook.indexOf('  const executeToolCall ='), hook.indexOf('  const handleToolCall:'))
const js = ts.transpile(source, {target: ts.ScriptTarget.ES2022})

function executor(bridge, fetchImpl) {
  return new Function('useCallback', 'handlersRef', 'sanitizeVoiceCompanionError', 'readVoiceSourceStatus', `${js}; return executeToolCall;`)(
    fn => fn, {current: bridge}, value => value, getBridge => readVoiceSourceStatus(getBridge, fetchImpl),
  )
}

for (const name of ['start_render', 'export_video']) {
  test(`${name} defaults to final MP4 submission when mode is omitted`, async () => {
    const calls = []
    const execute = executor({projectId: 'project', hasVideo: true, onStartRender: async mode => {
      calls.push(mode)
      return {success: true, summary: 'Job accepted', renderInitiated: mode === 'final'}
    }})
    const result = await execute(name, {}, () => true)
    assert.deepEqual(calls, ['final'])
    assert.equal(result.renderInitiated, true)
  })
}

test('an explicit preview still opens the review without submitting', async () => {
  const calls = []
  const execute = executor({projectId: 'project', onStartRender: async mode => {
    calls.push(mode)
    return {success: true, summary: 'Review opened', renderInitiated: false}
  }})
  const result = await execute('start_render', {mode: 'preview'}, () => true)
  assert.deepEqual(calls, ['preview'])
  assert.equal(result.renderInitiated, false)
})

test('requesting final output is not evidence that rendering started', async () => {
  const execute = executor({projectId: 'project', onStartRender: async () => ({
    success: true, summary: 'Review opened', renderInitiated: false,
  })})
  const result = await execute('start_render', {mode: 'final'}, () => true)
  assert.equal(result.renderInitiated, false)
})

test('live editor state identifies the source independently of a playable preview', async () => {
  const execute = executor({projectId: 'project', sourceAssetId: 'source', hasVideo: true})
  const result = await execute('get_editor_state', {}, () => true)
  assert.equal(result.projectId, 'project')
  assert.equal(result.sourceAssetId, 'source')
})

function readinessRoute(assetError = null) {
  const chain = table => ({
    select() {return this}, eq() {return this},
    maybeSingle: async () => table === 'projects'
      ? {data: {source_asset_id: 'saved-source', editor_state: {}}}
      : {data: assetError ? null : {id: 'saved-source', storage_path: 'source.mp4'}, error: assetError},
  })
  const mocks = {
    'next/server': {NextResponse: {json: body => body}},
    'next/headers': {},
    '@/lib/supabase/server': {createClient: async () => ({
      auth: {getUser: async () => ({data: {user: {id: 'user'}}}), getSession: async () => ({data: {session: {access_token: 'test'}}})},
      from: chain,
    })},
    '@/lib/exports/service': {}, '@/lib/server/mini-run-dispatch': {},
    '@/lib/server/mini-run-proxy': {resolveMiniRunConfig() {}},
  }
  const sourceModule = {exports: {}}
  const sourceJs = ts.transpileModule(readFileSync('lib/projects/source-asset.ts', 'utf8'), {
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS},
  }).outputText
  new Function('require', 'module', 'exports', sourceJs)(id => {
    assert.equal(id, 'server-only')
    return {}
  }, sourceModule, sourceModule.exports)
  mocks['@/lib/projects/source-asset'] = sourceModule.exports
  const compiled = ts.transpileModule(readFileSync('app/api/projects/[id]/exports/route.ts', 'utf8'), {
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS},
  }).outputText
  const loadedModule = {exports: {}}
  new Function('require', 'module', 'exports', compiled)(id => mocks[id], loadedModule, loadedModule.exports)
  return loadedModule.exports.GET({}, {params: Promise.resolve({id: 'project'})})
}

test('source readiness returns the durable source identity for a fresh saved-state check', async () => {
  const result = await readinessRoute()
  assert.equal(result.readiness.sourceAssetId, 'saved-source')
  assert.equal(result.readiness.sourceCheckStatus, 'ready')
})

test('a source lookup failure is unconfirmed rather than evidence of a missing upload', async () => {
  const result = await readinessRoute({message: 'Database temporarily unavailable'})
  assert.equal(result.readiness.sourceCheckStatus, 'unconfirmed')
  assert.match(result.readiness.blockers.join(' '), /could not be checked/i)
})

test('a disconnected session cannot submit a render', async () => {
  let submissions = 0
  const execute = executor({projectId: 'project', onStartRender: async () => {
    submissions++
    return {success: true, summary: 'accepted', renderInitiated: true}
  }})
  const result = await execute('start_render', {}, () => false)
  assert.equal(result.success, false)
  assert.equal(submissions, 0)
})

const saved = {sourceAssetId: 'source', sourceReady: true, sourceCheckStatus: 'ready', sourceDurationMs: 45000,
  output: {format: 'mp4', width: 1080, height: 1920, sourceWindowDefaultMs: 30000}}
const response = readiness => new Response(JSON.stringify({readiness}))
const bridge = {projectId: 'project', sourceAssetId: 'source', hasVideo: true}

test('saved-source voice checks fetch fresh facts and never start an export', async () => {
  let calls = 0
  let ready = false
  const execute = executor({...bridge, onStartRender: () => assert.fail('a status check must be read-only')}, async (url, options) => {
    calls++
    assert.equal(url, '/api/projects/project/exports')
    assert.equal(options.cache, 'no-store')
    return response(ready ? saved : {...saved, sourceReady: false, sourceCheckStatus: 'missing'})
  })
  assert.equal((await execute('get_source_status', {}, () => true)).phase, 'missing')
  ready = true
  const result = await execute('get_source_status', {}, () => true)
  assert.equal(result.phase, 'ready')
  assert.equal(result.storedSourceReady, true)
  assert.equal(result.output.sourceWindowDefaultMs, 30000)
  assert.match(result.summary, /do not need to attach it again/)
  assert.equal(calls, 2)
})

test('a different saved source is a mismatch rather than a missing file', async () => {
  const result = await readVoiceSourceStatus(() => bridge, async () => response({...saved, sourceAssetId: 'older-source'}))
  assert.equal(result.phase, 'source_changed')
  assert.equal(result.storedSourceReady, true)
  assert.equal(result.sourceMatchesEditor, false)
})

test('lookup failures, old responses, and inconsistent readiness never prove a missing upload', async () => {
  for (const fetchImpl of [
    async () => {throw new Error('Network unavailable')},
    async () => new Response('<html>Gateway timeout</html>', {status: 504}),
    async () => response({...saved, sourceCheckStatus: 'unconfirmed'}),
    async () => response({sourceReady: false}),
    async () => response({...saved, sourceAssetId: null}),
    async () => response({...saved, sourceCheckStatus: 'missing'}),
  ]) {
    const result = await readVoiceSourceStatus(() => bridge, fetchImpl)
    assert.equal(result.success, false)
    assert.equal(result.phase, 'unconfirmed')
    assert.equal(result.storedSourceReady, undefined)
  }
})

test('a source change while checking invalidates the result', async () => {
  let current = bridge
  const result = await readVoiceSourceStatus(() => current, async () => {
    current = {...bridge, sourceAssetId: 'new-source'}
    return response(saved)
  })
  assert.equal(result.success, false)
  assert.equal(result.phase, 'unconfirmed')
})

test('expired sessions and disconnected projects cannot claim a saved source', async () => {
  const expired = await readVoiceSourceStatus(() => bridge, async () => new Response('{}', {status: 401}))
  assert.equal(expired.phase, 'unconfirmed')
  assert.match(expired.summary, /Refresh your studio session/)
  const disconnected = await readVoiceSourceStatus(() => ({}), () => assert.fail('no project to fetch'))
  assert.equal(disconnected.success, false)
})
