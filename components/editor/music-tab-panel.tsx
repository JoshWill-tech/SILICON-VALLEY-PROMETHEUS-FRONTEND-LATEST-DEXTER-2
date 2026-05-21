'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Waves, 
  Wind,
  Trophy,
  Cpu,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Flame, 
  Check, 
  Music4, 
  Layers,
  Plus,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MusicRecommendation } from '@/lib/types'
import { TextReveal } from '@/components/editor/text-reveal'
import { LuxuryVignette } from '@/components/editor/luxury-vignette'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'

import { 
  CLOUDFLARE_MUSIC_MANIFEST, 
  resolveCloudflareTrack, 
  getCloudflareTracksByCategory, 
  type CloudflareMusicCategory 
} from '@/lib/music-library'
import { MusicRecommendationCard } from '@/components/editor/music-recommendation-card'

/**
 * EDITORIAL LANE TYPE
 */
interface EditorialLane {
  id: string
  type: 'primary' | 'alternative' | 'experimental' | 'viral'
  title: string
  subtitle: string
  philosophy: string
  mood: string
  energy: number
  bpm: string
  fit: number
  pacing: 'Aggressive' | 'Steady' | 'Flowing' | 'Staccato'
  tags: string[]
  cloudflareCategory: CloudflareMusicCategory
}

const LANES: EditorialLane[] = [
  {
    id: 'lane-1',
    type: 'primary',
    title: 'Cinematic Narrative',
    subtitle: 'The Editorial Standard',
    philosophy: 'Prioritizes emotional weight and narrative arc, ensuring the score lifts during key transitions without overwhelming speech.',
    mood: 'Epic & Grand',
    energy: 72,
    bpm: '105-115',
    fit: 98,
    pacing: 'Steady',
    tags: ['Strings', 'Hybrid Orchestral', 'Deep Bass'],
    cloudflareCategory: 'cinematic-trailer'
  },
  {
    id: 'lane-2',
    type: 'alternative',
    title: 'Lo-Fi Documentary',
    subtitle: 'Understated & Human',
    philosophy: 'Focuses on the human element. Keeps frequencies clear for voiceover while maintaining a steady, trustworthy pulse.',
    mood: 'Warm & Honest',
    energy: 34,
    bpm: '85-95',
    fit: 92,
    pacing: 'Flowing',
    tags: ['Acoustic Guitar', 'Soft Pads', 'Organic Textures'],
    cloudflareCategory: 'lofi-chill-soft'
  },
  {
    id: 'lane-3',
    type: 'experimental',
    title: 'Cyberpunk Pulse',
    subtitle: 'High-Tech Momentum',
    philosophy: 'An aggressive, high-energy lane designed for fast cuts and high-impact visual statements.',
    mood: 'Glitchy & Driven',
    energy: 94,
    bpm: '128-140',
    fit: 86,
    pacing: 'Aggressive',
    tags: ['Synthesizers', 'Glitch Beats', 'Industrial'],
    cloudflareCategory: 'tech-futuristic'
  },
  {
    id: 'lane-4',
    type: 'viral',
    title: 'Retention Driver',
    subtitle: 'TikTok / Reel Optimized',
    philosophy: 'Built for the scroll. High hook density with frequent "ear candy" to keep retention high across mobile platforms.',
    mood: 'Punchy & Modern',
    energy: 88,
    bpm: '120-130',
    fit: 95,
    pacing: 'Staccato',
    tags: ['808 Bass', 'Vocal Chops', 'Snap Percussion'],
    cloudflareCategory: 'hiphop-trap'
  },
  {
    id: 'lane-5',
    type: 'alternative',
    title: 'Timeless Orchestral',
    subtitle: 'Elegance & Prestige',
    philosophy: 'High-end orchestral arrangements for luxury, history, or prestige branding. Minimal frequencies for high vocal clarity.',
    mood: 'Prestigious',
    energy: 45,
    bpm: '70-90',
    fit: 94,
    pacing: 'Flowing',
    tags: ['Strings', 'Piano', 'Classical'],
    cloudflareCategory: 'classical-orchestra'
  },
  {
    id: 'lane-6',
    type: 'primary',
    title: 'Brand Momentum',
    subtitle: 'Corporate & Growth',
    philosophy: 'Uplifting and energetic beats designed for internal comms, product launches, and growth-oriented narratives.',
    mood: 'Determined',
    energy: 82,
    bpm: '120-128',
    fit: 96,
    pacing: 'Steady',
    tags: ['Clean Electric', 'Muted Bass', 'Percussion'],
    cloudflareCategory: 'motivational-beats'
  },
  {
    id: 'lane-7',
    type: 'alternative',
    title: 'Lifestyle Pop',
    subtitle: 'Vibrant & Human',
    philosophy: 'Organic and catchy indie-pop textures for vlogs, travel, and human-centric storytelling.',
    mood: 'Cheerful',
    energy: 68,
    bpm: '115-125',
    fit: 93,
    pacing: 'Steady',
    tags: ['Acoustic', 'Indie', 'Bright'],
    cloudflareCategory: 'pop-indie-life'
  }
]

