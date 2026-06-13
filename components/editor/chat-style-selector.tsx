'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GalleryHorizontalEnd, ImageIcon, Sparkles, X } from 'lucide-react'
import Image from 'next/image'

import { STYLE_TEMPLATES, type StyleTemplate } from '@/lib/styles/style-templates'
import { cn } from '@/lib/utils'

type ChatStyleSelectorProps = {
  activeStyleId?: string | null
  className?: string
  compact?: boolean
  disabled?: boolean
  onSelectStyle: (template: StyleTemplate) => void
}

const selectorSpring = {
  type: 'spring',
  stiffness: 360,
  damping: 31,
  mass: 0.82,
} as const

export function ChatStyleSelector({
  activeStyleId = null,
  className,
  compact = false,
  disabled = false,
  onSelectStyle,
}: ChatStyleSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [hoveredStyleId, setHoveredStyleId] = React.useState<string | null>(null)
  const activeTemplate = React.useMemo(
    () => STYLE_TEMPLATES.find((template) => template.id === activeStyleId) ?? null,
    [activeStyleId],
  )

  return (
    <div className={cn('relative', className)}>
      <motion.button
        type="button"
        aria-expanded={open}
        aria-label={activeTemplate ? `Animation style: ${activeTemplate.name}` : 'Choose animation style'}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'group relative grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.035] text-white/56 transition-colors hover:bg-white/[0.065] hover:text-white/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9ff6e3]/35 disabled:cursor-not-allowed disabled:opacity-40 md:h-12 md:w-12',
          activeTemplate && 'border-[#9ff6e3]/24 bg-[#9ff6e3]/[0.075] text-white',
        )}
        whileHover={disabled ? undefined : { y: -1, scale: 1.03 }}
        whileTap={disabled ? undefined : { scale: 0.95 }}
      >
        <motion.span
          aria-hidden
          className="absolute inset-[8px] rounded-full border border-white/10"
          animate={
            open
              ? { rotate: 45, scale: 1.08, borderColor: 'rgba(159,246,227,0.32)' }
              : { rotate: 0, scale: 1, borderColor: 'rgba(255,255,255,0.1)' }
          }
          transition={selectorSpring}
        />
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9ff6e3] shadow-[0_0_16px_rgba(159,246,227,0.62)]"
          animate={open ? { scale: [1, 1.45, 1], opacity: [0.62, 1, 0.72] } : { scale: 1, opacity: 0.52 }}
          transition={open ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : selectorSpring}
        />
        <GalleryHorizontalEnd className="relative size-4" />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className={cn(
              'absolute bottom-[calc(100%+0.75rem)] left-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-white/12 bg-[linear-gradient(165deg,rgba(16,16,22,0.96)_0%,rgba(5,5,8,0.98)_100%)] p-2 shadow-[0_30px_84px_-38px_rgba(0,0,0,0.98),0_0_44px_-34px_rgba(159,246,227,0.84)] backdrop-blur-2xl',
              compact && 'w-[min(20rem,calc(100vw-2rem))]',
            )}
            initial={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 6, scale: 0.98, filter: 'blur(6px)' }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/8 px-2 pb-2">
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/44">
                  Animation Style
                </div>
                <div className="mt-0.5 truncate text-sm text-white/84">
                  {activeTemplate?.name ?? 'Choose the visual behavior'}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close animation style picker"
                onClick={() => setOpen(false)}
                className="grid size-8 shrink-0 place-items-center rounded-full border border-white/8 bg-white/[0.035] text-white/48 transition-colors hover:bg-white/[0.07] hover:text-white/84"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {STYLE_TEMPLATES.map((template, index) => {
                const selected = template.id === activeStyleId
                const hovered = hoveredStyleId === template.id
                const previewSrc = template.previewImages[0]

                return (
                  <motion.button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      onSelectStyle(template)
                      setOpen(false)
                    }}
                    onMouseEnter={() => setHoveredStyleId(template.id)}
                    onMouseLeave={() => setHoveredStyleId(null)}
                    className={cn(
                      'group/style relative min-h-[8rem] overflow-hidden rounded-[16px] border bg-white/[0.025] text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#9ff6e3]/35',
                      selected
                        ? 'border-[#9ff6e3]/42 bg-[#9ff6e3]/[0.08]'
                        : 'border-white/10 hover:border-white/18 hover:bg-white/[0.045]',
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.018, duration: 0.2, ease: 'easeOut' }}
                    whileHover={{ y: -2, scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative h-16 overflow-hidden">
                      {previewSrc ? (
                        <Image
                          src={previewSrc}
                          alt=""
                          fill
                          sizes="170px"
                          className="object-cover opacity-78 transition duration-300 group-hover/style:scale-105 group-hover/style:opacity-100"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-white/[0.04] text-white/26">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.74)_100%)]" />
                      <motion.div
                        aria-hidden
                        className="absolute bottom-2 left-2 h-0.5 rounded-full bg-[#9ff6e3]"
                        animate={{ width: hovered || selected ? '72%' : '24%', opacity: hovered || selected ? 0.95 : 0.34 }}
                        transition={selectorSpring}
                      />
                    </div>
                    <div className="p-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className={cn('size-3 shrink-0', selected ? 'text-[#9ff6e3]' : 'text-white/42')} />
                        <span className="truncate text-xs font-semibold text-white/88">{template.name}</span>
                      </div>
                      <div className="mt-1 line-clamp-2 text-[10.5px] leading-4 text-white/44">
                        {template.description}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
