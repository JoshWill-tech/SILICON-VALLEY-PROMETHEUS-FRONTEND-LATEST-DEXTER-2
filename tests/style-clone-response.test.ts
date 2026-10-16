import assert from 'node:assert/strict'
import { test } from 'node:test'

import { readStyleCloneResponse } from '../lib/editor/style-clone-response'

test('non-JSON style clone errors become an actionable service message', async () => {
  const response = new Response('<html>gateway error</html>', {
    status: 502,
    headers: { 'content-type': 'text/html' },
  })

  await assert.rejects(
    readStyleCloneResponse(response),
    /non-JSON response.*temporarily unavailable/i,
  )
})

test('JSON errors preserve the service message and valid analyses are returned', async () => {
  await assert.rejects(
    readStyleCloneResponse(Response.json({ error: 'Video is private.' }, { status: 422 })),
    /Video is private\./,
  )

  const analysis = {
    style_reference: 'Documentary', treatment: 'warm', caption_style: 'clean_bold',
    reference_duration_sec: 20, editing_breakdown: 'Steady pacing.',
    observations: [{ time_sec: 1, detail: 'A steady opening.' }], limitations: [], zooms: [],
  }
  assert.deepEqual(await readStyleCloneResponse(Response.json({ analysis })), analysis)
})
