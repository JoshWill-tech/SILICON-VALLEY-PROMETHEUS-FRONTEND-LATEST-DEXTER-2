import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import path from 'node:path'
import fs from 'node:fs/promises'

export interface RenderOptions {
  projectId: string
  exportId: string
  sourceUrl: string
  projectTitle: string
  outputPath: string
  width?: number
  height?: number
  fps?: number
  maxDurationSeconds?: number
}

/**
 * Isolated server-side Remotion render helper.
 * This function handles bundling the composition and rendering it to an MP4 file.
 */
export async function renderCinematicProof(options: RenderOptions) {
  const {
    sourceUrl,
    projectTitle,
    outputPath,
    width = 1280,
    height = 720,
    fps = 30,
    maxDurationSeconds = 10, // Default proof limit
  } = options

  console.info(`[REMOTION_RENDER] Starting render for project: ${projectTitle} (${options.projectId})`)
  
  try {
    // 1. Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    // 2. Identify the entry point
    const entryPoint = path.join(process.cwd(), 'lib/remotion/render-proof-entry.tsx')

    // 3. Bundle the composition
    console.info('[REMOTION_RENDER] Bundling composition...')
    const serveUrl = await bundle(entryPoint)

    // 4. Select the composition
    const compositionId = 'render-proof' 
    
    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps: {
        sourceUrl,
        projectTitle: projectTitle.trim() || 'Untitled Project',
      },
    })

    // 5. Apply duration limits for the proof
    const durationInFrames = Math.min(
      composition.durationInFrames,
      maxDurationSeconds * fps
    )

    console.info(`[REMOTION_RENDER] Rendering ${durationInFrames} frames at ${width}x${height}...`)

    // 6. Execute the render
    await renderMedia({
      codec: 'h264',
      composition: {
        ...composition,
        durationInFrames,
        width,
        height,
        fps,
      },
      serveUrl,
      outputLocation: outputPath,
      inputProps: {
        sourceUrl,
        projectTitle: projectTitle.trim() || 'Untitled Project',
      },
      onProgress: ({ progress }) => {
        console.info(`[REMOTION_RENDER] Progress: ${Math.round(progress * 100)}%`)
      },
    })

    console.info(`[REMOTION_RENDER] Render completed successfully: ${outputPath}`)
    return {
      success: true,
      outputPath,
      durationInFrames,
    }
  } catch (error: any) {
    console.error('[REMOTION_RENDER_ERROR]', error)
    throw new Error(`Remotion render failed: ${error.message}`)
  }
}
