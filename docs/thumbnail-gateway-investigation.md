# Thumbnail gateway investigation

Status: production root cause unconfirmed; matching Vercel runtime logs inaccessible with the available CLI login. No application fix, deployment, version change or credential change was made.

## Verified source findings

- The exact reported message comes from `lib/thumbnails/thumbnail-response.ts`. It means the frontend received a response it could not parse as JSON and classified as HTML or redirected. The reported status is 502 and content type is text/html. It does not establish an image credential failure.
- `components/editor/ThumbnailStudioModal.tsx` posts to `/api/projects/{projectId}/thumbnails/nano-banana`. Existing variants are updated only after a successful response and image decoding; the failure path does not replace them.
- The checked-out `app/api/projects/[id]/thumbnails/nano-banana/route.ts` converts provider HTTP errors, including HTML errors, into JSON. It logs `[Thumbnail Stage]` at image-generation start and after provider response headers, `[Thumbnail Image Provider Error]` for provider HTTP failures, and `[Nano Banana Route Error]` for caught exceptions. Logs include request reference and stage information.
- The provider-finished log occurs before reading the response body. It therefore does not prove that the body was completely received or that image compaction finished.
- Provider fetch timeout is 240 seconds, route maximum is 300 seconds, and frontend timeout is 285 seconds. These source settings alone do not prove the deployed settings or a timeout diagnosis. Gemini planning calls occur before the timed image fetch.
- Generated images are compacted to at most 3,500,000 data-URL bytes before the success JSON is returned. Request-size and response-size protections already exist. Their presence does not identify the failing layer.
- The proxy permits API paths through after rate-limit and honeypot handling. The reviewed rate-limit rejection is JSON 429, not HTML 502.

The distinction between provider JSON error handling and the observed app HTML response makes an outer gateway, invocation failure, or different deployed code worth checking. None is proven without the failing request and deployment logs. No speculative changes were made.

## Access evidence

The repository's `.vercel/project.json` links project `silicon-valley-prometheus-frontend-latest-dexter`, ID `prj_ATcaGPCangxYZlUs7jG7P9NxsYGM`, and team `team_gUU5WGu30QlJAATLKzPpfFnk`.

The installed Vercel CLI is 59.26.0. `vercel.cmd` was used because PowerShell blocks the installed `.ps1` shim. Initial sandbox network and CLI cache access failures were followed by an approved read-only query outside the sandbox:

```powershell
vercel.cmd logs --project prj_ATcaGPCangxYZlUs7jG7P9NxsYGM --environment production --since 24h --status-code 5xx --limit 100 --json
```

Vercel returned `Project not found ... under prometheus-mcp-server`. Explicit `--scope team_gUU5WGu30QlJAATLKzPpfFnk` returned `The specified scope does not exist`. `vercel.cmd teams ls` listed only `prometheus-mcp-server`; `whoami` and `project ls` reported `Not authorized`. No production logs were returned, and these failures are not evidence that the thumbnail function had no errors.

The browser connection had no open user tabs and no controlled tabs. The failing app URL, approximate timestamp, and any request reference have been requested from the user and remain unavailable.

### Credential verification follow-up (2026-10-16)

The user authorized checking locally stored credentials. Inspected environment variable names and targeted Vercel/tool configuration without displaying credential values.

- `.env.local` contains `VERCEL_OIDC_TOKEN`. Its JWT expiry claim is `2026-09-02T11:12:30Z`, already expired at inspection. This is an unverified decoded claim, not a signature verification. Vercel documents this credential as a short-lived workload identity for backend/cloud federation, distinct from a Vercel API access token: [OIDC federation](https://vercel.com/docs/oidc), [API authentication](https://vercel.com/docs/rest-api).
- The saved CLI credential exists at `C:\Users\HomePC\AppData\Roaming\com.vercel.cli\Data\auth.json`. It includes a token and refresh token. Stored expiry was in the future at inspection; more decisively, a direct authenticated `GET https://api.vercel.com/v2/user` returned HTTP 200. The earlier CLI `whoami` failure therefore did not establish that this saved token was invalid.
- Direct `GET /v2/teams?limit=20` returned HTTP 200 and exposed only `prometheus-mcp-server`, ID `team_iOW3UHI4jwZgYzeKqMTTYXQE`.
- Direct `GET /v9/projects/prj_ATcaGPCangxYZlUs7jG7P9NxsYGM?teamId=team_gUU5WGu30QlJAATLKzPpfFnk` returned HTTP 403, error code `forbidden`.
- Listing projects in the accessible team returned only `deploy-vercel` and `prometheus-mcp-gateway`, with no further page. The linked frontend was not present there.
- No separate Vercel API access token was found in the inspected project environment files or targeted MCP configurations. Other application/provider credentials are not substitutes for Vercel project-log authorization.

Credentials are present and the saved login works for its permitted resources. The remaining blocker is authorization to the linked frontend team/project. No credentials or login configuration were changed. This does not diagnose the thumbnail's HTTP 502.

## Continue with access to the linked team

Use a Vercel session authorized for the linked project, or provide the relevant runtime log excerpt. Do not paste tokens or image API keys.

For the exact invocation, use the deployment and request ID from the failing request when available. Replace the placeholders below with real values, and choose a bounded time interval around the failure:

```powershell
$env:NO_UPDATE_NOTIFIER='1'
$env:VERCEL_TELEMETRY_DISABLED='1'
vercel.cmd logs --scope <authorized-team-slug> --project silicon-valley-prometheus-frontend-latest-dexter --deployment <deployment-id-or-url> --request-id <request-id> --since <start-time-ISO> --until <end-time-ISO> --limit 50 --json
```

Without a request ID, query the failing deployment's 5xx requests in the same bounded interval, locate the thumbnail route and inspect its full invocation logs. Use the matching environment; the failing page might be a preview or local server rather than production. These filters are documented in the official [Vercel logs CLI reference](https://vercel.com/docs/cli/logs).

Check the invocation's status, platform error, duration, last completed thumbnail stage, and deployed commit. An image-generation-start log without a provider-finished log narrows investigation toward the fetch or invocation lifetime; provider-finished without a successful response still leaves body reading, result extraction, compaction and delivery to investigate. An absent stage log alone is inconclusive because failure may precede it and log retention/access can be incomplete.

After confirming the failure boundary, reproduce it, add a focused failing regression test, apply the smallest fix, and verify real thumbnail generation through the failing environment. Until then, the user-visible generation failure remains unresolved.

## Validation performed

`node --experimental-strip-types --test tests/thumbnail-response.test.mjs` passed: 1 test, 0 failures. This verifies HTML 502 classification and request-reference preservation only; it is not an end-to-end generation test.

The investigation ledger passed structural lint with advisory warnings because its outcomes require manual source and external-access review. No production root cause or end-to-end success is claimed.
