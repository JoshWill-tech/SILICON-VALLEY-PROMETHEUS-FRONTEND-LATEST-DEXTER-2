import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

console.log('Running Jarvis Persistent Memory Regression Test...')

// 1. Memory module must exist
assert.ok(existsSync('lib/voice-companion/memory.ts'), 'lib/voice-companion/memory.ts must exist')

// 2. Import memory functions
const {
  getJarvisMemory,
  saveJarvisMemory,
  clearJarvisMemory,
  formatMemoryForSystemInstruction,
} = await import('../lib/voice-companion/memory.ts')

// 3. Test saving and reading brand and editorial context
clearJarvisMemory('test-project')
const initial = getJarvisMemory('test-project')
assert.ok(initial, 'Must return initial memory object')
assert.ok(Array.isArray(initial.editorialDecisions), 'editorialDecisions must be an array')

saveJarvisMemory(
  {
    brandProfile: {
      brandName: 'Vincere Media',
      tone: 'Cinematic High-Tech',
      preferredCaptionStyle: 'karaoke_pop',
      pacing: 'rapid_dynamic',
    },
    editorialDecisions: [
      { timestamp: Date.now(), summary: 'Approved intense trailer soundtrack for intro' },
    ],
    userPreferences: {
      autoRemoveSilences: true,
      silenceThresholdSec: 0.5,
    },
  },
  'test-project'
)

const retrieved = getJarvisMemory('test-project')
assert.equal(retrieved.brandProfile.brandName, 'Vincere Media')
assert.equal(retrieved.brandProfile.preferredCaptionStyle, 'karaoke_pop')
assert.equal(retrieved.editorialDecisions.length, 1)

// 4. Formatter generates concise, high-signal system instruction section
const instructionSnippet = formatMemoryForSystemInstruction(retrieved)
assert.match(instructionSnippet, /Vincere Media/, 'Formatted memory must mention brand name')
assert.match(instructionSnippet, /karaoke_pop/, 'Formatted memory must mention caption preference')
assert.match(instructionSnippet, /intense trailer/, 'Formatted memory must include editorial decision history')

// 5. Test conversation turns and music tracking persistence
saveJarvisMemory(
  {
    recentConversations: [
      { role: 'user', text: 'Can we try the song Heavy K - Uyeke?', timestamp: Date.now() - 5000 },
      { role: 'assistant', text: 'Staged Uyeke by Heavy K for your soundtrack preview.', timestamp: Date.now() - 4000 },
    ],
    lastMusicDiscussed: {
      trackId: 'track-heavyk-uyeke',
      trackTitle: 'Uyeke',
      artist: 'Heavy K',
      timestamp: Date.now() - 4000,
    },
  },
  'test-project'
)

const memoryWithDialogue = getJarvisMemory('test-project')
assert.equal(memoryWithDialogue.recentConversations.length, 2, 'Must retain conversation turns')
assert.equal(memoryWithDialogue.lastMusicDiscussed.trackTitle, 'Uyeke')

const formattedWithTurns = formatMemoryForSystemInstruction(memoryWithDialogue)
assert.match(formattedWithTurns, /PREVIOUS CONVERSATION CONTEXT/, 'Must format conversation context header')
assert.match(formattedWithTurns, /Heavy K - Uyeke/, 'Must format user turns')
assert.match(formattedWithTurns, /Staged Uyeke/, 'Must format assistant turns')
assert.match(formattedWithTurns, /Last Discussed \/ Staged Music Track: "Uyeke by Heavy K"/, 'Must format last discussed track')

// 6. Test ResponseRecovery accepts initial persisted transcripts
const { ResponseRecovery } = await import('../lib/voice-companion/response-recovery.ts')
const seededRecovery = new ResponseRecovery([
  { id: '1', role: 'user', text: 'Hello Jarvis', timestamp: 100, status: 'complete' },
  { id: '2', role: 'assistant', text: 'Hello creator', timestamp: 200, status: 'complete' },
])
assert.equal(seededRecovery.snapshot().length, 2, 'ResponseRecovery must seed from persisted transcripts')
assert.equal(seededRecovery.snapshot()[0].text, 'Hello Jarvis')
assert.equal(seededRecovery.snapshot()[1].text, 'Hello creator')

// 7. Check live client mounts formatted memory and forbids canned "temporary hiccup" evasion
const clientSource = readFileSync('lib/voice-companion/gemini-live-client.ts', 'utf8')
assert.match(clientSource, /formatMemoryForSystemInstruction|getJarvisMemory|memoryInstruction/, 'gemini-live-client must inject persistent memory into system instruction')
assert.doesNotMatch(clientSource, /Simply inform the creator that the cloud render studio had a temporary hiccup/, 'gemini-live-client must not have hardcoded canned hiccup evasion')
assert.match(clientSource, /PREVIOUS CONVERSATION CONTEXT/, 'gemini-live-client instructions must emphasize conversation memory continuity')

// 8. Check hook or bridge updates memory on actions
const hookSource = readFileSync('hooks/use-voice-companion.ts', 'utf8')
assert.match(hookSource, /saveJarvisMemory|getJarvisMemory/, 'useVoiceCompanion must reference persistent memory')
assert.match(hookSource, /recentConversations/, 'useVoiceCompanion must persist conversation turns')
assert.match(hookSource, /lastMusicDiscussed/, 'useVoiceCompanion must persist discussed music')

console.log('jarvis-persistent-memory-regression: all checks passed')
