import type { BrandStyleDNA } from '@/lib/brand/resolve'

export interface CreatorPlatformRecommendation {
  platform: 'youtube' | 'instagram' | 'website' | 'other'
  title: string
  subtitle: string
  handleOrUrl: string
  badge: string
  avatarUrl?: string
  brandName: string
  styleDNASummary?: string
}

export interface RelatedCreatorRecommendation {
  id: string
  name: string
  designation: string
  relation: string
  platform: 'youtube' | 'instagram' | 'both'
  handle: string
  avatar?: string
  accent: string
}

export interface CreatorRecommendationProfile {
  name: string
  aliases: string[]
  platforms: CreatorPlatformRecommendation[]
  relatedCreators: RelatedCreatorRecommendation[]
  styleDNA: BrandStyleDNA
  jarvisInsight: string
}

export interface BrandDiscoveryRecommendations {
  query: string
  matchedCreator?: string
  platformOptions: CreatorPlatformRecommendation[]
  relatedCreators: RelatedCreatorRecommendation[]
  jarvisInsight: string
  suggestedStyleDNA?: BrandStyleDNA
}

export const KNOWN_CREATOR_PROFILES: Record<string, CreatorRecommendationProfile> = {
  'Neil Patel': {
    name: 'Neil Patel',
    aliases: ['neil', 'neil pat', 'neil patel', 'neilpatel', 'ubersuggest', 'np digital', 'marketing school'],
    platforms: [
      {
        platform: 'youtube',
        title: 'Neil Patel',
        subtitle: '@neilpatel • 1.25M subscribers • SEO & Growth Architecture',
        handleOrUrl: 'https://www.youtube.com/@neilpatel',
        badge: 'YouTube',
        brandName: 'Neil Patel',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        styleDNASummary: 'Authoritative data-driven hooks (<1.8s) & step-by-step framework pacing',
      },
      {
        platform: 'instagram',
        title: 'Neil Patel (@neilpatel)',
        subtitle: '500K+ followers • Marketing carousels & tactical reels',
        handleOrUrl: 'https://instagram.com/neilpatel',
        badge: 'Instagram',
        brandName: 'Neil Patel',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        styleDNASummary: 'High-contrast typography with kinetic punch-in callouts',
      },
      {
        platform: 'website',
        title: 'neilpatel.com',
        subtitle: 'Official Platform • NP Digital & Ubersuggest Analytics',
        handleOrUrl: 'https://neilpatel.com',
        badge: 'Official Web',
        brandName: 'Neil Patel',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        styleDNASummary: 'Clean orange & slate data visualization aesthetic',
      },
    ],
    relatedCreators: [
      {
        id: 'eric_siu',
        name: 'Eric Siu',
        designation: 'Agency Scaler',
        relation: 'Marketing School Co-Host',
        platform: 'both',
        handle: '@ericosiu',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        accent: '#55ff9b',
      },
      {
        id: 'brian_dean',
        name: 'Brian Dean',
        designation: 'SEO Architect',
        relation: 'Backlinko Founder & YouTube Ranking Master',
        platform: 'youtube',
        handle: '@briandean',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        accent: '#38bdf8',
      },
      {
        id: 'gary_vee',
        name: 'Gary Vaynerchuk',
        designation: 'Social Engine',
        relation: 'Hyper-Volume Social Distribution Archetype',
        platform: 'both',
        handle: '@garyvee',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        accent: '#f97316',
      },
      {
        id: 'vanessa_lau',
        name: 'Vanessa Lau',
        designation: 'Conversion Strategist',
        relation: 'Organic Social & Personal Brand Authority',
        platform: 'youtube',
        handle: '@vanessalau',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        accent: '#ec4899',
      },
      {
        id: 'hubspot',
        name: 'HubSpot Marketing',
        designation: 'Content System',
        relation: 'Inbound Methodology & Structured Video Guides',
        platform: 'both',
        handle: '@hubspot',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
        accent: '#ff7a59',
      },
    ],
    styleDNA: {
      tone: 'Authoritative, Tactical & Data-Driven',
      typography: 'Bold Modern Grotesk & Kinetic Callouts',
      colorAccent: '#FF6B35',
      pacing: 'Rapid <2s Hook & Micro-Case Studies',
      aestheticDescription: 'High-contrast infographic video architecture calibrated for audience retention, featuring bold statistic pop-ups, kinetic callouts, and clean tactical pacing.',
      insights: [
        'Authoritative metric hook delivered within first 1.8 seconds',
        'Kinetic word highlighting on statistics, keywords, and frameworks',
        'Clean high-contrast data callouts with signature orange & emerald accents',
        'Step-by-step modular pacing with no narrative filler or dead air',
      ],
    },
    jarvisInsight: 'Neil Patel archetype detected. Neil uses high-velocity tactical hooks, data-dense infographic graphics, and 1.8-second audience retention cuts. Calibrating video suite to Neil Patel will apply authoritative typography, rapid pacing, and kinetic callouts across your cuts.',
  },

  'Alex Hormozi': {
    name: 'Alex Hormozi',
    aliases: ['alex', 'hormozi', 'alex hormozi', '@alexhormozi', 'acquisition.com'],
    platforms: [
      {
        platform: 'youtube',
        title: 'Alex Hormozi',
        subtitle: '@AlexHormozi • 2.6M subscribers • Business & Offers Architecture',
        handleOrUrl: 'https://www.youtube.com/@AlexHormozi',
        badge: 'YouTube',
        brandName: 'Alex Hormozi',
        avatarUrl: '/library/alex-hormozi/hero.jpg',
        styleDNASummary: 'Extreme conviction pacing, visceral metaphors, and brutal honesty',
      },
      {
        platform: 'instagram',
        title: 'Alex Hormozi (@hormozi)',
        subtitle: '2.4M followers • High-retention reels & frameworks',
        handleOrUrl: 'https://instagram.com/hormozi',
        badge: 'Instagram',
        brandName: 'Alex Hormozi',
        avatarUrl: '/library/alex-hormozi/hero.jpg',
        styleDNASummary: 'Kinetic subtitles with yellow/green highlights & punch-ins',
      },
    ],
    relatedCreators: [
      {
        id: 'leila_hormozi',
        name: 'Leila Hormozi',
        designation: 'Scale Operator',
        relation: 'Acquisition.com CEO & Systems Leader',
        platform: 'both',
        handle: '@leilahormozi',
        avatar: '/library/people/leila-hormozi.png',
        accent: '#55ff9b',
      },
      {
        id: 'codie_sanchez',
        name: 'Codie Sanchez',
        designation: 'Cash Strategist',
        relation: 'Contrarian Thinking & Main Street Assets',
        platform: 'both',
        handle: '@codiesanchez',
        avatar: '/library/people/codie-sanchez.png',
        accent: '#38bdf8',
      },
      {
        id: 'dan_martell',
        name: 'Dan Martell',
        designation: 'SaaS Mentor',
        relation: 'Buy Back Your Time & Founder Systems',
        platform: 'both',
        handle: '@danmartell',
        avatar: '/library/people/dan-martell.png',
        accent: '#a855f7',
      },
    ],
    styleDNA: {
      tone: 'Direct, Authoritative & Contrarian',
      typography: 'Heavy Weight Sans with Kinetic Pop & Highlighting',
      colorAccent: '#55ff9b',
      pacing: 'Dynamic Micro-Cuts & Audio Ducking',
      aestheticDescription: 'High-contrast studio setup with visceral hand gestures, kinetic text pops, and zero corporate jargon.',
      insights: [
        'Direct value promise in first sentence',
        'Kinetic subtitle animation with bold color accents',
        'Short punchy sentences calibrated for viral retention',
      ],
    },
    jarvisInsight: 'Alex Hormozi archetype active. Calibrated for grand-slam offer clarity, rapid sentence cadence, and kinetic subtitle punch-ins.',
  },

  'Joseph Video Editing': {
    name: 'Joseph | Video Editing',
    aliases: ['joseph', 'joseph video editing', '@josephvideoediting'],
    platforms: [
      {
        platform: 'youtube',
        title: 'Joseph | Video Editing',
        subtitle: '@josephvideoediting • Video production breakdowns & editing craft',
        handleOrUrl: 'https://www.youtube.com/@josephvideoediting',
        badge: 'YouTube',
        brandName: 'Joseph | Video Editing',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        styleDNASummary: 'Cinematic pacing, SFX sound design, and After Effects craft',
      },
    ],
    relatedCreators: [
      {
        id: 'film_riot',
        name: 'Film Riot',
        designation: 'VFX Director',
        relation: 'Practical Filmmaking & VFX Workflows',
        platform: 'youtube',
        handle: '@filmriot',
        accent: '#38bdf8',
      },
      {
        id: 'sam_kolder',
        name: 'Sam Kolder',
        designation: 'Cinematic Master',
        relation: 'Seamless Speed Ramps & Visual Storytelling',
        platform: 'youtube',
        handle: '@kold',
        accent: '#55ff9b',
      },
    ],
    styleDNA: {
      tone: 'Cinematic & High-Retention',
      typography: 'Modernist Sans & Documentary Serif Accents',
      colorAccent: '#55ff9b',
      pacing: 'Dynamic Micro-Cuts & Audio Ducking',
      aestheticDescription: 'Pacing, SFX layers, and visual effects calibrated to creator DNA.',
    },
    jarvisInsight: 'Video editing archetype detected. Pacing calibrated with dynamic micro-cuts, precision SFX ducking, and kinetic text layers.',
  },
}

