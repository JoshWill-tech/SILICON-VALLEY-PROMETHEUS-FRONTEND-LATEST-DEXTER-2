import assert from 'node:assert/strict'

import {
  getChromaticTargetOffset,
  lerpChromaticOffset,
  shouldEnablePostProcessing,
} from '@/lib/webgl/post-processing'

function run() {
  assert.equal(
    shouldEnablePostProcessing({ webglSupported: true, reduceMotion: false, mobileMode: false }),
    true,
  )
  assert.equal(
    shouldEnablePostProcessing({ webglSupported: true, reduceMotion: true, mobileMode: false }),
    false,
  )
  assert.deepEqual(getChromaticTargetOffset(true), [0.003, 0.003])
  assert.deepEqual(getChromaticTargetOffset(false), [0, 0])
  assert.deepEqual(lerpChromaticOffset([0, 0], [0.003, 0.003], 0.5), [0.0015, 0.0015])
}

run()
