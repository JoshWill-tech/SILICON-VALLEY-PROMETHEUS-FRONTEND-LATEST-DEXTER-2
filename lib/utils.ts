import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a string for use as a filename.
 * Replaces non-alphanumeric characters with hyphens and ensures a safe length.
 */
export function sanitizeFilename(title: string): string {
  if (!title) return 'export'
  
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-')         // Collapse repeated hyphens
    .replace(/^-|-$/g, '')      // Trim leading/trailing hyphens
    .slice(0, 80)                // Limit length
}

/**
 * Formats bytes into a human-readable string.
 */
export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
