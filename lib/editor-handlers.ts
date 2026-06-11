'use client'

import * as React from 'react'
import type { 
  Project, 
  ProcessingJob, 
  MusicVideoContext, 
  CreativeMetadata, 
  AnimationPlan,
  TranscriptStatus,
  MusicRecommendation
} from '@/lib/types'
import type { StyleTemplate } from '@/lib/styles/style-templates'
import { STYLE_TEMPLATES } from '@/lib/styles/style-templates'

// Re-export buildMusicRecommendationSet
export { buildMusicRecommendationSet } from '@/lib/music-recommendation-core'

// Storage keys
export function chatEntriesStorageKey(projectId: string) {
  return `prometheus.editor.chat-entries.v1.${projectId}`
}
export function musicPreferenceStorageKey(projectId: string) {
  return `prometheus.editor.music-preference.v1.${projectId}`
}
export function stagedMusicStorageKey(projectId: string) {
  return `prometheus.editor.staged-music.v1.${projectId}`
}
export function musicPreviewVolumeStorageKey(projectId: string) {
  return `prometheus.editor.music-preview-volume.v1.${projectId}`
}
export function selectedEditorMusicStorageKey(projectId: string) {
  return `prometheus.editor.selected-track.v1.${projectId}`
}

export function clampMusicPreviewVolume(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function isMusicIntent(value: string) {
  const normalized = value.trim().toLowerCase()
  return (
    normalized.includes('music') ||
    normalized.includes('soundtrack') ||
    normalized.includes('song') ||
    normalized.includes('track') ||
    normalized.includes('audio') ||
    normalized.includes('beat') ||
    normalized.includes('vibe') ||
    normalized.includes('energy') ||
    normalized.includes('mood')
  )
}

export function isGenericMusicRequest(value: string) {
  const normalized = value.trim().toLowerCase()
  return (
    normalized === 'add music' ||
    normalized === 'find music' ||
    normalized === 'suggest music' ||
    normalized === 'change music' ||
    normalized === 'background music'
  )
}

export function isEditIntent(value: string) {
  const normalized = value.trim().toLowerCase()
  return (
    normalized.includes('edit') ||
    normalized.includes('cut') ||
    normalized.includes('trim') ||
    normalized.includes('pace') ||
    normalized.includes('hook') ||
    normalized.includes('vibe') ||
    normalized.includes('style')
  )
}

export function removeChatEntry(entries: any[], entryId: string) {
  return entries.filter((e) => e.id !== entryId)
}

export function debugEditorPreview(event: string, detail?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return
  console.debug('[editor-preview]', event, detail ?? {})
}

export function buildAssistantReply({
  projectTitle,
  originalPrompt,
  sourceCount,
  input,
}: {
  projectTitle: string
  originalPrompt: string
  sourceCount: number
  input: string
}) {
  const normalized = input.trim().toLowerCase()
  const original = originalPrompt.trim() || 'shape the clip into a clearer final edit'
  const sourceNote =
    sourceCount > 0 ? ` I'm also holding ${sourceCount} staged source reference${sourceCount > 1 ? 's' : ''}.` : ''

  if (normalized.includes('pacing') || normalized.includes('cut')) {
    return `Adjusting the rhythm for "${projectTitle}". I'll focus on tightening the transitions and ensuring the ${original} hits the right beats.${sourceNote}`
  }

  return `I'm on it. I'll refine "${projectTitle}" based on your request: "${input}". Tuning the motion and style to make sure the ${original} feels intentional.${sourceNote}`
}

export function buildMusicReply({
  projectTitle,
  videoContext,
  input,
}: {
  projectTitle: string
  videoContext: MusicVideoContext
  input: string
}) {
  return `Scanning the catalog for "${projectTitle}". Based on your request for "${input}", I'm prioritizing tracks that match the energy of your edit.`
}

export function selectEditStyleTemplate(
  prompt: string,
  videoContext: MusicVideoContext,
  metadata?: CreativeMetadata,
): StyleTemplate {
  const contextText = `${prompt} ${videoContext.summary} ${metadata?.styleId || ''}`.toLowerCase()

  let bestTemplate = STYLE_TEMPLATES[0]!
  let highestScore = -1

  for (const template of STYLE_TEMPLATES) {
    const score = scoreEditStyleTemplate(template, contextText, videoContext, metadata)
    if (score > highestScore) {
      highestScore = score
      bestTemplate = template
    }
  }

  return bestTemplate
}

export function scoreEditStyleTemplate(
  template: StyleTemplate,
  contextText: string,
  videoContext: MusicVideoContext,
  metadata?: CreativeMetadata,
): number {
  let score = 0
  const name = template.name.toLowerCase()
  const tags = template.tags.map((t) => t.toLowerCase())

  if (contextText.includes(name)) score += 50
  for (const tag of tags) {
    if (contextText.includes(tag)) score += 10
  }

  if (metadata?.intensity && Number(metadata.intensity) > 0.7 && tags.includes('bold')) score += 20

  return score
}

export function buildEditQuickActionPrompt(
  projectTitle: string,
  videoContext: MusicVideoContext,
  styleTemplate: StyleTemplate,
) {
  return `Perform an editorial pass on "${projectTitle}" using the ${styleTemplate.name} framework. Ensure the flow remains intact while emphasizing ${styleTemplate.tags.slice(0, 2).join(' and ')} qualities.`
}

export function buildEditAssistantReply({
  projectTitle,
  styleTemplate,
  input,
}: {
  projectTitle: string
  styleTemplate: StyleTemplate
  input: string
}) {
  return `Initiating an edit pass for "${projectTitle}". I'll apply the ${styleTemplate.name} framework to match your request: "${input}".`
}

export function buildFallbackEditAnimationPlan({
  projectId,
  projectTitle,
  prompt,
  jobId,
  sourceLabel,
  styleTemplate,
}: {
  projectId: string
  projectTitle: string
  prompt: string
  jobId: string
  sourceLabel: string | null
  styleTemplate: StyleTemplate
}): AnimationPlan {
  return {
    engineVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    registrySignature: 'fallback',
    safeZonePolicy: {
      landscapeOnly: false,
      avoidSpeakerFace: true,
      captionBottomPaddingPct: 10,
      maxCaptionWidthPct: 80,
    },
    speechCues: [],
    transitionCues: [],
    explainerCues: [],
    backgroundCues: [],
    counterCues: [],
    sfxCues: [],
  }
}

export function buildMusicQuickActionPrompt(projectTitle: string, videoContext: MusicVideoContext) {
  return `Find a soundtrack for "${projectTitle}" that matches its vibe.`
}

export function buildViralClipQuickActionPrompt({
  projectTitle,
  originalPrompt,
  sourceCount,
  transportTime,
  videoContext,
}: {
  projectTitle: string
  originalPrompt: string
  sourceCount: number
  transportTime: string
  videoContext: MusicVideoContext
}) {
  return `Extract high-impact viral clips from "${projectTitle}" (Source: ${sourceCount} files, Length: ${transportTime}). The original direction was "${originalPrompt}".`
}

export function buildProvidedTranscript(job: ProcessingJob | null) {
  if (!job?.artifacts.transcript) return null
  return job.artifacts.transcript
}

export function buildVideoMusicContext({
  projectTitle,
  promptText,
  sourceProfile,
  job,
  sourceList,
}: {
  projectTitle: string
  promptText: string
  sourceProfile: any
  job: ProcessingJob | null
  sourceList: string[]
}): MusicVideoContext {
  const summary = promptText || 'A cinematic composition.'

  return {
    summary,
    pace: 'medium',
    signals: [],
  }
}

export function buildMusicSourceLabel(sourceUrl: string) {
  if (!sourceUrl) return 'Unknown'
  const parts = sourceUrl.split('/')
  return parts[parts.length - 1] || 'Track'
}

export function inferVideoPace(
  summary: string,
  sourceProfile: any,
): 'fast' | 'medium' | 'slow' {
  const text = summary.toLowerCase()
  if (hasAny(text, ['fast', 'dynamic', 'action', 'quick', 'energy'])) return 'fast'
  if (hasAny(text, ['slow', 'calm', 'peaceful', 'ambient', 'smooth'])) return 'slow'

  if (sourceProfile?.processingClass === 'high_motion') return 'fast'
  if (sourceProfile?.processingClass === 'static') return 'slow'

  return 'medium'
}

export function normalizeInlineText(value: string) {
  return value.trim().toLowerCase()
}

export function hasAny(text: string, needles: string[]) {
  return needles.some((n) => text.includes(n))
}

export function sanitizeAssistantReply(value: string) {
  return value.replace(/\[INST\]/g, '').replace(/\[\/INST\]/g, '').trim()
}

export function extractGroqStreamText(payload: unknown) {
  if (typeof payload !== 'object' || !payload) return null
  const data = payload as any
  return data.choices?.[0]?.delta?.content || null
}

export function safeJsonParse(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
