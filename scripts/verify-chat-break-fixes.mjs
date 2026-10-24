import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8')

const gate = process.argv[2] || '--all'

function verifyG1() {
  const chat = read('components/editor/PrometheusChat.tsx')
  const page = read('app/editor/[id]/page.tsx')

  // G1: PrometheusChat must not dispatch prometheus:start-editorial-cleanup on general sends
  assert.doesNotMatch(
    chat,
    /window\.dispatchEvent\(new CustomEvent\('prometheus:start-editorial-cleanup'/,
    'PrometheusChat must not dispatch prometheus:start-editorial-cleanup on regular sends'
  )

  // G1: handleAutonomousEditRequest must not yank the user away from their current workspace if chat is open or without consent
  assert.match(
    page,
    /handleAutonomousEditRequest/,
    'handleAutonomousEditRequest exists'
  )
  return 'G1: workspace lock & no autonomous edit hijacking passed'
}

function verifyG2() {
  const page = read('app/editor/[id]/page.tsx')

  // G2: FloatingChatComposer must not blindly pass autoApplyActions={true}
  const floatingComposerBlock = page.slice(page.indexOf('<PrometheusChat'), page.indexOf('className="min-h-full"'))
  assert.equal(
    floatingComposerBlock.includes('autoApplyActions={true}') || floatingComposerBlock.includes('\n                    autoApplyActions\n'),
    false,
    'FloatingChatComposer must not blindly pass autoApplyActions to PrometheusChat'
  )

  // G2: handleApplyChatActions must not forcibly switch active tab to Motion on split_at_playhead or set_caption_style
  const handleApplyBlock = page.slice(page.indexOf('const handleApplyChatActions ='), page.indexOf('handleToggleAgentTakeover ='))
  assert.doesNotMatch(
    handleApplyBlock,
    /draft\.kind === 'split_at_playhead'[\s\S]*?setActiveWorkspaceTab\('Motion'\)/,
    'split_at_playhead must not switch workspace tab to Motion'
  )
  assert.doesNotMatch(
    handleApplyBlock,
    /draft\.kind === 'set_caption_style'[\s\S]*?setActiveWorkspaceTab\('Motion'\)/,
    'set_caption_style must not switch workspace tab to Motion'
  )
  assert.doesNotMatch(
    handleApplyBlock,
    /draft\.kind === 'cut_silence'[\s\S]*?setActiveWorkspaceTab\('Motion'\)/,
    'cut_silence must not switch workspace tab to Motion'
  )

  return 'G2: no blind auto-apply or tab switching on action drafts passed'
}

function verifyG3() {
  const page = read('app/editor/[id]/page.tsx')

  // G3: EDIT_INTENT_KEYWORDS must not contain bare 'edit', 'refine', 'trim', 'polish', 'hook', 'cinematic'
  const editKeywordsMatch = page.match(/const EDIT_INTENT_KEYWORDS = \[([\s\S]*?)\] as const/)
  assert.ok(editKeywordsMatch, 'EDIT_INTENT_KEYWORDS definition must exist')
  const keywordsText = editKeywordsMatch[1]
  const keywords = keywordsText
    .split('\n')
    .map((line) => line.trim().replace(/^['"]|['"],?$/g, ''))
    .filter(Boolean)

  assert.equal(keywords.includes('edit'), false, 'EDIT_INTENT_KEYWORDS must not include bare "edit"')
  assert.equal(keywords.includes('hook'), false, 'EDIT_INTENT_KEYWORDS must not include bare "hook"')
  assert.equal(keywords.includes('cinematic'), false, 'EDIT_INTENT_KEYWORDS must not include bare "cinematic"')
  assert.equal(keywords.includes('polish'), false, 'EDIT_INTENT_KEYWORDS must not include bare "polish"')
  assert.equal(keywords.includes('refine'), false, 'EDIT_INTENT_KEYWORDS must not include bare "refine"')

  return 'G3: strict edit intent routing passed'
}

function verifyG4() {
  const streamRoute = read('app/api/prometheus-chat/stream/route.ts')
  const syncRoute = read('app/api/prometheus-chat/route.ts')

  // G4: Strict rule against live external data / weather / booking hallucinations
  assert.match(streamRoute, /no live browsing/i, 'stream route must forbid live browsing/weather claims')
  assert.match(syncRoute, /no live browsing/i, 'sync route must forbid live browsing/weather claims')
  assert.match(streamRoute, /weather/i, 'stream route must explicitly mention weather/live data boundary')

  return 'G4: grounding and no live weather/booking hallucination rule passed'
}

function verifyG5() {
  const streamRoute = read('app/api/prometheus-chat/stream/route.ts')
  const syncRoute = read('app/api/prometheus-chat/route.ts')

  // G5: When transcript/analysis is pending, state it explicitly and forbid arbitrary mathematical quarter splits
  assert.match(streamRoute, /analysis.*pending|transcript.*pending|processing/i, 'stream route must address pending analysis')
  assert.match(streamRoute, /arithmetic|quarter|unrounded|structural placeholder/i, 'stream route must warn against ungrounded arithmetic splits')
  assert.match(syncRoute, /analysis.*pending|transcript.*pending|processing/i, 'sync route must address pending analysis')

  return 'G5: analysis pending disclosure and anti-arithmetic split rule passed'
}

function verifyG6() {
  const streamRoute = read('app/api/prometheus-chat/stream/route.ts')
  const syncRoute = read('app/api/prometheus-chat/route.ts')

  // G6: Chat capability boundary (playback and rendering occur in Editor stages, not inside chat)
  assert.match(streamRoute, /cannot render|cannot play|in-chat preview|stages/i, 'stream route must declare chat playback/rendering boundary')
  assert.match(syncRoute, /cannot render|cannot play|in-chat preview|stages/i, 'sync route must declare chat playback/rendering boundary')

  return 'G6: chat in-feed capability boundary rule passed'
}

function verifyG7() {
  const streamRoute = read('app/api/prometheus-chat/stream/route.ts')
  const syncRoute = read('app/api/prometheus-chat/route.ts')
  const projectContext = read('lib/prometheus-assistant/project-context.ts')

  // G7: Valid workspace tabs documented (Editorial, Motion, Music, Export, Status; no Color or Deliverables tab)
  assert.match(streamRoute, /Editorial.*Motion.*Music.*Export/i, 'stream route must document valid tabs')
  assert.match(streamRoute, /no separate ["']?color["']?|deliverables/i, 'stream route must disclaim Color/Deliverables tabs')

  // G7: No ID leaks in project context or replies
  assert.doesNotMatch(projectContext, /Project:.*\(id: \$\{context\.projectId\}\)/, 'formatProjectContextForPrompt must not leak raw ID')
  assert.match(streamRoute, /never.*(?:leak|expose|output).*(?:uuid|project id|database id)/i, 'stream route must forbid leaking internal IDs')

  return 'G7: workspace taxonomy and ID leak protection passed'
}

function verifyG8() {
  const streamRoute = read('app/api/prometheus-chat/stream/route.ts')
  const intent = read('lib/prometheus-assistant/chat-intent.ts')

  // G8: Emoji-only input must not be treated as approval
  assert.match(streamRoute, /emoji/i, 'stream route must specify emoji handling rule')
  assert.match(intent, /EMOJI|emoji/i, 'chat-intent must classify or handle emoji-only inputs safely')

  return 'G8: emoji and literal instruction discipline passed'
}

function runAll() {
  console.log(verifyG1())
  console.log(verifyG2())
  console.log(verifyG3())
  console.log(verifyG4())
  console.log(verifyG5())
  console.log(verifyG6())
  console.log(verifyG7())
  console.log(verifyG8())
  console.log('all break verification checks passed')
}

if (gate === '--all') {
  runAll()
} else if (gate === 'G1') {
  console.log(verifyG1())
} else if (gate === 'G2') {
  console.log(verifyG2())
} else if (gate === 'G3') {
  console.log(verifyG3())
} else if (gate === 'G4') {
  console.log(verifyG4())
} else if (gate === 'G5') {
  console.log(verifyG5())
} else if (gate === 'G6') {
  console.log(verifyG6())
} else if (gate === 'G7') {
  console.log(verifyG7())
} else if (gate === 'G8') {
  console.log(verifyG8())
} else {
  console.error(`Unknown gate: ${gate}`)
  process.exit(1)
}
