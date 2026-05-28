/**
 * CENTRALIZED R2 MUSIC ASSET RESOLVER
 * Standardizes URL generation for all soundtrack assets.
 */

const R2_MUSIC_BASE_URL = process.env.NEXT_PUBLIC_R2_MUSIC_BASE_URL || 'https://assets.prometheusstudio.tech';

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
  const cleanFilename = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
  return `${R2_MUSIC_BASE_URL}/music/${category}/${cleanFilename}`;
}

/**
 * Resolves the full public URL for a soundtrack's thumbnail image.
 * Assumes matching filenames with .jpg extension.
 */
export function getMusicThumbnailUrl(category: string, filename: string): string {
  // Derive thumbnail from soundtrack name, ensuring .jpg extension
  const baseName = filename.replace(/\.(mp3|wav|ogg)$/, '');
  return `${R2_MUSIC_BASE_URL}/music-thumbnails/${category}/${baseName}.jpg`;
}

/**
 * Resolves the full public URL for a soundtrack's preview snippet.
 */
export function getMusicPreviewUrl(category: string, filename: string): string {
  const cleanFilename = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
  return `${R2_MUSIC_BASE_URL}/music-previews/${category}/${cleanFilename}`;
}

/**
 * Generic helper to resolve any R2 asset by its path.
 */
export function resolveR2AssetUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${R2_MUSIC_BASE_URL}${cleanPath}`;
}
