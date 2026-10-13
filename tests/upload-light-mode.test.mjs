import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { build } from 'esbuild'
import { compile } from '@tailwindcss/node'
import { chromium, expect } from '@playwright/test'

const dir = resolve('.tmp/upload-light-mode')
const capture = process.argv.includes('--capture-baseline')
const baselineRef = process.argv.find(argument => argument.startsWith('--baseline-ref='))?.slice('--baseline-ref='.length)
assert.ok(!baselineRef || capture, '--baseline-ref requires --capture-baseline')
await mkdir(dir, { recursive: true })
const viewPath = baselineRef ? join(dir, 'original-view.tsx') : 'components/ui/glass-upload-modal-view.tsx'
if (baselineRef) await writeFile(viewPath, execFileSync('git', ['show', `${baselineRef}:components/ui/glass-upload-modal-view.tsx`]))
const studio = readFileSync('components/video-upload-interface.tsx', 'utf8')
const dialogClass = studio.match(/<DialogContent className="([^"]*max-w-\[1040px\][^"]*)"/)[1]
await writeFile(join(dir, 'entry.tsx'), `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {X} from 'lucide-react';
import {Dialog,DialogContent,DialogClose} from '../../components/ui/dialog';
import {GlassUploadModalView} from '${baselineRef ? './original-view' : '../../components/ui/glass-upload-modal-view'}';
import {ThemeInjector} from '../../components/theme/theme-injector';
import {useThemePreferenceStore} from '../../lib/theme/theme-store';
useThemePreferenceStore.getState().setColorMode(document.documentElement.dataset.colorMode);
const picture='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#2563eb"/><rect x="320" width="320" height="360" fill="#f97316"/><circle cx="320" cy="180" r="90" fill="#fff"/></svg>');
function Fixture(){
 const [open,setOpen]=React.useState(true),[drag,setDrag]=React.useState(false),[pending,setPending]=React.useState(null);
 const ref=React.useRef(null); window.__continue=0;
 const stage=file=>{setPending({file,previewUrl:picture,kind:'image'});setDrag(false)};
 window.__setDrag=setDrag; window.__setTheme=theme=>useThemePreferenceStore.getState().setThemeId(theme);
 return <><ThemeInjector/><main>Studio workspace</main><Dialog open={open} onOpenChange={setOpen}>
 <DialogContent className=${JSON.stringify(dialogClass)}>
 <DialogClose asChild><button type="button" aria-label="Close source popup" className="pointer-events-auto absolute right-3 top-3 z-[100] grid h-11 w-11 place-items-center rounded-lg border border-white/12 bg-black/55 text-white/70 shadow-[0_18px_42px_-26px_rgba(0,0,0,0.92)] backdrop-blur-xl transition-colors hover:bg-black/72 hover:text-white sm:right-5 sm:top-5"><X className="h-5 w-5"/></button></DialogClose>
 <GlassUploadModalView isSourceDragOver={drag} onApplyUploadToPrompt={()=>window.__continue++} onClearPendingUpload={()=>setPending(null)} onSourceDragLeave={()=>setDrag(false)} onSourceDragOver={event=>{event.preventDefault();setDrag(true)}} onSourceDrop={event=>{event.preventDefault();if(event.dataTransfer.files[0])stage(event.dataTransfer.files[0])}} onSourceFileInputChange={event=>{if(event.target.files[0])stage(event.target.files[0])}} pendingUpload={pending} sourceDetail="PNG image · 640 × 360" sourceDisplayName="Source image.png" sourceExtension="PNG" sourceFileInputRef={ref} sourcePrimaryBadge="Image" sourceReady={Boolean(pending)}/>
 </DialogContent></Dialog></>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`)
