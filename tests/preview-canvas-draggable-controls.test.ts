import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('PreviewCanvas Floating Transport Controls Draggable Architecture', async () => {
  const canvasFile = path.resolve('components/editor/PreviewCanvas.tsx')
  assert.ok(fs.existsSync(canvasFile), 'PreviewCanvas.tsx must exist')
  const content = fs.readFileSync(canvasFile, 'utf8')

  // Check 1: motion.div with data-preview-controls has drag enabled
  assert.match(
    content,
    /<motion\.div[\s\S]*?data-preview-controls[\s\S]*?drag\b/,
    'Preview controls must be a motion.div with drag attribute enabled'
  )

  // Check 2: data-draggable attribute is set to "true"
  assert.match(
    content,
    /data-draggable="true"/,
    'Preview controls must declare data-draggable="true" attribute'
  )

  // Check 3: dragConstraints references the preview container to prevent losing controls offscreen
  assert.match(
    content,
    /dragConstraints={previewCanvasRef}/,
    'Preview controls must constrain dragging within previewCanvasRef boundaries'
  )

  // Check 4: dragMomentum is disabled for precise user placement
  assert.match(
    content,
    /dragMomentum={false}/,
    'dragMomentum must be false to ensure precise placement where user drops'
  )

  // Check 5: Dedicated GripVertical handle affordance is provided
  assert.match(
    content,
    /<GripVertical\s+className="size-4 shrink-0"\s*\/>/,
    'Must provide a GripVertical visual handle affordance for discoverable dragging'
  )

  // Check 6: Double-click reset functionality exists to snap controls back to center
  assert.match(
    content,
    /onDoubleClick={handleResetControlsPosition}/,
    'Must provide double-click reset capability on handle/pill to easily reset position'
  )

  // Check 7: Interactive controls stop pointerDown propagation to prevent accidental drags
  assert.match(
    content,
    /data-preview-playback[\s\S]*?onPointerDown={\(e\)\s*=>\s*e\.stopPropagation\(\)}/,
    'Play/Pause button must stop pointerDown propagation to prevent accidental drag during playback toggle'
  )

  // Check 8: Visibility while dragging is maintained even if pointer leaves hover zone
  assert.match(
    content,
    /isDraggingControls\s*\|\|\s*isControlsHovered[\s\S]*?pointer-events-auto opacity-100/,
    'Controls container must remain visible and interactive while dragging'
  )

  console.log('Preview canvas draggable controls architecture verified successfully')
})
