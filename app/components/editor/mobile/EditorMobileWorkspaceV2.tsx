'use client'

import { Copy, X } from 'lucide-react'
import { toast } from 'sonner'

import { EditorMobileSidebar } from './EditorMobileSidebar'

interface EditorMobileWorkspaceV2Props {
  children: React.ReactNode
  projectTitle?: string
}

export function EditorMobileWorkspaceV2({ children, projectTitle }: EditorMobileWorkspaceV2Props) {
  const copyDesktopLink = async () => {
    if (typeof window === 'undefined') return
    await navigator.clipboard?.writeText(window.location.href)
    toast.success('Editor link copied')
  }

  return (
    <EditorMobileSidebar projectTitle={projectTitle}>
      {({ hamburger }) => (
        <div className="relative flex h-full w-full flex-col overflow-hidden md:hidden">
          <header className="glass-panel z-20 flex h-14 shrink-0 items-center justify-between rounded-none border-x-0 border-t-0 border-b border-border-subtle px-4">
            <div className="flex min-w-0 items-center gap-3">
              {hamburger}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">Editor</div>
                <div className="truncate text-[11px] text-white/42">{projectTitle ?? 'Untitled Project'}</div>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/42">
              Mobile
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

          <div className="fixed bottom-4 left-4 right-4 z-30 rounded-2xl border border-white/10 bg-[#111116]/[0.92] p-3 shadow-[0_28px_80px_-46px_rgba(0,0,0,0.96)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="max-w-[13rem] text-xs leading-5 text-white/72">
                Complex motion editing works better on desktop. Copy link to continue seamlessly.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyDesktopLink()}
                  className="flex min-h-9 items-center gap-2 rounded-xl border border-prometheus-accent-purple/25 bg-prometheus-accent-purple/12 px-3 text-xs font-semibold text-white"
                >
                  <Copy className="size-3.5" />
                  Copy
                </button>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white/38 hover:bg-white/[0.05] hover:text-white" aria-label="Dismiss desktop handoff banner">
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </EditorMobileSidebar>
  )
}
