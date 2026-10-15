'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Crown, FileUp, Folder, Heart, Music, Pause, Play, Plus, Search, SlidersHorizontal, Sparkles, UserRound, X } from 'lucide-react'
import { toast } from 'sonner'

import { MusicFavoriteButton, MusicLibraryPreview, MusicLibraryTrackRow } from '@/components/editor/music-library-preview'
import styles from './music-library.module.css'
import { CinematicLogoLoader } from '@/components/loading-animation/cinematic-logo-loader'
import { MusicPlayer } from '@/components/ui/music-player'
import { chamberEase } from '@/lib/chamber-motion'
import { FALLBACK_ALBUM_ART } from '@/lib/music-art'
import type { MusicCatalogTrack } from '@/lib/music-catalog'
import { buildMusicRecommendationSet } from '@/lib/music-recommendation-core'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { savePersonalMusicTrack } from '@/lib/personal-music-upload'
import type { MusicRecommendation, MusicVideoContext } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import { useEditorialTimeline } from '@/hooks/use-editorial-timeline'
import { clearSelectedEditorMusicRecommendation, writeSelectedEditorMusicRecommendation } from '@/lib/editor-music-selection'

type SelectedSongDisplay = {
  id: string
  title: string
  metadataLine: string
  artwork: string
  artworkPosition: string
  audioSrc: string
}

type MusicCollectionTab = 'for-video' | 'trending' | 'premium' | 'my-music' | 'favorites'

type PersonalMusicFile = {
  id: string
  name: string
  sizeLabel: string
  storagePath?: string
  previewUrl?: string
  title?: string
  artist?: string
  genre?: string
  folderName?: string
  uploadState?: 'failed' | 'uploading'
  uploadError?: string
}

type PersonalMusicTrackRow = {
  id: string
  original_filename: string
  storage_path: string
  size_bytes: number
  title: string | null
  artist: string | null
  genre: string | null
  folder_name: string
}

type CloudMusicFile = {
  id: string
  name: string
  mimeType: string
  size: number | null
  path?: string
  provider: 'google_drive' | 'dropbox'
}

const PERSONAL_MUSIC_LIBRARY_STORAGE_KEY = 'prometheus.editor.personal-music.v1'
const MUSIC_FAVORITES_STORAGE_KEY = 'prometheus.editor.music-favorites.v1'

function readFavoriteTrackIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(MUSIC_FAVORITES_STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

function readPersonalMusicLibrary() {
  if (typeof window === 'undefined') return { files: [] as PersonalMusicFile[], folders: [] as string[] }

  try {
    const value = window.localStorage.getItem(PERSONAL_MUSIC_LIBRARY_STORAGE_KEY)
    if (!value) return { files: [] as PersonalMusicFile[], folders: [] as string[] }
    const parsed = JSON.parse(value) as { files?: unknown; folders?: unknown }
    const files = Array.isArray(parsed.files)
      ? parsed.files.filter((file): file is PersonalMusicFile => Boolean(
        file && typeof file === 'object' &&
        typeof (file as PersonalMusicFile).id === 'string' &&
        typeof (file as PersonalMusicFile).name === 'string' &&
        typeof (file as PersonalMusicFile).sizeLabel === 'string',
      ))
      : []
    const folders = Array.isArray(parsed.folders)
      ? parsed.folders.filter((folder): folder is string => typeof folder === 'string')
      : []
    return { files: files.map((file) => file.uploadState === 'uploading' ? { ...file, uploadState: 'failed' as const, uploadError: 'Upload interrupted. Select the file again to retry.' } : file), folders }
  } catch {
    return { files: [] as PersonalMusicFile[], folders: [] as string[] }
  }
}

const MUSIC_COLLECTION_TABS: Array<{ id: MusicCollectionTab; label: string; icon?: string }> = [
  { id: 'for-video', label: 'For this video' },
  { id: 'trending', label: 'Trending' },
  { id: 'premium', label: 'Premium', icon: '👑' },
  { id: 'my-music', label: 'My Music', icon: '👤' },
  { id: 'favorites', label: 'Favorites', icon: '🤍' },
]

function formatPersonalMusicSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toPersonalMusicFile(file: File): PersonalMusicFile {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    sizeLabel: formatPersonalMusicSize(file.size),
  }
}

function fromPersonalMusicTrackRow(track: PersonalMusicTrackRow, previewUrl?: string): PersonalMusicFile {
  return {
    id: track.id,
    name: track.original_filename,
    sizeLabel: formatPersonalMusicSize(track.size_bytes),
    storagePath: track.storage_path,
    previewUrl,
    title: track.title ?? undefined,
    artist: track.artist ?? undefined,
    genre: track.genre ?? undefined,
    folderName: track.folder_name || 'Unsorted',
  }
}

function personalMusicRecommendation(file: PersonalMusicFile): MusicRecommendation | null {
  if (!file.storagePath || !file.previewUrl) return null
  const title = file.title || file.name.replace(/\.[^.]+$/, '')
  return {
    id: file.id,
    title,
    artist: file.artist || 'Your music',
    producer: file.artist || 'Your library',
    genre: file.genre || 'Personal',
    bpm: 0,
    vibeTags: [file.folderName || 'Unsorted'],
    coverArtUrl: FALLBACK_ALBUM_ART,
    previewUrl: file.previewUrl,
    reason: 'Uploaded to your private music library.',
    mood: 'minimal',
    energy: 'low',
    sourcePlatform: 'local',
    durationSec: 0,
    subtitle: file.folderName || 'Your music',
    storageKey: file.storagePath,
    license: 'owned',
  }
}

function MusicCollectionTabs({
  activeTab, onChange, moodFilter, onMoodChange, genreFilter, onGenreChange,
  durationFilter, onDurationChange, availableGenres, hasRecommendations = false,
}: {
  activeTab: MusicCollectionTab
  onChange: (tab: MusicCollectionTab) => void
  moodFilter?: string
  onMoodChange?: (mood: string) => void
  genreFilter?: string
  onGenreChange?: (genre: string) => void
  durationFilter?: string
  onDurationChange?: (duration: string) => void
  availableGenres?: string[]
  hasRecommendations?: boolean
}) {
  return <div className={styles.collections}>
    <div className={styles.tabs} role="tablist" aria-label="Music collections">
      {MUSIC_COLLECTION_TABS.filter(tab => tab.id !== 'for-video' || hasRecommendations).map(tab => (
        <button key={tab.id} type="button" role="tab" aria-selected={tab.id === activeTab} onClick={() => onChange(tab.id)} className={cn(styles.tab, tab.id === activeTab && styles.activeTab)}>
          {tab.id === 'premium' ? <Crown size={15} aria-hidden="true" /> : tab.id === 'my-music' ? <UserRound size={15} aria-hidden="true" /> : tab.id === 'favorites' ? <Heart size={15} aria-hidden="true" /> : null}
          {tab.label}
        </button>
      ))}
    </div>
    <div className={styles.filters}>
      <div className={styles.filterSelect}>
        <select aria-label="Mood" value={moodFilter ?? ''} onChange={event => onMoodChange?.(event.target.value)}>
          <option value="">Mood</option>
          <option value="cinematic">Cinematic</option><option value="uplifting">Uplifting</option><option value="peaceful">Peaceful</option>
          <option value="dark">Energetic</option><option value="minimal">Chill</option><option value="playful">Happy</option>
        </select>
        <ChevronDown size={13} aria-hidden="true" />
      </div>
      <div className={styles.filterSelect}>
        <select aria-label="Genre" value={genreFilter ?? ''} onChange={event => onGenreChange?.(event.target.value)}>
          <option value="">Genre</option>
          {(availableGenres ?? []).map(genre => <option key={genre} value={genre}>{genre}</option>)}
        </select>
        <ChevronDown size={13} aria-hidden="true" />
      </div>
      <div className={styles.filterSelect}>
        <select aria-label="Duration" value={durationFilter ?? ''} onChange={event => onDurationChange?.(event.target.value)}>
          <option value="">Duration</option><option value="short">&lt; 3 mins</option><option value="medium">3–5 mins</option><option value="long">&gt; 5 mins</option>
        </select>
        <ChevronDown size={13} aria-hidden="true" />
      </div>
    </div>
  </div>
}

