'use client'

import type { EditorActionDraft } from '@/lib/editor-actions'
import type { ChatEditorContext } from '@/lib/prometheus-assistant/editor-context'
import type { VoiceActionResult, VoiceMusicTrack } from './music-controls'
import type { VoiceEditResult } from './edit-results'
import type { AppliedReferenceStyle } from '@/lib/editor/reference-style'
import type { EditorialPlan } from '@/lib/editor/timeline-document'

export interface JarvisVoiceState {
  status: 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'interrupted' | 'error'
  isSpeaking: boolean
  isListening: boolean
  isActive: boolean
}

/**
 * Shared registry that lets the editor page expose live state + action handlers
 * to any VoiceCompanion instance (including the global filament, which mounts
 * outside the editor tree and therefore receives no props).
 */
export interface VoiceCompanionBridgeHandlers {
  projectId?: string
  sourceAssetId?: string | null
  onApplyReferenceStyle?: (style: AppliedReferenceStyle) => Promise<VoiceActionResult>
  onApplyEditorialPlan?: (plan: EditorialPlan) => Promise<VoiceActionResult>
  contextProvider?: () => ChatEditorContext | null
  onApplyActions?: (drafts: EditorActionDraft[]) => Promise<void> | void
  /** Opens export preflight or submits render; returns whether render was accepted or preflight opened. */
  onStartRender?: (mode: 'preview' | 'final', prompt?: string) => Promise<{ success: boolean; summary: string; renderInitiated?: boolean }>
  /** Autonomous AI manifest modification */
  onModifyManifest?: (instruction: string) => Promise<{ success: boolean; summary: string; diff?: unknown }>
  /** Opens the export preflight without submitting a job or changing the timeline. */
  onReviewExportReadiness?: () => Promise<{ success: boolean; summary: string }>
  /** Read current sync facts on demand, independently of the source render job. */
  getTimelineSyncState?: () => {
    status: 'loading' | 'saving' | 'saved' | 'error'
    revision: number | null
    sourceAssetId: string | null
    error: string | null
  }
  onSeek?: (timeSec: number) => Promise<void> | void
  onPlay?: () => Promise<void> | void
  onPause?: () => Promise<void> | void
  onMute?: () => Promise<void> | void
  onUnmute?: () => Promise<void> | void
  onTabChange?: (tab: 'Editor' | 'Music' | 'Motion') => Promise<void> | void
  onFitModeChange?: (mode: 'fill' | 'fit') => Promise<void> | void
  /** True when the editor has enabled autonomous agent takeover. */
  isTakeoverEnabled?: boolean
  /** Toggles the editor's agent takeover mode (mutating action gate). */
  onToggleTakeover?: () => void
  /** Pre-briefed transcript text and segments from AssemblyAI/source */
  transcriptText?: string
  transcriptSegments?: unknown
  /** User brand context and stylistic DNA */
  brandProfile?: unknown
  /** Direct word cut handler for transcript inline strike-out ("read canceled out") */
  onToggleCutWord?: (segmentId: string, wordIndex: number) => VoiceEditResult | void
  onToggleCutSegment?: (segmentId: string) => VoiceEditResult | void
  onCutTranscriptWord?: (segmentId: string, wordIndex: number) => VoiceEditResult
  onCutTranscriptSegment?: (segmentId: string) => VoiceEditResult
  onCutTranscriptPhrase?: (phrase: string) => VoiceEditResult
  onReplaceTranscriptPhrase?: (targetPhrase: string, replacementPhrase: string) => VoiceEditResult | Promise<VoiceEditResult>
  onCutSilence?: (minDurationSec?: number, targetDurationSec?: number) => Promise<VoiceEditResult> | VoiceEditResult
  onRemoveFillerWords?: () => Promise<VoiceEditResult> | VoiceEditResult
  /** Direct music track staging and audition handlers */
  getMusicCatalog?: () => VoiceMusicTrack[]
  searchMusicTracks?: (query: string, options?: { recommendation?: boolean }) => Promise<VoiceMusicTrack[]>
  getActiveWorkspaceTab?: () => 'Editor' | 'Music' | 'Motion'
  onSelectMusicTrack?: (trackId: string) => Promise<VoiceActionResult> | VoiceActionResult | void
  onPlayMusicPreview?: (trackId: string) => Promise<VoiceActionResult> | VoiceActionResult | void
  onStopMusicPlayback?: () => Promise<VoiceActionResult> | VoiceActionResult
  onSetMusicMuted?: (muted: boolean) => Promise<VoiceActionResult> | VoiceActionResult
  /** Confirmed soundtrack mix and caption mutations; optional for older bridge clients. */
  onSetMusicVolume?: (volume: number) => Promise<VoiceActionResult> | VoiceActionResult
  onSetMusicDucking?: (enabled: boolean) => Promise<VoiceActionResult> | VoiceActionResult
  onRemoveMusicTrack?: () => Promise<VoiceActionResult> | VoiceActionResult
  onApplyCaptionStyle?: (style: 'clean_bold' | 'karaoke_pop' | 'typewriter' | 'lower_third') => Promise<VoiceActionResult>
  onRequestTranscription?: () => Promise<VoiceActionResult & { pending?: boolean }>
  getMusicState?: () => { trackId: string | null; title: string | null; volume: number; muted: boolean; ducking: boolean }
  /** Capture the current decoded source frame as a JPEG data URL for live visual analysis. */
  captureVideoFrame?: (timeSec: number) => Promise<string | null>
  /** Inferred video mood, tempo, and audio energy context */
  videoMusicContext?: unknown
  /** Video existence and project metadata across all tabs */
  hasVideo?: boolean
  videoTitle?: string
  videoDurationSec?: number
  timelineDurationSec?: number
  sourceMediaState?: 'ready' | 'loading' | 'missing' | 'unavailable' | 'non_video'
  videoThumbnailUrl?: string
  activeThumbnailUrl?: string
  activeThumbnailHeadline?: string
  onModifyThumbnail?: (args: { changes: string; headline?: string; referenceId?: string }) => Promise<VoiceActionResult> | VoiceActionResult
  /** Live thumbnail studio state and progress percentage (0-100%) */
  getThumbnailState?: () => {
    isOpen: boolean
    isGenerating: boolean
    percent: number
    stage: string
    headline?: string | null
    thumbnailUrl?: string | null
    referenceId?: string | null
  }
  /** Timeline inspection & autonomous manipulation */
  getTimelineState?: () => {
    duration: number
    currentTime: number
    clips: Array<{ id: string; start: number; end: number; title: string }>
    selectedClipId: string | null
    cutRanges: Array<{ start: number; end: number }>
    tracks: {
      videoHidden: boolean
      captionsHidden: boolean
      textHidden: boolean
      musicHidden: boolean
      soundtrackMuted: boolean
    }
  }
  onSplitClip?: (timeSec?: number) => Promise<VoiceActionResult> | VoiceActionResult
  onTrimClip?: (clipId: string, side: 'left' | 'right', newTimeSec: number) => Promise<VoiceActionResult> | VoiceActionResult
  onDeleteClip?: (clipId?: string) => Promise<VoiceActionResult> | VoiceActionResult
  onDuplicateClip?: (clipId?: string) => Promise<VoiceActionResult> | VoiceActionResult
  onToggleTrackVisibility?: (track: 'video' | 'captions' | 'text' | 'music') => Promise<VoiceActionResult> | VoiceActionResult
  onToggleTrackMute?: (track: 'video' | 'music') => Promise<VoiceActionResult> | VoiceActionResult
  /** Optional auth token or resolver for authenticated status checks */
  accessToken?: string
  getAccessToken?: () => Promise<string | undefined> | string | undefined
  /** Live chat voice state for top nav filament audio responsiveness */
  chatVoiceState?: {
    isRecording?: boolean
    isSpeaking?: boolean
    getLevel?: () => number | null
  }
  /** Live Jarvis companion voice state */
  jarvisVoiceState?: JarvisVoiceState
}

