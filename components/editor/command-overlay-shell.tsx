'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Check, 
  X,
  MessageSquare,
  ChevronRight,
  Target,
  ChevronLeft,
  Flame,
  Music,
  Maximize2,
  Settings2,
  PenTool,
  Clock,
  Plus,
  Minus,
  Info,
  ExternalLink,
  Layers,
  Zap,
  Volume2,
  Layout,
  Type,
  Eye,
  TrendingUp,
  ShieldCheck,
  Heart,
  Lightbulb,
  Rocket,
  Star,
  Timer,
  Users,
  Infinity as InfinityIcon,
  Badge,
  GraduationCap,
  MousePointerClick,
  Crown,
  Sun,
  ShoppingBag,
  UserCheck,
  CheckCircle2,
  Diamond,
  Share2,
  Activity,
  ArrowUpRight,
  BookOpen,
  HelpCircle,
  AlertTriangle
} from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { chamberSpring } from '@/lib/chamber-motion'
import { cn } from '@/lib/utils'
import { useStableReducedMotion } from '@/hooks/use-stable-reduced-motion'
import type { CreativeMetadata } from '@/lib/editorial-frame/types'

// --- Editorial Knowledge Base ---

const VISION_HELPERS = [
  "Make this feel premium and authoritative",
  "Make this feel like a high-retention short",
  "Make this feel cinematic and emotional",
  "Make this feel educational but visually sharp",
  "Make this feel like a launch/promo piece",
  "Make this feel founder-led and trustworthy",
  "Make this feel bold, fast, and impossible to ignore"
]

const EDITORIAL_PROBES = [
  "What should the viewer believe by the end?",
  "What should the viewer feel in the first 3 seconds?",
  "What should never be changed from the original?",
  "What part carries the most trust?",
  "Is there a moment that should feel more expensive?",
  "Should the hook feel aggressive or refined?",
  "Should captions lead the story or simply support it?",
  "Should the music drive emotion or stay behind voice?",
  "Must not feel 'too AI-generated'",
  "Ending should create urgency"
]

const FOLLOW_UP_QUESTIONS: Record<string, string[]> = {
  retention: [
    "What should stop the viewer from scrolling?",
    "Should the hook create curiosity, tension, shock, or authority?",
    "Should we use pattern interrupts aggressively or subtly?"
  ],
  authority: [
    "What should make the viewer trust you?",
    "Should the edit feel more restrained, expert, or dominant?",
    "Should captions emphasize proof, logic, or confidence?"
  ],
  sales: [
    "What objection should this video overcome?",
    "Should the CTA feel direct, soft, premium, or urgent?",
    "Should product desire come from proof, emotion, or status?"
  ],
  captions: [
    "Should captions lead the story or support the speaker?",
    "Should captions feel bold, clean, kinetic, luxury, or documentary?",
    "Should emphasis appear on keywords, phrases, or emotional beats?"
  ],
  music: [
    "Should music drive the emotion or stay behind the voice?",
    "Should it feel cinematic, motivational, tense, minimal, or luxury?",
    "Should there be a beat drop near the hook or payoff?"
  ],
  broll: [
    "Should B-roll prove the point, decorate the story, or create emotion?",
    "Should it feel literal, symbolic, aspirational, or documentary?"
  ],
  cinematic: [
    "Should this feel like a trailer, documentary, brand film, or founder story?"
  ],
  fast: [
    "Should the pace be fast throughout, or only around hooks and transitions?"
  ],
}

const EDITOR_PRO_TIPS = [
  "If the hook is weak, no amount of caption polish will save the edit.",
  "The first 3 seconds should create tension, promise, or curiosity.",
  "Captions should not repeat the voice. They should sharpen the idea.",
  "Music should support emotion, not fight the speaker.",
  "A premium edit usually removes more than it adds.",
  "Pattern interrupts work best when they clarify, not decorate.",
  "The viewer should always know where to look.",
  "If everything is emphasized, nothing is emphasized.",
  "Silence before a key line can make the line feel more expensive.",
  "B-roll should prove the point, not fill empty space.",
  "The best edits feel inevitable, not busy.",
  "Typography should feel like a narrator, not a sticker.",
  "Strong pacing is contrast: fast moments need breath moments.",
  "A premium color grade should support trust, not scream for attention.",
  "The ending should create a decision: believe, click, save, buy, or share.",
  "If a transition doesn’t add meaning, it’s probably noise.",
  "The hook should not explain everything. It should open a loop.",
  "Authority edits need restraint. Viral edits need disruption.",
  "A good CTA feels like the next natural thought.",
  "The strongest visual moment should land near the strongest idea.",
  "If the speaker sounds calm, don’t force chaotic motion.",
  "Editing should remove friction between the idea and the viewer.",
  "The most premium motion is often the motion you almost don’t notice.",
  "Good captions create rhythm before the viewer realizes it.",
  "Every visual choice should answer: why now?"
]

const GOALS = [
  { id: 'retention', label: 'Retention', description: 'Keep viewers watching longer', icon: InfinityIcon },
  { id: 'authority', label: 'Authority', description: 'Establish expert credibility', icon: ShieldCheck },
  { id: 'clarity', label: 'Clarity', description: 'Simplify complex ideas', icon: Lightbulb },
  { id: 'sales', label: 'Sales', description: 'Drive conversion and action', icon: Target },
  { id: 'storytelling', label: 'Storytelling', description: 'Narrative emotional arc', icon: BookOpen },
  { id: 'emotion', label: 'Emotion', description: 'Deeply move your audience', icon: Heart },
  { id: 'trust', label: 'Trust', description: 'Build brand confidence', icon: Badge },
  { id: 'virality', label: 'Virality', description: 'Engineered for shareability', icon: Share2 },
  // More Goals
  { id: 'education', label: 'Education', description: 'Teach and inform effectively', icon: GraduationCap },
  { id: 'conversion', label: 'Conversion', description: 'Turn viewers into customers', icon: MousePointerClick },
  { id: 'brand_prestige', label: 'Brand Prestige', description: 'Elevate perceived value', icon: Crown },
  { id: 'audience_warmth', label: 'Audience Warmth', description: 'Build personal connection', icon: Sun },
  { id: 'product_desire', label: 'Product Desire', description: 'Make them want it now', icon: ShoppingBag },
  { id: 'founder_authority', label: 'Founder Authority', description: 'Spotlight leader expertise', icon: UserCheck },
  { id: 'community', label: 'Community Belonging', description: 'Make viewers feel included', icon: Users },
  { id: 'launch_momentum', label: 'Launch Momentum', description: 'Create hype for what is new', icon: Rocket },
  { id: 'objection_handling', label: 'Objection Handling', description: 'Systematically remove doubts', icon: CheckCircle2 },
  { id: 'premium_perception', label: 'Premium Perception', description: 'Position as a top-tier choice', icon: Diamond },
]

const FOCUS_AREAS = [
  { id: 'captions', label: 'Captions', icon: Type },
  { id: 'pacing', label: 'Pacing', icon: Timer },
  { id: 'music', label: 'Music', icon: Volume2 },
  { id: 'broll', label: 'B-Roll', icon: Maximize2 },
  { id: 'transitions', label: 'Transitions', icon: Zap },
  { id: 'hook', label: 'The Hook', icon: Flame },
  { id: 'color', label: 'Color Grade', icon: PenTool },
  { id: 'typography', label: 'Typography', icon: Settings2 },
  // More Focus Areas
  { id: 'sound_design', label: 'Sound Design', icon: Volume2 },
  { id: 'scene_structure', label: 'Scene Structure', icon: Layers },
  { id: 'cut_rhythm', label: 'Cut Rhythm', icon: TrendingUp },
  { id: 'mograph', label: 'Motion Graphics', icon: Sparkles },
  { id: 'lower_thirds', label: 'Lower Thirds', icon: Layout },
  { id: 'cta', label: 'CTA', icon: ArrowUpRight },
  { id: 'framing', label: 'Framing', icon: Eye },
  { id: 'visual_hierarchy', label: 'Visual Hierarchy', icon: Layout },
  { id: 'emotional_beats', label: 'Emotional Beats', icon: Activity },
  { id: 'pattern_interrupts', label: 'Pattern Interrupts', icon: Lightbulb },
  { id: 'proof_moments', label: 'Proof Moments', icon: ShieldCheck },
  { id: 'ending', label: 'Ending / Payoff', icon: Rocket },
]

