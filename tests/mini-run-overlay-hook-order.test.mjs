import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

// Use production React so regressions reproduce the same #310 shown by the route.
// Keep the real overlay, Zustand store, frame scaling, and motion components.
const { outputFiles } = await build({
  stdin: {
    contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { flushSync } from 'react-dom';
      import { MiniRunLiveOverlay } from './components/editor/mini-run-live-overlay';
      import { useMiniRunDraftStore } from './lib/editor/mini-run-draft-store';
      window.renderErrors = [];
      const root = createRoot(document.getElementById('root'), {
        onUncaughtError: error => window.renderErrors.push(error.message),
      });
      const videoRef = { current: null };
      window.mountOverlay = props => flushSync(() => root.render(
        <MiniRunLiveOverlay videoRef={videoRef} {...props} />
      ));
      window.loadPlan = () => flushSync(() => useMiniRunDraftStore.getState().setPlan({
        chunks: [{startMs: 0, endMs: 2000, words: [{text: 'Preview', startMs: 0, endMs: 2000}]}],
      }));
      window.resetPlan = () => flushSync(() => useMiniRunDraftStore.getState().reset());
      window.unmountOverlay = () => flushSync(() => root.unmount());
    `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{
    name: 'isolate-cloud-api',
    setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/api\/mini-run(-console)?$/ }, ({ path }) => ({ path, namespace: 'cloud-api' }))
      builder.onLoad({ filter: /.*/, namespace: 'cloud-api' }, () => ({ contents: `
        const unexpected = () => { throw new Error('Unexpected cloud request in overlay lifecycle test'); };
        export const planMiniRunFromProject = unexpected;
        export const dispatchMiniRunFromProject = unexpected;
        export const miniRun = { getRenderStatus: unexpected };
      ` }))
    },
  }],
})

for (const [mode, props] of [
  ['controls', { projectId: 'hook-regression' }],
  ['subtitles only', { projectId: 'hook-regression', subtitlesOnly: true }],
  ['without a project', {}],
]) {
  test(`overlay survives plan load, reset, and reload with ${mode}`, () => {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', {
      runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/',
    })
    const { window } = dom
    const fontLoads = []
    Object.defineProperty(window.document, 'fonts', { value: {
      load: spec => { fontLoads.push(spec); return Promise.resolve([]) },
    } })
    try {
      window.eval(outputFiles[0].text)
      window.mountOverlay(props)
      assert.equal(window.renderErrors.length, 0)
      assert.equal(fontLoads.length, 0, 'An empty draft should not pre-warm fonts')
      for (let cycle = 0; cycle < 2; cycle++) {
        window.loadPlan()
        assert.equal(window.renderErrors.length, 0, window.renderErrors.join('\n'))
        assert.ok(window.document.querySelector('[data-collapsible]'), 'The live preview must remain mounted')
        assert.match(window.document.getElementById('root').textContent, /Preview/)
        assert.ok(fontLoads.length > 0, 'Loaded drafts must still pre-warm fonts')
        const loadedCount = fontLoads.length
        window.resetPlan()
        assert.equal(window.renderErrors.length, 0, window.renderErrors.join('\n'))
        assert.equal(window.document.querySelector('[data-collapsible]'), null)
        assert.equal(fontLoads.length, loadedCount, 'Reset must not load unused fonts')
        if (props.projectId && !props.subtitlesOnly) {
          assert.match(window.document.getElementById('root').textContent, /Interactive Draft/)
        } else {
          assert.equal(window.document.getElementById('root').textContent, '')
        }
      }
    } finally {
      window.unmountOverlay?.()
      window.close()
    }
  })
}
