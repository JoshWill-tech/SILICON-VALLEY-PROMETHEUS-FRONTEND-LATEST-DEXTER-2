import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert'

const timelinePath = path.resolve('components/editor/TimelinePanel.tsx')
const timelineSrc = fs.readFileSync(timelinePath, 'utf8')

const gate = process.argv[2]

function checkG1() {
  // G1: Component architecture & export verification
  assert.match(timelineSrc, /export function TimelinePanel\(/, 'TimelinePanel must be exported')
  assert.match(timelineSrc, /export interface TimelinePanelProps/, 'TimelinePanelProps must be exported')
  assert.match(timelineSrc, /onSeekSeconds\?: \(timeSec: number\) => void/, 'onSeekSeconds prop preserved')
  assert.match(timelineSrc, /durationSec\?: number/, 'durationSec prop preserved')
  assert.match(timelineSrc, /onSplit\?: \(timeSec\?: number\) => void/, 'onSplit prop preserved')
  assert.match(timelineSrc, /onRemoveSilence\?: \(\) => void/, 'onRemoveSilence prop preserved')
  console.log('G1: component architecture & export verification passed')
}

function checkG2() {
  // G2: Replacement with Chronos tactile optical ruler canvas
  assert.match(timelineSrc, /rulerCanvasRef/, 'Must have ruler canvas ref')
  assert.match(timelineSrc, /Math\.cos\(normalizedDist \* Math\.PI \* 0\.5\)/, 'Must have cosine falloff vignette curve')
  assert.match(timelineSrc, /roundRect/, 'Must draw rounded connector bars and tick marks')
  assert.match(timelineSrc, /shadowBlur/, 'Must have optical center glow on active tick')
  assert.match(timelineSrc, /1277|formatTimecode|timecode-display/, 'Must support counter readout')
  console.log('G2: optical ruler canvas & reference geometry passed')
}

function checkG3() {
  // G3: Web Audio procedural luxury sound engine
  assert.match(timelineSrc, /AudioContext/, 'Must initialize AudioContext')
  assert.match(timelineSrc, /subOsc|createOscillator/, 'Must have sub-bass oscillator for cinematic weight')
  assert.match(timelineSrc, /noiseBuffer|scrubNoiseNode|createBuffer/, 'Must have brown noise reel friction buffer')
  assert.match(timelineSrc, /bandpass/, 'Must have bandpass filter for reel friction & click')
  assert.match(timelineSrc, /LEICA DETENT/, 'Must include Leica Detent profile')
  assert.match(timelineSrc, /CHRONOGRAPH/, 'Must include Chronograph profile')
  assert.match(timelineSrc, /SUB-BASS REEL/, 'Must include Sub-Bass Reel profile')
  console.log('G3: procedural luxury sound engine with sub-bass and reel friction passed')
}

function checkG4() {
  // G4: Vignette & film grain vintage blending
  assert.match(timelineSrc, /vignette|radial-gradient/, 'Must have deep vignette layer')
  assert.match(timelineSrc, /film-grain|noiseFilter|fractalNoise/, 'Must have film grain effect')
  console.log('G4: vintage vignette and film grain blending passed')
}

function checkG5() {
  // G5: Interactive transport, velocity telemetry & detent snapping
  assert.match(timelineSrc, /velocity|absVel/, 'Must track scrub velocity')
  assert.match(timelineSrc, /snapToDetent|SNAP:/, 'Must have magnetic detent snapping')
  assert.match(timelineSrc, /formatToggle|timeFormat/, 'Must support format cycling')
  assert.match(timelineSrc, /CHAPTERS|Chapter/, 'Must support chapter navigation')
  console.log('G5: interactive transport, telemetry and snapping passed')
}

function checkG6() {
  // G6: Autonomous test target attributes preservation
  assert.match(timelineSrc, /data-action="toggle-playback"/, 'toggle-playback data-action preserved')
  assert.match(timelineSrc, /data-autonomous-target="playback"/, 'playback autonomous target preserved')
  assert.match(timelineSrc, /data-action="toggle-mute"/, 'toggle-mute data-action preserved')
  assert.match(timelineSrc, /data-autonomous-target="mute"/, 'mute autonomous target preserved')
  assert.match(timelineSrc, /data-action="seek-scrubber"/, 'seek-scrubber data-action preserved')
  assert.match(timelineSrc, /data-autonomous-target="timeline-scrubber"/, 'timeline-scrubber autonomous target preserved')
  assert.match(timelineSrc, /data-action="split-cut"/, 'split-cut data-action preserved')
  assert.match(timelineSrc, /data-autonomous-target="split"/, 'split autonomous target preserved')
  assert.match(timelineSrc, /data-action="remove-silence"/, 'remove-silence data-action preserved')
  assert.match(timelineSrc, /data-autonomous-target="silence-cut"/, 'silence-cut autonomous target preserved')
  console.log('G6: autonomous test target attributes preserved')
}

switch (gate) {
  case 'G1':
    checkG1()
    break
  case 'G2':
    checkG2()
    break
  case 'G3':
    checkG3()
    break
  case 'G4':
    checkG4()
    break
  case 'G5':
    checkG5()
    break
  case 'G6':
    checkG6()
    break
  case '--all':
  default:
    checkG1()
    checkG2()
    checkG3()
    checkG4()
    checkG5()
    checkG6()
    console.log('all chronos scrubber verification checks passed')
    break
}
