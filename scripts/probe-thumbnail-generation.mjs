import nextEnv from '@next/env'
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { buildNanoBananaImageRequest, extractGeneratedImage } from '../lib/thumbnails/nano-banana-image.ts'
import { compactGeneratedThumbnail } from '../lib/thumbnails/thumbnail-output.ts'
import { resolveStudioImageModel } from '../lib/thumbnails/studio-art-direction.ts'
import { THUMBNAIL_PROVIDER_TIMEOUT_MS } from '../lib/thumbnails/thumbnail-runtime.ts'

// One real request with a synthetic source; never upload project/user media.
nextEnv.loadEnvConfig(process.cwd())
const keys = [...new Set(['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3']
  .map(name => process.env[name]?.trim()).filter(value => value?.startsWith('AIza')))]
const key = keys[process.argv.includes('--secondary') ? 1 : 0]
if (!key) throw new Error(process.argv.includes('--secondary') ? 'No second distinct well-formed Gemini credential configured' : 'No Gemini credential configured')
const source = await sharp({ create: { width: 256, height: 256, channels: 3, background: '#345678' } }).png().toBuffer()
const model = resolveStudioImageModel('fast')
const input = buildNanoBananaImageRequest({
  prompt: 'Create one polished thumbnail of an orange geometric sphere against the supplied blue background. Render only the headline TEST. No people or additional text.',
  frameDataUrl: `data:image/png;base64,${source.toString('base64')}`,
  aspectRatio: '16:9', imageSize: '1K',
})
const started = Date.now()
const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(input), signal: AbortSignal.timeout(THUMBNAIL_PROVIDER_TIMEOUT_MS),
})
const body = await response.json()
console.log(JSON.stringify({ model, status: response.status, durationMs: Date.now() - started, errorStatus: body.error?.status }))
if (!response.ok) { console.log(JSON.stringify({ providerMessage: body.error?.message?.slice(0, 600) })); throw new Error('Image provider rejected the synthetic generation check') }
const generated = extractGeneratedImage(body)
if (!generated) { console.log(JSON.stringify({ imageReturned: false, finishReasons: body.candidates?.map(candidate => candidate.finishReason) })); process.exit(1) }
const compact = await compactGeneratedThumbnail(generated)
const bytes = Buffer.from(compact.split(',')[1], 'base64')
const metadata = await sharp(bytes).metadata()
await mkdir('artifacts/thumbnail-gateway-repair', { recursive: true })
await writeFile('artifacts/thumbnail-gateway-repair/generated.webp', bytes)
console.log(JSON.stringify({ imageReturned: true, width: metadata.width, height: metadata.height, format: metadata.format, bytes: bytes.length, artifact: 'artifacts/thumbnail-gateway-repair/generated.webp' }))
