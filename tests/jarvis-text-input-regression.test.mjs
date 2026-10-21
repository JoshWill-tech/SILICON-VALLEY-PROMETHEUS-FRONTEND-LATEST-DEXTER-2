import assert from 'node:assert/strict'
import { test } from 'node:test'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM } from 'jsdom'

test('expanded Jarvis keeps typed input available after connection failure', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true })
  const previous = new Map()
  const install = (key, value) => {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  }
  install('window', dom.window)
  install('document', dom.window.document)
  install('navigator', dom.window.navigator)
  install('Element', dom.window.Element)
  install('HTMLElement', dom.window.HTMLElement)
  install('SVGElement', dom.window.SVGElement)
  install('IS_REACT_ACT_ENVIRONMENT', true)
  install('requestAnimationFrame', (callback) => setTimeout(() => callback(performance.now()), 0))
  install('cancelAnimationFrame', clearTimeout)
  let rejectSession
  install('fetch', () => new Promise((_, reject) => { rejectSession = reject }))
  dom.window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })

  const { JarvisTopNavFilament } = await import('../components/navigation/jarvis-top-nav-filament.tsx')
  const host = dom.window.document.getElementById('root')
  const root = createRoot(host)
  try {
    await act(() => root.render(React.createElement(JarvisTopNavFilament)))
    await act(async () => {
      host.querySelector('[aria-label="Jarvis Voice Neural Filament"]').click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    const input = host.querySelector('[aria-label="Type an instruction to Jarvis"]')
    assert.ok(input, 'The expanded panel should expose typed input while the voice session connects')
    await act(() => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, 'Convert this virtual journey into a finished video')
      const reactPropsKey = Object.keys(input).find((key) => key.startsWith('__reactProps$'))
      input[reactPropsKey].onChange({ target: input })
    })
    await act(() => host.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))
    assert.equal(input.value, '', 'Submitting should clear the composer after accepting the instruction')
    assert.match(host.textContent, /Convert this virtual journey into a finished video/, 'The pending instruction should remain visible in the conversation')
    assert.match(host.textContent, /Your message will be sent when the live session is ready/, 'Jarvis should explain that the message is queued')
    await act(async () => {
      rejectSession(new Error('Simulated voice session connection failure'))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    assert.match(host.textContent, /Voice could not connect/, 'The reproduction must reach the disconnected error state')
    assert.ok(host.querySelector('[aria-label="Type an instruction to Jarvis"]'), 'Expanded Jarvis should keep the typed input available when voice connection fails')
  } finally {
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})
