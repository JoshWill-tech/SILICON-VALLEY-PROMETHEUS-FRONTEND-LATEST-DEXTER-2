import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, unlinkSync, rmdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM } from 'jsdom'

const scratch = resolve('.tmp')
mkdirSync(scratch, { recursive: true })
const dir = mkdtempSync(resolve(scratch, 'jarvis-wavy-test-'))
const bundle = resolve(dir, 'filament.cjs')

await build({
  entryPoints: ['components/navigation/jarvis-top-nav-filament.tsx'],
  outfile: bundle,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  jsx: 'automatic',
  logLevel: 'silent',
  plugins: [{
    name: 'isolate-voice-services',
    setup(builder) {
      const mocks = {
        '@/hooks/use-voice-companion': `
          export const useVoiceCompanion = () => ({
            status: globalThis.jarvisTestStatus || 'disconnected',
            isMuted: false,
            userVolume: globalThis.jarvisTestUserVolume || 0,
            assistantVolume: globalThis.jarvisTestAssistantVolume || 0,
            getUserVolume: () => globalThis.jarvisTestUserVolume || 0,
            getAssistantVolume: () => globalThis.jarvisTestAssistantVolume || 0,
            getStatus: () => globalThis.jarvisTestStatus || 'disconnected',
            transcripts: [],
            error: null,
            connectionNotice: null,
            canReplayResponse: false,
            lastResponseText: '',
            replayLastResponse: async () => {},
            reconnect: async () => {},
            getCapturedAudio: () => null,
            selectedVoice: 'Puck',
            setSelectedVoice: () => {},
            connect: async () => {},
            disconnect: () => {},
            toggleMute: () => {},
            clearTranscripts: () => {},
            sendTextMessage: () => {},
          });
        `,
        '@/lib/voice-companion/bridge': `
          export const getVoiceCompanionBridge = () => globalThis.jarvisTestBridge || {};
          export const subscribeVoiceCompanionBridge = (cb) => () => {};
          export const registerVoiceCompanionBridge = () => {};
          export const unregisterVoiceCompanionBridge = () => {};
        `,
        '@/lib/autonomous-ui/coordinator': 'export const autonomousCoordinator = {};',
        '@/lib/conversation-log': 'export const downloadConversationLog = () => {};',
        '@/components/ui/dock': 'export const Dock = () => null; export const DockItem = () => null; export const DockLabel = () => null; export const DockIcon = () => null;',
        'framer-motion': `import React from 'react';
          export const useReducedMotion = () => globalThis.jarvisTestReducedMotion;
          export const AnimatePresence = ({children}) => children;
          export const motion = {div: ({initial, animate, exit, transition, ...props}) => React.createElement('div', props)};`,
      }
      builder.onResolve({ filter: /.*/ }, ({ path }) => (path in mocks ? { path, namespace: 'jarvis-test' } : undefined))
      builder.onLoad({ filter: /.*/, namespace: 'jarvis-test' }, ({ path }) => ({
        contents: mocks[path],
        loader: 'js',
        resolveDir: process.cwd(),
      }))
    },
  }],
})

const { JarvisTopNavFilament } = createRequire(import.meta.url)(bundle)

function parsePathDeflection(d) {
  if (!d || d === 'M 0 16 L 200 16') return { isFlat: true, maxDeflection: 0, pointCount: 2, hasNaN: false }
  const matches = [...d.matchAll(/([0-9.-]+)\s+([0-9.-]+)/g)]
  if (matches.length <= 2) return { isFlat: true, maxDeflection: 0, pointCount: matches.length, hasNaN: false }
  const yValues = matches.map((m) => parseFloat(m[2]))
  const deflections = yValues.map((y) => Math.abs(y - 16))
  const maxDeflection = Math.max(...deflections)
  return {
    isFlat: maxDeflection < 0.01,
    maxDeflection,
    pointCount: matches.length,
    hasNaN: d.includes('NaN'),
  }
}

