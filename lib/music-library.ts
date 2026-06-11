import {
  getMusicAudioUrl,
  getMusicThumbnailUrl,
  getMusicPreviewUrl,
  type MusicCategoryFolder
} from '@/lib/music-url-resolver'
import {
  MUSIC_CATALOG,
  buildMusicPreviewUrl,
  buildVideoContextText,
  normalizeMusicPreference,
  type MusicCatalogTrack,
} from '@/lib/music-catalog'
import type {
  MusicPreference,
  MusicRecommendation,
  MusicVideoContext,
  MusicEnergy,
  MusicMood
} from '@/lib/types'

export type CloudflareMusicCategory = MusicCategoryFolder

export type CloudflareTrackDef = {
  id: string
  filename: string
  title: string
  category: CloudflareMusicCategory
  bpm?: number
  energy?: MusicEnergy
  mood?: MusicMood
  durationSec?: number
}

// Expanded manifest with more tracks per category
export const CLOUDFLARE_MUSIC_MANIFEST: CloudflareTrackDef[] = [
  // Cinematic Trailer
  { id: 'cf-cin-1', filename: 'eternal-rise', title: 'Eternal Rise', category: 'cinematic-trailer', bpm: 110, energy: 'high', mood: 'cinematic', durationSec: 120 },
  { id: 'cf-cin-2', filename: 'gotham-shadows', title: 'Gotham Shadows', category: 'cinematic-trailer', bpm: 95, energy: 'medium', mood: 'dark', durationSec: 150 },
  { id: 'cf-cin-3', filename: 'titan-legacy', title: 'Titan Legacy', category: 'cinematic-trailer', bpm: 125, energy: 'high', mood: 'cinematic', durationSec: 135 },
  { id: 'cf-cin-4', filename: 'hero-path', title: 'Hero Path', category: 'cinematic-trailer', bpm: 105, energy: 'high', mood: 'uplifting', durationSec: 145 },
  { id: 'cf-cin-5', filename: 'lost-dynasty', title: 'Lost Dynasty', category: 'cinematic-trailer', bpm: 88, energy: 'medium', mood: 'dark', durationSec: 160 },
  { id: 'cf-cin-6', filename: 'warrior-spirit', title: 'Warrior Spirit', category: 'cinematic-trailer', bpm: 135, energy: 'high', mood: 'cinematic', durationSec: 115 },

  // Lofi Chill
  { id: 'cf-lofi-1', filename: 'midnight-coffee', title: 'Midnight Coffee', category: 'lofi-chill-soft', bpm: 85, energy: 'low', mood: 'minimal', durationSec: 180 },
  { id: 'cf-lofi-2', filename: 'rainy-afternoon', title: 'Rainy Afternoon', category: 'lofi-chill-soft', bpm: 80, energy: 'low', mood: 'minimal', durationSec: 165 },
  { id: 'cf-lofi-3', filename: 'urban-breeze', title: 'Urban Breeze', category: 'lofi-chill-soft', bpm: 92, energy: 'low', mood: 'uplifting', durationSec: 200 },
  { id: 'cf-lofi-4', filename: 'sunset-vinyl', title: 'Sunset Vinyl', category: 'lofi-chill-soft', bpm: 88, energy: 'low', mood: 'minimal', durationSec: 190 },
  { id: 'cf-lofi-5', filename: 'cozy-corner', title: 'Cozy Corner', category: 'lofi-chill-soft', bpm: 75, energy: 'low', mood: 'minimal', durationSec: 210 },
  { id: 'cf-lofi-6', filename: 'dreamy-clouds', title: 'Dreamy Clouds', category: 'lofi-chill-soft', bpm: 82, energy: 'low', mood: 'minimal', durationSec: 175 },

  // Tech Futuristic
  { id: 'cf-tech-1', filename: 'neon-grid', title: 'Neon Grid', category: 'tech-futuristic', bpm: 128, energy: 'high', mood: 'cinematic', durationSec: 140 },
  { id: 'cf-tech-2', filename: 'cyber-pulse', title: 'Cyber Pulse', category: 'tech-futuristic', bpm: 135, energy: 'high', mood: 'uplifting', durationSec: 130 },
  { id: 'cf-tech-3', filename: 'data-stream', title: 'Data Stream', category: 'tech-futuristic', bpm: 124, energy: 'medium', mood: 'minimal', durationSec: 155 },
  { id: 'cf-tech-4', filename: 'silicon-valley', title: 'Silicon Valley', category: 'tech-futuristic', bpm: 118, energy: 'medium', mood: 'uplifting', durationSec: 145 },
  { id: 'cf-tech-5', filename: 'neural-link', title: 'Neural Link', category: 'tech-futuristic', bpm: 142, energy: 'high', mood: 'dark', durationSec: 125 },
  { id: 'cf-tech-6', filename: 'android-dream', title: 'Android Dream', category: 'tech-futuristic', bpm: 110, energy: 'low', mood: 'minimal', durationSec: 160 },

  // HipHop / Trap
  { id: 'cf-hip-1', filename: 'viral-bounce', title: 'Viral Bounce', category: 'hiphop-trap', bpm: 140, energy: 'high', mood: 'playful', durationSec: 110 },
  { id: 'cf-hip-2', filename: 'bass-drop', title: 'Bass Drop', category: 'hiphop-trap', bpm: 145, energy: 'high', mood: 'uplifting', durationSec: 95 },
  { id: 'cf-hip-3', filename: 'street-cred', title: 'Street Cred', category: 'hiphop-trap', bpm: 132, energy: 'high', mood: 'dark', durationSec: 120 },
  { id: 'cf-hip-4', filename: 'gold-chain', title: 'Gold Chain', category: 'hiphop-trap', bpm: 138, energy: 'high', mood: 'playful', durationSec: 105 },
  { id: 'cf-hip-5', filename: 'night-rider', title: 'Night Rider', category: 'hiphop-trap', bpm: 148, energy: 'high', mood: 'dark', durationSec: 115 },
  { id: 'cf-hip-6', filename: 'smooth-hustle', title: 'Smooth Hustle', category: 'hiphop-trap', bpm: 128, energy: 'medium', mood: 'playful', durationSec: 130 },

  // Motivational Beats
  { id: 'cf-mot-1', filename: 'sunrise-glory', title: 'Sunrise Glory', category: 'motivational-beats', bpm: 120, energy: 'high', mood: 'uplifting', durationSec: 140 },
  { id: 'cf-mot-2', filename: 'power-move', title: 'Power Move', category: 'motivational-beats', bpm: 125, energy: 'high', mood: 'uplifting', durationSec: 130 },
  { id: 'cf-mot-3', filename: 'corporate-flow', title: 'Corporate Flow', category: 'motivational-beats', bpm: 118, energy: 'medium', mood: 'minimal', durationSec: 150 },
  { id: 'cf-mot-4', filename: 'innovation', title: 'Innovation', category: 'motivational-beats', bpm: 124, energy: 'high', mood: 'uplifting', durationSec: 135 },

  // Classical / Orchestral
  { id: 'cf-cla-1', filename: 'string-quartet-1', title: 'String Quartet No. 1', category: 'classical-orchestra', bpm: 82, energy: 'low', mood: 'cinematic', durationSec: 210 },
  { id: 'cf-cla-2', filename: 'grand-piano-solo', title: 'Grand Piano Solo', category: 'classical-orchestra', bpm: 75, energy: 'low', mood: 'minimal', durationSec: 185 },
  { id: 'cf-cla-3', filename: 'royal-entrance', title: 'Royal Entrance', category: 'classical-orchestra', bpm: 88, energy: 'medium', mood: 'cinematic', durationSec: 140 },
  { id: 'cf-cla-4', filename: 'ethereal-violin', title: 'Ethereal Violin', category: 'classical-orchestra', bpm: 72, energy: 'low', mood: 'minimal', durationSec: 160 },

  // Pop / Indie Life
  { id: 'cf-pop-1', filename: 'summer-vibe', title: 'Summer Vibe', category: 'pop-indie-life', bpm: 118, energy: 'medium', mood: 'uplifting', durationSec: 145 },
  { id: 'cf-pop-2', filename: 'travel-journal', title: 'Travel Journal', category: 'pop-indie-life', bpm: 122, energy: 'medium', mood: 'playful', durationSec: 130 },
  { id: 'cf-pop-3', filename: 'urban-morning', title: 'Urban Morning', category: 'pop-indie-life', bpm: 115, energy: 'low', mood: 'minimal', durationSec: 155 },
  { id: 'cf-pop-4', filename: 'acoustic-soul', title: 'Acoustic Soul', category: 'pop-indie-life', bpm: 112, energy: 'low', mood: 'minimal', durationSec: 170 },
]

