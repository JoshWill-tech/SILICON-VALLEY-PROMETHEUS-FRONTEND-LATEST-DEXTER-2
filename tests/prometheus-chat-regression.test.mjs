import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const editorPage = read('app/editor/[id]/page.tsx')
  const route = read('app/api/prometheus-chat/route.ts')
  const retrieval = read('lib/prometheus-assistant/retrieval.ts')
  const knowledge = read('lib/prometheus-assistant/knowledge.generated.ts')

  assert.equal(editorPage.includes('md:w-[420px]'), false)
  assert.equal(editorPage.includes('lg:w-[420px]'), false)
  assert.equal(editorPage.includes('max-w-[420px]'), false)
  assert.match(editorPage, /z-\[120\]/)
  assert.match(editorPage, /setChatComposerPortal[\s\S]*z-\[120\]/)
  assert.match(editorPage, /md:w-\[min\(1080px,calc\(100vw-48px\)\)\]/)
  assert.match(editorPage, /chatMorphVariants/)
  assert.match(editorPage, /type: 'spring'/)
  assert.match(editorPage, /mass: 1\.2/)

  assert.match(editorPage, /const endpoint = shouldEditRequest \? '\/api\/chat' : '\/api\/prometheus-chat'/)
  assert.equal(editorPage.includes("const endpoint = shouldEditRequest ? '/api/chat' : '/api/rag'"), false)

  assert.match(editorPage, /AiResponseLoader/)
  assert.match(editorPage, /function ChatToolCallGroup/)
  assert.match(editorPage, /function ChatFrameReferenceStrip/)
  assert.match(editorPage, /function ChatAttachmentStrip/)
  assert.equal(editorPage.includes('function ChatSkeletonLoader'), false)
  assert.equal(editorPage.includes('<ChatSkeletonLoader'), false)
  assert.match(editorPage, /<ChatToolCallGroup/)
  assert.match(editorPage, /<ChatFrameReferenceStrip/)
  assert.match(editorPage, /<ChatAttachmentStrip/)
  assert.match(editorPage, /readImageAttachment/)
  assert.match(editorPage, /pendingChatAttachments/)

  assert.match(editorPage, /const nextToolCalls = normalizeChatToolCalls\(payload\?\.toolCalls\)/)
  assert.match(editorPage, /const nextFrames = normalizeChatFrames\(payload\?\.frames\)/)
  assert.match(editorPage, /const nextAttachments = normalizeChatAttachments\(payload\?\.attachments\)/)

  assert.match(route, /import Groq from 'groq-sdk'/)
  assert.match(route, /const PROMETHEUS_TOOLS =/)
  assert.match(route, /name: 'search_prometheus_knowledge'/)
  assert.match(route, /name: 'reference_video_frames'/)
  assert.match(route, /name: 'draft_editor_actions'/)
  assert.match(route, /tools: PROMETHEUS_TOOLS as never/)
  assert.match(route, /tool_choice: 'auto'/)
  assert.match(route, /normalizeGroqToolCalls/)
  assert.match(route, /executePrometheusTool/)
  assert.match(route, /toolCalls: executedToolCalls/)
  assert.match(route, /frames: toFramePayload\(frameReferences, executedToolCalls\)/)

  assert.match(retrieval, /PROMETHEUS_KNOWLEDGE_CHUNKS/)
  assert.match(retrieval, /export function retrievePrometheusKnowledge/)
  assert.match(retrieval, /export function formatKnowledgeContext/)
  assert.match(retrieval, /export function createExtractivePrometheusAnswer/)

  for (const source of [
    '01_prometheus_system_overview.pdf',
    '02_video_editing_best_practices.pdf',
    '03_user_scenarios_troubleshooting.pdf',
    '04_tool_calling_guide.pdf',
    '05_creative_workflows.pdf',
  ]) {
    assert.equal(knowledge.includes(`"source": "${source}"`), true, source)
  }
}

run()
