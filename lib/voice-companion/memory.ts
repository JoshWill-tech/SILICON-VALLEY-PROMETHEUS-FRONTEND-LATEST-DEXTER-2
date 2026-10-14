/**
 * Jarvis Persistent Memory & Brand Context System
 *
 * Provides a lightweight, high-signal persistent memory mapping layer
 * that retains user brand identity, editorial decisions, and stylistic
 * preferences across browser refreshes and studio sessions.
 */

export interface UserBrandProfile {
  brandName?: string
  tone?: string
  preferredCaptionStyle?: string
  pacing?: 'rapid_dynamic' | 'cinematic_deliberate' | 'balanced'
  visualGuidelines?: string
}

export interface EditorialDecisionRecord {
  timestamp: number
  summary: string
  metadata?: Record<string, unknown>
}

export interface JarvisUserPreferences {
  autoRemoveSilences?: boolean
  silenceThresholdSec?: number
  favoriteTracks?: string[]
}

export interface ConversationTurn {
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

export interface MusicDiscussedRecord {
  trackId?: string
  trackTitle?: string
  artist?: string
  query?: string
  timestamp: number
}

export interface JarvisPersistentMemory {
  brandProfile: UserBrandProfile
  editorialDecisions: EditorialDecisionRecord[]
  userPreferences: JarvisUserPreferences
  recentConversations?: ConversationTurn[]
  lastMusicDiscussed?: MusicDiscussedRecord
  lastUpdated: number
}

const MEMORY_STORAGE_KEY_PREFIX = 'prometheus:jarvis:memory:'

// In-memory fallback map for non-browser / SSR / test environments
const memoryCache = new Map<string, JarvisPersistentMemory>()

function getDefaultMemory(): JarvisPersistentMemory {
  return {
    brandProfile: {
      brandName: 'Prometheus Creator',
      tone: 'Cinematic High-Authority',
      preferredCaptionStyle: 'clean_bold',
      pacing: 'cinematic_deliberate',
    },
    editorialDecisions: [],
    userPreferences: {
      autoRemoveSilences: true,
      silenceThresholdSec: 0.4,
      favoriteTracks: [],
    },
    recentConversations: [],
    lastUpdated: Date.now(),
  }
}

/**
 * Retrieve persistent memory for a given project or user
 */
export function getJarvisMemory(projectId = 'global'): JarvisPersistentMemory {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(`${MEMORY_STORAGE_KEY_PREFIX}${projectId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as JarvisPersistentMemory
        return {
          ...getDefaultMemory(),
          ...parsed,
          brandProfile: {
            ...getDefaultMemory().brandProfile,
            ...(parsed.brandProfile ?? {}),
          },
          userPreferences: {
            ...getDefaultMemory().userPreferences,
            ...(parsed.userPreferences ?? {}),
          },
          editorialDecisions: Array.isArray(parsed.editorialDecisions) ? parsed.editorialDecisions : [],
          recentConversations: Array.isArray(parsed.recentConversations)
            ? parsed.recentConversations.slice(-20)
            : [],
          lastMusicDiscussed: parsed.lastMusicDiscussed && typeof parsed.lastMusicDiscussed === 'object'
            ? parsed.lastMusicDiscussed
            : undefined,
        }
      }
    } catch {
      // Ignore localStorage parse error and fallback to cache
    }
  }

  if (!memoryCache.has(projectId)) {
    memoryCache.set(projectId, getDefaultMemory())
  }
  return memoryCache.get(projectId)!
}

/**
 * Persist updated memory for a given project or user
 */
export function saveJarvisMemory(
  update: Partial<JarvisPersistentMemory>,
  projectId = 'global'
): void {
  const current = getJarvisMemory(projectId)
  const next: JarvisPersistentMemory = {
    ...current,
    ...update,
    brandProfile: {
      ...current.brandProfile,
      ...(update.brandProfile ?? {}),
    },
    userPreferences: {
      ...current.userPreferences,
      ...(update.userPreferences ?? {}),
    },
    editorialDecisions: update.editorialDecisions
      ? update.editorialDecisions.slice(-25) // Keep last 25 decisions to prevent context bloat
      : current.editorialDecisions,
    recentConversations: update.recentConversations
      ? update.recentConversations.slice(-20) // Retain last 20 conversation turns
      : current.recentConversations,
    lastMusicDiscussed: update.lastMusicDiscussed !== undefined
      ? update.lastMusicDiscussed
      : current.lastMusicDiscussed,
    lastUpdated: Date.now(),
  }

  memoryCache.set(projectId, next)

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`${MEMORY_STORAGE_KEY_PREFIX}${projectId}`, JSON.stringify(next))
    } catch {
      // Storage quota or privacy mode error handling
    }
  }
}

/**
 * Clear stored memory for a project
 */
export function clearJarvisMemory(projectId = 'global'): void {
  memoryCache.delete(projectId)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(`${MEMORY_STORAGE_KEY_PREFIX}${projectId}`)
    } catch {
      // Ignore
    }
  }
}

/**
 * Format persistent memory into a concise system instruction prompt block
 */
export function formatMemoryForSystemInstruction(memory: JarvisPersistentMemory): string {
  const brand = memory.brandProfile
  const prefs = memory.userPreferences
  const decisions = memory.editorialDecisions.slice(-5)

  const lines = [
    '### PERSISTENT USER MEMORY & BRAND CONTEXT (RECALLED ACROSS SESSIONS):',
    brand.brandName ? `- Brand Name: ${brand.brandName}` : null,
    brand.tone ? `- Brand Tone / Aesthetic: ${brand.tone}` : null,
    brand.preferredCaptionStyle ? `- Preferred Caption Style: ${brand.preferredCaptionStyle}` : null,
    brand.pacing ? `- Editorial Pacing: ${brand.pacing}` : null,
    prefs.silenceThresholdSec ? `- Preferred Dead-Air Threshold: ${prefs.silenceThresholdSec}s` : null,
  ].filter(Boolean)

  if (decisions.length > 0) {
    lines.push('- Recent Editorial Decisions & Milestones:')
    for (const d of decisions) {
      lines.push(`  * ${d.summary}`)
    }
  }

  if (memory.lastMusicDiscussed && (memory.lastMusicDiscussed.trackTitle || memory.lastMusicDiscussed.query)) {
    const m = memory.lastMusicDiscussed
    const trackDesc = [m.trackTitle, m.artist ? `by ${m.artist}` : null].filter(Boolean).join(' ')
    lines.push(`- Last Discussed / Staged Music Track: "${trackDesc || m.query}"${m.trackId ? ` (ID: ${m.trackId})` : ''}`)
  }

  const recentTurns = (memory.recentConversations ?? []).slice(-10)
  if (recentTurns.length > 0) {
    lines.push('')
    lines.push('### PREVIOUS CONVERSATION CONTEXT (RETAINED ACROSS SESSIONS & PAGE RELOADS):')
    lines.push('You retain continuous conversational memory across page reloads. Here is the recent exchange with the user:')
    for (const turn of recentTurns) {
      const speaker = turn.role === 'user' ? 'User' : 'Jarvis'
      const cleanText = turn.text.replace(/\s+/g, ' ').trim()
      if (cleanText) {
        lines.push(`  * ${speaker}: "${cleanText}"`)
      }
    }
    lines.push('You MUST remember and acknowledge this context naturally when the user refers to past discussions, previous tracks, or asks if you recorded what was talked about. Never claim to lack a record of past conversations when this history is provided.')
  }

  return lines.join('\n')
}
