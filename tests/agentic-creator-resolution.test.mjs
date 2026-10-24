import assert from 'node:assert/strict'
import test from 'node:test'

test('resolveBrand - Agentic resolution from creator name to YouTube and Instagram URLs with video extraction', async () => {
  const { resolveBrand } = (await import('../lib/brand/resolve.ts')).default || (await import('../lib/brand/resolve.ts'))

  // Case 1: "Gary V" or "Gary Vaynerchuk" as spoken by voice typing or typed directly
  const garyResult = await resolveBrand('Gary V')
  assert.ok(garyResult, 'Must return resolved brand result')
  assert.equal(garyResult.category, 'youtube', 'Category should resolve to youtube channel')
  assert.ok(
    garyResult.url.includes('youtube.com/@garyvee') || garyResult.url.includes('youtube.com/@garyvaynerchuk'),
    `Expected YouTube channel URL for Gary V, got: ${garyResult.url}`
  )
  assert.ok(
    garyResult.brandName.toLowerCase().includes('gary'),
    `Expected brand name to contain Gary, got: ${garyResult.brandName}`
  )
  assert.ok(
    garyResult.videos && garyResult.videos.length > 0,
    `Must extract video items for Gary V, got: ${garyResult.videos?.length}`
  )
  assert.ok(
    garyResult.videos[0].videoId && garyResult.videos[0].thumbnailUrl,
    'Video cards must contain videoId and thumbnailUrl'
  )
  assert.ok(garyResult.styleDNA, 'Must extract style DNA for video outputs')
})

test('resolveBrand - Agentic resolution handles characters and other top creators', async () => {
  const { resolveBrand } = (await import('../lib/brand/resolve.ts')).default || (await import('../lib/brand/resolve.ts'))

  const mrBeastResult = await resolveBrand('MrBeast')
  assert.ok(mrBeastResult.url.includes('youtube.com/@MrBeast') || mrBeastResult.url.includes('youtube.com/@mrbeast'))
  assert.ok(mrBeastResult.videos && mrBeastResult.videos.length > 0, 'Must have video items')
})