async function runFixture({ status, userVolume = 0, assistantVolume = 0, reducedMotion = false, chatBridge = {} }) {
  const dom = new JSDOM('<div id="root"></div>')
  const previous = new Map()
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  }

  const frames = new Map()
  let nextFrame = 0
  previous.set('requestAnimationFrame', Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'))
  previous.set('cancelAnimationFrame', Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame'))
  globalThis.requestAnimationFrame = (callback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  }
  globalThis.cancelAnimationFrame = (id) => frames.delete(id)

  globalThis.jarvisTestReducedMotion = reducedMotion
  globalThis.jarvisTestStatus = status
  globalThis.jarvisTestUserVolume = userVolume
  globalThis.jarvisTestAssistantVolume = assistantVolume
  globalThis.jarvisTestBridge = chatBridge

  const root = createRoot(dom.window.document.getElementById('root'))
  await act(() => root.render(React.createElement(JarvisTopNavFilament)))

  const tick = (timestamp) => {
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((callback) => callback(timestamp))
  }

  const getPath = () => dom.window.document.querySelector('path')?.getAttribute('d')
  const getGlowPath = () => dom.window.document.querySelectorAll('path')[1]?.getAttribute('d')

  return {
    tick,
    getPath,
    getGlowPath,
    pending: () => frames.size,
    async close() {
      await act(() => root.unmount())
      dom.window.close()
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
      }
      delete globalThis.jarvisTestReducedMotion
      delete globalThis.jarvisTestStatus
      delete globalThis.jarvisTestUserVolume
      delete globalThis.jarvisTestAssistantVolume
      delete globalThis.jarvisTestBridge
    },
  }
}

test('Filament animates wave when individual speaks (listening) under normal motion', async () => {
  const fixture = await runFixture({ status: 'listening', userVolume: 0.5, reducedMotion: false })
  try {
    fixture.tick(40)
    fixture.tick(80)
    const d = fixture.getPath()
    const info = parsePathDeflection(d)
    assert.equal(info.hasNaN, false, 'Path must not contain NaN')
    assert.equal(info.isFlat, false, `Path must be wavy when listening, got: ${d}`)
    assert.ok(info.maxDeflection > 3, `Wave deflection must be substantial, got: ${info.maxDeflection}`)
  } finally {
    await fixture.close()
  }
})

test('Filament animates wave when Jarvis speaks (speaking) under normal motion', async () => {
  const fixture = await runFixture({ status: 'speaking', assistantVolume: 0.6, reducedMotion: false })
  try {
    fixture.tick(40)
    fixture.tick(80)
    const d = fixture.getPath()
    const info = parsePathDeflection(d)
    assert.equal(info.hasNaN, false, 'Path must not contain NaN')
    assert.equal(info.isFlat, false, `Path must be wavy when Jarvis speaks, got: ${d}`)
    assert.ok(info.maxDeflection > 5, `Wave deflection must be large when speaking, got: ${info.maxDeflection}`)
  } finally {
    await fixture.close()
  }
})

test('Filament animates wave when individual speaks even with reduced motion enabled', async () => {
  const fixture = await runFixture({ status: 'listening', userVolume: 0.5, reducedMotion: true })
  try {
    fixture.tick(40)
    fixture.tick(80)
    const d = fixture.getPath()
    const info = parsePathDeflection(d)
    assert.equal(info.hasNaN, false, 'Path must not contain NaN')
    assert.equal(info.isFlat, false, `Path must be wavy when listening even with reduced motion, got: ${d}`)
  } finally {
    await fixture.close()
  }
})

test('Filament animates wave when Jarvis speaks even with reduced motion enabled', async () => {
  const fixture = await runFixture({ status: 'speaking', assistantVolume: 0.5, reducedMotion: true })
  try {
    fixture.tick(40)
    fixture.tick(80)
    const d = fixture.getPath()
    const info = parsePathDeflection(d)
    assert.equal(info.hasNaN, false, 'Path must not contain NaN')
    assert.equal(info.isFlat, false, `Path must be wavy when Jarvis speaks even with reduced motion, got: ${d}`)
  } finally {
    await fixture.close()
  }
})

test('Filament animates wave when user speaks in chat (chatVoiceState recording)', async () => {
  const fixture = await runFixture({
    status: 'disconnected',
    chatBridge: {
      chatVoiceState: {
        isRecording: true,
        isSpeaking: false,
        getLevel: () => 0.45,
      },
    },
    reducedMotion: false,
  })
  try {
    fixture.tick(40)
    fixture.tick(80)
    const d = fixture.getPath()
    const info = parsePathDeflection(d)
    assert.equal(info.hasNaN, false, 'Path must not contain NaN')
    assert.equal(info.isFlat, false, `Path must be wavy when chat voice recording, got: ${d}`)
  } finally {
    await fixture.close()
  }
})

test('Filament animates wave when Jarvis speaks in chat (chatVoiceState speaking)', async () => {
  const fixture = await runFixture({
    status: 'disconnected',
    chatBridge: {
      chatVoiceState: {
        isRecording: false,
        isSpeaking: true,
      },
    },
    reducedMotion: false,
  })
  try {
    fixture.tick(40)
    fixture.tick(80)
    const d = fixture.getPath()
    const info = parsePathDeflection(d)
    assert.equal(info.hasNaN, false, 'Path must not contain NaN')
    assert.equal(info.isFlat, false, `Path must be wavy when chat assistant speaking, got: ${d}`)
  } finally {
    await fixture.close()
  }
})
