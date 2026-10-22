import assert from 'node:assert/strict'
import test from 'node:test'

test('resolveBrand - YouTube URL resolution with real video ID', async () => {
  const { resolveBrand, resolveYouTubeBrand } = await import('../lib/brand/resolve.ts')

  // The user's exact URL from the screenshot
  const result = await resolveBrand('https://www.youtube.com/watch?v=zF-j5u1CoAo')
  assert.equal(result.category, 'youtube')
  // Must NOT be 'Watch?v=zF-j5u1CoAo'!
  assert.notEqual(result.brandName, 'Watch?v=zF-j5u1CoAo')
  assert.notEqual(result.brandName, 'watch?v=zF-j5u1CoAo')
  // Should resolve to the channel name 'Lock In Music' (or YouTube Creator fallback if offline)
  assert.ok(
    result.brandName === 'Lock In Music' || result.brandName === 'YouTube Creator',
    `Expected 'Lock In Music' or 'YouTube Creator', got: ${result.brandName}`
  )
  assert.ok(result.url.includes('youtube.com'), 'Must have valid YouTube url')

  console.log('resolveBrand YouTube watch test passed:', result.brandName)
})

test('resolveBrand - YouTube handle and channels', async () => {
  const { resolveBrand } = await import('../lib/brand/resolve.ts')

  const channelResult = await resolveBrand('https://www.youtube.com/@mkbhd')
  assert.equal(channelResult.category, 'youtube')
  assert.equal(channelResult.brandName, 'Mkbhd')

  const directHandle = await resolveBrand('youtube.com/@veritasium')
  assert.equal(directHandle.category, 'youtube')
  assert.equal(directHandle.brandName, 'Veritasium')

  console.log('resolveBrand YouTube channel handle test passed')
})

test('resolveBrand - Social handles', async () => {
  const { resolveBrand } = await import('../lib/brand/resolve.ts')

  const igHandle = await resolveBrand('@nike')
  assert.equal(igHandle.category, 'social')
  assert.equal(igHandle.brandName, 'Nike')
  assert.equal(igHandle.url, 'https://instagram.com/nike')

  const igUrl = await resolveBrand('https://www.instagram.com/creator_studio/')
  assert.equal(igUrl.category, 'social')
  assert.equal(igUrl.brandName, 'Creator Studio')

  console.log('resolveBrand social handle test passed')
})

test('resolveBrand - Website domains and fallback specifications', async () => {
  const { resolveBrand } = await import('../lib/brand/resolve.ts')

  const webResult = await resolveBrand('https://acme-studio.com')
  assert.equal(webResult.category, 'domain')
  assert.ok(webResult.brandName.length > 0)
  assert.doesNotMatch(webResult.brandName, /^https?:/i)

  const rawBrand = await resolveBrand('Studio Design Labs')
  assert.equal(rawBrand.category, 'fallback')
  assert.equal(rawBrand.brandName, 'Studio Design Labs')

  console.log('resolveBrand website and fallback test passed')
})
