export const LOADING_FACTS = [
  'The first video uploaded to YouTube was 18 seconds long.',
  'AI can now generate a 60-second commercial in under 3 minutes.',
  'Vertical video gets 40% more engagement than horizontal in many social feeds.',
  'The average TikTok user watches about 95 minutes of content daily.',
  'A single minute of video can carry more than 1,800 visual decisions.',
  'Silent autoplay made captions one of the highest-leverage edits in modern video.',
  'Most viewers decide whether to keep watching within the first 3 seconds.',
  'Short-form ads often perform best when the product appears before the first cut.',
  'The human eye can detect a bad jump cut before the brain names what changed.',
  'Color grading can shift perceived emotion before a single word is spoken.',
  'A clean sound bed can make a rough cut feel dramatically more expensive.',
  'AI-assisted editing can test dozens of hook variations before a human finishes one.',
  'The earliest film editors cut physical strips of celluloid by hand.',
  'A 9:16 crop can reveal an entirely different story from the same source footage.',
  'Motion graphics started as physical animation filmed frame by frame.',
  'Viewers remember branded video better when the first scene has a clear subject.',
  'Great trailers often use silence as aggressively as sound.',
  'A strong thumbnail can change distribution before the video even starts.',
] as const

export function getRandomLoadingFact() {
  return LOADING_FACTS[Math.floor(Math.random() * LOADING_FACTS.length)]
}
