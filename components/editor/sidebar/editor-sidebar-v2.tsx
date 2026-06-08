'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Download, Folder, Music, Plus, Settings, SlidersHorizontal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarState } from '@/hooks/use-sidebar-state'
import { SidebarNavItem } from './sidebar-nav-item'
import { SidebarToggle } from './sidebar-toggle'

type EditorPanelId = 'motion' | 'music'

export interface EditorSidebarV2Props {
  activeEditorPanel?: EditorPanelId | null
  defaultOpen?: boolean
  className?: string
  onOpenMotionPanel?: () => void
  onOpenMusicCatalog?: () => void
  onStartExport?: () => void
  onNewProject?: () => void
  onSidebarChange?: (open: boolean) => void
}

function dispatchEditorEvent(name: string) {
  window.dispatchEvent(new CustomEvent(name))
}

// Focus trap helper stays local so the sidebar can be dropped into the old editor without new deps.
function getFocusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true')
}

export function EditorSidebarV2({
  activeEditorPanel = null,
  defaultOpen = true,
  className,
  onOpenMotionPanel,
  onOpenMusicCatalog,
  onStartExport,
  onNewProject,
  onSidebarChange,
}: EditorSidebarV2Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarRef, backdropRef, toggleButtonRef, isSidebarOpenRef, closeSidebar, toggleSidebar } = useSidebarState({
    defaultOpen,
    onChange: onSidebarChange,
  })

  // Route items use Next navigation. Editor-only actions use callbacks or custom events as a fallback.
  const goTo = React.useCallback(
    (href: string) => {
      router.push(href)
      closeSidebar()
    },
    [closeSidebar, router]
  )

  const handleMotion = React.useCallback(() => {
    if (onOpenMotionPanel) onOpenMotionPanel()
    else dispatchEditorEvent('prometheus:editor:open-motion-panel')
  }, [onOpenMotionPanel])

  const handleMusic = React.useCallback(() => {
    if (onOpenMusicCatalog) onOpenMusicCatalog()
    else dispatchEditorEvent('prometheus:editor:open-music-catalog')
  }, [onOpenMusicCatalog])

  const handleExport = React.useCallback(() => {
    if (onStartExport) onStartExport()
    else dispatchEditorEvent('prometheus:editor:start-export')
  }, [onStartExport])

  const handleNewProject = React.useCallback(() => {
    if (onNewProject) onNewProject()
    else dispatchEditorEvent('prometheus:editor:new-project')
  }, [onNewProject])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const sidebar = sidebarRef.current
      if (!sidebar || !isSidebarOpenRef.current) return

      if (event.key === 'Escape') {
        event.preventDefault()
        closeSidebar()
        toggleButtonRef.current?.focus()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(sidebar)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeSidebar, isSidebarOpenRef, sidebarRef, toggleButtonRef])

  return (
    <>
      <SidebarToggle buttonRef={toggleButtonRef} onToggle={toggleSidebar} defaultExpanded={defaultOpen} />

      <button
        ref={backdropRef}
        type="button"
        tabIndex={-1}
        aria-hidden={!defaultOpen}
        aria-label="Close editor sidebar"
        onClick={closeSidebar}
        className="pointer-events-none fixed inset-0 z-[55] opacity-0 outline-none transition-opacity duration-150 lg:hidden"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.48)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      />

      <aside
        id="editor-sidebar-v2"
        ref={sidebarRef}
        aria-label="Editor navigation"
        aria-hidden={!defaultOpen}
        data-sidebar-state={defaultOpen ? 'open' : 'closed'}
        className={cn(
          'fixed inset-y-0 left-0 z-[60] flex w-[85vw] max-w-[360px] flex-col overflow-hidden font-sans text-text-primary shadow-[24px_0_80px_rgba(0,0,0,0.45)] md:w-[280px] lg:w-[280px]',
          'will-change-transform transition-[transform] duration-[200ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
          defaultOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
        style={{
          backgroundColor: 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex min-h-14 items-center gap-3 border-b border-white/[0.06] pl-16 pr-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Prometheus</p>
            <p className="truncate text-sm font-semibold text-white">Editor</p>
          </div>
          <button
            type="button"
            role="button"
            aria-label="Create new project"
            onClick={handleNewProject}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 outline-none transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Editor sidebar"
          className="min-h-0 flex-1 overflow-y-auto py-3 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <div className="space-y-1 px-2">
            <SidebarNavItem
              label="Projects"
              icon={Folder}
              active={pathname?.startsWith('/projects')}
              onSelect={() => goTo('/projects')}
              ariaLabel="Open projects dashboard"
            />
            <SidebarNavItem
              label="Studio"
              icon={SlidersHorizontal}
              active={pathname?.startsWith('/studio')}
              onSelect={() => goTo('/studio')}
              ariaLabel="Open studio"
            />
          </div>

          <div className="my-3 border-t border-white/[0.06]" />

          <div className="space-y-1 px-2">
            <SidebarNavItem
              label="Motion"
              icon={Sparkles}
              active={activeEditorPanel === 'motion'}
              onSelect={handleMotion}
              ariaLabel="Open Motion panel"
            />
            <SidebarNavItem
              label="Music"
              icon={Music}
              active={activeEditorPanel === 'music'}
              onSelect={handleMusic}
              ariaLabel="Open Music catalog"
            />
            <SidebarNavItem
              label="Export"
              icon={Download}
              onSelect={handleExport}
              ariaLabel="Start export workflow"
            />
          </div>
        </nav>

        <div className="border-t border-white/[0.06] p-2">
          <SidebarNavItem
            label="Settings"
            icon={Settings}
            active={pathname?.startsWith('/settings')}
            onSelect={() => goTo('/settings')}
            ariaLabel="Open settings"
          />
        </div>
      </aside>
    </>
  )
}
