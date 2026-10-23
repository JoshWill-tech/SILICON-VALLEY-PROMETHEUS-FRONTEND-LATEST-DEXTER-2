import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const React = require('react')
type Outcome = {success: boolean; summary: string; renderInitiated?: boolean}
type RecordRow = Record<string, any>

function delivery({sourceAssetId = 'source', sourceUploadStatus = 'ready', status = 202,
  payload = {export: {id: 'export', status: 'pending'}}, records = [], submitting = false}: {
    sourceAssetId?: string | null; sourceUploadStatus?: string; status?: number;
    payload?: RecordRow; records?: RecordRow[]; submitting?: boolean
  } = {}) {
  const effects: (() => unknown)[] = []
  const requests: {url: string; body: RecordRow}[] = []
  let stateIndex = 0
  let handlers: RecordRow = {}
  const draftStore = Object.assign(() => ({isDirty: false}), {
    getState: () => ({isDirty: false, getDraftManifest: () => ({})}),
  })
  const imports: RecordRow = {
    react: {...React,
      useState(initial: unknown) {
        const index = stateIndex++
        return [index === 0 ? records : index === 5 ? submitting : initial, () => {}]
      },
      useRef: (value: unknown) => ({current: value}),
      useEffect: (effect: () => unknown) => effects.push(effect),
      useMemo: (factory: () => unknown) => factory(),
      useCallback: (callback: unknown) => callback,
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-dom': {createPortal: () => null},
    'framer-motion': {useReducedMotion: () => true, motion: new Proxy({}, {get: (_target, name) => name})},
    'lucide-react': new Proxy({}, {get: () => () => null}),
    '@/hooks/use-editorial-timeline': {useEditorialTimeline: () => ({timeline: null, status: 'saved', patch() {}})},
    '@/lib/editor/browser-download': {},
    '@/components/editor/video-review-annotations': Object.fromEntries(
      ['VideoAnnotateButton', 'VideoReviewDownloadButton', 'VideoReviewProvider', 'VideoReviewToolbar'].map(name => [name, () => null])),
    '@/lib/voice-companion/bridge': {registerVoiceCompanionBridge: (next: RecordRow) => {handlers = {...handlers, ...next}}},
    '@/lib/editor/mini-run-draft-store': {useMiniRunDraftStore: draftStore},
    '@/lib/api/mini-run': {miniRun: {}},
    '@/lib/supabase/client': {createClient: () => ({auth: {getSession: async () => ({data: {session: null}})}})},
    '@/components/editor/mobile-editor-workspace.module.css': {},
  }
  function load(path: string): RecordRow {
    const exports = {}
    const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    }}).outputText
    vm.runInNewContext(compiled, {exports, console, AbortSignal,
      window: {setInterval: () => 0, clearInterval() {}}, document: {visibilityState: 'hidden'},
      require(name: string) {
        if (name in imports) return imports[name]
        if (name === '@/lib/editor/render-delivery') return load('lib/editor/render-delivery.ts')
        throw new Error(`Unexpected dependency ${name}`)
      },
      fetch: async (url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          requests.push({url, body: JSON.parse(String(options.body))})
          return Response.json(payload, {status})
        }
        return Response.json({exports: records})
      },
    }, {filename: path})
    return exports
  }
  const {EditorialDeliveryStudio} = load('components/editor/editorial-delivery-studio.tsx')
  EditorialDeliveryStudio({projectId: 'project', sourceAssetId, sourceUploadStatus,
    sourceUrl: '/source.mp4', projectTitle: 'Source', currentTimeSec: 0, durationSec: 10})
  effects.forEach(effect => effect())
  return {requests, render: (mode = 'final', prompt?: string) => handlers.onStartRender(mode, prompt) as Promise<Outcome>}
}

for (const options of [
  {sourceAssetId: null},
  {sourceUploadStatus: 'uploading'},
  {sourceUploadStatus: 'failed'},
  {submitting: true},
]) {
  test(`Jarvis never claims render dispatch when delivery blocks it: ${JSON.stringify(options)}`, async () => {
    const current = delivery(options)
    const result = await current.render()
    assert.equal(result.success, false)
    assert.equal(result.renderInitiated, false)
    assert.equal(current.requests.length, 0)
  })
}

for (const [status, payload] of [
  [404, {error: 'Project source video is unavailable.'}],
  [200, {}],
  [202, {export: {id: 'failed', status: 'failed', errorMessage: 'Worker rejected the request.'}}],
] as const) {
  test(`Jarvis preserves a failed delivery instead of inventing a render receipt: ${JSON.stringify(payload)}`, async () => {
    const current = delivery({status, payload})
    const result = await current.render()
    assert.equal(result.success, false)
    assert.equal(result.renderInitiated, false)
    assert.equal(current.requests.length, 1)
  })
}

test('a real accepted receipt confirms rendering and preserves the creator prompt', async () => {
  const current = delivery()
  const result = await current.render('final', 'Keep the supplied direction')
  assert.equal(result.success, true)
  assert.equal(result.renderInitiated, true)
  assert.equal(current.requests.length, 1)
  assert.equal(current.requests[0].body.prompt, 'Keep the supplied direction')
  assert.equal(current.requests[0].body.sourceAssetId, 'source')
})

test('a requested review never claims to have dispatched a render', async () => {
  const current = delivery()
  const result = await current.render('preview')
  assert.equal(result.success, true)
  assert.equal(result.renderInitiated, false)
  assert.equal(current.requests.length, 0)
})

test('an existing tracked job is reported without submitting a duplicate', async () => {
  const current = delivery({records: [{id: 'existing', projectId: 'project', status: 'processing',
    createdAt: '2026-10-22T00:00:00Z', metadata: {sourceAssetId: 'source', outputKind: 'mini-run'}}]})
  const result = await current.render()
  assert.equal(result.success, true)
  assert.equal(result.renderInitiated, true)
  assert.match(result.summary, /already.*processing/i)
  assert.equal(current.requests.length, 0)
})

test('concurrent Jarvis requests submit only one render before React commits state', async () => {
  const current = delivery()
  const results = await Promise.all([current.render(), current.render()])
  assert.equal(current.requests.length, 1)
  assert.equal(results.filter(result => result.renderInitiated).length, 1)
})
