import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const element = (type, props) => ({ type, props: props ?? {} })
const source = (file) => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

// Execute the real declarations, with UI/framework boundaries replaced by element records.
// State transitions, control associations and source mapping are left intact.
function declarations(file, names, globals) {
  const ast = source(file)
  const nodes = new Map()
  for (const node of ast.statements) {
    if (node.name) nodes.set(node.name.text, node)
    if (ts.isVariableStatement(node)) for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) nodes.set(declaration.name.text, node)
    }
  }
  const selected = new Set()
  function add(name) {
    if (Object.hasOwn(globals, name)) return
    const node = nodes.get(name)
    if (!node || selected.has(node)) return
    selected.add(node)
    function visit(child) { if (ts.isTypeNode(child)) return; if (ts.isIdentifier(child)) add(child.text); ts.forEachChild(child, visit) }
    ts.forEachChild(node, visit)
  }
  names.forEach(add)
  const code = ast.statements.filter(node => selected.has(node)).map(node => node.getText(ast)).join('\n')
  const compiled = ts.transpileModule(`${code}\n;globalThis.result={${names.join(',')}}`, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const context = { exports: {}, require: () => ({ jsx: element, jsxs: element }), ...globals }
  runInNewContext(compiled.outputText, context)
  return context.result
}

function flatten(node) {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(flatten)
  return [node, ...flatten(node.props?.children)]
}

test('unset and saved pronouns preserve their identity instead of assuming a value', () => {
  const { inferPronounPreset, DEFAULT_VALUES, PRONOUN_OPTIONS } = declarations('app/settings/profile/page.tsx', ['inferPronounPreset', 'DEFAULT_VALUES', 'PRONOUN_OPTIONS'], { DEFAULT_NOTIFICATION_PREFERENCES: {} })
  assert.equal(DEFAULT_VALUES.pronounPreset, '')
  assert.equal(inferPronounPreset(null), '')
  assert.equal(inferPronounPreset(undefined), '')
  assert.equal(inferPronounPreset(''), '')
  for (const value of ['she/her', 'he/him', 'they/them', 'any/all']) assert.equal(inferPronounPreset(value), value)
  assert.equal(inferPronounPreset('ze/zir'), 'custom')
  assert.ok(PRONOUN_OPTIONS.some(option => option.value === '' && option.label === 'Not set'))
})

test('preference switches resolve unique visible names, helpers and checked states', () => {
  let id = 0
  const { NotificationToggle, SelectField } = declarations('app/settings/profile/page.tsx', ['NotificationToggle', 'SelectField'], {
    React: { useId: () => `preference-${++id}` }, cn: (...parts) => parts.filter(Boolean).join(' '),
  })
  const labels = ['Marketing announcements', 'Security alerts', 'Product updates', 'Browser push', 'Real-time activity stream', 'Share anonymized usage']
  const ids = new Set()
  for (const [index, label] of labels.entries()) {
    const changes = []
    const tree = flatten(NotificationToggle({ label, description: `${label} helper`, checked: index % 2 === 0, onChange: value => changes.push(value) }))
    const control = tree.find(node => node.props.role === 'switch')
    const name = tree.find(node => node.props.id === control.props['aria-labelledby'])
    const helper = tree.find(node => node.props.id === control.props['aria-describedby'])
    assert.equal(name.props.children, label)
    assert.equal(helper.props.children, `${label} helper`)
    assert.equal(ids.has(name.props.id), false)
    ids.add(name.props.id)
    assert.equal(control.props['aria-checked'], index % 2 === 0)
    control.props.onClick()
    assert.deepEqual(changes, [index % 2 !== 0])
  }
  for (const label of ['Default export quality', 'Default format']) {
    const changes = []
    const control = SelectField({ label, value: 'current', options: [{ value: 'current', label: 'Current' }], onChange: value => changes.push(value) })
    assert.equal(control.props['aria-label'], label)
    assert.equal(control.props.value, 'current')
    control.props.onChange({ target: { value: 'next' } })
    assert.deepEqual(changes, ['next'])
  }
})

test('chat source status rejects empty metadata and respects verified source availability', () => {
  const ast = source('components/editor/PrometheusChat.tsx')
  let expression
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'videoPresent') expression = node.initializer.getText(ast)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.ok(expression)
  const present = (hasSourceMedia, videoContext) => runInNewContext(expression, { hasSourceMedia, videoContext })
  assert.equal(present(false, { status: 'video', video: {} }), false)
  assert.equal(present(false, { status: 'video', video: { filename: 'stale.mp4' } }), false)
  assert.equal(present(undefined, { status: 'video', video: {} }), false)
  assert.equal(present(true, null), true)
  assert.equal(present(undefined, { status: 'video', video: { filename: 'source.mp4' } }), true)
})

