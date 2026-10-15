import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium, expect } from '@playwright/test'

const artifacts = resolve('artifacts/video-review-pill')
await mkdir(artifacts, { recursive: true })
// Feed deterministic non-silent PCM through the real browser encoder. The default
// synthetic device can emit only tiny comfort-noise packets between its beeps.
const samples = 16000 * 4
const wav = Buffer.alloc(44 + samples * 2)
wav.write('RIFF', 0); wav.writeUInt32LE(36 + samples * 2, 4); wav.write('WAVEfmt ', 8)
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22)
wav.writeUInt32LE(16000, 24); wav.writeUInt32LE(32000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34)
wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40)
for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(Math.sin(i * Math.PI * 2 * 440 / 16000) * 8000), 44 + i * 2)
const microphoneFile = resolve(artifacts, 'synthetic-microphone.wav')
await writeFile(microphoneFile, wav)
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${microphoneFile}`] })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    navigator.mediaDevices.getUserMedia = async options => {
      const stream = await original(options)
      window.__reviewTestTracks = stream.getTracks()
      return stream
    }
  })
  let transcriptionRequests = 0
  await page.route('**/api/prometheus-chat/transcribe', async route => {
    transcriptionRequests++
    assert.ok(route.request().postDataBuffer().length > 256)
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: 'Voice note for the pinned frame' }) })
  })
  await page.goto('http://127.0.0.1:4179')
  const open = () => page.getByRole('button', { name: 'Compare original and rendered video', exact: true }).click()
  await open()
  const original = page.getByLabel('Original video', { exact: true })
  const rendered = page.getByLabel('Rendered MP4', { exact: true })
  const sourcePill = page.getByRole('textbox', { name: 'Original frame note', exact: true })
  const renderedPill = page.getByRole('textbox', { name: 'Rendered frame note', exact: true })
  await expect(sourcePill).toBeVisible()
  await expect(renderedPill).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Annotate video frame', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Review notes', exact: false })).toHaveCount(0)
  const seek = async (video, seconds) => {
    await expect.poll(() => video.evaluate(element => element.readyState), { timeout: 30000 }).toBeGreaterThanOrEqual(2)
    await video.evaluate((element, time) => { element.currentTime = time }, seconds)
    await expect.poll(() => video.evaluate(element => element.seeking), { timeout: 20000 }).toBe(false)
  }
  await seek(original, 1.25)
  await sourcePill.fill('Move this caption')
  await sourcePill.press('Enter')
  await expect(sourcePill).toHaveValue('')
  await expect(sourcePill).toBeFocused()
  await sourcePill.fill('Keep the timing')
  await sourcePill.press('Enter')
  await expect(sourcePill).toHaveValue('')
  await seek(original, 2.5)
  await sourcePill.fill('Second frame note')
  await sourcePill.press('Enter')
  await expect(sourcePill).toHaveValue('')

  const download = async name => {
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download annotations JSON', exact: true }).click()
    const file = await pending
    await file.saveAs(resolve(artifacts, name))
    return JSON.parse(await readFile(resolve(artifacts, name), 'utf8'))
  }
  const typed = await download('typed-review.json')
  assert.equal(typed.entries.length, 2)
  assert.equal(typed.entries[0].timeSec, 1.25)
  assert.deepEqual(typed.entries[0].notes, ['Move this caption', 'Keep the timing'])
  assert.equal(typed.entries[1].timeSec, 2.5)
  assert.ok(typed.entries.every(entry => entry.image.startsWith('data:image/png;base64,')))
  assert.ok(typed.entries.every(entry => entry.annotatedImage.startsWith('data:image/png;base64,')))

  await seek(rendered, 1.75)
  await page.getByRole('button', { name: 'Dictate rendered frame note', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop rendered dictation', exact: true })).toBeVisible()
  // Collect actual encoded audio from the browser's synthetic microphone.
  await page.waitForTimeout(1200)
  await seek(rendered, 3)
  await page.getByRole('button', { name: 'Stop rendered dictation', exact: true }).click()
  await expect(renderedPill).toHaveValue('Voice note for the pinned frame')
  await expect.poll(() => page.evaluate(() => window.__reviewTestTracks.every(track => track.readyState === 'ended'))).toBe(true)
  await renderedPill.press('Enter')
  await expect(renderedPill).toHaveValue('')
  const voiced = await download('voice-review.json')
  assert.equal(voiced.entries.length, 3)
  assert.equal(voiced.entries[2].source, 'rendered')
  assert.equal(voiced.entries[2].renderId, 'review-render-proof')
  assert.equal(voiced.entries[2].timeSec, 1.75)
  assert.deepEqual(voiced.entries[2].notes, ['Voice note for the pinned frame'])
  assert.equal(transcriptionRequests, 1)
  await seek(original, 4)
  await page.getByRole('button', { name: 'Dictate original frame note', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop original dictation', exact: true })).toBeVisible()
  await page.waitForTimeout(1200)
  await sourcePill.press('Enter')
  await expect(page.getByText('Saved · 00:04.000', { exact: true })).toBeVisible()
  const enterVoice = await download('enter-voice-review.json')
  assert.equal(enterVoice.entries.length, 4)
  assert.equal(enterVoice.entries[3].timeSec, 4)
  assert.deepEqual(enterVoice.entries[3].notes, ['Voice note for the pinned frame'])
  assert.equal(transcriptionRequests, 2)
  await page.screenshot({ path: resolve(artifacts, 'comparison-floating-pills-desktop.png') })

  await page.getByRole('button', { name: 'Dictate original frame note', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop original dictation', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close comparison', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__reviewTestTracks.every(track => track.readyState === 'ended'))).toBe(true)
  assert.equal(transcriptionRequests, 2, 'Closing comparison must cancel recording rather than submit it')
  await page.reload()
  await open()
  const recovered = await download('recovered-review.json')
  assert.equal(recovered.entries.length, 4)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(sourcePill).toBeVisible()
  await expect(renderedPill).toBeVisible()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await sourcePill.fill('Mobile note')
  await sourcePill.press('Enter')
  await expect(sourcePill).toHaveValue('')
  await page.screenshot({ path: resolve(artifacts, 'comparison-floating-pills-mobile.png') })
  assert.deepEqual(errors, [])
  console.log('PASS: floating pills, Enter saves, grouped frames, screenshot JSON, real microphone recording, transcription, pinned voice frame, microphone cleanup, reload recovery and mobile layout.')
} finally {
  await browser.close()
}
