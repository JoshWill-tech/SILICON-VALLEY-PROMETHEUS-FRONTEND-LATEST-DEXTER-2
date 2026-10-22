import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import test from 'node:test'
import { build } from 'esbuild'
import sharp from 'sharp'
import { NextRequest } from 'next/server.js'

// Exercise the real route, SDK, prompt construction and Sharp output conversion.
// Only session lookup and outbound HTTP are replaced; no real credentials are used.
const compiled = await build({
  entryPoints: ['app/api/projects/[id]/thumbnails/nano-banana/route.ts'],
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  logLevel: 'silent', plugins: [{
    name: 'route-session-fixture',
    setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/supabase\/server$/ }, () => ({ path: 'session', namespace: 'fixture' }))
      builder.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'fixture' }))
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({
        contents: path === 'session' ? 'export async function createClient() { return { auth: { getUser: async () => ({ data: { user: { id: "thumbnail-test-user" } }, error: null }) } } }' : '', loader: 'js',
      }))
    },
  }],
})
const bundled = { exports: {} }
new Function('module', 'exports', 'require', compiled.outputFiles[0].text)(bundled, bundled.exports, createRequire(resolve('package.json')))
const { POST } = bundled.exports
const png = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#345678' } }).png().toBuffer()
const dataUrl = `data:image/png;base64,${png.toString('base64')}`
const studioDesign = { layout: 'hero', background: 'dark', accent: '#00B9F2', quality: 'fast', textScale: 1 }
const geminiImage = () => Response.json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: png.toString('base64') } }] } }] })
const envKeys = ['THUMBNAIL_IMAGE_API_KEY', 'THUMBNAIL_IMAGE_API_BASE_URL', 'THUMBNAIL_IMAGE_MODEL', 'GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3']

async function exercise(context, { env = {}, fetch: fetcher, body = {} }, check) {
  const previous = Object.fromEntries(envKeys.map(key => [key, process.env[key]]))
  for (const key of envKeys) delete process.env[key]
  Object.assign(process.env, env)
  const fetchMock = context.mock.method(globalThis, 'fetch', fetcher || (() => { throw new Error('Unexpected outbound request') }))
  const controller = new AbortController()
  const request = new NextRequest('http://localhost/api/projects/project-1/thumbnails/nano-banana', {
    method: 'POST', headers: { 'content-type': 'application/json' }, signal: controller.signal,
    body: JSON.stringify({ frameDataUrl: dataUrl, headline: 'A REAL TEST', studioDesign, ...body }),
  })
  const response = POST(request, { params: Promise.resolve({ id: 'project-1' }) })
  try { await check({ response, controller }) }
  finally {
    controller.abort()
    fetchMock.mock.restore()
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value }
  }
}

async function within(promise, milliseconds = 1500) {
  let timer
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Thumbnail route did not settle within the test deadline')), milliseconds) })])
  } finally { clearTimeout(timer) }
}

