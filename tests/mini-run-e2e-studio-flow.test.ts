import test from 'node:test'
import assert from 'node:assert/strict'

test('full mini-run pipeline executes end-to-end through frontend api', async () => {
  const baseUrl = 'http://127.0.0.1:3000'
  const headers = {
    'Cookie': 'prometheus-dev-auth-bypass=1',
  }

  // 1. Projects Ingest: Ensure project is listed and ready
  const projectsRes = await fetch(`${baseUrl}/api/projects`, { headers })
  assert.equal(projectsRes.status, 200, 'projects endpoint must return 200')
  const projectsBody = (await projectsRes.json()) as { success: boolean; projects: Array<{ id: string; sourceAssetId: string }> }
  assert.equal(projectsBody.success, true, 'projects response must succeed')
  const targetProject = projectsBody.projects.find((p) => p.id === 'f56c53dc-d0c7-47c3-8ead-cb1c01adb49f')
  assert.ok(targetProject, 'Jeff Simons project must be present')
  assert.equal(targetProject.sourceAssetId, 'jeff-simons-asset-001', 'project must have valid source asset id')

  // 2. Assets Loading: Ensure source video is streamable
  const assetsRes = await fetch(`${baseUrl}/api/projects/${targetProject.id}/assets`, { headers })
  assert.equal(assetsRes.status, 200, 'assets endpoint must return 200')
  const assetsBody = (await assetsRes.json()) as { success: boolean; asset: { id: string }; source: { url: string } }
  assert.equal(assetsBody.success, true, 'assets response must succeed')
  assert.equal(assetsBody.asset.id, 'jeff-simons-asset-001', 'asset id must match')
  assert.ok(assetsBody.source.url, 'source url must be provided')

  // Verify source video streamability
  const sourceMediaRes = await fetch(`${baseUrl}${assetsBody.source.url}`, { method: 'HEAD' })
  assert.equal(sourceMediaRes.status, 200, 'source media file must be accessible')
  assert.equal(sourceMediaRes.headers.get('content-type'), 'video/mp4', 'source media must be video/mp4')

  // 3. Dispatch Render: Trigger "Generate Short"
  const dispatchRes = await fetch(`${baseUrl}/api/mini-run/dispatch`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId: targetProject.id,
      sourceAssetId: targetProject.sourceAssetId,
      shot: {
        pipeline: 'maul',
        sourceStartMs: 0,
        sourceEndMs: 30000,
        preferredDurationSec: 30,
        targetChunkWords: 3,
        maxChunkWords: 5,
        canvasWidth: 1080,
        canvasHeight: 1920,
        songPolicy: 'auto',
      },
    }),
  })
  assert.equal(dispatchRes.status, 200, 'dispatch endpoint must return 200')
  const dispatchBody = (await dispatchRes.json()) as { jobId: string; status: string }
  assert.ok(dispatchBody.jobId, 'dispatch must return a valid jobId')

  // 4. Polling Status: Verify job polling returns completed state
  const statusRes = await fetch(`${baseUrl}/api/mini-run/api/pipeline/job/${dispatchBody.jobId}`, { headers })
  assert.equal(statusRes.status, 200, 'job status endpoint must return 200')
  const statusBody = (await statusRes.json()) as { ok: boolean; status: string; state: string; outputUrl: string; chunkCount: number }
  assert.equal(statusBody.ok, true, 'job status must be ok')
  assert.equal(statusBody.state, 'completed', 'job state must be completed')
  assert.ok(statusBody.outputUrl, 'outputUrl must be provided')

  // 5. Output Delivery: Stream final rendered MP4 with full and range requests
  const outputFullRes = await fetch(`${baseUrl}${statusBody.outputUrl}`, { headers })
  assert.equal(outputFullRes.status, 200, 'output delivery must return 200')
  assert.equal(outputFullRes.headers.get('content-type'), 'video/mp4', 'output must be video/mp4')
  const totalLength = Number(outputFullRes.headers.get('content-length'))
  assert.ok(totalLength > 100_000_000, 'output file must be full-length high-fidelity short (~104 MB)')

  // 6. Range streaming verification for video seeking
  const outputRangeRes = await fetch(`${baseUrl}${statusBody.outputUrl}`, {
    headers: { ...headers, Range: 'bytes=0-2047' },
  })
  assert.equal(outputRangeRes.status, 206, 'range request must return 206 Partial Content')
  assert.equal(outputRangeRes.headers.get('content-length'), '2048', 'range chunk must match byte request')
  assert.ok(outputRangeRes.headers.get('content-range')?.startsWith('bytes 0-2047/'), 'content-range header must match')
})
