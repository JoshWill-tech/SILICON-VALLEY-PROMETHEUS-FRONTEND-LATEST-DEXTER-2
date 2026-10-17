import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtempSync, mkdirSync, unlinkSync, rmdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import sharp from 'sharp'

const scratch = resolve('.tmp')
mkdirSync(scratch, { recursive: true })
const dir = mkdtempSync(resolve(scratch, 'jarvis-filament-'))
const bundle = resolve(dir, 'component.cjs')
await build({
  entryPoints: ['components/navigation/jarvis-top-nav-filament.tsx'],
  outfile: bundle, bundle: true, platform: 'node', format: 'cjs',
  packages: 'external', jsx: 'automatic', logLevel: 'silent',
  plugins: [{ name: 'isolate-voice-services', setup(builder) {
    const mocks = {
      '@/hooks/use-voice-companion': 'export const useVoiceCompanion = () => globalThis.jarvisTestCompanion;',
      '@/lib/voice-companion/bridge': 'const snapshot = {}; export const getVoiceCompanionBridge = () => snapshot; export const subscribeVoiceCompanionBridge = () => () => {};',
      '@/lib/autonomous-ui/coordinator': 'export const autonomousCoordinator = {};',
      '@/lib/conversation-log': 'export const downloadConversationLog = () => {};',
      '@/components/ui/dock': 'export const Dock = () => null; export const DockItem = () => null; export const DockLabel = () => null; export const DockIcon = () => null;',
      'framer-motion': `import React from 'react';
        export const useReducedMotion = () => globalThis.jarvisTestReducedMotion;
        export const AnimatePresence = ({children}) => children;
        export const motion = {div: ({initial, animate, exit, transition, ...props}) => React.createElement('div', props)};`,
    }
    builder.onResolve({ filter: /.*/ }, ({path}) => path in mocks ? {path, namespace: 'jarvis-test'} : undefined)
    builder.onLoad({ filter: /.*/, namespace: 'jarvis-test' }, ({path}) => ({contents: mocks[path], loader: 'js', resolveDir: process.cwd()}))
  } }],
})
const { JarvisTopNavFilament } = createRequire(import.meta.url)(bundle)
after(() => { unlinkSync(bundle); rmdirSync(dir) })

async function fixture(status, reducedMotion = false) {
  const dom = new JSDOM('<div id="root"></div>')
  const previous = new Map()
  for (const [key, value] of Object.entries({window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true})) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, {value, configurable: true, writable: true})
  }
  const frames = new Map()
  let nextFrame = 0
  previous.set('requestAnimationFrame', Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'))
  previous.set('cancelAnimationFrame', Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame'))
  globalThis.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame }
  globalThis.cancelAnimationFrame = id => frames.delete(id)
  globalThis.jarvisTestReducedMotion = reducedMotion
  globalThis.jarvisTestCompanion = {status, transcripts: [], getUserVolume: () => 0, getAssistantVolume: () => 0}
  const root = createRoot(dom.window.document.getElementById('root'))
  await act(() => root.render(React.createElement(JarvisTopNavFilament)))
  return {
    svg: () => dom.window.document.querySelector('svg'),
    tick: timestamp => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(timestamp)) },
    pending: () => frames.size,
    async close() {
      await act(() => root.unmount())
      assert.equal(frames.size, 0, 'Unmount must cancel the animation frame')
      dom.window.close()
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
      }
      delete globalThis.jarvisTestCompanion
      delete globalThis.jarvisTestReducedMotion
    },
  }
}

async function paintedPixels(svg) {
  const copy = svg.cloneNode(true)
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  copy.setAttribute('width', '200')
  copy.setAttribute('height', '32')
  const {data, info} = await sharp(Buffer.from(copy.outerHTML)).ensureAlpha().raw().toBuffer({resolveWithObject: true})
  let painted = 0
  for (let i = 3; i < data.length; i += info.channels) if (data[i] > 20) painted++
  return painted
}

for (const [status, reduced] of [['disconnected', false], ['listening', true], ['speaking', true]]) {
  test(`Jarvis remains visible when ${status}, reduced motion=${reduced}`, async () => {
    const view = await fixture(status, reduced)
    try {
      assert.equal(view.pending(), 0, 'Static mode must not schedule animation frames')
      assert.ok(await paintedPixels(view.svg()) > 150, 'The real flat-line SVG must paint a visible filament')
      for (const index of [0, 1]) {
        const layer = view.svg().cloneNode(true)
        layer.querySelectorAll('path')[1 - index].remove()
        assert.ok(await paintedPixels(layer) > 150, `Filament layer ${index} must render independently`)
      }
      const control = view.svg().cloneNode(true)
      control.querySelectorAll('path').forEach(path => path.setAttribute('stroke', 'none'))
      assert.equal(await paintedPixels(control), 0, 'The pixel check must detect an invisible control')
    } finally { await view.close() }
  })
}

for (const status of ['listening', 'speaking', 'connecting', 'interrupted']) {
  test(`Jarvis paints and animates while ${status}`, async () => {
    const view = await fixture(status)
    try {
      view.tick(40)
      const first = view.svg().querySelector('path').getAttribute('d')
      view.tick(80)
      const second = view.svg().querySelector('path').getAttribute('d')
      assert.notEqual(second, first, 'The waveform must advance between frames even in silence')
      assert.doesNotMatch(second, /NaN|Infinity/)
      assert.ok(await paintedPixels(view.svg()) > 150, 'The animated SVG must paint a visible filament')
    } finally { await view.close() }
  })
}
