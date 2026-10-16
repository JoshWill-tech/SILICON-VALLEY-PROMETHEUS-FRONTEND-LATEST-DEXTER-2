import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium, expect } from '@playwright/test'

// Run scripts/video-review-proof.mjs first. This browser has no user profile or session.
const artifacts = resolve('artifacts/video-review-proof')
await mkdir(artifacts, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:4179')
  await page.getByRole('button', { name: 'Compare original and rendered video', exact: true }).click()
  const compare = page.getByRole('dialog', { name: 'Compare original and rendered video', exact: true })
  await expect(compare).toBeVisible()
  const source = page.getByLabel('Original video', { exact: true })
  await expect.poll(() => source.evaluate(video => video.readyState), { timeout: 30000 }).toBeGreaterThanOrEqual(2)
  await source.evaluate(video => { video.currentTime = 1.25 })
  await expect.poll(() => source.evaluate(video => video.seeking), { timeout: 20000 }).toBe(false)
  await page.getByRole('button', { name: 'Draw on original frame', exact: true }).click()
  const editor = page.getByRole('dialog', { name: 'Annotate video frame', exact: true })
  await expect(editor).toBeVisible()
  const addNote = async text => {
    await editor.getByRole('button', { name: 'Add note', exact: true }).click()
    await editor.getByRole('textbox', { name: 'Floating annotation text', exact: true }).fill(text)
    await editor.getByRole('button', { name: 'Done', exact: true }).click()
  }
  await addNote('Move the caption up')
  await addNote('Keep this timing — جيد')
  const stage = editor.getByRole('img', { name: 'Captured frame annotation canvas', exact: true })
  const bounds = await stage.boundingBox()
  for (const [tool, start, end] of [['Circle', [0.55, 0.18], [0.88, 0.40]], ['Rectangle', [0.52, 0.55], [0.92, 0.75]], ['Freehand', [0.12, 0.65], [0.35, 0.8]]]) {
    await editor.getByRole('button', { name: tool, exact: true }).click()
    if (tool === 'Freehand') {
      await stage.evaluate(svg => {
        window.__reviewStrokeMutations = 0
        window.__reviewStrokeObserver = new MutationObserver(records => { window.__reviewStrokeMutations += records.length })
        window.__reviewStrokeObserver.observe(svg, { attributes: true, childList: true, subtree: true })
      })
    }
    await page.mouse.move(bounds.x + bounds.width * start[0], bounds.y + bounds.height * start[1])
    await page.mouse.down()
    await page.mouse.move(bounds.x + bounds.width * end[0], bounds.y + bounds.height * end[1], { steps: tool === 'Freehand' ? 500 : 8 })
    await page.mouse.up()
    if (tool === 'Freehand') {
      const mutations = await stage.evaluate(svg => {
        window.__reviewStrokeObserver.disconnect()
        return window.__reviewStrokeMutations
      })
      assert.ok(mutations <= 8, `dense freehand input should not rerender the SVG per pointer event (observed ${mutations} mutations)`)
    }
  }
  await editor.getByRole('button', { name: 'Undo annotation', exact: true }).click()
  await expect(stage.locator('polyline')).toHaveCount(0)
  await editor.getByRole('button', { name: 'Redo annotation', exact: true }).click()
  await expect(stage.locator('polyline')).toHaveCount(1)
  await expect(stage.locator('ellipse')).toHaveCount(1)
  await page.screenshot({ path: resolve(artifacts, 'annotation-editor-desktop.png') })
  await editor.getByRole('button', { name: 'Save frame', exact: true }).click()
  await expect(editor).toBeHidden()

  const download = async (name, filename) => {
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name, exact: true }).click()
    const file = await pending
    await file.saveAs(resolve(artifacts, filename))
    return readFile(resolve(artifacts, filename))
  }
  const first = JSON.parse(await download('Download annotations JSON', 'first-review.json'))
  assert.equal(first.entries.length, 1)
  assert.equal(first.entries[0].timeSec, 1.25)
  assert.equal(first.entries[0].source, 'original')
  assert.equal(first.entries[0].marks.filter(mark => mark.type === 'text').length, 2)
  assert.equal(first.entries[0].marks.filter(mark => mark.type !== 'text').length, 3)
  assert.notEqual(first.entries[0].image, first.entries[0].annotatedImage)
  await writeFile(resolve(artifacts, 'annotated-frame.png'), Buffer.from(first.entries[0].annotatedImage.split(',')[1], 'base64'))
  const png = Buffer.from(first.entries[0].annotatedImage.split(',')[1], 'base64')
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])

  const rendered = page.getByLabel('Rendered MP4', { exact: true })
  await expect.poll(() => rendered.evaluate(video => video.readyState), { timeout: 30000 }).toBeGreaterThanOrEqual(2)
  await rendered.evaluate(video => { video.currentTime = 2.5 })
  await expect.poll(() => rendered.evaluate(video => video.seeking), { timeout: 20000 }).toBe(false)
  await page.getByRole('button', { name: 'Draw on rendered frame', exact: true }).click()
  await addNote('Recover this draft')
  await editor.getByRole('button', { name: 'Close annotation editor', exact: true }).click()
  await page.getByRole('button', { name: 'Close comparison', exact: true }).click()
  await page.getByRole('button', { name: 'Compare original and rendered video', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Compare original and rendered video', exact: true }).click()
  await page.getByRole('button', { name: 'Draw on rendered frame', exact: true }).click()
  await expect(editor.getByText('Recover this draft', { exact: true })).toBeVisible()
  await editor.getByRole('button', { name: 'Save frame', exact: true }).click()
  await expect(editor).toBeHidden()
  const final = JSON.parse(await download('Download annotations JSON', 'annotations.json'))
  assert.equal(final.entries.length, 2)
  assert.equal(final.entries[1].source, 'rendered')
  assert.equal(final.entries[1].renderId, 'review-render-proof')
  assert.equal(final.entries[1].timeSec, 2.5)
  assert.deepEqual(final.entries[0].notes, ['Move the caption up', 'Keep this timing — جيد'])
  await page.screenshot({ path: resolve(artifacts, 'comparison-review-desktop.png') })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => source.evaluate(video => video.readyState), { timeout: 30000 }).toBeGreaterThanOrEqual(2)
  await page.getByRole('button', { name: 'Draw on original frame', exact: true }).click()
  await expect(editor).toBeVisible()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await expect(editor.getByRole('button', { name: 'Save frame', exact: true })).toBeInViewport()
  await page.screenshot({ path: resolve(artifacts, 'annotation-editor-mobile.png') })
  assert.deepEqual(errors, [])
  console.log('PASS: optional drawing editor, both videos, timestamps, multiple notes, all drawing tools, undo/redo, embedded PNG downloads, draft recovery and mobile layout.')
} finally {
  await browser.close()
}