function uniqueTokens(values: Array<string | undefined>) {
  return values
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)
    .filter((value, index, all) => all.findIndex((candidate) => normalizeText(candidate) === normalizeText(value)) === index)
}

export type ParsedR2TrackMetadata = {
  artist: string
  title: string
  composer: string | null
}

export type EnrichedR2TrackMetadata = {
  artist?: string | null
  title?: string | null
}

const KNOWN_PERFORMERS = [
  'bloodhound-gang',
  'carpetman',
  'damma-beatz',
  'dayfox',
  'dj-anemia-crier',
  'forester-petit-biscuit-emilia-ali',
  'francois-chaplin',
  'hans-zimmer-james-newton-howard',
  'hozier',
  'imagine-dragons',
  'irokz',
  'justin-bieber',
  'kygo',
  'kygo-miguel',
  'lil-tecca',
  'lonown-riserayss',
  'lost-frequencies-suark-bastille',
  'the-score-awolnation',
] as const

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function parseR2TrackFilename(filename: string): { 
  artist: string
  title: string
  composer: string | null 
} {
  const fileSegment = filename.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '').trim() ?? ''
  
  // If filename contains " - " (space-dash-space), it's Artist - Title format
  if (fileSegment.includes(' - ')) {
    const [artistPart, ...titleParts] = fileSegment.split(' - ')
    return {
      artist: artistPart.trim() || 'Unknown Artist',
      title: titleParts.join(' - ').trim() || 'Untitled Track',
      composer: null,
    }
  }
  
  // If filename contains known performer at the end (for all songs in the bucket), use known-artist logic
  // Check your existing KNOWN_PERFORMERS list
  const parts = fileSegment.split('-').filter(Boolean)
  
  for (const performer of KNOWN_PERFORMERS) {
    const suffix = `-${performer}`
    if (fileSegment.endsWith(suffix)) {
      const titlePart = fileSegment.slice(0, -suffix.length)
      return {
        artist: capitalizeWords(performer.replace(/-/g, ' ')),
        title: capitalizeWords(titlePart.replace(/-/g, ' ').trim()) || 'Untitled Track',
        composer: null,
      }
    }
  }
  
  // DEFAULT: Entire filename is the title, no artist present
  // This fixes "brutal-wishes", "cinematic-trailer", etc.
  return {
    artist: 'Unknown Artist',
    title: capitalizeWords(fileSegment.replace(/-/g, ' ').trim()) || 'Untitled Track',
    composer: null,
  }
}

