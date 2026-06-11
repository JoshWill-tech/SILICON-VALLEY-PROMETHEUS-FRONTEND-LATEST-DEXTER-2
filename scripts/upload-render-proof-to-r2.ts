import { uploadFileToR2 } from '../lib/r2/upload-file'
import { R2Keys } from '../lib/r2/keys'
import path from 'node:path'
import fs from 'node:fs/promises'

/**
 * Upload-only smoke test to verify R2 upload robustness without rerendering.
 * Requires .tmp/render-proof.mp4 to exist from a previous render.
 * Run with: [EXPORT_PROJECT_ID="..."] [EXPORT_ID="..."] npm run upload:render-proof
 */
async function main() {
  const localFilePath = path.join(process.cwd(), '.tmp', 'render-proof.mp4')
  const projectId = process.env.EXPORT_PROJECT_ID || 'smoke-test-project'
  const exportId = process.env.EXPORT_ID || 'smoke-test-export'
  const userId = 'smoke-test-user'

  console.info('🚀 Starting R2 Upload Smoke Test...')
  console.info(`   File:    ${localFilePath}`)
  console.info(`   Project: ${projectId}`)
  console.info(`   Export:  ${exportId}`)

  try {
    // 1. Check if file exists
    await fs.access(localFilePath)
    const stats = await fs.stat(localFilePath)
    console.info(`   Size:    ${(stats.size / 1024 / 1024).toFixed(2)} MB`)

    // 2. Generate R2 key
    const bucket = process.env.R2_BUCKET_EXPORTS || 'prometheus-exports'
    const key = R2Keys.exportFile(userId, projectId, exportId, 'render-proof.mp4')

    // 3. Trigger upload with retry logic
    const startTime = Date.now()
    const result = await uploadFileToR2(localFilePath, bucket, key, 'video/mp4', {
      maxAttempts: 3,
      retryDelayMs: 1500
    })
    const endTime = Date.now()

    console.info('\n✅ Upload Completed Successfully!')
    console.info(`   Bucket:   ${result.bucket}`)
    console.info(`   Key:      ${result.key}`)
    console.info(`   Attempts: ${result.attempts}`)
    console.info(`   Time:     ${((endTime - startTime) / 1000).toFixed(2)}s`)
    console.info(`   ETag:     ${result.etag}`)

  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.error('\n❌ Error: Local file not found at .tmp/render-proof.mp4')
      console.info('   Please run "npm run render:proof" first to generate the file.')
    } else {
      console.error('\n❌ Upload Failed!')
      console.error(`   Error: ${err.message}`)
      
      if (err.message.includes('SSL') || err.message.includes('handshake') || err.message.includes('EPROTO')) {
        console.info('\n💡 Tip: This looks like a network/SSL issue. The new retry logic should handle transient spikes.')
      } else if (err.message.includes('access denied') || err.message.includes('403')) {
        console.info('\n💡 Tip: Check your R2 credentials and bucket permissions.')
      }
    }
    process.exit(1)
  }
}

main()
