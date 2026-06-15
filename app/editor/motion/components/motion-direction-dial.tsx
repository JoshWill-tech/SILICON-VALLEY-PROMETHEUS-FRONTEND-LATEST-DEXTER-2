'use client'

import * as React from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ImageIcon, Search, Sparkles, Upload, Wand2, X } from 'lucide-react'

import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { cn } from '@/lib/utils'

export const inertialBudgetStops = [
  { label: '$40M', detail: 'Lean', value: 40, detent: 0 },
  { label: '$80M', detail: 'Studio', value: 80, detent: 16 },
  { label: '$90M', detail: 'Texture', value: 90, detent: 28 },
  { label: '$100M', detail: 'Hero', value: 100, detent: 40 },
  { label: '$150M', detail: 'Scale', value: 150, detent: 64 },
  { label: '$200M', detail: 'Epic', value: 200, detent: 82 },
  { label: '$250M', detail: 'Mythic', value: 250, detent: 100 },
] as const

export const magneticDetents = inertialBudgetStops.map((stop) => stop.detent)

const directionTabs = ['Genre', 'Budget in millions', 'Era', 'Archetype', 'Identity', 'Look', 'Details'] as const

const probeAssetSuggestions = [
  'glass interface closeups',
  'orbital particle references',
  'volumetric slate vignette',
  'macro lens detents',
  'refractive gel capsules',
] as const

type ReferenceImage = {
  id: string
  name: string
  url: string
}