let browser, server
try {
  await build({ entryPoints: [join(dir, 'entry.tsx')], outfile: join(dir, 'bundle.js'), bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', tsconfig: resolve('tsconfig.json'), define: { 'process.env.NODE_ENV': '"development"' } })
  const sources = await Promise.all([viewPath, 'components/ui/glass-upload-shell.tsx', 'components/ui/dialog.tsx', join(dir, 'entry.tsx')].map(path => readFile(path, 'utf8')))
  const candidates = [...sources.flatMap(source => source.match(/[^\s"'`]+/g) ?? []), ...dialogClass.split(/\s+/)]
  let input = await readFile('app/globals.css', 'utf8')
  if (baselineRef) input = input.replace(/@import\s+['"]\.\/light-mode\.css['"];/, execFileSync('git', ['show', `${baselineRef}:app/light-mode.css`], { encoding: 'utf8' }))
  const compiler = await compile(input, { base: resolve('app'), onDependency() {} })
  const css = compiler.build(candidates)
  const bundle = await readFile(join(dir, 'bundle.js'))
  server = createServer((request, response) => {
    if (request.url === '/bundle.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bundle); return }
    if (request.url === '/title.ttf') { response.setHeader('Content-Type', 'font/ttf'); response.end(readFileSync('zt_otez/ZTOtez-Italic.ttf')); return }
    response.setHeader('Content-Type', 'text/html')
    response.end(`<html class="dark" data-color-mode="${request.url.includes('light') ? 'light' : 'dark'}"><head><style>${css}\n@font-face{font-family:UploadTitle;src:url('/title.ttf')} :root{--font-zt-otez:UploadTitle;--font-inter:Arial} body{margin:0;font-family:Arial,sans-serif;background:var(--theme-background);color:var(--theme-foreground)}main{padding:40px}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const localChromium = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe')
  browser = await chromium.launch({ headless: true, ...(existsSync(localChromium) ? { executablePath: localChromium } : { channel: 'msedge' }) })
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const base = `http://127.0.0.1:${server.address().port}`
  const dialog = page.getByRole('dialog')
  const shell = dialog.locator('input[type=file]').locator('..')
  const choose = page.getByRole('button', { name: 'Choose file', exact: true })
  const settled = async () => {
    await expect(shell.locator(':scope > div.relative')).toHaveCSS('opacity', '1')
    await expect(shell.locator('section')).toHaveCSS('opacity', '1')
  }
  const open = async mode => {
    await page.goto(`${base}/${mode}`)
    await expect(page.getByRole('heading', { name: 'Upload Source' })).toBeVisible()
    await page.waitForFunction(mode => document.documentElement.dataset.colorMode === mode, mode)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(700)
    await page.mouse.move(0, 0)
    await settled()
  }
  const snapshot = () => dialog.evaluate(element => [...element.querySelectorAll('*')].map(node => {
    const style = getComputedStyle(node)
    return ['color', 'backgroundColor', 'backgroundImage', 'borderColor', 'boxShadow', 'filter', 'opacity', 'display', 'borderRadius'].map(key => style[key])
  }))
  const compareDark = async state => {
    await settled()
    const values = await snapshot()
    const screenshot = await dialog.screenshot()
    const stem = join(dir, `dark-${state}-baseline`)
    if (capture) { await writeFile(`${stem}.json`, JSON.stringify(values)); await writeFile(`${stem}.png`, screenshot) }
    else if (existsSync(`${stem}.json`)) {
      await writeFile(join(dir, `dark-${state}-actual.png`), screenshot)
      assert.deepEqual(values, JSON.parse(await readFile(`${stem}.json`, 'utf8')), `Dark ${state} computed styles must remain unchanged`)
      assert.ok(screenshot.equals(await readFile(`${stem}.png`)), `Dark ${state} screenshot must remain unchanged`)
    }
  }
  const stage = () => dialog.locator('input[type=file]').setInputFiles({ name: 'Source image.png', mimeType: 'image/png', buffer: Buffer.from('fixture') })
  await open('dark')
  await expect(choose).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await compareDark('empty')
  await page.evaluate(() => window.__setDrag(true))
  await page.waitForTimeout(650)
  await compareDark('drag')
  await stage()
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible()
  await page.waitForTimeout(700)
  await compareDark('staged')

  await open('light')
  const original = await shell.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, coatings: [...element.querySelectorAll(':scope > [aria-hidden]')].map(node => ({ background: getComputedStyle(node).backgroundImage, display: getComputedStyle(node).display })) }))
  console.log('Light upload surface:', JSON.stringify(original))
  assert.ok(rgb(original.background).every(value => value >= 235), 'Light-mode upload panel must have a pale canvas, not the original dark background')
  assert.ok(original.coatings.every(coating => coating.display === 'none' || coating.background === 'none'), 'Dark decorative gradients must not cover the light upload canvas')
  const dropzone = dialog.locator('[role=button]')
  const details = async () => dropzone.evaluate(element => {
    const style = getComputedStyle(element)
    return { background: style.backgroundColor, border: style.borderColor, heading: getComputedStyle(element.querySelector('.text-lg')).color, helper: getComputedStyle(element.querySelector('.max-w-sm')).color }
  })
  const normal = await details()
  assert.ok(contrast(normal.heading, normal.background) >= 4.5)
  assert.ok(contrast(normal.helper, normal.background) >= 4.5)
  assert.ok(contrast(normal.border, normal.background) >= 3, 'Drop area edge must be visible in light mode')
  const checkAction = async button => {
    const style = await button.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color }))
    assert.ok(rgb(style.background).every(value => value < 90), 'Light-mode primary action must be dark')
    assert.ok(contrast(style.color, style.background) >= 4.5, 'Action label must contrast with its fill')
  }
  await checkAction(choose)
  await choose.hover()
  await checkAction(choose)
  await page.mouse.move(0, 0)
  await dialog.screenshot({ path: join(dir, 'light-empty.png') })
  await page.evaluate(() => window.__setDrag(true))
  await page.waitForTimeout(650)
  const dragging = await details()
  assert.ok(contrast(dragging.border, dragging.background) >= 3)
  await dialog.screenshot({ path: join(dir, 'light-drag.png') })
  await page.evaluate(() => window.__setDrag(false))
  await choose.focus()
  const chooser = page.waitForEvent('filechooser')
  await choose.press('Enter')
  await (await chooser).setFiles({ name: 'Source image.png', mimeType: 'image/png', buffer: Buffer.from('fixture') })
  const proceed = page.getByRole('button', { name: 'Continue', exact: true })
  await expect(proceed).toBeVisible()
  await checkAction(proceed)
  await expect(dialog.locator('img[alt="Source image.png"]')).toHaveCSS('filter', 'none')
  await page.waitForTimeout(700)
  await settled()
  const actionBounds = await proceed.boundingBox()
  const closeBounds = await page.getByRole('button', { name: 'Close source popup' }).boundingBox()
  assert.ok(actionBounds.x + actionBounds.width <= closeBounds.x - 8, 'Close control must not obscure Continue')
  await dialog.screenshot({ path: join(dir, 'light-staged.png') })
  await proceed.click()
  assert.equal(await page.evaluate(() => window.__continue), 1)
  await page.getByRole('button', { name: 'Remove staged source' }).click()
  await expect(choose).toBeVisible()
  for (const [width, height] of [[375, 812], [812, 375]]) {
    await page.setViewportSize({ width, height })
    await open('light')
    await expect(choose).toBeVisible()
    const bounds = await choose.boundingBox()
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height, `File action must fit within ${width}x${height}: ${JSON.stringify(bounds)}`)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await dialog.screenshot({ path: join(dir, `light-${width}x${height}.png`) })
    await stage()
    await settled()
    await expect(proceed).toBeVisible()
    await checkAction(proceed)
    await proceed.click()
    assert.equal(await page.evaluate(() => window.__continue), 1)
    await dialog.screenshot({ path: join(dir, `light-staged-${width}x${height}.png`) })
  }
  assert.deepEqual(errors, [])
  console.log('Upload light-mode checks passed: contrast, drag state, image staging, file picker, continue/remove, mobile, and preserved dark-mode baselines.')
} finally {
  await browser?.close()
  if (server) await new Promise(resolve => server.close(resolve))
}

function rgb(value) {
  const numbers = value.match(/[\d.]+/g)?.map(Number)
  assert.ok(numbers?.length >= 3, `Expected an opaque computed color, got ${value}`)
  return numbers.slice(0, 3).map(channel => value.startsWith('color(srgb ') ? channel * 255 : channel)
}
function contrast(a, b) {
  const luminance = value => rgb(value).map(channel => channel / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0)
  const x = luminance(a), y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
