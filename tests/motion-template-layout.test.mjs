import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { build } from 'esbuild'
import { chromium, expect } from '@playwright/test'

const root = process.cwd()
const dir = resolve('.tmp/motion-template-review')
await mkdir(dir, { recursive: true })
await writeFile(join(dir, 'entry.tsx'), `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {Film, Music, Sparkles, Download} from 'lucide-react';
import {MotionEditWorkspace} from '../../components/editor/motion-edit-workspace';
import {EditorHeader} from '../../components/editor/EditorHeader';
import {ThemeInjector} from '../../components/theme/theme-injector';
import {useThemePreferenceStore} from '../../lib/theme/theme-store';
import styles from '../../components/editor/motion-edit-workspace.module.css';
useThemePreferenceStore.getState().setColorMode(document.documentElement.dataset.colorMode);
const opening = [
  {id:'opening',start:0,end:4,text:'What to fix in your business when everything feels broken.'},
  {id:'second',start:4,end:6,text:"I've been there too."},
  {id:'third',start:6,end:10,text:'Here are three things that actually work.'},
  {id:'fourth',start:10,end:14,text:'First, simplify your offer.'},
  {id:'fifth',start:14,end:18,text:'Second, focus on one channel.'},
  {id:'sixth',start:18,end:24,text:'And third, be consistent.'},
];
const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1600"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="#7aabbf"/><stop offset="1" stop-color="#1d384e"/></linearGradient></defs><rect width="900" height="1600" fill="url(#b)"/><path d="M0 1150L400 650L900 1100V1600H0Z" fill="#294959"/><circle cx="650" cy="360" r="130" fill="#ddd4b3"/><text x="450" y="1450" text-anchor="middle" fill="white" font-family="sans-serif" font-size="32">Preview fixture — your project media is retained</text></svg>');
function Harness(){
 const [time,setTime]=React.useState(0), [fit,setFit]=React.useState('fill'), [playing,setPlaying]=React.useState(false), [muted,setMuted]=React.useState(true), [segments,setSegments]=React.useState(opening), [video,setVideo]=React.useState('');
 const videoRef=React.useRef(null), titleRef=React.useRef(null);
 const count=(name)=>{window.__actions[name]=(window.__actions[name]||0)+1};
 window.__actions??={}; window.__setVideo=setVideo;
 const seek=(value)=>{setTime(value);window.__seek=value};
 return <><ThemeInjector/><div className={styles.editorFrame} style={{height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <EditorHeader project={{title:'Motion project'}} job={null} saveStatus="saved" progressPercent={100} isEditingTitle={false} tempTitle="" setTempTitle={()=>{}} titleInputRef={titleRef} activeWorkspaceTab="Motion" isDeferredChromeReady isExporting={false} isDownloading={false} latestExport={null} hasSourceAsset headerNavItems={[{name:'Editor',icon:Film},{name:'Music',icon:Music},{name:'Motion',icon:Sparkles},{name:'Export',icon:Download}]} onTitleSave={()=>{}} onTitleKeyDown={()=>{}} onTitleStartEdit={()=>count('rename')} onWorkspaceTabChange={()=>count('tab')} onPrepareExport={()=>count('export')} onDownload={()=>{}} onOpenThumbnailStudio={()=>count('thumbnail')}/>
 <main data-motion-editor-main style={{minHeight:0,flex:1}}><div className="grid h-full min-h-0 overflow-hidden"><div className="editorial-chamber-shell"><div data-motion-editor-content>
 <MotionEditWorkspace projectTitle="Motion project" previewUrl={video||image} previewKind={video?'video':'image'} hasPreviewMedia sourceLabel="Business edit.mp4" previewAspectRatio={9/16} fitMode={fit} onFitModeChange={setFit} objectFit={fit==='fill'?'cover':'contain'} currentTimeLabel={String(Math.floor(time/60)).padStart(2,'0')+':'+String(Math.floor(time%60)).padStart(2,'0')} durationLabel="00:33" currentTimeSec={time} durationSec={33} previewPlaying={playing} previewMuted={muted} videoRef={videoRef} onPreviewMutedChange={setMuted} onTogglePlayback={()=>{setPlaying(v=>!v);count('play')}} onPickSource={()=>count('pick')} onSeek={seek} onRequestTranscribe={()=>count('transcribe')} captionStyle="clean_bold" transcriptSegments={segments} onToggleCutSegment={id=>{count('cut');setSegments(current=>current.map(s=>s.id===id?{...s,isCut:!s.isCut}:s))}} onUpdateTranscriptSegment={(id,text)=>{count('edit');setSegments(current=>current.map(s=>s.id===id?{...s,text}:s))}} onApplyPrompt={()=>count('prompt')} onOpenMusicCatalog={()=>count('music')}/>
 </div></div></div></main></div></>
}
createRoot(document.getElementById('root')).render(<Harness/>);
`)
let server, browser
try {
  await build({ entryPoints: [join(dir, 'entry.tsx')], outfile: join(dir, 'bundle.js'), bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', tsconfig: resolve('tsconfig.json'), define: { 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'isolate-network-services', setup(bundler) {
    bundler.onResolve({ filter: /use-editorial-timeline$/ }, args => ({ path: args.path, namespace: 'timeline' }))
    bundler.onLoad({ filter: /.*/, namespace: 'timeline' }, () => ({ contents: `import React from 'react'; export function useEditorialTimeline(){const [timeline,setTimeline]=React.useState({cues:[],effects:[]});const patch=React.useCallback(p=>setTimeline(t=>({...t,...(p.type==='reference_style'?{referenceStyle:p.style}:p.type==='cues'?{cues:p.cues}:p.type==='caption_style'?{captionStyle:p.style}:{})})),[]);return {timeline,patch,projectId:'review'}}`, loader: 'js', resolveDir: root }))
    const mocks = {
      '@/lib/editor/editorial-timeline-client': 'export const getEditorialTimelineController=()=>({});',
      '@/lib/voice-companion/reference-controls': 'export const applyReferenceStyleToController=async()=>({success:true,summary:"Saved reference look"});',
      '@/lib/autonomous-ui/autonomous-store': 'export const useAutonomousStore={getState:()=>({})};',
      '@/components/editor/editorial-sync-status': 'export const EditorialSyncStatus=()=>null;',
      '@/components/editor/editorial-audio-preview': 'export const EditorialAudioPreview=()=>null;',
      '@/components/loading-animation': 'export const InlineLoadingAnimation=()=>null;',
    }
    bundler.onResolve({ filter: /^@\// }, args => args.path in mocks ? { path: args.path, namespace: 'services' } : undefined)
    bundler.onLoad({ filter: /.*/, namespace: 'services' }, args => ({ contents: mocks[args.path], loader: 'js', resolveDir: root }))
  } }] })
  const cssPath = path => resolve(path).replaceAll('\\', '/')
  let input = (await readFile('app/globals.css', 'utf8'))
    .replace("@import 'tailwindcss';", `@import '${cssPath('node_modules/tailwindcss/index.css')}' source(none);`)
    .replace("@import 'tw-animate-css';", `@import '${cssPath('node_modules/tw-animate-css/dist/tw-animate.css')}';`)
    .replace("@import './light-mode.css';", `@import '${cssPath('app/light-mode.css')}';`)
  input += ['components/editor','components/ui','components/liquid-glass.tsx'].map(path => `\n@source '${cssPath(path)}';`).join('')
  await writeFile(join(dir, 'input.css'), input)
  const compiled = spawnSync(process.execPath, [resolve('node_modules/@tailwindcss/cli/dist/index.mjs'), '-i', join(dir, 'input.css'), '-o', join(dir, 'style.css')], { encoding: 'utf8', timeout: 120000 })
  assert.equal(compiled.status, 0, compiled.error?.message ?? compiled.stderr)
  const [bundle, css, moduleCss] = await Promise.all([readFile(join(dir, 'bundle.js')), readFile(join(dir, 'style.css'), 'utf8'), readFile(join(dir, 'bundle.css'), 'utf8')])
  server = createServer((request,response) => {
    if (request.url === '/bundle.js') { response.setHeader('Content-Type','text/javascript'); response.end(bundle); return }
    response.setHeader('Content-Type','text/html'); response.end(`<html data-color-mode="${request.url.includes('light')?'light':'dark'}"><head><style>${css}\n${moduleCss}\nbody{margin:0;background:var(--theme-background);font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`)
  })
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve))
  const installed = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe')
  browser = await chromium.launch({ headless:true, ...(existsSync(installed)?{executablePath:installed}:{channel:'msedge'}) })
  const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'})
  const errors = []
  page.on('pageerror',error=>errors.push(error.message))
  const base = `http://127.0.0.1:${server.address().port}`
  const metrics = []
  for (const theme of ['dark','light']) for (const [width,height] of [[1440,900],[1366,768],[1920,1080],[1024,768]]) {
    await page.setViewportSize({width,height}); await page.goto(`${base}/${theme}`)
    await expect(page.getByRole('heading',{name:'Motion & Layout'})).toBeVisible()
    await expect(page.getByRole('textbox',{name:'Reference video URL'})).toBeVisible()
    const boxes = await page.evaluate(()=>{
      const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
      return {transcript:rect('[data-motion-panel="transcript"]'),controls:rect('[data-motion-framing-controls]'),preview:rect('[data-motion-preview-frame]'),tools:rect('aside[aria-label="Motion tools"]'),timeline:rect('section[aria-label="Video timeline"]'),main:rect('[data-motion-editor-main]'),pageWidth:document.documentElement.scrollWidth,scrollable:document.querySelector('[data-motion-editor-main]').scrollHeight>document.querySelector('[data-motion-editor-main]').clientHeight,background:getComputedStyle(document.querySelector('[data-motion-chamber]')).backgroundColor,text:getComputedStyle(document.querySelector('[data-motion-panel="transcript"]')).color};
    })
    assert.ok(boxes.transcript.width>=250 && boxes.controls.width>=280 && boxes.preview.width>=190, JSON.stringify(boxes))
    assert.ok(boxes.transcript.right<=boxes.controls.x+1 && boxes.controls.right<=boxes.preview.x+1 && boxes.preview.right<=boxes.tools.x+1, JSON.stringify(boxes))
    assert.ok(boxes.timeline.y>=Math.max(boxes.transcript.bottom,boxes.preview.bottom)-1, 'timeline overlaps upper panels')
    assert.ok(boxes.pageWidth<=width, 'horizontal page overflow')
    assert.equal(boxes.background,theme==='light'?'rgb(246, 248, 252)':'rgb(9, 12, 16)')
    if (height===768) assert.equal(boxes.scrollable,true,'short desktops must allow bottom scrolling')
    await page.screenshot({path:join(dir,`${theme}-${width}x${height}.png`),fullPage:true})
    metrics.push({theme,width,height,...boxes})
  }
  await page.setViewportSize({width:1440,height:900}); await page.goto(`${base}/dark`)
  await page.getByRole('button',{name:'Seek to 00:04',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__seek),4)
  await page.getByRole('button',{name:'Cut speech',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__actions.cut),1)
  await page.getByRole('button',{name:'Retranscribe',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__actions.transcribe),1)
  await page.getByRole('button',{name:'Search transcript',exact:true}).click()
  await page.getByRole('textbox',{name:'Search transcript',exact:true}).fill('channel')
  await expect(page.locator('[data-transcript-segment-id]')).toHaveCount(1)
  await page.getByRole('button',{name:'Search transcript',exact:true}).click()
  await expect(page.locator('[data-transcript-segment-id]')).toHaveCount(6)
  await page.locator('[data-transcript-segment-id="opening"]').getByRole('button',{name:'Edit transcript text',exact:true}).click()
  await page.locator('textarea').fill('Updated source transcript for the editing check.')
  await page.getByRole('button',{name:'Save',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__actions.edit),1)
  await page.getByRole('button',{name:'Fill frame',exact:true}).click()
  await expect(page.getByRole('button',{name:'Fit frame',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'16:9',exact:true}).click()
  const wide = await page.locator('[data-motion-preview-frame]').boundingBox()
  assert.ok(Math.abs(wide.width/wide.height - 16/9)<.04)
  await page.getByRole('button',{name:'1:1',exact:true}).click()
  const square = await page.locator('[data-motion-preview-frame]').boundingBox()
  assert.ok(Math.abs(square.width/square.height-1)<.03)
  await page.getByRole('button',{name:'9:16',exact:true}).click()
  await page.getByRole('button',{name:'Crop guides on',exact:true}).click()
  await expect(page.getByRole('button',{name:'Resize crop from top left',exact:true})).toHaveCount(0)
  await page.getByRole('button',{name:'Crop guides off',exact:true}).click()
  await page.getByRole('button',{name:'Resize crop from top left',exact:true}).focus()
  await page.keyboard.press('ArrowRight')
  await page.getByRole('button',{name:'Reset crop',exact:true}).click()
  const rail = page.locator('aside[aria-label="Motion tools"]')
  await rail.getByRole('button',{name:'AI enhance',exact:true}).click()
  await page.getByRole('button',{name:'Warm',exact:true}).click()
  await rail.getByRole('button',{name:'Captions',exact:true}).click()
  await expect(page.getByRole('button',{name:/Captions On|Show Captions/})).toBeVisible()
  await rail.getByRole('button',{name:'Media',exact:true}).click()
  await page.getByRole('button',{name:'Replace source media',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__actions.pick),2)
  await rail.getByRole('button',{name:'Layout',exact:true}).click()
  await page.getByRole('textbox',{name:'Reference video URL'}).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  await page.getByRole('textbox',{name:'Reference style focus'}).fill('restrained captions')
  await page.route('**/api/style-clone/ingest',route=>route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Fixture: reference service unavailable'})}))
  await page.getByRole('button',{name:'Analyze reference',exact:true}).click()
  await expect(page.getByRole('alert')).toHaveText(/Fixture: reference service unavailable/)
  await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');canvas.width=180;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#326678';ctx.fillRect(0,0,180,320);
    const stream=canvas.captureStream(5);const recorder=new MediaRecorder(stream,{mimeType:'video/webm'});const chunks=[];
    await new Promise(resolve=>{recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=resolve;recorder.start();setTimeout(()=>recorder.stop(),250)});
    window.__setVideo(URL.createObjectURL(new Blob(chunks,{type:'video/webm'})));stream.getTracks().forEach(t=>t.stop());
  })
  await page.getByRole('button',{name:'Play preview',exact:true}).click()
  await expect(page.getByRole('button',{name:'Pause preview',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Turn video sound on',exact:true}).click()
  await expect(page.getByRole('button',{name:'Mute video sound',exact:true})).toHaveAttribute('aria-pressed','true')
  const separator = page.getByRole('separator',{name:'Resize timeline panel'})
  const before = Number(await separator.getAttribute('aria-valuenow'))
  await separator.focus(); await page.keyboard.press('ArrowUp')
  assert.ok(Number(await separator.getAttribute('aria-valuenow'))>before)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button',{name:'Show timeline',exact:true})).toBeVisible()
  await separator.focus(); await page.keyboard.press('Enter')
  await page.getByRole('button',{name:'Collapse timeline',exact:true}).click()
  await page.getByRole('button',{name:'Show timeline',exact:true}).click()
  await page.getByRole('button',{name:'Hide video track',exact:true}).click()
  await expect(page.getByRole('button',{name:'Show video track',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Show video track',exact:true}).click()
  const tracks = page.getByRole('region',{name:'Editorial tracks. Click to seek, drag to scroll, or use arrow keys.'})
  await tracks.focus(); await page.keyboard.press('ArrowRight')
  assert.ok((await page.evaluate(()=>window.__seek))>4)
  await page.locator('summary').filter({hasText:'More editing actions'}).click()
  await page.getByRole('button',{name:'Add motion marker',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__actions.prompt),1)
  assert.deepEqual(errors,[])
  await writeFile(join(dir,'results.json'),JSON.stringify({metrics,actions:await page.evaluate(()=>window.__actions),errors},null,2))
  console.log('motion template browser checks passed')
} finally {
  if (browser) await browser.close()
  if (server) await new Promise(resolve=>server.close(resolve))
}
