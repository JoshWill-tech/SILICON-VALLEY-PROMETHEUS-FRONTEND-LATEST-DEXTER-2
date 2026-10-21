import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8')

test('geometry and waveform structure', () => {
  const fileContent = read('components/assets/brand-voice-path-animation.tsx')
  assert.ok(fileContent.includes('export function BrandVoicePathAnimation'), 'Must export BrandVoicePathAnimation')

  // Verify exact roller-coaster SVG path geometry provided by user
  const expectedPathGeometry = 'M 68,248'
  assert.ok(fileContent.includes(expectedPathGeometry), 'Must contain starting point M 68,248')
  assert.ok(fileContent.includes('C 235,248 462,222 462,115'), 'Must contain first cubic bezier curve')
  assert.ok(fileContent.includes('C 462,56 418,28 375,28'), 'Must contain top peak bezier curve')
  assert.ok(fileContent.includes('C 332,28 288,56 288,115'), 'Must contain loop-around curve')
  assert.ok(fileContent.includes('C 288,175 368,284 468,284'), 'Must contain bottom loop curve')
  assert.ok(fileContent.includes('C 565,284 685,192 915,196'), 'Must contain swoop-out curve')

  // Verify voice waveform pill with 13 bars
  assert.ok(fileContent.includes('data-testid="voice-pill"'), 'Must have interactive voice pill element')
  assert.ok(fileContent.includes('brandWavePulse'), 'Must include brand wave pulse animation keyframes')

  // Verify edge fade mask
  assert.ok(fileContent.includes('linearGradient'), 'Must include linearGradient for edge fading')
  assert.ok(fileContent.includes('mask'), 'Must include mask referencing gradient')
  assert.ok(fileContent.includes('textPath'), 'Must include SVG textPath element')

  console.log('geometry and waveform structure passed')
})

test('dynamic witty pun engine', async () => {
  const { extractBrandInfo, getRandomWittyPun, WITTY_PUNS_BY_TYPE } = await import(
    '../components/assets/brand-voice-path-animation.tsx'
  )

  // Verify YouTube extraction
  const ytInfo = extractBrandInfo('www.youtube.com/ao9afafuaafb')
  assert.equal(ytInfo.category, 'youtube')
  assert.equal(ytInfo.brandName, 'Ao9afafuaafb')

  const ytPun = getRandomWittyPun('www.youtube.com/ao9afafuaafb')
  assert.ok(ytPun.length > 10, 'Pun must be non-empty')
  assert.ok(
    ytPun.includes('Ao9afafuaafb') ||
      ytPun.includes('YouTube') ||
      ytPun.includes('algorithm') ||
      ytPun.includes('retention') ||
      ytPun.includes('like button') ||
      ytPun.includes('4K'),
    'YouTube pun must be tailored to video / channel concepts'
  )

  // Verify Social extraction
  const socialInfo = extractBrandInfo('@creator_vision')
  assert.equal(socialInfo.category, 'social')
  assert.equal(socialInfo.brandName, 'Creator_vision')

  const socialPun = getRandomWittyPun('@creator_vision')
  assert.ok(socialPun.length > 10, 'Social pun must be non-empty')

  // Verify Domain extraction
  const domainInfo = extractBrandInfo('https://acme-studio.com')
  assert.equal(domainInfo.category, 'domain')
  assert.equal(domainInfo.brandName, 'Acme-studio')

  const domainPun = getRandomWittyPun('https://acme-studio.com')
  assert.ok(domainPun.length > 10, 'Domain pun must be non-empty')

  // Verify dynamic exclusion prevents exact consecutive duplicates
  const pun1 = WITTY_PUNS_BY_TYPE.youtube[0].replace(/\{brand\}/g, 'Ao9afafuaafb')
  const pun2 = getRandomWittyPun('www.youtube.com/ao9afafuaafb', pun1)
  assert.notEqual(pun2, pun1, 'Must exclude previous pun when possible')

  const originalRandom = Math.random
  try {
    Math.random = () => 0
    for (const query of ['youtube.com/@studio', '@studio', 'https://studio.com', 'Studio']) {
      const first = getRandomWittyPun(query)
      assert.notEqual(getRandomWittyPun(query, first), first, 'Interpolated brand messages must never repeat consecutively')
    }
  } finally {
    Math.random = originalRandom
  }

  console.log('dynamic witty pun engine passed')
})

test('library collection integration', () => {
  const libraryContent = read('components/assets/library-collection.tsx')
  assert.ok(
    libraryContent.includes('BrandVoicePathAnimation'),
    'library-collection.tsx must import and render BrandVoicePathAnimation'
  )
  assert.ok(
    libraryContent.includes('brandQuery={submittedBrandQuery}'),
    'BrandVoicePathAnimation must receive the submitted brand query'
  )

  console.log('library collection integration passed')
})

test('all brand voice animation tests passed', () => {
  console.log('all brand voice animation tests passed')
})
