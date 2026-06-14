import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const analyticsPagePath = 'app/analytics/page.tsx'
  const analyticsApiPath = 'app/api/analytics/video-performance/route.ts'
  const aiLoaderPath = 'components/ui/ai-response-loader.tsx'

  assert.equal(existsSync(join(root, analyticsPagePath)), true)
  assert.equal(existsSync(join(root, analyticsApiPath)), true)
  assert.equal(existsSync(join(root, aiLoaderPath)), true)

  const analyticsPage = read(analyticsPagePath)
  assert.match(analyticsPage, /\/api\/analytics\/video-performance/)
  assert.match(analyticsPage, /luxury-analysis-panel/)
  assert.match(analyticsPage, /satin-grain-veneer/)
  assert.match(analyticsPage, /isomorphic-path/)
  assert.match(analyticsPage, /settings\/social-accounts/)
  assert.match(analyticsPage, /needsConnections/)

  const analyticsApi = read(analyticsApiPath)
  assert.match(analyticsApi, /auth\.getUser\(\)/)
  assert.match(analyticsApi, /user_connections/)
  assert.match(analyticsApi, /project_exports/)
  assert.match(analyticsApi, /projects/)
  assert.match(analyticsApi, /needsConnections/)
  assert.match(analyticsApi, /video_platform_metrics/)

  const sidebar = read('components/sidebar/AwwwardsSidebar.tsx')
  assert.match(sidebar, /href: "\/analytics"/)
  assert.equal(sidebar.includes('/dashboard?panel=analytics'), false)

  const aiLoader = read(aiLoaderPath)
  assert.match(aiLoader, /Generating/)
  assert.match(aiLoader, /ai-loader-wrapper/)
  assert.match(aiLoader, /loader-letter/)
  assert.match(aiLoader, /loader-orb/)

  const editorPage = read('app/editor/[id]/page.tsx')
  assert.match(editorPage, /AiResponseLoader/)
  assert.match(editorPage, /chatMorphVariants/)
  assert.match(editorPage, /type: 'spring'/)
  assert.match(editorPage, /mass: 1\.2/)
  assert.match(editorPage, /w-\[min\(1080px,calc\(100vw-48px\)\)\]/)
  assert.equal(editorPage.includes('transition-[transform,opacity,height,width,max-height,border-radius,bottom,right]'), false)
  assert.equal(editorPage.includes('ChatSkeletonLoader reduceMotion'), false)

  const chatWorkspacePanel = read('components/editor/chat-workspace-panel.tsx')
  assert.match(chatWorkspacePanel, /AiResponseLoader/)
  assert.equal(chatWorkspacePanel.includes('Thinking...'), false)

  const loader = read('components/ui/minimal-typographic-loader.tsx')
  assert.match(loader, /PrometheusInfinityMark/)
  assert.equal(loader.includes("next/image"), false)
  assert.equal(loader.includes('/loaders/prometheus-infinity-loader.gif'), false)
  assert.equal(loader.includes('mix-blend-screen'), false)

  const globalStyles = read('app/globals.css')
  assert.match(globalStyles, /\.luxury-analysis-panel/)
  assert.match(globalStyles, /\.ai-loader-wrapper/)
  assert.match(globalStyles, /\.prometheus-infinity-mark/)
  assert.match(globalStyles, /@keyframes loader-rotate/)
  assert.match(globalStyles, /@keyframes infinity-dash-flow/)
}

run()