export function resolveCloudflareTrack(def: CloudflareTrackDef): MusicRecommendation {
  const metadata = parseR2TrackFilename(def.filename)
  const audioUrl = getMusicAudioUrl(def.category, def.filename)
  const thumbnailUrl = getMusicThumbnailUrl(def.category, def.filename)
  const title = metadata.title
  const artist = metadata.artist

  return {
    id: def.id,
    title,
    artist,
    producer: 'Prometheus',
    genre: def.category.replace('-', ' '),
    bpm: def.bpm || 100,
    vibeTags: [def.category, def.energy || 'medium', 'R2 Asset'],
    coverArtUrl: thumbnailUrl,
    coverArtPosition: 'center',
    previewUrl: audioUrl,
    reason: `${title} by ${artist} resolved from Cloudflare R2. Matches ${def.category} tone.`,
    mood: def.mood || 'cinematic',
    energy: def.energy || 'medium',
    sourcePlatform: 'local',
    durationSec: def.durationSec || 60,
    matchScore: 99,
  } as MusicRecommendation
}

export function buildCloudflareMusicCatalog(): MusicCatalogTrack[] {
  return CLOUDFLARE_MUSIC_MANIFEST.map((def, index) => {
    const metadata = parseR2TrackFilename(def.filename)
    const audioUrl = getMusicAudioUrl(def.category, def.filename)
    const thumbnailUrl = getMusicThumbnailUrl(def.category, def.filename)
    const previewUrl = getMusicPreviewUrl(def.category, def.filename)
    const categoryLabel = def.category.replace(/-/g, ' ')
    const mood = def.mood || 'cinematic'
    const energy = def.energy || 'medium'
    const title = metadata.title
    const artist = metadata.artist
    const storageFilename = def.filename.endsWith('.mp3') ? def.filename : `${def.filename}.mp3`

    return {
      id: def.id,
      title,
      subtitle: 'Cloudflare R2 master',
      description: `${title} by ${artist} is served directly from the Prometheus Cloudflare music library for production playback and search.`,
      artist,
      producer: 'Prometheus',
      genre: categoryLabel,
      subgenre: categoryLabel,
      bpm: def.bpm || 108,
      mood,
      energy,
      vibeTags: uniqueTokens([categoryLabel, mood, energy, 'cloudflare', 'r2', 'owned']),
      moodTags: uniqueTokens([mood, categoryLabel, energy]),
      rankingKeywords: uniqueTokens([
        def.id,
        title,
        artist,
        def.filename,
        def.category,
        categoryLabel,
        mood,
        energy,
        'cloudflare',
        'r2',
        'owned music',
      ]),
      energyScore: energy === 'high' ? 86 : energy === 'low' ? 28 : 58,
      tempoRange: inferCloudflareTempoRange(def.bpm || 108, energy),
      instrumentation: inferCloudflareInstrumentation(def.category),
      cinematicTags: uniqueTokens([categoryLabel, mood, 'editorial', 'owned']),
      tensionLevel: mood === 'dark' ? 76 : energy === 'high' ? 62 : energy === 'low' ? 18 : 44,
      emotionalTone: inferCloudflareTone(mood, energy),
      idealUseCases: inferCloudflareUseCases(def.category, energy),
      avoidContexts: energy === 'high' ? ['quiet documentary beds', 'soft dialogue'] : ['aggressive trailer pacing'],
      coverArtUrl: thumbnailUrl,
      coverArtPosition: 'center',
      releaseYear: 2026,
      durationSec: def.durationSec || 90,
      sourcePlatform: 'local',
      storageKey: `${def.category}/${storageFilename}`,
      sourceUrl: audioUrl,
      license: 'owned',
      qualityScore: 96,
      usageCount: index % 5,
      freshnessScore: 94 - (index % 6),
      previewTone: {
        rootHz: mood === 'dark' ? 98 : mood === 'uplifting' ? 146.83 : mood === 'minimal' ? 88 : 110,
        harmonyHz: mood === 'dark' ? 196 : mood === 'uplifting' ? 293.66 : mood === 'minimal' ? 176 : 220,
        bassHz: mood === 'dark' ? 49 : mood === 'uplifting' ? 73.42 : mood === 'minimal' ? 44 : 55,
        pulseHz: Math.max(2.2, (def.bpm || 108) / 36),
      },
    }
  })
}

