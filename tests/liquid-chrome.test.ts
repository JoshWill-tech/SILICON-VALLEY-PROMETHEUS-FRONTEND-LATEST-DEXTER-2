import assert from 'node:assert/strict'

import {
  getMagneticTarget,
  getRippleOrigin,
  getSheenPosition,
  lerpPoint,
} from '@/lib/ui/liquid-chrome'

function run() {
  const rect = { left: 10, top: 20, width: 200, height: 100 }

  assert.deepEqual(
    getSheenPosition({ clientX: 110, clientY: 70, rect }),
    { x: 50, y: 50 },
  )

  const magnetic = getMagneticTarget({
    clientX: 150,
    clientY: 70,
    rect,
  })
  assert.equal(Number(magnetic.x.toFixed(2)) > 0, true)
  assert.equal(Number(magnetic.y.toFixed(2)) === 0, true)

  assert.deepEqual(
    getMagneticTarget({
      clientX: 400,
      clientY: 400,
      rect,
    }),
    { x: 0, y: 0 },
  )

  assert.deepEqual(lerpPoint({ x: 0, y: 0 }, { x: 4, y: -4 }, 0.25), { x: 1, y: -1 })
  assert.deepEqual(getRippleOrigin({ clientX: 40, clientY: 55, rect: { left: 10, top: 20 } }), { x: 30, y: 35 })
}

run()
