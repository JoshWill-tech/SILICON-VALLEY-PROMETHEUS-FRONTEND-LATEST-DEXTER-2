import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const postcss = require('postcss')

const tsSource = ts.transpileModule(readFileSync('lib/theme/theme-tokens.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const themeModule = { exports: {} }
runInNewContext(tsSource, { module: themeModule, exports: themeModule.exports })
const { themeCssVariables } = themeModule.exports

// 1. Verify themeCssVariables light mode foreground is deep black
const lightVars = themeCssVariables('obsidian', 'light')
assert.equal(lightVars['--theme-foreground'], '#0A0A0F', 'Light mode foreground must be deep black (#0A0A0F)')
assert.equal(lightVars['--text-primary'], '#0A0A0F')
assert.equal(lightVars['--prometheus-text-primary'], '#0A0A0F')

function luminance(hex) {
  const c = hex.match(/[\da-f]{2}/gi).map(n => parseInt(n, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722
}
function contrast(a, b) {
  const x = luminance(a), y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// Ensure foreground contrast is high-end (> 14:1 against light surface)
assert.ok(contrast(lightVars['--theme-surface'], lightVars['--theme-foreground']) >= 14, 'Deep black foreground must have >= 14:1 contrast with surface')
assert.ok(contrast(lightVars['--theme-background'], lightVars['--theme-foreground']) >= 14, 'Deep black foreground must have >= 14:1 contrast with background')

// 2. Verify light-mode.css rules
const lightCss = postcss.parse(readFileSync('app/light-mode.css', 'utf8'))

function getDeclarations(selectorFragment) {
  const result = {}
  lightCss.walkRules(rule => {
    if (rule.selectors.some(s => s.includes(selectorFragment))) {
      rule.walkDecls(d => { result[d.prop] = d.value })
    }
  })
  return result
}

// Verify SourceStagePlaceholder light mode rules
const placeholderDecls = getDeclarations('[data-source-stage-placeholder]')
assert.ok(placeholderDecls['border-color'], 'Source stage placeholder must have an explicit border-color in light mode')
assert.ok(placeholderDecls['background'], 'Source stage placeholder must have an explicit background in light mode')
assert.ok(placeholderDecls['box-shadow'], 'Source stage placeholder must have an explicit box-shadow in light mode')

const dashedDecls = getDeclarations('[data-source-stage-dashed]')
assert.ok(dashedDecls['border-color'], 'Source stage dashed inner border must have visible border-color in light mode')

const glyphOuterDecls = getDeclarations('[data-source-glyph-outer]')
assert.ok(glyphOuterDecls['border-color'] && glyphOuterDecls['background'], 'Glyph outer squircle must have visible border and background')

const glyphBarDecls = getDeclarations('[data-source-glyph-bar]')
assert.ok(glyphBarDecls['background']?.includes('var(--theme-foreground)'), 'Glyph plus bar must render dark in light mode')

// 3. Verify text-white/92 and Elegist greeting styling in light-mode.css
let hasWhite92 = false
let hasElegistGreeting = false
lightCss.walkRules(rule => {
  if (rule.selectors.some(s => s.includes("text-white/92"))) hasWhite92 = true
  if (rule.selectors.some(s => s.includes("data-chat-greeting") || s.includes("font-elegist"))) hasElegistGreeting = true
})
assert.ok(hasWhite92, 'light-mode.css must include text-white/92 in high-opacity foreground rules')
assert.ok(hasElegistGreeting, 'light-mode.css must specifically ensure chat greeting renders in dark foreground')

// 4. Verify component source code contains the data attributes
const sourceStageSource = readFileSync('components/editor/source-stage-placeholder.tsx', 'utf8')
assert.ok(sourceStageSource.includes('data-source-stage-placeholder'), 'source-stage-placeholder must declare data-source-stage-placeholder')
assert.ok(sourceStageSource.includes('data-source-stage-dashed'), 'source-stage-placeholder must declare data-source-stage-dashed')
assert.ok(sourceStageSource.includes('data-source-glyph-outer'), 'source-stage-placeholder must declare data-source-glyph-outer')
assert.ok(sourceStageSource.includes('data-source-glyph-bar'), 'source-stage-placeholder must declare data-source-glyph-bar')

const greetingSource = readFileSync('components/editor/elegist-chat-greeting.tsx', 'utf8')
assert.ok(greetingSource.includes('data-chat-greeting'), 'elegist-chat-greeting must declare data-chat-greeting')

console.log('light mode upload borders and text verification passed')
