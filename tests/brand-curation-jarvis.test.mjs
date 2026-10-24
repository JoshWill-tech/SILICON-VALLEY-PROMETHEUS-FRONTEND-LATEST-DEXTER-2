import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('creator-recommendations engine - Neil Patel cross-platform & inspiration network', async () => {
  const { getCreatorRecommendations } = await import('../lib/creators/creator-recommendations.ts')

  // 1. Partial typing "neil pat" (from user's screenshot)
  const partialRec = getCreatorRecommendations('neil pat')
  assert.equal(partialRec.matchedCreator, 'Neil Patel')
  assert.ok(partialRec.platformOptions.length >= 2, 'Must provide cross-platform choices (YouTube, Instagram, etc.)')

  const yt = partialRec.platformOptions.find((p) => p.platform === 'youtube')
  assert.ok(yt, 'Must provide YouTube channel recommendation')
  assert.ok(yt.handleOrUrl.includes('youtube.com/@neilpatel') || yt.handleOrUrl.includes('@neilpatel'))
  assert.ok(yt.subtitle.includes('1.25M') || yt.subtitle.includes('SEO'))

  const ig = partialRec.platformOptions.find((p) => p.platform === 'instagram')
  assert.ok(ig, 'Must provide Instagram profile recommendation')
  assert.ok(ig.handleOrUrl.includes('instagram.com/neilpatel'))

  // 2. Related creators / Inspiration network
  assert.ok(partialRec.relatedCreators.length >= 3, 'Must recommend related creators on the go')
  const ericSiu = partialRec.relatedCreators.find((r) => r.name.includes('Eric Siu'))
  assert.ok(ericSiu, 'Must include Eric Siu (Marketing School co-host)')

  const brianDean = partialRec.relatedCreators.find((r) => r.name.includes('Brian Dean'))
  assert.ok(brianDean, 'Must include Brian Dean (Backlinko SEO authority)')

  const garyVee = partialRec.relatedCreators.find((r) => r.name.includes('Gary'))
  assert.ok(garyVee, 'Must include GaryVee')

  // 3. Style DNA & Jarvis insight
  assert.ok(partialRec.suggestedStyleDNA, 'Must include suggested style DNA')
  assert.ok(partialRec.suggestedStyleDNA.tone.includes('Authoritative'), 'Must have authoritative tone')
  assert.ok(partialRec.suggestedStyleDNA.pacing.includes('<2s Hook'), 'Must have rapid hook pacing')
  assert.ok(partialRec.jarvisInsight.includes('Neil Patel'), 'Jarvis insight must reference Neil Patel')

  console.log('creator-recommendations engine passed for Neil Patel')
})

test('creator-recommendations engine - Dynamic on-the-go recommendations for arbitrary creators', async () => {
  const { getCreatorRecommendations } = await import('../lib/creators/creator-recommendations.ts')

  const dynamicRec = getCreatorRecommendations('Alpha Creative Studio')
  assert.ok(dynamicRec.platformOptions.length >= 2, 'Must synthesize platform choices for custom creators')
  assert.ok(dynamicRec.platformOptions.some((p) => p.platform === 'youtube'), 'Must provide YouTube candidate')
  assert.ok(dynamicRec.platformOptions.some((p) => p.platform === 'instagram'), 'Must provide Instagram candidate')
  assert.ok(dynamicRec.relatedCreators.length > 0, 'Must provide related benchmark creators')
  assert.ok(dynamicRec.jarvisInsight.includes('Alpha Creative Studio'), 'Jarvis insight must reference creator')

  console.log('creator-recommendations engine passed for dynamic arbitrary queries')
})