export function getCloudflareTracksByCategory(category: CloudflareMusicCategory): MusicRecommendation[] {
  return CLOUDFLARE_MUSIC_MANIFEST
    .filter(t => t.category === category)
    .map(resolveCloudflareTrack)
}

export type MusicLibrarySearchResult = {
  query: string
  results: MusicRecommendation[]
  exactMatch: MusicRecommendation | null
  preference: MusicPreference
  fallback: boolean
  total: number
}

export function searchOwnedMusicLibrary({
  query,
  preference,
  videoContext,
  catalog = MUSIC_CATALOG,
  limit = 4,
}: {
  query: string
  preference?: Partial<MusicPreference> | null
  videoContext?: MusicVideoContext | null
  catalog?: MusicCatalogTrack[]
  limit?: number
}): MusicLibrarySearchResult {
  const queryText = normalizeText(query)
  const tokens = tokenize(queryText)
  const fallback = queryText.length === 0
  const contextText = [queryText, buildVideoContextText(videoContext)].filter(Boolean).join(' ')
  const resolvedPreference = normalizeMusicPreference(preference, contextText, videoContext)
  const strongSelectionCue = hasAny(contextText, [
    'strong',
    'knockout',
    'anthem',
    'banger',
    'impact',
    'punchy',
    'power',
    'driving',
    'hero',
    'headline',
    'statement',
  ])
  const wantsAmbient = resolvedPreference.mood === 'minimal' || hasAny(contextText, ['ambient', 'soft', 'subtle', 'under dialogue', 'documentary', 'reflective'])

  const scored = catalog.map((track, index) => {
    const searchText = normalizeText(
      [
        track.id,
        track.title,
        track.subtitle,
        track.description,
        track.album,
        track.artist,
        track.producer,
        track.genre,
        track.vibeTags.join(' '),
        track.rankingKeywords.join(' '),
        track.storageKey,
        track.sourceUrl,
        track.license,
      ]
        .filter(Boolean)
        .join(' '),
    )

    const matchedTerms: string[] = []
    let score = 0

    if (!queryText) {
      score += 20
    }

    if (matchesExactTrack(track, queryText)) {
      score += 120
      matchedTerms.push(track.title.toLowerCase())
    }

    if (queryText && hasStrongFieldMatch(normalizeText(track.title), queryText)) {
      score += 55
    }

    if (queryText && searchText.includes(queryText)) {
      score += 38
    }

    if (queryText && hasStrongFieldMatch(normalizeText(track.artist), queryText)) {
      score += 18
    }

    if (queryText && hasStrongFieldMatch(normalizeText(track.producer), queryText)) {
      score += 14
    }

    if (track.mood === resolvedPreference.mood) score += 6
    if (track.energy === resolvedPreference.energy) score += 4
    if (track.sourcePlatform === resolvedPreference.sourcePlatform) score += 2
    if (videoContext?.pace === 'fast' && track.energy === 'high') score += 3
    if (videoContext?.pace === 'slow' && track.energy === 'low') score += 3
    if (!wantsAmbient && track.energy === 'low') score -= 2.25
    if (!wantsAmbient && track.mood === 'minimal') score -= 1.5
    if (strongSelectionCue && track.energy === 'high') score += 2.5
    if (strongSelectionCue && track.vibeTags.some((tag) => hasAny(tag, ['driving', 'impact', 'launch', 'pulse', 'snappy', 'anthem', 'hero']))) score += 2

    const bpmTarget =
      resolvedPreference.energy === 'low' ? 92 : resolvedPreference.energy === 'high' ? 128 : 110
    score += Math.max(0, 6 - Math.abs(track.bpm - bpmTarget) / 12)

    for (const token of tokens) {
      if (token.length < 3) continue
      if (searchText.includes(token)) {
        score += 3.5
        if (!matchedTerms.includes(token)) {
          matchedTerms.push(token)
        }
      }
    }

    if (resolvedPreference.mood === 'cinematic' && track.vibeTags.some((tag) => tag.includes('cinematic') || tag.includes('luxury'))) {
      score += 1.5
    }
    if (resolvedPreference.mood === 'uplifting' && track.energy === 'high') score += 1.5
    if (resolvedPreference.mood === 'dark' && track.mood === 'dark') score += 1.5
    if (resolvedPreference.mood === 'minimal' && track.energy !== 'high') score += 1
    if (videoContext?.summary) {
      const contextTokens = tokenize(videoContext.summary)
      for (const token of contextTokens) {
        if (token.length < 3) continue
        if (searchText.includes(token)) {
          score += 2
          if (!matchedTerms.includes(token)) {
            matchedTerms.push(token)
          }
        }
      }
    }
    if (videoContext?.signals?.length) {
      for (const token of videoContext.signals) {
        const normalizedToken = normalizeText(token)
        if (normalizedToken && searchText.includes(normalizedToken)) {
          score += 1.5
          if (!matchedTerms.includes(normalizedToken)) {
            matchedTerms.push(normalizedToken)
          }
        }
      }
    }

    return {
      track,
      score,
      matchedTerms,
      index,
    }
  })

  const sorted = scored.sort((a, b) => b.score - a.score || a.index - b.index)
  const results = sorted.slice(0, Math.max(1, limit)).map(({ track, score, matchedTerms }) =>
    mapTrackToRecommendation(track, {
      matchedTerms,
      score,
      preference: resolvedPreference,
      exactMatch: matchesExactTrack(track, queryText),
    }),
  )

  return {
    query: queryText,
    results,
    exactMatch: results.find((result) => result.exactMatch ?? false) ?? null,
    preference: resolvedPreference,
    fallback,
    total: catalog.length,
  }
}

