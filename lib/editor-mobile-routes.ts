const STANDALONE_MOBILE_EDITOR_SEGMENTS = new Set(['music', 'motion', 'chat', 'versions', 'status', 'timeline'])

export function isStandaloneMobileEditorRoute(pathname: string | null | undefined) {
  if (!pathname) return false

  const normalizedPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  const segments = normalizedPath.split('/').filter(Boolean)

  return segments.length === 2 && segments[0] === 'editor' && STANDALONE_MOBILE_EDITOR_SEGMENTS.has(segments[1])
}
