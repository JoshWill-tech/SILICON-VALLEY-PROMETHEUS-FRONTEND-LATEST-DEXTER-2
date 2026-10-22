import { KALLAWAY_STUDIO_REFERENCES } from './kallaway-studio-references.ts'

export type StudioReferenceCategory = 'All looks' | 'Hooks & Storytelling' | 'Growth & Strategy' | 'AI & Tools' | 'Creator Business' | 'Platform Trends'

export interface StudioReference {
  id: string
  name: string
  src: string
  category: StudioReferenceCategory
  cue: string
}

const FEATURED_STUDIO_REFERENCES: readonly StudioReference[] = [
  { id: 'ideas', name: 'Ideas', src: '/thumbnail-references/ideas.webp', category: 'Hooks & Storytelling', cue: 'bright graph-paper field, oversized black headline, surreal 3D brain, and glowing social-platform symbols around a close portrait' },
  { id: 'control-mind', name: 'Control your mind', src: '/thumbnail-references/control-mind.webp', category: 'Hooks & Storytelling', cue: 'clean pale grid, left-aligned black headline with a vivid yellow paint accent, sharply lit creator portrait and tactile brain prop' },
  { id: 'cmo-brain', name: "Inside a CMO's brain", src: '/thumbnail-references/cmo-brain.webp', category: 'Creator Business', cue: 'charcoal technical grid, large white headline with a saturated blue statement block, and a dramatic close portrait with a clear pointing cue' },
  { id: 'rewind-2025', name: '2025 rewind', src: '/thumbnail-references/rewind-2025.webp', category: 'Platform Trends', cue: 'cinematic black-to-ember collage, monumental metallic numerals, warm creator portrait, handwritten annotations and layered paper detail' },
  { id: 'three-ways', name: '3 ways', src: '/thumbnail-references/three-ways.webp', category: 'Growth & Strategy', cue: 'high-contrast creator composition, giant yellow headline, crisp white evidence card, blue screen light, and one bold red directional arrow' },
  { id: 'time-ticking', name: 'Time is ticking', src: '/thumbnail-references/time-ticking.webp', category: 'Hooks & Storytelling', cue: 'dark dramatic close-up, oversized red diagonal arrow, and a clean white rounded headline card with one yellow highlighted phrase' },
  { id: '300-to-100k', name: '$300 vs $100K', src: '/thumbnail-references/300-to-100k.webp', category: 'Creator Business', cue: 'clean transformation story, bright red and blue number blocks, expressive creator pointing toward a clear contrast, and a rich money-texture foreground' },
  { id: 'easy-mode', name: 'Easy mode', src: '/thumbnail-references/easy-mode.webp', category: 'Growth & Strategy', cue: 'premium rounded white frame, bold black editorial headline, dark analytics panel, electric blue graph, green proof badges and centered creator portrait' },
  { id: 'perfect-logo', name: 'Perfect logo', src: '/thumbnail-references/perfect-logo.webp', category: 'Creator Business', cue: 'moody warm studio portrait, oversized condensed lime and ivory typography, hand-drawn annotations and tactile rebrand details' },
] as const

export const STUDIO_REFERENCES = [...FEATURED_STUDIO_REFERENCES, ...KALLAWAY_STUDIO_REFERENCES]

export type StudioReferenceId = typeof STUDIO_REFERENCES[number]['id']

const GENERIC_CUE_BOILERPLATE = 'Replicate the reference image’s macro-composition, subject pose, hand gestures (pointing or framing), tactile props, typography placement, lighting mood, color contrast, subtle textural details, and documentary or cinematic aesthetic.'

function enrichCue(reference: { id: string; name: string; category: string; cue: string }): string {
  if (reference.cue && reference.cue !== GENERIC_CUE_BOILERPLATE && reference.cue.length > 55) {
    return reference.cue
  }

  const name = reference.name.toLowerCase()
  const category = reference.category

  let visualTheme = ''
  if (name.includes('hook') || name.includes('story') || name.includes('irresistible') || name.includes('skip') || name.includes('novelty')) {
    visualTheme = 'Tactile documentary hook aesthetic: weathered paper documents, subtle rubber stamps, hand gesture framing evidence, high-contrast typography, and warm cinematic film tone.'
  } else if (name.includes('claude') || name.includes('ai') || name.includes('algorithm') || name.includes('tools')) {
    visualTheme = 'High-agency AI workflow aesthetic: technical isometric dark grid, glowing cybernetic telemetry lines, crisp data cards, neon rim light tracing the subject silhouette, and ultra-bold condensed sans-serif lettering.'
  } else if (name.includes('grow') || name.includes('follower') || name.includes('0 to') || name.includes('social media') || name.includes('speedrun')) {
    visualTheme = 'Viral growth dashboard layout: glowing upward metric chart, floating analytics card, badge proof pills, dramatic rim lighting, and clear pointing gesture directing attention to the key metric.'
  } else if (name.includes('brand') || name.includes('sales') || name.includes('rich') || name.includes('millions') || name.includes('business')) {
    visualTheme = 'High-end creator business editorial: clean luxury studio atmosphere, dual-contrast statement cards, elegant typography with highlighted keyword, success tactile motifs, and cinematic rim light.'
  } else if (name.includes('rule') || name.includes('trend') || name.includes('2026') || name.includes('future') || name.includes('lies')) {
    visualTheme = 'Urgent platform trend report: bold warning accent chip, monumental headline lettering, layered collage elements, dramatic directional arrow, and intense high-contrast portrait key light.'
  } else {
    visualTheme = `Signature ${category.toLowerCase()} creator composition: high-contrast subject framing, intentional negative space for headline, tactile evidence artifacts, and clean modern graphic contrast.`
  }

  return `Thematic concept inspired by '${reference.name}': ${visualTheme} Transfer its macro-composition, background tone, and visual elements faithfully.`
}

export function getStudioReference(id: string): StudioReference {
  const found = STUDIO_REFERENCES.find(reference => reference.id === id) ?? STUDIO_REFERENCES[0]
  return {
    ...found,
    cue: enrichCue(found),
  }
}

/**
 * Server-side loader: reliably loads the reference image file from disk into a base64 Data URL.
 * Ensures the multimodal image generator ALWAYS receives the real reference image file.
 */
export async function loadStudioReferenceDataUrl(id: string): Promise<string | null> {
  const reference = getStudioReference(id)
  if (!reference?.src) return null
  try {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const cleanSrc = reference.src.replace(/^\//, '')
    const filePath = path.join(process.cwd(), 'public', cleanSrc)
    const buffer = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const mimeType = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg'
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}