function waitForAbort(signal, onStart = () => {}) {
  onStart()
  return new Promise((_, reject) => {
    if (signal?.aborted) reject(signal.reason)
    else signal?.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

test('missing provider credentials return JSON 503 without contacting any provider', async context => {
  await exercise(context, {}, async ({ response }) => {
    const result = await response
    assert.equal(result.status, 503)
    assert.match(result.headers.get('content-type'), /application\/json/)
    assert.match((await result.json()).error, /not configured/)
  })
})

test('dedicated image credential reaches the configured multipart edit API and returns decodable artwork', async context => {
  let calls = 0
  await exercise(context, {
    env: { THUMBNAIL_IMAGE_API_KEY: 'test-image-key', THUMBNAIL_IMAGE_API_BASE_URL: 'https://images.example.test/v1' },
    fetch: async (url, options) => {
      calls++
      assert.equal(url, 'https://images.example.test/v1/images/edits')
      assert.equal(options.headers.Authorization, 'Bearer test-image-key')
      assert.ok(options.body instanceof FormData)
      assert.equal(options.body.getAll('image[]').length, 1)
      return Response.json({ data: [{ b64_json: png.toString('base64') }] })
    },
  }, async ({ response }) => {
    const result = await response
    assert.equal(result.status, 200)
    const image = await result.json()
    assert.match(image.dataUrl, /^data:image\/webp;base64,/)
    assert.equal((await sharp(Buffer.from(image.dataUrl.split(',')[1], 'base64')).metadata()).width, 64)
    assert.equal(calls, 1)
  })
})

test('an upstream HTML gateway failure stays a JSON provider error', async context => {
  await exercise(context, {
    env: { THUMBNAIL_IMAGE_API_KEY: 'test-image-key' },
    fetch: async () => new Response('<html>Bad Gateway</html>', { status: 502, headers: { 'content-type': 'text/html' } }),
  }, async ({ response }) => {
    const result = await response
    assert.equal(result.status, 502)
    assert.match(result.headers.get('content-type'), /application\/json/)
    assert.match((await result.json()).error, /image provider returned an HTML gateway error/)
  })
})

test('a stalled optional planner times out and generation still returns a real image', async context => {
  const nativeTimeout = AbortSignal.timeout.bind(AbortSignal)
  context.mock.method(AbortSignal, 'timeout', milliseconds => nativeTimeout(milliseconds === 20000 ? 10 : milliseconds))
  let images = 0
  await exercise(context, {
    env: { GEMINI_API_KEY: 'AIza-test-key' },
    fetch: async (url, options) => {
      if (String(url).includes('gemini-2.5-flash:')) return waitForAbort(options.signal)
      images++
      return geminiImage()
    },
  }, async ({ response }) => {
    const result = await within(response)
    assert.equal(result.status, 200)
    assert.match((await result.json()).dataUrl, /^data:image\/webp;base64,/)
    assert.equal(images, 1)
  })
})

test('cancelling during planning settles the route and never starts image generation', async context => {
  let plannerStarted
  const started = new Promise(resolve => { plannerStarted = resolve })
  let imageCalls = 0
  await exercise(context, {
    env: { GEMINI_API_KEY: 'AIza-test-key' },
    fetch: async (url, options) => {
      if (String(url).includes('gemini-2.5-flash:')) return waitForAbort(options.signal, plannerStarted)
      imageCalls++
      return geminiImage()
    },
  }, async ({ response, controller }) => {
    await started
    controller.abort()
    assert.equal((await within(response)).status, 499)
    assert.equal(imageCalls, 0)
  })
})

test('a provider body timeout returns JSON 504 rather than a misleading no-image response', async context => {
  const nativeTimeout = AbortSignal.timeout.bind(AbortSignal)
  context.mock.method(AbortSignal, 'timeout', milliseconds => nativeTimeout(milliseconds === 240000 ? 20 : milliseconds))
  await exercise(context, {
    env: { THUMBNAIL_IMAGE_API_KEY: 'test-image-key' },
    fetch: async (_url, options) => new Response(new ReadableStream({
      start(stream) { options.signal.addEventListener('abort', () => stream.error(options.signal.reason), { once: true }) },
    }), { headers: { 'content-type': 'application/json' } }),
  }, async ({ response }) => {
    const result = await within(response)
    assert.equal(result.status, 504)
    assert.match((await result.json()).error, /time|minutes/)
  })
})

test('legacy style analysis also times out without preventing image generation', async context => {
  const nativeTimeout = AbortSignal.timeout.bind(AbortSignal)
  context.mock.method(AbortSignal, 'timeout', milliseconds => nativeTimeout(milliseconds === 20000 ? 10 : milliseconds))
  await exercise(context, {
    env: { GEMINI_API_KEY: 'AIza-test-key' }, body: { studioDesign: undefined },
    fetch: async (url, options) => String(url).includes('gemini-2.5-flash:') ? waitForAbort(options.signal) : geminiImage(),
  }, async ({ response }) => {
    const result = await within(response)
    assert.equal(result.status, 200)
    assert.equal((await result.json()).model, 'gemini-2.5-flash-image')
  })
})

test('the complete request deadline returns JSON even when a transport ignores abort', async context => {
  const nativeTimeout = AbortSignal.timeout.bind(AbortSignal)
  context.mock.method(AbortSignal, 'timeout', milliseconds => nativeTimeout(milliseconds === 270000 ? 25 : milliseconds))
  await exercise(context, {
    env: { THUMBNAIL_IMAGE_API_KEY: 'test-image-key' },
    fetch: () => new Promise(() => {}),
  }, async ({ response }) => {
    const result = await within(response)
    assert.equal(result.status, 504)
    assert.match(result.headers.get('content-type'), /application\/json/)
    assert.match((await result.json()).error, /time limit/)
  })
})

for (const [quality, model, imageSize] of [['fast', 'gemini-3.1-flash-image', '1K'], ['pro', 'gemini-3-pro-image', '2K']]) {
  test(`Gemini ${quality} uses the expected model, image settings and video frame`, async context => {
    let imageCalls = 0
    await exercise(context, {
      env: { GEMINI_API_KEY_2: 'AIza-test-key' }, body: { studioDesign: { ...studioDesign, quality } },
      fetch: async (url, options) => {
        if (String(url).includes('gemini-2.5-flash:')) return Response.json({ candidates: [{ content: { parts: [{ text: '{"artDirection":"A clear cinematic subject"}' }] } }] })
        imageCalls++
        assert.equal(url, `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`)
        assert.equal(options.headers['x-goog-api-key'], 'AIza-test-key')
        const input = JSON.parse(options.body)
        assert.equal(input.generationConfig.imageConfig.imageSize, imageSize)
        assert.equal(input.contents[0].parts[2].inline_data.data, png.toString('base64'))
        return geminiImage()
      },
    }, async ({ response }) => {
      const result = await response
      assert.equal(result.status, 200)
      assert.match((await result.json()).dataUrl, /^data:image\/webp;base64,/)
      assert.equal(imageCalls, 1)
    })
  })
}

test('provider credential rejection remains distinguishable from missing configuration', async context => {
  await exercise(context, {
    env: { THUMBNAIL_IMAGE_API_KEY: 'test-image-key' },
    fetch: async () => Response.json({ error: { message: 'Invalid credential' } }, { status: 401 }),
  }, async ({ response }) => {
    const result = await response
    assert.equal(result.status, 502)
    assert.match((await result.json()).error, /rejected its server credential/)
  })
})

test('zero Gemini image quota returns a configuration failure rather than suggesting a retry', async context => {
  await exercise(context, {
    env: { GEMINI_API_KEY: 'AIza-test-key' }, body: { studioDesign: undefined, lockChannelStyle: false },
    fetch: async () => Response.json({ error: { message: 'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-3.1-flash-image' } }, { status: 429 }),
  }, async ({ response }) => {
    const result = await response
    assert.equal(result.status, 503)
    assert.match((await result.json()).error, /no image-generation quota.*billing|no image-generation quota.*configure/i)
  })
})

test('a temporary provider rate limit preserves HTTP 429', async context => {
  await exercise(context, {
    env: { THUMBNAIL_IMAGE_API_KEY: 'test-image-key' },
    fetch: async () => Response.json({ error: { message: 'Too many requests' } }, { status: 429 }),
  }, async ({ response }) => { assert.equal((await response).status, 429) })
})

test('the provider deadline settles a transport that ignores abort before the full pipeline deadline', async context => {
  const nativeTimeout = AbortSignal.timeout.bind(AbortSignal)
  context.mock.method(AbortSignal, 'timeout', milliseconds => nativeTimeout(milliseconds === 240000 ? 20 : milliseconds))
  await exercise(context, {
    env: { THUMBNAIL_IMAGE_API_KEY: 'test-image-key' }, fetch: () => new Promise(() => {}),
  }, async ({ response }) => { assert.equal((await within(response)).status, 504) })
})