export function MotionDirectionDial() {
  const reduceMotion = useStableReducedMotion()
  const referenceImageInputRef = React.useRef<HTMLInputElement | null>(null)
  const objectUrlsRef = React.useRef<string[]>([])
  const [activeTab, setActiveTab] = React.useState<(typeof directionTabs)[number]>('Budget in millions')
  const [activeBudgetIndex, setActiveBudgetIndex] = React.useState(3)
  const [referenceImages, setReferenceImages] = React.useState<ReferenceImage[]>([])
  const [assetProbeQuery, setAssetProbeQuery] = React.useState('volumetric liquid glass product film')
  const [probeResults, setProbeResults] = React.useState<string[]>([
    'Map uploaded references into visual DNA',
    'Probe matching textures before generation',
    'Hold camera mood and lighting constraints',
  ])

  const activeBudget = inertialBudgetStops[activeBudgetIndex] ?? inertialBudgetStops[3]

  React.useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [])

  const moveBudget = React.useCallback((direction: number) => {
    setActiveBudgetIndex((current) => Math.max(0, Math.min(inertialBudgetStops.length - 1, current + direction)))
  }, [])

  const handleDialDragEnd = React.useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 18) return
    moveBudget(info.offset.x < 0 ? 1 : -1)
  }, [moveBudget])

  const handleReferenceUpload = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'))
    if (!files.length) return

    const nextImages = files.slice(0, 5).map((file) => {
      const url = URL.createObjectURL(file)
      objectUrlsRef.current.push(url)
      return {
        id: `${file.name}-${file.lastModified}-${url}`,
        name: file.name,
        url,
      }
    })

    setReferenceImages((current) => [...current, ...nextImages].slice(-6))
    event.target.value = ''
  }, [])

  const removeReferenceImage = React.useCallback((image: ReferenceImage) => {
    URL.revokeObjectURL(image.url)
    objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== image.url)
    setReferenceImages((current) => current.filter((item) => item.id !== image.id))
  }, [])

  const runAssetProbe = React.useCallback(() => {
    const normalized = assetProbeQuery.trim() || 'liquid glass motion references'
    setProbeResults([
      `Probe: ${normalized}`,
      `Budget detent: ${activeBudget.label} ${activeBudget.detail}`,
      `${referenceImages.length || 'No'} image references attached`,
    ])
  }, [activeBudget.detail, activeBudget.label, assetProbeQuery, referenceImages.length])

  return (
    <motion.section
      data-motion-direction-dial
      aria-label="Motion direction dial"
      className="absolute bottom-4 left-[4.75rem] right-4 z-20 overflow-hidden rounded-[30px] border border-white/10 bg-[#0c0f12]/86 p-4 text-white shadow-[0_32px_120px_-62px_rgba(0,0,0,0.98)] backdrop-blur-2xl"
      initial={reduceMotion ? false : { opacity: 0, y: 24, filter: 'blur(12px)' }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(108,152,182,0.26)_0%,rgba(58,85,105,0.12)_28%,rgba(0,0,0,0)_65%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0)_38%),radial-gradient(circle_at_82%_92%,rgba(219,255,66,0.16),transparent_24%)]" aria-hidden="true" />

      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(320px,0.42fr)]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <LetterRevealText
                text="Motion Direction Console"
                className="text-sm font-semibold tracking-[0.16em] text-white/86"
                reduceMotion={reduceMotion}
              />
              <LetterRevealText
                text="An inertial virtualized dial with logarithmic step increments and magnetic detents, paired with an asynchronous zero-gravity orbital particle canvas floating over a volumetric atmospheric vignette."
                className="mt-1 max-w-3xl text-[11px] leading-5 text-white/42"
                delay={0.018}
                reduceMotion={reduceMotion}
              />
            </div>
            <motion.button
              type="button"
              onClick={runAssetProbe}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#dfff35]/35 bg-[#dfff35] px-4 text-xs font-semibold text-black shadow-[0_14px_40px_-26px_rgba(223,255,53,0.95)] transition-transform hover:-translate-y-0.5"
            >
              Generate
              <Sparkles className="size-3.5" />
            </motion.button>
          </div>

          <div className="premium-scroll-hide mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            {directionTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative min-h-9 shrink-0 rounded-full px-4 text-[11px] font-semibold text-white/42 transition-[background-color,color,transform] hover:text-white/74 active:scale-[0.98]',
                  activeTab === tab && 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
                )}
              >
                {activeTab === tab ? (
                  <motion.span
                    layoutId="motion-direction-tab-gel"
                    className="absolute inset-0 rounded-full border border-white/14 bg-white/[0.04]"
                    transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.8 }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-[22px] border border-white/6 bg-black/18 px-4 py-3">
            <div className="text-center">
              <LetterRevealText
                text="What's your production budget?"
                className="text-[10px] font-medium text-white/32"
                reduceMotion={reduceMotion}
              />
            </div>

            <div className="relative mt-4 h-24 overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.004))]">
              <div className="pointer-events-none absolute inset-x-5 top-5 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
              <div className="pointer-events-none absolute left-1/2 top-3 h-14 w-px -translate-x-1/2 bg-[#dfff35] shadow-[0_0_18px_rgba(223,255,53,0.75)]" />

              <motion.div
                drag="x"
                dragListener={!reduceMotion}
                dragConstraints={{ left: -38, right: 38 }}
                dragElastic={0.12}
                dragMomentum={!reduceMotion}
                onDragEnd={handleDialDragEnd}
                className="absolute inset-x-0 top-0 flex h-full items-end justify-between px-5 pb-3"
              >
                {inertialBudgetStops.map((stop, index) => {
                  const distance = Math.abs(index - activeBudgetIndex)
                  const active = index === activeBudgetIndex
                  return (
                    <button
                      key={stop.label}
                      type="button"
                      onClick={() => setActiveBudgetIndex(index)}
                      className="group relative grid min-w-[3.5rem] place-items-center pb-2 text-center"
                    >
                      <span className="absolute bottom-14 h-5 w-px rounded-full bg-white/10 group-hover:bg-white/22" />
                      {active ? (
                        <motion.span
                          layoutId="motion-direction-dial-detent"
                          className="absolute bottom-[3.15rem] h-2 w-2 rounded-full bg-[#dfff35] shadow-[0_0_18px_rgba(223,255,53,0.95)]"
                          transition={{ type: 'spring', stiffness: 310, damping: 23 }}
                        />
                      ) : null}
                      <span
                        className={cn(
                          'relative z-10 transition-[opacity,transform,color,font-weight] duration-200',
                          active ? 'text-lg font-semibold text-white opacity-100' : 'text-sm font-semibold text-white/24',
                        )}
                        style={{
                          opacity: active ? 1 : Math.max(0.18, 0.48 - distance * 0.12),
                          transform: `scale(${active ? 1.18 : Math.max(0.82, 1 - distance * 0.05)})`,
                        }}
                      >
                        {stop.label}
                      </span>
                    </button>
                  )
                })}
              </motion.div>
            </div>
          </div>
        </div>

        <aside className="relative min-h-[17rem] overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.035] p-3">
          <OrbitalReferenceCanvas referenceImages={referenceImages} reduceMotion={reduceMotion} />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <LetterRevealText
              text="Reference Probe"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62"
              reduceMotion={reduceMotion}
            />
            <button
              type="button"
              onClick={() => referenceImageInputRef.current?.click()}
              className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 text-[11px] font-medium text-white/72 transition-colors hover:bg-white/[0.085] hover:text-white"
            >
              <Upload className="size-3.5" />
              Add image
            </button>
            <input
              ref={referenceImageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleReferenceUpload}
            />
          </div>

          <div className="relative z-10 mt-28 grid gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
              <input
                value={assetProbeQuery}
                onChange={(event) => setAssetProbeQuery(event.target.value)}
                placeholder="Search or probe assets"
                className="h-9 w-full rounded-full border border-white/10 bg-black/28 pl-9 pr-20 text-xs text-white/86 outline-none transition-colors placeholder:text-white/28 focus:border-[#dfff35]/34"
              />
              <button
                type="button"
                onClick={runAssetProbe}
                className="absolute right-1 top-1 h-7 rounded-full bg-white px-3 text-[11px] font-semibold text-black"
              >
                Probe
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {probeAssetSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setAssetProbeQuery(suggestion)}
                  className="rounded-full border border-white/8 bg-white/[0.035] px-2.5 py-1 text-[10px] text-white/48 transition-colors hover:bg-white/[0.075] hover:text-white/76"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="grid gap-1.5">
              {probeResults.map((result, index) => (
                <motion.div
                  key={`${result}-${index}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18, delay: index * 0.035 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/22 px-3 py-1.5 text-[11px] text-white/58"
                >
                  <Wand2 className="size-3 text-[#dfff35]/80" />
                  {result}
                </motion.div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {referenceImages.length ? (
              <motion.div
                className="relative z-10 mt-3 flex gap-2 overflow-x-auto pb-1"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              >
                {referenceImages.map((image) => (
                  <div key={image.id} className="group relative h-14 w-20 shrink-0 overflow-hidden rounded-[12px] border border-white/10 bg-white/[0.04]">
                    <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove ${image.name}`}
                      onClick={() => removeReferenceImage(image)}
                      className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/64 text-white/72 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </aside>
      </div>
    </motion.section>
  )
}

function LetterRevealText({
  className,
  delay = 0,
  reduceMotion,
  text,
}: {
  className?: string
  delay?: number
  reduceMotion: boolean
  text: string
}) {
  if (reduceMotion) return <p className={className}>{text}</p>

  return (
    <p className={className} aria-label={text}>
      {text.split('').map((character, index) => (
        <motion.span
          key={`${character}-${index}`}
          aria-hidden="true"
          initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.18, delay: delay + index * 0.006, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {character === ' ' ? '\u00a0' : character}
        </motion.span>
      ))}
    </p>
  )
}

function OrbitalReferenceCanvas({
  reduceMotion,
  referenceImages,
}: {
  reduceMotion: boolean
  referenceImages: ReferenceImage[]
}) {
  const fallbackOrbs = [
    { kind: 'fallback' as const, label: 'Source', x: '62%', y: '42%' },
    { kind: 'fallback' as const, label: 'Mood', x: '33%', y: '28%' },
    { kind: 'fallback' as const, label: 'Space', x: '74%', y: '22%' },
  ]

  const orbs = referenceImages.length
    ? referenceImages.slice(0, 4).map((image, index) => ({
        kind: 'image' as const,
        image,
        label: image.name.replace(/\.[^/.]+$/, ''),
        x: `${28 + index * 16}%`,
        y: `${24 + (index % 2) * 18}%`,
      }))
    : fallbackOrbs

  return (
    <div className="pointer-events-none absolute inset-x-3 top-12 h-36 overflow-hidden rounded-[22px]" aria-label="zero-gravity orbital particle canvas">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(94,134,160,0.35)_0%,rgba(94,134,160,0.12)_36%,rgba(0,0,0,0)_76%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_46%,rgba(255,255,255,0.1),transparent_8%),radial-gradient(circle_at_38%_62%,rgba(223,255,53,0.1),transparent_10%)]" aria-hidden="true" />

      {orbs.map((orb, index) => (
        <motion.div
          key={orb.label}
          className="absolute grid size-14 place-items-center overflow-hidden rounded-full border border-white/14 bg-white/[0.08] text-[9px] font-semibold uppercase tracking-[0.12em] text-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_38px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl"
          style={{ left: orb.x, top: orb.y }}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
          animate={reduceMotion ? undefined : {
            opacity: 1,
            scale: 1,
            x: [0, index % 2 ? -7 : 8, 0],
            y: [0, index % 2 ? 6 : -8, 0],
          }}
          transition={reduceMotion ? undefined : {
            opacity: { duration: 0.24, delay: index * 0.05 },
            scale: { type: 'spring', stiffness: 240, damping: 20, delay: index * 0.05 },
            x: { duration: 5.8 + index * 0.7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
            y: { duration: 6.6 + index * 0.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
          }}
        >
          {orb.kind === 'image' ? (
            <img src={orb.image.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <ImageIcon className="size-5 text-white/74" />
              <span className="absolute -bottom-5 text-white/42">{orb.label}</span>
            </>
          )}
        </motion.div>
      ))}
    </div>
  )
}
