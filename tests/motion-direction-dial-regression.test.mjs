import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const addOnPath = 'app/editor/motion/components/motion-direction-dial.tsx'
  const oldFirstRunPath = 'app/editor/motion/components/motion-first-run-orbit.tsx'

  assert.equal(existsSync(join(root, addOnPath)), true)
  assert.equal(existsSync(join(root, oldFirstRunPath)), false)

  const addOn = read(addOnPath)
  assert.match(addOn, /MotionDirectionDial/)
  assert.match(addOn, /An inertial virtualized dial with logarithmic step increments and magnetic detents/)
  assert.match(addOn, /inertialBudgetStops/)
  assert.match(addOn, /magneticDetents/)
  assert.match(addOn, /OrbitalReferenceCanvas/)
  assert.match(addOn, /LetterRevealText/)
  assert.match(addOn, /referenceImageInputRef/)
  assert.match(addOn, /assetProbeQuery/)
  assert.match(addOn, /probeAssetSuggestions/)
  assert.match(addOn, /data-motion-direction-dial/)
  assert.match(addOn, /drag="x"/)
  assert.match(addOn, /layoutId="motion-direction-dial-detent"/)
  assert.match(addOn, /volumetric atmospheric vignette/)
  assert.match(addOn, /zero-gravity orbital particle canvas/)

  const canvas = read('app/editor/motion/components/motion-canvas.tsx')
  assert.match(canvas, /MotionDirectionDial/)
  assert.equal(canvas.includes('MotionFirstRunOrbit'), false)
  assert.equal(canvas.includes('motion-first-run-orbit'), false)
}

run()
