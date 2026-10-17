/** Leave time for image compaction and the JSON response after Gemini finishes. */
export const THUMBNAIL_PROVIDER_TIMEOUT_MS = 240_000
export const THUMBNAIL_ROUTE_MAX_DURATION_SECONDS = 300
export const THUMBNAIL_CLIENT_TIMEOUT_MS = 285_000

/** Optional art direction must leave the image model its full rendering budget. */
export const THUMBNAIL_PLANNER_TIMEOUT_MS = 20_000
/** Settle with JSON before either the browser or the serverless host gives up. */
export const THUMBNAIL_PIPELINE_TIMEOUT_MS = 270_000

/** Bound even SDK/body operations that do not promptly reject when aborted. */
export function runWithThumbnailSignal<T>(signal: AbortSignal, operation: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const cleanup = () => signal.removeEventListener('abort', abort)
    const abort = () => { cleanup(); reject(signal.reason) }
    if (signal.aborted) { abort(); return }
    signal.addEventListener('abort', abort, { once: true })
    Promise.resolve().then(() => { signal.throwIfAborted(); return operation() }).then(
      value => { cleanup(); resolve(value) },
      error => { cleanup(); reject(error) },
    )
  })
}
