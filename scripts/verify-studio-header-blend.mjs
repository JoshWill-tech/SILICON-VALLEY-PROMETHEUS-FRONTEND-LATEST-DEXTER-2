import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (file) => readFileSync(join(root, file), 'utf8')

// 1. Verify app/page.tsx supplies studioSurface
const pageContent = read('app/page.tsx')
assert.match(
  pageContent,
  /<LandingHeader\s+mobileNavControl=\{hamburger\}\s+studioSurface\s*\/>/,
  'app/page.tsx must pass studioSurface to LandingHeader'
)

// 2. Verify LandingHeader retains required contract for regressions
const headerContent = read('components/LandingHeader.tsx')
assert.match(
  headerContent,
  /studioSurface\s*\?\s*['"]\s*studio-masthead--studio['"]\s*:\s*['"]['"]/,
  'LandingHeader must apply studio-masthead--studio when studioSurface is active'
)

// 3. Verify globals.css styles studio-masthead--studio as an exact continuation of #050505 canvas
const globalsCss = read('app/globals.css')
assert.match(
  globalsCss,
  /\.prometheus-masthead\.studio-masthead--studio[\s\S]*?background-color:\s*#050505/,
  'studio masthead must set background-color to #050505'
)
assert.match(
  globalsCss,
  /\.prometheus-masthead\.studio-masthead--studio[\s\S]*?border-bottom-color:\s*transparent/,
  'studio masthead must have transparent bottom border to seamlessly blend'
)

// 4. Verify filament gradient does not have harsh cyan (#00f0ff)
const filamentContent = read('components/navigation/jarvis-top-nav-filament.tsx')
assert.doesNotMatch(
  filamentContent,
  /#00f0ff/,
  'Filament gradient must not contain harsh fluorescent cyan #00f0ff'
)
assert.match(
  filamentContent,
  /id="jarvisLineGrad"/,
  'Filament must retain jarvisLineGrad definition'
)

console.log('studio header seamless blend verified')
