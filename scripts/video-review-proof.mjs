import { build } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

// Isolated visual fixture using the actual comparison, review editor, storage and exports.
// Only the unrelated editorial timeline service and render-history response are fixtures.
const dir = resolve('.tmp/video-review-proof')
mkdirSync(dir, { recursive: true })
await build({
  stdin: { contents: `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {EditorialDeliveryStudio} from './components/editor/editorial-delivery-studio';
    createRoot(document.getElementById('root')).render(<main style={{padding:32,color:'white',fontFamily:'Arial'}}>
      <h1>Video review verification</h1>
      <p>Open Compare versions to review the source and rendered fixture.</p>
      <EditorialDeliveryStudio presentation="preview" projectId="video-review-proof" sourceAssetId="proof-source" sourceUrl="/sample.mp4" projectTitle="Team video review" currentTimeSec={0} durationSec={30}/>
    </main>);
  `, resolveDir: process.cwd(), loader: 'tsx' },
  outfile: resolve(dir, 'bundle.js'), bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic',
  tsconfig: resolve('tsconfig.json'), define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'isolate-editorial-service', setup(bundler) {
    bundler.onResolve({ filter: /^@\/hooks\/use-editorial-timeline$/ }, args => ({ path: args.path, namespace: 'review-fixture' }))
    bundler.onLoad({ filter: /.*/, namespace: 'review-fixture' }, () => ({ contents: 'export const useEditorialTimeline=()=>({timeline:null,status:"idle"});', loader: 'js' }))
  } }],
})
const cssPath = value => resolve(value).replaceAll('\\', '/')
writeFileSync(resolve(dir, 'input.css'), `@import '${cssPath('node_modules/tailwindcss/index.css')}' source(none);\n@source '${cssPath('components/editor/editorial-delivery-studio.tsx')}';\n@source '${cssPath('components/editor/video-review-annotations.tsx')}';`)
const compiled = spawnSync(process.execPath, [resolve('node_modules/@tailwindcss/cli/dist/index.mjs'), '-i', resolve(dir, 'input.css'), '-o', resolve(dir, 'style.css')], { encoding: 'utf8', timeout: 120000 })
if (compiled.status !== 0) throw new Error(compiled.stderr || 'Fixture CSS compilation failed')
if (process.argv.includes('--build-only')) {
  console.log('Video review fixture rebuilt.')
  process.exit(0)
}
const media = readFileSync('public/library/scrollbar.mp4')
const server = createServer((request, response) => {
  if (request.url === '/bundle.js' || request.url === '/style.css') {
    response.setHeader('Content-Type', request.url.endsWith('js') ? 'text/javascript' : 'text/css')
    response.end(readFileSync(resolve(dir, request.url.slice(1))))
    return
  }
  if (request.url === '/sample.mp4' || request.url === '/api/exports/review-render-proof/preview') {
    response.setHeader('Content-Type', 'video/mp4')
    response.setHeader('Accept-Ranges', 'bytes')
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
    if (range) {
      const start = Number(range[1]), end = range[2] ? Number(range[2]) : media.length - 1
      response.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${media.length}`, 'Content-Length': end - start + 1 })
      response.end(media.subarray(start, end + 1))
    } else { response.setHeader('Content-Length', media.length); response.end(media) }
    return
  }
  if (request.url.includes('/exports/history')) {
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ exports: [{ id: 'review-render-proof', projectId: 'video-review-proof', status: 'completed', storagePath: 'sample.mp4', mimeType: 'video/mp4', createdAt: '2026-10-15T12:00:00Z', metadata: { sourceAssetId: 'proof-source' } }] }))
    return
  }
  response.setHeader('Content-Type', 'text/html')
  response.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><title>Video review proof</title></head><body style="background:#090a0b"><div id="root"></div><script src="/bundle.js"></script></body></html>')
})
server.listen(4179, '127.0.0.1', () => console.log('Video review fixture ready at http://127.0.0.1:4179'))
