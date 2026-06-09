'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'

import { useLockBodyScroll } from '@/app/hooks/useLockBodyScroll'
import { useSwipeGesture } from '@/app/hooks/useSwipeGesture'
import { cn } from '@/lib/utils'

import { EditorHamburger } from './EditorHamburger'
import { EditorSidebarTabs, type EditorMobileTab } from './EditorSidebarTabs'
import { AssetsTab } from './tabs/AssetsTab'
import { ExportTab } from './tabs/ExportTab'
import { MusicTab } from './tabs/MusicTab'
import { SettingsTab } from './tabs/SettingsTab'
import { TimelineTab } from './tabs/TimelineTab'

interface EditorMobileSidebarProps {
  children: (controls: { hamburger: React.ReactNode; isOpen: boolean }) => React.ReactNode
  projectTitle?: string
}

const drawerTransition = {
  duration: 0.35,
  ease: [0.32, 0.72, 0, 1] as const,
}

export function EditorMobileSidebar({ children, projectTitle = 'Untitled Project' }: EditorMobileSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<EditorMobileTab>('music')
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null)
  const drawerRef = React.useRef<HTMLElement | null>(null)
  const edgeSwipeRef = React.useRef<HTMLDivElement | null>(null)
  const drawerDragRef = React.useRef<{ startX: number; startY: number; triggered: boolean } | null>(null)

  useLockBodyScroll(isOpen)

  useSwipeGesture({
    edgeOnly: true,
    enabled: !isOpen,
    onSwipeRight: () => setIsOpen(true),
    targetRef: edgeSwipeRef,
  })

  useSwipeGesture<HTMLElement>({
    enabled: isOpen,
    minDistance: 70,
    minVelocity: 0.08,
    onSwipeLeft: () => setIsOpen(false),
    targetRef: drawerRef,
  })

  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
        return
      }

      if (event.key !== 'Tab') return

      const drawer = drawerRef.current
      if (!drawer) return

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleDrawerGestureStart = React.useCallback((event: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    drawerDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      triggered: false,
    }
  }, [])

  const handleDrawerGestureMove = React.useCallback((event: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    const start = drawerDragRef.current
    if (!start || start.triggered) return

    const distanceX = event.clientX - start.startX
    const distanceY = event.clientY - start.startY

    if (distanceX < -70 && Math.abs(distanceY) <= 72) {
      start.triggered = true
      setIsOpen(false)
    }
  }, [])

  const handleDrawerGestureEnd = React.useCallback(() => {
    drawerDragRef.current = null
  }, [])

  const renderActiveTab = () => {
    if (activeTab === 'music') return <MusicTab />
    if (activeTab === 'timeline') return <TimelineTab />
    if (activeTab === 'assets') return <AssetsTab />
    if (activeTab === 'export') return <ExportTab onRequestClose={() => setIsOpen(false)} />
    return <SettingsTab />
  }

  return (
    <>
      {children({
        hamburger: <EditorHamburger isOpen={isOpen} onToggle={() => setIsOpen((current) => !current)} />,
        isOpen,
      })}

      <div ref={edgeSwipeRef} className="fixed inset-y-0 left-0 z-30 w-8 touch-pan-y md:hidden" aria-hidden="true">
        <div className="absolute left-0 top-24 h-28 w-[3px] rounded-r-full bg-gradient-to-b from-prometheus-accent-purple/0 via-prometheus-accent-purple/70 to-prometheus-accent-cyan/0 shadow-[0_0_18px_rgba(124,58,237,0.45)]" />
      </div>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[12px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={() => setIsOpen(false)}
            />

            <div className="fixed left-4 top-[calc(env(safe-area-inset-top)+10px)] z-[60] md:hidden">
              <EditorHamburger isOpen={isOpen} onToggle={() => setIsOpen(false)} />
            </div>

            <motion.aside
              id="prometheus-editor-mobile-sidebar"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Editor mobile tools"
              className="glass-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(360px,86vw)] flex-col overflow-hidden pt-[env(safe-area-inset-top)] text-prometheus-text-primary shadow-[24px_0_80px_-44px_rgba(0,0,0,0.92)] will-change-transform md:hidden"
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={drawerTransition}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.18, right: 0 }}
              dragDirectionLock
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -260) {
                  setIsOpen(false)
                }
              }}
              onPointerDownCapture={handleDrawerGestureStart}
              onPointerMoveCapture={handleDrawerGestureMove}
              onPointerUpCapture={handleDrawerGestureEnd}
              onPointerCancelCapture={handleDrawerGestureEnd}
              onMouseDownCapture={handleDrawerGestureStart}
              onMouseMoveCapture={handleDrawerGestureMove}
              onMouseUpCapture={handleDrawerGestureEnd}
            >
              <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/[0.06] shadow-[0_0_24px_rgba(255,255,255,0.08)]" aria-hidden="true" />
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close editor tools"
                className="absolute right-3 top-[calc(env(safe-area-inset-top)+12px)] z-10 flex h-9 w-9 items-center justify-center rounded-full border border-prometheus-border-glass bg-white/[0.035] text-prometheus-text-secondary transition-colors hover:bg-white/[0.07] hover:text-prometheus-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-purple/70"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <header className="border-b border-prometheus-border-subtle px-5 pb-4 pt-6">
                <Link href="/projects" className="inline-flex min-h-10 items-center gap-2 rounded-xl pr-3 text-sm text-white/58 transition-colors hover:text-white">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back to Workspace
                </Link>
                <div className="mt-4 min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/36">Current project</div>
                  <h1 className="mt-1 truncate text-lg font-semibold tracking-[-0.03em] text-white">{projectTitle}</h1>
                </div>
              </header>

              <EditorSidebarTabs activeTab={activeTab} onChange={setActiveTab} />

              <div className={cn('min-h-0 flex-1 overflow-y-auto border-t border-prometheus-border-subtle pb-[calc(env(safe-area-inset-bottom)+1rem)] scrollbar-hidden')}>
                {renderActiveTab()}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
