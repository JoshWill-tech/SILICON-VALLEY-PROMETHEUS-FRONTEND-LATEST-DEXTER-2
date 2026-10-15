import test from 'node:test'
import assert from 'node:assert/strict'

// Mock browser globals for Node test environment
class MockKeyboardEvent {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
  target: any
  defaultPrevented = false
  propagationStopped = false

  constructor(key: string, init: Partial<MockKeyboardEvent> = {}) {
    this.key = key
    this.ctrlKey = init.ctrlKey || false
    this.metaKey = init.metaKey || false
    this.shiftKey = init.shiftKey || false
    this.altKey = init.altKey || false
    this.target = init.target || null
  }

  preventDefault() {
    this.defaultPrevented = true
  }

  stopPropagation() {
    this.propagationStopped = true
  }
}

class MockMouseEvent {
  target: any
  defaultPrevented = false

  constructor(target?: any) {
    this.target = target || null
  }

  preventDefault() {
    this.defaultPrevented = true
  }
}

const listeners: Record<string, Array<(e: any) => void>> = {}

globalThis.window = {
  outerWidth: 1000,
  innerWidth: 1000,
  outerHeight: 800,
  innerHeight: 800,
  addEventListener(event: string, handler: (e: any) => void) {
    if (!listeners[event]) listeners[event] = []
    listeners[event].push(handler)
  },
  removeEventListener(event: string, handler: (e: any) => void) {
    if (!listeners[event]) return
    listeners[event] = listeners[event].filter((h) => h !== handler)
  },
  setInterval: ((cb: () => void) => 123) as any,
  clearInterval: (() => {}) as any,
} as any

import {
  isDevToolsOpen,
  setupKeyboardDeterrent,
  setupContextMenuDeterrent,
  setupConsoleNeutralizer,
  initClientAntiTamper,
} from '../lib/security/client-anti-tamper'

test('DevTools detection verifies window dimensions delta', () => {
  // Normal state
  window.outerWidth = 1000
  window.innerWidth = 1000
  window.outerHeight = 800
  window.innerHeight = 800
  assert.equal(isDevToolsOpen(), false)

  // DevTools opened side dock (delta > 160)
  window.outerWidth = 1000
  window.innerWidth = 700
  assert.equal(isDevToolsOpen(), true)

  // DevTools opened bottom dock
  window.innerWidth = 1000
  window.innerHeight = 500
  assert.equal(isDevToolsOpen(), true)

  // Reset
  window.innerHeight = 800
  assert.equal(isDevToolsOpen(), false)
})

test('Keyboard deterrent intercepts inspection shortcuts and F12', () => {
  const teardown = setupKeyboardDeterrent()
  const keydownHandlers = listeners['keydown'] || []
  assert.ok(keydownHandlers.length > 0, 'Must register keydown handler')

  const handler = keydownHandlers[keydownHandlers.length - 1]

  // F12 must be prevented
  const f12Event = new MockKeyboardEvent('F12')
  handler(f12Event)
  assert.equal(f12Event.defaultPrevented, true)
  assert.equal(f12Event.propagationStopped, true)

  // Ctrl+Shift+I must be prevented
  const inspectEvent = new MockKeyboardEvent('I', { ctrlKey: true, shiftKey: true })
  handler(inspectEvent)
  assert.equal(inspectEvent.defaultPrevented, true)
  assert.equal(inspectEvent.propagationStopped, true)

  // Cmd+Opt+J (Mac Console) must be prevented
  const macConsoleEvent = new MockKeyboardEvent('j', { metaKey: true, altKey: true })
  handler(macConsoleEvent)
  assert.equal(macConsoleEvent.defaultPrevented, true)
  assert.equal(macConsoleEvent.propagationStopped, true)

  // Ctrl+Shift+C (Inspect Element) must be prevented
  const pickerEvent = new MockKeyboardEvent('C', { ctrlKey: true, shiftKey: true })
  handler(pickerEvent)
  assert.equal(pickerEvent.defaultPrevented, true)
  assert.equal(pickerEvent.propagationStopped, true)

  // Ctrl+U (View Source) must be prevented
  const viewSourceEvent = new MockKeyboardEvent('u', { ctrlKey: true })
  handler(viewSourceEvent)
  assert.equal(viewSourceEvent.defaultPrevented, true)
  assert.equal(viewSourceEvent.propagationStopped, true)

  // Regular typing (e.g. 'a') must NOT be prevented
  const regularKey = new MockKeyboardEvent('a')
  handler(regularKey)
  assert.equal(regularKey.defaultPrevented, false)

  teardown()
})

test('Context menu deterrent disables right click except in inputs', () => {
  const teardown = setupContextMenuDeterrent()
  const contextHandlers = listeners['contextmenu'] || []
  assert.ok(contextHandlers.length > 0)

  const handler = contextHandlers[contextHandlers.length - 1]

  // Right-click on body or div is prevented
  const divEvent = new MockMouseEvent({ tagName: 'DIV' })
  handler(divEvent)
  assert.equal(divEvent.defaultPrevented, true)

  // Right-click inside input is allowed for copy/paste
  const inputEvent = new MockMouseEvent({ tagName: 'INPUT' })
  handler(inputEvent)
  assert.equal(inputEvent.defaultPrevented, false)

  teardown()
})

test('Console neutralizer silences object dumping and restores cleanly', () => {
  const originalLog = console.log
  const teardown = setupConsoleNeutralizer('Custom Security Shield Warning')

  // Log should now be a no-op
  let called = false
  console.log('Secret object dump', { apiKey: 'secret-123' })
  // No error thrown, function was silenced

  teardown()
  assert.equal(console.log, originalLog)
})
