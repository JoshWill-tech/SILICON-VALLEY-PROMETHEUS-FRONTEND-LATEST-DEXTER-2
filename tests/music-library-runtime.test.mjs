import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test, { before, after } from 'node:test'
import { build, stop } from 'esbuild'
import { chromium, expect } from '@playwright/test'

const mocks = {
  'framer-motion': "import React from 'react'; const components = new Map(); export const motion = new Proxy({}, { get(_, tag) { if (!components.has(tag)) components.set(tag, React.forwardRef(({ initial, animate, exit, transition, ...props }, ref) => React.createElement(tag, { ...props, ref }))); return components.get(tag) } }); export const AnimatePresence = React.Fragment; export const useAnimationFrame = () => {}; export const useMotionValue = initial => React.useMemo(() => { let value = initial; return { get: () => value, set: next => { value = next } } }, []);",
  'next/image': "import React from 'react'; export default function Image({ fill, priority, ...props }) { return React.createElement('img', props) }",
  'sonner': "export const toast = { success() {}, error() {} };",
  '@/hooks/use-stable-reduced-motion': "export const useStableReducedMotion = () => true;",
  '@/hooks/use-editorial-timeline': "const timeline = { projectId: 'music-runtime', timeline: null, patch() {} }; export const useEditorialTimeline = () => timeline;",
  '@/lib/supabase/client': "export const createClient = () => ({ auth: { getUser: async () => ({ data: { user: null } }) } });",
  '@/lib/supabase/config': "export const isSupabaseConfigured = () => false;",
  '@/lib/editor-music-selection': "export const clearSelectedEditorMusicRecommendation = () => {}; export const writeSelectedEditorMusicRecommendation = () => {};",
  '@/components/loading-animation/cinematic-logo-loader': "export const CinematicLogoLoader = () => null;",
}

const favoriteKey = 'prometheus.editor.music-favorites.v1'
const personalKey = 'prometheus.editor.personal-music.v1'
const tracks = ['Warm Light', 'Quiet Sky'].map((title, index) => ({
  id: index ? 'quiet-sky' : 'warm-light', title, artist: 'Test Artist', producer: 'Test', genre: 'Ambient', bpm: 100,
  vibeTags: [], coverArtUrl: '/album.svg', previewUrl: '/audio/' + index + '.mp3',
  reason: 'Test soundtrack', mood: 'cinematic', energy: 'low', durationSec: 120, sourcePlatform: 'local',
}))

