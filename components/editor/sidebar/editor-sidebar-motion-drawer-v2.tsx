'use client'

import * as React from 'react'
import { EditorSidebarV2, type EditorSidebarV2Props } from '@/components/editor/sidebar/editor-sidebar-v2'
import { MotionDrawer } from '@/components/editor/motion/motion-drawer'
import { useMediaQuery } from '@/hooks/use-media-query'

export interface EditorSidebarMotionDrawerV2Props extends Omit<EditorSidebarV2Props, 'onOpenMotionPanel'> {
  onOpenMotionPanel?: () => void
  onFocusDesktopMotionTab?: () => void
  motionDrawerChildren?: React.ReactNode
}

function focusDesktopMotionTab() {
  window.dispatchEvent(new CustomEvent('prometheus:editor:focus-motion-tab'))

  const candidates = [
    '[data-editor-tab="Motion"]',
    '[data-editor-tab="motion"]',
    '[data-tab="Motion"]',
    '[data-tab="motion"]',
    '[aria-label="Motion"]',
    'button[value="Motion"]',
    'button[value="motion"]',
  ]

  for (const selector of candidates) {
    const element = document.querySelector<HTMLElement>(selector)
    if (!element) continue
    element.focus()
    element.click()
    element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    return
  }
}

export function EditorSidebarMotionDrawerV2({
  onOpenMotionPanel,
  onFocusDesktopMotionTab,
  motionDrawerChildren,
  activeEditorPanel,
  ...props
}: EditorSidebarMotionDrawerV2Props) {
  const isMobileOrTablet = useMediaQuery('(max-width: 1023px)')
  const [motionDrawerOpen, setMotionDrawerOpen] = React.useState(false)

  const handleOpenMotionPanel = React.useCallback(() => {
    if (isMobileOrTablet) {
      setMotionDrawerOpen(true)
      onOpenMotionPanel?.()
      return
    }

    if (onFocusDesktopMotionTab) onFocusDesktopMotionTab()
    else focusDesktopMotionTab()
    onOpenMotionPanel?.()
  }, [isMobileOrTablet, onFocusDesktopMotionTab, onOpenMotionPanel])

  return (
    <>
      <EditorSidebarV2
        {...props}
        activeEditorPanel={motionDrawerOpen ? 'motion' : activeEditorPanel}
        onOpenMotionPanel={handleOpenMotionPanel}
      />
      <MotionDrawer
        isOpen={motionDrawerOpen}
        onClose={() => setMotionDrawerOpen(false)}
        width={isMobileOrTablet ? 'min(320px, calc(100vw - 24px))' : '380px'}
      >
        {motionDrawerChildren}
      </MotionDrawer>
    </>
  )
}
