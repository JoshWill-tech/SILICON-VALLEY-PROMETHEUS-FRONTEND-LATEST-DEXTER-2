import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { JSDOM } from 'jsdom'

let dom: JSDOM
let root: import('react-dom/client').Root | undefined
let act: typeof import('react').act

afterEach(() => {
  if (root) act(() => root?.unmount())
  dom?.window.close()
  Reflect.deleteProperty(globalThis, 'window')
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLElement')
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT')
})

test('volume range stays available and sends pointer/keyboard-adjusted values', async () => {
  dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost' })
  const browserWindow = dom.window as unknown as typeof globalThis
  Object.assign(globalThis, {
    window: browserWindow,
    document: browserWindow.document,
    HTMLElement: browserWindow.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  })
  const React = await import('react')
  act = React.act
  const { createRoot } = await import('react-dom/client')
  const { VideoVolumeControl } = await import('../app/editor/components/video-volume-control')
  const container = browserWindow.document.getElementById('root')!
  root = createRoot(container)
  const changes: number[] = []
  const interactions: string[] = []

  const mountedRoot = root
  act(() => {
    mountedRoot.render(React.createElement(VideoVolumeControl, {
      volume: 1,
      muted: false,
      onVolumeChange: (volume: number) => changes.push(volume),
      onToggleMute: () => {},
      onInteractionStart: () => interactions.push('start'),
      onInteractionEnd: () => interactions.push('end'),
    }))
  })

  const slider = container.querySelector<HTMLInputElement>('input[type="range"]')
  assert.ok(slider, 'a draggable volume slider is present')
  assert.equal(slider.getAttribute('aria-label'), 'Video volume')

  act(() => {
    const setNativeValue = Object.getOwnPropertyDescriptor(browserWindow.HTMLInputElement.prototype, 'value')?.set
    setNativeValue?.call(slider, '0.65')
    slider.dispatchEvent(new browserWindow.Event('input', { bubbles: true }))
  })

  assert.ok(changes.includes(0.65), 'range adjustment is forwarded to the player')

  slider.focus()
  slider.dispatchEvent(new browserWindow.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  assert.ok(interactions.includes('start'), 'keyboard focus suspends control auto-hide')
  slider.blur()
  assert.ok(interactions.includes('end'), 'leaving the control resumes auto-hide')
})