let currentHandlers: VoiceCompanionBridgeHandlers = {}
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function registerVoiceCompanionBridge(handlers: VoiceCompanionBridgeHandlers): void {
  currentHandlers = { ...currentHandlers, ...handlers }
  if (handlers.chatVoiceState === undefined && 'chatVoiceState' in handlers) {
    delete currentHandlers.chatVoiceState
  }
  if (handlers.jarvisVoiceState === undefined && 'jarvisVoiceState' in handlers) {
    delete currentHandlers.jarvisVoiceState
  }
  notify()
}

export function unregisterVoiceCompanionBridge(): void {
  // Retain active chat voice state and jarvis voice state so editor timeline refreshes do not sever voice reactivity
  const retainedChatVoiceState = currentHandlers.chatVoiceState
  const retainedJarvisVoiceState = currentHandlers.jarvisVoiceState
  currentHandlers = {
    ...(retainedChatVoiceState ? { chatVoiceState: retainedChatVoiceState } : {}),
    ...(retainedJarvisVoiceState ? { jarvisVoiceState: retainedJarvisVoiceState } : {}),
  }
  notify()
}

export function getVoiceCompanionBridge(): VoiceCompanionBridgeHandlers {
  return currentHandlers
}

export function isVoiceInteractionActive(handlers: VoiceCompanionBridgeHandlers = currentHandlers): boolean {
  const jarvis = handlers.jarvisVoiceState
  const chat = handlers.chatVoiceState
  const isJarvisActive = Boolean(jarvis?.isActive || jarvis?.isSpeaking || jarvis?.isListening)
  const isChatActive = Boolean(chat?.isRecording || chat?.isSpeaking)
  return isJarvisActive || isChatActive
}

export function isVoiceActivelyListening(handlers: VoiceCompanionBridgeHandlers = currentHandlers): boolean {
  const jarvis = handlers.jarvisVoiceState
  const chat = handlers.chatVoiceState
  return Boolean(jarvis?.isListening || chat?.isRecording)
}

export function isVoiceSpeaking(handlers: VoiceCompanionBridgeHandlers = currentHandlers): boolean {
  const jarvis = handlers.jarvisVoiceState
  const chat = handlers.chatVoiceState
  return Boolean(jarvis?.isSpeaking || chat?.isSpeaking)
}

export function subscribeVoiceCompanionBridge(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
