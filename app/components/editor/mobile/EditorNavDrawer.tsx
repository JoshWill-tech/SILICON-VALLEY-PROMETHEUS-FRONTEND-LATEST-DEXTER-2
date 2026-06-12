'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, BarChart3, Clock3, Folder, GitBranch, MessageSquare, Music, Settings, X, Zap } from 'lucide-react'

import { HamburgerButton } from '@/app/components/mobile/HamburgerButton'
import { useLockBodyScroll } from '@/app/hooks/useLockBodyScroll'
import { useSwipeGesture } from '@/app/hooks/useSwipeGesture'

import { EditorNavItem } from './EditorNavItem'
import type { EditorSettingsPanelKey } from './EditorSettingsSubmenu'

export type EditorNavKey = 'projects' | 'motion' | 'music' | 'analytics' | 'timeline' | 'chat' | 'versions' | 'status' | 'settings'
export type EditorToolKey = Exclude<EditorNavKey, 'projects' | 'settings'>

interface EditorNavDrawerProps {
  activeItem?: EditorNavKey
  children: (controls: { hamburger: React.ReactNode; isOpen: boolean }) => React.ReactNode
  onOpenSettingsPanel: (panel: EditorSettingsPanelKey) => void
  onSelectTool?: (tool: Exclude<EditorNavKey, 'projects' | 'settings'>) => void
}

const drawerTransition = {
  duration: 0.35,
  ease: [0.32, 0.72, 0, 1] as const,
}

const navItems = [
  { key: 'projects', label: 'Projects', icon: Folder },
  { key: 'motion', label: 'Motion Brain', icon: Zap },
  { key: 'music', label: 'Music', icon: Music },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'timeline', label: 'Timeline', icon: Clock3 },
  { key: 'chat', label: 'Chat', icon: MessageSquare },
  { key: 'versions', label: 'Versions', icon: GitBranch },
  { key: 'status', label: 'Status', icon: Activity },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const

export function EditorNavDrawer({
  activeItem = 'motion',
  children,
  onOpenSettingsPanel,
  onSelectTool,
}: EditorNavDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null)
  const drawerRef = React.useRef<HTMLElement | null>(null)
  const edgeSwipeRef = React.useRef<HTMLDivElement | null>(null)
  const drawerDragRef = React.useRef<{ startX: number; startY: number; triggered: boolean } | null>(null)
  const router = useRouter()

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

  const handleSelect = (key: EditorNavKey) => {
    if (key === 'settings') {
      setIsOpen(false)
      onOpenSettingsPanel('appearance')
      return
    }

    setIsOpen(false)

    if (key === 'projects') {
      router.push('/projects')
      return
    }

    if (key === 'motion') {
      router.push('/editor/motion')
      return
    }

    onSelectTool?.(key)
  }

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

  return (
    <>
      {children({
        hamburger: (
          <HamburgerButton
            ariaControls="prometheus-editor-nav-drawer"
            isOpen={isOpen}
            onToggle={() => setIsOpen((current) => !current)}
          />
        ),
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
              <HamburgerButton
                ariaControls="prometheus-editor-nav-drawer"
                isOpen={isOpen}
                onToggle={() => setIsOpen(false)}
              />
            </div>

            <motion.aside
              id="prometheus-editor-nav-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Prometheus editor navigation"
              className="glass-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(360px,86vw)] flex-col overflow-hidden pt-[env(safe-area-inset-top)] text-prometheus-text-primary shadow-[24px_0_80px_-44px_rgba(0,0,0,0.92)] will-change-transform md:hidden sm:w-[320px]"
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
                aria-label="Close editor navigation"
                className="absolute right-3 top-[calc(env(safe-area-inset-top)+12px)] z-10 flex h-9 w-9 items-center justify-center rounded-full border border-prometheus-border-glass bg-white/[0.035] text-prometheus-text-secondary transition-colors hover:bg-white/[0.07] hover:text-prometheus-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prometheus-accent-purple/70"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <header className="border-b border-prometheus-border-subtle px-5 pb-5 pt-6">
                <div className="flex items-center">
                  <Image
                    src="/branding/prometheus-logo-no-bg.png"
                    alt="Prometheus"
                    width={20}
                    height={20}
                    className="size-5 object-contain"
                    priority
                  />
                  <p
                    className="ml-1 text-[10px] font-bold uppercase tracking-[0.32em] text-white/92"
                    style={{ fontFamily: 'var(--font-mono), ui-sans-serif, system-ui, sans-serif' }}
                  >
                    rometheus
                  </p>
                </div>
              </header>

              <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 scrollbar-hidden" aria-label="Prometheus editor navigation">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <div key={item.key}>
                      <EditorNavItem
                        icon={item.icon}
                        isActive={activeItem === item.key}
                        label={item.label}
                        onSelect={() => handleSelect(item.key)}
                      />
                    </div>
                  ))}
                </div>
              </nav>

            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
