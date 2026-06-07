'use client'

import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onCloseOverlays?: () => void
  onToggleFocusMode?: () => void
  onToggleSidebar?: () => void
}

function dispatchEditorCommand(command: string) {
  window.dispatchEvent(new CustomEvent('prometheus:editor-command', { detail: { command } }))
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  )
}

export function KeyboardShortcuts({
  onCloseOverlays,
  onToggleFocusMode,
  onToggleSidebar,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return

      const commandKey = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (event.key === 'Escape') {
        event.preventDefault()
        window.dispatchEvent(new Event('prometheus:command-zone-close'))
        onCloseOverlays?.()
        return
      }

      if (!commandKey) return

      if (key === 'k') {
        event.preventDefault()
        window.dispatchEvent(new Event('prometheus:command-zone-open'))
        return
      }

      if (key === 'i') {
        event.preventDefault()
        dispatchEditorCommand('ai')
        return
      }

      if (key === 'e' && event.shiftKey) {
        event.preventDefault()
        dispatchEditorCommand('export')
        return
      }

      if (key === 'b') {
        event.preventDefault()
        onToggleSidebar?.()
        return
      }

      if (key === 'f') {
        event.preventDefault()
        onToggleFocusMode?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCloseOverlays, onToggleFocusMode, onToggleSidebar])

  return null
}
