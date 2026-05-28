'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'
import { WorkspaceNavBar, type WorkspaceNavItem } from '@/components/ui/anime-navbar'
import { CinematicExportCluster } from '@/components/editor/cinematic-export-cluster'
import { TextReveal } from '@/components/editor/text-reveal'
import { buildRevealVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Project, ProcessingJob, ProjectExport, HeaderNavMode } from '@/lib/types'

export interface EditorHeaderProps {
  project: Project | null
  job: ProcessingJob | null
  saveStatus: 'saved' | 'saving' | 'error'
  progressPercent: number
  isEditingTitle: boolean
  tempTitle: string
  setTempTitle: (title: string) => void
  titleInputRef: React.RefObject<HTMLInputElement | null>
  activeWorkspaceTab: HeaderNavMode
  isDeferredChromeReady: boolean
  isExporting: boolean
  isDownloading: boolean
  latestExport: ProjectExport | null
  hasSourceAsset: boolean
  headerNavItems: WorkspaceNavItem[]
  onBack: () => void
  onTitleSave: () => void
  onTitleKeyDown: (e: React.KeyboardEvent) => void
  onTitleStartEdit: () => void
  onWorkspaceTabChange: (name: string) => void
  onPrepareExport: () => void
  onDownload: () => void
}

export function EditorHeader({
  project,
  job,
  saveStatus,
  progressPercent,
  isEditingTitle,
  tempTitle,
  setTempTitle,
  titleInputRef,
  activeWorkspaceTab,
  isDeferredChromeReady,
  isExporting,
  isDownloading,
  latestExport,
  hasSourceAsset,
  headerNavItems,
  onBack,
  onTitleSave,
  onTitleKeyDown,
  onTitleStartEdit,
  onWorkspaceTabChange,
  onPrepareExport,
  onDownload,
}: EditorHeaderProps) {
  return (
    <header className="relative z-30 shrink-0 border-b border-white/8">
      <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-4 px-4 py-[clamp(0.875rem,1.8vh,1rem)] lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <motion.button
            type="button"
            onClick={onBack}
            variants={buildRevealVariants({ delay: 0.03, distance: 10, blur: 6, duration: 0.24 })}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.55 }}
            className="inline-flex items-center gap-2 text-sm text-white/72 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </motion.button>

          <motion.div
            variants={buildRevealVariants({ delay: 0.08, distance: 10, blur: 6, duration: 0.24 })}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.55 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-400/8 px-3 py-1.5 text-[11px] text-emerald-100"
          >
            <span className="size-2 rounded-full bg-emerald-300" />
            {hasSourceAsset
              ? job?.status === 'completed'
                ? 'Ready to refine'
                : 'Processing in background'
              : 'Waiting for a source video'}
          </motion.div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <motion.div
            variants={buildRevealVariants({ delay: 0.1, distance: 14, blur: 8, duration: 0.28 })}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.45 }}
            className="min-w-0"
          >
            <div className="group relative">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={onTitleSave}
                  onKeyDown={onTitleKeyDown}
                  className="editor-display w-full bg-transparent text-[1.45rem] leading-tight text-white outline-none"
                />
              ) : (
                <div
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={onTitleStartEdit}
                  title="Click to rename project"
                >
                  <TextReveal
                    as="div"
                    text={project?.title ?? 'Opening project'}
                    split="words"
                    delay={0.08}
                    className="editor-display truncate text-[1.45rem] leading-tight text-white"
                  />
                </div>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/42">
              <span
                className={cn(
                  'inline-flex items-center gap-2 transition-colors',
                  saveStatus === 'saving' ? 'text-white/60' : saveStatus === 'error' ? 'text-rose-400' : 'text-white/42',
                )}
              >
                {saveStatus === 'saving' ? (
                  <Sparkles className="size-3.5 animate-pulse" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                {saveStatus === 'saving'
                  ? 'Saving changes...'
                  : saveStatus === 'error'
                    ? 'Error saving'
                    : 'All changes saved'}
              </span>
              <span>{progressPercent}% staged</span>
              {project?.editorState?.initialPrompt && (
                <span className="italic text-neutral-500 truncate max-w-[300px]" title={project.editorState.initialPrompt}>
                  &ldquo;{project.editorState.initialPrompt}&rdquo;
                </span>
              )}
            </div>
          </motion.div>

          <motion.div
            variants={buildRevealVariants({ delay: 0.16, distance: 14, blur: 8, duration: 0.28 })}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.45 }}
            className="xl:flex-1"
          >
            <WorkspaceNavBar
              items={headerNavItems}
              defaultActive="Motion"
              activeItem={activeWorkspaceTab}
              onChange={onWorkspaceTabChange}
              className="xl:flex-1"
            />
          </motion.div>

          <motion.div
            variants={buildRevealVariants({ delay: 0.22, distance: 14, blur: 8, duration: 0.28 })}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.45 }}
          >
            {isDeferredChromeReady ? (
              <CinematicExportCluster
                onExport={onPrepareExport}
                isExporting={isExporting}
                isCompleted={latestExport?.status === 'completed'}
                onDownload={onDownload}
                isDownloading={isDownloading}
              />
            ) : (
              <div className="h-[52px] w-[220px] rounded-full border border-white/8 bg-white/[0.03]" />
            )}
          </motion.div>
        </div>
      </div>
    </header>
  )
}
