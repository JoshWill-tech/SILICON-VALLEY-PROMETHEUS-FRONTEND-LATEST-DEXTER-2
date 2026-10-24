import { create } from 'zustand'

/**
 * Live Interactive Mini-Run Draft Store.
 *
 * Implements the state container for Phase 2 zero-lag interactive editing:
 * 1. Receives the `DraftManifest` synthesized in 3-5s by `/api/pipeline/plan`.
 * 2. Allows instant non-destructive modifications:
 *    - Inline word corrections (text editing)
 *    - Jarvis voice-driven transcript mutations
 *    - Word cutting / phrase toggles (jump-cut skipping)
 *    - Typography adjustments (font, color, placement)
 * 3. Exports the mutated draft manifest directly to `/api/pipeline/render`
 *    for deterministic final cloud rendering.
 */

export type DraftWord = {
  text: string
  startMs: number
  endMs: number
  startSec?: number
  endSec?: number
  cut?: boolean
  confidence?: number
}

export type DraftTypography = {
  fontFamily?: string
  fontSize?: number
  fontWeight?: number | string
  textColor?: string
  strokeColor?: string
  strokeWidth?: number
  positionY?: number
  alignment?: 'center' | 'left' | 'right'
  colorFill?: string
  shadow?: string
  glow?: string
  depth?: number
}

export type DraftTypographyLayer = {
  layerIndex: number
  layerName?: string
  role?: string
  rawText?: string
  text: string
  words?: DraftWord[]
  fontFamily: string
  accentFont?: string
  fontWeight?: number | string
  fontStyle?: string
  fontSizePx?: number
  color?: string
  casing?: string
  letterSpacingEm?: number
  lineHeight?: number
  isHero?: boolean
  fxPreset?: string
  glow?: string
  shadow?: string
  textFillColor?: string
  gradient?: string
  hasGradient?: boolean
  doubleUnderline?: boolean
}

export type DraftPlacement = {
  xPercent?: string | number
  yPercent?: string | number
  anchor?: 'center' | 'left' | 'right'
  [key: string]: unknown
}

export type DraftBrandPalette = {
  hero_color?: string
  companion_color?: string
  glow?: string
  shadow?: string
  accent_border?: string
  [key: string]: unknown
}

export type DraftChunk = {
  chunkIndex: number
  startMs: number
  endMs: number
  startSec: number
  endSec: number
  wordCount: number
  text: string
  words: DraftWord[]
  typography?: DraftTypography
  placement?: DraftPlacement
  layers?: DraftTypographyLayer[]
  brandPalette?: DraftBrandPalette
  profileName?: string
  profileId?: string
  profileFilename?: string
  pairedImage?: string
  fxPreset?: string
  behindSubject?: boolean
  [key: string]: unknown
}

export type MiniRunDraftState = {
  jobId: string | null
  status: 'idle' | 'planning' | 'planned' | 'rendering' | 'rendered' | 'error'
  error: string | null
  sourceUrl: string | null
  sourceMeta: { width?: number; height?: number; durationMs?: number } | null
  selectedWindow: { startMs: number; endMs: number; durationMs?: number } | null
  chunks: DraftChunk[]
  look: Record<string, unknown> | null
  fontManifest: Record<string, unknown> | null
  brandPalette: DraftBrandPalette | null
  orchestrationPlan: Record<string, unknown> | null
  songPlan: Record<string, unknown> | null
  silenceTimeline: Array<{ startMs: number; endMs: number }> | null
  subjectSafePlacements: Array<Record<string, unknown>> | null
  currentTimeMs: number
  activeChunkIndex: number | null
  isDirty: boolean
  rawManifest: Record<string, unknown> | null

  // Actions
  setPlan: (manifest: Record<string, unknown>, sourceUrl?: string) => void
  updateFullManifest: (manifest: Record<string, unknown>) => void
  setError: (error: string | null) => void
  setStatus: (status: MiniRunDraftState['status']) => void
  setCurrentTimeMs: (timeMs: number) => void
  updateWordText: (chunkIndex: number, wordIndex: number, newText: string) => void
  toggleWordCut: (chunkIndex: number, wordIndex: number, forceCut?: boolean) => void
  updateChunkTiming: (chunkIndex: number, startMs: number, endMs: number) => void
  updateChunkTypography: (chunkIndex: number, styling: Partial<DraftTypography>) => void
  setGlobalTypography: (
    styling: Partial<DraftTypography>,
    layersTemplate?: {
      secondary?: Partial<DraftTypographyLayer>
      hero?: Partial<DraftTypographyLayer>
    }
  ) => void
  cutPhrase: (phrase: string) => boolean
  replacePhrase: (targetPhrase: string, replacementPhrase: string) => boolean
  getDraftManifest: () => Record<string, unknown>
  reset: () => void
}

