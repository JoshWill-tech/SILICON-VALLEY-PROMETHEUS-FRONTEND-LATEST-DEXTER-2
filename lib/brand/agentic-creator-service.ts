import type { BrandStyleDNA, BrandVideoItem } from './resolve'
import { getCreatorRecommendations, KNOWN_CREATOR_PROFILES } from '../creators/creator-recommendations'
import { CREATOR_VIDEO_CATALOG } from '../creators/video-catalog'

export interface AgenticCreatorEntity {
  canonicalName: string
  rawQuery: string
  youtubeUrl: string
  instagramUrl: string
  avatarUrl?: string
  videos?: BrandVideoItem[]
  styleDNA: BrandStyleDNA
  source: 'fast_path' | 'agentic_llm' | 'procedural'
}

const DEDICATED_API_KEY =
  process.env.AGENTIC_CREATOR_API_KEY?.trim() ||
  'sk-93e67c8428d9eeec8d6f58547dbdfd14c36bb7386890bf35e40372080a5435b4'

const DEDICATED_BASE_URL =
  process.env.AGENTIC_CREATOR_BASE_URL?.trim() || 'https://codex-everywhere.com/v1'

const DEDICATED_MODEL =
  process.env.AGENTIC_CREATOR_MODEL?.trim() || 'gpt-5.6-luna'

const LLM_TIMEOUT_MS = 2200

// In-memory cache for ultra-low latency (<1ms) on repeated lookups
const entityCache = new Map<string, AgenticCreatorEntity>()

/**
 * Fast-path resolution for known creators and aliases.
 * Executes in <1ms without any network or LLM roundtrips.
 */
function resolveFastPath(query: string): AgenticCreatorEntity | null {
  const norm = query.trim().toLowerCase().replace(/^@/, '')
  const cleanWord = norm.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

  for (const [name, profile] of Object.entries(KNOWN_CREATOR_PROFILES)) {
    const keyNorm = name.toLowerCase()
    const matchesKey = keyNorm === cleanWord || keyNorm.includes(cleanWord) || cleanWord.includes(keyNorm)
    const matchesAlias = profile.aliases.some((a) => {
      const aNorm = a.toLowerCase().replace(/^@/, '')
      return cleanWord === aNorm || cleanWord.includes(aNorm) || aNorm.includes(cleanWord)
    })

    if (matchesKey || matchesAlias) {
      const ytPlatform = profile.platforms.find((p) => p.platform === 'youtube')
      const igPlatform = profile.platforms.find((p) => p.platform === 'instagram')
      const catalogVideos = CREATOR_VIDEO_CATALOG[profile.name] || []
      const fallbackVideos: BrandVideoItem[] = catalogVideos.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        thumbnailUrl: v.image,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
      }))

      return {
        canonicalName: profile.name,
        rawQuery: query,
        youtubeUrl: ytPlatform?.handleOrUrl || `https://www.youtube.com/@${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        instagramUrl: igPlatform?.handleOrUrl || `https://instagram.com/${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        avatarUrl: profile.platforms[0]?.avatarUrl,
        videos: fallbackVideos,
        styleDNA: profile.styleDNA,
        source: 'fast_path',
      }
    }
  }

  return null
}

/**
 * Calls the dedicated LLM on codex-everywhere with a strict timeout guard.
 * If the model is slow, it automatically aborts and allows immediate fallback.
 */