export function findOwnedMusicTrackById(trackId: string, catalog = MUSIC_CATALOG) {
  const normalizedId = normalizeText(trackId)
  if (!normalizedId) return null

  const track = catalog.find((item) => normalizeText(item.id) === normalizedId)
  return track ? mapTrackToRecommendation(track, { score: 100, matchedTerms: [normalizedId], preference: normalizeMusicPreference(null, track.title), exactMatch: true }) : null
}

function mapTrackToRecommendation(
  track: MusicCatalogTrack,
  {
    score,
    matchedTerms,
    preference,
    exactMatch,
  }: {
    score: number
    matchedTerms: string[]
    preference: MusicPreference
    exactMatch: boolean
  },
): MusicRecommendation {
  const directCloudflareUrl = resolveDirectCloudflareAudioUrl(track)

  return {
    id: track.id,
    title: track.title,
    subtitle: track.subtitle,
    description: track.description,
    album: track.album,
    artist: track.artist,
    producer: track.producer,
    genre: track.genre,
    bpm: track.bpm,
    vibeTags: track.vibeTags,
    coverArtUrl: track.coverArtUrl,
    coverArtPosition: track.coverArtPosition,
    previewUrl: directCloudflareUrl ?? buildMusicPreviewUrl(track.id),
    reason: buildLibraryReason(track, matchedTerms, preference, exactMatch),
    mood: track.mood,
    energy: track.energy,
    sourcePlatform: track.sourcePlatform,
    durationSec: track.durationSec,
    releaseYear: track.releaseYear,
    storageKey: track.storageKey,
    sourceUrl: track.sourceUrl,
    license: track.license,
    matchScore: score,
    matchedTerms,
    exactMatch,
  }
}

