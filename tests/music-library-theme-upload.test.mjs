import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { transformSync } from 'esbuild'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import postcss from 'postcss'

const require = createRequire(import.meta.url)
const source = readFileSync('components/editor/music-tab-panel.tsx', 'utf8')
const shelf = source.slice(source.indexOf('function MyMusicShelf('), source.indexOf('function buildSelectedSongDisplay('))
const compiled = transformSync(`${shelf}\nexports.MyMusicShelf = MyMusicShelf`, { loader: 'tsx', format: 'cjs' }).code
const exports = {}
const icons = require('lucide-react')
new Function('exports', 'React', 'styles', 'cn', ...Object.keys(icons), compiled)(
  exports, React, { uploadFailed: 'uploadFailed' }, (...classes) => classes.filter(Boolean).join(' '), ...Object.values(icons),
)
for (const state of ['failed', 'uploading', undefined]) {
  const markup = renderToStaticMarkup(React.createElement(exports.MyMusicShelf, {
    files: [{ id: 'local', name: 'song.mp3', sizeLabel: '1 MB', uploadState: state, uploadError: 'Upload interrupted' }],
    folders: [], query: '', cloudFiles: [], onFilesSelected() {}, onRemoveTrack() {},
  }))
  const document = new JSDOM(markup).window.document
  const remove = document.querySelector('[aria-label="Remove song.mp3 from your library"]')
  assert.ok(remove, `Remove control exists for ${state ?? 'saved'} files`)
  assert.equal(remove.disabled, state === 'uploading')
  if (state === 'failed') {
    assert.equal(document.querySelector('.uploadFailed').textContent.trim(), 'Upload failed')
    assert.equal(document.querySelector('.uploadFailed').title, 'Upload interrupted')
  }
}
// Failed rows are local placeholders: removing them must not require a storage request.
const removeStart = source.indexOf('  const handlePersonalMusicRemove = React.useCallback(')
const removeEnd = source.indexOf('  const handlePersonalMusicMove', removeStart)
const removeCode = transformSync(source.slice(removeStart, removeEnd) + '\nexports.remove = handlePersonalMusicRemove', { loader: 'tsx', format: 'cjs' }).code
const removal = {}
let files = [{ id: 'failed', name: 'song.mp3', uploadState: 'failed' }, { id: 'keep', name: 'other.mp3' }]
new Function('exports', 'React', 'setPersonalMusicFiles', 'onRemoveTrackProp', 'selectedTrackId', 'createClient', removeCode)(
  removal, { useCallback: callback => callback }, update => { files = update(files) }, undefined, null,
  () => { throw new Error('Local removal must not contact Supabase') },
)
await removal.remove(files[0])
assert.deepEqual(files.map(file => file.id), ['keep'])

const css = postcss.parse(readFileSync('components/editor/music-library.module.css', 'utf8'))
const dark = css.nodes.find(node => node.selector === '.library')
const light = css.nodes.find(node => node.selector === ":global(html[data-color-mode='light']) .library")
assert.ok(light, 'Light palette must be explicitly scoped to light mode')
const palette = rule => Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))
const darkPalette = palette(dark), lightPalette = palette(light)
const luminance = hex => {
  const rgb = (hex.length === 4 ? hex.slice(1).split('').map(c => c + c) : hex.slice(1).match(/../g))
    .map(c => parseInt(c, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
  return rgb.reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0)
}
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)
for (const colors of [darkPalette, lightPalette]) {
  for (const surface of ['--music-surface', '--music-subtle', '--music-row', '--music-personal']) {
    for (const ink of ['--music-ink', '--music-muted', '--music-danger']) {
      assert.ok(contrast(colors[ink], colors[surface]) >= 4.5, `${ink} readable on ${surface}`)
    }
  }
}
assert.ok(luminance(darkPalette['--music-surface']) < .03)
assert.equal(lightPalette['--music-surface'], '#fff')
console.log('music library theme and failed-upload controls tests passed')
