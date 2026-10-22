import { extractYouTubeVideoId } from '@/lib/media/youtube-clip-service'

export interface ResolvedBrand {
  brandName: string
  rawInput: string
  type: string
  url: string
  category: 'youtube' | 'social' | 'domain' | 'fallback'
  title?: string
  thumbnailUrl?: string
  description?: string
}

function cleanTitle(str: string): string {
  return str.replace(/\s+/g, ' ').trim()
}

function formatBrandName(name: string): string {
  const cleaned = name.replace(/[_-]+/g, ' ').trim()
  if (!cleaned) return 'Creator Brand'
  // Title case each word if entirely lowercase or uppercase
  if (cleaned === cleaned.toLowerCase() || (cleaned === cleaned.toUpperCase() && cleaned.length > 3)) {
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

/**
 * Server-safe YouTube metadata resolver using public oEmbed.
 * No YouTube API key required, fast (<250ms), and official.
 */
export async function resolveYouTubeBrand(rawUrlOrVideoId: string): Promise<ResolvedBrand | null> {
  const videoId = extractYouTubeVideoId(rawUrlOrVideoId)
  if (!videoId) return null

  const canonicalVideoUrl = `https://www.youtube.com/watch?v=${videoId}`
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalVideoUrl)}&format=json`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = (await response.json()) as {
        title?: string
        author_name?: string
        author_url?: string
        thumbnail_url?: string
      }

      const rawAuthor = data.author_name ? cleanTitle(data.author_name) : ''
      const author = rawAuthor.replace(/\.+$/, '') // e.g. "lock in music." -> "lock in music"
      const brandName = author ? formatBrandName(author) : 'YouTube Creator'
      const channelUrl = data.author_url || canonicalVideoUrl

      return {
        brandName,
        rawInput: rawUrlOrVideoId,
        type: 'YouTube Creator',
        url: channelUrl,
        category: 'youtube',
        title: data.title ? cleanTitle(data.title) : undefined,
        thumbnailUrl: data.thumbnail_url,
      }
    }
  } catch {
    // Graceful fallback below
  }

  return {
    brandName: 'YouTube Creator',
    rawInput: rawUrlOrVideoId,
    type: 'YouTube Video',
    url: canonicalVideoUrl,
    category: 'youtube',
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  }
}

/**
 * Server-safe website brand resolver.
 */
export async function resolveWebsiteBrand(rawUrl: string): Promise<ResolvedBrand | null> {
  const trimmed = rawUrl.trim()
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let parsedUrl: URL
  try {
    parsedUrl = new URL(candidate)
  } catch {
    return null
  }

  const hostname = parsedUrl.hostname.replace(/^www\./, '').toLowerCase()
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.local')) {
    return null
  }

  const domainParts = hostname.split('.')
  const defaultName = domainParts.length > 1 ? domainParts[0] : hostname
  const fallbackBrandName = formatBrandName(defaultName)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)
    const response = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PrometheusBrandDiscovery/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const html = await response.text()
      // Extract <meta property="og:site_name" content="...">
      const siteNameMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i)
      if (siteNameMatch && siteNameMatch[1]?.trim()) {
        return {
          brandName: cleanTitle(siteNameMatch[1]),
          rawInput: rawUrl,
          type: 'Brand Website URL',
          url: parsedUrl.href,
          category: 'domain',
        }
      }

      // Extract <title>
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch && titleMatch[1]?.trim()) {
        const rawTitle = cleanTitle(titleMatch[1])
        // Common title formats: "BrandName: Tagline", "BrandName - Tagline", "BrandName | Tagline"
        const segments = rawTitle.split(/[-–—|:•]/)
        const primary = segments[0]?.trim()
        if (primary && primary.length >= 2 && primary.length <= 40) {
          return {
            brandName: primary,
            rawInput: rawUrl,
            type: 'Brand Website URL',
            url: parsedUrl.href,
            category: 'domain',
            title: rawTitle,
          }
        }
      }
    }
  } catch {
    // Fall back to hostname derivation
  }

  return {
    brandName: fallbackBrandName,
    rawInput: rawUrl,
    type: 'Brand Website URL',
    url: parsedUrl.href,
    category: 'domain',
  }
}

/**
 * Master brand resolver handling YouTube URLs/videos/channels, social handles, websites, and brand names.
 */
export async function resolveBrand(query: string): Promise<ResolvedBrand> {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      brandName: 'Your Brand',
      rawInput: query,
      type: 'Brand Specification',
      url: '',
      category: 'fallback',
    }
  }

  // 1. YouTube video or watch URL
  if (/youtube\.com|youtu\.be/i.test(trimmed)) {
    // If it has a video ID (watch?v=, youtu.be/, shorts/, embed/)
    const videoId = extractYouTubeVideoId(trimmed)
    if (videoId) {
      const ytResult = await resolveYouTubeBrand(trimmed)
      if (ytResult) return ytResult
    }

    // Channel handle / name
    const handleMatch = trimmed.match(/@([a-zA-Z0-9_.-]+)/)
    if (handleMatch) {
      const handle = handleMatch[1]
      return {
        brandName: formatBrandName(handle),
        rawInput: trimmed,
        type: 'YouTube Channel',
        url: `https://www.youtube.com/@${handle}`,
        category: 'youtube',
      }
    }

    const channelPathMatch = trimmed.match(/youtube\.com\/(?:c\/|channel\/|user\/)?([^/?#]+)/i)
    if (channelPathMatch && channelPathMatch[1] && !channelPathMatch[1].startsWith('watch')) {
      const clean = channelPathMatch[1].replace(/^@/, '')
      return {
        brandName: formatBrandName(clean),
        rawInput: trimmed,
        type: 'YouTube Channel',
        url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
        category: 'youtube',
      }
    }

    return {
      brandName: 'YouTube Creator',
      rawInput: trimmed,
      type: 'YouTube Channel',
      url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      category: 'youtube',
    }
  }

  // 2. Instagram or Social Handle / URL
  if (trimmed.startsWith('@') || /instagram\.com|tiktok\.com|twitter\.com|x\.com/i.test(trimmed)) {
    const handle = trimmed
      .replace(/^@/, '')
      .replace(/^(https?:\/\/)?(www\.)?(instagram|tiktok|twitter|x)\.com\//i, '')
      .replace(/\/.*$/, '')
      .split('?')[0]
      .trim()

    const brandName = formatBrandName(handle) || 'Creator Brand'
    return {
      brandName,
      rawInput: trimmed,
      type: 'Instagram / Social Handle',
      url: trimmed.startsWith('http') ? trimmed : `https://instagram.com/${handle}`,
      category: 'social',
    }
  }

  // 3. Web domain or URL
  if (/^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i.test(trimmed)) {
    const websiteResult = await resolveWebsiteBrand(trimmed)
    if (websiteResult) return websiteResult
  }

  // 4. Fallback Brand Name
  return {
    brandName: formatBrandName(trimmed),
    rawInput: trimmed,
    type: 'Brand Specification',
    url: '',
    category: 'fallback',
  }
}
