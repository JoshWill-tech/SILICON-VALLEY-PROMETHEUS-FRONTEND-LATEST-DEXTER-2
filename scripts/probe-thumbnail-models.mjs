import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())
const key = ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3']
  .map(name => process.env[name]?.trim()).find(value => value?.startsWith('AIza'))
console.log(JSON.stringify({ geminiConfigured: Boolean(key), dedicatedImageCredentialConfigured: Boolean(process.env.THUMBNAIL_IMAGE_API_KEY?.trim()) }))
if (!key) process.exit(1)
for (const model of ['gemini-3.1-flash-image', 'gemini-3-pro-image', 'gemini-2.5-flash-image']) {
  for (const version of ['v1', 'v1beta']) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${model}`, {
        headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(20000),
      })
      const result = await response.json()
      console.log(JSON.stringify({ version, model, status: response.status, errorStatus: result.error?.status, resolvedModel: result.name, methods: result.supportedGenerationMethods }))
    } catch (error) { console.log(JSON.stringify({ version, model, error: error.name, networkCode: error.cause?.code })) }
  }
}
