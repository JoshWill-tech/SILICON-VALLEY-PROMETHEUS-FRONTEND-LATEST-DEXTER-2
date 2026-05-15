import type { CreativeMetadata } from './types'
import type { EditDNAProfile } from './edit-dna-router'
import type { CompiledEditBrief, TranscriptStatus } from '@/lib/types'

interface CompileEditBriefInput {
  metadata?: CreativeMetadata
  editDNA?: EditDNAProfile
  transcriptText?: string
  transcriptStatus?: TranscriptStatus
  transcriptR2Key?: string
  videoDurationSeconds?: number
  projectTitle?: string
}

export function compileEditBrief(input: CompileEditBriefInput): CompiledEditBrief {
  const { metadata, editDNA, transcriptText, transcriptStatus = 'idle', transcriptR2Key, videoDurationSeconds = 0, projectTitle = 'Untitled' } = input
  
  const transcriptAvailable = Boolean((transcriptText || transcriptR2Key) && transcriptStatus === 'completed')
  
  // Define progress steps based on status
  const progressSteps = [
    'Initializing creative brief',
    transcriptStatus === 'completed' ? 'Transcript analyzed' : 'Waiting for transcript',
    'Applying Edit DNA: ' + (editDNA?.energy || 'Standard'),
    transcriptR2Key ? 'Source DNA indexed' : 'Readying preview payload'
  ]

  // Consolidate avoid list
  const avoid = Array.from(new Set([
    'Avoid generic or repetitive patterns',
    'Do not repeat captions unnecessarily',
    ...(metadata?.optionalNotes?.toLowerCase().includes('avoid') ? [metadata.optionalNotes] : [])
  ]))

  // Build the full prompt
  const fullPrompt = [
    `Project: ${projectTitle}`,
    `Big Vision: ${metadata?.bigVision || 'Polished professional edit'}`,
    `Goals: ${metadata?.goals?.join(', ') || 'General improvement'}`,
    `Focus Areas: ${metadata?.focusAreas?.join(', ') || 'Balanced'}`,
    `Pacing: ${editDNA?.pacing || 'Natural'}`,
    `Tone: ${editDNA?.tone || 'Professional'}`,
    `Transcript Context: ${transcriptAvailable ? 'Available and used for strategic cuts' : 'Not yet processed'}`,
    `Notes: ${metadata?.optionalNotes || 'None'}`
  ].join('\n')

  return {
    title: `${editDNA?.energy || 'Professional'} Edit Brief`,
    summary: `A ${editDNA?.pacing || 'balanced'} pass focused on ${metadata?.goals?.[0] || 'clarity'} and ${metadata?.focusAreas?.[0] || 'visual polish'}.`,
    fullPrompt,
    previewPrompt: `Create a 15-20s high-impact preview centered on: ${metadata?.goals?.[0] || 'the core message'}.`,
    previewDurationSeconds: 20,
    transcriptStatus,
    transcriptUsed: transcriptAvailable,
    progressSteps,
    renderInstructions: {
      pacing: editDNA?.pacing || 'balanced',
      captions: editDNA?.captionStyle || 'standard',
      motion: editDNA?.motionIntensity || 'medium',
      broll: editDNA?.brollDensity || 'medium',
      music: editDNA?.musicEnergy || 'balanced',
      color: editDNA?.colorMood || 'natural',
      transitions: editDNA?.transitionStyle || 'smooth',
      typography: editDNA?.typographyTone || 'modern'
    },
    avoid,
    viewerPsychology: metadata?.goals?.includes('retention') 
      ? 'The viewer needs constant visual novelty to maintain interest.' 
      : 'The viewer seeks clarity and authoritative insight.'
  }
}