const entry = "import React from 'react'; import { createRoot } from 'react-dom/client'; import { MusicTabPanel } from './components/editor/music-tab-panel'; let root; window.musicCalls = { play: 0, select: 0 }; const playing = new WeakSet(); Object.defineProperty(HTMLMediaElement.prototype, 'paused', { get() { return !playing.has(this) } }); Object.defineProperty(HTMLMediaElement.prototype, 'duration', { get() { return 120 } }); HTMLMediaElement.prototype.play = function() { window.musicCalls.play++; playing.add(this); return Promise.resolve() }; HTMLMediaElement.prototype.pause = function() { playing.delete(this) }; HTMLMediaElement.prototype.load = function() {}; window.fetch = async () => ({ ok: true, json: async () => ({ tracks: [], total: 0 }) }); window.mountMusic = tracks => { root = createRoot(document.getElementById('app')); root.render(React.createElement(MusicTabPanel, { tracks, projectTitle: 'Runtime music test', selectedTrackId: null, onSelectTrack() { window.musicCalls.select++ } })) }; window.unmountMusic = () => root.unmount();";
const compiled = await build({
  stdin: { contents: entry, resolveDir: resolve('.'), loader: 'tsx' },
  bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
  write: false, logLevel: 'silent',
  plugins: [{ name: 'music-runtime-dependencies', setup(builder) {
    builder.onResolve({ filter: /./ }, ({ path }) => path in mocks ? { path, namespace: 'music-mock' } : undefined)
    builder.onLoad({ filter: /./, namespace: 'music-mock' }, ({ path }) => ({ contents: mocks[path], loader: 'js', resolveDir: resolve('.') }))
    builder.onLoad({ filter: /\.module\.css$/ }, async ({ path }) => {
      const css = await readFile(path, 'utf8')
      const names = [...new Set([...css.matchAll(/\.([A-Za-z][A-Za-z0-9]*)/g)].map(match => match[1]))]
      return { contents: 'export default ' + JSON.stringify(Object.fromEntries(names.map(name => [name, name]))), loader: 'js' }
    })
  } }],
})
stop()
const css = await readFile('components/editor/music-library.module.css', 'utf8')
// Valid silent audio keeps native preload events from producing unrelated decode errors.
const previewAudio = Buffer.alloc(44 + 16000)
previewAudio.write('RIFF', 0)
previewAudio.writeUInt32LE(previewAudio.length - 8, 4)
previewAudio.write('WAVEfmt ', 8)
previewAudio.writeUInt32LE(16, 16)
previewAudio.writeUInt16LE(1, 20)
previewAudio.writeUInt16LE(1, 22)
previewAudio.writeUInt32LE(8000, 24)
previewAudio.writeUInt32LE(16000, 28)
previewAudio.writeUInt16LE(2, 32)
previewAudio.writeUInt16LE(16, 34)
previewAudio.write('data', 36)
previewAudio.writeUInt32LE(16000, 40)
let browser
before(async () => {
  browser = await chromium.launch({ headless: true, channel: process.platform === 'win32' && !existsSync(chromium.executablePath()) ? 'msedge' : undefined })
})
after(async () => { await browser?.close() })
async function mountMusic(storage = {}, options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 }, ...options })
  page.setDefaultTimeout(5000)
  page.setDefaultNavigationTimeout(10000)
  await page.route('**/*', async route => {
    if (new URL(route.request().url()).pathname.startsWith('/audio/')) return route.fulfill({ contentType: 'audio/wav', body: previewAudio })
    if (route.request().url().endsWith('/music.js')) return route.fulfill({ contentType: 'text/javascript', body: compiled.outputFiles[0].text })
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><style>*{box-sizing:border-box}body{margin:0;padding:20px;font-family:Arial}#app{height:680px}' + css + '</style><div id="app"></div><script src="/music.js"></script>' })
  })
  await page.goto('http://music.test', { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ storage, tracks }) => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value)
    window.mountMusic(tracks)
  }, { storage, tracks })
  await expect(page.getByRole('heading', { name: 'Music Library' })).toBeVisible()
  return page
}
const emit = (page, name) => page.locator('audio').evaluate((audio, name) => audio.dispatchEvent(new Event(name)), name)

