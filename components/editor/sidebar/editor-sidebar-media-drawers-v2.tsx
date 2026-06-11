'use client'

import * as React from 'react'
import { EditorSidebarV2, type EditorSidebarV2Props } from '@/components/editor/sidebar/editor-sidebar-v2'
import { MotionDrawer } from '@/components/editor/motion/motion-drawer'
import { MusicDrawer, type MusicDrawerProps } from '@/components/editor/music/music-drawer'
import { useMediaQuery } from '@/hooks/use-media-query'

export interface EditorSidebarMediaDrawersV2Props
  extends Omit<EditorSidebarV2Props, 'onOpenMotionPanel' | 'onOpenMusicCatalog'> {
  onOpenMotionPanel?: () => void
  onOpenMusicCatalog?: () => void
  onFocusDesktopMotionTab?: () => void
  onFocusDesktopMusicTab?: () => void
  motionDrawerChildren?: React.ReactNode
  musicDrawerProps?: Omit<MusicDrawerProps, 'isOpen' | 'onClose'>
}

function focusWorkspaceTab(tabName: 'Motion' | 'Music') {
  window.dispatchEvent(new CustomEvent(`prometheus:editor:focus-${tabName.toLowerCase()}-tab`))

  const lowercase = tabName.toLowerCase()
  const candidates = [
    `[data-editor-tab="${tabName}"]`,
    `[data-editor-tab="${lowercase}"]`,
    `[data-tab="${tabName}"]`,
    `[data-tab="${lowercase}"]`,
    `[aria-label="${tabName}"]`,
    `button[value="${tabName}"]`,
    `button[value="${lowercase}"]`,
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

export function EditorSidebarMediaDrawersV2({
  onOpenMotionPanel,
  onOpenMusicCatalog,
  onFocusDesktopMotionTab,
  onFocusDesktopMusicTab,
  motionDrawerChildren,
  musicDrawerProps,
  activeEditorPanel,
  ...props
}: EditorSidebarMediaDrawersV2Props) {
  const isMobileOrTablet = useMediaQuery('(max-width: 1023px)')
  const [motionDrawerOpen, setMotionDrawerOpen] = React.useState(false)
  const [musicDrawerOpen, setMusicDrawerOpen] = React.useState(false)

  const handleOpenMotionPanel = React.useCallback(() => {
    if (isMobileOrTablet) {
      setMusicDrawerOpen(false)
      setMotionDrawerOpen(true)
      onOpenMotionPanel?.()
      return
    }

    if (onFocusDesktopMotionTab) onFocusDesktopMotionTab()
    else focusWorkspaceTab('Motion')
    onOpenMotionPanel?.()
  }, [isMobileOrTablet, onFocusDesktopMotionTab, onOpenMotionPanel])

  const handleOpenMusicCatalog = React.useCallback(() => {
    if (isMobileOrTablet) {
      setMotionDrawerOpen(false)
      setMusicDrawerOpen(true)
      onOpenMusicCatalog?.()
      return
    }

    if (onFocusDesktopMusicTab) onFocusDesktopMusicTab()
    else focusWorkspaceTab('Music')
    onOpenMusicCatalog?.()
  }, [isMobileOrTablet, onFocusDesktopMusicTab, onOpenMusicCatalog])

  return (
    <>
      <EditorSidebarV2
        {...props}
        activeEditorPanel={motionDrawerOpen ? 'motion' : musicDrawerOpen ? 'music' : activeEditorPanel}
        onOpenMotionPanel={handleOpenMotionPanel}
        onOpenMusicCatalog={handleOpenMusicCatalog}
      />

      <MotionDrawer
        isOpen={motionDrawerOpen}
        onClose={() => setMotionDrawerOpen(false)}
        width={isMobileOrTablet ? 'min(320px, calc(100vw - 24px))' : '380px'}
      >
        {motionDrawerChildren}
      </MotionDrawer>

      {musicDrawerProps ? (
        <MusicDrawer
          {...musicDrawerProps}
          isOpen={musicDrawerOpen}
          onClose={() => setMusicDrawerOpen(false)}
          width={isMobileOrTablet ? 'min(340px, calc(100vw - 24px))' : musicDrawerProps.width}
        />
      ) : null}
    </>
  )
}