test('source metadata has no measured values for an empty draft and no guessed fallbacks', () => {
  const ast = source('app/editor/[id]/page.tsx')
  let callback
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'videoMetadata') callback = node.initializer.arguments[0].getText(ast)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.ok(callback)
  const metadata = project => runInNewContext(`(${callback})()`, { project })
  assert.equal(metadata({ sourceAssetId: null, sourceProfile: { inspection: { width: 1080, height: 1920, fps: 30 } } }), undefined)
  const pending = metadata({ sourceAssetId: 'source', sourceProfile: null })
  assert.equal(Object.values(pending).every(value => value === undefined), true)
  const result = metadata({ sourceAssetId: 'source', sourceProfile: { inspection: { width: 1280, height: 720, durationSec: 12, fps: 24, mimeType: 'video/mp4', fileSizeBytes: 1048576 } } })
  assert.equal(result.resolution, '1280x720')
  assert.equal(result.fps, 24)
  assert.equal(result.duration, '12s')
  assert.equal(result.aspectRatio, '1.78:1')
  assert.equal(result.codec, 'video/mp4')
  assert.equal(result.size, '1.0 MB')
})

test('archive image failures stop after the existing fallback and reset for a different source', () => {
  let states = [], cursor = 0, effectDeps, pendingEffect
  const react = {
    useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value }] },
    useEffect(effect, deps) { if (!effectDeps || deps.some((value, index) => value !== effectDeps[index])) { effectDeps = deps; pendingEffect = effect } },
    Suspense: 'suspense',
  }
  const { HoverTiltMediaCard } = declarations('components/assets/cinematic-library.tsx', ['HoverTiltMediaCard'], {
    React: react, motion: new Proxy({}, { get: (_, name) => name }), cn: (...parts) => parts.filter(Boolean).join(' '), Play: 'play-icon', PaperImage: 'paper-image',
  })
  let item = { id: 'fixture', title: 'Full video title', videoId: 'broken-video', image: '/fallback.jpg' }
  function render() {
    cursor = 0
    let tree = flatten(HoverTiltMediaCard({ item, title: item.title, reduceMotion: true }))
    if (pendingEffect) { const effect = pendingEffect; pendingEffect = null; effect(); cursor = 0; tree = flatten(HoverTiltMediaCard({ item, title: item.title, reduceMotion: true })) }
    return tree
  }
  const image = tree => tree.find(node => node.type === 'img')
  let tree = render()
  assert.match(image(tree).props.src, /broken-video/)
  image(tree).props.onError()
  tree = render()
  assert.equal(image(tree).props.src, '/fallback.jpg')
  image(tree).props.onError()
  tree = render()
  assert.equal(image(tree), undefined)
  assert.equal(tree.find(node => node.props.role === 'img').props['aria-label'], 'Full video title: thumbnail unavailable')
  item = { ...item, videoId: null, image: '/new-source.jpg' }
  tree = render()
  assert.equal(image(tree).props.src, '/new-source.jpg')
  image(tree).props.onLoad()
  tree = render()
  assert.equal(tree.some(node => node.props.role === 'img'), false)
  image(tree).props.onError()
  assert.equal(image(render()), undefined, 'A source that is already the fallback must not retry itself')
})

test('project count uses the actual count with singular and plural copy', () => {
  const ast = source('components/projects/projects-page-editorial.tsx')
  let expression
  function visit(node) {
    if (ts.isJsxExpression(node) && node.expression?.getText(ast).includes('pieces\'') && node.expression?.getText(ast).includes('in motion')) expression = node.expression.getText(ast)
    ts.forEachChild(node, visit)
  }
  assert.ok((visit(ast), expression))
  for (const [count, expected] of [[0, '0 pieces in motion'], [1, '1 piece in motion'], [4, '4 pieces in motion']]) {
    assert.equal(runInNewContext(expression, { isLoading: false, projects: Array(count) }), expected)
  }
})

test('unavailable Brand Voice offers only dismissal and supported next steps', () => {
  const { BrandVoicePanel } = declarations('components/assets/brand-canvas.tsx', ['BrandVoicePanel'], {
    motion: new Proxy({}, { get: (_, name) => name }), Mic: 'mic-icon', X: 'close-icon',
  })
  let closed = false
  const tree = flatten(BrandVoicePanel({ reduceMotion: true, onClose: () => { closed = true } }))
  const buttons = tree.filter(node => node.type === 'button')
  assert.equal(buttons.length, 1)
  assert.equal(buttons[0].props['aria-label'], 'Close brand voice')
  const text = tree.map(node => typeof node.props.children === 'string' ? node.props.children : '').join(' ')
  assert.match(text, /Currently unavailable/)
  assert.match(text, /Edit the direction cards or use Analyze URL/)
  assert.doesNotMatch(text, /WIREFRAME|Stage Change/)
  buttons[0].props.onClick()
  assert.equal(closed, true)
})
