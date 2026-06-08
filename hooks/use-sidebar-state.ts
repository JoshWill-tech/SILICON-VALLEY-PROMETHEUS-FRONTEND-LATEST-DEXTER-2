'use client'

import * as React from 'react'

export const EDITOR_SIDEBAR_PREFERENCE_KEY = 'prometheus_editor_sidebar_open'

export interface UseSidebarStateOptions {
  defaultOpen?: boolean
  storageKey?: string
  onChange?: (open: boolean) => void
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function useSidebarState({
  defaultOpen = true,
  storageKey = EDITOR_SIDEBAR_PREFERENCE_KEY,
  onChange,
}: UseSidebarStateOptions = {}) {
  // These refs are the performance contract: sidebar open/close is DOM mutation, not render churn.
  const sidebarRef = React.useRef<HTMLElement | null>(null)
  const backdropRef = React.useRef<HTMLButtonElement | null>(null)
  const toggleButtonRef = React.useRef<HTMLButtonElement | null>(null)
  const isSidebarOpenRef = React.useRef(defaultOpen)

  const applySidebarState = React.useCallback(
    (open: boolean, persist = true) => {
      isSidebarOpenRef.current = open

      // GPU transform classes are flipped imperatively for an instant toggle path.
      const sidebar = sidebarRef.current
      if (sidebar) {
        sidebar.classList.toggle('translate-x-0', open)
        sidebar.classList.toggle('-translate-x-full', !open)
        sidebar.setAttribute('aria-hidden', String(!open))
        sidebar.dataset.sidebarState = open ? 'open' : 'closed'
      }

      // The backdrop is only interactive when the drawer is open on tablet/mobile.
      const backdrop = backdropRef.current
      if (backdrop) {
        backdrop.classList.toggle('opacity-100', open)
        backdrop.classList.toggle('pointer-events-auto', open)
        backdrop.classList.toggle('opacity-0', !open)
        backdrop.classList.toggle('pointer-events-none', !open)
        backdrop.setAttribute('aria-hidden', String(!open))
      }

      // Keep aria-expanded accurate without forcing the toggle component to re-render.
      const toggle = toggleButtonRef.current
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(open))
        toggle.dataset.sidebarState = open ? 'open' : 'closed'
      }

      if (persist && canUseStorage()) {
        window.localStorage.setItem(storageKey, open ? 'true' : 'false')
      }

      onChange?.(open)
    },
    [onChange, storageKey]
  )

  const openSidebar = React.useCallback(() => applySidebarState(true), [applySidebarState])
  const closeSidebar = React.useCallback(() => applySidebarState(false), [applySidebarState])
  const toggleSidebar = React.useCallback(() => applySidebarState(!isSidebarOpenRef.current), [applySidebarState])

  React.useEffect(() => {
    const stored = canUseStorage() ? window.localStorage.getItem(storageKey) : null
    const initialOpen = stored === null ? defaultOpen : stored === 'true'
    applySidebarState(initialOpen, false)
  }, [applySidebarState, defaultOpen, storageKey])

  return {
    sidebarRef,
    backdropRef,
    toggleButtonRef,
    isSidebarOpenRef,
    applySidebarState,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  }
}
