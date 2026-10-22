import assert from 'node:assert/strict'
import test from 'node:test'
import { getStudioReference } from '../lib/thumbnails/studio-references.ts'
import { buildNanoBananaPrompt } from '../lib/thumbnails/nano-banana-rulebook.ts'
import { buildStudioArtDirection, parseStudioDesign } from '../lib/thumbnails/studio-art-direction.ts'
import { buildNanoBananaImageRequest } from '../lib/thumbnails/nano-banana-image.ts'

test('selected reference with chart/graph theme drives background and props without conflicting dark defaults', () => {
  const easyMode = getStudioReference('easy-mode')
  assert.ok(easyMode, 'easy-mode reference exists')
  assert.match(easyMode.cue, /dark analytics panel|electric blue graph|rounded white frame/i)

  const studioDesign = parseStudioDesign({
    layout: 'hero',
    background: 'light',
    accent: '#00B9F2',
    quality: 'fast',
    textScale: 1,
  })

  const prompt = buildStudioArtDirection(studioDesign, 'TEST HEADLINE', '', easyMode.cue)
  // When a reference cue specifies its own background atmosphere, it should not be forced into a conflicting dark navy gradient
  assert.match(prompt, /SELECTED THUMBNAIL REFERENCE \(PRIMARY TARGET\):/i)
  assert.match(prompt, /dark analytics panel, electric blue graph/i)
})

test('buildNanoBananaPrompt suppresses contradictory text highlighter when reference style does not use it', () => {
  const prompt = buildNanoBananaPrompt({
    headline: 'GROW ON YOUTUBE',
    aspectRatio: '16:9',
    hasReferenceImage: true,
  })

  // Should mandate reference visual cues, lighting, background, and props
  assert.match(prompt, /Strictly emulate the lighting mood, contrast ratios, and cinematic grading of the selected reference image/i)
  assert.match(prompt, /Faithfully recreate the background atmosphere, textural detail, and environmental style of the selected reference image/i)
  assert.match(prompt, /Incorporate the conceptual props, physical objects.*UI devices from the selected reference image/i)
  // Should keep speaker face authentic and simple
  assert.match(prompt, /Preserve the primary visible subject from the anchor keyframe.*recognizable facial features/i)
})

test('multimodal image request explicitly instructs the model to honor reference composition and charts', () => {
  const dummyFrame = 'data:image/jpeg;base64,ZmFtZQ=='
  const dummyReference = 'data:image/webp;base64,cmVmZXJlbmNl'

  const request = buildNanoBananaImageRequest({
    prompt: 'Transfer the white frame, dark analytics chart, and editorial typography from the reference.',
    frameDataUrl: dummyFrame,
    referenceImages: [dummyReference],
    aspectRatio: '16:9',
  })

  const preamble = request.contents[0].parts[0].text
  assert.match(preamble, /Follow the selected reference closely/i)
  assert.match(preamble, /transfer its macro-composition, subject-to-text relationship, visual hierarchy, palette, lighting, background treatment/i)
  assert.match(preamble, /Keep the source person's identity, expression, and recognizable features/i)
})
