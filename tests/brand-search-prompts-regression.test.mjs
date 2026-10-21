import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8')

// 1. Check liquid-glass-search.tsx
const searchSource = read('components/assets/liquid-glass-search.tsx')

// Verify obsolete "Ask Duk" is completely removed
assert.doesNotMatch(searchSource, /'Ask Duk\.\.\.'/, 'Old "Ask Duk" prompt must be removed')
assert.doesNotMatch(searchSource, /aria-label="Ask Duk for liquid glass tips"/, 'Old "Ask Duk" aria-label must be removed')

// Verify brand prompts are present and exported
assert.match(searchSource, /export const DEFAULT_BRAND_PROMPTS/, 'Must export DEFAULT_BRAND_PROMPTS')
assert.match(searchSource, /@yourbrand/, 'Must include @yourbrand handle in default prompts')
assert.match(searchSource, /https:\/\/yourbrand\.com/, 'Must include website URL in default prompts')
assert.match(searchSource, /youtube\.com\/@yourbrand/, 'Must include YouTube URL in default prompts')
assert.match(searchSource, /@nike/, 'Must include reference handle like @nike')

// Verify props and accessibility
assert.match(searchSource, /prompts\?: string\[\]/, 'LiquidGlassSearchProps must support custom prompts')
assert.match(searchSource, /aria-label="Enter brand URL, website URL, YouTube link, or Instagram handle"/, 'Must have updated accessible aria-label')
assert.match(searchSource, /placeholder=\{isFocused && !query \? 'Enter brand URL, @handle, or YouTube\.\.\.' : placeholder\}/, 'Must provide brand-focused placeholder on focus')

// Verify interactive typing and pointer event isolation
assert.match(searchSource, /restorePointerEvents/, 'Must define pointer-events restoration for liquidGL WebGL compatibility')
assert.match(searchSource, /inputRef\.current\?\.focus\(\)/, 'Must delegate click on search bar container to focus input')
assert.match(searchSource, /style=\{\{ pointerEvents: 'auto' \}\}/, 'Must enforce inline pointer-events auto protection')

// Verify global CSS pointer-events immunity
const globalsCss = read('app/globals.css')
assert.match(globalsCss, /\.glass\.search-bar[\s\S]*pointer-events:\s*auto\s*!important/, 'Must override liquidGL pointer-events freeze in globals.css')
assert.match(globalsCss, /\.liquid-glass-stage \.search-input[\s\S]*cursor:\s*text\s*!important/, 'Must enforce text cursor for search input')

// 2. Check library-collection.tsx
const librarySource = read('components/assets/library-collection.tsx')

// Verify persistence keys and helpers
assert.match(librarySource, /export const ACTIVE_BRAND_STORAGE_KEY = 'prometheus\.active-brand\.v1'/, 'Must export active brand storage key')
assert.match(librarySource, /parseBrandInput/, 'Must include brand input parser')
assert.match(librarySource, /saveJarvisMemory/, 'Must sync brand profile to Jarvis persistent memory for video output')
assert.match(librarySource, /BRAND_DNA_STORAGE_KEY/, 'Must link to brand DNA storage key')

// Verify UI components
assert.match(librarySource, /Active Brand Spirit:/, 'Must render active brand indicator when applied')
assert.match(librarySource, /Set Brand Spirit for Video Outputs/, 'Must provide fallback action to apply brand to video suite')
assert.match(librarySource, /Apply &ldquo;\{searchQuery\}&rdquo; to Video Suite/, 'Must include action button to apply custom query')

console.log('brand search prompts regression checks passed successfully!')
