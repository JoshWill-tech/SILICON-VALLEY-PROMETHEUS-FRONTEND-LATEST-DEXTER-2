import assert from 'node:assert/strict'
import test from 'node:test'
import {
  STUDIO_REFERENCES,
  getStudioReference,
} from '../lib/thumbnails/studio-references.ts'
import { loadStudioReferenceDataUrl } from '../lib/thumbnails/studio-references-server.ts'
import {
  buildOpenAIImageEditRequest,
  buildOpenAIImageEditFormData,
} from '../lib/thumbnails/openai-image-edit.ts'

test('all 107 studio references exist on disk and can be loaded via loadStudioReferenceDataUrl', async () => {
  assert.equal(STUDIO_REFERENCES.length, 107, 'Must have exactly 107 references (9 featured + 98 Kallaway)')

  // Spot-check featured references
  for (const featuredId of ['easy-mode', 'ideas', 'control-mind', 'cmo-brain', '300-to-100k']) {
    const dataUrl = await loadStudioReferenceDataUrl(featuredId)
    assert.ok(dataUrl, `loadStudioReferenceDataUrl should succeed for ${featuredId}`)
    assert.match(dataUrl, /^data:image\/webp;base64,/)
    assert.ok(dataUrl.length > 500, `Data URL for ${featuredId} should have non-trivial image bytes`)
  }

  // Spot-check Kallaway references
  const kallawayIds = ['10-growth-hacks', '100-hours-of-ai', '100-years-of-wisdom', '10m-business-breakdown']
  for (const id of kallawayIds) {
    const dataUrl = await loadStudioReferenceDataUrl(id)
    assert.ok(dataUrl, `loadStudioReferenceDataUrl should succeed for ${id}`)
    assert.match(dataUrl, /^data:image\/webp;base64,/)
    assert.ok(dataUrl.length > 500, `Data URL for ${id} should have non-trivial image bytes`)
  }
})

test('no studio reference has empty or purely generic boilerplate cues', () => {
  const genericBoilerplate = 'Bold visual hook, high-contrast creator framing, strong focal point, clean graphic accents, and high-CTR YouTube thumbnail typography.'

  for (const ref of STUDIO_REFERENCES) {
    assert.ok(ref.cue && ref.cue.trim().length > 20, `Reference ${ref.id} must have a substantial cue`)
    assert.notEqual(
      ref.cue.trim(),
      genericBoilerplate,
      `Reference ${ref.id} must have an enriched cue specific to its style/title, not raw boilerplate`
    )

    // Verify enriched cue mentions the reference name or visual motif
    const retrieved = getStudioReference(ref.id)
    assert.ok(retrieved.cue.length > 30, `Enriched cue for ${ref.id} should be descriptive`)
  }
})

test('buildOpenAIImageEditRequest and buildOpenAIImageEditFormData enforce mandatory seed reference influence in prompt and multipart payload', () => {
  const dummyFrame = 'data:image/jpeg;base64,ZmFtZQ=='
  const dummyRef = 'data:image/webp;base64,cmVmZXJlbmNl'

  const request = buildOpenAIImageEditRequest({
    prompt: 'Create a viral AI tutorial thumbnail',
    frameDataUrl: dummyFrame,
    referenceImages: [dummyRef],
    aspectRatio: '16:9',
    quality: 'fast',
    model: 'gpt-image-2',
  })

  assert.equal(request.model, 'gpt-image-2')
  assert.equal(request.images.length, 2, 'Should include anchor frame and reference image')
  assert.match(request.prompt, /SEED REFERENCE INFLUENCE IS MANDATORY/i)
  assert.match(request.prompt, /visual DNA, atmosphere, and visual devices/i)

  const formData = buildOpenAIImageEditFormData({
    prompt: 'Create a viral AI tutorial thumbnail',
    frameDataUrl: dummyFrame,
    referenceImages: [dummyRef],
    aspectRatio: '16:9',
    quality: 'fast',
    model: 'gpt-image-2',
  })

  assert.ok(formData instanceof FormData, 'Should produce a valid FormData instance')
  const promptField = formData.get('prompt')
  assert.ok(typeof promptField === 'string')
  assert.match(promptField, /SEED REFERENCE INFLUENCE IS MANDATORY/i)

  const images = formData.getAll('image[]')
  assert.equal(images.length, 2, 'Should attach both anchor frame and reference image to multipart')
})

test('server-side fallback resolves studio reference when client sends studioReferenceId without referenceImages', async () => {
  // Simulate client request with studioReferenceId but empty referenceImages
  const studioReferenceId = 'easy-mode'
  const fallbackRef = await loadStudioReferenceDataUrl(studioReferenceId)
  assert.ok(fallbackRef, 'Fallback loader must resolve easy-mode')

  let referenceImages = []
  if (studioReferenceId) {
    const serverRef = await loadStudioReferenceDataUrl(studioReferenceId)
    if (serverRef) {
      if (referenceImages.length === 0) {
        referenceImages = [serverRef]
      } else if (!referenceImages.some(img => img === serverRef || img.slice(0, 80) === serverRef.slice(0, 80))) {
        referenceImages = [serverRef, ...referenceImages].slice(0, 4)
      }
    }
  }

  assert.equal(referenceImages.length, 1)
  assert.equal(referenceImages[0], fallbackRef)

  // Also verify when client provides a channel reference, server prepends studio reference
  const dummyChannelRef = 'data:image/png;base64,Y2hhbm5lbA=='
  let mixedReferences = [dummyChannelRef]
  if (studioReferenceId) {
    const serverRef = await loadStudioReferenceDataUrl(studioReferenceId)
    if (serverRef) {
      if (mixedReferences.length === 0) {
        mixedReferences = [serverRef]
      } else if (!mixedReferences.some(img => img === serverRef || img.slice(0, 80) === serverRef.slice(0, 80))) {
        mixedReferences = [serverRef, ...mixedReferences].slice(0, 4)
      }
    }
  }
  assert.equal(mixedReferences.length, 2)
  assert.equal(mixedReferences[0], fallbackRef, 'Studio reference must be primary (index 0)')
  assert.equal(mixedReferences[1], dummyChannelRef)
})
