'use client'

import * as React from 'react'

export type EditorSidebarPanel = 'music' | 'motion' | 'chat' | 'versions' | 'status'

export function useEditorSidebar(defaultPanel: EditorSidebarPanel = 'music') {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activePanel, setActivePanel] = React.useState<EditorSidebarPanel | null>(defaultPanel)

  const toggleOpen = React.useCallback(() => setIsOpen((current) => !current), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const togglePanel = React.useCallback((panel: EditorSidebarPanel) => {
    setActivePanel((current) => (current === panel ? null : panel))
  }, [])

  return {
    activePanel,
    close,
    isOpen,
    setIsOpen,
    toggleOpen,
    togglePanel,
  }
}
