import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

test('netflix sound assets exist in public/audio with valid headers and sizes', () => {
  const mp3Path = path.resolve(process.cwd(), 'public/audio/netflix-intro.mp3')
  const oggPath = path.resolve(process.cwd(), 'public/audio/netflix-intro.ogg')
  const webmPath = path.resolve(process.cwd(), 'public/audio/netflix-intro.webm')

  assert.ok(fs.existsSync(mp3Path), 'netflix-intro.mp3 exists in public/audio')
  assert.ok(fs.existsSync(oggPath), 'netflix-intro.ogg exists in public/audio')
  assert.ok(fs.existsSync(webmPath), 'netflix-intro.webm exists in public/audio')

  const mp3Stats = fs.statSync(mp3Path)
  assert.ok(mp3Stats.size > 30000, `mp3 file size should be substantial (got ${mp3Stats.size} bytes)`)

  const buf = fs.readFileSync(mp3Path)
  const isId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33 // 'ID3'
  const isSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0 // MP3 sync word
  assert.ok(isId3 || isSync, 'netflix-intro.mp3 has valid audio header')

  const oggBuf = fs.readFileSync(oggPath)
  assert.equal(oggBuf.subarray(0, 4).toString('ascii'), 'OggS', 'netflix-intro.ogg has valid OggS header')
})

test('useNetflixIntroSound hook triggers on every reload and entry without single-play restriction', () => {
  const hookSource = fs.readFileSync(
    path.resolve(process.cwd(), 'hooks/use-netflix-intro-sound.ts'),
    'utf8',
  )

  // Must not have single-play or session lockouts
  assert.ok(!hookSource.includes('hasPlayedInSession'), 'no session-level play-once restriction')
  assert.match(hookSource, /playPromise !== undefined/, 'handles modern play() promise')
  assert.match(hookSource, /pointerdown|pointermove|wheel|keydown|click/, 'listens for gesture fallback')
  assert.match(hookSource, /prometheus-netflix-sound/, 'binds to preloaded DOM audio element')
  assert.match(hookSource, /prometheus:intro-sound-played/, 'dispatches event when intro sound plays')
  assert.match(hookSource, /prometheus:replay-intro-sound/, 'supports manual replay event')
  assert.match(hookSource, /__playPrometheusIntroSound/, 'attaches global window helper')
  assert.match(hookSource, /playSynthesizedNetflixChime/, 'includes Web Audio API synthesized fallback')
})

test('NetflixIntroSound component is wired into RootClientEffects', () => {
  const rootEffectsSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/root-client-effects.tsx'),
    'utf8',
  )

  assert.match(rootEffectsSource, /NetflixIntroSound/, 'RootClientEffects imports NetflixIntroSound')
  assert.match(rootEffectsSource, /<NetflixIntroSound \/>/, 'RootClientEffects renders <NetflixIntroSound />')
})

test('NetflixIntroSound component exposes accessible offscreen audio tag without display none', () => {
  const componentSource = fs.readFileSync(
    path.resolve(process.cwd(), 'components/sound/netflix-intro-sound.tsx'),
    'utf8',
  )

  assert.match(componentSource, /aria-hidden="true"/, 'sound component is aria-hidden')
  assert.match(componentSource, /id="prometheus-netflix-sound"/, 'exposes DOM id for preloaded instant play')
  assert.ok(!componentSource.includes("display: 'none'"), 'does not use display none which suspends media pipeline')
  assert.match(componentSource, /\/audio\/netflix-intro\.mp3/, 'references mp3 source')
  assert.match(componentSource, /\/audio\/netflix-intro\.ogg/, 'references ogg source')
  assert.match(componentSource, /\/audio\/netflix-intro\.webm/, 'references webm source')
})
