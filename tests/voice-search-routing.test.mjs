import assert from 'node:assert/strict'
import test from 'node:test'

test('creator-recommendations - Gary Vaynerchuk is registered with platform options and aliases', async () => {
  const { getCreatorRecommendations, KNOWN_CREATOR_PROFILES } = await import('../lib/creators/creator-recommendations.ts')

  assert.ok(KNOWN_CREATOR_PROFILES['Gary Vaynerchuk'], 'Gary Vaynerchuk profile must exist')

  const recsForGaryV = getCreatorRecommendations('Gary V')
  assert.equal(recsForGaryV.matchedCreator, 'Gary Vaynerchuk')
  assert.ok(recsForGaryV.platformOptions.length >= 2, 'Must have at least YouTube and Instagram platform options')

  const ytOption = recsForGaryV.platformOptions.find((p) => p.platform === 'youtube')
  assert.ok(ytOption, 'Must have YouTube platform option')
  assert.ok(ytOption.handleOrUrl.includes('youtube.com/@garyvee'), 'YouTube option must point to @garyvee')

  const igOption = recsForGaryV.platformOptions.find((p) => p.platform === 'instagram')
  assert.ok(igOption, 'Must have Instagram platform option')
  assert.ok(igOption.handleOrUrl.includes('instagram.com/garyvee'), 'Instagram option must point to garyvee')
})

test('video-catalog - Gary Vaynerchuk has curated video items', async () => {
  const { CREATOR_VIDEO_CATALOG } = await import('../lib/creators/video-catalog.ts')

  const garyVideos = CREATOR_VIDEO_CATALOG['Gary Vaynerchuk']
  assert.ok(garyVideos && garyVideos.length >= 3, 'Must have at least 3 curated video items for Gary Vaynerchuk')
  assert.ok(garyVideos[0].videoId, 'Video item must have videoId')
  assert.ok(garyVideos[0].title, 'Video item must have title')
  assert.ok(garyVideos[0].image, 'Video item must have image thumbnail')
})

test('search-components - LiquidGlassSearch integrates useVoiceInput and voice search controls', async () => {
  const fs = await import('node:fs')
  const content = fs.readFileSync('components/assets/liquid-glass-search.tsx', 'utf8')
  assert.ok(content.includes('useVoiceInput'), 'LiquidGlassSearch must import and use useVoiceInput')
  assert.ok(content.includes("voiceState === 'recording'"), 'LiquidGlassSearch must handle recording state')
  assert.ok(content.includes('handleMicClick'), 'LiquidGlassSearch must have mic click handler')
})
