import assert from 'node:assert/strict'
import {test, type TestContext} from 'node:test'
import * as React from 'react'
import {JSDOM} from 'jsdom'
import {createRoot} from 'react-dom/client'
import {miniRun} from '../lib/api/mini-run'
import {useMiniRunJob, type UseMiniRunJobOptions, type UseMiniRunJobResult} from '../lib/hooks/use-mini-run-job'

async function mount(context: TestContext, getStatus: () => Promise<any>, options: UseMiniRunJobOptions = {}) {
  const dom = new JSDOM('<div id="root"></div>', {url: 'https://frontend.example.test'})
  Object.assign(globalThis, {window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true})
  context.mock.timers.enable({apis: ['setTimeout']})
  context.mock.method(miniRun, 'getRenderStatus', getStatus)
  let state!: UseMiniRunJobResult
  function Harness({enabled = true}: {enabled?: boolean}) {
    state = useMiniRunJob('owned-job', {...options, enabled})
    return null
  }
  const root = createRoot(dom.window.document.getElementById('root')!)
  await React.act(async () => root.render(React.createElement(Harness)))
  return {
    state: () => state,
    tick: async () => { await React.act(async () => context.mock.timers.tick(2000)) },
    disable: async () => { await React.act(async () => root.render(React.createElement(Harness, {enabled: false}))) },
    cleanup: async () => {
      await React.act(async () => root.unmount())
      context.mock.timers.reset()
      dom.window.close()
      for (const name of ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT']) Reflect.deleteProperty(globalThis, name)
    },
  }
}

for (const minutes of [14, 19.5]) {
  test(`actual hook receives the completed cloud job after ${minutes} minutes`, async context => {
    let elapsed = 0
    let completed = 0
    const studio = await mount(context, async () => ({jobId: 'owned-job',
      state: elapsed >= minutes * 60_000 ? 'completed' : elapsed < 180_000 ? 'queued' : 'running',
      outputUrl: '/api/mini-run/job/owned-job/output'}), {onComplete: () => { completed++ }})
    try {
      for (; elapsed < minutes * 60_000;) {
        elapsed += 2000
        await studio.tick()
      }
      assert.equal(studio.state().lifecycle, 'completed')
      assert.equal(studio.state().error, null)
      assert.equal(completed, 1)
      assert.equal(studio.state().status?.outputUrl, '/api/mini-run/job/owned-job/output')
    } finally { await studio.cleanup() }
  })
}

test('disabling the mounted hook cancels further scheduled status calls', async context => {
  let calls = 0
  const studio = await mount(context, async () => {calls++; return {state: 'queued'}})
  try {
    await studio.tick()
    await studio.disable()
    const stoppedAt = calls
    await studio.tick()
    assert.equal(calls, stoppedAt)
    assert.equal(studio.state().lifecycle, 'idle')
  } finally { await studio.cleanup() }
})

test('worker failure stops polling and calls the existing error callback', async context => {
  const errors: string[] = []
  let calls = 0
  const studio = await mount(context, async () => {calls++; return {state: 'failed', failedReason: 'Asset retrieval failed'}},
    {onError: error => errors.push(error)})
  try {
    assert.equal(studio.state().lifecycle, 'failed')
    assert.deepEqual(errors, ['Asset retrieval failed'])
    await studio.tick()
    assert.equal(calls, 1)
  } finally { await studio.cleanup() }
})

test('a transient status request error clears after the next successful poll', async context => {
  let calls = 0
  const studio = await mount(context, async () => {
    if (++calls === 1) throw new Error('Temporary network failure')
    return {state: 'completed', outputUrl: '/api/mini-run/job/owned-job/output'}
  })
  try {
    assert.equal(studio.state().lifecycle, 'polling')
    assert.equal(studio.state().error, 'Temporary network failure')
    await studio.tick()
    assert.equal(studio.state().lifecycle, 'completed')
    assert.equal(studio.state().error, null)
  } finally { await studio.cleanup() }
})

test('an explicit attempt limit still ends polling with a timeout', async context => {
  let calls = 0
  const studio = await mount(context, async () => {calls++; return {state: 'running'}}, {maxAttempts: 2})
  try {
    await studio.tick()
    assert.equal(studio.state().lifecycle, 'failed')
    assert.match(studio.state().error || '', /timed out/)
    await studio.tick()
    assert.equal(calls, 2)
  } finally { await studio.cleanup() }
})