/**
 * SUB-COMPONENTS
 */

function TypewriterReasoning({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)

  React.useEffect(() => {
    setIsTyping(true)
    let i = 0
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i))
      i++
      if (i > text.length) {
        clearInterval(timer)
        setIsTyping(false)
      }
    }, 12)
    return () => clearInterval(timer)
  }, [text])

  return (
    <div className="relative min-h-[5rem]">
      <p className="text-[16px] leading-relaxed text-white/70 italic font-medium">
        {displayedText}
        {isTyping && <motion.span 
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-1.5 h-4 ml-1 bg-[#7ff2d4] align-middle" 
        />}
      </p>
    </div>
  )
}

function GlobalAlignmentMap() {
  return (
    <div className="group relative h-28 w-full overflow-hidden rounded-[24px] border border-white/8 bg-black/40 backdrop-blur-md">
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="absolute inset-0 flex items-center px-6">
        <div className="relative h-14 w-full flex items-center gap-[2px]">
          {Array.from({ length: 140 }).map((_, i) => {
            const energy = Math.sin(i * 0.12) * 0.4 + 0.5
            const speech = Math.cos(i * 0.08) * 0.25 + 0.3
            return (
              <div key={i} className="relative flex flex-col gap-[2px] w-full">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${energy * 100}%` }}
                  transition={{ delay: i * 0.004, duration: 1 }}
                  className="w-full bg-[#7ff2d4]/40 rounded-full" 
                />
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${speech * 40}%` }}
                  transition={{ delay: i * 0.004 + 0.4, duration: 1 }}
                  className="w-full bg-white/20 rounded-full" 
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center pointer-events-none">
        {[15, 38, 62, 88].map((pos, i) => (
          <div key={i} className="absolute h-full w-px bg-white/10" style={{ left: `${pos}%` }}>
            <motion.div 
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              className="absolute -top-1 -left-1.5 size-3 rounded-full bg-[#7ff2d4]/40 blur-sm"
            />
          </div>
        ))}
      </div>

      <motion.div 
        animate={{ left: ['0%', '100%'] }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-y-0 w-px bg-white/60 z-10 shadow-[0_0_20px_white]" 
      />

      <div className="absolute bottom-3 left-6 flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-[#7ff2d4]" /> Alignment Peaks</span>
        <span className="flex items-center gap-2"><div className="size-2 rounded-full bg-white/20" /> Speech Density</span>
      </div>
    </div>
  )
}

function EditorialLaneCard({ 
  lane, 
  isActive, 
  onSelect 
}: { 
  lane: EditorialLane, 
  isActive: boolean, 
  onSelect: () => void 
}) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-[28px] border transition-all duration-500",
        isActive 
          ? "border-[#7ff2d4]/40 bg-[rgba(127,242,212,0.08)] shadow-[0_32px_64px_-24px_rgba(0,0,0,0.92),inset_0_1px_1px_rgba(255,255,255,0.12)]" 
          : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 shadow-lg"
      )}
    >
      <div className="p-6 flex gap-6 items-start">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-[20px] border border-white/10 shadow-2xl">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br transition-opacity duration-700",
            lane.type === 'primary' ? "from-indigo-600 via-purple-700 to-indigo-900" :
            lane.type === 'alternative' ? "from-amber-600 via-rose-700 to-orange-900" :
            lane.type === 'experimental' ? "from-emerald-600 via-teal-700 to-cyan-900" :
            "from-pink-600 via-purple-700 to-indigo-900",
            isActive ? "opacity-100 scale-110" : "opacity-40 group-hover:opacity-60 scale-100"
          )} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Music4 className="size-10 text-white/80" />
          </div>
          {isActive && (
            <motion.div 
              layoutId="active-check"
              className="absolute top-2 right-2 size-7 rounded-full bg-white text-black flex items-center justify-center shadow-2xl"
            >
              <Check className="size-4" strokeWidth={3} />
            </motion.div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={cn(
              "text-[10px] uppercase tracking-[0.3em] font-black",
              isActive ? "text-[#7ff2d4]" : "text-white/30"
            )}>
              {lane.type} direction
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-bold text-white/60">
                <Trophy className="size-3 text-[#7ff2d4]" />
                {lane.fit}% Match
              </div>
            </div>
          </div>
          <h4 className="text-xl font-black text-white/95 tracking-tight truncate">{lane.title}</h4>
          <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-black mb-3">{lane.subtitle}</p>
          
          <p className="text-[14px] leading-relaxed text-white/50 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
            {lane.philosophy}
          </p>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-white/5 bg-black/30 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">Pacing</span>
            <span className="text-[13px] text-white/90 font-bold tracking-tight">{lane.pacing}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">Energy</span>
            <span className="text-[13px] text-white/90 font-bold tracking-tight">{lane.energy}/100</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">BPM</span>
            <span className="text-[13px] text-white/90 font-bold tracking-tight">{lane.bpm}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {lane.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] text-white/40 font-bold">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function RefinementChip({ 
  label, 
  icon: Icon, 
  onClick,
  active,
  laneLevel
}: { 
  label: string, 
  icon: any, 
  onClick: () => void,
  active?: boolean,
  laneLevel?: boolean
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-[13px] font-black uppercase tracking-wider transition-all duration-300",
        active 
          ? "border-[#7ff2d4]/50 bg-[#7ff2d4]/15 text-[#7ff2d4] shadow-[0_0_20px_rgba(127,242,212,0.15)]"
          : laneLevel 
            ? "border-white/10 bg-white/5 text-white/40 hover:text-white/80 hover:border-white/20"
            : "border-white/20 bg-white/10 text-white hover:bg-white/20"
      )}
    >
      <Icon className="size-4" />
      {label}
    </motion.button>
  )
}