const initialState = {
  jobId: null,
  status: 'idle' as const,
  error: null,
  sourceUrl: null,
  sourceMeta: null,
  selectedWindow: null,
  chunks: [],
  look: null,
  fontManifest: null,
  brandPalette: null,
  orchestrationPlan: null,
  songPlan: null,
  silenceTimeline: null,
  subjectSafePlacements: null,
  currentTimeMs: 0,
  activeChunkIndex: null,
  isDirty: false,
  rawManifest: null,
}

export const useMiniRunDraftStore = create<MiniRunDraftState>((set, get) => ({
  ...initialState,

  setPlan: (manifest: Record<string, unknown>, sourceUrl?: string) => {
    const rawChunks = Array.isArray(manifest.chunks) ? manifest.chunks : []
    const manifestPalette: DraftBrandPalette | null =
      (manifest.brandPalette as DraftBrandPalette) ||
      (manifest.brand_palette as DraftBrandPalette) ||
      null

    const chunks: DraftChunk[] = rawChunks.map((c: any, idx: number) => {
      const words: DraftWord[] = Array.isArray(c.words)
        ? c.words.map((w: any) => ({
            text: String(w.text || w.word || ''),
            startMs: Number(w.startMs || w.start_ms || 0),
            endMs: Number(w.endMs || w.end_ms || 0),
            startSec: Number(w.startSec || w.start_sec || 0),
            endSec: Number(w.endSec || w.end_sec || 0),
            cut: Boolean(w.cut),
            confidence: typeof w.confidence === 'number' ? w.confidence : undefined,
          }))
        : []

      const rawPlacement = c.placement && typeof c.placement === 'object' ? c.placement : {}
      const placement: DraftPlacement = {
        xPercent: rawPlacement.xPercent ?? '50%',
        yPercent: rawPlacement.yPercent ?? '56%',
        anchor: rawPlacement.anchor ?? 'center',
        ...rawPlacement,
      }

      const chunkPalette: DraftBrandPalette | undefined =
        c.brandPalette || manifestPalette || undefined

      // Parse or synthesize high-fidelity multi-tier layers
      const rawLayers = Array.isArray(c.layers) ? c.layers : []
      let layers: DraftTypographyLayer[] = rawLayers.map((l: any, lIdx: number) => {
        const layerWords: DraftWord[] = Array.isArray(l.words)
          ? l.words.map((w: any) => ({
              text: String(w.text || w.word || ''),
              startMs: Number(w.start_ms || w.startMs || 0),
              endMs: Number(w.end_ms || w.endMs || 0),
              startSec: Number(w.start_sec || w.startSec || (w.start_ms || 0) / 1000),
              endSec: Number(w.end_sec || w.endSec || (w.end_ms || 0) / 1000),
              cut: Boolean(w.cut),
              confidence: typeof w.confidence === 'number' ? w.confidence : undefined,
            }))
          : []

        const isHero = Boolean(l.isHero || l.role === 'primary_focus_word')
        const heroColor = chunkPalette?.hero_color || '#F5E6C4'
        const companionColor = chunkPalette?.companion_color || '#FFFFFF'

        return {
          layerIndex: typeof l.layerIndex === 'number' ? l.layerIndex : lIdx,
          layerName: l.layerName,
          role: l.role,
          rawText: l.rawText,
          text: String(l.text || layerWords.map((w) => w.text).join(' ')),
          words: layerWords,
          fontFamily: l.fontFamily || 'Playfair Display',
          accentFont: l.accentFont,
          fontWeight: l.fontWeight || (isHero ? 800 : 600),
          fontStyle: l.fontStyle || (isHero ? 'italic' : 'normal'),
          fontSizePx: typeof l.fontSizePx === 'number' ? l.fontSizePx : isHero ? 130 : 68,
          color: l.color || l.textFillColor || (isHero ? heroColor : companionColor),
          casing: l.casing || 'normal',
          letterSpacingEm: typeof l.letterSpacingEm === 'number' ? l.letterSpacingEm : isHero ? -0.01 : 0.02,
          lineHeight: typeof l.lineHeight === 'number' ? l.lineHeight : isHero ? 1.0 : 1.2,
          isHero,
          fxPreset: l.fxPreset,
          glow: l.glow || (isHero ? chunkPalette?.glow : undefined),
          shadow: l.shadow || chunkPalette?.shadow || '0 2px 10px rgba(0, 0, 0, 0.45)',
          textFillColor: l.textFillColor,
          gradient: l.gradient,
          hasGradient: Boolean(l.hasGradient),
          doubleUnderline: Boolean(l.doubleUnderline),
        }
      })

      // Fallback synthesis: if no explicit layers are passed, structure into secondary clause + hero word
      if (layers.length === 0 && words.length > 0) {
        const heroColor = chunkPalette?.hero_color || '#F5E6C4'
        const companionColor = chunkPalette?.companion_color || '#FFFFFF'

        if (words.length > 1) {
          const secondaryWords = words.slice(0, -1)
          const heroWords = words.slice(-1)
          layers = [
            {
              layerIndex: 0,
              role: 'secondary_clause',
              rawText: secondaryWords.map((w) => w.text).join(' '),
              text: secondaryWords.map((w) => w.text).join(' '),
              words: secondaryWords,
              fontFamily: 'Playfair Display',
              accentFont: 'Bodoni Moda',
              fontWeight: 600,
              fontStyle: 'italic',
              fontSizePx: 68,
              color: companionColor,
              letterSpacingEm: 0.02,
              lineHeight: 1.2,
              isHero: false,
              shadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.25)',
            },
            {
              layerIndex: 1,
              role: 'primary_focus_word',
              rawText: heroWords.map((w) => w.text).join(' '),
              text: heroWords.map((w) => w.text).join(' '),
              words: heroWords,
              fontFamily: 'Playfair Display',
              accentFont: 'Bodoni Moda',
              fontWeight: 800,
              fontStyle: 'italic',
              fontSizePx: 130,
              color: heroColor,
              letterSpacingEm: -0.01,
              lineHeight: 1.0,
              isHero: true,
              glow: chunkPalette?.glow || '0 0 16px rgba(245, 230, 196, 0.45)',
              shadow: chunkPalette?.shadow || '0 2px 10px rgba(0, 0, 0, 0.45)',
            },
          ]
        } else {
          layers = [
            {
              layerIndex: 0,
              role: 'primary_focus_word',
              rawText: words[0].text,
              text: words[0].text,
              words: [words[0]],
              fontFamily: 'Playfair Display',
              accentFont: 'Bodoni Moda',
              fontWeight: 800,
              fontStyle: 'italic',
              fontSizePx: 124,
              color: heroColor,
              letterSpacingEm: -0.01,
              lineHeight: 1.0,
              isHero: true,
              glow: chunkPalette?.glow || '0 0 16px rgba(245, 230, 196, 0.45)',
              shadow: chunkPalette?.shadow || '0 2px 10px rgba(0, 0, 0, 0.45)',
            },
          ]
        }
      }

      return {
        chunkIndex: typeof c.chunkIndex === 'number' ? c.chunkIndex : idx,
        startMs: Number(c.startMs || c.start_ms || 0),
        endMs: Number(c.endMs || c.end_ms || 0),
        startSec: Number(c.startSec || c.start_sec || (c.startMs || 0) / 1000),
        endSec: Number(c.endSec || c.end_sec || (c.endMs || 0) / 1000),
        wordCount: typeof c.wordCount === 'number' ? c.wordCount : words.length,
        text: String(c.text || words.map((w) => w.text).join(' ')),
        words,
        typography: c.typography || undefined,
        placement,
        layers,
        brandPalette: chunkPalette,
        profileName: c.profileName,
        profileId: c.profileId,
        profileFilename: c.profileFilename,
        pairedImage: c.pairedImage,
        fxPreset: c.fxPreset,
        behindSubject: Boolean(c.behindSubject || c.behind_subject),
      }
    })

    const sourceObj = (manifest.source as any) || {}
    const selWindow = (manifest.selected_window as any) || {}

    set({
      rawManifest: manifest,
      jobId: (manifest.job_id as string) || (manifest.jobId as string) || null,
      status: 'planned',
      error: null,
      sourceUrl: sourceUrl || sourceObj.url || null,
      sourceMeta: {
        width: sourceObj.width,
        height: sourceObj.height,
        durationMs: sourceObj.duration_ms,
      },
      selectedWindow: {
        startMs: Number(selWindow.start_ms || selWindow.startMs || 0),
        endMs: Number(selWindow.end_ms || selWindow.endMs || 0),
        durationMs: Number(selWindow.duration_ms || selWindow.durationMs || 0),
      },
      chunks,
      look: (manifest.look as Record<string, unknown>) || null,
      fontManifest: (manifest.font_manifest as Record<string, unknown>) || null,
      brandPalette: manifestPalette,
      orchestrationPlan: (manifest.orchestration_plan as Record<string, unknown>) || null,
      songPlan: (manifest.song_plan as Record<string, unknown>) || null,
      silenceTimeline: Array.isArray(manifest.silence_timeline) ? manifest.silence_timeline : null,
      subjectSafePlacements: Array.isArray(manifest.subject_safe_placements) ? manifest.subject_safe_placements : null,
      isDirty: false,
      currentTimeMs: 0,
      activeChunkIndex: chunks.length > 0 ? 0 : null,
    })
  },

  updateFullManifest: (manifest: Record<string, unknown>) => {
    get().setPlan(manifest, get().sourceUrl || undefined)
    set({ isDirty: true, rawManifest: manifest })
  },

  setError: (error: string | null) => set({ error, status: error ? 'error' : get().status }),

  setStatus: (status: MiniRunDraftState['status']) => set({ status }),

  setCurrentTimeMs: (currentTimeMs: number) => {
    const { chunks } = get()
    let activeChunkIndex: number | null = null
    for (let i = 0; i < chunks.length; i++) {
      if (currentTimeMs >= chunks[i].startMs && currentTimeMs <= chunks[i].endMs) {
        activeChunkIndex = i
        break
      }
    }
    set({ currentTimeMs, activeChunkIndex })
  },

  updateWordText: (chunkIndex: number, wordIndex: number, newText: string) => {
    const chunks = [...get().chunks]
    const chunk = chunks[chunkIndex]
    if (!chunk || !chunk.words[wordIndex]) return

    const oldText = chunk.words[wordIndex].text
    const newWords = [...chunk.words]
    newWords[wordIndex] = { ...newWords[wordIndex], text: newText }
    const updatedChunkText = newWords
      .filter((w) => !w.cut)
      .map((w) => w.text)
      .join(' ')

    // Also sync words within multi-tier layers if present
    let updatedLayers = chunk.layers
    if (Array.isArray(updatedLayers) && updatedLayers.length > 0) {
      let replaced = false
      updatedLayers = updatedLayers.map((layer) => {
        if (!layer.words || replaced) return layer
        const lWords = [...layer.words]
        for (let i = 0; i < lWords.length; i++) {
          if (lWords[i].text === oldText) {
            lWords[i] = { ...lWords[i], text: newText }
            replaced = true
            break
          }
        }
        return {
          ...layer,
          words: lWords,
          text: lWords.map((w) => w.text).join(' '),
        }
      })
    }

    chunks[chunkIndex] = {
      ...chunk,
      words: newWords,
      text: updatedChunkText,
      layers: updatedLayers,
    }

    set({ chunks, isDirty: true })
  },

  toggleWordCut: (chunkIndex: number, wordIndex: number, forceCut?: boolean) => {
    const chunks = [...get().chunks]
    const chunk = chunks[chunkIndex]
    if (!chunk || !chunk.words[wordIndex]) return

    const targetWord = chunk.words[wordIndex]
    const nextCutState = forceCut !== undefined ? forceCut : !targetWord.cut

    const newWords = [...chunk.words]
    newWords[wordIndex] = { ...targetWord, cut: nextCutState }
    const updatedChunkText = newWords
      .filter((w) => !w.cut)
      .map((w) => w.text)
      .join(' ')

    // Also sync cut flag within layers
    let updatedLayers = chunk.layers
    if (Array.isArray(updatedLayers) && updatedLayers.length > 0) {
      updatedLayers = updatedLayers.map((layer) => {
        if (!layer.words) return layer
        const lWords = layer.words.map((w) => {
          if (w.startMs === targetWord.startMs && w.text === targetWord.text) {
            return { ...w, cut: nextCutState }
          }
          return w
        })
        return { ...layer, words: lWords }
      })
    }

    chunks[chunkIndex] = {
      ...chunk,
      words: newWords,
      text: updatedChunkText,
      layers: updatedLayers,
    }

    set({ chunks, isDirty: true })
  },

  updateChunkTiming: (chunkIndex: number, startMs: number, endMs: number) => {
    const chunks = [...get().chunks]
    const chunk = chunks[chunkIndex]
    if (!chunk) return

    chunks[chunkIndex] = {
      ...chunk,
      startMs,
      endMs,
      startSec: Math.round((startMs / 1000) * 1000) / 1000,
      endSec: Math.round((endMs / 1000) * 1000) / 1000,
    }

    set({ chunks, isDirty: true })
  },

  updateChunkTypography: (chunkIndex: number, styling: Partial<DraftTypography>) => {
    const chunks = [...get().chunks]
    const chunk = chunks[chunkIndex]
    if (!chunk) return

    chunks[chunkIndex] = {
      ...chunk,
      typography: {
        ...(chunk.typography || {}),
        ...styling,
      },
    }

    set({ chunks, isDirty: true })
  },

  setGlobalTypography: (
    styling: Partial<DraftTypography>,
    layersTemplate?: {
      secondary?: Partial<DraftTypographyLayer>
      hero?: Partial<DraftTypographyLayer>
    }
  ) => {
    const chunks = get().chunks.map((chunk) => {
      let updatedLayers = chunk.layers ? [...chunk.layers] : undefined
      if (layersTemplate && updatedLayers && updatedLayers.length > 0) {
        updatedLayers = updatedLayers.map((layer) => {
          if (layer.isHero && layersTemplate.hero) {
            return { ...layer, ...layersTemplate.hero }
          } else if (!layer.isHero && layersTemplate.secondary) {
            return { ...layer, ...layersTemplate.secondary }
          }
          return layer
        })
      }

      return {
        ...chunk,
        typography: {
          ...(chunk.typography || {}),
          ...styling,
        },
        layers: updatedLayers,
      }
    })
    set({ chunks, isDirty: true })
  },

  cutPhrase: (phrase: string): boolean => {
    const target = phrase.trim().toLowerCase()
    if (!target) return false

    const { chunks } = get()
    let found = false

    const updatedChunks = chunks.map((chunk) => {
      const lowerChunk = chunk.text.toLowerCase()
      if (lowerChunk.includes(target)) {
        found = true
        // Mark matching words as cut
        const newWords = chunk.words.map((w) => {
          if (target.includes(w.text.toLowerCase())) {
            return { ...w, cut: true }
          }
          return w
        })
        return {
          ...chunk,
          words: newWords,
          text: newWords.filter((w) => !w.cut).map((w) => w.text).join(' '),
        }
      }
      return chunk
    })

    if (found) {
      set({ chunks: updatedChunks, isDirty: true })
    }
    return found
  },

  replacePhrase: (targetPhrase: string, replacementPhrase: string): boolean => {
    const target = targetPhrase.trim().toLowerCase()
    if (!target) return false

    const { chunks } = get()
    let found = false

    const updatedChunks = chunks.map((chunk) => {
      const lowerChunk = chunk.text.toLowerCase()
      if (lowerChunk.includes(target)) {
        found = true
        const repWords = replacementPhrase.trim().split(/\s+/)
        // Replace matching words
        const newWords = [...chunk.words]
        let wIdx = 0
        for (let i = 0; i < newWords.length; i++) {
          if (newWords[i].text.toLowerCase() === target || target.includes(newWords[i].text.toLowerCase())) {
            if (wIdx < repWords.length) {
              newWords[i] = { ...newWords[i], text: repWords[wIdx++] }
            }
          }
        }
        return {
          ...chunk,
          words: newWords,
          text: newWords.filter((w) => !w.cut).map((w) => w.text).join(' '),
        }
      }
      return chunk
    })

    if (found) {
      set({ chunks: updatedChunks, isDirty: true })
    }
    return found
  },

  getDraftManifest: (): Record<string, unknown> => {
    const state = get()
    const base = state.rawManifest ? { ...state.rawManifest } : {}
    return {
      ...base,
      job_id: state.jobId ?? (base.job_id as string) ?? (base.jobId as string),
      jobId: state.jobId ?? (base.jobId as string) ?? (base.job_id as string),
      source: {
        url: state.sourceUrl,
        ...(state.sourceMeta || {}),
        ...(((base.source as any) || {})),
      },
      selected_window: state.selectedWindow ?? base.selected_window ?? base.selectedWindow,
      chunks: state.chunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        startMs: c.startMs,
        endMs: c.endMs,
        startSec: c.startSec,
        endSec: c.endSec,
        wordCount: c.wordCount,
        text: c.text,
        words: c.words.map((w) => ({
          text: w.text,
          startMs: w.startMs,
          endMs: w.endMs,
          startSec: w.startSec,
          endSec: w.endSec,
          cut: w.cut,
        })),
        typography: c.typography,
        placement: c.placement,
        behindSubject: c.behindSubject,
      })),
      look: state.look ?? base.look,
      font_manifest: state.fontManifest ?? base.font_manifest,
      orchestration_plan: state.orchestrationPlan ?? base.orchestration_plan,
      song_plan: state.songPlan ?? base.song_plan,
      subject_safe_placements: state.subjectSafePlacements ?? base.subject_safe_placements,
      silence_timeline: state.silenceTimeline ?? base.silence_timeline,
      stats: {
        total_chunks: state.chunks.length,
        total_words: state.chunks.reduce((acc, c) => acc + c.words.filter((w) => !w.cut).length, 0),
        is_user_edited: state.isDirty,
      },
    }
  },

  reset: () => set(initialState),
}))
