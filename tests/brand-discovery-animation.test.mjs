import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire, Module } from 'node:module'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

test('submitted brand animation lifecycle and contextual rotation', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://prometheus.test' })
  const previous = new Map()
  const frames = new Map()
  let frameId = 0
  const install = (key, value) => {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  }
  install('window', dom.window)
  install('document', dom.window.document)
  install('navigator', dom.window.navigator)
  install('HTMLElement', dom.window.HTMLElement)
  install('IS_REACT_ACT_ENVIRONMENT', true)
  install('requestAnimationFrame', (callback) => { frames.set(++frameId, callback); return frameId })
  install('cancelAnimationFrame', (id) => frames.delete(id))
  dom.window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })
  dom.window.liquidGL = () => ({ destroy() {} })

  const result = await build({
    absWorkingDir: process.cwd(), tsconfigRaw: {},
    entryPoints: [resolve('components/assets/library-collection.tsx')], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic',
    plugins: [{ name: 'isolate-library-side-effects', setup(builder) {
      const stubs = {
        '@/components/assets/cinematic-library': 'export const LIBRARY_CREATOR_CARDS = [{ id: "archive", name: "Archive Creator", designation: "Storytelling", image: "/archive.jpg" }]',
        '@/components/assets/brand-dna-studio': 'export const BRAND_DNA_STORAGE_KEY = "test.dna"',
        '@/lib/storage': 'export const readLocalStorageJSON = () => null; export const writeLocalStorageJSON = () => {}',
        '@/lib/voice-companion/memory': 'export const saveJarvisMemory = () => {}',
        'next/image': 'export default () => null',
        sonner: 'export const toast = { success() {}, info() {} }',
      }
      builder.onResolve({ filter: /.*/ }, ({ path }) => {
        if (path in stubs) return { path, namespace: 'stub' }
        if (path.startsWith('@/')) return { path: resolve(`${path.slice(2)}${path === '@/lib/utils' ? '.ts' : '.tsx'}`) }
      })
      builder.onLoad({ filter: /.*/, namespace: 'stub' }, ({ path }) => ({ contents: stubs[path] }))
      // Next compiles styled-jsx; this DOM harness only needs the underlying style element.
      builder.onLoad({ filter: /\.tsx$/ }, async ({ path }) => ({
        contents: (await readFile(path, 'utf8')).replaceAll('<style jsx>', '<style>'), loader: 'tsx',
      }))
    } }],
  })
  const compiled = new Module(`${process.cwd()}/brand-discovery-runtime.cjs`)
  compiled.filename = `${process.cwd()}/brand-discovery-runtime.cjs`
  compiled.paths = createRequire(import.meta.url).resolve.paths('react')
  compiled._compile(result.outputFiles[0].text, compiled.filename)
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { act } = React
  const host = document.getElementById('root')
  const rendered = createRoot(host)
  const input = () => host.querySelector('input')
  const stage = () => host.querySelector('[data-testid="brand-voice-path-stage"]')
  const edit = async (value) => act(() => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input(), value)
    input().dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  const submit = async () => act(() => host.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))
  const tick = async (time) => act(() => {
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((callback) => callback(time))
  })

  try {
    await act(() => rendered.render(React.createElement(compiled.exports.LibraryCollection, { onSelect() {} })))
    assert.equal(stage(), null, 'Initial render must have no discovery animation')
    await submit()
    assert.equal(stage(), null, 'An empty submission must not submit animated placeholder examples')
    await edit('https://acme-studio.com')
    assert.equal(stage(), null, 'Typing a URL must not start the animation')
    await act(() => [...host.querySelectorAll('button')].find((button) => button.textContent.startsWith('Apply "')).click())
    assert.equal(Boolean(stage()), false, 'Applying brand preferences must not start the search animation')
    await act(() => host.querySelector('button[aria-label="Search"]').click())
    assert.ok(stage(), 'Clicking Search with a URL must start the animation')
    assert.doesNotMatch(stage().textContent, /Stream & Hold|Marquee|Next/, 'The animation mode controls must stay removed')
    assert.match(stage().textContent, /Acme-studio/)
    const firstText = stage().querySelector('textPath').textContent
    assert.match(firstText, /brand|color|palette|typograph|tone|style|identity|preference/i)
    await tick(100)
    await tick(3500)
    const heldOffset = Number.parseFloat(stage().querySelector('textPath').getAttribute('startOffset'))
    assert.ok(Math.abs(heldOffset - 1.6) < 0.3, 'The streamed message must settle into the complete roller-coaster composition')
    await tick(5700)
    const laterOffset = Number.parseFloat(stage().querySelector('textPath').getAttribute('startOffset'))
    assert.ok(Math.abs(laterOffset - 1.6) < 0.3, 'The complete loop must stay readable instead of disappearing off the path')
    assert.equal(stage().querySelector('textPath').textContent, firstText, 'Keep the same message during the readable hold')
    await tick(9101)
    assert.notEqual(stage().querySelector('textPath').textContent, firstText, 'A completed animation cycle must advance the brand message')
    await edit('https://second-studio.com')
    assert.equal(stage(), null, 'Editing after a submission must hide the previous animation')
    await submit()
    assert.ok(stage(), 'Keyboard form submission must start the animation')
    assert.match(stage().textContent, /Second-studio/)
    assert.doesNotMatch(stage().textContent, /Acme-studio/, 'The submitted brand must replace the previous brand')
    await edit('')
    assert.equal(stage(), null, 'Clearing the input must hide the animation and cancel its frame loop')
    await edit('@creator_studio')
    await submit()
    assert.ok(stage(), 'Social handles remain supported')
    await act(() => [...host.querySelectorAll('button')].find((button) => button.textContent === 'Clear search').click())
    assert.equal(stage(), null)
    assert.equal(input().value, '')
    console.log('brand discovery runtime checks passed')
  } finally {
    await act(() => rendered.unmount())
    dom.window.close()
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})
