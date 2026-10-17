import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { setImmediate } from 'node:timers/promises'
import vm from 'node:vm'
import ts from 'typescript'

// Read committed code so other unfinished work in this checkout is excluded.
const read = path => execFileSync('git', ['show', `HEAD:${path}`], { encoding: 'utf8' })
const compile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
function findEffect(text, marker) {
  const source = ts.createSourceFile('probe.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let result
  function visit(node) {
    if (ts.isCallExpression(node) && /^(React\.)?useEffect$/.test(node.expression.getText(source)) && node.getText(source).includes(marker)) result = node.getText(source)
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(result, `Effect containing ${marker} must exist`)
  return result
}

const editor = read('app/editor/[id]/page.tsx')
const effect = findEffect(editor, 'const syncSourceAnalysis')
const timers = new Map()
let cleanup, requests = 0, nextId = 0
const context = {
  React: { useEffect: fn => { cleanup = fn() } },
  project: { sourceAssetId: 'fixture-source' }, projectId: 'fixture-project',
  fetch: async () => { requests++; return { ok: false, status: 404 } },
  window: { setInterval: (fn, ms) => { assert.equal(ms, 2500); timers.set(++nextId, fn); return nextId }, clearInterval: id => timers.delete(id) },
  console,
}
vm.runInNewContext(compile(effect), context)
await setImmediate()
for (let tick = 0; tick < 5; tick++) {
  for (const callback of [...timers.values()]) callback()
  await setImmediate()
}
assert.equal(requests, 6)
assert.equal(timers.size, 1)
cleanup()
assert.equal(timers.size, 0)
console.log('CONFIRMED: source-analysis 404 receives 6 requests over 5 simulated 2.5-second ticks; polling remains scheduled until unmount.')

const filament = read('components/navigation/jarvis-top-nav-filament.tsx')
const animationEffect = findEffect(filament, 'const frameInterval')
const predicate = filament.match(/const shouldAnimateFilament = ([^\n]+)/)?.[1]
assert.ok(predicate)
for (const [status, hovered, reduced] of [['disconnected', false, false], ['disconnected', true, false], ['listening', false, false], ['listening', false, true]]) {
  const isActive = status !== 'disconnected' && status !== 'error'
  const shouldAnimate = vm.runInNewContext(predicate, { isActive, isHovered: hovered, prefersReducedMotion: reduced })
  let frames = 0, path = null, dispose
  const animationContext = {
    useEffect: fn => { dispose = fn() }, shouldAnimateFilament: shouldAnimate,
    pathRef: { current: { setAttribute: (_name, value) => { path = value } } },
    glowPathRef: { current: { setAttribute: () => {} } }, animFrameIdRef: { current: null },
    requestAnimationFrame: () => ++frames, cancelAnimationFrame: () => {},
  }
  vm.runInNewContext(compile(animationEffect), animationContext)
  assert.equal(frames, shouldAnimate ? 1 : 0)
  if (!shouldAnimate) assert.equal(path, 'M 0 16 L 200 16')
  dispose?.()
  console.log(`FILAMENT: status=${status}, hover=${hovered}, reducedMotion=${reduced} -> scheduledFrames=${frames}, staticPath=${path}`)
}
console.log('Scope: isolated execution of committed effects with simulated network/timers; this does not measure production interaction latency or prove the icon is absent.')
