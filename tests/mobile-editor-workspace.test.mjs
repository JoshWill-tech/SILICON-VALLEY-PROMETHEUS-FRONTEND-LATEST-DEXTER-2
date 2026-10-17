import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

// Exercise the real mobile component's state and JSX without booting auth, uploads,
// chat services, or the rest of the large editor route.
const page = readFileSync(process.env.MOBILE_EDITOR_SOURCE || 'app/editor/[id]/page.tsx', 'utf8')
const mobile = page.slice(page.indexOf('function MobileEditorView('), page.indexOf('\nfunction OriginalEditorPage()'))
const { outputFiles } = await build({
  stdin: { contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { flushSync } from 'react-dom';
    import { ArrowLeft, CheckCircle2, Upload, AlertCircle, Loader2 } from 'lucide-react';
    const cn = (...values) => values.filter(Boolean).join(' ');
    const mobileWorkspaceStyles = new Proxy({}, {get: (_, key) => String(key)});
    const getActiveJobStep = () => null;
    const ContinueBanner = () => null;
    const InlineLoadingAnimation = () => null;
    const MusicTabPanel = () => <div>Music workspace</div>;
    const MotionPropertyCanvas = () => <div data-motion-canvas><video aria-label="Motion preview" /></div>;
    const ChatWorkspacePanel = () => <textarea aria-label="Editorial instruction" />;
    const MobileVideoPlayer = () => <video aria-label="Source preview" />;
    const EditorialDeliveryStudio = () => <section aria-label="Final render studio">Render review</section>;
    ${mobile}
    const props = {projectId:'mobile-test', projectTitle:'Mobile edit', workspaceTab:'Editor', hasPreviewMedia:true,
      previewKind:'video', previewUrl:'/sample.mp4', sourceMetrics:null, job:null, deliveryOpenToken:0,
      onBack:()=>{}, onOpenUploadNewProject:()=>{}};
    const root = createRoot(document.getElementById('root'));
    window.renderWorkspace = changes => flushSync(()=>root.render(<MobileEditorView {...props} {...changes}/>));
    window.renderWorkspace({});
  `, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
})

test('Editorial and Motion are separate; each workspace owns its preview', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {runScripts:'dangerously', url:'http://localhost/'})
  const { window } = dom
  try {
    window.eval(outputFiles[0].text)
    const settle = () => new Promise(resolve => window.setTimeout(resolve, 20))
    await settle()
    const selected = () => window.document.querySelector('[aria-pressed="true"]')?.textContent.trim()
    const clickTab = async label => {
      const button = [...window.document.querySelectorAll('button')].find(node=>node.textContent.trim() === label)
      assert.ok(button, `workspace button ${label} exists`)
      button.click()
      await settle()
    }
    assert.equal(selected(), 'Editorial')
    assert.ok(window.document.querySelector('[aria-label="Editorial instruction"]'))
    assert.equal(window.document.querySelectorAll('[data-motion-canvas]').length, 0)
    assert.equal(window.document.querySelectorAll('video').length, 1)
    await clickTab('Motion')
    assert.equal(selected(), 'Motion')
    assert.equal(window.document.querySelectorAll('[data-motion-canvas]').length, 1)
    assert.equal(window.document.querySelectorAll('video').length, 1)
    await clickTab('Export')
    assert.ok(window.document.querySelector('[aria-label="Final render studio"]'))
    assert.equal(window.document.querySelectorAll('[aria-label="Source preview"]').length, 0)
    window.renderWorkspace({workspaceTab:'Music'})
    await settle()
    assert.equal(selected(), 'Music')
    window.renderWorkspace({workspaceTab:'Editor'})
    await settle()
    assert.equal(selected(), 'Editorial')
    window.renderWorkspace({workspaceTab:'Editor', deliveryOpenToken:1})
    await settle()
    assert.equal(selected(), 'Export')
  } finally { window.close() }
})

test('background source assessment offers Motion without changing the active workspace', () => {
  const assessment = page.match(/if \(readiness\.silenceCuts\.length > 0\) \{([\s\S]*?)\n\s*\} else \{/)
  assert.ok(assessment, 'the cut-ready source assessment branch exists')
  const workspaces = []
  const modes = []
  let notification
  const notify = new Function('readiness', 'setActiveWorkspaceTab', 'setBottomMode', 'toast', assessment[1])
  notify({silenceCuts:[{}]}, value=>workspaces.push(value), value=>modes.push(value), {info:(_message,options)=>{notification=options}})
  assert.deepEqual(workspaces, [], 'analysis must not navigate away from Editorial')
  assert.equal(notification.action.label, 'Review in Motion')
  notification.action.onClick()
  assert.deepEqual(workspaces, ['Motion'])
  assert.deepEqual(modes, ['Original'])
})
