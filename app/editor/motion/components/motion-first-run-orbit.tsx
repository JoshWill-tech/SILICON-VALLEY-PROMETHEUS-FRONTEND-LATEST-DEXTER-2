'use client'

import * as React from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { BrainCircuit, Check, Clapperboard, Sparkles, Wand2, X } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

const FIRST_RUN_STORAGE_KEY = 'prometheus.motion.first-run-orbit.v1'

const selectorTabs = ['Genre', 'Budget', 'Era', 'Archetype', 'Identity', 'Physical Appearance', 'Details', 'Outfit'] as const

const archetypeCards = [
  { label: 'Innocent', image: '/style-previews/iman-1.jpg' },
  { label: 'Everyman', image: '/style-previews/podcast-1.jpg' },
  { label: 'Hero', image: '/style-previews/reels-heat-1.webp' },
  { label: 'Caregiver', image: '/style-previews/docs-story-1.jpg' },
  { label: 'Explorer', image: '/style-previews/red-statue-1.jpg' },
  { label: 'Rebel', image: '/style-previews/reels-heat-2.webp' },
]

const orbitNodes = [
  { label: 'Source', icon: Clapperboard, x: 86, y: 28 },
  { label: 'Style', icon: Sparkles, x: 36, y: 20 },
  { label: 'Prompt', icon: Wand2, x: 56, y: 74 },
]

function playMotionSelectorTick() {
  if (typeof window === 'undefined') return
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return

  const context = new AudioContextCtor()
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(164, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(420, context.currentTime + 0.08)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.018)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.14)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.16)
  window.setTimeout(() => void context.close().catch(() => undefined), 240)
}

function MagneticSelectorButton({
  active,
  children,
  className,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 230, damping: 18, mass: 0.42 })
  const springY = useSpring(y, { stiffness: 230, damping: 18, mass: 0.42 })

  return (
    <motion.button
      type="button"
      onClick={() => {
        playMotionSelectorTick()
        onClick?.()
      }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        x.set((event.clientX - rect.left - rect.width / 2) * 0.16)
        y.set((event.clientY - rect.top - rect.height / 2) * 0.16)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
      style={{ x: springX, y: springY }}
      className={cn(
        'relative shrink-0 rounded-full border px-4 py-2 text-xs font-semibold text-white/58 transition-[border-color,background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9ff6e3]/35',
        active
          ? 'border-white/18 bg-white/[0.12] text-white shadow-[0_14px_34px_-26px_rgba(255,255,255,0.65)]'
          : 'border-transparent bg-transparent hover:bg-white/[0.055] hover:text-white/82',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}

export function MotionFirstRunOrbit() {
  const [visible, setVisible] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<(typeof selectorTabs)[number]>('Archetype')
  const [selectedArchetype, setSelectedArchetype] = React.useState(archetypeCards[2]?.label ?? 'Hero')

  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(FIRST_RUN_STORAGE_KEY)) return
      setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const closeOverlay = React.useCallback(() => {
    setVisible(false)
    try {
      window.localStorage.setItem(FIRST_RUN_STORAGE_KEY, new Date().toISOString())
    } catch {
      // Non-persistent browsers still get a dismissible overlay.
    }
  }, [])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="absolute inset-0 z-40 overflow-hidden bg-black/58 backdrop-blur-[10px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[34%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(123,190,255,0.24)_0%,rgba(123,190,255,0.1)_28%,rgba(0,0,0,0)_68%)] blur-[2px]"
          />
          <button
            type="button"
            aria-label="Dismiss motion introduction"
            onClick={closeOverlay}
            className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/58 transition-colors hover:bg-white/[0.09] hover:text-white"
          >
            <X className="size-4" />
          </button>

          <div className="relative flex h-full min-h-0 flex-col justify-end px-5 pb-5 pt-12">
            <div className="absolute inset-x-0 top-16 mx-auto h-[42vh] max-h-[25rem] min-h-[18rem] max-w-[44rem]">
              <motion.div
                className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/18 bg-white/[0.1] text-white shadow-[0_0_44px_-18px_rgba(159,246,227,0.86)] backdrop-blur-xl"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20, mass: 0.62 }}
              >
                <BrainCircuit className="size-7" />
              </motion.div>

              {orbitNodes.map((node, index) => {
                const Icon = node.icon
                return (
                  <motion.button
                    key={node.label}
                    type="button"
                    onClick={playMotionSelectorTick}
                    className="absolute grid h-14 w-14 place-items-center rounded-full border border-white/12 bg-white/[0.075] text-white/72 shadow-[0_18px_34px_-26px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-colors hover:bg-white/[0.12] hover:text-white"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    initial={{ opacity: 0, scale: 0.72, x: '-50%', y: '-50%' }}
                    animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                    transition={{ delay: 0.08 + index * 0.07, type: 'spring', stiffness: 230, damping: 21 }}
                    aria-label={`${node.label} motion node`}
                  >
                    <Icon className="size-5" />
                    <span className="absolute -bottom-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/48">
                      {node.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            <motion.div
              className="relative z-10 mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/8 bg-[#0d0d11]/88 p-4 shadow-[0_28px_80px_-46px_rgba(0,0,0,0.96)] backdrop-blur-2xl"
              initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              transition={{ delay: 0.08, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="premium-scroll-hide flex items-center gap-2 overflow-x-auto pb-3">
                {selectorTabs.map((tab) => (
                  <MagneticSelectorButton
                    key={tab}
                    active={tab === activeTab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </MagneticSelectorButton>
                ))}
              </div>

              <div className="border-t border-white/6 pt-4 text-center text-[11px] text-white/38">
                Select the archetype of your character
              </div>

              <div className="premium-scroll-hide mt-4 flex gap-3 overflow-x-auto pb-1">
                {archetypeCards.map((card, index) => {
                  const selected = selectedArchetype === card.label
                  return (
                    <motion.button
                      key={card.label}
                      type="button"
                      onClick={() => {
                        setSelectedArchetype(card.label)
                        playMotionSelectorTick()
                      }}
                      className={cn(
                        'relative h-36 w-32 shrink-0 overflow-hidden rounded-[12px] border bg-white/[0.035] text-left transition-[border-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9ff6e3]/35 sm:h-40 sm:w-40',
                        selected ? 'border-[#9ff6e3]/44' : 'border-white/10 hover:border-white/18',
                      )}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 + index * 0.035, duration: 0.24 }}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Image src={card.image} alt="" fill sizes="160px" className="object-cover opacity-88" />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.82)_100%)]" />
                      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-white">{card.label}</span>
                        {selected ? <Check className="size-4 shrink-0 text-[#9ff6e3]" /> : null}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={closeOverlay}
                  className="rounded-full border border-white/14 bg-white text-black px-5 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
                >
                  Enter Motion Brain
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
