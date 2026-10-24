import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const args = process.argv.slice(2)
const checkAll = args.includes('--all') || args.length === 0

function runGate1() {
  const docPath = 'docs/thumbnail-studio/HIGH_TIER_CINEMATIC_SEED_SYSTEM.md'
  assert.ok(existsSync(docPath), 'High-tier documentation file must exist')
  const doc = readFileSync(docPath, 'utf8')
  assert.match(doc, /Reference Seed Architecture & Catalog/, 'Must document reference seed catalog')
  assert.match(doc, /Kallaway 100\+ Viral Seed Catalog/, 'Must document Kallaway 100+ seeds')
  assert.match(doc, /loadStudioReferenceDataUrl/, 'Must document server-side disk loading')
  assert.match(doc, /Two-Stage Multimodal Vision & Style-Lock Pipeline/, 'Must document multimodal style-lock')
  assert.match(doc, /Strict Anti-Slop Guidelines/, 'Must define strict anti-slop guidelines')
  assert.match(doc, /Facial Likeness & Identity Preservation/, 'Must require facial likeness preservation')
  assert.match(doc, /Lighting Hierarchy/, 'Must require cinematic lighting hierarchy')
  assert.match(doc, /Zero-Interrogation Principle/, 'Must mandate zero-interrogation autonomous rule')
  console.log('G1 documentation check passed')
}

function runGate2() {
  const hook = readFileSync('hooks/use-voice-companion.ts', 'utf8')
  const client = readFileSync('lib/voice-companion/gemini-live-client.ts', 'utf8')
  assert.match(hook, /transcriptSummary:/, 'get_editor_state must return transcriptSummary')
  assert.ok(hook.includes('thumbnail: bridge.getThumbnailState?.()'), 'get_editor_state must return live thumbnail state')
  assert.match(client, /DO NOT ask the user "what is the subject or topic of your video\?"/, 'Instruction must forbid asking user what the video subject is')
  assert.match(client, /Call get_editor_state and inspect_video first/, 'Instruction must mandate inspect_video and get_editor_state')
  console.log('G2 context extraction check passed')
}

function runGate3() {
  const modal = readFileSync('components/editor/ThumbnailStudioModal.tsx', 'utf8')
  const route = readFileSync('app/api/projects/[id]/thumbnails/ai-curate/route.ts', 'utf8')
  assert.match(modal, /!headlineTouchedRef\.current && !jarvisDraft\?\.headline && !jarvisDraft\?\.creativeDirection && hookTitles\.length/, 'ai-curate must not override user/jarvis headlines')
  assert.match(route, /CRITICAL CONTENT TRUTH:/, 'ai-curate prompt must enforce content truth')
  assert.match(route, /Do NOT generate generic or fabricated clickbait/, 'ai-curate must ban generic clickbait')
  console.log('G3 headline preservation check passed')
}

function runGate4() {
  const workspace = readFileSync('components/editor/thumbnail-studio/ThumbnailWorkspace.tsx', 'utf8')
  const styles = readFileSync('components/editor/thumbnail-studio/ThumbnailWorkspace.styles.ts', 'utf8')
  assert.match(workspace, /progressBarTrack/, 'Workspace must render progress bar track')
  assert.match(workspace, /progressBarFill/, 'Workspace must render progress bar fill')
  assert.match(workspace, /progressPercentText/, 'Workspace must render progress percentage text')
  assert.match(workspace, /progressStageText/, 'Workspace must render progress stage text')
  assert.match(styles, /prom-thumbnail-progress-track/, 'Styles must define progress track class')
  assert.match(styles, /prom-thumbnail-progress-fill/, 'Styles must define progress fill class')
  assert.match(styles, /prom-thumbnail-progress-percent/, 'Styles must define progress percent class')
  console.log('G4 progress UI check passed')
}

function runGate5() {
  const bridge = readFileSync('lib/voice-companion/bridge.ts', 'utf8')
  const client = readFileSync('lib/voice-companion/gemini-live-client.ts', 'utf8')
  const hook = readFileSync('hooks/use-voice-companion.ts', 'utf8')
  const page = readFileSync('app/editor/[id]/page.tsx', 'utf8')
  assert.match(bridge, /getThumbnailState\?: \(\) =>/, 'Bridge must declare getThumbnailState')
  assert.match(client, /name: 'get_thumbnail_status'/, 'gemini-live-client must declare get_thumbnail_status tool')
  assert.match(hook, /case 'get_thumbnail_status':/, 'useVoiceCompanion must handle get_thumbnail_status tool')
  assert.match(page, /thumbnailProgressRef/, 'Editor page must maintain thumbnailProgressRef')
  assert.match(page, /getThumbnailState: \(\) =>/, 'Editor page bridge must expose getThumbnailState')
  console.log('G5 status bridge check passed')
}

function runGate6() {
  const streamer = readFileSync('lib/voice-companion/audio-streamer.ts', 'utf8')
  const client = readFileSync('lib/voice-companion/gemini-live-client.ts', 'utf8')
  const hook = readFileSync('hooks/use-voice-companion.ts', 'utf8')
  assert.match(streamer, /this\.userSpeechFrames >= 2/, 'audio-streamer must require sustained speech frames to avoid pop cuts')
  assert.match(client, /Do NOT say "No video is attached yet" on casual greetings/, 'Instruction must gate missing video warning')
  assert.match(client, /NEVER say "I'm ready for your next instruction" or claim completion while generation is in progress/, 'Instruction must forbid premature completion cue')
  assert.match(client, /TURN-TAKING AND HESITATION DISCIPLINE:/, 'Instruction must enforce hesitation discipline')
  assert.ok(hook.includes('/^(more|basically|the|a|um|uh|yeah)$/i.test(rawHeadline)'), 'useVoiceCompanion must filter single-word filler headlines')
  assert.ok(hook.includes('/seba\\s+crimes/i') || hook.includes('seba\\s+crimes') || /seba\\s\+crimes/i.test(hook), 'useVoiceCompanion must rectify phonetic transcript errors')
  console.log('G6 voice guards check passed')
}

if (args.includes('--check-docs')) {
  runGate1()
} else if (args.includes('--check-context')) {
  runGate2()
} else if (args.includes('--check-headline')) {
  runGate3()
} else if (args.includes('--check-progress-ui')) {
  runGate4()
} else if (args.includes('--check-status-bridge')) {
  runGate5()
} else if (args.includes('--check-voice-guards')) {
  runGate6()
} else {
  runGate1()
  runGate2()
  runGate3()
  runGate4()
  runGate5()
  runGate6()
  console.log('All autonomous thumbnail gates passed')
}
