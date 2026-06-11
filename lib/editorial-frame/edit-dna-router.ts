import type { CreativeMetadata } from './types'

export type EditDNAProfile = {
  styleId?: string
  goals: string[]
  focusAreas: string[]
  energy?: string
  pacing?: string
  captionStyle?: string
  musicEnergy?: string
  motionIntensity?: string
  tone?: string
  transitionStyle?: string
  brollDensity?: string
  typographyTone?: string
  colorMood?: string
  hookStyle?: string
}

export function buildEditDNAProfile(metadata?: CreativeMetadata): EditDNAProfile {
  const profile: EditDNAProfile = {
    styleId: metadata?.styleId,
    goals: metadata?.goals ?? [],
    focusAreas: metadata?.focusAreas ?? [],
    energy: metadata?.energy,
    pacing: metadata?.pacing,
    captionStyle: metadata?.captionStyle,
    musicEnergy: metadata?.musicEnergy,
    motionIntensity: metadata?.motionIntensity,
    tone: metadata?.tone,
  }

  // Map high-level creative signals to internal DNA traits
  if (profile.goals.includes('retention') || profile.energy === 'fast') {
    profile.pacing = profile.pacing ?? 'aggressive'
    profile.motionIntensity = profile.motionIntensity ?? 'high'
    profile.captionStyle = profile.captionStyle ?? 'dynamic_pop'
  }

  if (profile.goals.includes('authority') || profile.energy === 'premium') {
    profile.pacing = profile.pacing ?? 'authoritative'
    profile.typographyTone = 'prestige'
    profile.captionStyle = profile.captionStyle ?? 'minimalist_sharp'
  }

  if (profile.energy === 'cinematic' || profile.energy === 'documentary') {
    profile.motionIntensity = profile.motionIntensity ?? 'fluid'
    profile.transitionStyle = 'cinematic'
    profile.colorMood = 'cinematic'
  }

  if (profile.focusAreas.includes('captions')) {
    profile.captionStyle = profile.captionStyle ?? 'bold_oversize'
  }

  if (profile.focusAreas.includes('music')) {
    profile.musicEnergy = profile.musicEnergy ?? 'high_hype'
  }

  return profile
}
