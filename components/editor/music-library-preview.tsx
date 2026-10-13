'use client'

import * as React from 'react'
import Image from 'next/image'
import { Check, Heart, MoreHorizontal, Music, Pause, Play, Plus, Repeat, Shuffle, SkipBack, SkipForward, Trash2, Volume2, VolumeX } from 'lucide-react'
import { FALLBACK_ALBUM_ART } from '@/lib/music-art'
import type { MusicRecommendation } from '@/lib/types'
import styles from './music-library.module.css'

export function formatMusicTime(seconds = 0) {
  const time = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`
}

function Artwork({ track, className }: { track: MusicRecommendation; className: string }) {
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [track.id, track.coverArtUrl])
  return <div className={className}>
    {failed ? <Music aria-hidden="true" size={24} /> : <Image src={track.coverArtUrl || FALLBACK_ALBUM_ART} alt="" fill sizes="104px" className={styles.coverImage} style={{ objectPosition: track.coverArtPosition || 'center' }} onError={() => setFailed(true)} />}
  </div>
}

type PreviewProps = {
  track: MusicRecommendation | null
  isPlaying: boolean
  isBuffering: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isFavorite: boolean
  isShuffle: boolean
  isRepeat: boolean
  isOnTimeline: boolean
  canStep: boolean
  onPlayPause: () => void
  onPrevious: () => void
  onNext: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onMute: () => void
  onToggleFavorite: () => void
  onShuffle: () => void
  onRepeat: () => void
  onAddToTimeline: () => void
  onRemoveFromTimeline: () => void
}

export function MusicLibraryPreview(props: PreviewProps) {
  const [showOptions, setShowOptions] = React.useState(false)
  const optionsRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!showOptions) return
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !optionsRef.current?.contains(event.target)) setShowOptions(false)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowOptions(false) }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [showOptions])
  React.useEffect(() => setShowOptions(false), [props.track?.id])
  const { track } = props
  if (!track) return <aside className={`${styles.preview} ${styles.emptyPreview}`} aria-label="Soundtrack preview">
    <span className={styles.emptyIcon}><Music aria-hidden="true" size={28} /></span>
    <h2>Preview your soundtrack</h2>
    <p>Choose a track to see its details and hear a preview.</p>
    <span className={styles.hint}>Use the play button to listen.</span>
  </aside>

  const duration = props.duration || track.durationSec || 0
  const currentTime = Math.min(props.currentTime, duration)
  return <aside className={styles.preview} aria-label="Soundtrack preview" data-preview-track-id={track.id}>
    <div className={styles.trackDetails}>
      <Artwork track={track} className={styles.previewArtwork} />
      <div className={styles.previewMetadata}>
        <h2 title={track.title}>{track.title}</h2>
        <p>{track.artist || 'Unknown Artist'}</p>
        <span className={styles.previewBadge}><Play aria-hidden="true" size={12} fill="currentColor" /> Selected for preview</span>
        <span className={styles.trackLength}>{track.sourcePlatform === 'online' ? 'Preview' : 'Full track'} · {formatMusicTime(duration)}</span>
      </div>
      <div className={styles.options} ref={optionsRef}>
        <button type="button" className={styles.quietButton} aria-label="More soundtrack options" aria-expanded={showOptions} onClick={() => setShowOptions(value => !value)}><MoreHorizontal size={17} /></button>
        {showOptions ? <div className={styles.optionsMenu}>
          <button type="button" aria-pressed={props.isFavorite} onClick={props.onToggleFavorite}><Heart size={15} /> {props.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</button>
          <button type="button" aria-pressed={props.isShuffle} onClick={props.onShuffle}><Shuffle size={15} /> Shuffle {props.isShuffle ? 'on' : 'off'}</button>
          <button type="button" aria-pressed={props.isRepeat} onClick={props.onRepeat}><Repeat size={15} /> Repeat {props.isRepeat ? 'on' : 'off'}</button>
          {props.isOnTimeline ? <button type="button" onClick={props.onRemoveFromTimeline}><Trash2 size={15} /> Remove from timeline</button> : null}
        </div> : null}
      </div>
    </div>
    <div className={styles.seekRow}>
      <span>{formatMusicTime(currentTime)}</span>
      <input type="range" min="0" max={duration || 1} step="0.1" value={currentTime} disabled={!duration} onChange={event => props.onSeek(Number(event.target.value))} aria-label={`Seek ${track.title}`} />
      <span>{formatMusicTime(duration)}</span>
    </div>
    <div className={styles.transport}>
      <button type="button" className={styles.primaryPlay} onClick={props.onPlayPause} aria-label={props.isPlaying ? `Pause ${track.title}` : `Play ${track.title}`} aria-busy={props.isBuffering && props.isPlaying}>{props.isPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button>
      <button type="button" className={styles.quietButton} disabled={!props.canStep} onClick={props.onPrevious} aria-label="Previous track"><SkipBack size={17} /></button>
      <button type="button" className={styles.quietButton} disabled={!props.canStep} onClick={props.onNext} aria-label="Next track"><SkipForward size={17} /></button>
      <div className={styles.volume}>
        <span>Preview volume</span>
        <button type="button" className={styles.quietButton} onClick={props.onMute} aria-label={props.isMuted ? 'Unmute soundtrack preview' : 'Mute soundtrack preview'}>{props.isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
        <input type="range" min="0" max="100" value={props.isMuted ? 0 : props.volume} onChange={event => props.onVolumeChange(Number(event.target.value))} aria-label="Music preview volume" />
        <span>{props.isMuted ? 0 : props.volume}%</span>
      </div>
    </div>
    <button type="button" className={styles.addButton} onClick={props.onAddToTimeline}><Plus aria-hidden="true" size={17} /> {props.isOnTimeline ? 'Added to timeline' : 'Add to timeline'}</button>
    <p className={styles.previewNote} aria-live="polite">{props.isBuffering && props.isPlaying ? 'Loading preview…' : 'Previewing does not change your project.'}</p>
  </aside>
}

export function MusicLibraryTrackRow({ track, index, isSelected, isPlaying, isCompared, compareMode, onSelect, onPlayPause, onToggleCompared }: {
  track: MusicRecommendation
  index: number
  isSelected: boolean
  isPlaying: boolean
  isCompared: boolean
  compareMode: boolean
  onSelect: () => void
  onPlayPause: () => void
  onToggleCompared: () => void
}) {
  return <div className={`${styles.trackRow} ${isSelected ? styles.selectedRow : ''}`} data-track-id={track.id}>
    <span className={styles.rowIndex}>{index}</span>
    <button type="button" className={styles.trackIdentity} data-autonomous-target="music-track" onClick={onSelect} aria-label={`Preview ${track.title}`} aria-pressed={isSelected}>
      <Artwork track={track} className={styles.rowArtwork} />
      <span className={styles.rowMetadata}><strong title={track.title}>{track.title}</strong><span>{track.artist || 'Unknown Artist'}</span></span>
    </button>
    <span className={`${styles.pill} ${styles.genre}`} title={track.genre}>{track.genre || 'Music'}</span>
    <span className={`${styles.pill} ${styles.mood}`}>{track.mood ? track.mood.charAt(0).toUpperCase() + track.mood.slice(1) : 'Cinematic'}</span>
    <span className={styles.rowDuration}>{formatMusicTime(track.durationSec)}</span>
    <button type="button" className={styles.rowPlay} data-action="play-track" data-autonomous-target="music-play" aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`} onClick={onPlayPause}>{isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>
    <button type="button" className={`${styles.rowSelect} ${(compareMode ? isCompared : isSelected) ? styles.checked : ''}`} data-action="select-track" data-autonomous-target="music-select" aria-label={compareMode ? `${isCompared ? 'Deselect' : 'Compare'} ${track.title}` : `Select ${track.title} for preview`} aria-pressed={compareMode ? isCompared : isSelected} onClick={compareMode ? onToggleCompared : onSelect}>{(compareMode ? isCompared : isSelected) ? <Check size={16} /> : <Plus size={16} />}</button>
  </div>
}
