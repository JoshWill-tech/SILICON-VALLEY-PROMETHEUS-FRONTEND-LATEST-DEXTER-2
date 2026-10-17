# Source replacement upload incident — 2026-10-16

Reported symptom: a roughly 30-minute, 114 MB video produced “The replacement source could not be saved. Please try again.”

## Confirmed defects and corrections

1. **The database and frontend disagreed about storage capacity.** `lib/storage-limits.ts` gives the free tier 4 GiB, but the latest existing `maul_storage_limit_bytes` SQL definition returned 500 MiB. Both reservation and commit enforce that database function. The new migration aligns the free allowance to 4,294,967,296 bytes and preserves paid tiers and existing permissions. The exact live database function body was not accessible with the available anonymous application key, so this repository finding must not be presented as proof of the live function's current return value.
2. **Retries before the first successful part reserved the same file repeatedly.** The client only resumed sessions with at least one completed part. A zero-part failure followed by reselecting the file therefore created another asset, multipart upload, and quota reservation. This was reproduced with the real client and a failing transport; the test caught a changed asset ID and a second initiation. The client now resumes an existing zero-part session too.
3. **A durable save could be reported as failed because of the browser project cache.** The editor returned `false` after successful upload and registration when its optional browser cache had no matching project/source. Selection ownership now uses the active upload reference, and React project state can be updated independently of that cache. The cache-miss and stale-selection cases were exercised against the actual editor callback extracted with the TypeScript parser.
4. **The editor discarded the cause.** Upload and registration exceptions were reduced to a boolean. The editor now preserves the error, displays its message, and retains structured API error codes and retryability in `MultipartUploadError`.
5. **A failed metadata save discarded completed upload progress.** Replacement now retains a verified checkpoint until asset registration succeeds. Retrying the same file reuses those bytes and their original identity. Completed part checkpoints also survive transport interruption.
6. **The client ignored the reservation's part size.** It now follows the server-issued chunk size. Terminal API errors marked non-retryable stop retries.

The original request has not yet been correlated to an authenticated request log: its page URL, project ID, and exact failure time were requested but were not available during this investigation. These are reproduced causal defects, not a claim that every one occurred in that single request.

## Live Cloudflare evidence

The configured R2 credentials can list objects and multipart uploads and can create, upload, complete, HEAD, and delete isolated diagnostic objects. No existing user objects or upload sessions were deleted.

- An audit found 11 incomplete uploads. The five most recently inspected sessions had zero uploaded bytes, including three initiated at 15:10:58, 15:11:15, and 15:11:42 UTC on October 16. These cannot be attributed to the reported project without its identifiers.
- Browser preflight returned HTTP 204 and the correct allowed origin for `http://localhost:3000`, `https://prometheusstudio.tech`, and `https://www.prometheusstudio.tech`.
- `http://localhost:3001` returned HTTP 403 with no allowed origin. If this is the frontend address used for the failure, the bucket needs that exact origin added to CORS. Other development or LAN origins require their own explicit entry.
- A real **114 MiB / 119,537,664-byte** upload passed using localhost:3000's origin. Its parts were 50 MiB, 50 MiB, and 14 MiB. PUT responses allowed the origin and exposed ETag; completion and authoritative HEAD size verification passed. The diagnostic object was removed. Measured transfer/probe time: 41 seconds, excluding command startup.
- The real 4 GiB production-origin probe is recorded below when complete.
- Reading bucket CORS and lifecycle configuration returned `AccessDenied` / HTTP 403. These object-scoped credentials cannot audit or modify those settings. Successful preflight and PUT tests establish behavior for the tested origins; they do not establish the lifecycle policy.

The uploader sends 50 MiB parts directly to the R2 S3 endpoint. The video body does not pass through the application's API routes. Cloudflare documents multipart upload as the resumable large-file path: [upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/), [browser CORS](https://developers.cloudflare.com/r2/buckets/cors/).

## Verification

- Before the fix: 3 initial behavioral checks passed and 6 failed with the expected assertions. The separate zero-part reservation reproduction also failed before its fix.
- The first corrected suite passed 13 behavioral checks. Final verification and the expanded suite are recorded in `GATES-large-source-replacement.md`.
- Existing multipart, source ownership/error, source/transcript sequencing, and motion source-picker checks passed.
- The original typecheck passed. Final typecheck, lint, and production-build results are recorded in the gate ledger.
- This environment injects `NODE_OPTIONS=--max-old-space-size=512`. The initial production build exhausted that heap. Validation is repeated with a 4096 MiB heap; no application memory limit or dependency was changed.
- `npm run test:source-upload` and `.github/workflows/source-upload-regression.yml` run the behavioral checks and compare the latest SQL limits with all frontend storage tiers.

The browser transport tests simulate file ranges for the 4 GiB client run to avoid allocating a whole video in test memory. The separate R2 probe transfers real bytes. Neither proves decoding, transcription, or editing performance for every codec and device.

## Deployment and operator actions

The changes are on `codex/fix-large-source-replacement`. No deployment or database migration has been applied by this task.

1. Apply **only** `supabase/migrations/20261016000000_align_source_upload_storage_quotas.sql` through the normal reviewed migration workflow or Supabase SQL editor. As the database owner, `select public.maul_storage_limit_bytes(null);` should return `4294967296`. Do not grant that internal function to anonymous clients.
2. Deploy the validated frontend branch. The existing Vercel CLI account lookup returned `Not authorized`; production deployment needs a working login with access to the linked Vercel team/project.
3. If the failing page uses localhost:3001 or another origin, add that exact origin to the sources bucket's CORS policy, retaining existing methods, headers, and ETag exposure. A bucket administrator must do this or provide the appropriate configuration access.
4. Have a bucket administrator verify the incomplete-multipart lifecycle rule. Object credentials returned 403 for reading it. Do not delete user uploads indiscriminately to clear reservations.

The installed Supabase CLI is incomplete: it reports “No matching Supabase CLI binary package found for win32-x64.” No database password or management token was available in the loaded environment. The application key was used only for a readiness check: the session endpoint exists, and anonymous invocation of the reservation function is correctly denied.

Reproduce the storage diagnostics with `node scripts/audit-source-upload.mjs`. Run isolated real-byte probes with `node scripts/probe-r2-source-upload.mjs 114` or `node scripts/probe-r2-source-upload.mjs 4096 https://prometheusstudio.tech`. The probe creates a unique diagnostic object and removes it after verification, or aborts its own incomplete upload on failure. Network access and configured R2 credentials are required.