function resolveDirectCloudflareAudioUrl(track: MusicCatalogTrack) {
  if (!track.sourceUrl) return null

  try {
    const parsed = new URL(track.sourceUrl)
    const pathname = parsed.pathname.toLowerCase()
    if (pathname.endsWith('.mp3') || pathname.endsWith('.wav') || pathname.endsWith('.ogg') || pathname.endsWith('.m4a')) {
      return track.sourceUrl
    }
  } catch {
    return null
  }

  return null
}

function inferCloudflareTempoRange(bpm: number, energy: MusicEnergy): [number, number] {
  const spread = energy === 'high' ? 12 : energy === 'low' ? 8 : 10
  return [Math.max(60, bpm - spread), Math.min(160, bpm + spread)]
}

function inferCloudflareInstrumentation(category: CloudflareMusicCategory) {
  switch (category) {
    case 'cinematic-trailer':
      return ['trailer drums', 'hybrid strings', 'risers', 'impacts']
    case 'classical-orchestra':
      return ['strings', 'piano', 'orchestral room', 'bowed texture']
    case 'hiphop-trap':
      return ['808', 'trap hats', 'sub bass', 'snare']
    case 'lofi-chill-soft':
      return ['soft keys', 'vinyl texture', 'dusty drums', 'warm bass']
    case 'motivational-beats':
      return ['clean drums', 'uplift synth', 'pulse bass', 'bright keys']
    case 'pop-indie-life':
      return ['guitar', 'indie drums', 'warm synth', 'hand percussion']
    case 'tech-futuristic':
      return ['synth arps', 'digital pulse', 'sub bass', 'glitch percussion']
  }
}

