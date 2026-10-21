/** Format source dimensions without presenting a decimal as an aspect-ratio preset. */
export function formatSourceAspectRatio(width: number, height: number): string {
  if (!(width > 0 && height > 0)) return 'Unknown'
  const ratio = width / height
  const presets = [[16, 9], [9, 16], [1, 1], [4, 5], [5, 4], [4, 3], [3, 4], [21, 9], [3, 2], [2, 3]]
  const match = presets.find(([w, h]) => Math.abs(ratio - w / h) < 0.025)
  if (match) return `${match[0]}:${match[1]}`
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
  const divisor = gcd(Math.round(width), Math.round(height))
  return `${Math.round(width) / divisor}:${Math.round(height) / divisor}`
}

export function getMediaFailureMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'Microphone access is blocked. Allow microphone access for this site in your browser settings, then retry. You can keep using text chat.'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No microphone was found. Connect a microphone and retry, or use text chat.'
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'Your microphone is busy or unavailable. Close other apps using it and retry.'
  // Classify provider failures before the generic transport fallback. Never
  // diagnose exhausted tokens from a WebSocket error alone.
  if (/resource[_ ]exhausted|quota|rate.?limit|too many requests|\b429\b/i.test(message)) return 'The voice provider reached its usage limit. Check the Gemini project quota and billing, or retry after the limit resets.'
  if (/model.*(?:not found|not supported|unavailable|retired|shut.?down)|not supported for bidiGenerateContent/i.test(message)) return 'The configured voice model is unavailable. The voice service configuration needs to be updated before reconnecting.'
  if (/invalid api key|api key.*(?:not valid|invalid|revoked|expired)|unauthenticated|permission_denied/i.test(message)) return 'The voice service credentials are unavailable or lack access. Check the service configuration before reconnecting.'
  if (/websocket|gemini|server credentials|permission denied|api key|setup timed out/i.test(message)) return 'The voice service is unavailable. Use text chat while the connection is restored, or retry the connection.'
  return message || 'Voice could not connect. Retry or continue in text chat.'
}
