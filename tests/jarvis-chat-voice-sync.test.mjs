import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const bundled = await build({
  entryPoints: ['lib/voice-companion/bridge.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
})

const mod = { exports: {} }
const fn = new Function('module', 'exports', bundled.outputFiles[0].text)
fn(mod, mod.exports)

const {
  registerVoiceCompanionBridge,
  unregisterVoiceCompanionBridge,
  getVoiceCompanionBridge,
} = mod.exports

test('bridge preserves chatVoiceState across general editor unregistrations', () => {
  // 1. Chat registers recording/speaking state
  registerVoiceCompanionBridge({
    chatVoiceState: {
      isRecording: true,
      isSpeaking: false,
      getLevel: () => 0.75,
    },
  })

  let bridge = getVoiceCompanionBridge()
  assert.equal(bridge.chatVoiceState?.isRecording, true)
  assert.equal(bridge.chatVoiceState?.getLevel?.(), 0.75)

  // 2. Editor registers handlers
  registerVoiceCompanionBridge({
    projectId: 'project-test-123',
    videoTitle: 'Test Video',
  })

  bridge = getVoiceCompanionBridge()
  assert.equal(bridge.projectId, 'project-test-123')
  assert.equal(bridge.chatVoiceState?.isRecording, true)

  // 3. Editor re-renders or unmounts, calling unregisterVoiceCompanionBridge()
  unregisterVoiceCompanionBridge()

  bridge = getVoiceCompanionBridge()
  // Editor handlers should be cleared
  assert.equal(bridge.projectId, undefined)
  assert.equal(bridge.videoTitle, undefined)
  // But chatVoiceState must be retained so the top nav filament stays audio-reactive
  assert.ok(bridge.chatVoiceState, 'chatVoiceState must survive editor unregistration')
  assert.equal(bridge.chatVoiceState?.isRecording, true)

  // 4. Chat explicitly unregisters when recording completes
  registerVoiceCompanionBridge({
    chatVoiceState: undefined,
  })

  bridge = getVoiceCompanionBridge()
  assert.equal(bridge.chatVoiceState, undefined)
})

test('bridge allows chat speaking state to propagate to filament', () => {
  registerVoiceCompanionBridge({
    chatVoiceState: {
      isRecording: false,
      isSpeaking: true,
    },
  })

  const bridge = getVoiceCompanionBridge()
  assert.equal(bridge.chatVoiceState?.isSpeaking, true)

  unregisterVoiceCompanionBridge()
  assert.equal(getVoiceCompanionBridge().chatVoiceState?.isSpeaking, true)

  registerVoiceCompanionBridge({ chatVoiceState: undefined })
  assert.equal(getVoiceCompanionBridge().chatVoiceState, undefined)
})
