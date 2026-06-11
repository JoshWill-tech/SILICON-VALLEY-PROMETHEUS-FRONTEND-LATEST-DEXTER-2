import assert from 'node:assert/strict'

import {
  clampMediaTime,
  formatPlayerTime,
  getProgressPercent,
  getScrubSeekTime,
  normalizePlaybackRate,
} from '@/lib/hooks/use-youtube-player'
import {
  getGestureRegion,
  getHorizontalScrubSeconds,
  getVerticalGestureDelta,
} from '@/lib/hooks/use-gestures'

function run() {
  assert.equal(formatPlayerTime(0), '0:00')
  assert.equal(formatPlayerTime(139), '2:19')
  assert.equal(formatPlayerTime(3725), '1:02:05')

  assert.equal(clampMediaTime(-15, 120), 0)
  assert.equal(clampMediaTime(121, 120), 120)
  assert.equal(clampMediaTime(48, 120), 48)

  assert.equal(getProgressPercent(30, 120), 25)
  assert.equal(getProgressPercent(300, 120), 100)
  assert.equal(getProgressPercent(30, 0), 0)

  assert.equal(normalizePlaybackRate(1.25), 1.25)
  assert.equal(normalizePlaybackRate(0), 1)
  assert.equal(normalizePlaybackRate(Number.NaN), 1)

  assert.equal(getGestureRegion(10, 300, 0.2), 'left')
  assert.equal(getGestureRegion(150, 300, 0.2), 'center')
  assert.equal(getGestureRegion(290, 300, 0.2), 'right')

  assert.equal(getVerticalGestureDelta(200, 120, 240), 0.33)
  assert.equal(getVerticalGestureDelta(120, 200, 240), -0.33)

  assert.equal(getHorizontalScrubSeconds(150, 300, 60), 30)
  assert.equal(getHorizontalScrubSeconds(-150, 300, 60), -30)

  assert.equal(getScrubSeekTime(40, 150, 300, 60, 180), 70)
  assert.equal(getScrubSeekTime(170, 150, 300, 60, 180), 180)
  assert.equal(getScrubSeekTime(10, -300, 300, 60, 180), 0)
}

run()