function inferCloudflareTone(mood: MusicMood, energy: MusicEnergy) {
  if (mood === 'dark') return energy === 'high' ? 'urgent and shadowed' : 'controlled and cinematic'
  if (mood === 'uplifting') return energy === 'high' ? 'bright and propulsive' : 'optimistic and clean'
  if (mood === 'minimal') return 'quiet and editorial'
  if (mood === 'playful') return 'social and kinetic'
  return 'cinematic and polished'
}

function inferCloudflareUseCases(category: CloudflareMusicCategory, energy: MusicEnergy) {
  const base =
    category === 'cinematic-trailer'
      ? ['hero reveal', 'launch trailer', 'high-impact reel']
      : category === 'tech-futuristic'
        ? ['AI product edit', 'SaaS walkthrough', 'futuristic montage']
        : category === 'lofi-chill-soft'
          ? ['under-dialogue bed', 'reflective edit', 'soft founder story']
          : category === 'hiphop-trap'
            ? ['social hook', 'fast product reel', 'creator clip']
            : ['brand film', 'editorial montage', 'promo cut']

  return energy === 'high' ? [...base, 'fast-cut sequence'] : base
}

function buildLibraryReason(
  track: MusicCatalogTrack,
  matchedTerms: string[],
  preference: MusicPreference,
  exactMatch: boolean,
) {
  const exactLine = exactMatch ? 'Exact library match.' : 'Found in your owned library.'
  const preferenceLine =
    preference.mood === track.mood
      ? `${track.mood} tone`
      : `${track.mood} ${track.genre.toLowerCase()} texture`
  const termLine = matchedTerms.length > 0 ? `Matched ${matchedTerms.slice(0, 2).join(' and ')}.` : ''

  return `${exactLine} ${preferenceLine} at ${track.bpm} BPM. ${termLine}`.trim()
}

function matchesExactTrack(track: MusicCatalogTrack, queryText: string) {
  if (!queryText) return false

  const title = normalizeText(track.title)
  const artist = normalizeText(track.artist)
  const producer = normalizeText(track.producer)
  const id = normalizeText(track.id)
  const album = normalizeText(track.album ?? '')

  return (
    queryText === title ||
    queryText === `${title} ${artist}` ||
    queryText === `${artist} ${title}` ||
    queryText === id ||
    queryText === album ||
    queryText === `${title} by ${artist}` ||
    queryText === `${track.title}`.toLowerCase().trim() ||
    queryText === `${track.artist}`.toLowerCase().trim() ||
    queryText === `${track.producer}`.toLowerCase().trim() ||
    queryText === `${track.title} ${track.producer}`.toLowerCase().trim() ||
    queryText === `${track.artist} ${track.producer}`.toLowerCase().trim()
  )
}

function hasStrongFieldMatch(fieldValue: string, queryText: string) {
  if (!fieldValue || !queryText) return false

  return fieldValue.includes(queryText) || queryText.includes(fieldValue)
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function hasAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle))
}