const ENERGIES = [
  { id: 'premium', label: 'Premium' },
  { id: 'sharp', label: 'Sharp' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'educational', label: 'Educational' },
  { id: 'motivational', label: 'Motivational' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'fast', label: 'Fast-paced' },
  { id: 'calm', label: 'Calm' },
  // More Energies
  { id: 'documentary', label: 'Documentary' },
  { id: 'high_tension', label: 'High-tension' },
  { id: 'warm', label: 'Warm' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'explosive', label: 'Explosive' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'confident', label: 'Confident' },
  { id: 'founder_led', label: 'Founder-led' },
  { id: 'viral', label: 'Viral' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'futuristic', label: 'Futuristic' },
  { id: 'human', label: 'Human' },
]

interface ReferenceDirection {
  id: string
  category: 'biz' | 'viral' | 'cinematic' | 'product' | 'edu'
  label: string
  description: string
  duration: string
  styleId: string
  bestFor: string
  avoidWhen: string
  editorsNote: string
  whyWorks: string
  whatChanges: string
  traits: string[]
  useThis: string
  pacing: string
  captionStyle: string
  musicEnergy: string
  motionIntensity: string
  tone: string
}

const REFERENCES: ReferenceDirection[] = [
  // --- Business / Authority ---
  { 
    id: 'biz_authority', 
    category: 'biz',
    label: 'Premium Business Authority', 
    description: 'Minimalist, sharp typography, authoritative pacing.',
    duration: '10s sample',
    styleId: 'auth_v1',
    bestFor: 'LinkedIn/X thought leadership, expert explainers.',
    avoidWhen: 'Content needs comedy, chaos, or extreme high-energy.',
    editorsNote: 'Use when trust and prestige matter more than visual spectacle.',
    whyWorks: 'Clean lines and restrained motion signal professionalism and intellectual depth.',
    whatChanges: 'Removes flashy transitions, centers captions, and applies a prestige-low music profile.',
    traits: ['Clean Typography', 'Subtle Color Grade', 'Stepping Pacing'],
    useThis: 'When establishing expert status is the #1 priority.',
    pacing: 'authoritative',
    captionStyle: 'minimalist_sharp',
    musicEnergy: 'low_prestige',
    motionIntensity: 'subtle',
    tone: 'confident'
  },
  { 
    id: 'founder_trust', 
    category: 'biz',
    label: 'Founder-Led Trust Edit', 
    description: 'Focuses on transparency and direct connection.',
    duration: '10s sample',
    styleId: 'founder_v1',
    bestFor: 'Internal updates, founder diaries, community announcements.',
    avoidWhen: 'Highly produced commercial launches.',
    editorsNote: 'Prioritize clear dialogue and authentic eye contact over heavy overlays.',
    whyWorks: 'Human connection is the most powerful trust signal.',
    whatChanges: 'Simplifies visual layers, increases dialogue volume, uses warm natural grading.',
    traits: ['Natural Light', 'Clear Dialogue', 'Minimal Overlays'],
    useThis: 'When building a direct line to your core audience.',
    pacing: 'conversational',
    captionStyle: 'restrained',
    musicEnergy: 'acoustic_warm',
    motionIntensity: 'low',
    tone: 'authentic'
  },
  { 
    id: 'investor_pitch', 
    category: 'biz',
    label: 'Investor Pitch Momentum', 
    description: 'Confident, data-driven, and forward-looking.',
    duration: '10s sample',
    styleId: 'pitch_v1',
    bestFor: 'Startup pitch decks, annual reports, vision statements.',
    avoidWhen: 'Informal vlogs or personal brand storytelling.',
    editorsNote: 'Use upward motion and corporate-clean typography to drive buy-in.',
    whyWorks: 'Momentum is built through rhythmic pacing and ascending musical cues.',
    whatChanges: 'Adds data overlays, uses forward-driving transitions, applies "optimistic" music.',
    traits: ['Infographic Overlays', 'Upward Motion', 'Clean Audio'],
    useThis: 'When securing funding or buy-in is the goal.',
    pacing: 'steady_build',
    captionStyle: 'corporate_clean',
    musicEnergy: 'ascending_optimism',
    motionIntensity: 'forward_driving',
    tone: 'visionary'
  },
  { 
    id: 'high_trust', 
    category: 'biz',
    label: 'High-Trust Testimonial', 
    description: 'Centered on the customer experience.',
    duration: '10s sample',
    styleId: 'trust_v1',
    bestFor: 'Customer reviews, case study interviews.',
    avoidWhen: 'Aggressive marketing or rapid-fire socials.',
    editorsNote: 'Warm grading and clear dialogue prioritize social proof.',
    whyWorks: 'Validates claims through emotional resonance and proven results.',
    whatChanges: 'Focuses on facial expressions, adds proof-point overlays, uses supportive music.',
    traits: ['Portrait Focus', 'Warm Grading', 'Clear Dialogue'],
    useThis: 'When social proof is the primary driver.',
    pacing: 'measured',
    captionStyle: 'quote_focused',
    musicEnergy: 'subtle_support',
    motionIntensity: 'static_composed',
    tone: 'grateful'
  },
  { 
    id: 'saas_precision', 
    category: 'biz',
    label: 'SaaS Explainer Precision', 
    description: 'Technical clarity with high-end execution.',
    duration: '10s sample',
    styleId: 'saas_v1',
    bestFor: 'Product walkthroughs, software demos, technical frameworks.',
    avoidWhen: 'Broad brand awareness films.',
    editorsNote: 'Ensure UI screenshots are highlighted with micro-interactions.',
    whyWorks: 'Precision eliminates confusion and builds product confidence.',
    whatChanges: 'Adds cursor tracking, zoom-ins on key features, technical mono captions.',
    traits: ['UI Zooms', 'Tracking Callouts', 'Clean Pacing'],
    useThis: 'When your software needs to look as powerful as it feels.',
    pacing: 'precise',
    captionStyle: 'technical_mono',
    musicEnergy: 'synthesized_modern',
    motionIntensity: 'balanced',
    tone: 'objective'
  },
  { 
    id: 'thought_leadership', 
    category: 'biz',
    label: 'Thought Leadership Clip', 
    description: 'Elevates verbal insight into visual authority.',
    duration: '10s sample',
    styleId: 'tl_v1',
    bestFor: 'Keynote highlights, expert takes, philosophy bits.',
    avoidWhen: 'Step-by-step tutorials.',
    editorsNote: 'Captions should emphasize the "weight" of the words.',
    whyWorks: 'Visual emphasis on keywords anchors the insight in the viewer\'s mind.',
    whatChanges: 'Adds serif typography, uses slow-motion emphases, applies an "editorial" color grade.',
    traits: ['Serif Captions', 'Cinematic Depth', 'Slow-Mo Beats'],
    useThis: 'When your ideas need to feel profound.',
    pacing: 'intentional',
    captionStyle: 'elegant_serif',
    musicEnergy: 'low_prestige',
    motionIntensity: 'subtle',
    tone: 'philosophical'
  },

  // --- Retention / Viral ---
  { 
    id: 'retention_shorts', 
    category: 'viral',
    label: 'Fast Retention Shorts', 
    description: 'Dynamic captions, aggressive pacing, hook-focused.',
    duration: '10s sample',
    styleId: 'short_v2',
    bestFor: 'TikTok/Instagram Reels, viral educational clips.',
    avoidWhen: 'Deep, calm, or complex topics that need breathing room.',
    editorsNote: 'Use only when the first 3 seconds must carry the entire video.',
    whyWorks: 'Aggressive pattern interrupts prevent the viewer from looking away.',
    whatChanges: 'Increases cut frequency, adds pop-out captions, injects sound FX layers.',
    traits: ['Aggressive Cuts', 'Pop-out Captions', 'Sound FX Overlays'],
    useThis: 'When maximum average view duration is the goal.',
    pacing: 'aggressive',
    captionStyle: 'dynamic_pop',
    musicEnergy: 'high_hype',
    motionIntensity: 'high',
    tone: 'energetic'
  },
  { 
    id: 'pattern_interrupt', 
    category: 'viral',
    label: 'Pattern Interrupt Reel', 
    description: 'Engineered to break the "doom scroll."',
    duration: '10s sample',
    styleId: 'pi_v1',
    bestFor: 'Short form ads, scroll-stopping hooks.',
    avoidWhen: 'Long form YouTube content.',
    editorsNote: 'Every visual shift should happen slightly faster than expected.',
    whyWorks: 'Constant visual novelty resets the viewer\'s attention clock.',
    whatChanges: 'Adds glitch transitions, color flashes, and high-contrast overlays.',
    traits: ['Glitch Transitions', 'High Contrast', 'Rapid Flashes'],
    useThis: 'When your first goal is to stop the thumb.',
    pacing: 'chaotic_controlled',
    captionStyle: 'impact_high',
    musicEnergy: 'explosive',
    motionIntensity: 'maximum',
    tone: 'disruptive'
  },
  { 
    id: 'contrarian_hook', 
    category: 'viral',
    label: 'Contrarian Hook Edit', 
    description: 'High stakes, high tension, shock-focused.',
    duration: '10s sample',
    styleId: 'ch_v1',
    bestFor: 'Controversial takes, major announcements, "unpopular opinions."',
    avoidWhen: 'Safe corporate updates.',
    editorsNote: 'Start with a silence or a loud percussive beat.',
    whyWorks: 'Tension creates immediate curiosity that demands resolution.',
    whatChanges: 'Slows down the very start, then explodes into rapid cuts.',
    traits: ['Tension Builds', 'Percussive Accents', 'Extreme Close-ups'],
    useThis: 'When you are challenging the status quo.',
    pacing: 'dynamic_tension',
    captionStyle: 'bold_oversize',
    musicEnergy: 'high_tension',
    motionIntensity: 'high',
    tone: 'challenging'
  },
  { 
    id: 'podcast_punch', 
    category: 'viral',
    label: 'Podcast Highlight Punch', 
    description: 'Word-for-word accuracy with visual flair.',
    duration: '10s sample',
    styleId: 'pod_v1',
    bestFor: 'Podcast clips, long-form interview highlights.',
    avoidWhen: 'Voice-over only videos or silent commercials.',
    editorsNote: 'Punch-in zooms should emphasize the guest\'s verbal insights.',
    whyWorks: 'Syncing visual zooms to verbal emphasis mimics natural human attention.',
    whatChanges: 'Adds waveform overlays, guest name-tags, and rhythmic punch-in zooms.',
    traits: ['Waveform Overlays', 'Guest Labels', 'Punch-in Zooms'],
    useThis: 'When the verbal insight needs to be emphasized.',
    pacing: 'conversational',
    captionStyle: 'highlight_active',
    musicEnergy: 'background_steady',
    motionIntensity: 'conversational_zooms',
    tone: 'engaging'
  },
  { 
    id: 'viral_quote', 
    category: 'viral',
    label: 'Viral Quote Breakdown', 
    description: 'Turns a single line into a visual event.',
    duration: '10s sample',
    styleId: 'quote_v1',
    bestFor: 'Quotes, punchlines, "mic drop" moments.',
    avoidWhen: 'Complex technical explainers.',
    editorsNote: 'Freeze the frame on the core quote line.',
    whyWorks: 'Isolation of a single idea makes it memorable and sharable.',
    whatChanges: 'Uses background removal, huge typography, and slow-motion drift.',
    traits: ['Background Removal', 'Kinetic Typography', 'Beat-synced'],
    useThis: 'When you have a single line that needs to go viral.',
    pacing: 'rhythmic_accent',
    captionStyle: 'staccato',
    musicEnergy: 'driving_beat',
    motionIntensity: 'high',
    tone: 'impactful'
  },

  // --- Cinematic / Emotional ---
  { 
    id: 'story_edit', 
    category: 'cinematic',
    label: 'Cinematic Story Edit', 
    description: 'Emotional grading, sweeping transitions, narrative music.',
    duration: '10s sample',
    styleId: 'story_v1',
    bestFor: 'Origin stories, case studies, emotional brand films.',
    avoidWhen: 'Technical tutorials or simple "how-to" updates.',
    editorsNote: 'Prioritize orchestral cues and slow-burn transitions here.',
    whyWorks: 'Storytelling is the shortest distance between a brand and a human heart.',
    whatChanges: 'Adds anamorphic bars, applies a teal/orange grade, uses crescendos.',
    traits: ['Slow Mo', 'Depth of Field', 'Orchestral Cues'],
    useThis: 'When you need to move the audience emotionally.',
    pacing: 'intentional',
    captionStyle: 'cinematic_fade',
    musicEnergy: 'emotional_crescendo',
    motionIntensity: 'fluid',
    tone: 'inspirational'
  },
  { 
    id: 'doc_founder', 
    category: 'cinematic',
    label: 'Documentary Founder Story', 
    description: 'Raw, authentic, human-centric storytelling.',
    duration: '10s sample',
    styleId: 'doc_v1',
    bestFor: 'Founder diaries, "behind the scenes", personal vlogs.',
    avoidWhen: 'Corporate sales pitches or high-polish commercials.',
    editorsNote: 'Let the ambient sound breathe. Use natural light references.',
    whyWorks: 'Authenticity is the premium currency of modern social media.',
    whatChanges: 'Applies grainy film textures, uses handwritten captions, preserves real sound.',
    traits: ['Natural Light', 'Ambient Sound', 'Real Textures'],
    useThis: 'When authenticity and trust are the focus.',
    pacing: 'natural',
    captionStyle: 'handwritten_style',
    musicEnergy: 'acoustic_lofi',
    motionIntensity: 'minimal',
    tone: 'authentic'
  },
  { 
    id: 'hero_arc', 
    category: 'cinematic',
    label: 'Hero Transformation Arc', 
    description: 'The journey from problem to solution.',
    duration: '10s sample',
    styleId: 'hero_v1',
    bestFor: 'Fitness transformations, home renovations, coaching results.',
    avoidWhen: 'Simple product unboxings or technical tutorials.',
    editorsNote: 'Use split screens for clear "before/after" impact.',
    whyWorks: 'Visualizing progress builds massive authority and desire.',
    whatChanges: 'Applies dark grading to "before" and bright to "after," adds triumphant music.',
    traits: ['Split Screens', 'Before/After Grade', 'Inspiring Finish'],
    useThis: 'When showing a significant change or result.',
    pacing: 'transformational',
    captionStyle: 'impact_bold',
    musicEnergy: 'heroic_build',
    motionIntensity: 'dynamic',
    tone: 'triumphant'
  },
  { 
    id: 'emotional_brand', 
    category: 'cinematic',
    label: 'Emotional Brand Film', 
    description: 'High-concept, high-impact brand identity.',
    duration: '10s sample',
    styleId: 'brand_v1',
    bestFor: 'Brand manifestos, vision pieces, high-end recruitment.',
    avoidWhen: 'Direct response sales videos.',
    editorsNote: 'Focus on abstract visual metaphors and sweeping soundscapes.',
    whyWorks: 'Associations with beauty and scale elevate the brand above the product.',
    whatChanges: 'Removes traditional captions, uses light leaks, applies "ethereal" music.',
    traits: ['Light Leaks', 'Abstract Visuals', 'Ethereal Grade'],
    useThis: 'When you are selling a vision, not just a tool.',
    pacing: 'graceful',
    captionStyle: 'minimal_fade',
    musicEnergy: 'ethereal_cinematic',
    motionIntensity: 'fluid',
    tone: 'inspiring'
  },
  { 
    id: 'action_energy', 
    category: 'cinematic',
    label: 'Blockbuster Action Energy', 
    description: 'High stakes, high tension, epic soundscapes.',
    duration: '10s sample',
    styleId: 'action_v1',
    bestFor: 'Action sequences, competition highlights, survival stories.',
    avoidWhen: 'Minimalist brand films or slow-paced vlogs.',
    editorsNote: 'Glitch effects and dark grading add to the high-stakes feel.',
    whyWorks: 'High intensity triggers adrenaline and ensures full viewer attention.',
    whatChanges: 'Adds speed ramps, glitch transitions, and heavy low-end sound design.',
    traits: ['Glitch Effects', 'Dark Grade', 'Heavy Percussion'],
    useThis: 'When tension and scale need to be maximized.',
    pacing: 'high_tension',
    captionStyle: 'impact',
    musicEnergy: 'epic_cinematic',
    motionIntensity: 'high',
    tone: 'intense'
  },

  // --- Product / Launch ---
  { 
    id: 'promo_energy', 
    category: 'product',
    label: 'Launch Promo Energy', 
    description: 'Bold motion, high intensity, rapid visual shifts.',
    duration: '10s sample',
    styleId: 'promo_v3',
    bestFor: 'Product launches, event openers, hype reels.',
    avoidWhen: 'Long-form podcasts or quiet educational content.',
    editorsNote: 'Flash transitions and giant typography work best here.',
    whyWorks: 'Hype is a visual language; rapid shifts signal "new" and "important."',
    whatChanges: 'Applies flash-cuts, adds motion-tracked typography, uses percussive music.',
    traits: ['Flash Transitions', 'Giant Typography', 'Percussive Music'],
    useThis: 'When creating excitement and momentum.',
    pacing: 'rapid',
    captionStyle: 'bold_oversize',
    musicEnergy: 'explosive',
    motionIntensity: 'maximum',
    tone: 'bold'
  },
  { 
    id: 'product_precision', 
    category: 'product',
    label: 'Product Demo Precision', 
    description: 'Focused, sharp, highlighting every detail.',
    duration: '10s sample',
    styleId: 'prod_v1',
    bestFor: 'Tech reviews, unboxings, manufacturing processes.',
    avoidWhen: 'Lifestyle-first vlogs or story-driven films.',
    editorsNote: 'Sync-to-beat cuts sharpen the perception of detail.',
    whyWorks: 'Attention to detail in the edit reflects the quality of the product.',
    whatChanges: 'Applies macro-focus zooms, uses technical overlays, applies synthesized music.',
    traits: ['Macro Focus', 'Color Accuracy', 'Sync-to-beat Cuts'],
    useThis: 'When the product features need to shine.',
    pacing: 'precise',
    captionStyle: 'technical_mono',
    musicEnergy: 'synthesized_modern',
    motionIntensity: 'balanced',
    tone: 'objective'
  },
  { 
    id: 'feature_reveal', 
    category: 'product',
    label: 'Feature Reveal Sequence', 
    description: 'Spotlights a new addition with cinematic flair.',
    duration: '10s sample',
    styleId: 'fr_v1',
    bestFor: 'Feature launches, SaaS updates, minor product reveals.',
    avoidWhen: 'General brand awareness pieces.',
    editorsNote: 'Use a "spotlight" color grade to direct the eye.',
    whyWorks: 'Isolating a single feature prevents cognitive load and increases desire.',
    whatChanges: 'Adds spotlight masks, uses "minimalist" music, applies precise captions.',
    traits: ['Eye-tracking Masks', 'Micro-interactions', 'Clean Focus'],
    useThis: 'When one specific feature needs the world\'s attention.',
    pacing: 'build-up',
    captionStyle: 'minimal_sharp',
    musicEnergy: 'modern_prestige',
    motionIntensity: 'subtle_zoom',
    tone: 'confident'
  },
  { 
    id: 'social_montage', 
    category: 'product',
    label: 'Social Proof Montage', 
    description: 'A rapid-fire blast of success and results.',
    duration: '10s sample',
    styleId: 'social_v1',
    bestFor: 'Event recaps, year-in-review, client success mashups.',
    avoidWhen: 'Deep personal stories or technical explainers.',
    editorsNote: 'Rhythmic edits and social icons convey quantity of success.',
    whyWorks: 'Volume of evidence is a powerful psychological trigger for trust.',
    whatChanges: 'Increases cut density, adds social icon badges, uses driving beats.',
    traits: ['Fast Overlays', 'Social Icons', 'Rhythmic Edits'],
    useThis: 'When "quantity of success" is the message.',
    pacing: 'rapid_fire',
    captionStyle: 'staccato',
    musicEnergy: 'driving_beat',
    motionIntensity: 'high_speed',
    tone: 'successful'
  },
  { 
    id: 'luxury_film', 
    category: 'product',
    label: 'Luxury Brand Film', 
    description: 'Expensive, refined, and slow-burn prestige.',
    duration: '10s sample',
    styleId: 'luxury_v1',
    bestFor: 'High-end products, fashion, real estate, premium services.',
    avoidWhen: 'Fast-paced socials or "budget" service explainers.',
    editorsNote: 'Use graceful transitions and golden hour color palettes.',
    whyWorks: 'Prestige is communicated through visual patience and "expensive" color grading.',
    whatChanges: 'Slows down every cut, adds soft blur edges, uses classical-modern hybrid music.',
    traits: ['Golden Hour', 'Smooth Gimbal', 'Graceful Transitions'],
    useThis: 'When positioning for a high-net-worth audience.',
    pacing: 'leisurely',
    captionStyle: 'elegant_serif',
    musicEnergy: 'refined_classical',
    motionIntensity: 'graceful',
    tone: 'sophisticated'
  },

  // --- Educational / Clarity ---
  { 
    id: 'edu_breakdown', 
    category: 'edu',
    label: 'Clean Educational Breakdown', 
    description: 'Information-first, steady pacing, clear callouts.',
    duration: '10s sample',
    styleId: 'edu_v1',
    bestFor: 'Technical tutorials, how-to guides, product walk-throughs.',
    avoidWhen: 'Abstract brand pieces or emotional storytelling.',
    editorsNote: 'Captions should be standard and clear. Avoid flashy motion.',
    whyWorks: 'Removes visual friction to allow the information to land instantly.',
    whatChanges: 'Adds white balance correction, steady rhythm, and standard clear captions.',
    traits: ['On-screen Callouts', 'White Balance', 'Steady Rhythm'],
    useThis: 'When clarity of information is paramount.',
    pacing: 'informative',
    captionStyle: 'standard_clear',
    musicEnergy: 'neutral_focus',
    motionIntensity: 'low',
    tone: 'educational'
  },
  { 
    id: 'explainer_mograph', 
    category: 'edu',
    label: 'Explainer With Motion Graphics', 
    description: 'Visualizing the invisible with 2D/3D assets.',
    duration: '10s sample',
    styleId: 'exp_v1',
    bestFor: 'SaaS explainers, abstract concepts, financial products.',
    avoidWhen: 'Live-action only testimonials or "raw" content.',
    editorsNote: 'Sound FX accents are key to making abstract motion feel real.',
    whyWorks: 'Motion graphics translate complex data into intuitive visual metaphors.',
    whatChanges: 'Adds vector overlays, uses sound FX for icons, applies Intel-style Intellectual music.',
    traits: ['Vector Motion', 'Vibrant Colors', 'Sound FX Accents'],
    useThis: 'When abstract concepts need visual metaphors.',
    pacing: 'rhythmic',
    captionStyle: 'integrated_motion',
    musicEnergy: 'playful_intellectual',
    motionIntensity: 'animated',
    tone: 'clear'
  },
  { 
    id: 'tutorial_authority', 
    category: 'edu',
    label: 'Tutorial Authority Flow', 
    description: 'The perfect balance of "How" and "Why."',
    duration: '10s sample',
    styleId: 'ta_v1',
    bestFor: 'Courses, expert workshops, high-level tutorials.',
    avoidWhen: 'Short form viral hooks.',
    editorsNote: 'Use a picture-in-picture layout for simultaneous screen/face focus.',
    whyWorks: 'Authority is built when the viewer sees both the expert and the work.',
    whatChanges: 'Adds PiP layouts, uses technical mono captions, applies "low-fi" focus music.',
    traits: ['Picture-in-Picture', 'Technical Captions', 'Steady Pace'],
    useThis: 'When you are teaching a skill that requires deep trust.',
    pacing: 'expert_steady',
    captionStyle: 'technical_mono',
    musicEnergy: 'neutral_focus',
    motionIntensity: 'low',
    tone: 'authoritative'
  },
  { 
    id: 'framework_breakdown', 
    category: 'edu',
    label: 'Framework Breakdown', 
    description: 'Visualizes mental models and business logic.',
    duration: '10s sample',
    styleId: 'fb_v1',
    bestFor: 'Business frameworks, strategy sessions, mental models.',
    avoidWhen: 'Purely emotional stories.',
    editorsNote: 'Use distinct colors for each step of the framework.',
    whyWorks: 'Mental models are easier to grasp when they are visually separated.',
    whatChanges: 'Adds logic branch overlays, uses color-coded sections, applies steady pacing.',
    traits: ['Logic Overlays', 'Color Coding', 'Step Indicators'],
    useThis: 'When you need the viewer to understand a process.',
    pacing: 'step-by-step',
    captionStyle: 'standard_clear',
    musicEnergy: 'intellectual_modern',
    motionIntensity: 'low',
    tone: 'logical'
  },
  { 
    id: 'thought_leadership_clip', 
    category: 'edu',
    label: 'Thought Leadership Clip', 
    description: 'Short, sharp, and high-resolution ideas.',
    duration: '10s sample',
    styleId: 'tlc_v1',
    bestFor: 'LinkedIn/X clips, expert soundbites.',
    avoidWhen: 'Long form podcasts.',
    editorsNote: 'The caption should appear exactly as the speaker says it.',
    whyWorks: 'High-speed verbal-visual synchronization increases perceived authority.',
    whatChanges: 'Adds word-for-word dynamic captions, applies a high-contrast grade.',
    traits: ['Dynamic Words', 'High Contrast', 'Sharp Cuts'],
    useThis: 'When you have 30 seconds to prove your expertise.',
    pacing: 'rapid_insight',
    captionStyle: 'dynamic_pop',
    musicEnergy: 'low_prestige',
    motionIntensity: 'medium',
    tone: 'expert'
  },
]

