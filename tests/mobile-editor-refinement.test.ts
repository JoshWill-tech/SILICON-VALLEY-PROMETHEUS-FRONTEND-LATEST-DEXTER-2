import assert from 'node:assert/strict'

import { selectedEditorMusicStorageKey } from '@/lib/editor-music-selection'
import { isStandaloneMobileEditorRoute } from '@/lib/editor-mobile-routes'
import { shouldShowGlobalFooter } from '@/lib/footer-routes'
import { normalizeR2Track } from '@/lib/music/r2-sync'

function run() {
  assert.equal(shouldShowGlobalFooter('/signup'), true)
  assert.equal(shouldShowGlobalFooter('/contact'), true)
  assert.equal(shouldShowGlobalFooter('/editor/music'), false)
  assert.equal(shouldShowGlobalFooter('/settings'), false)
  assert.equal(shouldShowGlobalFooter('/'), false)

  assert.equal(isStandaloneMobileEditorRoute('/editor/music'), false)
  assert.equal(isStandaloneMobileEditorRoute('/editor/motion/'), false)
  assert.equal(isStandaloneMobileEditorRoute('/editor'), false)
  assert.equal(isStandaloneMobileEditorRoute('/editor/123'), false)
  assert.equal(
    selectedEditorMusicStorageKey('project-1'),
    'prometheus.editor.selected-track.v1.project-1',
  )

  const normalized = normalizeR2Track({
    artist: 'Prometheus',
    coverUrl: null,
    duration: 125,
    genre: 'Cinematic',
    id: 'track-1',
    thumbnail: 'https://cdn.prometheusstudio.tech/cover.webp',
    title: 'Ignition',
    url: 'https://cdn.prometheusstudio.tech/track.mp3',
  })

  assert.equal(normalized.coverUrl, 'https://cdn.prometheusstudio.tech/cover.webp')
  assert.equal(normalized.thumbnail, 'https://cdn.prometheusstudio.tech/cover.webp')
  assert.equal(normalized.duration, 125)
}

run()
