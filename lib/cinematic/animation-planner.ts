import type {
  AnimationPlan,
  BRollSuggestion,
  CinematicAssetRegistry,
  CinematicTemplateAsset,
  CounterCue,
  DetectedScene,
  ExplainerCue,
  HighlightTimestamp,
  ProcessingJobInput,
  SpeechCue,
  SpeechCueAccentTone,
  SpeechCueTreatment,
  StyleTemplate,
  TranscriptSegment,
  TransitionCue,
  BackgroundCue,
  SfxCue,
} from '@/lib/types'

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
  const promptCopy = prompt.trim().length > 0 ? prompt.trim() : 'Edit this video.'
  const trimmedPrompt = promptCopy.length > 76 ? `${promptCopy.slice(0, 73)}...` : promptCopy

  const speechCues: SpeechCue[] = [
    {
      id: `${projectId}_edit_caption_0`,
      variant: 'heading',
      startMs: 0,
      endMs: 2200,
      text: projectTitle,
      leadText: 'Edit job live',
      accentText: styleTemplate.name,
      trailingText: `Job ${jobId.slice(0, 8)}`,
      treatment: 'boxed',
      tone: 'ice',
      region: 'center-stage',
      alignment: 'left',
      maxWidthPct: 66,
    },
    {
      id: `${projectId}_edit_caption_1`,
      variant: 'caption',
      startMs: 1200,
      endMs: 3600,
      text: trimmedPrompt,
      leadText: 'Prompt lane',
      accentText: trimmedPrompt,
      trailingText: sourceLabel ? `Rendering on ${sourceLabel}.` : 'Rendering on the imported media.',
      treatment: 'highlight',
      tone: 'lime',
      region: 'safe-lower-third',
      alignment: 'center',
      bottomPaddingPct: 13,
      maxWidthPct: 70,
    },
  ]

  return {
    engineVersion: 'fallback-v1',
    generatedAt: new Date().toISOString(),
    registrySignature: 'fallback',
    safeZonePolicy: {
      landscapeOnly: true,
      avoidSpeakerFace: true,
      captionBottomPaddingPct: 13,
      maxCaptionWidthPct: 70,
    },
    speechCues,
    transitionCues: [],
    explainerCues: [],
    backgroundCues: [],
    counterCues: [],
    sfxCues: [],
  }
}

type BuildCinematicAnimationPlanInput = {
  projectId: string
  input: ProcessingJobInput
  transcript: TranscriptSegment[]
  scenes: DetectedScene[]
  highlights: HighlightTimestamp[]
  brollSuggestions: BRollSuggestion[]
  registry: CinematicAssetRegistry
}

export function buildCinematicAnimationPlan(input: BuildCinematicAnimationPlanInput): AnimationPlan {
  const { projectId, registry } = input

  const plan: AnimationPlan = {
    engineVersion: 'v1',
    generatedAt: new Date().toISOString(),
    registrySignature: registry.signature,
    safeZonePolicy: {
      landscapeOnly: true,
      avoidSpeakerFace: true,
      captionBottomPaddingPct: 13,
      maxCaptionWidthPct: 70,
    },
    speechCues: [],
    transitionCues: [],
    explainerCues: [],
    backgroundCues: [],
    counterCues: [],
    sfxCues: [],
  }

  // Implementation details...
  return plan
}