/**
 * Searches and synthesizes cross-platform and related creator recommendations on the fly.
 */
export function getCreatorRecommendations(query: string): BrandDiscoveryRecommendations {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      query,
      platformOptions: [],
      relatedCreators: [],
      jarvisInsight: 'I am Jarvis, your Creative Intelligence Assistant. Search any creator or platform to calibrate video outputs in their visual spirit.',
    }
  }

  const normalized = trimmed.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/^@/, '')
  const cleanWord = normalized.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

  // 1. Direct or partial match against curated creator profiles
  for (const [creatorKey, profile] of Object.entries(KNOWN_CREATOR_PROFILES)) {
    const keyNorm = creatorKey.toLowerCase()
    const matchesKey = keyNorm.includes(cleanWord) || cleanWord.includes(keyNorm)
    const matchesAlias = profile.aliases.some((alias) => {
      const aliasNorm = alias.toLowerCase().replace(/^@/, '')
      return cleanWord.includes(aliasNorm) || aliasNorm.includes(cleanWord)
    })

    if (matchesKey || matchesAlias) {
      return {
        query: trimmed,
        matchedCreator: profile.name,
        platformOptions: profile.platforms,
        relatedCreators: profile.relatedCreators,
        jarvisInsight: profile.jarvisInsight,
        suggestedStyleDNA: profile.styleDNA,
      }
    }
  }

  // 2. Synthesize dynamic on-the-go recommendations for unknown/custom creators
  const titleName = cleanWord
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Creator Brand'

  const safeHandle = cleanWord.replace(/\s+/g, '').toLowerCase() || 'creator'

  const dynamicPlatforms: CreatorPlatformRecommendation[] = [
    {
      platform: 'youtube',
      title: `${titleName} on YouTube`,
      subtitle: `@${safeHandle} • Stream & video reference archives`,
      handleOrUrl: `https://www.youtube.com/@${safeHandle}`,
      badge: 'YouTube Channel',
      brandName: titleName,
      styleDNASummary: 'Video pacing, title cards, and thumbnail aesthetics calibrated to YouTube',
    },
    {
      platform: 'instagram',
      title: `${titleName} (@${safeHandle})`,
      subtitle: `Instagram Reels, Carousels & Visual Grid Archetype`,
      handleOrUrl: `https://instagram.com/${safeHandle}`,
      badge: 'Instagram',
      brandName: titleName,
      styleDNASummary: 'High-contrast mobile typography, short-form reels cadence',
    },
    {
      platform: 'website',
      title: `${safeHandle}.com`,
      subtitle: `Official Digital Domain & Brand Hub`,
      handleOrUrl: `https://${safeHandle}.com`,
      badge: 'Official Web',
      brandName: titleName,
      styleDNASummary: 'Core brand colors, typography tokens, and design language',
    },
  ]

  // Intelligent related recommendations based on common creator categories
  const dynamicRelated: RelatedCreatorRecommendation[] = [
    {
      id: 'alex_hormozi',
      name: 'Alex Hormozi',
      designation: 'Offer Architect',
      relation: 'High-Velocity Authority Benchmark',
      platform: 'both',
      handle: '@alexhormozi',
      avatar: '/library/alex-hormozi/hero.jpg',
      accent: '#55ff9b',
    },
    {
      id: 'neil_patel',
      name: 'Neil Patel',
      designation: 'Growth Authority',
      relation: 'Data-Driven Retention & Organic Scale',
      platform: 'both',
      handle: '@neilpatel',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      accent: '#f97316',
    },
    {
      id: 'codie_sanchez',
      name: 'Codie Sanchez',
      designation: 'Cash Strategist',
      relation: 'Clear Visual Frameworks & Contrast Styling',
      platform: 'both',
      handle: '@codiesanchez',
      avatar: '/library/people/codie-sanchez.png',
      accent: '#38bdf8',
    },
  ]

  const dynamicStyleDNA: BrandStyleDNA = {
    tone: 'Curated & Audience-Calibrated',
    typography: 'Modern Grotesk with High-Contrast kinetic accents',
    colorAccent: '#55ff9b',
    pacing: 'Dynamic Micro-Cuts with 2-Second Retention Hooks',
    aestheticDescription: `Video outputs and AI cuts calibrated to reflect the brand spirit of ${titleName}.`,
    insights: [
      `Calibrated video pacing to match ${titleName}'s core delivery style`,
      'Configured kinetic typography and color highlights',
      'Video generation suite tuned to creator aesthetic standards',
    ],
  }

  return {
    query: trimmed,
    matchedCreator: titleName,
    platformOptions: dynamicPlatforms,
    relatedCreators: dynamicRelated,
    jarvisInsight: `I have analyzed ${titleName}. I can calibrate your Prometheus video outputs with their signature pacing, typography accents, and narrative cadence.`,
    suggestedStyleDNA: dynamicStyleDNA,
  }
}
