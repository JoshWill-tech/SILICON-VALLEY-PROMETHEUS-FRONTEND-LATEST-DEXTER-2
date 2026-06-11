import assert from 'node:assert/strict'

import {
  getSceneDpr,
  getSceneRouteFlags,
  isMobileWebglMode,
} from '@/lib/webgl/scene-routing'

function run() {
  assert.deepEqual(getSceneRouteFlags('/'), {
    hero: true,
    dashboard: false,
    editor: false,
  })
  assert.deepEqual(getSceneRouteFlags('/projects'), {
    hero: false,
    dashboard: true,
    editor: false,
  })
  assert.deepEqual(getSceneRouteFlags('/editor/abc'), {
    hero: false,
    dashboard: false,
    editor: true,
  })
  assert.equal(isMobileWebglMode(2), true)
  assert.equal(isMobileWebglMode(8), false)
  assert.equal(
    getSceneDpr({ devicePixelRatio: 2, maxDpr: 2, mobileMode: true }),
    0.5,
  )
  assert.equal(
    getSceneDpr({ devicePixelRatio: 3, maxDpr: 2, mobileMode: false }),
    2,
  )
}

run()
