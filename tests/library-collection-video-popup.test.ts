import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extractYouTubeVideoId } from '../lib/media/youtube-clip-service'

const root = process.cwd()
const librarySource = readFileSync(join(root, 'components/assets/library-collection.tsx'), 'utf8')

test('LibraryCollection video popup modal contracts', () => {
  // 1. Dialog components and state
  assert.match(librarySource, /import\s*\{[^}]*Dialog[^}]*\}\s*from\s*['"]@\/components\/ui\/dialog['"]/, 'Must import Dialog from ui/dialog')
  assert.match(librarySource, /const\s*\[playingVideo,\s*setPlayingVideo\]\s*=\s*React\.useState/, 'Must declare playingVideo state')

  // 2. Clickable preview button on highlighted icon
  assert.match(librarySource, /onClick=\{[^}]*setPlayingVideo\(video\)[^}]*\}/, 'Highlighted icon button must trigger video popup')
  assert.match(librarySource, /title="Play ad-free video preview"/, 'Highlighted button must indicate ad-free preview')

  // 3. Interactive thumbnail with play hover
  assert.match(librarySource, /group\/thumb relative aspect-video/, 'Thumbnail must be an interactive preview button')

  // 4. Modal popup dialog with backdrop and ad-free player
  assert.match(librarySource, /<Dialog\s+open=\{playingVideo !== null\}/, 'Must bind Dialog open state to playingVideo')
  assert.match(librarySource, /overlayClassName="bg-black\/85 backdrop-blur-md"/, 'Must render dark blurred backdrop for the modal')
  assert.match(librarySource, /youtube-nocookie\.com\/embed/, 'Must use privacy-enhanced youtube-nocookie.com for ad-free playback')
  assert.match(librarySource, /autoplay=1/, 'Must autoplay video when opened')
  assert.match(librarySource, /modestbranding=1/, 'Must enable modestbranding')
  assert.match(librarySource, /iv_load_policy=3/, 'Must suppress video annotation popups')
  assert.match(librarySource, /rel=0/, 'Must prevent random third-party video recommendations')

  // 5. In-modal action to apply style
  assert.match(librarySource, /Use Style/, 'Modal must offer direct style selection')

  // 6. Title cleanup for escaped unicode
  assert.match(librarySource, /formatVideoTitle/, 'Must provide formatVideoTitle helper')
})

test('YouTube video ID extraction for ad-free embed', () => {
  assert.equal(extractYouTubeVideoId('qel9bf653Es'), 'qel9bf653Es')
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch?v=qel9bf653Es'), 'qel9bf653Es')
  assert.equal(extractYouTubeVideoId('https://youtu.be/qel9bf653Es'), 'qel9bf653Es')
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/embed/qel9bf653Es'), 'qel9bf653Es')
})
