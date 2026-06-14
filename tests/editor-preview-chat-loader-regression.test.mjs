import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const editorPage = read('app/editor/[id]/page.tsx')
  assert.match(editorPage, /visiblePreviewUrl: sourceStageVisiblePreviewUrl/)
  assert.match(editorPage, /currentPreviewUrl: stableProjectPreviewUrl/)
  assert.match(editorPage, /const previewUrl = sourceStageVisiblePreviewUrl \?\? stableProjectPreviewUrl \?\? ''/)
  assert.match(editorPage, /resolvedComposerPortalTarget/)
  assert.match(editorPage, /document\.body/)
  assert.match(editorPage, /createPortal\([\s\S]*resolvedComposerPortalTarget/)

  const loader = read('components/ui/minimal-typographic-loader.tsx')
  assert.match(loader, /standalone\?: boolean/)
  assert.match(loader, /standalone = false/)
  assert.match(loader, /const showAmbient = ambient && !standalone/)
  assert.match(loader, /standalone \? 'mix-blend-normal \[mask-image:none\]' : 'mix-blend-screen/)

  const sourceStagePlaceholder = read('components/editor/source-stage-placeholder.tsx')
  assert.match(sourceStagePlaceholder, /standalone/)
  assert.match(sourceStagePlaceholder, /!isLoading \? \(/)
  assert.equal(sourceStagePlaceholder.includes("isLoading && 'opacity-28'"), false)

  const previewCanvas = read('components/editor/PreviewCanvas.tsx')
  assert.match(previewCanvas, /standalone/)
  assert.equal(previewCanvas.includes('bg-black/15 px-6'), false)
  assert.equal(previewCanvas.includes('Loading source preview'), false)
  assert.equal(previewCanvas.includes('isPreviewLoadingVisible ?'), false)

  const uploadInterface = read('components/video-upload-interface.tsx')
  assert.match(uploadInterface, /footerAction\?: React\.ReactNode/)
  assert.match(uploadInterface, /studioActionButtonClassName/)
  assert.match(uploadInterface, /rounded-\[8px\]/)
  assert.match(uploadInterface, /text-\[12px\]/)
  assert.match(uploadInterface, /footerAction=\{/)
  assert.equal(uploadInterface.includes('rounded-xl border px-3 py-2 text-sm'), false)

  const musicTabPanel = read('components/editor/music-tab-panel.tsx')
  const musicLoaderCalls = musicTabPanel.match(/<MinimalTypographicLoader[\s\S]*?\/>/g) ?? []
  assert.ok(musicLoaderCalls.length > 0)
  for (const loaderCall of musicLoaderCalls) {
    assert.match(loaderCall, /ambient=\{false\}/)
    assert.match(loaderCall, /standalone/)
  }
}

run()
