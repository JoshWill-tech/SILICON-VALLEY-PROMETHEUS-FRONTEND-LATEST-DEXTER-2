/**
 * CENTRALIZED R2 MUSIC ASSET RESOLVER
 * Standardizes URL generation for all soundtrack assets.
 */

const R2_MUSIC_BASE_URL =
  process.env.NEXT_PUBLIC_R2_MUSIC_BASE_URL ||
  process.env.R2_PUBLIC_BASE_URL ||
  'https://pub-dd3631a74a2c411cb28460a2b0112611.r2.dev'

export type MusicCategoryFolder =
  | 'cinematic-trailer'
  | 'classical-orchestra'
  | 'hiphop-trap'
  | 'lofi-chill-soft'
  | 'motivational-beats'
  | 'pop-indie-life'
  | 'tech-futuristic';

/**
 * Resolves the full public URL for a soundtrack's original audio file.
 */
export function getMusicAudioUrl(category: string, filename: string): string {
  // Ensure filename has .mp3 extension if not already present
  const cleanFilename = filename.endsWith('.mp3') ? filename : `${filename}.mp3`
  return resolveR2AssetUrl(`music-originals/${category}/${cleanFilename}`)
}

/**
 * Resolves the full public URL for a soundtrack's thumbnail image.
 * Assumes matching filenames with .jpg extension.
 */
export function getMusicThumbnailUrl(category: string, filename: string): string {
  // Derive thumbnail from soundtrack name. The current R2 library stores most covers as webp.
  const baseName = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, '')
  return resolveR2AssetUrl(`music-thumbnails/${category}/${baseName}.webp`)
}

/**
 * Resolves the full public URL for a soundtrack's preview snippet.
 */
export function getMusicPreviewUrl(category: string, filename: string): string {
  const cleanFilename = filename.endsWith('.mp3') ? filename : `${filename}.mp3`
  return resolveR2AssetUrl(`music-originals/${category}/${cleanFilename}`)
}

/**
 * Generic helper to resolve any R2 asset by its path.
 */
export function resolveR2AssetUrl(path: string): string {
  const cleanBaseUrl = R2_MUSIC_BASE_URL.replace(/\/+$/, '')
  const cleanPath = path
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${cleanBaseUrl}/${cleanPath}`
}