test('playing and progress updates keep the preview note steady without restarting playback', async () => {
  const page = await mountMusic()
  try {
    await page.getByRole('button', { name: 'Play Warm Light', exact: true }).click()
    await expect(page.locator('audio')).toHaveCount(1)
    const started = await page.evaluate(() => window.musicCalls.play)
    await emit(page, 'playing')
    await expect(page.locator('.previewNote')).toHaveText('Previewing does not change your project.', { timeout: 1000 })
    await page.locator('audio').evaluate(audio => { audio.currentTime = 12; audio.dispatchEvent(new Event('timeupdate')) })
    await expect(page.locator('.previewNote')).toHaveText('Previewing does not change your project.')
    await page.getByRole('button', { name: 'Add Warm Light to favorites', exact: true }).click()
    await expect(page.locator('.previewNote')).toHaveText('Previewing does not change your project.')
    assert.equal(await page.evaluate(() => window.musicCalls.play), started, 'Progress and favorite changes must not request playback again')
    assert.equal(await page.evaluate(() => window.musicCalls.select), 0, 'Preview must not add music to the timeline')
    await emit(page, 'waiting')
    await expect(page.locator('.previewNote')).toHaveText('Loading preview…')
    await emit(page, 'playing')
    await expect(page.locator('.previewNote')).toHaveText('Previewing does not change your project.')
    await page.getByRole('button', { name: 'Pause Warm Light', exact: true }).last().click()
    assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true)
  } finally { await page.close() }
})
test('favorites start empty, follow explicit star choices across collections, and survive reopening', async () => {
  const page = await mountMusic()
  try {
    await page.getByRole('tab', { name: 'Favorites', exact: true }).click()
    await expect(page.locator('[data-track-id]')).toHaveCount(0, { timeout: 1000 })
    await expect(page.locator('.emptyList')).toContainText('No favorites yet')
    await page.getByRole('tab', { name: 'For this video', exact: true }).click()
    await page.getByRole('button', { name: 'Add Warm Light to favorites', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Warm Light from favorites', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-preview-track-id]')).toHaveCount(0)
    await page.getByRole('tab', { name: 'Trending', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove Warm Light from favorites', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.evaluate(tracks => { window.unmountMusic(); window.mountMusic(tracks) }, tracks)
    await page.getByRole('tab', { name: 'Favorites', exact: true }).click()
    assert.deepEqual(await page.locator('[data-track-id]').evaluateAll(rows => rows.map(row => row.dataset.trackId)), ['warm-light'])
    await page.getByRole('button', { name: 'Remove Warm Light from favorites', exact: true }).click()
    await expect(page.locator('[data-track-id]')).toHaveCount(0)
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), favoriteKey), [])
    assert.equal(await page.evaluate(() => window.musicCalls.select), 0)
  } finally { await page.close() }
})
test('uploaded music can be starred from My Music and played from Favorites', async () => {
  const file = { id: 'personal-song', name: 'My Song.mp3', title: 'My Song', sizeLabel: '2 MB', storagePath: 'user/song', previewUrl: '/audio/personal.mp3' }
  const page = await mountMusic({ [personalKey]: JSON.stringify({ files: [file], folders: [] }) })
  try {
    await page.getByRole('tab', { name: 'My Music', exact: true }).click()
    await page.getByRole('button', { name: 'Add My Song to favorites', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Remove My Song from favorites', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('tab', { name: 'Favorites', exact: true }).click()
    await expect(page.locator('[data-track-id]')).toHaveAttribute('data-track-id', file.id)
    await page.getByRole('button', { name: 'Play My Song', exact: true }).click()
    await expect(page.locator('audio')).toHaveAttribute('src', '/audio/personal.mp3')
    await emit(page, 'playing')
    await page.getByRole('button', { name: 'Remove My Song from favorites', exact: true }).click()
    await expect(page.locator('[data-track-id]')).toHaveCount(0)
    assert.equal(await page.locator('audio').evaluate(audio => audio.paused), false, 'Removing a favorite must not stop its preview')
  } finally { await page.close() }
})
test('invalid stored favorites do not break the music library', async () => {
  const page = await mountMusic({ [favoriteKey]: '{invalid' })
  try {
    await page.getByRole('tab', { name: 'Favorites', exact: true }).click()
    await expect(page.locator('[data-track-id]')).toHaveCount(0, { timeout: 1000 })
  } finally { await page.close() }
})


test('favorite stars stay visible, keyboard accessible, and inside desktop and mobile song rows', async () => {
  for (const width of [1440, 390, 320]) {
    const page = await mountMusic({}, { viewport: { width, height: 800 }, hasTouch: width < 500 })
    try {
      const star = page.getByRole('button', { name: 'Add Warm Light to favorites', exact: true })
      await expect(star).toBeVisible()
      const bounds = await star.boundingBox()
      assert.ok(bounds.width >= (width < 500 ? 44 : 24))
      assert.ok(bounds.x + bounds.width <= width, 'The favorite control must stay inside the screen')
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      await star.focus()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('button', { name: 'Remove Warm Light from favorites', exact: true })).toHaveAttribute('aria-pressed', 'true')
      assert.equal(await page.evaluate(() => window.musicCalls.play), 0)
      if (process.env.MUSIC_SCREENSHOT_DIR && width !== 320) {
        await mkdir(process.env.MUSIC_SCREENSHOT_DIR, { recursive: true })
        await page.screenshot({ path: resolve(process.env.MUSIC_SCREENSHOT_DIR, 'music-favorites-' + width + '.png'), fullPage: true })
      }
    } finally { await page.close() }
  }
})
