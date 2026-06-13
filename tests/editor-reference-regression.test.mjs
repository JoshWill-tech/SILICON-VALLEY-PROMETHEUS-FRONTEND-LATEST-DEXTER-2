import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const editorPage = read('app/editor/[id]/page.tsx')

  assert.equal(editorPage.includes('QUICK_ACTIONS.map'), false)
  assert.equal(editorPage.includes('layoutId="editor-workspace-active-pill"'), false)
  assert.equal(editorPage.includes('bg-black/45 backdrop-blur-sm md:bg-transparent md:backdrop-blur-0'), false)
  assert.match(editorPage, /backdrop-blur-\[24px\]/)
  assert.match(editorPage, /bg-black\/72/)

  const musicPanel = read('components/editor/music-tab-panel.tsx')
  assert.match(musicPanel, /catalogReady/)
  assert.match(musicPanel, /currentPlayerTrack/)
  assert.equal(musicPanel.includes('displayTracks.find((track) => track.id === playingTrackId) ?? activeTrack'), false)
}

run()
