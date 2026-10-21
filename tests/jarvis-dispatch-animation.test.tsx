import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'

import { JarvisDispatchAnimation } from '../components/loading-animation/jarvis-dispatch-animation'
import { CinematicSkeletalLoader } from '../components/loading-animation/cinematic-skeletal-loader'
import { PrometheusChatLoadingSkeleton } from '../components/editor/prometheus-chat-loading-skeleton'
import { getTaskAnimationNarrative } from '../lib/prometheus-assistant/task-animation-narrative'

test('renders native animation without video element', () => {
  const markup = renderToStaticMarkup(
    <JarvisDispatchAnimation prompt="Suggest a hook for this clip" />
  )

  // Accessibility and semantics
  assert.match(markup, /role="status"/)
  assert.match(markup, /aria-live="polite"/)
  assert.match(markup, /data-slot="jarvis-dispatch-animation"/)

  // Native SVG ribbon curve and textPath
  assert.match(markup, /<svg/i)
  assert.match(markup, /<textPath/i)
  assert.match(markup, /stroke-dasharray="3 4"/i)

  // Audio pill indicator
  assert.match(markup, /Live<\/span>/i)

  // Task-specific text from prompt
  assert.match(markup, /Synthesizing viral hooks/i)
  assert.match(markup, /Hooks<\/span>/i)

  // ABSOLUTELY NO VIDEO ELEMENT
  assert.doesNotMatch(markup, /<video/i)

  // CinematicSkeletalLoader variant="chat" also uses native animation with zero video
  const chatLoaderMarkup = renderToStaticMarkup(
    <CinematicSkeletalLoader variant="chat" prompt="Suggest a hook for this clip" />
  )
  assert.match(chatLoaderMarkup, /data-slot="jarvis-dispatch-animation"/)
  assert.doesNotMatch(chatLoaderMarkup, /<video/i)
  console.log('renders native animation without video element passed')
})

test('synthesizes task-unique narrative', () => {
  // 1. Hooks task
  const hookNarrative = getTaskAnimationNarrative({ prompt: 'Suggest a hook for this clip' })
  assert.equal(hookNarrative.tag, 'Hooks')
  assert.equal(hookNarrative.cardStep, 'Synthesizing viral hooks')
  assert.match(hookNarrative.ribbonText, /narrative tension/i)

  // 2. Captions task
  const captionNarrative = getTaskAnimationNarrative({ prompt: 'Add kinetic pop subtitles and captions' })
  assert.equal(captionNarrative.tag, 'Captions')
  assert.equal(captionNarrative.cardStep, 'Styling kinetic captions')
  assert.match(captionNarrative.ribbonText, /transcribing speech audio/i)

  // 3. Cuts & pacing task
  const cutNarrative = getTaskAnimationNarrative({ prompt: 'Trim the silence and tighten cuts' })
  assert.equal(cutNarrative.tag, 'Timeline')
  assert.equal(cutNarrative.cardStep, 'Tightening timeline cuts')
  assert.match(cutNarrative.ribbonText, /scanning speech boundaries/i)

  // 4. Color grading task
  const colorNarrative = getTaskAnimationNarrative({ prompt: 'Color grade this scene with cinematic warm contrast' })
  assert.equal(colorNarrative.tag, 'Color Grade')
  assert.equal(colorNarrative.cardStep, 'Calibrating cinematic color')
  assert.match(colorNarrative.ribbonText, /lumetri curve/i)

  // 5. Audio mixing task
  const audioNarrative = getTaskAnimationNarrative({ prompt: 'Duck background music under voice audio' })
  assert.equal(audioNarrative.tag, 'Audio Mix')
  assert.equal(audioNarrative.cardStep, 'Mixing audio layers')
  assert.match(audioNarrative.ribbonText, /spectral frequency/i)

  // 6. Custom prompt task
  const customNarrative = getTaskAnimationNarrative({ prompt: 'Generate an executive corporate trailer' })
  assert.equal(customNarrative.tag, 'Editorial')
  assert.match(customNarrative.cardStep, /Generate an executive corporate trailer/i)
  assert.match(customNarrative.ribbonText, /Generate an executive corporate trailer/i)

  console.log('synthesizes task-unique narrative passed')
})

test('chat skeleton exposes semantic status and reduced motion', () => {
  // Default cinematic dispatch mode in chat
  const chatMarkup = renderToStaticMarkup(
    <PrometheusChatLoadingSkeleton prompt="Suggest a hook for this clip" />
  )
  assert.match(chatMarkup, /role="status"/)
  assert.match(chatMarkup, /data-slot="jarvis-dispatch-animation"/)
  assert.doesNotMatch(chatMarkup, /<video/i)

  // Fallback compact mode with breathing orb
  const compactMarkup = renderToStaticMarkup(
    <PrometheusChatLoadingSkeleton showCinematicVideo={false} />
  )
  assert.match(compactMarkup, /role="status"/)
  assert.match(compactMarkup, /data-thinking-orb="breathing"/)
  assert.match(compactMarkup, /data-skeleton-flow="true"/)

  console.log('chat skeleton exposes semantic status and reduced motion passed')
})
