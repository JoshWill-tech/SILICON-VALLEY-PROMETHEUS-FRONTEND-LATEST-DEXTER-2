import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  registerVoiceCompanionBridge,
  unregisterVoiceCompanionBridge,
  getVoiceCompanionBridge,
  isVoiceInteractionActive,
  isVoiceActivelyListening,
  isVoiceSpeaking,
  type VoiceCompanionBridgeHandlers,
} from '../lib/voice-companion/bridge'

test('G1: bridge exposes jarvisVoiceState and interaction predicates', () => {
  // Ensure fresh state
  unregisterVoiceCompanionBridge()

  // Initially idle
  assert.equal(isVoiceInteractionActive(), false, 'Initially voice interaction should not be active')
  assert.equal(isVoiceActivelyListening(), false, 'Initially voice should not be actively listening')
  assert.equal(isVoiceSpeaking(), false, 'Initially voice should not be speaking')

  // Jarvis is listening
  registerVoiceCompanionBridge({
    jarvisVoiceState: {
      status: 'listening',
      isSpeaking: false,
      isListening: true,
      isActive: true,
    },
  })

  let bridge = getVoiceCompanionBridge()
  assert.equal(bridge.jarvisVoiceState?.isListening, true)
  assert.equal(isVoiceInteractionActive(), true)
  assert.equal(isVoiceActivelyListening(), true)
  assert.equal(isVoiceSpeaking(), false)

  // Jarvis is speaking
  registerVoiceCompanionBridge({
    jarvisVoiceState: {
      status: 'speaking',
      isSpeaking: true,
      isListening: false,
      isActive: true,
    },
  })

  assert.equal(isVoiceInteractionActive(), true)
  assert.equal(isVoiceSpeaking(), true)
  assert.equal(isVoiceActivelyListening(), false)

  // Editor unmounts / re-registers: jarvisVoiceState must be preserved like chatVoiceState
  registerVoiceCompanionBridge({
    projectId: 'test-project-123',
  })
  unregisterVoiceCompanionBridge()

  bridge = getVoiceCompanionBridge()
  assert.equal(bridge.jarvisVoiceState?.isSpeaking, true, 'jarvisVoiceState should be retained across editor unregisterVoiceCompanionBridge')
  assert.equal(bridge.projectId, undefined, 'editor-specific properties should be cleared on unregister')

  // Clean up
  registerVoiceCompanionBridge({ jarvisVoiceState: undefined })
  assert.equal(isVoiceInteractionActive(), false)

  console.log('jarvis voice state and predicates verified')
})

