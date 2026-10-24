import test from 'node:test'
import assert from 'node:assert/strict'

import { useMiniRunDraftStore } from '../lib/editor/mini-run-draft-store'
import { resolveFontFamily, TYPOGRAPHY_PRESETS } from '../components/editor/mini-run-live-overlay'
import { calculateScaledTypography, calculateVideoFrameScale } from '../lib/editor/video-frame-scaling'

test('Mini-Run Font Manifest and Layered Typography Engine', async (t) => {
  await t.test('resolveFontFamily maps backend fonts and local luxury typefaces correctly', () => {
    assert.ok(resolveFontFamily('Playfair Display').includes('Playfair Display'))
    assert.ok(resolveFontFamily('Bodoni Moda').includes('Bodoni Moda'))
    assert.ok(resolveFontFamily('Migra').includes('var(--font-migra)'))
    assert.ok(resolveFontFamily('Vogue').includes('var(--font-vogue-display)'))
    assert.ok(resolveFontFamily('ZT Otez').includes('var(--font-zt-otez)'))
    assert.ok(resolveFontFamily('Montserrat').includes('Montserrat'))
    assert.ok(resolveFontFamily('Cinzel').includes('Cinzel'))
    assert.ok(resolveFontFamily('Bebas Neue').includes('Bebas Neue'))
  })

  await t.test('setPlan parses chunks with backend layers, brandPalette, and safe placement', () => {
    const store = useMiniRunDraftStore.getState()
    store.reset()

    const backendManifest = {
      composition: 'PrometheusMinRun',
      canvas: { width: 1080, height: 1920, aspectRatio: '9:16' },
      brandPalette: {
        hero_color: '#F5E6C4',
        companion_color: '#FFFFFF',
        glow: '0 0 16px rgba(245, 230, 196, 0.45)',
        shadow: '0 2px 10px rgba(0, 0, 0, 0.45)',
      },
      chunks: [
        {
          chunkIndex: 0,
          text: 'having to calculate',
          placement: { xPercent: '50%', yPercent: '56%', anchor: 'center' },
          layers: [
            {
              layerIndex: 0,
              role: 'secondary_clause',
              text: 'having to',
              words: [
                { text: 'having', start_ms: 100, end_ms: 400 },
                { text: 'to', start_ms: 400, end_ms: 600 },
              ],
              fontFamily: 'Playfair Display',
              fontWeight: 600,
              fontStyle: 'italic',
              fontSizePx: 68,
              color: '#FFFFFF',
              isHero: false,
            },
            {
              layerIndex: 1,
              role: 'primary_focus_word',
              text: 'calculate',
              words: [{ text: 'calculate', start_ms: 600, end_ms: 1100 }],
              fontFamily: 'Bodoni Moda',
              fontWeight: 800,
              fontStyle: 'italic',
              fontSizePx: 130,
              color: '#F5E6C4',
              isHero: true,
            },
          ],
        },
      ],
    }

    store.setPlan(backendManifest, 'https://example.com/source.mp4')

    const state = useMiniRunDraftStore.getState()
    assert.equal(state.chunks.length, 1)
    const chunk = state.chunks[0]

    // Placement assertion
    assert.equal(chunk.placement?.yPercent, '56%')
    assert.equal(chunk.placement?.anchor, 'center')

    // Layers assertion
    assert.ok(chunk.layers && chunk.layers.length === 2)
    assert.equal(chunk.layers[0].fontFamily, 'Playfair Display')
    assert.equal(chunk.layers[0].fontSizePx, 68)
    assert.equal(chunk.layers[0].color, '#FFFFFF')

    assert.equal(chunk.layers[1].fontFamily, 'Bodoni Moda')
    assert.equal(chunk.layers[1].fontSizePx, 130)
    assert.equal(chunk.layers[1].color, '#F5E6C4')
    assert.equal(chunk.layers[1].isHero, true)

    // Palette assertion
    assert.equal(state.brandPalette?.hero_color, '#F5E6C4')
  })

  await t.test('updateWordText keeps layer words in sync with chunk words', () => {
    const store = useMiniRunDraftStore.getState()
    store.updateWordText(0, 0, 'HAD')

    const state = useMiniRunDraftStore.getState()
    const chunk = state.chunks[0]
    assert.equal(chunk.words[0].text, 'HAD')
    assert.ok(chunk.layers)
    assert.equal(chunk.layers[0].words?.[0].text, 'HAD')
  })

  await t.test('toggleWordCut updates word and layer cut status', () => {
    const store = useMiniRunDraftStore.getState()
    store.toggleWordCut(0, 1)

    const state = useMiniRunDraftStore.getState()
    const chunk = state.chunks[0]
    assert.equal(chunk.words[1].cut, true)
    assert.ok(chunk.layers)
    assert.equal(chunk.layers[0].words?.[1].cut, true)
  })

  await t.test('getDraftManifest exports full layers, brandPalette, and safe placement for cloud baking', () => {
    const store = useMiniRunDraftStore.getState()
    const manifest = store.getDraftManifest() as any

    assert.ok(manifest.chunks && manifest.chunks.length === 1)
    const chunk = manifest.chunks[0]
    assert.ok(chunk.layers && chunk.layers.length === 2)
    assert.equal(chunk.placement.yPercent, '56%')
    assert.equal(chunk.layers[1].color, '#F5E6C4')
    assert.equal(manifest.brand_palette.hero_color, '#F5E6C4')
  })

  await t.test('TYPOGRAPHY_PRESETS include high-fashion and didone editorial combinations', () => {
    const didone = TYPOGRAPHY_PRESETS.find((p) => p.id === 'didone_luxury')
    assert.ok(didone)
    assert.ok(didone.layersTemplate?.hero?.fontSizePx === 130)
    assert.equal(didone.layersTemplate?.hero?.color, '#F5E6C4')

    const migra = TYPOGRAPHY_PRESETS.find((p) => p.id === 'editorial_migra')
    assert.ok(migra)
    assert.ok(migra.styling.fontFamily?.includes('--font-migra'))
  })

  console.log('mini-run font manifest and layers test passed')
})
