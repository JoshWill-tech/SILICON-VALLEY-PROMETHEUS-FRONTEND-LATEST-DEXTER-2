import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'

const require = createRequire(import.meta.url)
const { build } = require('esbuild')
const { chromium } = require('@playwright/test')
const root = process.cwd()
mkdirSync(resolve('.tmp'), { recursive: true })
const dir = mkdtempSync(resolve('.tmp/preview-drag-'))

test('PreviewCanvas interactive dragging and repositioning in browser', async (t) => {
  let browser, server
  try {
    await build({
      stdin: {
        contents: `
          import React from 'react';
          import {createRoot} from 'react-dom/client';
          import {PreviewCanvas} from './components/editor/PreviewCanvas';

          function TestApp() {
            const [playing, setPlaying] = React.useState(false);
            const video = React.useRef(null);
            const toggle = () => {
              setPlaying(v => !v);
              window.__playbackToggled = true;
            };
            return (
              <main style={{ padding: 40, width: 900, margin: '0 auto' }}>
                <PreviewCanvas
                  activeWorkspaceTab="Editor"
                  projectId="drag-fixture"
                  project={null}
                  job={null}
                  hasSourceAsset={true}
                  hasPreviewMedia={true}
                  clipModeActive={false}
                  sourceAssetLabel="Draggable Preview Test"
                  previewOverlayPlan={null}
                  previewCurrentTimeSec={1}
                  transportCurrentTime="0:01"
                  transportTime="0:33"
                  showViralClipSplitPreview={false}
                  previewUrl="/fixture.svg"
                  previewKind="image"
                  previewPlaying={playing}
                  fitMode="fit"
                  currentSplitPreviewAssets={{}}
                  previewVideoRef={video}
                  visiblePreviewAspectRatio={16/9}
                  previewFrameWidth="100%"
                  onTogglePreviewPlayback={toggle}
                  onPreviewImageLoaded={() => {}}
                  comparisonControl={<div id="dummy-comparison">Split</div>}
                />
              </main>
            );
          }
          createRoot(document.getElementById('root')).render(<TestApp />);
        `,
        resolveDir: root,
        loader: 'tsx'
      },
      outfile: `${dir}/bundle.js`,
      bundle: true,
      platform: 'browser',
      format: 'iife',
      jsx: 'automatic',
      tsconfig: resolve('tsconfig.json'),
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [{
        name: 'isolate-preview-services',
        setup(bundler) {
          const mocks = {
            '@/components/loading-animation': 'export const InlineLoadingAnimation=()=>null;',
            '@/components/editor/cinematic-preview-runtime': 'export const CinematicPreviewRuntime=({children,className})=><div className={className}>{children}</div>;',
            '@/components/editor/viral-clip-split-preview': 'export const ViralClipSplitPreview=()=>null;',
            '@/components/editor/preview-generation-state': 'export const PreviewGenerationState=()=>null;',
            '@/components/editor/preview-feedback-shell': 'export const PreviewFeedbackShell=()=>null;',
            '@/components/editor/source-stage-placeholder': 'export const SourceStagePlaceholder=()=>null;',
            '@/components/editor/mini-run-live-overlay': 'export const MiniRunLiveOverlay=()=>null; export const TYPOGRAPHY_PRESETS=[];',
            '@/components/editor/mini-run-outside-hud': 'export const MiniRunOutsideHud=()=>null;',
            '@/hooks/use-editorial-timeline': 'export const useEditorialTimeline=()=>({timeline:null,status:"idle"});',
          }
          bundler.onResolve({ filter: /^@\// }, args => args.path in mocks ? { path: args.path, namespace: 'preview-service' } : undefined)
          bundler.onLoad({ filter: /.*/, namespace: 'preview-service' }, args => ({ contents: mocks[args.path], loader: 'tsx', resolveDir: root }))
        }
      }]
    })

    const cssPath = file => resolve(file).replaceAll('\\', '/')
    const sources = ['components/editor/PreviewCanvas.tsx']
    const css = readFileSync('app/globals.css', 'utf8')
      .replace("@import 'tailwindcss';", `@import '${cssPath('node_modules/tailwindcss/index.css')}' source(none);`)
      .replace("@import 'tw-animate-css';", `@import '${cssPath('node_modules/tw-animate-css/dist/tw-animate.css')}';`)
      .replace("@import './light-mode.css';", `@import '${cssPath('app/light-mode.css')}';`)
      + sources.map(file => `\n@source '${cssPath(file)}';`).join('')
    writeFileSync(`${dir}/input.css`, css)

    const compiled = spawnSync(process.execPath, [resolve('node_modules/@tailwindcss/cli/dist/index.mjs'), '-i', `${dir}/input.css`, '-o', `${dir}/style.css`], { encoding: 'utf8', timeout: 60000 })
    assert.equal(compiled.status, 0, compiled.stderr)

    server = createServer((req, res) => {
      if (req.url === '/bundle.js') {
        res.setHeader('Content-Type', 'text/javascript')
        res.end(readFileSync(`${dir}/bundle.js`))
        return
      }
      if (req.url === '/fixture.svg') {
        res.setHeader('Content-Type', 'image/svg+xml')
        res.end('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#222"/></svg>')
        return
      }
      res.setHeader('Content-Type', 'text/html')
      res.end(`<!DOCTYPE html><html><head><style>${readFileSync(`${dir}/style.css`, 'utf8')}</style></head><body style="background:#09090b;margin:0;"><div id="root"></div><script src="/bundle.js"></script></body></html>`)
    })

    await new Promise(done => server.listen(0, '127.0.0.1', done))
    browser = await chromium.launch({ channel: 'msedge', headless: true })
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

    await page.goto(`http://127.0.0.1:${server.address().port}`)

    const controls = page.locator('[data-preview-controls]')
    await controls.waitFor({ state: 'attached' })

    // Hover over preview to ensure controls become visible
    await page.locator('img').first().hover()
    await page.waitForTimeout(200)

    // Verify initial bounding box
    const initialBox = await controls.boundingBox()
    assert.ok(initialBox, 'Controls must have a valid bounding box')
    const initialX = initialBox.x
    const initialY = initialBox.y

    // Target the grip handle for dragging
    const handle = controls.locator('[aria-label="Drag controls to reposition"]')
    await handle.waitFor({ state: 'visible' })

    const handleBox = await handle.boundingBox()
    assert.ok(handleBox, 'Grip handle must have a bounding box')

    // Drag the handle by +80px horizontally and -60px vertically
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 80, handleBox.y + handleBox.height / 2 - 60, { steps: 5 })
    await page.mouse.up()
    await page.waitForTimeout(250)

    const draggedBox = await controls.boundingBox()
    assert.ok(draggedBox, 'Controls must have a bounding box after drag')

    // Verify coordinates shifted
    const deltaX = Math.abs(draggedBox.x - initialX)
    const deltaY = Math.abs(draggedBox.y - initialY)
    console.log(`Controls dragged: initial=(${initialX.toFixed(1)}, ${initialY.toFixed(1)}), new=(${draggedBox.x.toFixed(1)}, ${draggedBox.y.toFixed(1)}), delta=(${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`)
    assert.ok(deltaX > 20, `Controls x position must have shifted by drag (deltaX=${deltaX})`)
    assert.ok(deltaY > 20, `Controls y position must have shifted by drag (deltaY=${deltaY})`)

    // Click play button to verify clicking does not break or get swallowed by drag
    const playBtn = page.locator('[data-preview-playback]')
    await playBtn.click()
    const toggled = await page.evaluate(() => window.__playbackToggled)
    assert.equal(toggled, true, 'Play button click must trigger playback toggle')

    // Double-click grip handle to reset position
    const draggedHandle = controls.locator('[aria-label="Drag controls to reposition"]')
    await draggedHandle.dblclick()
    await page.waitForTimeout(250)

    const resetBox = await controls.boundingBox()
    assert.ok(resetBox, 'Controls must have a bounding box after reset')
    const resetDeltaX = Math.abs(resetBox.x - initialX)
    const resetDeltaY = Math.abs(resetBox.y - initialY)
    console.log(`Controls reset position: deltaFromInitial=(${resetDeltaX.toFixed(1)}, ${resetDeltaY.toFixed(1)})`)
    assert.ok(resetDeltaX < 5, `Controls x position must return to initial position after reset (delta=${resetDeltaX})`)
    assert.ok(resetDeltaY < 5, `Controls y position must return to initial position after reset (delta=${resetDeltaY})`)

  } finally {
    if (browser) await browser.close()
    if (server) await new Promise(done => server.close(done))
    try { rmSync(dir, { recursive: true, force: true }) } catch {}
  }
})
