import assert from 'node:assert/strict'
import test from 'node:test'

test('agentic-creator-service - Fast-path resolves Gary V in <50ms', async () => {
  const { resolveAgenticCreatorEntity } = await import('../lib/brand/agentic-creator-service.ts')

  const start = performance.now()
  const result = await resolveAgenticCreatorEntity('Gary V')
  const duration = performance.now() - start

  assert.ok(result, 'Must return resolved entity')
  assert.equal(result.canonicalName, 'Gary Vaynerchuk')
  assert.ok(result.youtubeUrl.includes('@garyvee'), 'Must map to @garyvee YouTube URL')
  assert.ok(result.instagramUrl.includes('garyvee'), 'Must map to garyvee Instagram URL')
  assert.ok(duration < 200, `Must be ultra-fast (<200ms), took ${duration.toFixed(2)}ms`)
  console.log(`[Speed Benchmark] Gary V fast-path resolved in ${duration.toFixed(2)}ms`)
})

test('agentic-creator-service - Generic non-creator query falls back cleanly without hanging', async () => {
  const { resolveAgenticCreatorEntity } = await import('../lib/brand/agentic-creator-service.ts')

  const start = performance.now()
  const result = await resolveAgenticCreatorEntity('Studio Design Labs')
  const duration = performance.now() - start

  // Should return null so resolveBrand can fall back to category: 'fallback'
  assert.equal(result, null, 'Non-creator generic business should return null')
  assert.ok(duration < 3000, `Must never hang or block past timeout limit, took ${duration.toFixed(2)}ms`)
  console.log(`[Speed Benchmark] Non-creator generic query evaluated in ${duration.toFixed(2)}ms`)
})