const STEPS = [
  'vision',
  'goal',
  'focus',
  'energy',
  'reference',
  'review'
] as const

// --- Components ---

interface CommandOverlayShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { prompt: string; metadata: CreativeMetadata }) => void
  initialPrompt?: string
}

export function CommandOverlayShell({
  open,
  onOpenChange,
  onSubmit,
  initialPrompt = '',
}: CommandOverlayShellProps) {
  const reduceMotion = useStableReducedMotion()
  const [currentStep, setCurrentStep] = React.useState<(typeof STEPS)[number]>('vision')
  const [prompt, setPrompt] = React.useState(initialPrompt)
  const [selectedGoals, setSelectedGoals] = React.useState<string[]>([])
  const [selectedFocus, setSelectedFocus] = React.useState<string[]>([])
  const [selectedEnergy, setSelectedEnergy] = React.useState<string | undefined>()
  const [selectedReference, setSelectedReference] = React.useState<string | undefined>()
  const [rememberPreference, setRememberPreference] = React.useState(false)
  const [optionalNotes, setOptionalNotes] = React.useState('')
  const [showAllReferences, setShowAllReferences] = React.useState(false)
  
  // Phase 1A.4/5 Internal State
  const [proTip, setProTip] = React.useState("")
  const [selectedEditorialProbes, setSelectedEditorialProbes] = React.useState<string[]>([])

  // "More" expansion states
  const [showMoreGoals, setShowMoreGoals] = React.useState(false)
  const [showMoreFocus, setShowMoreFocus] = React.useState(false)
  const [showMoreEnergy, setShowMoreEnergy] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setPrompt(initialPrompt)
      setCurrentStep('vision')
      setShowAllReferences(false)
      setShowMoreGoals(false)
      setShowMoreFocus(false)
      setShowMoreEnergy(false)
      setSelectedEditorialProbes([])
      
      // Randomize Pro Tip client-side
      const randomIndex = Math.floor(Math.random() * EDITOR_PRO_TIPS.length)
      setProTip(EDITOR_PRO_TIPS[randomIndex]!)
    }
  }, [open, initialPrompt])

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]!)
    }
  }

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]!)
    }
  }

  const handleFinalSubmit = () => {
    const ref = REFERENCES.find(r => r.id === selectedReference)
    
    onSubmit({
      prompt,
      metadata: {
        goals: selectedGoals,
        focusAreas: selectedFocus,
        energy: selectedEnergy,
        styleId: ref?.styleId,
        rememberPreference,
        optionalNotes: optionalNotes.trim() || undefined,
        pacing: ref?.pacing,
        captionStyle: ref?.captionStyle,
        musicEnergy: ref?.musicEnergy,
        motionIntensity: ref?.motionIntensity,
        tone: ref?.tone,
        editorialQuestions: selectedEditorialProbes,
        proTipShown: proTip
      },
    })
    onOpenChange(false)
  }

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  const toggleFocus = (id: string) => {
    setSelectedFocus(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const appendVision = (visionText: string) => {
    setPrompt(prev => {
      const clean = prev.trim()
      return clean ? `${clean} ${visionText}` : visionText
    })
  }

  const normalizeEditorialQuestion = (question: string) => {
    return question.replace(/^Question:\s*/, '').trim()
  }

  const toggleEditorialProbe = (probe: string) => {
    const normalizedProbe = normalizeEditorialQuestion(probe)
    
    setSelectedEditorialProbes(prev => {
      const isSelected = prev.includes(normalizedProbe)
      const next = isSelected 
        ? prev.filter(p => p !== normalizedProbe) 
        : [...prev, normalizedProbe]
      
      // Update optionalNotes
      setOptionalNotes(current => {
        const lines = current.split('\n').filter(line => line.trim() !== '')
        const questionLine = `- Question: ${normalizedProbe}`
        
        if (isSelected) {
          // Remove it
          return lines.filter(l => l.trim() !== questionLine).join('\n')
        } else {
          // Add it uniquely
          if (!lines.some(l => l.trim() === questionLine)) {
            return [...lines, questionLine].join('\n')
          }
          return current
        }
      })
      
      return next
    })
  }

  const getContextualEditorialQuestions = () => {
    const allPossible = [
      ...selectedGoals.flatMap(g => FOLLOW_UP_QUESTIONS[g] || []),
      ...selectedFocus.flatMap(f => FOLLOW_UP_QUESTIONS[f] || []),
      ...(selectedEnergy ? FOLLOW_UP_QUESTIONS[selectedEnergy] || [] : [])
    ]
    return Array.from(new Set(allPossible)).slice(0, 6)
  }

  if (!open) return null

  const visibleGoals = showMoreGoals ? GOALS : GOALS.slice(0, 8)
  const visibleFocus = showMoreFocus ? FOCUS_AREAS : FOCUS_AREAS.slice(0, 8)
  const visibleEnergies = showMoreEnergy ? ENERGIES : ENERGIES.slice(0, 8)
  const selectedRefData = REFERENCES.find(r => r.id === selectedReference)
  const contextualQuestions = getContextualEditorialQuestions()

  const getButtonLabel = () => {
    switch (currentStep) {
      case 'vision': return 'Start Creative Brief'
      case 'goal': return 'Lock Goals'
      case 'focus': return 'Set Focus Areas'
      case 'energy': return 'Choose Energy'
      case 'reference': return 'Lock Style Preset'
      case 'review': return 'Apply Creative Direction'
      default: return 'Continue'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none p-4 pb-24 sm:pb-32">
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onOpenChange(false)}
      />

      <motion.div
        className="relative w-full max-w-5xl bg-[#111116]/85 backdrop-blur-3xl border border-white/20 rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] pointer-events-auto overflow-hidden ring-1 ring-white/10"
        initial={{ y: 120, opacity: 0, scale: 0.94 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={chamberSpring}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,242,212,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="relative p-8 sm:p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7ff2d4]/15 text-[#7ff2d4] shadow-[0_0_20px_rgba(127,242,212,0.2)]">
                <Sparkles className="size-5" />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mb-0.5">
                  Prometheus Intelligence
                </span>
                <span className="block text-xs font-medium text-white/20 italic">
                  Creative Director is refining your brief...
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
               {/* Step Indicator Desktop */}
               <div className="hidden md:flex gap-2 mr-4">
                {STEPS.map((step) => (
                  <div 
                    key={step} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      currentStep === step ? "w-10 bg-[#7ff2d4] shadow-[0_0_10px_rgba(127,242,212,0.4)]" : "w-2 bg-white/10"
                    )} 
                  />
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="rounded-full h-10 w-10 text-white/30 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>

          <div className="min-h-[520px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {currentStep === 'vision' && (
                <motion.div
                  key="step-vision"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10 flex-1 max-w-4xl mx-auto w-full flex flex-col justify-center"
                >
                  <div className="space-y-4 text-center">
                    <h2 className="text-4xl font-semibold text-white tracking-tight sm:text-5xl">What&apos;s the big vision for this edit?</h2>
                    <p className="text-white/50 text-lg max-w-xl mx-auto font-medium">Capture the soul of the project in a single creative statement.</p>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#7ff2d4]/20 to-transparent rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Make this feel like a high-end tech commercial with fast cuts and punchy captions..."
                        className="relative min-h-[200px] border-white/10 bg-white/[0.04] text-2xl italic tracking-tight text-white placeholder:text-white/10 focus:border-[#7ff2d4]/40 rounded-[32px] p-10 resize-none shadow-2xl transition-all"
                        style={{ fontFamily: 'var(--font-newsreader), serif' }}
                        autoFocus
                      />
                      <div className="absolute bottom-8 right-10 text-[#7ff2d4]/30">
                        <Sparkles className="size-10" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold text-center">Vision Signals</div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {VISION_HELPERS.map(helper => (
                          <button
                            key={helper}
                            onClick={() => appendVision(helper)}
                            className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-sm text-white/50 hover:text-[#7ff2d4] hover:bg-[#7ff2d4]/10 hover:border-[#7ff2d4]/30 transition-all font-semibold"
                          >
                            + {helper}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'goal' && (
                <motion.div
                  key="step-goal"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-8 flex-1 w-full flex flex-col justify-center"
                >
                  <div className="space-y-3 text-center">
                    <h2 className="text-3xl font-semibold text-white tracking-tight">What is the primary goal?</h2>
                    <p className="text-white/40 text-base font-medium">Select one or more outcomes you want to prioritize.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {visibleGoals.map((g) => {
                      const Icon = g.icon
                      const isSelected = selectedGoals.includes(g.id)
                      return (
                        <button
                          key={g.id}
                          onClick={() => toggleGoal(g.id)}
                          className={cn(
                            "text-left p-6 rounded-[28px] border-2 transition-all relative group overflow-hidden h-[120px] flex flex-col justify-center",
                            isSelected
                              ? "border-[#7ff2d4] bg-[#7ff2d4]/10 text-white scale-[1.02] shadow-[0_20px_40px_-10px_rgba(127,242,212,0.2)]"
                              : "border-white/5 bg-white/[0.02] text-white/50 hover:border-white/20 hover:scale-[1.01]"
                          )}
                        >
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                              isSelected ? "bg-[#7ff2d4]/20 text-[#7ff2d4]" : "bg-white/5 text-white/20 group-hover:text-white/40"
                            )}>
                              <Icon className="size-5" />
                            </div>
                            <div>
                              <div className="font-bold text-[16px] tracking-tight">{g.label}</div>
                              <div className="text-[11px] text-white/30 mt-0.5 font-medium line-clamp-1">{g.description}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <motion.div 
                              layoutId="goal-check"
                              className="absolute top-4 right-4 text-[#7ff2d4]"
                            >
                              <CheckCircle2 className="size-5" />
                            </motion.div>
                          )}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setShowMoreGoals(!showMoreGoals)}
                      className="flex flex-col items-center justify-center p-6 rounded-[28px] border-2 border-dashed border-white/10 bg-white/[0.01] text-white/30 hover:border-white/20 hover:text-white/50 transition-all h-[120px]"
                    >
                      {showMoreGoals ? <Minus className="size-6 mb-2" /> : <Plus className="size-6 mb-2" />}
                      <span className="text-xs font-bold uppercase tracking-widest">{showMoreGoals ? 'See less' : 'See more goals'}</span>
                    </button>
                  </div>

                  {selectedGoals.length > 0 && contextualQuestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-6 border-t border-white/5 w-full max-w-4xl mx-auto"
                    >
                      <div className="text-[10px] uppercase tracking-[0.3em] text-[#7ff2d4] font-bold mb-4 flex items-center gap-2">
                        <HelpCircle className="size-3" />
                        Editor Follow-Up
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contextualQuestions.map(q => {
                          const isSelected = selectedEditorialProbes.includes(normalizeEditorialQuestion(q))
                          return (
                            <button
                              key={q}
                              onClick={() => toggleEditorialProbe(q)}
                              className={cn(
                                "px-4 py-2 rounded-xl border transition-all text-xs font-bold",
                                isSelected
                                  ? "bg-[#7ff2d4]/20 border-[#7ff2d4]/40 text-[#7ff2d4]"
                                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                              )}
                            >
                              {isSelected && <Check className="inline size-3 mr-1.5" />}
                              {q}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {currentStep === 'focus' && (
                <motion.div
                  key="step-focus"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-8 flex-1 w-full flex flex-col justify-center"
                >
                  <div className="space-y-3 text-center">
                    <h2 className="text-3xl font-semibold text-white tracking-tight">Where should I focus most?</h2>
                    <p className="text-white/40 text-base font-medium">Pick the technical areas that need the most attention.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                    {visibleFocus.map((f) => {
                      const isSelected = selectedFocus.includes(f.id)
                      return (
                        <button
                          key={f.id}
                          onClick={() => toggleFocus(f.id)}
                          className={cn(
                            "flex flex-col items-center gap-4 p-6 rounded-[28px] border-2 transition-all group relative",
                            isSelected
                              ? "border-amber-400 bg-amber-400/10 text-white scale-[1.05] shadow-[0_20px_40px_-10px_rgba(251,191,36,0.2)]"
                              : "border-white/5 bg-white/[0.02] text-white/40 hover:border-white/20 hover:scale-[1.02]"
                          )}
                        >
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
                            isSelected ? "bg-amber-400 text-black shadow-lg" : "bg-white/5 text-white/20 group-hover:text-white/40"
                          )}>
                            <f.icon className="size-6" />
                          </div>
                          <span className="text-[11px] font-bold tracking-widest uppercase text-center leading-tight">{f.label}</span>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-amber-400 text-black rounded-full p-1 shadow-lg">
                              <Check className="size-3 stroke-[3px]" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setShowMoreFocus(!showMoreFocus)}
                      className="flex flex-col items-center justify-center p-6 rounded-[28px] border-2 border-dashed border-white/10 bg-white/[0.01] text-white/30 hover:border-white/20 hover:text-white/50 transition-all"
                    >
                      {showMoreFocus ? <Minus className="size-5 mb-3" /> : <Plus className="size-5 mb-3" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">More</span>
                    </button>
                  </div>

                  {selectedFocus.length > 0 && contextualQuestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-6 border-t border-white/5 w-full max-w-4xl mx-auto"
                    >
                      <div className="text-[10px] uppercase tracking-[0.3em] text-[#7ff2d4] font-bold mb-4 flex items-center gap-2">
                        <HelpCircle className="size-3" />
                        Editor Follow-Up
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contextualQuestions.map(q => {
                          const isSelected = selectedEditorialProbes.includes(normalizeEditorialQuestion(q))
                          return (
                            <button
                              key={q}
                              onClick={() => toggleEditorialProbe(q)}
                              className={cn(
                                "px-4 py-2 rounded-xl border transition-all text-xs font-bold",
                                isSelected
                                  ? "bg-[#7ff2d4]/20 border-[#7ff2d4]/40 text-[#7ff2d4]"
                                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                              )}
                            >
                              {isSelected && <Check className="inline size-3 mr-1.5" />}
                              {q}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {currentStep === 'energy' && (
                <motion.div
                  key="step-energy"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-8 flex-1 w-full flex flex-col justify-center"
                >
                  <div className="space-y-3 text-center">
                    <h2 className="text-3xl font-semibold text-white tracking-tight">What energy should it carry?</h2>
                    <p className="text-white/40 text-base font-medium">The overall &quot;vibe&quot; and atmospheric tone of the edit.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {visibleEnergies.map((e) => {
                      const isSelected = selectedEnergy === e.id
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEnergy(e.id)}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all text-center h-16 flex items-center justify-center text-sm font-bold tracking-tight",
                            isSelected
                              ? "border-white bg-white text-black scale-[1.05] shadow-2xl"
                              : "border-white/5 bg-white/[0.02] text-white/50 hover:border-white/15"
                          )}
                        >
                          {e.label}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setShowMoreEnergy(!showMoreEnergy)}
                      className="p-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.01] text-white/30 hover:border-white/20 hover:text-white/50 transition-all flex items-center justify-center h-16"
                    >
                      {showMoreEnergy ? <Minus className="size-4 mr-2" /> : <Plus className="size-4 mr-2" />}
                      <span className="text-xs font-bold uppercase tracking-widest">More</span>
                    </button>
                  </div>

                  {selectedEnergy && contextualQuestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-6 border-t border-white/5 w-full max-w-4xl mx-auto"
                    >
                      <div className="text-[10px] uppercase tracking-[0.3em] text-[#7ff2d4] font-bold mb-4 flex items-center gap-2">
                        <HelpCircle className="size-3" />
                        Editor Follow-Up
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contextualQuestions.map(q => {
                          const isSelected = selectedEditorialProbes.includes(normalizeEditorialQuestion(q))
                          return (
                            <button
                              key={q}
                              onClick={() => toggleEditorialProbe(q)}
                              className={cn(
                                "px-4 py-2 rounded-xl border transition-all text-xs font-bold",
                                isSelected
                                  ? "bg-[#7ff2d4]/20 border-[#7ff2d4]/40 text-[#7ff2d4]"
                                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                              )}
                            >
                              {isSelected && <Check className="inline size-3 mr-1.5" />}
                              {q}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {currentStep === 'reference' && (
                <motion.div
                  key="step-reference"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col lg:flex-row gap-12 flex-1 w-full"
                >
                  {/* Reference List */}
                  <div className="flex-1 space-y-8 flex flex-col justify-center">
                    <div className="flex items-end justify-between">
                      <div className="space-y-3">
                        <h2 className="text-3xl font-semibold text-white tracking-tight">Lock Style Preset</h2>
                        <p className="text-white/40 text-base font-medium">Select a world-class preset to anchor your edit DNA.</p>
                      </div>
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => setShowAllReferences(!showAllReferences)}
                        className="text-[#7ff2d4] hover:text-[#7ff2d4]/80 text-sm font-bold tracking-tight"
                      >
                        {showAllReferences ? 'Show featured' : 'See all 24 presets'}
                      </Button>
                    </div>
                    
                    <div className={cn(
                      "flex gap-6 scrollbar-hide -mx-2 px-2 transition-all duration-500",
                      showAllReferences ? "flex-wrap max-h-[460px] overflow-y-auto" : "overflow-x-auto pb-6"
                    )}>
                      {(showAllReferences ? REFERENCES : REFERENCES.slice(0, 10)).map((r) => {
                        const isSelected = selectedReference === r.id
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelectedReference(r.id)}
                            className={cn(
                              "relative shrink-0 p-6 rounded-[32px] border-2 transition-all text-left group overflow-hidden",
                              showAllReferences ? "w-[calc(50%-12px)] xl:w-[calc(33.33%-16px)]" : "w-[280px]",
                              isSelected
                                ? "border-[#7ff2d4] bg-[#7ff2d4]/10 shadow-[0_25px_50px_-12px_rgba(127,242,212,0.3)] scale-[1.02]"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:scale-[1.01]"
                            )}
                          >
                            <div className="aspect-video mb-5 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center relative">
                              <Target className={cn("size-8 transition-all", isSelected ? "text-[#7ff2d4] scale-110" : "text-white/10 group-hover:text-white/20")} />
                              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                                 <div className="bg-[#7ff2d4]/20 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] text-[#7ff2d4] font-black uppercase border border-[#7ff2d4]/20">{r.category}</div>
                                 <div className="bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-bold border border-white/10">{r.duration}</div>
                              </div>
                            </div>
                            <div className="font-bold text-lg text-white mb-2 tracking-tight">{r.label}</div>
                            <div className="text-xs leading-relaxed text-white/30 font-medium line-clamp-2">{r.description}</div>
                            {isSelected && (
                              <div className="absolute top-6 right-6 bg-[#7ff2d4] text-black rounded-full p-1.5 shadow-xl">
                                <Check className="size-4 stroke-[3px]" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Reference Detail Panel */}
                  <AnimatePresence>
                    {selectedRefData && (
                      <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                        className="w-full lg:w-[420px] bg-white/[0.02] border border-white/10 rounded-[40px] p-8 lg:p-10 backdrop-blur-xl relative overflow-hidden group/detail"
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(127,242,212,0.1)_0%,transparent_50%)]" />
                        
                        <div className="relative space-y-8 h-full overflow-y-auto pr-2 scrollbar-hide">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.3em] text-[#7ff2d4] font-bold mb-3 flex items-center gap-2">
                                <Badge className="size-3.5" />
                                Preset Intelligence
                              </div>
                              <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">{selectedRefData.label}</h3>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setSelectedReference(undefined)}
                              className="rounded-full text-white/20 hover:text-white hover:bg-white/10"
                            >
                              <X className="size-5" />
                            </Button>
                          </div>

                          <div className="aspect-video rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-inner">
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                             <Star className="size-12 text-[#7ff2d4]/40 group-hover:scale-125 group-hover:text-[#7ff2d4] transition-all duration-700" />
                             <div className="absolute bottom-4 left-6 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#7ff2d4] animate-pulse" />
                                <span className="text-[11px] text-white/80 font-bold uppercase tracking-widest">10s Sample Library Ready</span>
                             </div>
                          </div>

                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <div className="text-[10px] uppercase tracking-[0.2em] text-[#7ff2d4] font-bold mb-2">Why this works</div>
                                <div className="text-[11px] text-white/60 leading-relaxed font-medium">{selectedRefData.whyWorks}</div>
                              </div>
                              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <div className="text-[10px] uppercase tracking-[0.2em] text-[#7ff2d4] font-bold mb-2">Changes apply</div>
                                <div className="text-[11px] text-white/60 leading-relaxed font-medium">{selectedRefData.whatChanges}</div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400/60 font-bold mb-1 flex items-center gap-2">
                                  <AlertTriangle className="size-3" />
                                  Avoid When
                                </div>
                                <div className="text-xs text-white/60 leading-relaxed">{selectedRefData.avoidWhen}</div>
                              </div>
                              
                              <div className="p-6 rounded-3xl bg-[#7ff2d4]/10 border border-[#7ff2d4]/20 shadow-[inset_0_0_20px_rgba(127,242,212,0.05)]">
                                <div className="text-[10px] uppercase tracking-[0.2em] text-[#7ff2d4] font-bold mb-2 flex items-center gap-2">
                                  <MessageSquare className="size-3.5" />
                                  Editor&apos;s Strategy
                                </div>
                                <div className="text-sm text-[#7ff2d4] italic font-medium leading-relaxed">&quot;{selectedRefData.editorsNote}&quot;</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 pt-2 pb-4">
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedReference(undefined)}
                              className="flex-1 h-14 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 font-bold"
                            >
                              Compare another
                            </Button>
                            <Button
                              onClick={handleNext}
                              className="flex-[2] h-14 rounded-2xl bg-[#7ff2d4] text-black hover:bg-[#7ff2d4]/90 font-bold text-base shadow-[0_20px_40px_-10px_rgba(127,242,212,0.4)] group"
                            >
                              Use this preset
                              <ChevronRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {currentStep === 'review' && (
                <motion.div
                  key="step-review"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10 flex-1 max-w-5xl mx-auto w-full flex flex-col justify-center"
                >
                  <div className="space-y-4 text-center">
                    <h2 className="text-3xl font-semibold text-white tracking-tight sm:text-4xl">Final creative refinements</h2>
                    <p className="text-white/40 text-lg font-medium">Add any last instructions to perfect the edit DNA.</p>
                  </div>
                  
                  <div className="grid lg:grid-cols-4 gap-12 items-start">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="space-y-3">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold flex items-center gap-2">
                          <PenTool className="size-3.5" />
                          Strategic Notes
                        </div>
                        <Textarea
                          value={optionalNotes}
                          onChange={(e) => setOptionalNotes(e.target.value)}
                          placeholder="e.g. Keep the captions on the left side, use more blue tones..."
                          className="min-h-[220px] bg-white/[0.03] border-white/10 rounded-[32px] px-8 py-8 text-lg text-white placeholder:text-white/10 focus:border-[#7ff2d4]/30 outline-none resize-none shadow-2xl transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-5 p-6 rounded-[32px] bg-white/[0.03] border border-white/10 group hover:border-[#7ff2d4]/30 transition-all cursor-pointer" onClick={() => setRememberPreference(!rememberPreference)}>
                        <button
                          type="button"
                          className={cn(
                            "flex size-7 items-center justify-center rounded-xl border-2 transition-all",
                            rememberPreference ? "border-[#7ff2d4] bg-[#7ff2d4] text-black shadow-lg" : "border-white/10 bg-white/5 group-hover:border-white/20"
                          )}
                        >
                          {rememberPreference && <Check className="size-4 stroke-[3px]" />}
                        </button>
                        <div className="flex-1">
                          <div className="text-lg text-white font-semibold tracking-tight">Remember preferences</div>
                          <div className="text-sm text-white/30 font-medium">Save these creative settings for future edits</div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                      <div className="space-y-4">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold flex items-center gap-2">
                          <HelpCircle className="size-3.5" />
                          Editorial Probes
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {EDITORIAL_PROBES.map(probe => {
                            const normalizedProbe = normalizeEditorialQuestion(probe)
                            const isSelected = selectedEditorialProbes.includes(normalizedProbe)
                            return (
                              <button
                                key={probe}
                                onClick={() => toggleEditorialProbe(probe)}
                                className={cn(
                                  "px-4 py-2.5 rounded-xl border transition-all text-xs font-bold tracking-tight text-left",
                                  isSelected
                                    ? "bg-[#7ff2d4]/20 border-[#7ff2d4]/40 text-[#7ff2d4]"
                                    : "bg-white/5 border-white/10 text-white/60 hover:text-[#7ff2d4] hover:bg-[#7ff2d4]/10 hover:border-[#7ff2d4]/30"
                                )}
                              >
                                {isSelected && <Check className="inline size-3 mr-1.5" />}
                                {probe}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="p-8 rounded-[32px] bg-[#7ff2d4]/5 border border-[#7ff2d4]/15 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <Info className="size-16" />
                        </div>
                        <p className="text-[10px] text-[#7ff2d4] leading-relaxed font-black uppercase tracking-[0.3em] mb-3">Editor Pro Tip</p>
                        <p className="text-sm text-white/80 leading-relaxed font-medium relative z-10 italic">
                          &quot;{proTip}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-10">
            <div className="flex items-center gap-6">
              <div className="flex md:hidden gap-2">
                {STEPS.map((step) => (
                  <div 
                    key={step} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentStep === step ? "w-8 bg-[#7ff2d4]" : "w-1.5 bg-white/10"
                    )} 
                  />
                ))}
              </div>
              <div className="hidden md:block">
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black">
                  Brief Pass {STEPS.indexOf(currentStep) + 1} {' // '} {STEPS.length}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              {currentStep !== 'vision' && (
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="rounded-full h-14 px-8 text-white/40 hover:text-white hover:bg-white/5 font-bold text-base transition-all"
                >
                  <ChevronLeft className="mr-3 size-5" />
                  Previous Layer
                </Button>
              )}
              {currentStep !== 'review' ? (
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 'vision' && !prompt.trim()}
                  className={cn(
                    "relative overflow-hidden rounded-full h-14 px-10 font-black text-lg shadow-2xl transition-all group",
                    currentStep === 'vision' && !prompt.trim() 
                      ? "bg-white/10 text-white/40 border-white/10" 
                      : "bg-white text-slate-950 hover:scale-[1.03] active:scale-95 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
                  )}
                >
                   {/* Luminous sheen for the main action button */}
                   {!(currentStep === 'vision' && !prompt.trim()) && (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg]"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 1 }}
                      />
                   )}
                  
                  <span className="relative z-10 flex items-center gap-3">
                    {currentStep === 'vision' && (
                       <>
                         <Sparkles className="size-5" />
                         Start Creative Brief
                       </>
                    )}
                    {currentStep === 'goal' && 'Lock Goals'}
                    {currentStep === 'focus' && 'Set Focus Areas'}
                    {currentStep === 'energy' && 'Choose Energy'}
                    {currentStep === 'reference' && 'Lock Style Preset'}
                    <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={handleFinalSubmit}
                  className="rounded-full h-16 px-12 bg-[#7ff2d4] text-slate-950 hover:bg-[#7ff2d4]/90 hover:scale-[1.03] active:scale-[0.98] font-black text-xl shadow-[0_30px_60px_-15px_rgba(127,242,212,0.5)] border-4 border-white/20 transition-all flex items-center gap-4"
                >
                  Apply Creative Direction
                  <Sparkles className="size-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
