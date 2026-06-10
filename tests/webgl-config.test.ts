import assert from 'node:assert/strict'

import {
  DEFAULT_POST_PROCESSING_CONFIG,
  DEFAULT_SCENE_MANAGER_CONFIG,
  getDeviceWebglTier,
} from '@/lib/webgl/config'

function run() {
  assert.equal(DEFAULT_SCENE_MANAGER_CONFIG.enableLenis, true)
  assert.equal(DEFAULT_SCENE_MANAGER_CONFIG.maxDpr, 2)
  assert.equal(DEFAULT_SCENE_MANAGER_CONFIG.mobileMaxFps, 30)
  assert.equal(DEFAULT_POST_PROCESSING_CONFIG.bloomIntensity, 0.5)
  assert.equal(DEFAULT_POST_PROCESSING_CONFIG.vignetteDarkness, 0.3)

  assert.equal(
    getDeviceWebglTier({ hardwareConcurrency: 8, devicePixelRatio: 1, prefersReducedMotion: false }),
    'high',
  )
  assert.equal(
    getDeviceWebglTier({ hardwareConcurrency: 2, devicePixelRatio: 2, prefersReducedMotion: false }),
    'lite',
  )
  assert.equal(
    getDeviceWebglTier({ hardwareConcurrency: 8, devicePixelRatio: 3, prefersReducedMotion: false }),
    'standard',
  )
  assert.equal(
    getDeviceWebglTier({ hardwareConcurrency: 8, devicePixelRatio: 1, prefersReducedMotion: true }),
    'lite',
  )
}

run()
