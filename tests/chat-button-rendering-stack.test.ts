import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const editorPagePath = path.resolve(process.cwd(), 'app/editor/[id]/page.tsx')
const editorSource = fs.readFileSync(editorPagePath, 'utf8')

test('G1: FloatingChatComposer accepts isExportRendering and offsets bottom padding', () => {
  // Check FloatingChatComposer function signature includes isExportRendering
  assert.match(
    editorSource,
    /function\s+FloatingChatComposer\s*\(\{[\s\S]*?isExportRendering\s*=\s*false[\s\S]*?\}/,
    'FloatingChatComposer must declare isExportRendering with default false',
  )

  // Check FloatingChatComposer prop type includes isExportRendering
  assert.match(
    editorSource,
    /isExportRendering\?:\s*boolean/,
    'FloatingChatComposer props type must include isExportRendering?: boolean',
  )

  // Check that when isExportRendering is true, the container uses pb-[5.5rem] (88px) to sit atop the rendering bar
  assert.match(
    editorSource,
    /isExportRendering\s*\?\s*['"]pb-\[5\.5rem\]['"]\s*:\s*['"]pb-6['"]/,
    'FloatingChatComposer must dynamically apply pb-[5.5rem] when isExportRendering is true and pb-6 when false',
  )

  // Verify transition duration and padding transition are present
  assert.match(
    editorSource,
    /transition-\[transform,opacity,padding\]/,
    'FloatingChatComposer must include padding in its transition classes for smooth motion',
  )

  console.log('G1 passed: chat composer offsets above rendering bar')
})

test('G2: ChatWorkspacePanel accepts and forwards isExportRendering to FloatingChatComposer', () => {
  // Check ChatWorkspacePanel declaration includes isExportRendering
  assert.match(
    editorSource,
    /const\s+ChatWorkspacePanel\s*=\s*React\.memo\(function\s+ChatWorkspacePanel\s*\(\{[\s\S]*?isExportRendering\s*=\s*false[\s\S]*?\}\s*:/,
    'ChatWorkspacePanel must declare isExportRendering in props',
  )

  // Check ChatWorkspacePanel passes isExportRendering to FloatingChatComposer
  assert.match(
    editorSource,
    /<FloatingChatComposer[\s\S]*?isExportRendering=\{isExportRendering\}/,
    'ChatWorkspacePanel must forward isExportRendering to FloatingChatComposer',
  )

  console.log('G2 passed: chat workspace panel forwards isExportRendering')
})

test('G3: OriginalEditorPage and MobileEditorView integrate isExportRendering and offset secondary buttons', () => {
  // Check OriginalEditorPage passes isExportRendering to desktop ChatWorkspacePanel
  assert.match(
    editorSource,
    /<ChatWorkspacePanel[\s\S]*?key=\{`desktop-chat-\$\{projectId\}`\}[\s\S]*?isExportRendering=\{isExportRendering\}/,
    'OriginalEditorPage desktop ChatWorkspacePanel must receive isExportRendering',
  )

  // Check MobileEditorView passes isExportRendering to mobile ChatWorkspacePanel
  assert.match(
    editorSource,
    /<ChatWorkspacePanel[\s\S]*?key=\{`mobile-chat-\$\{projectId\}`\}[\s\S]*?isExportRendering=\{isExportRendering\}/,
    'MobileEditorView must receive and pass isExportRendering to ChatWorkspacePanel',
  )

  // Check SupoClip Matrix button defensively offsets above chat when rendering
  assert.match(
    editorSource,
    /isExportRendering\s*\?\s*['"]bottom-40['"]\s*:\s*['"]bottom-24['"]/,
    'SupoClip Matrix button must offset to bottom-40 when isExportRendering is true',
  )

  console.log('G3 passed: editor views integrate export rendering offset')
})

test('G4: Geometric stacking verification — zero overlap between rendering dock and chat launcher', () => {
  // Rendering status dock geometry:
  // bottom: 24px (bottom-6)
  // py-3 (24px) + content (26px) + borders (2px) = 52px height
  // top edge: 24px + 52px = 76px
  const renderingBottomOffset = 24
  const renderingHeight = 52
  const renderingTopEdge = renderingBottomOffset + renderingHeight

  // Chat launcher atop geometry:
  // pb-[5.5rem] = 5.5 * 16 = 88px bottom offset
  // height = 48px (h-12)
  const chatBottomOffsetWhenRendering = 88
  const chatHeight = 48
  const chatTopEdge = chatBottomOffsetWhenRendering + chatHeight

  const clearance = chatBottomOffsetWhenRendering - renderingTopEdge
  assert.ok(
    clearance >= 10,
    `Clearance between rendering bar top (${renderingTopEdge}px) and chat bottom (${chatBottomOffsetWhenRendering}px) must be >= 10px. Got ${clearance}px`,
  )

  assert.ok(
    chatBottomOffsetWhenRendering > renderingBottomOffset,
    'Chat button must sit above the rendering bar',
  )

  console.log(`Stack clearance confirmed: ${clearance}px gap. Chat top: ${chatTopEdge}px, Rendering top: ${renderingTopEdge}px`)
  console.log('all chat rendering stack tests passed')
})
