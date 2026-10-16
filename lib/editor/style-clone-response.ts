import { referenceAnalysisSchema } from './reference-style'

export async function readStyleCloneResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  let body: unknown

  try {
    body = await response.json()
  } catch {
    const detail = contentType.includes('json')
      ? 'an unreadable response'
      : 'a non-JSON response'
    throw new Error(`Reference analysis service returned ${detail}. It may be temporarily unavailable; try again.`)
  }

  if (!body || typeof body !== 'object') {
    throw new Error('Reference analysis service returned an invalid response. Try again.')
  }

  const record = body as Record<string, unknown>
  if (!response.ok) {
    throw new Error(typeof record.error === 'string' ? record.error : `Reference analysis failed (${response.status}). Try again.`)
  }

  const analysis = referenceAnalysisSchema.safeParse(record.analysis)
  if (!analysis.success) {
    throw new Error('Reference analysis returned incomplete results. Try another public video link.')
  }
  return analysis.data
}
