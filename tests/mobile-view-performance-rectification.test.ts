import test from 'node:test'
import assert from 'node:assert/strict'

// Mock environment for Node.js unit testing
class MockPointerEvent {
  pointerType: string
  clientX: number
  clientY: number
  constructor(init: { pointerType?: string; clientX?: number; clientY?: number } = {}) {
    this.pointerType = init.pointerType || 'mouse'
    this.clientX = init.clientX ?? 100
    this.clientY = init.clientY ?? 100
  }
}

const listeners: Record<string, Array<{ handler: (e: any) => void; options?: any }>> = {}

globalThis.window = {
  outerWidth: 1920,
  innerWidth: 390,
  outerHeight: 1080,
  innerHeight: 844,
  addEventListener(event: string, handler: (e: any) => void, options?: any) {
    if (!listeners[event]) listeners[event] = []
    listeners[event].push({ handler, options })
  },
  removeEventListener(event: string, handler: (e: any) => void) {
    if (!listeners[event]) return
    listeners[event] = listeners[event].filter((item) => item.handler !== handler)
  },
  setInterval: ((cb: () => void, ms: number) => 101) as any,
  clearInterval: (() => {}) as any,
  requestAnimationFrame: ((cb: () => void) => 1) as any,
  cancelAnimationFrame: (() => {}) as any,
  matchMedia: (query: string) => ({
    matches: query.includes('max-width: 768px') || query.includes('pointer: coarse'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
} as any

globalThis.document = {
  documentElement: {
    dataset: {},
    style: {
      setProperty: (_k: string, _v: string) => {},
    },
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  hidden: false,
  visibilityState: 'visible',
} as any

import {
  isDevToolsOpen,
  handleDevToolsDetected,
  initClientAntiTamper,
} from '../lib/security/client-anti-tamper'

test('DevTools detection correctly detects docked inspector without crashing on mobile emulation', () => {
  // Mobile emulation: innerWidth 390 on desktop outerWidth 1920
  window.outerWidth = 1920
  window.innerWidth = 390
  assert.equal(isDevToolsOpen(), true)

  // Standard matched mobile phone: outerWidth and innerWidth are both 390
  window.outerWidth = 390
  window.innerWidth = 390
  window.outerHeight = 844
  window.innerHeight = 844
  assert.equal(isDevToolsOpen(), false)
})

test('handleDevToolsDetected does not thrash console.clear repeatedly', () => {
  let clearCount = 0
  const originalClear = console.clear
  console.clear = () => { clearCount++ }

  // Call handleDevToolsDetected multiple times in rapid succession (simulating 2.5s timer)
  handleDevToolsDetected()
  handleDevToolsDetected()
  handleDevToolsDetected()

  // Must only call console.clear once, not on every tick
  assert.ok(clearCount <= 1, `console.clear should be called at most once, but was called ${clearCount} times`)

  console.clear = originalClear
})

test('initClientAntiTamper uses edge detection for periodic inspection checks', () => {
  let timerCallback: (() => void) | null = null
  const originalSetInterval = window.setInterval
  window.setInterval = ((cb: () => void) => {
    timerCallback = cb
    return 999 as any
  }) as any

  let clearCalls = 0
  const originalClear = console.clear
  console.clear = () => { clearCalls++ }

  window.outerWidth = 1920
  window.innerWidth = 390

  const teardown = initClientAntiTamper()

  if (timerCallback) {
    // Tick while already open - should not trigger clear again
    ;(timerCallback as () => void)()
    ;(timerCallback as () => void)()
  }

  assert.ok(clearCalls <= 1, 'Periodic interval should not thrash console.clear repeatedly while state remains unchanged')

  teardown()
  console.clear = originalClear
  window.setInterval = originalSetInterval
})
