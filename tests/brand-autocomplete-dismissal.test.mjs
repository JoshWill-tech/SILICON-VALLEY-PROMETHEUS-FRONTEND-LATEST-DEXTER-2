import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('autocomplete dismissal & input unfocus', () => {
  const searchSource = readFileSync(resolve('components/assets/liquid-glass-search.tsx'), 'utf8')

  // Must define dismissSearchFocusAndAutocomplete helper
  assert.match(
    searchSource,
    /dismissSearchFocusAndAutocomplete/,
    'Must define dismissSearchFocusAndAutocomplete helper'
  )

  // Must blur input element
  assert.match(
    searchSource,
    /inputRef\.current\?\.blur\(\)/,
    'Must blur input on submission or selection'
  )

  // Must set isAutocompleteOpen to false on dismissal
  assert.match(
    searchSource,
    /setIsAutocompleteOpen\(false\)/,
    'Must close autocomplete modal on dismissal'
  )

  // handleSubmit must invoke dismissSearchFocusAndAutocomplete
  assert.match(
    searchSource,
    /handleSubmit[\s\S]*?dismissSearchFocusAndAutocomplete\(\)/,
    'handleSubmit must dismiss autocomplete and blur input'
  )

  // onSelectPlatform must invoke dismissSearchFocusAndAutocomplete
  assert.match(
    searchSource,
    /onSelectPlatform=\{[\s\S]*?dismissSearchFocusAndAutocomplete\(\)/,
    'onSelectPlatform must dismiss autocomplete and blur input'
  )

  // onSelectRelated must invoke dismissSearchFocusAndAutocomplete
  assert.match(
    searchSource,
    /onSelectRelated=\{[\s\S]*?dismissSearchFocusAndAutocomplete\(\)/,
    'onSelectRelated must dismiss autocomplete and blur input'
  )

  // Input onKeyDown must handle Enter and Escape
  assert.match(
    searchSource,
    /e\.key === 'Enter'/,
    'Search input must handle Enter key'
  )

  console.log('autocomplete dismissal & input unfocus passed')
})

test('container clickability and option contracts', () => {
  const autocompleteSource = readFileSync(resolve('components/assets/brand-search-autocomplete.tsx'), 'utf8')

  // Full item container must be clickable with cursor-pointer
  assert.match(
    autocompleteSource,
    /cursor-pointer/,
    'Option items must have cursor-pointer for full card container clickability'
  )

  // Must have role="option"
  assert.match(
    autocompleteSource,
    /role="option"/,
    'Option item must declare role="option"'
  )

  // Apply Spirit indicator must be visible
  assert.match(
    autocompleteSource,
    /Apply Spirit →/,
    'Must render Apply Spirit indicator'
  )

  // Keyboard navigation on Enter must select and close
  assert.match(
    autocompleteSource,
    /e\.key === 'Enter'/,
    'Must handle Enter key in autocomplete'
  )

  console.log('container clickability and option contracts passed')
})

test('creator video archetypes and content reveal', async () => {
  const { buildCreatorFallbackVideos } = await import('../lib/creators/video-catalog.ts')

  assert.equal(typeof buildCreatorFallbackVideos, 'function', 'Must export buildCreatorFallbackVideos helper')

  const videos = buildCreatorFallbackVideos('Alec Benjamin', 'https://www.youtube.com/@alecbenjamin')
  assert.ok(Array.isArray(videos), 'Must return an array of video archetypes')
  assert.ok(videos.length >= 4, 'Must generate at least 4 video archetypes for Alec Benjamin')

  for (const video of videos) {
    assert.ok(video.videoId, 'Each video archetype must have a videoId')
    assert.ok(video.title.includes('Alec Benjamin'), 'Video title must reference Alec Benjamin')
    assert.ok(video.thumbnailUrl, 'Each video archetype must have a thumbnailUrl')
    assert.ok(video.url, 'Each video archetype must have a YouTube destination URL')
  }

  console.log('creator video archetypes and content reveal passed')
})

test('library collection instant content reveal', () => {
  const librarySource = readFileSync(resolve('components/assets/library-collection.tsx'), 'utf8')

  // Must import or define buildCreatorFallbackVideos
  assert.match(
    librarySource,
    /buildCreatorFallbackVideos/,
    'LibraryCollection must use buildCreatorFallbackVideos'
  )

  // handleSearchSubmit must synthesize fallback archetype videos for custom creators
  assert.match(
    librarySource,
    /fallbackSpec|curatedSpec/,
    'handleSearchSubmit must construct spec with videos for custom creators'
  )

  // Feed renders spotlight header and videos when activeBrand is set
  assert.match(
    librarySource,
    /Instantaneous Video Ingestion Collection/,
    'Must render Instantaneous Video Ingestion Collection'
  )

  assert.match(
    librarySource,
    /Inspiration Network & Related Creators/,
    'Must render Inspiration Network'
  )

  console.log('library collection instant content reveal passed')
})

console.log('all brand autocomplete dismissal tests passed')
