'use client'

import * as React from 'react'

export const EDITOR_SIDEBAR_PREFERENCE_KEY = 'prometheus_editor_sidebar_open'

export interface UseSidebarStateOptions {
  defaultOpen?: boolean
  storageKey?: string
  collapsedWidth?: 72
  expandedWidth?: 280
  onChange?: (open: boolean) => void
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function useSidebarState({
  defaultOpen = true,
  storageKey = EDITOR_SIDEBAR_PREFERENCE_KEY,
  collapsedWidth = 72,
  expandedWidth = 280,
  onChange,
}: UseSidebarStateOptions = {}) {
  // These refs are the performance contract: sidebar open/close is DOM mutation, not render churn.
  const sidebarRef = React.useRef<HTMLElement | null>(null)
  const backdropRef = React.useRef<HTMLButtonElement | null>(null)
  const toggleButtonRef = React.useRef<HTMLButtonElement | null>(null)
  const isSidebarOpenRef = React.useRef(defaultOpen)
  const touchStartXRef = React.useRef<number | null>(null)

  const setBodyScrollLock = React.useCallback((locked: boolean) => {
    if (typeof document === 'undefined') return
    const shouldLock = locked && typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
    document.documentElement.style.overflow = shouldLock ? 'hidden' : ''
    document.body.style.overflow = shouldLock ? 'hidden' : ''
  }, [])

  const applySidebarState = React.useCallback(
    (open: boolean, persist = true) => {
      isSidebarOpenRef.current = open

      // GPU transform classes are flipped imperatively for an instant toggle path.
      const sidebar = sidebarRef.current
      if (sidebar) {
        const overlayMode = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
        const compactDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px) and (max-width: 1279px)').matches
        const visualOpen = open && !compactDesktop
        sidebar.classList.toggle('translate-x-0', open)
        sidebar.classList.toggle('max-lg:-translate-x-full', !open)
        sidebar.classList.remove('-translate-x-full')
        sidebar.classList.toggle('w-[280px]', visualOpen)
        sidebar.classList.toggle('w-[72px]', !visualOpen)
        sidebar.classList.toggle('max-w-[360px]', visualOpen)
        sidebar.classList.toggle('max-w-[72px]', !visualOpen)
        sidebar.classList.toggle('max-md:w-[85vw]', open)
        sidebar.classList.toggle('max-md:max-w-[360px]', open)
        sidebar.classList.toggle('xl:w-[280px]', visualOpen)
        sidebar.classList.toggle('xl:w-[72px]', !visualOpen)
        sidebar.style.setProperty('--editor-sidebar-width', `${visualOpen ? expandedWidth : collapsedWidth}px`)
        sidebar.setAttribute('aria-hidden', String(!open && overlayMode))
        sidebar.dataset.sidebarState = visualOpen ? 'open' : 'closed'
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

      setBodyScrollLock(open)
      onChange?.(open)
    },
    [collapsedWidth, expandedWidth, onChange, setBodyScrollLock, storageKey]
  )

  const openSidebar = React.useCallback(() => applySidebarState(true), [applySidebarState])
  const closeSidebar = React.useCallback(() => applySidebarState(false), [applySidebarState])
  const toggleSidebar = React.useCallback(() => applySidebarState(!isSidebarOpenRef.current), [applySidebarState])

  React.useEffect(() => {
    const stored = canUseStorage() ? window.localStorage.getItem(storageKey) : null
    const initialOpen = stored === null ? defaultOpen : stored === 'true'
    applySidebarState(initialOpen, false)
  }, [applySidebarState, defaultOpen, storageKey])

  React.useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const handleTouchStart = (event: TouchEvent) => {
      touchStartXRef.current = event.touches[0]?.clientX ?? null
    }

    const handleTouchEnd = (event: TouchEvent) => {
      const startX = touchStartXRef.current
      touchStartXRef.current = null
      if (startX === null) return

      const endX = event.changedTouches[0]?.clientX ?? startX
      if (startX - endX > 80) closeSidebar()
    }

    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true })
    sidebar.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart)
      sidebar.removeEventListener('touchend', handleTouchEnd)
    }
  }, [closeSidebar])

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
