function clickDownload(url: string, filename: string, openInNewTab = false) {
  if (typeof document === 'undefined') return
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  if (openInNewTab) anchor.target = '_blank'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function isCrossOriginHttpUrl(url: string, baseUrl?: string) {
  try {
    const resolvedBase = baseUrl || (typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000')
    const parsedUrl = new URL(url, resolvedBase)
    const parsedBaseUrl = new URL(resolvedBase)
    return /^https?:$/.test(parsedUrl.protocol) && parsedUrl.origin !== parsedBaseUrl.origin
  } catch {
    return false
  }
}

export async function downloadMedia(url: string, filename: string, fetcher = fetch) {
  let response: Response
  try {
    response = await fetcher(url)
  } catch (error) {
    // A signed R2 preview can be valid while blocking JavaScript fetches via
    // CORS. The browser can still follow that delivery URL directly.
    if (isCrossOriginHttpUrl(url)) {
      clickDownload(url, filename, true)
      return
    }
    throw error
  }

  if (!response.ok) {
    let message = `Unable to download the video (HTTP ${response.status}).`
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch {
      // not JSON
    }
    throw new Error(message)
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => ({} as Record<string, unknown>))
    throw new Error(data?.error || 'Export output is not ready.')
  }

  const blob = await response.blob()
  if (blob.size < 64) {
    const text = await blob.text().catch(() => '')
    throw new Error(text.trim() || 'Export output is incomplete or empty.')
  }

  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof document !== 'undefined') {
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
  }
}
