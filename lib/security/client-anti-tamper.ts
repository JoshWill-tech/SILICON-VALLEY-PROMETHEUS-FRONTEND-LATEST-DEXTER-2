'use client'

/**
 * Prometheus Studio Client-Side Anti-Tamper & Anti-Reverse Engineering Shield
 *
 * Enforces browser-level protection against:
 * 1. F12 and DevTools shortcut inspection (Ctrl+Shift+I/J/C, Ctrl+U, F12).
 * 2. Uncontrolled console inspection / object leakage.
 * 3. Breakpoint / debugger profiling.
 * 4. Arbitrary DOM inspection context menu triggers on protected surfaces.
 */

export interface AntiTamperOptions {
  neutralizeConsole?: boolean
  blockShortcuts?: boolean
  blockContextMenu?: boolean
  detectDevTools?: boolean
  bannerMessage?: string
}

let isInitialized = false
let cleanups: Array<() => void> = []
let devToolsDetectionCount = 0
let lastDevToolsDetectedAt = 0

export function isDevToolsOpen(): boolean {
  if (typeof window === 'undefined') return false
  const widthThreshold = window.outerWidth - window.innerWidth > 160
  const heightThreshold = window.outerHeight - window.innerHeight > 160
  return widthThreshold || heightThreshold
}

export function handleDevToolsDetected() {
  if (typeof window === 'undefined') return
  const now = Date.now()
  // Throttle repeated warnings when inspection or mobile emulation keeps threshold open
  if (now - lastDevToolsDetectedAt < 10000 && devToolsDetectionCount > 0) return
  lastDevToolsDetectedAt = now
  try {
    // Only clear once on initial detection to prevent continuous console DOM thrashing
    if (devToolsDetectionCount === 0) {
      console.clear()
    }
    devToolsDetectionCount++
    console.warn(
      '%c⚠️ PROMETHEUS SECURITY SHIELD ACTIVE%c\nUnauthorized inspection, debugger attachment, or network telemetry tampering is prohibited.',
      'color:#ef4444;font-size:14px;font-weight:bold;background:#18181b;padding:6px 10px;border-radius:4px;',
      'color:#a1a1aa;font-size:12px;font-weight:normal;'
    )
  } catch {
    // Ignore console errors if completely neutralized
  }
}

export function setupKeyboardDeterrent(): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleKeyDown = (e: KeyboardEvent) => {
    // Allow ordinary typing in form fields
    const target = e.target as HTMLElement | null
    const isEditing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

    // F12 key
    if (e.key === 'F12') {
      e.preventDefault()
      e.stopPropagation()
      handleDevToolsDetected()
      return
    }

    // Ctrl+Shift+I / Cmd+Option+I (Inspect)
    // Ctrl+Shift+J / Cmd+Option+J (Console)
    // Ctrl+Shift+C / Cmd+Option+C (Element picker)
    const isCmdOrCtrl = e.ctrlKey || e.metaKey
    const isShiftOrAlt = e.shiftKey || e.altKey
    const keyLower = e.key.toLowerCase()

    if (isCmdOrCtrl && isShiftOrAlt && (keyLower === 'i' || keyLower === 'j' || keyLower === 'c')) {
      e.preventDefault()
      e.stopPropagation()
      handleDevToolsDetected()
      return
    }

    // Ctrl+U / Cmd+Option+U (View Page Source)
    if (isCmdOrCtrl && keyLower === 'u' && (!isEditing || e.altKey)) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
  }

  window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false })
  return () => {
    window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }
}

export function setupContextMenuDeterrent(): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    // Allow context menu only inside input / textarea elements for copy-paste usability
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return
    }
    e.preventDefault()
  }

  window.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false })
  return () => {
    window.removeEventListener('contextmenu', handleContextMenu, { capture: true })
  }
}

export function setupConsoleNeutralizer(bannerMessage?: string): () => void {
  if (typeof window === 'undefined') return () => {}

  const originalLog = console.log
  const originalInfo = console.info
  const originalWarn = console.warn
  const originalDebug = console.debug
  const originalTable = console.table

  const noop = () => {}

  // Only emit security warning once
  try {
    console.clear()
    originalWarn(
      `%c🛡️ PROMETHEUS SECURE ENVIRONMENT%c\n${
        bannerMessage || 'Developer tools and reverse engineering activities are strictly monitored.'
      }`,
      'color:#38bdf8;font-size:14px;font-weight:bold;background:#09090b;padding:6px 10px;border-radius:4px;border:1px solid #0284c7;',
      'color:#94a3b8;font-size:12px;'
    )
  } catch {
    // Ignore in non-standard runtimes
  }

  // Neutralize logging functions to prevent object memory inspection via F12 console
  console.log = noop
  console.info = noop
  console.debug = noop
  console.table = noop

  return () => {
    console.log = originalLog
    console.info = originalInfo
    console.warn = originalWarn
    console.debug = originalDebug
    console.table = originalTable
  }
}

export function initClientAntiTamper(options: AntiTamperOptions = {}): () => void {
  if (typeof window === 'undefined') return () => {}
  if (isInitialized) return () => {}

  // Allow explicit opt-out for local unit tests or explicit dev flag
  if (process.env.NEXT_PUBLIC_DISABLE_ANTI_TAMPER === 'true') {
    return () => {}
  }

  isInitialized = true

  const isProduction = process.env.NODE_ENV === 'production'
  const {
    neutralizeConsole = isProduction,
    blockShortcuts = true,
    blockContextMenu = isProduction,
    bannerMessage,
  } = options

  if (blockShortcuts) {
    cleanups.push(setupKeyboardDeterrent())
  }

  if (blockContextMenu) {
    cleanups.push(setupContextMenuDeterrent())
  }

  if (neutralizeConsole) {
    cleanups.push(setupConsoleNeutralizer(bannerMessage))
  }

  // Setup periodic DevTools inspection check with edge detection to avoid continuous interval thrashing
  let wasOpen = false
  const intervalId = window.setInterval(() => {
    const open = isDevToolsOpen()
    if (open && !wasOpen) {
      handleDevToolsDetected()
    }
    wasOpen = open
  }, 2500)

  cleanups.push(() => window.clearInterval(intervalId))

  return () => {
    cleanups.forEach((c) => c())
    cleanups = []
    isInitialized = false
  }
}
