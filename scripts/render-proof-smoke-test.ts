import { renderCinematicProof } from '../lib/remotion/render.server'
import { uploadFileToR2 } from '../lib/r2/upload-file'
import { R2Keys } from '../lib/r2/keys'
import path from 'node:path'
import fs from 'node:fs/promises'

/**
 * Local smoke test script to verify Remotion rendering.
 * Run with: SOURCE_URL="..." PROJECT_TITLE="..." npm run render:proof
 */
async function main() {
  const sourceUrl = process.env.SOURCE_URL
  const projectTitle = process.env.PROJECT_TITLE || 'Smoke Test Render'
  const outputDir = path.join(process.cwd(), '.tmp')
  const outputPath = process.env.OUTPUT_PATH || path.join(outputDir, 'render-proof.mp4')
  const shouldUpload = process.env.UPLOAD_TO_R2 === 'true'

  if (!sourceUrl) {
    console.error('❌ Error: SOURCE_URL environment variable is required.')
    console.info('Usage: SOURCE_URL="https://example.com/video.mp4" [PROJECT_TITLE="..."] [UPLOAD_TO_R2=true] npm run render:proof')
    process.exit(1)
  }

  console.info('🚀 Starting Remotion Render Smoke Test...')
  console.info(`   Project: ${projectTitle}`)
  console.info(`   Source:  ${sourceUrl}`)
  console.info(`   Output:  ${outputPath}`)
  console.info(`   Upload:  ${shouldUpload ? 'YES (to R2)' : 'NO'}`)

  try {
    // 1. Ensure temp directory exists
    await fs.mkdir(outputDir, { recursive: true })

    // 2. Call the isolated render helper
    const startTime = Date.now()
    const result = await renderCinematicProof({
      projectId: 'smoke-test-id',
      exportId: 'smoke-test-export-id',
      sourceUrl,
      projectTitle,
      outputPath,
      maxDurationSeconds: 5, // Keep it short for the smoke test
    })

    const endTime = Date.now()
    const durationSec = ((endTime - startTime) / 1000).toFixed(2)

    // 3. Verify output
    const stats = await fs.stat(outputPath)
    const fileSizeMb = (stats.size / (1024 * 1024)).toFixed(2)

    console.info('\n✅ Render Completed Successfully!')
    console.info(`   Path:      ${result.outputPath}`)
    console.info(`   Size:      ${fileSizeMb} MB`)
    console.info(`   Duration:  ${durationSec}s`)
    console.info(`   Frames:    ${result.durationInFrames}`)

    // 4. Optional Upload to R2
    if (shouldUpload) {
      console.info('\n☁️  Uploading to R2...')
      const bucket = process.env.R2_BUCKET_EXPORTS || 'prometheus-exports'
      const key = R2Keys.exportFile('smoke-test-user', 'smoke-test-project', 'smoke-test-export', 'render-proof.mp4')
      
      const uploadResult = await uploadFileToR2(outputPath, bucket, key, 'video/mp4', {
        maxAttempts: 3,
        retryDelayMs: 1500
      })
      console.info('✅ Upload Successful!')
      console.info(`   Bucket: ${uploadResult.bucket}`)
      console.info(`   Key:    ${uploadResult.key}`)
      console.info(`   Attempts: ${uploadResult.attempts}`)
    }
  } catch (err: any) {
    console.error('\n❌ Render/Upload Failed!')
    console.error(`   Error: ${err.message}`)
    
    if (err.message.includes('chrome') || err.message.includes('browser')) {
      console.info('\n💡 Tip: It looks like Chromium might be missing or inaccessible in this environment.')
    } else if (err.message.includes('fetch') || err.message.includes('CORS')) {
      console.info('\n💡 Tip: Check if the SOURCE_URL is accessible and supports CORS.')
    } else if (err.message.includes('R2') || err.message.includes('S3')) {
      console.info('\n💡 Tip: Check your R2 environment variables and credentials.')
    }
    
    process.exit(1)
  }
}

main()
