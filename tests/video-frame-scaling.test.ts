import test from 'node:test'
import assert from 'node:assert/strict'

import {
  REFERENCE_FRAME_HEIGHT,
  REFERENCE_FRAME_WIDTH,
  calculateVideoFrameScale,
  calculateScaledTypography,
  normalizeBaseFontSize,
} from '../lib/editor/video-frame-scaling'

test('Video Frame Scaling Engine', async (t) => {
  await t.test('Reference constants match canonical 960 vertical frame', () => {
    assert.equal(REFERENCE_FRAME_HEIGHT, 960, 'Reference height must be 960')
    assert.equal(REFERENCE_FRAME_WIDTH, 540, 'Reference width must be 540 for 9:16 portrait')
  })

  await t.test('calculateVideoFrameScale computes accurate scale for portrait 9:16 video', () => {
    // 1. Exact 1:1 reference frame (540 x 960)
    const ref = calculateVideoFrameScale({
      renderedWidth: 540,
      renderedHeight: 960,
    })
    assert.equal(ref.scale, 1.0)
    assert.equal(ref.referenceWidth, 540)
    assert.equal(ref.referenceHeight, 960)

    // 2. Editor compact preview canvas (e.g. 160 x 284)
    const preview = calculateVideoFrameScale({
      renderedWidth: 160,
      renderedHeight: 284.44,
    })
    assert.ok(Math.abs(preview.scale - 0.296) < 0.005, `Expected scale ~0.296, got ${preview.scale}`)
    assert.equal(preview.referenceWidth, 540)
    assert.equal(preview.referenceHeight, 960)

    // 3. Full HD video (1080 x 1920)
    const fhd = calculateVideoFrameScale({
      renderedWidth: 1080,
      renderedHeight: 1920,
    })
    assert.equal(fhd.scale, 2.0)

    // 4. 4K canvas (2160 x 3840)
    const uhd = calculateVideoFrameScale({
      renderedWidth: 2160,
      renderedHeight: 3840,
    })
    assert.equal(uhd.scale, 4.0)
  })

  await t.test('calculateVideoFrameScale adapts to arbitrary resolutions and aspect ratios', () => {
    // Landscape 16:9 video in 960 frame (960 x 540)
    const landscape = calculateVideoFrameScale({
      renderedWidth: 960,
      renderedHeight: 540,
      aspectRatio: 16 / 9,
    })
    assert.ok(landscape.scale > 0)
    assert.equal(landscape.referenceHeight, 960)
    assert.equal(landscape.referenceWidth, Math.round(960 * (16 / 9))) // 1707

    // Square 1:1 video (e.g. 600 x 600)
    const square = calculateVideoFrameScale({
      renderedWidth: 600,
      renderedHeight: 600,
      aspectRatio: 1,
    })
    assert.equal(square.referenceWidth, 960)
    assert.equal(square.referenceHeight, 960)
    assert.equal(square.scale, 600 / 960)
  })

  await t.test('normalizeBaseFontSize normalizes 1080p font sizes to 960 frame', () => {
    // 72px authored on 1080p canvas -> 36px in 960 frame
    assert.equal(normalizeBaseFontSize(72, 1920), 36)
    // 72px without canvasHeight hint (heuristic: > 55 means 1080p) -> 36px
    assert.equal(normalizeBaseFontSize(72), 36)
    // 40px authored in 960 frame -> 40px
    assert.equal(normalizeBaseFontSize(40, 960), 40)
    assert.equal(normalizeBaseFontSize(40), 40)
    // Undefined fallback -> default 38px
    assert.equal(normalizeBaseFontSize(undefined), 38)
  })

  await t.test('calculateScaledTypography scales font size, padding, gaps, and strokes proportionally', () => {
    // Test on preview size (scale ~0.3)
    const previewMetrics = calculateVideoFrameScale({
      renderedWidth: 160,
      renderedHeight: 284.44,
    })
    const previewStyles = calculateScaledTypography({
      metrics: previewMetrics,
      typography: {
        fontSize: 38,
        strokeWidth: 2,
        shadow: '0 4px 15px rgba(0,0,0,0.9)',
      },
    })

    // At preview size (160px wide):
    // Font size should be ~11.2px, NOT static 26px!
    assert.ok(
      previewStyles.fontSize >= 10 && previewStyles.fontSize <= 12,
      `Preview font size should be around 11px, got ${previewStyles.fontSize}`
    )
    // Padding should be scaled down from 24px to ~7px
    assert.ok(
      previewStyles.paddingX >= 6 && previewStyles.paddingX <= 9,
      `Padding should be around 7px, got ${previewStyles.paddingX}`
    )
    // Stroke width scaled from 2px to ~0.6px
    assert.ok(
      previewStyles.strokeWidth !== undefined && parseFloat(previewStyles.strokeWidth) < 1.5,
      `Stroke width should scale down, got ${previewStyles.strokeWidth}`
    )

    // Test on Full HD canvas (scale = 2.0)
    const fhdMetrics = calculateVideoFrameScale({
      renderedWidth: 1080,
      renderedHeight: 1920,
    })
    const fhdStyles = calculateScaledTypography({
      metrics: fhdMetrics,
      typography: { fontSize: 38 },
    })
    assert.equal(fhdStyles.fontSize, 76, 'FHD font size should be exactly 76px (38 * 2.0)')
    assert.equal(fhdStyles.paddingX, 48, 'FHD padding should be 48px (24 * 2.0)')
  })

  await t.test('calculateScaledTypography correctly resolves relative and pixel positionY', () => {
    const metrics = calculateVideoFrameScale({ renderedWidth: 540, renderedHeight: 960 })

    // Fraction (0.72 -> 72%)
    const fraction = calculateScaledTypography({ metrics, typography: { positionY: 0.72 } })
    assert.equal(fraction.positionYPercent, 72)

    // Pixel in 960 frame (691px / 960 -> ~72%)
    const pixel960 = calculateScaledTypography({ metrics, typography: { positionY: 691.2 } })
    assert.equal(Math.round(pixel960.positionYPercent), 72)

    // Pixel in 1920 frame (1382.4px / 1920 -> ~72%)
    const pixel1920 = calculateScaledTypography({ metrics, typography: { positionY: 1382.4 } })
    assert.equal(Math.round(pixel1920.positionYPercent), 72)
  })

  console.log('video frame scaling tests passed')
})
