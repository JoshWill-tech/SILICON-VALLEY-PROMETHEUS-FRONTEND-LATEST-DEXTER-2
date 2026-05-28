import type {
  MusicDirectionIntent,
  MusicSoundtrackProfile,
  MusicIntent,
} from '@/lib/types'
import type { CreativeMetadata } from '@/lib/editorial-frame/types'

export function inferMusicDirection({
  profile,
  intent,
  metadata
}: {
  profile?: MusicSoundtrackProfile | null
  intent?: MusicIntent | null
  metadata?: CreativeMetadata | null
}): MusicDirectionIntent {
  // Defaults
  const direction: MusicDirectionIntent = {
    emotion: 'Cinematic',
    energy: 'medium',
    bpmRange: '90-110',
    vocalPolicy: 'instrumental_only',
    genreFamily: ['Cinematic', 'Electronic'],
    instrumentation: ['Strings', 'Pads', 'Percussion'],
    intensityCurve: 'Steady build',
    voiceoverSafe: true,
    avoid: ['Distracting vocals', 'Heavy drums'],
    providerCandidate: 'internal_mock'
  }

  if (profile) {
    direction.emotion = profile.primaryMood
    direction.energy = profile.energyLevel > 70 ? 'high' : profile.energyLevel < 40 ? 'low' : 'medium'
    direction.bpmRange = `${profile.tempoRange[0]}-${profile.tempoRange[1]}`
    direction.genreFamily = profile.genreCandidates
    direction.instrumentation = profile.instrumentationHints
    direction.intensityCurve = profile.emotionalArc
    direction.avoid = profile.avoid
  }

  if (metadata) {
    if (metadata.musicEnergy) {
      direction.energy = metadata.musicEnergy.toLowerCase() as any
    }
    if (metadata.tone) {
      direction.emotion = metadata.tone
    }
  }

  // Refine based on vocal policy if needed
  if (profile?.avoid.some(a => a.toLowerCase().includes('vocal'))) {
    direction.vocalPolicy = 'instrumental_only'
  }

  return direction
}