/**
 * MAIN COMPONENT
 */
export function MusicTabPanel({
  tracks,
  projectTitle,
  selectedTrackId,
  onSelectTrack,
}: {
  tracks: MusicRecommendation[]
  projectTitle: string
  selectedTrackId: string | null
  onSelectTrack: (track: MusicRecommendation) => void
}) {
  const reduceMotion = useStableReducedMotion()
  const [activeLaneId, setActiveLaneId] = React.useState('lane-1')
  const [reasoningText, setReasoningText] = React.useState(LANES[0]!.philosophy)
  const [refinements, setRefinements] = React.useState<string[]>([])
  const [previewTrackId, setPreviewTrackId] = React.useState<string | null>(null)
  const [stagedTrackIds, setStagedTrackIds] = React.useState<Set<string>>(new Set(selectedTrackId ? [selectedTrackId] : []))
  const [seenTrackIds, setSeenTrackIds] = React.useState<Set<string>>(new Set())
  const [currentSelection, setCurrentSelection] = React.useState<MusicRecommendation[]>([])
  const [isReshuffling, setIsReshuffling] = React.useState(false)

  const activeLane = LANES.find(l => l.id === activeLaneId) || LANES[0]!

  const allCategoryTracks = React.useMemo(() => {
    return getCloudflareTracksByCategory(activeLane.cloudflareCategory)
  }, [activeLane.cloudflareCategory])

  // Initialize selection when lane changes
  React.useEffect(() => {
    const initial = allCategoryTracks.slice(0, 3)
    setCurrentSelection(initial)
    setSeenTrackIds(prev => {
      const next = new Set(prev)
      initial.forEach(t => next.add(t.id))
      return next
    })
  }, [allCategoryTracks])

  const handleLaneSelect = (lane: EditorialLane) => {
    setActiveLaneId(lane.id)
    setReasoningText(`AI Analyzer: Mapping ${lane.title} strategy. Scanning Cloudflare R2 bucket for harmonic sync.`)
    
    if (tracks.length > 0) {
      onSelectTrack(tracks[0]!)
    }
  }

  const handleReshuffle = () => {
    setIsReshuffling(true)
    setTimeout(() => {
      // Pick 3 random tracks from allCategoryTracks
      const shuffled = [...allCategoryTracks].sort(() => 0.5 - Math.random())
      const nextBatch = shuffled.slice(0, 3)
      
      setCurrentSelection(nextBatch)
      setIsReshuffling(false)
      setReasoningText(`AI Reshuffle: Analyzing fresh harmonic patterns for ${activeLane.title}. Surfacing new matches from the R2 intelligence layer.`)
    }, 600)
  }

  const handlePreviewToggle = (track: MusicRecommendation) => {
    setPreviewTrackId(prev => prev === track.id ? null : track.id)
  }

  const handleToggleStage = (track: MusicRecommendation) => {
    setStagedTrackIds(prev => {
      const next = new Set(prev)
      if (next.has(track.id)) {
        next.delete(track.id)
      } else {
        next.add(track.id)
      }
      return next
    })
    onSelectTrack(track)
  }

  const toggleRefinement = (key: string) => {
    setRefinements(prev => {
      const isRemoving = prev.includes(key)
      const next = isRemoving ? prev.filter(k => k !== key) : [...prev, key]

      if (!isRemoving) {
        setReasoningText(`Modulating intelligence layer for ${key.replace('-', ' ')} priority. Re-filtering Cloudflare R2 archive to prioritize tracks that match the new ${activeLane.title} constraints.`)
      } else {
        setReasoningText(activeLane.philosophy)
      }

      return next
    })
  }

  const stagedTracksList = React.useMemo(() => {
    return CLOUDFLARE_MUSIC_MANIFEST
      .filter(t => stagedTrackIds.has(t.id))
      .map(resolveCloudflareTrack)
  }, [stagedTrackIds])

  if (!tracks.length) {
    return (
      <section className="premium-ambient-panel premium-vignette-surface flex w-full max-w-[1060px] self-center rounded-[30px] px-5 py-5 shadow-[0_28px_64px_-38px_rgba(0,0,0,0.95)]">
        <LuxuryVignette tone="music" />
        <div className="relative z-10">
          <TextReveal as="div" text="Music" className="text-[11px] uppercase tracking-[0.22em] text-white/56" />
          <TextReveal
            as="div"
            text="Soundtrack options will appear here"
            delay={0.08}
            className="editor-display-soft mt-4 text-lg text-white"
          />
          <TextReveal
            as="p"
            text="Prometheus will surface the cinematic workspace once the edit context is ready."
            delay={0.12}
            className="mt-2 max-w-[36rem] text-sm leading-6 text-white/52"
          />
        </div>
      </section>
    )
  }

  return (
    <motion.section
      key="editor-music-intelligence-workspace"
      aria-label={`${projectTitle} soundtrack selector`}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col gap-8 min-h-0 w-full max-w-[1120px] self-center overflow-y-auto overflow-x-hidden p-6 sm:p-8 custom-scrollbar"
    >
      {/* 1. CINEMATIC HEADER */}
      <motion.section 
        layout
        className="premium-ambient-panel relative overflow-hidden rounded-[40px] border border-white/8 bg-[linear-gradient(180deg,rgba(22,24,30,0.95)_0%,rgba(10,10,14,0.98)_100%)] p-8 sm:p-10 shadow-[0_48px_96px_-32px_rgba(0,0,0,0.95)]"
      >
        <LuxuryVignette tone="music" />
        
        <div className="relative z-10 grid lg:grid-cols-[1fr_360px] items-center gap-12 sm:gap-16">
          <div className="space-y-10">
            <div className="flex items-center gap-5">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#7ff2d4]/10 border border-[#7ff2d4]/20 shadow-[0_0_30px_rgba(127,242,212,0.15)]">
                <Cpu className="size-7 text-[#7ff2d4]" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[11px] uppercase tracking-[0.5em] font-black text-white/30 leading-none mb-2">AI Cinematic Engine</span>
                <h2 className="text-4xl font-black text-white tracking-tight leading-none">Soundtrack Strategy</h2>
              </div>
            </div>

            <TypewriterReasoning text={reasoningText} />

            <div className="flex flex-wrap gap-3">
              <RefinementChip 
                label="More Cinematic" 
                icon={Sparkles} 
                active={refinements.includes('cinematic')}
                onClick={() => toggleRefinement('cinematic')} 
              />
              <RefinementChip 
                label="More Emotional" 
                icon={Waves} 
                active={refinements.includes('emotional')}
                onClick={() => toggleRefinement('emotional')} 
              />
              <RefinementChip 
                label="More Energetic" 
                icon={Zap} 
                active={refinements.includes('energetic')}
                onClick={() => toggleRefinement('energetic')} 
              />
              <RefinementChip 
                label="Less Distracting" 
                icon={Wind} 
                active={refinements.includes('minimal')}
                onClick={() => toggleRefinement('minimal')} 
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-white/8 bg-white/[0.03] p-8 space-y-8 backdrop-blur-md self-stretch flex flex-col justify-center">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] font-black text-white/30">
                <span>Alignment Confidence</span>
                <span className="text-[#7ff2d4]">98%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '98%' }}
                  className="h-full bg-gradient-to-r from-[#7ff2d4] via-cyan-400 to-indigo-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20">Target Tempo</span>
                <div className="text-xl font-black text-white/90 tracking-tight">{activeLane.bpm}</div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20">Voice Safety</span>
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="size-5" />
                  <span className="text-[13px] font-black uppercase tracking-wider">Secure</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20">Current Instrumentation</span>
              <div className="flex flex-wrap gap-2">
                {activeLane.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-white/40">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 2. GLOBAL ALIGNMENT MAP */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Activity className="size-5 text-white/30" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/30">Global Alignment Map</h3>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#7ff2d4]/10 border border-[#7ff2d4]/20 px-3 py-1 text-[10px] font-black text-[#7ff2d4] uppercase tracking-widest animate-pulse">
            Live Sync Pulse
          </div>
        </div>
        <GlobalAlignmentMap />
      </section>

      {/* 3. EDITORIAL LANES & STAGED ASSETS */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LANES.map((lane) => (
              <EditorialLaneCard 
                key={lane.id} 
                lane={lane} 
                isActive={activeLaneId === lane.id}
                onSelect={() => handleLaneSelect(lane)}
              />
            ))}
          </div>

          {/* 3.5. CLOUDFLARE ROUTED TRACKS (SMART SELECTION) */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                  <Music4 className="size-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black uppercase tracking-[0.25em] text-white/80">{activeLane.title} Intelligence</h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Scanning R2 Object Storage</p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReshuffle}
                disabled={isReshuffling}
                className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#7ff2d4]/30 bg-[#7ff2d4]/5 text-[11px] font-black uppercase tracking-widest text-[#7ff2d4] hover:bg-[#7ff2d4]/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3.5", isReshuffling && "animate-spin")} />
                {isReshuffling ? 'Analyzing...' : 'Reshuffle Matches'}
              </motion.button>
            </div>

            <div className="grid grid-cols-1 gap-4 relative min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeLaneId + (currentSelection[0]?.id || '')}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {currentSelection.map((track, i) => (
                    <div key={track.id} className="rounded-[24px]">
                      <MusicRecommendationCard 
                        recommendation={track}
                        isPreviewing={previewTrackId === track.id}
                        isStaged={stagedTrackIds.has(track.id)}
                        onPreviewToggle={() => handlePreviewToggle(track)}
                        onAdd={() => handleToggleStage(track)}
                        revealDelay={i * 0.05}
                      />
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* STAGED ASSETS SIDEBAR TRAY */}
        <aside className="relative">
          <div className="sticky top-8 space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="size-4 text-emerald-400" />
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-white/50">Staged for Edit</h3>
              </div>

              <div className="space-y-4 min-h-[300px]">
                {stagedTracksList.map((track) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={track.id}
                    className="group relative flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-black/40 hover:border-white/20 transition-all"
                  >
                    <div className="size-12 shrink-0 rounded-lg overflow-hidden border border-white/10">
                      <img src={track.coverArtUrl} className="size-full object-cover" alt="" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-white truncate">{track.title}</div>
                      <div className="text-[10px] font-medium text-white/30 truncate">{track.artist}</div>
                    </div>
                    <button 
                      onClick={() => handleToggleStage(track)}
                      className="size-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                    >
                      <Plus className="size-4 rotate-45" />
                    </button>
                  </motion.div>
                ))}
                {stagedTracksList.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div className="size-12 rounded-full bg-white/[0.02] flex items-center justify-center border border-dashed border-white/10">
                      <Plus className="size-5 text-white/10" />
                    </div>
                    <p className="text-[11px] font-medium text-white/20 uppercase tracking-widest leading-relaxed">
                      Click the + icon on tracks<br />to stage them for sync.
                    </p>
                  </div>
                )}
              </div>

              {stagedTracksList.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full mt-6 py-3 rounded-2xl bg-white text-black text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Finalize Score ({stagedTracksList.length})
                </motion.button>
              )}
            </div>
          </div>
        </aside>
      </section>

      {/* 4. FLOATING REFINEMENT BAR */}
      <footer className="sticky bottom-0 z-50 self-center pb-4">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-wrap items-center justify-center gap-4 p-3 rounded-[32px] border border-white/15 bg-black/60 backdrop-blur-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
        >
          <div className="flex items-center gap-3 px-6 py-2.5 border-r border-white/10 mr-2">
            <Layers className="size-5 text-[#7ff2d4]" />
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-white/60">
              {activeLane.type} Refinement
            </span>
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-center">
            <RefinementChip 
              laneLevel 
              label="Viral Pacing" 
              icon={Flame} 
              active={refinements.includes('viral-pacing')}
              onClick={() => toggleRefinement('viral-pacing')} 
            />
            <RefinementChip 
              laneLevel 
              label="Cleaner Vocals" 
              icon={MessageSquare} 
              active={refinements.includes('vocals')}
              onClick={() => toggleRefinement('vocals')} 
            />
            <RefinementChip 
              laneLevel 
              label="Ambient Intro" 
              icon={Wind} 
              active={refinements.includes('ambient')}
              onClick={() => toggleRefinement('ambient')} 
            />
          </div>
          <div className="w-4" />
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,1)', color: '#000' }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-white/95 text-black text-[14px] font-black uppercase tracking-wider shadow-2xl transition-all"
          >
            Confirm Direction
            <ArrowRight className="size-5" />
          </motion.button>
        </motion.div>
      </footer>
    </motion.section>
  )
}
