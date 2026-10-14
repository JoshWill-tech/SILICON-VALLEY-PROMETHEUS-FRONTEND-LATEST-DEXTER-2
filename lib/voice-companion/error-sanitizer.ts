/**
 * Sanitizes system, network, and parser errors into professional,
 * non-technical studio language for Jarvis / Gemini Live.
 * Prevents developer jargon ("unexpected token", JSON syntax, stack traces)
 * from ever reaching the end-user creator.
 */

export function sanitizeVoiceCompanionError(rawError: unknown): string {
  if (!rawError) {
    return 'An unexpected issue occurred while processing the request. I can try again for you.'
  }

  const text =
    typeof rawError === 'string'
      ? rawError
      : rawError instanceof Error
        ? rawError.message
        : String(rawError)

  // 1. JSON parsing and syntax errors
  if (/unexpected token|syntaxerror|is not valid json|json\.parse/i.test(text)) {
    return 'The rendering studio returned an unreadable response. I can resubmit the export for you.'
  }

  // 2. Authentication or expired session (prioritized over transport status codes)
  if (/401|403|unauthorized|user_authentication_required|jwt|token expired|auth_required/i.test(text)) {
    return 'Your studio session needs to be refreshed before starting a new render. Please reload the workspace.'
  }

  // 3. Gateway and timeout errors
  if (/504|gateway timeout|timed? ?out|aborterror/i.test(text)) {
    return 'The cloud render pipeline took longer than usual to acknowledge the dispatch. Check the export status or let me resubmit it.'
  }

  // 4. Bad gateway or cloud worker connectivity
  if (/502|503|bad gateway|service unavailable|failed to fetch|econnrefused/i.test(text)) {
    return 'The cloud rendering pipeline is temporarily reconnecting. Please give it a few moments, or I can try again.'
  }

  // 5. Clean up any accidental HTML tags or stack traces
  const cleaned = text
    .replace(/<[^>]*>?/gm, '')
    .replace(/at\s+[\w$./\\-]+\s+\([^)]*\)/gi, '')
    .trim()

  return cleaned || 'An issue occurred during export. Let me know if you would like me to try again.'
}
