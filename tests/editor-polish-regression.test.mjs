import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function readLogoAlphaStats(logoPath) {
  const script = [
    'import json, sys',
    'from PIL import Image',
    'image = Image.open(sys.argv[1]).convert("RGBA")',
    'alpha = image.getchannel("A")',
    'values = list(alpha.getdata())',
    'print(json.dumps({',
    '  "transparentPixels": sum(1 for value in values if value <= 4),',
    '  "opaquePixels": sum(1 for value in values if value >= 250),',
    '  "totalPixels": len(values),',
    '}))',
  ].join('\n')

  return JSON.parse(execFileSync('python', ['-c', script, logoPath], { encoding: 'utf8' }))
}

function run() {
  const rootLayout = read('app/layout.tsx')
  assert.equal(rootLayout.includes('@/components/webgl/SceneManager'), false)
  assert.equal(rootLayout.includes('<SceneManager />'), false)

  const packageJson = read('package.json')
  assert.equal(packageJson.includes('@react-three'), false)
  assert.equal(packageJson.includes('"three"'), false)
  assert.equal(existsSync(join(root, 'components/webgl/SceneManager.tsx')), false)
  assert.equal(existsSync(join(root, 'hooks/useWebGLSupport.ts')), false)
  assert.equal(existsSync(join(root, 'lib/webgl/config.ts')), false)

  const sidebarFiles = [
    'components/dashboard-sidebar.tsx',
    'components/editor/EditorHamburgerSidebar.tsx',
    'app/components/editor/mobile/EditorNavDrawer.tsx',
    'app/components/mobile/MobileNavDrawer.tsx',
    'app/editor/components/sidebar-drawer.tsx',
  ]
  for (const sidebarFile of sidebarFiles) {
    const source = read(sidebarFile)
    assert.equal(source.includes('Navigation Live'), false, sidebarFile)
    assert.equal(source.includes('The active blade follows hover'), false, sidebarFile)
    assert.equal(source.includes('Hover a row to preview'), false, sidebarFile)
    assert.equal(source.includes('Creative operating system'), false, sidebarFile)
  }

  const editorIndexPage = read('app/editor/page.tsx')
  assert.match(editorIndexPage, /getMostRecentProject/)
  assert.match(editorIndexPage, /router\.replace\(recentProject \? `\/editor\/\$\{recentProject\.id\}` : '\/projects'\)/)

  const motionEditorPage = read('app/editor/motion/page.tsx')
  assert.equal(motionEditorPage.includes("redirect('/editor')"), false)
  assert.equal(motionEditorPage.includes('MotionCanvas'), true)
  assert.equal(motionEditorPage.includes('NodeGraphProvider'), true)
  assert.equal(motionEditorPage.includes('z-[9999]'), true)
  assert.equal(existsSync(join(root, 'app/editor/motion/components/motion-canvas.tsx')), true)
  assert.equal(existsSync(join(root, 'app/editor/motion/hooks/use-node-graph.ts')), true)

  const animeNavbar = read('components/ui/anime-navbar.tsx')
  assert.equal(animeNavbar.includes('TextReveal'), false)
  assert.match(animeNavbar, /translate3d\(\$\{indicatorStyle\.left\}px,0,0\)/)

  const editorHeader = read('components/editor/EditorHeader.tsx')
  assert.match(editorHeader, /defaultActive=\{activeWorkspaceTab\}/)

  const editorProjectPage = read('app/editor/[id]/page.tsx')
  assert.match(editorProjectPage, /router\.push\('\/editor\/motion'\)/)
  assert.match(editorProjectPage, /if \(tab === 'Motion'\)/)

  const logoAlpha = readLogoAlphaStats(join(root, 'public/branding/prometheus-logo-no-bg.png'))
  assert.ok(logoAlpha.transparentPixels / logoAlpha.totalPixels > 0.25)
  assert.ok(logoAlpha.opaquePixels / logoAlpha.totalPixels > 0.05)

  const landingPage = read('app/page.tsx')
  assert.equal(landingPage.includes('Deliverables included with purchase'), false)
  assert.equal(landingPage.includes('What Prometheus Studio customers receive'), false)
  assert.equal(landingPage.includes('HD Video Exports'), false)

  const soundtrackCard = read('components/editor/soundtrack-card.tsx')
  assert.equal(soundtrackCard.includes('animate-marquee'), false)
  assert.equal(soundtrackCard.includes('ArtistMarquee'), false)
  assert.match(soundtrackCard, /truncate/)

  const songScroller = read('components/editor/inertial-song-scroller.tsx')
  assert.equal(songScroller.includes('shouldReleaseWheelToNativeScroll'), true)
  assert.match(songScroller, /if \(shouldReleaseWheelToNativeScroll/)
  assert.equal(songScroller.includes('touch-none overflow-hidden'), false)
}

run()
