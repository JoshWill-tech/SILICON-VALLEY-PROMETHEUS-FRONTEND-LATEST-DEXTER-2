import fs from 'node:fs/promises'
import path from 'node:path'
import { getStudioReference } from './studio-references.ts'

/**
 * Server-side loader: reliably loads the reference image file from disk into a base64 Data URL.
 * Ensures the multimodal image generator ALWAYS receives the real reference image file.
 * Kept in a server-only module to prevent Webpack client bundle unhandled scheme errors.
 */
export async function loadStudioReferenceDataUrl(id: string): Promise<string | null> {
  const reference = getStudioReference(id)
  if (!reference?.src) return null
  try {
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