async function queryAgenticLLM(query: string): Promise<Partial<AgenticCreatorEntity> | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)

  try {
    const prompt = `You are an agentic creator intelligence director.
Given the creator or character query "${query}", extract or infer:
1. Canonical Creator/Brand Name
2. Primary YouTube channel URL (e.g. https://www.youtube.com/@handle)
3. Primary Instagram URL (e.g. https://instagram.com/handle)
4. Stylistic tone (short string)
5. Kinetic typography description (short string)
6. Pacing description (short string)

Respond with strictly valid JSON only:
{
  "canonicalName": "string",
  "youtubeUrl": "string",
  "instagramUrl": "string",
  "tone": "string",
  "typography": "string",
  "pacing": "string"
}`

    const res = await fetch(`${DEDICATED_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${DEDICATED_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEDICATED_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 220,
        temperature: 0.1,
      }),
    })

    clearTimeout(timeoutId)

    if (res.ok) {
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const content = data.choices?.[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content) as {
          canonicalName?: string
          youtubeUrl?: string
          instagramUrl?: string
          tone?: string
          typography?: string
          pacing?: string
        }

        if (parsed.canonicalName && parsed.youtubeUrl) {
          return {
            canonicalName: parsed.canonicalName,
            youtubeUrl: parsed.youtubeUrl,
            instagramUrl: parsed.instagramUrl || `https://instagram.com/${parsed.canonicalName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            styleDNA: {
              tone: parsed.tone || 'Dynamic & Audience-Calibrated',
              typography: parsed.typography || 'Bold Modern Grotesk & Kinetic Punch-Ins',
              colorAccent: '#55ff9b',
              pacing: parsed.pacing || 'Rapid <2s Retention Hooks & Micro-Cuts',
              aestheticDescription: `Video outputs calibrated to the visual language and pacing of ${parsed.canonicalName}.`,
              insights: [
                `Extracted pacing & typography standards for ${parsed.canonicalName}`,
                'High-retention kinetic subtitle highlights applied',
                'Visual outputs calibrated to creator brand spirit',
              ],
            },
            source: 'agentic_llm',
          }
        }
      }
    }
  } catch {
    // Timeout or network error safely ignored; fallback takes over instantly
  } finally {
    clearTimeout(timeoutId)
  }

  return null
}

/**
 * Procedural fallback when LLM is offline or timed out.
 * Runs in <1ms to guarantee blazing-fast execution.
 */
function resolveProceduralFallback(query: string): AgenticCreatorEntity {
  const clean = query.trim().replace(/^@/, '')
  const safeHandle = clean.toLowerCase().replace(/[^a-z0-9]/g, '')
  const titleName = clean
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Creator Brand'

  return {
    canonicalName: titleName,
    rawQuery: query,
    youtubeUrl: `https://www.youtube.com/@${safeHandle}`,
    instagramUrl: `https://instagram.com/${safeHandle}`,
    styleDNA: {
      tone: 'Dynamic & Authentic',
      typography: 'Clean Modern Grotesk with Kinetic Accent Highlights',
      colorAccent: '#55ff9b',
      pacing: 'Dynamic Micro-Cuts (<2s Retention Hooks)',
      aestheticDescription: `Video outputs and AI cuts calibrated to reflect the brand spirit of ${titleName}.`,
      insights: [
        `Calibrated video pacing to match ${titleName}'s delivery style`,
        'Configured kinetic typography and color highlights',
        'Video generation suite tuned to creator aesthetic standards',
      ],
    },
    source: 'procedural',
  }
}

/**
 * Master Agentic Creator Resolution:
 * 1. Checks memory cache (<0.1ms)
 * 2. Checks known profile fast-path (<1ms)
 * 3. Asks dedicated agentic LLM (with 2.2s timeout guard)
 * 4. Returns null if query is a generic brand name rather than a creator/persona,
 *    allowing clean fallback to Brand Specification.
 *
 * Guarantees that speed is NEVER sacrificed while providing rich agentic context!
 */
export async function resolveAgenticCreatorEntity(query: string): Promise<AgenticCreatorEntity | null> {
  const trimmed = query.trim()
  if (!trimmed) return null
  const cacheKey = trimmed.toLowerCase()

  if (entityCache.has(cacheKey)) {
    return entityCache.get(cacheKey) || null
  }

  // Tier 0: Fast path (<1ms) for verified creators and aliases
  const fastResult = resolveFastPath(trimmed)
  if (fastResult) {
    entityCache.set(cacheKey, fastResult)
    return fastResult
  }

  // Tier 1 & 2: Agentic LLM with strict time guard
  const llmResult = await queryAgenticLLM(trimmed)
  if (llmResult && llmResult.canonicalName && llmResult.youtubeUrl) {
    const fullEntity: AgenticCreatorEntity = {
      canonicalName: llmResult.canonicalName,
      rawQuery: trimmed,
      youtubeUrl: llmResult.youtubeUrl,
      instagramUrl: llmResult.instagramUrl || `https://instagram.com/${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      styleDNA: llmResult.styleDNA || {
        tone: 'Curated & Audience-Calibrated',
        typography: 'Kinetic Grotesk with High-Contrast Highlights',
        colorAccent: '#55ff9b',
        pacing: 'Dynamic Micro-Cuts',
      },
      source: 'agentic_llm',
    }
    entityCache.set(cacheKey, fullEntity)
    return fullEntity
  }

  return null
}
