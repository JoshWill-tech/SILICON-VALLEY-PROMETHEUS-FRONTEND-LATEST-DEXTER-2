import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  isYouTubeUrl,
  generateSupoClipVariants,
  formatClipDuration,
  getHookTypeLabel,
} from '../lib/media/youtube-clip-service'

console.log('--- Testing SupoClip URL Parsing & Thumbnail Generation ---')

// 1. YouTube URL extraction test cases
const testUrls = [
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { url: 'dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { url: 'https://example.com/not-a-video', expected: null },
  { url: '', expected: null },
]

for (const { url, expected } of testUrls) {
  const result = extractYouTubeVideoId(url)
  assert.equal(result, expected, `extractYouTubeVideoId("${url}") should equal "${expected}", got "${result}"`)
  if (expected) {
    assert.equal(isYouTubeUrl(url), true, `isYouTubeUrl("${url}") should be true`)
  }
}

// 2. Thumbnail URLs
const hqThumb = getYouTubeThumbnailUrl('dQw4w9WgXcQ')
assert.equal(hqThumb, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
const maxThumb = getYouTubeThumbnailUrl('dQw4w9WgXcQ', 'maxres')
assert.equal(maxThumb, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg')

console.log('✓ URL parsing and thumbnail generation passed')

// 3. SupoClip Schema & Variant Generation
console.log('--- Testing SupoClip Scoring & Variant Generation ---')
const clips = generateSupoClipVariants('dQw4w9WgXcQ', 'Test Video', 300)
assert.ok(clips.length >= 4, 'Should generate at least 4 candidate clips')

for (const clip of clips) {
  assert.ok(clip.id.includes('dQw4w9WgXcQ'), 'Clip ID must include video ID')
  assert.ok(clip.virality_score >= 50 && clip.virality_score <= 100, `Virality score ${clip.virality_score} should be in [50, 100]`)
  assert.ok(clip.hook_score >= 0 && clip.hook_score <= 25, 'Hook score should be out of 25')
  assert.ok(clip.engagement_score >= 0 && clip.engagement_score <= 25, 'Engagement score should be out of 25')
  assert.ok(clip.value_score >= 0 && clip.value_score <= 25, 'Value score should be out of 25')
  assert.ok(clip.shareability_score >= 0 && clip.shareability_score <= 25, 'Shareability score should be out of 25')
  assert.ok(clip.hook_title && clip.hook_title.length > 5, 'Hook title must be present')
  assert.ok(clip.start_time.includes(':'), 'Start time must be formatted MM:SS')
  assert.ok(clip.end_time.includes(':'), 'End time must be formatted MM:SS')
  assert.ok(clip.text.length > 10, 'Transcript text must be present')
  assert.ok(clip.thumbnail_url.includes('dQw4w9WgXcQ'), 'Thumbnail URL must be populated')
}

assert.equal(formatClipDuration(45), '0:45')
assert.equal(formatClipDuration(72), '1:12')
assert.equal(getHookTypeLabel('curiosity_gap'), 'Curiosity gap')
assert.equal(getHookTypeLabel('bold_statement'), 'Bold statement')

console.log('✓ SupoClip schema and scoring verification passed')

// 4. Source code integration checks
console.log('--- Testing Codebase Integration ---')
const root = process.cwd()
const uploadSource = readFileSync(join(root, 'components/video-upload-interface.tsx'), 'utf8')
const editorSource = readFileSync(join(root, 'app/editor/[id]/page.tsx'), 'utf8')
const matrixSource = readFileSync(join(root, 'components/clipping/supoclip-matrix-view.tsx'), 'utf8')

// Video Upload Interface verification
assert.match(uploadSource, /extractYouTubeVideoId/, 'Upload interface must import extractYouTubeVideoId')
assert.match(uploadSource, /getYouTubeThumbnailUrl/, 'Upload interface must import getYouTubeThumbnailUrl')
assert.match(uploadSource, /youtubeThumbnailUrl/, 'Upload interface must compute youtubeThumbnailUrl')
assert.match(uploadSource, /isUrlClipping/, 'Upload interface must support isUrlClipping')
assert.match(uploadSource, /clipping=true/, 'Upload interface must pass clipping=true to editor route')

// Editor Chamber verification
assert.match(editorSource, /SupoClipMatrixView/, 'Editor page must import SupoClipMatrixView')
assert.match(editorSource, /generateSupoClipVariants/, 'Editor page must import generateSupoClipVariants')
assert.match(editorSource, /isUrlClippingActive/, 'Editor page must maintain isUrlClippingActive state')
assert.match(editorSource, /<SupoClipMatrixView/, 'Editor page must render <SupoClipMatrixView />')

// Matrix View component verification
assert.match(matrixSource, /export function ScoreRing/, 'Matrix view must export ScoreRing')
assert.match(matrixSource, /export function SupoClipMatrixView/, 'Matrix view must export SupoClipMatrixView')
assert.match(matrixSource, /Virality Score/, 'Matrix view focus dialog must include Virality Score')
assert.match(matrixSource, /Spoken Transcript Excerpt/, 'Matrix view focus dialog must include transcript')

console.log('✓ Codebase integration checks passed')
console.log('SUPOCLIP_ALL_TESTS_PASSED')
