export interface TaskAnimationNarrative {
  ribbonText: string
  cardTitle: string
  cardStep: string
  cardSubtext: string
  tag: string
  secondaryTag?: string
}

export interface TaskNarrativeOptions {
  prompt?: string | null
  intent?: string | null
  label?: string | null
  sublabel?: string | null
  thoughts?: string[] | null
}

const HOOK_PATTERN = /\b(?:hook|hooks|viral|retention|attention|opening|scroll[\s-]?stopper|intro|curiosity)\b/i
const CAPTION_PATTERN = /\b(?:caption|captions|subtitle|subtitles|kinetic|typography|font|fonts|text\s*overlay|lyrics)\b/i
const COLOR_PATTERN = /\b(?:color|grade|grading|lut|cinematic\s*look|contrast|exposure|warmth|saturation|filmic|palette|tones?)\b/i
const AUDIO_PATTERN = /\b(?:audio|music|soundtrack|song|beat|ducking|sound|voice|vocal|volume|frequencies|mastering)\b/i
const CUT_PATTERN = /\b(?:cut|cuts|trim|trimming|silence|pause|pauses|split|tighten|pacing|jump[\s-]?cut|montage)\b/i
const EXPORT_PATTERN = /\b(?:export|render|encode|mp4|webm|download|output|bake|baking|deliver)\b/i

/**
 * Synthesizes dynamic, contextual text for the looping ribbon animation and status card,
 * tailored to the exact task, user query, or stage that Jarvis is currently executing.
 */
export function getTaskAnimationNarrative(options: TaskNarrativeOptions = {}): TaskAnimationNarrative {
  const { prompt, intent, label, sublabel, thoughts } = options
  const rawPrompt = (prompt ?? '').trim()
  const rawIntent = (intent ?? '').trim().toLowerCase()
  const latestThought = thoughts && thoughts.length > 0 ? thoughts[thoughts.length - 1] : null

  // 1. Viral Hooks & Retention Strategy
  if (HOOK_PATTERN.test(rawPrompt) || rawIntent === 'social-content' || HOOK_PATTERN.test(label ?? '')) {
    return {
      ribbonText: 'analyzing narrative tension · grab attention in the first 2 seconds · high-retention hook cadence · punchy visual momentum',
      cardTitle: 'Jarvis Dispatching',
      cardStep: label ?? 'Synthesizing viral hooks',
      cardSubtext: sublabel ?? '3 high-impact hook variations mapped to narrative inflection points.',
      tag: 'Hooks',
      secondaryTag: 'Retention',
    }
  }

  // 2. Kinetic Captions & Typography
  if (CAPTION_PATTERN.test(rawPrompt) || CAPTION_PATTERN.test(label ?? '')) {
    return {
      ribbonText: 'transcribing speech audio · syncing word-level timestamps · kinetic pop typography · high-contrast styling',
      cardTitle: 'Jarvis Dispatching',
      cardStep: label ?? 'Styling kinetic captions',
      cardSubtext: sublabel ?? 'Word-timed cadence with dynamic pop emphasis and safe margins.',
      tag: 'Captions',
      secondaryTag: 'Typography',
    }
  }

  // 3. Color Grading & Cinematic Tone
  if (COLOR_PATTERN.test(rawPrompt) || COLOR_PATTERN.test(label ?? '')) {
    return {
      ribbonText: 'evaluating lumetri curve · balancing shadows and highlights · filmic teal-orange contrast · rich cinematic grade',
      cardTitle: 'Jarvis Dispatching',
      cardStep: label ?? 'Calibrating cinematic color',
      cardSubtext: sublabel ?? 'Adjusting tonal response curves and balancing skin tone isolation.',
      tag: 'Color Grade',
      secondaryTag: 'Filmic',
    }
  }

  // 4. Audio, Ducking & Soundtrack
  if (AUDIO_PATTERN.test(rawPrompt) || AUDIO_PATTERN.test(label ?? '')) {
    return {
      ribbonText: 'analyzing spectral frequency · sidechain ducking voice track · beat-matching scene transitions · rich acoustic depth',
      cardTitle: 'Jarvis Dispatching',
      cardStep: label ?? 'Mixing audio layers',
      cardSubtext: sublabel ?? 'Balancing voice intelligibility with dynamic background soundtrack ducking.',
      tag: 'Audio Mix',
      secondaryTag: 'Mastering',
    }
  }

  // 5. Timeline Cuts, Trimming & Pacing
  if (CUT_PATTERN.test(rawPrompt) || rawIntent === 'editor-action' || CUT_PATTERN.test(label ?? '')) {
    return {
      ribbonText: 'scanning speech boundaries · detecting filler words and pauses · tightening editorial rhythm · seamless pacing cuts',
      cardTitle: 'Jarvis Dispatching',
      cardStep: label ?? 'Tightening timeline cuts',
      cardSubtext: sublabel ?? 'Removing dead space and aligning playhead cuts to speech cadence.',
      tag: 'Timeline',
      secondaryTag: 'Pacing',
    }
  }

  // 6. Export & Rendering
  if (EXPORT_PATTERN.test(rawPrompt) || EXPORT_PATTERN.test(label ?? '')) {
    return {
      ribbonText: 'compiling render graph · optimizing bitrate encoding · hardware accelerated pipeline · pristine delivery output',
      cardTitle: 'Jarvis Dispatching',
      cardStep: label ?? 'Preparing export pipeline',
      cardSubtext: sublabel ?? 'Encoding hardware-accelerated master with multi-pass fidelity.',
      tag: 'Export',
      secondaryTag: 'H.264',
    }
  }

  // 7. Contextual user prompt (if non-empty)
  if (rawPrompt.length > 0) {
    const cleanPrompt = rawPrompt.replace(/[?.!]+$/, '').trim()
    const truncatedPrompt = cleanPrompt.length > 40 ? `${cleanPrompt.slice(0, 37)}...` : cleanPrompt
    return {
      ribbonText: `deconstructing "${cleanPrompt}" · evaluating creative intent · synthesizing tailored editorial directives · precision guidance`,
      cardTitle: 'Jarvis Dispatching',
      cardStep: label ?? `Executing "${truncatedPrompt}"`,
      cardSubtext: sublabel ?? (latestThought ? `Reasoning: ${latestThought}` : 'Analyzing context and synthesizing precision recommendations.'),
      tag: 'Editorial',
      secondaryTag: 'Copilot',
    }
  }

  // 8. General fallback
  return {
    ribbonText: 'understanding creative intent · parsing timeline context · compiling response · editorial precision',
    cardTitle: 'Jarvis Dispatching',
    cardStep: label ?? 'Assessing your request',
    cardSubtext: sublabel ?? 'Preparing your Prometheus response...',
    tag: 'Jarvis',
    secondaryTag: 'Copilot',
  }
}
