import { PROMETHEUS_KNOWLEDGE_CHUNKS, type PrometheusKnowledgeChunk } from './knowledge.generated'

export type PrometheusKnowledgeMatch = PrometheusKnowledgeChunk & {
  score: number
}

const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'from',
  'have',
  'into',
  'just',
  'make',
  'that',
  'this',
  'what',
  'when',
  'where',
  'with',
  'your',
])

export function retrievePrometheusKnowledge(query: string, limit = 6): PrometheusKnowledgeMatch[] {
  const normalizedQuery = normalizeSearchText(query)
  const queryTokens = tokenize(normalizedQuery)
  if (!normalizedQuery || queryTokens.length === 0) return []

  return PROMETHEUS_KNOWLEDGE_CHUNKS.map((chunk) => {
    const content = normalizeSearchText(`${chunk.title} ${chunk.tags.join(' ')} ${chunk.content}`)
    return {
      ...chunk,
      score: scoreKnowledgeChunk(content, normalizedQuery, queryTokens),
    }
  })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex)
    .slice(0, Math.max(1, Math.min(12, limit)))
}

export function formatKnowledgeContext(matches: PrometheusKnowledgeMatch[]) {
  if (!matches.length) {
    return 'No bundled Prometheus knowledge chunks matched the query. Ask one concise clarifying question only if the request cannot be answered from project/video context.'
  }

  return matches
    .map((match, index) => {
      return [
        `Knowledge ${index + 1}: ${match.title}`,
        `Relevance: ${match.score.toFixed(2)}`,
        `Content: ${match.content}`,
      ].join('\n')
    })
    .join('\n\n')
}

export function createExtractivePrometheusAnswer(query: string, matches: PrometheusKnowledgeMatch[], maxChars = 900) {
  if (!matches.length) {
    return [
      "I don't have enough matching Prometheus knowledge loaded for that yet.",
      'Ask me with the project goal, target platform, and what feels wrong in the cut, and I can still reason from the current video context.',
    ].join(' ')
  }

  const queryTokens = new Set(tokenize(query))
  const excerpts = matches
    .flatMap((match) =>
      splitSentences(match.content).map((sentence) => ({
        sentence,
        source: match.title,
        score: scoreKnowledgeChunk(normalizeSearchText(sentence), normalizeSearchText(query), [...queryTokens]),
      })),
    )
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.sentence.length - b.sentence.length)
    .slice(0, 4)

  const body = excerpts.length
    ? excerpts.map((entry) => entry.sentence).join(' ')
    : matches
        .slice(0, 2)
        .map((match) => match.content.slice(0, 320))
        .join(' ')

  return clampText(body, maxChars)
}

export function normalizeAssistantText(value: unknown, maxChars = 1400) {
  const text = extractAssistantText(value)
    .replace(/^```(?:json|markdown)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!text) return ''

  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>
      const reply = extractAssistantText(record.reply ?? record.answer ?? record.content ?? record.message)
      if (reply) return clampText(reply, maxChars)
    }
  } catch {
    // Groq sometimes returns plain markdown/text; keep the original.
  }

  return clampText(text, maxChars)
}

export function clampText(value: string, maxChars: number) {
  const normalized = value.replace(/[ \t]+\n/g, '\n').replace(/\s+$/g, '').trim()
  if (normalized.length <= maxChars) return normalized

  const clipped = normalized.slice(0, Math.max(80, maxChars - 1))
  const sentenceEnd = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('! '), clipped.lastIndexOf('? '))
  if (sentenceEnd > Math.floor(maxChars * 0.55)) return `${clipped.slice(0, sentenceEnd + 1).trim()}`

  return `${clipped.trim()}...`
}

function scoreKnowledgeChunk(content: string, query: string, queryTokens: string[]) {
  let score = 0
  if (query.length > 12 && content.includes(query)) score += 9

  for (const token of queryTokens) {
    if (content.includes(token)) score += token.length > 7 ? 2.2 : 1
  }

  const bigrams = createBigrams(queryTokens)
  for (const bigram of bigrams) {
    if (content.includes(bigram)) score += 3
  }

  return score
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9:./-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokenize(value: string) {
  return normalizeSearchText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
    .slice(0, 48)
}

function createBigrams(tokens: string[]) {
  const bigrams: string[] = []
  for (let index = 0; index < tokens.length - 1; index += 1) {
    bigrams.push(`${tokens[index]} ${tokens[index + 1]}`)
  }
  return bigrams
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 60)
}

function extractAssistantText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') {
          return (part as { text: string }).text
        }
        return ''
      })
      .join('')
  }
  return ''
}