function MyMusicShelf({
  files,
  folders,
  query,
  onCreateFolder,
  onFilesSelected,
  onSelectTrack,
  onPreviewTrack,
  favoriteTrackIds,
  onToggleFavorite,
  onRemoveTrack,
  onMoveTrack,
  selectedTrackId,
  playingTrackId,
  cloudFiles,
  cloudLoading,
  cloudImportingId,
  onLoadCloudFiles,
  onImportCloudFile,
}: {
  files: PersonalMusicFile[]
  folders: string[]
  query: string
  onCreateFolder?: () => void
  onFilesSelected: React.ChangeEventHandler<HTMLInputElement>
  onSelectTrack: (file: PersonalMusicFile) => void
  onPreviewTrack: (file: PersonalMusicFile) => void
  favoriteTrackIds: Set<string>
  onToggleFavorite: (trackId: string) => void
  onRemoveTrack: (file: PersonalMusicFile) => void
  onMoveTrack: (file: PersonalMusicFile, folder: string) => void
  selectedTrackId: string | null
  playingTrackId: string | null
  cloudFiles: CloudMusicFile[]
  cloudLoading: string | null
  cloudImportingId: string | null
  onLoadCloudFiles: (provider: CloudMusicFile['provider']) => void
  onImportCloudFile: (file: CloudMusicFile) => void
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const matchingFiles = files.filter((file) => file.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <section className="min-h-[26rem] space-y-4 rounded-[16px] border border-white/10 bg-white/[0.025] p-4" aria-label="My Music library">
      <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={onFilesSelected} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/88">Your music</p>
          <p className="mt-1 text-xs text-white/42">Upload a soundtrack or keep a private working folder.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-[10px] text-white/48">{files.length} tracks</span>
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-24 w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-white/24 bg-white/[0.025] px-3 text-sm font-medium text-white/78 transition hover:border-[#4d9dff]/70 hover:bg-[#4d9dff]/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d9dff]/50"
        >
          <FileUp className="size-5" /> Tap to upload
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/42">Import from</span>
        {(['google_drive', 'dropbox'] as const).map((provider) => (
          <button key={provider} type="button" onClick={() => onLoadCloudFiles(provider)} disabled={cloudLoading === provider} className="rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-[10px] text-white/65 transition hover:border-white/25 hover:text-white disabled:opacity-45">
            {cloudLoading === provider ? 'Loading…' : provider === 'google_drive' ? 'Google Drive' : 'Dropbox'}
          </button>
        ))}
      </div>

      {cloudFiles.length ? (
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-white/[0.07] bg-black/20 p-2">
          {cloudFiles.map((file) => (
            <div key={`${file.provider}:${file.id}`} className="flex items-center justify-between gap-3 text-xs text-white/65">
              <span className="min-w-0 truncate">{file.name} <span className="text-white/32">· {file.provider === 'google_drive' ? 'Drive' : 'Dropbox'}</span></span>
              <button type="button" onClick={() => onImportCloudFile(file)} disabled={cloudImportingId === file.id} className="shrink-0 rounded-md bg-white/[0.08] px-2 py-1 text-[10px] text-white/75 hover:bg-white/[0.14] hover:text-white disabled:opacity-45">
                {cloudImportingId === file.id ? 'Importing…' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {folders.length ? (
        <div className="flex flex-wrap gap-2">
          {folders.map((folder) => <span key={folder} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/20 px-2.5 py-1 text-[10px] text-white/58"><Folder className="size-3" />{folder}</span>)}
        </div>
      ) : null}

      <div className="border-t border-white/8 pt-2">
        {matchingFiles.length ? (
          <div className="space-y-1.5">
            {matchingFiles.map((file) => (
              <div key={file.id} className={cn('flex items-center justify-between gap-3 rounded-[10px] border bg-black/20 px-3 py-2.5 text-sm text-white/74', selectedTrackId === file.id ? 'border-[#4d9dff]/45 bg-[#4d9dff]/[0.07]' : 'border-white/[0.06]')}>
                <span className="flex min-w-0 items-center gap-2 truncate"><Music className="size-3.5 shrink-0 text-[#a5b4fc]" /> <span className="truncate">{file.name}</span></span>
                <span title={file.uploadError} className={cn('shrink-0 font-mono text-[10px]', file.uploadState === 'failed' ? styles.uploadFailed : 'text-white/35')}>
                  {file.uploadState === 'uploading' ? 'Uploading…' : file.uploadState === 'failed' ? 'Upload failed' : file.sizeLabel}
                </span>
                {file.uploadState ? null : (
                  <span className="flex shrink-0 items-center gap-1">
                    <select aria-label={`Move ${file.title || file.name} to folder`} value={file.folderName || 'Unsorted'} onChange={(event) => onMoveTrack(file, event.target.value)} className="max-w-24 rounded-md border border-white/10 bg-black/35 px-1.5 py-1 text-[10px] text-white/65">
                      {Array.from(new Set(['Unsorted', ...folders, file.folderName || 'Unsorted'])).map((folder) => <option key={folder} value={folder}>{folder}</option>)}
                    </select>
                    <button type="button" onClick={() => onPreviewTrack(file)} disabled={!file.previewUrl} className="grid size-7 place-items-center rounded-full text-white/58 transition hover:bg-white/10 hover:text-white disabled:opacity-30" aria-label={playingTrackId === file.id ? `Pause ${file.title || file.name}` : `Preview ${file.title || file.name}`}>
                      {playingTrackId === file.id ? <Pause className="size-3.5 fill-current" /> : <Play className="ml-0.5 size-3.5 fill-current" />}
                    </button>
                    <MusicFavoriteButton title={file.title || file.name} isFavorite={favoriteTrackIds.has(file.id)} onToggle={() => onToggleFavorite(file.id)} />
                    <button type="button" onClick={() => onSelectTrack(file)} disabled={!file.previewUrl} className="grid size-7 place-items-center rounded-full text-white/58 transition hover:bg-[#4d9dff]/15 hover:text-white disabled:opacity-30" aria-label={`Select ${file.title || file.name} for preview`}>
                      <Plus className="size-3.5" />
                    </button>
                  </span>
                )}
                <button type="button" onClick={() => onRemoveTrack(file)} disabled={file.uploadState === 'uploading'} className="grid size-7 shrink-0 place-items-center rounded-full text-white/38 transition hover:bg-red-400/10 hover:text-red-200 disabled:opacity-30" aria-label={`Remove ${file.title || file.name} from your library`} title="Remove from your music library">
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-1 py-8 text-center text-xs leading-5 text-white/42">Your uploaded tracks and folders will live here.</p>
        )}
      </div>
    </section>
  )
}

function buildSelectedSongDisplay(track: MusicRecommendation): SelectedSongDisplay {
  const sourceLabel = track.sourcePlatform === 'online' ? 'Streaming' : 'Prometheus Audio'
  const metadataLine = [track.artist, track.subtitle || sourceLabel, track.genre].filter(Boolean).join(' / ')

  return {
    id: track.id,
    title: track.title,
    metadataLine,
    artwork: track.coverArtUrl,
    artworkPosition: track.coverArtPosition ?? 'center',
    audioSrc: track.previewUrl,
  }
}

type CatalogApiTrack = {
  id: string
  title: string
  artist: string | null
  album?: string
  category: string
  genreTags: string[]
  moodTags: string[]
  durationSec?: number
  audioPreviewUrl?: string
  thumbnailUrl?: string
  recommendationMetadata?: Partial<MusicCatalogTrack>
}

type CatalogApiResponse = {
  tracks?: CatalogApiTrack[]
  total?: number
  limit?: number
  offset?: number
}

type MusicMatchResponse = {
  matchedTrackIds?: string[]
  reasoningSummary?: string
  source?: 'groq' | 'heuristic'
}

const FALLBACK_COVER_ART = FALLBACK_ALBUM_ART
const CATALOG_PAGE_SIZE = 200
const INITIAL_VISIBLE_TRACKS = 50
const VISIBLE_TRACK_INCREMENT = 50

function mapCatalogApiTrack(track: CatalogApiTrack): MusicRecommendation {
  const genre = track.genreTags[0] ?? track.category ?? 'Soundtrack'
  const artist = track.artist?.trim() || 'Unknown Artist'

  const mappedTrack: MusicRecommendation = {
    id: track.id,
    title: track.title,
    subtitle: track.album || track.category,
    description: [track.album, track.category, track.genreTags.join(' ')].filter(Boolean).join(' '),
    album: track.album,
    artist,
    producer: 'Prometheus',
    genre,
    bpm: 100,
    vibeTags: [...track.genreTags, ...track.moodTags].filter(Boolean),
    coverArtUrl: track.thumbnailUrl || FALLBACK_COVER_ART,
    coverArtPosition: 'center',
    previewUrl: track.audioPreviewUrl ?? `/api/music/preview?trackId=${encodeURIComponent(track.id)}`,
    reason: 'Loaded from the Prometheus music catalog.',
    mood: 'cinematic',
    energy: 'medium',
    sourcePlatform: 'local',
    durationSec: track.durationSec ?? 0,
  }

  return Object.assign(mappedTrack, track.recommendationMetadata)
}

let cachedCatalogTracks: MusicRecommendation[] | null = null
let catalogRequest: Promise<MusicRecommendation[]> | null = null
const catalogProgressListeners = new Set<(tracks: MusicRecommendation[]) => void>()

function subscribeToCatalogProgress(listener: (tracks: MusicRecommendation[]) => void) {
  catalogProgressListeners.add(listener)
  return () => catalogProgressListeners.delete(listener)
}

async function fetchCatalogTracks(): Promise<MusicRecommendation[]> {
  const nextTracks: MusicRecommendation[] = []
  let offset = 0
  let total = Number.POSITIVE_INFINITY

  while (offset < total) {
    const response = await fetch(`/api/music/catalog?limit=${CATALOG_PAGE_SIZE}&offset=${offset}&includeUnsafe=true`, { cache: 'no-store' })
    if (!response.ok) throw new Error('Unable to load music catalog')
    const data = (await response.json()) as CatalogApiResponse
    const pageTracks = Array.isArray(data.tracks) ? data.tracks.map(mapCatalogApiTrack) : []
    nextTracks.push(...pageTracks)
    const loadedTracks = [...nextTracks]
    for (const listener of catalogProgressListeners) listener(loadedTracks)

    total = typeof data.total === 'number' && Number.isFinite(data.total) ? data.total : nextTracks.length
    const nextOffset = offset + (typeof data.limit === 'number' && data.limit > 0 ? data.limit : pageTracks.length)
    if (!pageTracks.length || nextOffset <= offset) break
    offset = nextOffset
  }

  return nextTracks
}

function toRecommendationCatalogTrack(track: MusicRecommendation): MusicCatalogTrack {
  const metadata = track as MusicRecommendation & Partial<MusicCatalogTrack>
  return {
    id: track.id,
    title: track.title,
    subtitle: metadata.subtitle ?? track.subtitle ?? track.genre,
    description: metadata.description ?? track.description ?? `${track.title} by ${track.artist}`,
    album: metadata.album ?? track.album,
    artist: track.artist,
    producer: metadata.producer ?? track.producer,
    genre: track.genre,
    subgenre: metadata.subgenre,
    bpm: track.bpm,
    mood: track.mood,
    energy: track.energy,
    vibeTags: track.vibeTags,
    moodTags: metadata.moodTags,
    rankingKeywords: metadata.rankingKeywords ?? [track.title, track.artist, track.genre, ...track.vibeTags],
    energyScore: metadata.energyScore,
    tempoRange: metadata.tempoRange,
    instrumentation: metadata.instrumentation,
    cinematicTags: metadata.cinematicTags,
    tensionLevel: metadata.tensionLevel,
    emotionalTone: metadata.emotionalTone,
    idealUseCases: metadata.idealUseCases,
    avoidContexts: metadata.avoidContexts,
    coverArtUrl: track.coverArtUrl,
    coverArtPosition: track.coverArtPosition,
    releaseYear: metadata.releaseYear ?? new Date().getFullYear(),
    durationSec: track.durationSec,
    sourcePlatform: track.sourcePlatform,
    storageKey: metadata.storageKey ?? track.storageKey,
    sourceUrl: metadata.sourceUrl ?? track.sourceUrl,
    license: track.license,
    qualityScore: track.qualityScore,
    usageCount: metadata.usageCount,
    freshnessScore: metadata.freshnessScore ?? track.freshnessScore,
    previewTone: metadata.previewTone ?? { rootHz: 110, harmonyHz: 220, bassHz: 55, pulseHz: 3 },
  }
}

/**
 * Session-level catalog cache. The paginated result (and any in-flight
 * request) survives unmount/remount of the panel, so the loader only appears
 * on the first visit. The underlying fetch still runs with `no-store`; this
 * is just in-session memory.
 */
function getCatalogTracks(): Promise<MusicRecommendation[]> {
  if (cachedCatalogTracks) return Promise.resolve(cachedCatalogTracks)
  if (!catalogRequest) {
    catalogRequest = fetchCatalogTracks()
      .then((tracks) => {
        cachedCatalogTracks = tracks
        return tracks
      })
      .catch((error: unknown) => {
        catalogRequest = null
        throw error
      })
  }
  return catalogRequest
}

export function MusicTabPanel({
  tracks,
  projectTitle,
  initialPrompt = '',
  videoContext = null,
  selectedTrackId,
  onSelectTrack: onSelectTrackProp,
  onRemoveTrack: onRemoveTrackProp,
  variant = 'desktop',
}: {
  tracks: MusicRecommendation[]
  projectTitle: string
  initialPrompt?: string
  videoContext?: MusicVideoContext | null
  selectedTrackId: string | null
  onSelectTrack: (track: MusicRecommendation) => void
  onRemoveTrack?: () => void
  variant?: 'desktop' | 'mobile'
}) {
  const editorial = useEditorialTimeline()
  const onSelectTrack = React.useCallback((track: MusicRecommendation) => {
    onSelectTrackProp(track)
    writeSelectedEditorMusicRecommendation(editorial.projectId, track)
    try {
      editorial.patch({ type: 'music', track: track as any })
    } catch {
      // Safe fallback if schema difference occurs
    }
  }, [editorial.patch, editorial.projectId, onSelectTrackProp])

  const handleRemoveSoundtrack = React.useCallback(() => {
    onRemoveTrackProp?.()
    clearSelectedEditorMusicRecommendation(editorial.projectId)
    try {
      editorial.patch({ type: 'music', track: null as any })
    } catch {
      // Safe fallback if schema difference occurs
    }
    setLocalSelectedTrackId(null)
    setFocusedTrackId(null)
    setPlayingTrackId(null)
    toast.success('Soundtrack removed from timeline')
  }, [editorial.patch, editorial.projectId, onRemoveTrackProp])
  const reduceMotion = useStableReducedMotion()
  const [catalogTracks, setCatalogTracks] = React.useState<MusicRecommendation[]>(() => cachedCatalogTracks ?? [])
  const [catalogLoading, setCatalogLoading] = React.useState(() => cachedCatalogTracks === null)
  const [catalogReady, setCatalogReady] = React.useState(() => cachedCatalogTracks !== null)
  const [localSelectedTrackId, setLocalSelectedTrackId] = React.useState<string | null>(selectedTrackId)
  const [focusedTrackId, setFocusedTrackId] = React.useState<string | null>(selectedTrackId)
  const [playingTrackId, setPlayingTrackId] = React.useState<string | null>(null)
  const [selectedTrackIds, setSelectedTrackIds] = React.useState<Set<string>>(() => new Set())
  const [activeCollection, setActiveCollection] = React.useState<MusicCollectionTab>(tracks.length ? 'for-video' : 'trending')
  const userChoseMusicCollection = React.useRef(false)
  const [personalMusicFiles, setPersonalMusicFiles] = React.useState<PersonalMusicFile[]>(() => readPersonalMusicLibrary().files)
  const [personalMusicFolders, setPersonalMusicFolders] = React.useState<string[]>(() => readPersonalMusicLibrary().folders)
  const [cloudMusicFiles, setCloudMusicFiles] = React.useState<CloudMusicFile[]>([])
  const [cloudMusicLoading, setCloudMusicLoading] = React.useState<string | null>(null)
  const [cloudImportingId, setCloudImportingId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showFilters, setShowFilters] = React.useState(false)
  const [compareMode, setCompareMode] = React.useState(false)
  const [genreFilter, setGenreFilter] = React.useState('')
  const [visibleTrackCount, setVisibleTrackCount] = React.useState(INITIAL_VISIBLE_TRACKS)
  const [brokenArtworkIds, setBrokenArtworkIds] = React.useState<Record<string, true>>({})
  const [isMuted, setIsMuted] = React.useState(false)
  const [isAutoMatching, setIsAutoMatching] = React.useState(false)
  const [isPlayerBuffering, setIsPlayerBuffering] = React.useState(false)
  const [playerProgress, setPlayerProgress] = React.useState({ currentTime: 0, duration: 0 })
  const [seekRequest, setSeekRequest] = React.useState<{ time: number; token: number } | null>(null)
  const selectionTrayRef = React.useRef<HTMLDivElement | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [moodFilter, setMoodFilter] = React.useState('')
  const [durationFilter, setDurationFilter] = React.useState('')
  const [volume, setVolume] = React.useState(80)
  const [isShuffle, setIsShuffle] = React.useState(false)
  const [isRepeat, setIsRepeat] = React.useState(false)
  const [favoriteTrackIds, setFavoriteTrackIds] = React.useState<Set<string>>(readFavoriteTrackIds)

  React.useEffect(() => {
    if (tracks.length && !userChoseMusicCollection.current) setActiveCollection('for-video')
  }, [tracks.length])

  React.useEffect(() => {
    try {
      window.localStorage.setItem(MUSIC_FAVORITES_STORAGE_KEY, JSON.stringify([...favoriteTrackIds]))
    } catch {
      // Favorites remain usable for this session when browser storage is unavailable.
    }
  }, [favoriteTrackIds])

  const toggleFavorite = React.useCallback((trackId: string) => {
    setFavoriteTrackIds((current) => {
      const next = new Set(current)
      if (next.has(trackId)) next.delete(trackId)
      else next.add(trackId)
      return next
    })
  }, [])

  React.useEffect(() => {
    const trackId = editorial.timeline?.music?.track.id ?? selectedTrackId
    if (trackId) {
      setLocalSelectedTrackId(trackId)
      setFocusedTrackId(trackId)
    } else {
      setLocalSelectedTrackId(null)
      setFocusedTrackId(null)
    }
  }, [editorial.timeline?.music?.track.id, selectedTrackId])

  React.useEffect(() => {
    try {
      window.localStorage.setItem(PERSONAL_MUSIC_LIBRARY_STORAGE_KEY, JSON.stringify({
        files: personalMusicFiles.map((file) => ({
          id: file.id,
          name: file.name,
          sizeLabel: file.sizeLabel,
          storagePath: file.storagePath,
          title: file.title,
          artist: file.artist,
          genre: file.genre,
          folderName: file.folderName,
          uploadState: file.uploadState,
          uploadError: file.uploadError,
        })),
        folders: personalMusicFolders,
      }))
    } catch {
      // Browser storage is an enhancement: the in-session library remains usable without it.
    }
  }, [personalMusicFiles, personalMusicFolders])

  React.useEffect(() => {
    let disposed = false

    async function loadPersonalMusic() {
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) return

        const { data, error } = await supabase
          .from('user_music_tracks')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        const files = await Promise.all((data ?? []).map(async (track) => {
          const row = track as PersonalMusicTrackRow
          const { data: signed, error: signedUrlError } = await supabase.storage
            .from('user-music')
            .createSignedUrl(row.storage_path, 3600)
          if (signedUrlError) return fromPersonalMusicTrackRow(row)
          return fromPersonalMusicTrackRow(row, signed.signedUrl)
        }))
        const { data: folderRows } = await supabase.from('user_music_folders').select('name').order('name')
        if (!disposed) {
          setPersonalMusicFiles((current) => [...files, ...current.filter((file) => file.uploadState && !files.some((saved) => saved.id === file.id))])
          setPersonalMusicFolders(Array.from(new Set([...(folderRows ?? []).map((folder) => folder.name), ...files.map((file) => file.folderName || 'Unsorted')])).filter((folder) => folder !== 'Unsorted'))
        }
      } catch {
        // Local storage keeps the shelf useful until Supabase is configured or the migration is applied.
      }
    }

    void loadPersonalMusic()
    return () => {
      disposed = true
    }
  }, [])

  const handlePersonalMusicUpload = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(async (event) => {
    const nextFiles = Array.from(event.target.files ?? [])
    if (!nextFiles.length) return
    event.target.value = ''

    const unsupported = nextFiles.find((file) => (
      (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|flac|webm)$/i.test(file.name)) ||
      file.size <= 0 || file.size > 50 * 1024 * 1024
    ))
    if (unsupported) {
      toast.error(`${unsupported.name} is not a supported audio file or exceeds the 50 MB limit.`)
      return
    }

    const optimisticFiles = nextFiles.map((file) => ({ ...toPersonalMusicFile(file), uploadState: 'uploading' as const }))
    setPersonalMusicFiles((current) => [
      ...optimisticFiles,
      ...current.filter((currentFile) => !optimisticFiles.some((file) => file.id === currentFile.id)),
    ])

    if (!isSupabaseConfigured()) {
      setPersonalMusicFiles((current) => current.map((currentFile) => (
        optimisticFiles.some((file) => file.id === currentFile.id)
          ? { ...currentFile, uploadState: 'failed' }
          : currentFile
      )))
      toast.error('Sign in and connect storage before saving music to your library.')
      return
    }

    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('Sign in to save music to your library.')

      const results = await Promise.allSettled(nextFiles.map(async (file) => {
        const saved = await savePersonalMusicTrack(supabase, user.id, file)
        return { optimisticId: toPersonalMusicFile(file).id, track: fromPersonalMusicTrackRow(saved.track as PersonalMusicTrackRow, saved.previewUrl) }
      }))
      const uploadedFiles = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
      const failures = new Map(results.flatMap((result, index) => result.status === 'rejected'
        ? [[optimisticFiles[index]!.id, String(result.reason?.message || 'Unable to upload music')] as const] : []))
      setPersonalMusicFiles((current) => [
        ...uploadedFiles.map((result) => result.track),
        ...current
          .filter((currentFile) => !uploadedFiles.some((result) => result.optimisticId === currentFile.id))
          .map((currentFile) => failures.has(currentFile.id) ? { ...currentFile, uploadState: 'failed' as const, uploadError: failures.get(currentFile.id) } : currentFile),
      ])
      if (failures.size) toast.error(`${failures.size} of ${nextFiles.length} tracks could not be uploaded. ${failures.values().next().value}`)
    } catch (error) {
      setPersonalMusicFiles((current) => current.map((currentFile) => (
        optimisticFiles.some((file) => file.id === currentFile.id)
          ? { ...currentFile, uploadState: 'failed' }
          : currentFile
      )))
      toast.error(error instanceof Error ? error.message : 'Unable to upload music')
    }
  }, [])

  const createPersonalMusicFolder = React.useCallback(async () => {
    const name = window.prompt('Name this music folder')?.trim().slice(0, 60)
    if (!name) return
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('Sign in to save music folders.')
      const { error } = await supabase.from('user_music_folders').insert({ user_id: user.id, name })
      if (error && !/duplicate key/i.test(error.message)) throw error
      setPersonalMusicFolders((current) => current.includes(name) ? current : [...current, name].sort())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create music folder')
    }
  }, [])

  const handlePersonalMusicRemove = React.useCallback(async (file: PersonalMusicFile) => {
    if (!file.storagePath) {
      setPersonalMusicFiles((current) => current.filter((candidate) => candidate.id !== file.id))
      return
    }
    try {
      const supabase = createClient()
      const { error: storageError } = await supabase.storage.from('user-music').remove([file.storagePath])
      if (storageError) throw storageError
      const { error: rowError } = await supabase.from('user_music_tracks').delete().eq('id', file.id)
      if (rowError) throw rowError
      setPersonalMusicFiles((current) => current.filter((candidate) => candidate.id !== file.id))
      if (selectedTrackId === file.id) onRemoveTrackProp?.()
      toast.success('Music removed from your library')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to remove music')
    }
  }, [onRemoveTrackProp, selectedTrackId])

  const handlePersonalMusicMove = React.useCallback(async (file: PersonalMusicFile, folderName: string) => {
    if (!file.storagePath) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('user_music_tracks').update({ folder_name: folderName }).eq('id', file.id)
      if (error) throw error
      setPersonalMusicFiles((current) => current.map((candidate) => candidate.id === file.id ? { ...candidate, folderName } : candidate))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to organize music')
    }
  }, [])

  const handleLoadCloudMusic = React.useCallback(async (provider: CloudMusicFile['provider']) => {
    setCloudMusicLoading(provider)
    try {
      const response = await fetch(`/api/music/import?provider=${provider}`, { cache: 'no-store' })
      const payload = await response.json() as { files?: Omit<CloudMusicFile, 'provider'>[]; error?: string }
      if (!response.ok) throw new Error(payload.error || 'Unable to read connected storage.')
      setCloudMusicFiles((current) => [
        ...current.filter((file) => file.provider !== provider),
        ...(payload.files ?? []).map((file) => ({ ...file, provider })),
      ])
      if (!payload.files?.length) toast.message('No audio files found in this account.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to read connected storage.')
    } finally {
      setCloudMusicLoading(null)
    }
  }, [])

  const handleImportCloudMusic = React.useCallback(async (file: CloudMusicFile) => {
    setCloudImportingId(file.id)
    try {
      const response = await fetch('/api/music/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file),
      })
      const payload = await response.json() as { track?: PersonalMusicTrackRow; previewUrl?: string; error?: string }
      if (!response.ok || !payload.track || !payload.previewUrl) throw new Error(payload.error || 'Unable to import this file.')
      const imported = fromPersonalMusicTrackRow(payload.track, payload.previewUrl)
      setPersonalMusicFiles((current) => [imported, ...current.filter((candidate) => candidate.id !== imported.id)])
      setActiveCollection('my-music')
      toast.success(`Added ${imported.name} to your music library`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to import this file.')
    } finally {
      setCloudImportingId(null)
    }
  }, [])

  React.useEffect(() => {
    let disposed = false
    const unsubscribeFromCatalogProgress = subscribeToCatalogProgress((nextTracks) => {
      if (disposed || !nextTracks.length) return
      setCatalogTracks(nextTracks)
      setCatalogReady(true)
    })

    getCatalogTracks()
      .then((nextTracks) => {
        if (disposed) return
        setCatalogTracks(nextTracks)
        setCatalogReady(true)
      })
      .catch((error: unknown) => {
        if (disposed) return
        setCatalogTracks([])
        setCatalogReady(true)
        toast.error(error instanceof Error ? error.message : 'Unable to load music catalog')
      })
      .finally(() => {
        if (!disposed) setCatalogLoading(false)
      })

    return () => {
      disposed = true
      unsubscribeFromCatalogProgress()
    }
  }, [])

  const displayTracks = React.useMemo(() => {
    const personalTracks = personalMusicFiles.map(personalMusicRecommendation).filter((track): track is MusicRecommendation => Boolean(track))
    const sourceTracks = [...tracks, ...personalTracks, ...(catalogReady && catalogTracks.length ? catalogTracks : [])]
    const seen = new Set<string>()
    return sourceTracks.filter((track) => {
      if (seen.has(track.id)) return false
      seen.add(track.id)
      return true
    })
  }, [catalogReady, catalogTracks, personalMusicFiles, tracks])

  const availableGenres = React.useMemo(() => Array.from(new Set(displayTracks.map((track) => track.genre).filter(Boolean))).sort(), [displayTracks])

  const forVideoTracks = React.useMemo(() => {
    const videoCatalogTracks = catalogTracks
    if (!catalogReady || !videoCatalogTracks.length) return tracks

    const sourceById = new Map(videoCatalogTracks.map((track) => [track.id, track]))
    const recommendations = buildMusicRecommendationSet({
      query: initialPrompt,
      projectTitle,
      initialPrompt,
      videoContext,
      limit: videoCatalogTracks.length,
      catalog: videoCatalogTracks.map(toRecommendationCatalogTrack),
    }).recommendations

    const rankedTracks = recommendations.flatMap((recommendation) => {
      const sourceTrack = sourceById.get(recommendation.id)
      return sourceTrack
        ? [{
            ...sourceTrack,
            reason: recommendation.reason,
            matchScore: recommendation.matchScore,
            matchedTerms: recommendation.matchedTerms,
          }]
        : []
    })
    const rankedTrackIds = new Set(rankedTracks.map((track) => track.id))

    return [
      ...rankedTracks,
      ...videoCatalogTracks.filter((track) => !rankedTrackIds.has(track.id)),
    ]
  }, [catalogReady, catalogTracks, initialPrompt, projectTitle, tracks, videoContext])

  const collectionTracks = React.useMemo(() => {
    if (activeCollection === 'favorites') {
      return displayTracks.filter((track) => favoriteTrackIds.has(track.id))
    }

    if (activeCollection === 'for-video') return forVideoTracks

    if (activeCollection === 'premium') {
      const premium = displayTracks
        .filter((track) => (
          (track.qualityScore ?? 0) >= 88 ||
          track.license === 'owned' ||
          track.license === 'licensed' ||
          track.vibeTags.some((tag) => /cinematic|luxury|editorial/i.test(tag))
        ))
        .sort((left, right) => (right.qualityScore ?? 0) - (left.qualityScore ?? 0))
      return premium.length ? premium : [...displayTracks].sort((left, right) => (right.qualityScore ?? 0) - (left.qualityScore ?? 0)).slice(0, 8)
    }

    if (activeCollection === 'trending') {
      return [...displayTracks].sort((left, right) => (right.freshnessScore ?? 0) - (left.freshnessScore ?? 0))
    }

    return displayTracks
  }, [activeCollection, displayTracks, favoriteTrackIds, forVideoTracks])

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredTracks = React.useMemo(() => {
    let list = collectionTracks
    if (genreFilter) {
      list = list.filter((track) => track.genre?.toLowerCase() === genreFilter.toLowerCase())
    }
    if (moodFilter) {
      list = list.filter((track) => {
        const moodTags = (track as any).moodTags as string[] | undefined
        const vibeTags = (track as any).vibeTags as string[] | undefined
        return (
          track.mood?.toLowerCase() === moodFilter.toLowerCase() ||
          Boolean(moodTags?.some((m: string) => m.toLowerCase().includes(moodFilter.toLowerCase()))) ||
          Boolean(vibeTags?.some((v: string) => v.toLowerCase().includes(moodFilter.toLowerCase())))
        )
      })
    }
    if (durationFilter) {
      if (durationFilter === 'short') list = list.filter((track) => (track.durationSec ?? 0) < 180)
      else if (durationFilter === 'medium') list = list.filter((track) => (track.durationSec ?? 0) >= 180 && (track.durationSec ?? 0) <= 300)
      else if (durationFilter === 'long') list = list.filter((track) => (track.durationSec ?? 0) > 300)
    }
    if (!normalizedQuery) return list
    return list.filter((track) => {
      const anyTrack = track as unknown as Record<string, unknown>
      const title = track.title.toLowerCase()
      const artist = track.artist.toLowerCase()
      const genre = (track.genre ?? '').toLowerCase()
      const mood = (typeof track.mood === 'string' ? track.mood : '').toLowerCase()
      const category = (typeof anyTrack.category === 'string' ? anyTrack.category : '').toLowerCase()
      const genreTags = Array.isArray(anyTrack.genreTags) ? (anyTrack.genreTags as string[]) : []
      const moodTags = Array.isArray(anyTrack.moodTags) ? (anyTrack.moodTags as string[]) : []
      const tags = [
        ...genreTags,
        ...moodTags,
        ...(track.vibeTags ?? []),
      ].map((t) => t.toLowerCase())

      // 1. Direct substring match on any metadata field
      if (
        title.includes(normalizedQuery) ||
        artist.includes(normalizedQuery) ||
        genre.includes(normalizedQuery) ||
        mood.includes(normalizedQuery) ||
        category.includes(normalizedQuery) ||
        tags.some((t) => t.includes(normalizedQuery) || normalizedQuery.includes(t))
      ) {
        return true
      }

      // 2. Tokenized multi-word search
      const queryTokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 2)
      if (queryTokens.length > 0) {
        return queryTokens.some(
          (token) =>
            title.includes(token) ||
            artist.includes(token) ||
            genre.includes(token) ||
            mood.includes(token) ||
            category.includes(token) ||
            tags.some((t) => t.includes(token))
        )
      }

      return false
    })
  }, [collectionTracks, durationFilter, genreFilter, moodFilter, normalizedQuery])
  const visibleTracks = React.useMemo(() => filteredTracks.slice(0, visibleTrackCount), [filteredTracks, visibleTrackCount])

  React.useEffect(() => {
    setVisibleTrackCount(INITIAL_VISIBLE_TRACKS)
  }, [normalizedQuery])

  React.useEffect(() => {
    const trackIds = new Set(displayTracks.map((track) => track.id))
    if (!trackIds.size) {
      setLocalSelectedTrackId(null)
      setFocusedTrackId(null)
      return
    }

    const resolvedSelectedTrackId = selectedTrackId && trackIds.has(selectedTrackId) ? selectedTrackId : null
    setLocalSelectedTrackId((current) => resolvedSelectedTrackId ?? (current && trackIds.has(current) ? current : null))
    setFocusedTrackId((current) => resolvedSelectedTrackId ?? (current && trackIds.has(current) ? current : null))
  }, [displayTracks, selectedTrackId])

  const selectedTrack = React.useMemo(
    () => displayTracks.find((track) => track.id === localSelectedTrackId) ?? displayTracks.find((track) => track.id === selectedTrackId) ?? null,
    [displayTracks, localSelectedTrackId, selectedTrackId],
  )
  const focusedTrack = React.useMemo(
    () => filteredTracks.find((track) => track.id === focusedTrackId) ?? selectedTrack,
    [filteredTracks, focusedTrackId, selectedTrack],
  )
  const activeTrack = selectedTrack ?? focusedTrack
  const currentPlayerTrack = React.useMemo(
    () => displayTracks.find((track) => track.id === playingTrackId) ?? selectedTrack,
    [displayTracks, playingTrackId, selectedTrack],
  )
  // Keep progress and favorite updates from restarting the player's playback effect.
  const handlePlayerPlayingChange = React.useCallback((nextPlaying: boolean) => {
    setPlayingTrackId(nextPlaying ? currentPlayerTrack?.id ?? null : null)
  }, [currentPlayerTrack?.id])
  // The deck is a playback surface: its spinning artwork must follow audio, not
  // merely the track last focused in the catalog.
  const selectedSong = React.useMemo(
    () => (currentPlayerTrack ? buildSelectedSongDisplay(currentPlayerTrack) : null),
    [currentPlayerTrack],
  )
  const currentCardTrack = currentPlayerTrack ?? activeTrack
  React.useEffect(() => {
    setPlayerProgress({ currentTime: 0, duration: 0 })
    setSeekRequest(null)
  }, [currentCardTrack?.id])
  const handleTrackFocus = React.useCallback(
    (track: MusicRecommendation) => {
      setLocalSelectedTrackId(track.id)
      setFocusedTrackId(track.id)
      setPlayingTrackId((current) => (current && current !== track.id ? null : current))
    },
    [],
  )

  const handleTrackPlayPause = React.useCallback(
    (track: MusicRecommendation) => {
      setLocalSelectedTrackId(track.id)
      setFocusedTrackId(track.id)
      setPlayingTrackId((current) => (current === track.id ? null : track.id))
    },
    [],
  )

  const handlePersonalMusicSelect = React.useCallback((file: PersonalMusicFile) => {
    const track = personalMusicRecommendation(file)
    if (!track) return
    handleTrackFocus(track)
    setActiveCollection('my-music')
  }, [handleTrackFocus])

  const handlePersonalMusicPreview = React.useCallback((file: PersonalMusicFile) => {
    const track = personalMusicRecommendation(file)
    if (track) handleTrackPlayPause(track)
  }, [handleTrackPlayPause])

  const handlePlayerStep = React.useCallback(
    (direction: 'previous' | 'next', options: { shuffle: boolean }) => {
      const playlist = filteredTracks.length ? filteredTracks : displayTracks
      const governingTrack = currentPlayerTrack
      if (!playlist.length || !governingTrack) return

      const nextTrack = options.shuffle && playlist.length > 1
        ? playlist.filter((track) => track.id !== governingTrack.id)[Math.floor(Math.random() * (playlist.length - 1))]
        : playlist[(Math.max(0, playlist.findIndex((track) => track.id === governingTrack.id)) + (direction === 'next' ? 1 : -1) + playlist.length) % playlist.length]

      if (!nextTrack) return
      setLocalSelectedTrackId(nextTrack.id)
      setFocusedTrackId(nextTrack.id)
      setPlayingTrackId((current) => (current ? nextTrack.id : current))
    },
    [currentPlayerTrack, displayTracks, filteredTracks],
  )

  const toggleMultiSelect = React.useCallback((trackId: string) => {
    setSelectedTrackIds((current) => {
      const next = new Set(current)
      if (next.has(trackId)) next.delete(trackId)
      else next.add(trackId)
      return next
    })
  }, [])

  React.useEffect(() => {
    if (!selectedTrackIds.size) return

    const dismissSelection = (event: PointerEvent) => {
      if (event.target instanceof Node && selectionTrayRef.current?.contains(event.target)) return
      if (event.target instanceof Element && event.target.closest('[data-action="select-track"]')) return
      setSelectedTrackIds(new Set())
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedTrackIds(new Set())
    }

    document.addEventListener('pointerdown', dismissSelection, true)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissSelection, true)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [selectedTrackIds.size])

  const handleAutoMatch = React.useCallback(async () => {
    const trackIds = Array.from(selectedTrackIds)
    if (!trackIds.length) return

    setIsAutoMatching(true)
    try {
      const response = await fetch('/api/music/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIds, projectTitle, initialPrompt, videoContext }),
      })
      if (!response.ok) throw new Error('Unable to run AI Auto-Match')
      const data = (await response.json()) as MusicMatchResponse
      const matchedTrackIds = Array.isArray(data.matchedTrackIds)
        ? data.matchedTrackIds.filter((trackId): trackId is string => typeof trackId === 'string' && trackId.length > 0)
        : []
      const topMatch = matchedTrackIds.length ? displayTracks.find((track) => track.id === matchedTrackIds[0]) ?? null : null

      if (matchedTrackIds.length) {
        setSelectedTrackIds(new Set(matchedTrackIds))
      }

      if (topMatch) {
        handleTrackFocus(topMatch)
      }

      toast.success(topMatch ? `AI matched ${topMatch.title} as the top fit` : `AI ranked ${trackIds.length} selected tracks`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to run AI Auto-Match')
    } finally {
      setIsAutoMatching(false)
      setSelectedTrackIds(new Set())
    }
  }, [displayTracks, handleTrackFocus, initialPrompt, projectTitle, selectedTrackIds, videoContext])

  const timelineTrackId = editorial.timeline?.music?.track.id ?? selectedTrackId
  return (
    <motion.section
      aria-label={`${projectTitle} soundtrack selector`}
      data-variant={variant}
      className={styles.library}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: chamberEase }}
    >
      <header className={styles.header}>
        <div>
          <h1>Music Library</h1>
          <p>Find the perfect soundtrack for your video with AI-curated music.</p>
        </div>
        <div className={styles.searchBar}>
          <div className={styles.search}>
            <Search size={16} aria-hidden="true" />
            <input data-autonomous-target="music-search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search music, artist, mood, or genre..." aria-label="Search music, artist, mood, or genre" />
            {searchQuery ? <button type="button" className={styles.clearSearch} aria-label="Clear music search" onClick={() => setSearchQuery('')}><X size={15} /></button> : null}
          </div>
          <button type="button" className={styles.filterButton} onClick={() => setShowFilters(value => !value)} aria-label="Open music filters" aria-expanded={showFilters} aria-controls="music-library-filters"><SlidersHorizontal size={16} /></button>
        </div>
      </header>
      <MusicCollectionTabs
        activeTab={activeCollection}
        onChange={tab => { userChoseMusicCollection.current = true; setActiveCollection(tab) }}
        hasRecommendations={tracks.length > 0}
        moodFilter={moodFilter} onMoodChange={setMoodFilter}
        genreFilter={genreFilter} onGenreChange={setGenreFilter}
        durationFilter={durationFilter} onDurationChange={setDurationFilter}
        availableGenres={availableGenres}
      />
      {showFilters ? <div id="music-library-filters" className={styles.filterPopover} onKeyDown={event => { if (event.key === 'Escape') setShowFilters(false) }}>
        <label>Genre<select value={genreFilter} onChange={event => setGenreFilter(event.target.value)}><option value="">All genres</option>{availableGenres.map(genre => <option key={genre} value={genre}>{genre}</option>)}</select></label>
        <label>Mood<select value={moodFilter} onChange={event => setMoodFilter(event.target.value)}><option value="">All moods</option><option value="cinematic">Cinematic</option><option value="uplifting">Uplifting</option><option value="peaceful">Peaceful</option><option value="dark">Energetic</option><option value="minimal">Chill</option><option value="playful">Happy</option></select></label>
        <label>Duration<select value={durationFilter} onChange={event => setDurationFilter(event.target.value)}><option value="">Any length</option><option value="short">Under 3 min</option><option value="medium">3–5 min</option><option value="long">Over 5 min</option></select></label>
        {genreFilter || moodFilter || durationFilter ? <button type="button" className={styles.loadMore} onClick={() => { setGenreFilter(''); setMoodFilter(''); setDurationFilter('') }}>Clear filters</button> : null}
        <label className={styles.compareOption}><input type="checkbox" checked={compareMode} onChange={event => { setCompareMode(event.target.checked); setSelectedTrackIds(new Set()) }} /> Compare tracks with AI</label>
      </div> : null}

      {selectedSong ? <div className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0" aria-hidden="true">
        <MusicPlayer
          albumArt={selectedSong.artwork} albumArtPosition={selectedSong.artworkPosition}
          songTitle={selectedSong.title} audioSrc={selectedSong.audioSrc}
          preload="metadata" isMuted={isMuted} volume={volume / 100} repeat={isRepeat}
          seekRequest={seekRequest} isPlaying={playingTrackId === selectedSong.id}
          onBufferingChange={setIsPlayerBuffering} onProgressChange={setPlayerProgress}
          onPlayingChange={handlePlayerPlayingChange}
          className="h-px w-px"
        />
      </div> : null}

      <div className={styles.body}>
        <MusicLibraryPreview
          track={currentCardTrack}
          isPlaying={Boolean(currentCardTrack && playingTrackId === currentCardTrack.id)}
          isBuffering={isPlayerBuffering}
          currentTime={playerProgress.currentTime}
          duration={playerProgress.duration}
          isMuted={isMuted} volume={volume}
          isFavorite={Boolean(currentCardTrack && favoriteTrackIds.has(currentCardTrack.id))}
          isShuffle={isShuffle} isRepeat={isRepeat}
          isOnTimeline={Boolean(currentCardTrack && timelineTrackId === currentCardTrack.id)}
          canStep={(filteredTracks.length || displayTracks.length) > 1}
          onToggleFavorite={() => { if (currentCardTrack) toggleFavorite(currentCardTrack.id) }}
          onPlayPause={() => { if (currentCardTrack) handleTrackPlayPause(currentCardTrack) }}
          onPrevious={() => handlePlayerStep('previous', { shuffle: isShuffle })}
          onNext={() => handlePlayerStep('next', { shuffle: isShuffle })}
          onSeek={time => setSeekRequest({ time, token: Date.now() })}
          onMute={() => setIsMuted(value => !value)} onVolumeChange={setVolume}
          onShuffle={() => setIsShuffle(value => !value)} onRepeat={() => setIsRepeat(value => !value)}
          onAddToTimeline={() => {
            if (!currentCardTrack) return
            onSelectTrack(currentCardTrack)
            toast.success(`Added ${currentCardTrack.title} to timeline`)
          }}
          onRemoveFromTimeline={handleRemoveSoundtrack}
        />
        {activeCollection === 'my-music' ? <div className={styles.personalLibrary}>
          <MyMusicShelf
            files={personalMusicFiles} folders={personalMusicFolders} query={searchQuery}
            onCreateFolder={createPersonalMusicFolder} onFilesSelected={handlePersonalMusicUpload}
            onSelectTrack={handlePersonalMusicSelect} onPreviewTrack={handlePersonalMusicPreview}
            favoriteTrackIds={favoriteTrackIds} onToggleFavorite={toggleFavorite}
            onRemoveTrack={handlePersonalMusicRemove} onMoveTrack={handlePersonalMusicMove}
            selectedTrackId={localSelectedTrackId} playingTrackId={playingTrackId}
            cloudFiles={cloudMusicFiles} cloudLoading={cloudMusicLoading} cloudImportingId={cloudImportingId}
            onLoadCloudFiles={handleLoadCloudMusic} onImportCloudFile={handleImportCloudMusic}
          />
        </div> : <div className={styles.trackList} aria-label="Music tracks">
          <div className={styles.tableHeader} aria-hidden="true">
            <span>#</span><span>Title / Artist</span><span className={styles.genre}>Genre</span><span className={styles.mood}>Mood</span><span>Duration</span><span /><span /><span />
          </div>
          {catalogLoading && !visibleTracks.length ? <div className={styles.emptyList}><CinematicLogoLoader variant="inline" size={48} label="Loading music catalog" /><span>Preparing soundtrack previews.</span></div> : null}
          {visibleTracks.map((track, index) => <MusicLibraryTrackRow
            key={track.id} track={track} index={index + 1}
            isSelected={currentCardTrack?.id === track.id} isPlaying={playingTrackId === track.id}
            isFavorite={favoriteTrackIds.has(track.id)} onToggleFavorite={() => toggleFavorite(track.id)}
            isCompared={selectedTrackIds.has(track.id)} compareMode={compareMode}
            onSelect={() => handleTrackFocus(track)}
            onPlayPause={() => handleTrackPlayPause(track)}
            onToggleCompared={() => toggleMultiSelect(track.id)}
          />)}
          {!catalogLoading && !filteredTracks.length ? <div className={styles.emptyList}><strong>{activeCollection === 'favorites' && !favoriteTrackIds.size ? 'No favorites yet' : 'No soundtracks found'}</strong><span>{activeCollection === 'favorites' && !favoriteTrackIds.size ? 'Tap the star beside any track to save it here.' : 'Try a different song, artist, mood, or genre.'}</span></div> : null}
          {filteredTracks.length > visibleTrackCount ? <button type="button" className={styles.loadMore} onClick={() => setVisibleTrackCount(current => current + VISIBLE_TRACK_INCREMENT)}>Load more</button> : null}
        </div>}
      </div>

      {selectedTrackIds.size > 0 ? <div ref={selectionTrayRef} className={styles.compareTray}>
        <span>{selectedTrackIds.size} tracks selected</span>
        <button type="button" className={styles.quietButton} aria-label="Clear selected tracks" onClick={() => setSelectedTrackIds(new Set())}><X size={16} /></button>
        <button type="button" className={styles.addButton} disabled={isAutoMatching} onClick={() => void handleAutoMatch()}><Sparkles size={15} aria-hidden="true" />{isAutoMatching ? 'Analyzing compatibility…' : 'AI Auto-Match'}</button>
      </div> : null}
    </motion.section>
  )
}