test('Neil Patel signature video catalog', async () => {
  const { CREATOR_VIDEO_CATALOG, getCreatorVideos } = await import('../lib/creators/video-catalog.ts')

  assert.ok(CREATOR_VIDEO_CATALOG['Neil Patel'], 'CREATOR_VIDEO_CATALOG must have Neil Patel')
  const videos = CREATOR_VIDEO_CATALOG['Neil Patel']
  assert.ok(videos.length >= 5, 'Must contain at least 5 signature video archetypes')

  const seoVideo = videos.find((v) => v.title.includes('Google') || v.title.includes('Rank'))
  assert.ok(seoVideo, 'Must contain Google #1 ranking video')
  assert.equal(seoVideo.channelTitle, 'Neil Patel')
  assert.ok(seoVideo.videoId, 'Must have valid video ID')

  const reelsVideo = videos.find((v) => v.title.includes('Reels') || v.title.includes('Instagram'))
  assert.ok(reelsVideo, 'Must contain Instagram Reels strategy video')

  const retrieved = getCreatorVideos('Neil Patel')
  assert.equal(retrieved.length, videos.length, 'getCreatorVideos must return Neil Patel catalog')

  console.log('Neil Patel signature video catalog passed with', videos.length, 'archetypes')
})

test('brand search autocomplete component', () => {
  const source = readFileSync(resolve('components/assets/brand-search-autocomplete.tsx'), 'utf8')

  assert.match(source, /role="listbox"/, 'Must define ARIA role="listbox"')
  assert.match(source, /ArrowDown/, 'Must handle keyboard ArrowDown navigation')
  assert.match(source, /ArrowUp/, 'Must handle keyboard ArrowUp navigation')
  assert.match(source, /Escape/, 'Must handle Escape key dismissal')
  assert.match(source, /onOpenJarvis/, 'Must support opening Jarvis assistant')
  assert.match(source, /Inspiration Network/, 'Must render Inspiration Network section')
  assert.match(source, /Platform Archetypes/, 'Must render Platform Archetypes section')

  console.log('brand search autocomplete component contracts passed')
})

test('Jarvis assistant modal integration', () => {
  const modalSource = readFileSync(resolve('components/assets/jarvis-assistant-modal.tsx'), 'utf8')
  assert.match(modalSource, /JARVIS \/\/ CREATIVE INTELLIGENCE/, 'Must display Jarvis creative intelligence title')
  assert.match(modalSource, /useVoiceCompanion/, 'Must integrate with useVoiceCompanion hook')
  assert.match(modalSource, /Calibrate Video Suite/, 'Must offer one-click video suite calibration')
  assert.match(modalSource, /isVoiceActive/, 'Must support active voice conversation toggle')

  const searchSource = readFileSync(resolve('components/assets/liquid-glass-search.tsx'), 'utf8')
  assert.match(searchSource, /BrandSearchAutocomplete/, 'LiquidGlassSearch must mount BrandSearchAutocomplete')
  assert.match(searchSource, /JarvisAssistantModal/, 'LiquidGlassSearch must mount JarvisAssistantModal')
  assert.match(searchSource, /Ask Jarvis AI assistant/, 'LiquidGlassSearch voice icon must be labeled as Jarvis assistant')
  assert.match(searchSource, /setIsJarvisOpen\(true\)/, 'LiquidGlassSearch voice icon must open Jarvis modal on click')

  console.log('Jarvis assistant modal integration passed')
})

test('library collection feed dynamic optimization', () => {
  const librarySource = readFileSync(resolve('components/assets/library-collection.tsx'), 'utf8')
  assert.match(librarySource, /getCreatorRecommendations/, 'Must import getCreatorRecommendations')
  assert.match(librarySource, /CREATOR_VIDEO_CATALOG/, 'Must import CREATOR_VIDEO_CATALOG')
  assert.match(librarySource, /onSelectRecommendation=\{handleSelectRecommendation\}/, 'Must pass recommendation handler to search')
  assert.match(librarySource, /Inspiration Network & Related Creators/, 'Must render Inspiration Network in the feed')
  assert.match(librarySource, /Active Brand Spirit:/, 'Must display active brand spirit indicator')

  console.log('library collection feed dynamic optimization contracts passed')
})

test('resolveBrand Neil Patel intelligence', async () => {
  const { resolveBrand } = await import('../lib/brand/resolve.ts')

  const res = await resolveBrand('Neil Patel')
  assert.equal(res.brandName, 'Neil Patel')
  assert.ok(res.styleDNA, 'Must return styleDNA for Neil Patel')
  assert.ok(res.styleDNA.tone.includes('Authoritative'), 'Must have authoritative tone')
  assert.ok(res.styleDNA.colorAccent, 'Must have color accent')

  console.log('resolveBrand Neil Patel intelligence passed')
})

console.log('all brand curation and jarvis tests passed')