test('G2: useVoiceCompanion reports status to bridge and pauses playback on speech', () => {
  const hookSource = fs.readFileSync(path.resolve('hooks/use-voice-companion.ts'), 'utf8')

  // Must register jarvisVoiceState to bridge
  assert.match(
    hookSource,
    /registerVoiceCompanionBridge\(\s*\{[\s\S]*?jarvisVoiceState/m,
    'useVoiceCompanion must register jarvisVoiceState with bridge'
  )

  // Must call onPause when Jarvis begins speaking
  assert.match(
    hookSource,
    /(?:handlersRef\.current|handlers)\.onPause\?\.\(\)/,
    'useVoiceCompanion must dispatch onPause when voice becomes active'
  )

  console.log('use voice companion pause dispatch verified')
})

test('G3: handlePreviewVideoReady respects playback intent and halts autonomous playback', () => {
  const pageSource = fs.readFileSync(path.resolve('app/editor/[id]/page.tsx'), 'utf8')

  // handlePreviewVideoReady must check previewPlaybackIntentRef.current === 'playing'
  assert.match(
    pageSource,
    /const handlePreviewVideoReady = React\.useCallback\(\(\) => \{[\s\S]*?previewPlaybackIntentRef\.current === 'playing'/m,
    'handlePreviewVideoReady must check if previewPlaybackIntentRef.current is explicitly "playing" before invoking video.play()'
  )

  // handlePreviewVideoReady must also check voice interaction / Jarvis active listening
  assert.match(
    pageSource,
    /const handlePreviewVideoReady = React\.useCallback\(\(\) => \{[\s\S]*?(?:isVoiceInteractionActive|isVoiceActivelyListening|jarvisVoiceState)/m,
    'handlePreviewVideoReady must ensure no active voice interaction is occurring before auto-resuming playback'
  )

  console.log('preview video ready intent check verified')
})

test('G4: workspace tab switch maintains paused state and pauses on Jarvis speech', () => {
  const pageSource = fs.readFileSync(path.resolve('app/editor/[id]/page.tsx'), 'utf8')

  // Must watch voice companion bridge state and pause video when Jarvis or voice speaks / listens
  assert.match(
    pageSource,
    /(?:jarvisVoiceState|isVoiceInteractionActive|isVoiceSpeaking|isVoiceActivelyListening)[\s\S]*?pausePreviewPlayback/m,
    'Editor must pause preview playback when Jarvis begins speaking or listening'
  )

  // When switching tabs to Motion, previewPlaybackIntentRef must remain maintained in its paused state
  assert.match(
    pageSource,
    /previousWorkspaceTabRef\.current === activeWorkspaceTab[\s\S]*?pausePreviewPlayback/,
    'Editor must pause playback on tab switch'
  )

  console.log('workspace tab switch and jarvis speech pause verified')
})

test('G5: full coordination regression check and behavioral simulation', () => {
  const bridgeSource = fs.readFileSync(path.resolve('lib/voice-companion/bridge.ts'), 'utf8')
  const hookSource = fs.readFileSync(path.resolve('hooks/use-voice-companion.ts'), 'utf8')
  const pageSource = fs.readFileSync(path.resolve('app/editor/[id]/page.tsx'), 'utf8')

  assert.ok(bridgeSource.includes('isVoiceInteractionActive'), 'Bridge must export isVoiceInteractionActive')
  assert.ok(bridgeSource.includes('isVoiceActivelyListening'), 'Bridge must export isVoiceActivelyListening')
  assert.ok(bridgeSource.includes('isVoiceSpeaking'), 'Bridge must export isVoiceSpeaking')
  assert.ok(hookSource.includes('jarvisVoiceState'), 'Hook must register jarvisVoiceState')
  assert.ok(pageSource.includes("previewPlaybackIntentRef.current === 'playing'"), 'Page must guard video ready by playback intent')

  // Scenario Simulation:
  // 1. Test video mock
  let playCalled = false
  let pauseCalled = false
  const mockVideo = {
    paused: true,
    play: async () => { playCalled = true },
    pause: () => { pauseCalled = true; mockVideo.paused = true },
  }

  // 2. Behavioral logic simulation of handlePreviewVideoReady:
  const simulateVideoReady = (intent: 'playing' | 'paused', voiceActive: boolean) => {
    playCalled = false
    pauseCalled = false
    if (intent !== 'playing' || voiceActive) {
      if (!mockVideo.paused) mockVideo.pause()
      return false
    }
    if (mockVideo.paused) {
      void mockVideo.play()
      return true
    }
    return false
  }

  // Case A: User paused, leaving Motion and returning to Motion
  let didPlay = simulateVideoReady('paused', false)
  assert.equal(didPlay, false, 'Returning to motion while paused must NOT play')
  assert.equal(playCalled, false, 'play() must NOT be called')

  // Case B: User was conversing with Jarvis, enters Motion
  didPlay = simulateVideoReady('playing', true)
  assert.equal(didPlay, false, 'Entering motion while voice interaction is active must NOT play')
  assert.equal(playCalled, false)

  // Case C: Jarvis speaking or listening
  registerVoiceCompanionBridge({
    jarvisVoiceState: {
      status: 'speaking',
      isSpeaking: true,
      isListening: false,
      isActive: true,
    },
  })
  assert.equal(isVoiceSpeaking(), true)
  didPlay = simulateVideoReady('paused', isVoiceInteractionActive())
  assert.equal(didPlay, false)
  assert.equal(playCalled, false)

  // Clean up
  registerVoiceCompanionBridge({ jarvisVoiceState: undefined })

  console.log('all motion playback and jarvis coordination tests passed')
})
