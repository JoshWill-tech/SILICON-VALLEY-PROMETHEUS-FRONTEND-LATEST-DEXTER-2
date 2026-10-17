# Thumbnail generation repair

The route now bounds optional planning, provider work, and the complete request. Local execution reproduced the previous hangs and misleading responses before these changes. This is a code repair; a successful production generation is not claimed.

## Confirmed defects and repairs

1. Both Gemini art-direction calls had no deadline or cancellation signal. A stalled planner prevented the image request and could consume the entire serverless invocation. Each optional call now has a 20-second limit, observes cancellation, and falls back to the existing structured art direction when unavailable.
2. Cancellation during planning did not settle the route. A request-wide abort guard now settles the response and prevents a subsequent paid image request after cancellation.
3. A response-body timeout was swallowed by `.json().catch(() => null)` and reported as a missing image with HTTP 502. Provider fetch and body reading now have an abort guard, and timeout responses are JSON 504.
4. A transport that ignored its abort signal could hang until the platform intervened. The explicit guard settles independently of transport cooperation. The complete request has a 270-second deadline, before the 285-second browser timeout and 300-second function limit. The image provider retains its 240-second budget.
5. Every provider rate limit was translated to HTTP 502. Temporary limits now retain HTTP 429. A Gemini response explicitly reporting a zero quota limit returns JSON 503 explaining that billing/image access or a dedicated image provider must be configured.

The first three failing route tests passed after the initial repair. Three further tests reproduced the zero-quota response, rate-limit status conversion, and an abort-ignoring provider before the additional fixes. The route tests replace session lookup and outbound HTTP; prompt construction, SDK behavior, routing, multipart transport and Sharp conversion execute real application code. Synthetic generated-image fixtures verify decodable WebP output; they do not establish live provider success.

## Hypotheses tested

| Hypothesis | Evidence and outcome |
| --- | --- |
| Thumbnail route is absent or frontend calls a different path | The frontend posts to the existing project thumbnail route; route-level tests execute that handler. This does not establish a remote deployment's routing. |
| No image key is configured | Missing Gemini and dedicated image credentials return JSON 503 without any provider call. Locally, Gemini is configured but the dedicated image key is absent. |
| Configured model names or API version are unsupported | Read-only Google model checks returned HTTP 200 and `generateContent` support for the configured fast, pro and legacy models on both v1 and v1beta. No model/version change was warranted. |
| Gemini credential has usable image quota | A real fast-model request with a synthetic blue source returned HTTP 429 RESOURCE_EXHAUSTED, with `generate_content_free_tier_requests` limit 0. Metadata access does not prove image quota. |
| Another configured credential can provide images | Two distinct raw Gemini values exist, but only one matches the existing resolver's accepted format. No dedicated image credential exists. The configured OpenAI-compatible endpoint is AWS Bedrock; its documented models endpoint returned 401 using the saved credential. No chat key was routed to an unrelated image host. |
| Provider HTML becomes app HTML | A mocked provider HTML 502 is converted to app JSON 502 by the real route. This does not explain a platform-generated HTML page by itself. |
| Optional planning can hang or ignore cancellation | Reproduced before repair; bounded fallback and cancellation now pass runtime tests. |
| Provider body/transport can hang after response headers | Reproduced body misclassification and uncooperative transport; guards now enforce the deadline. |
| Oversized images are necessary to explain the failure | Existing payload-budget and real Sharp output-compaction tests pass. No size-limit or compression change was made. |

Google's [image-generation documentation](https://ai.google.dev/gemini-api/docs/generate-content/image-generation) and the live model metadata were used to check model/API compatibility. AWS [documents the configured Bedrock Mantle endpoint](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-mantle.html). The first alternate-provider probe was rejected by automatic approval review because its destination had not been verified. A narrowed probe was approved after checking the exact configured hostname against AWS documentation and adding a hostname allowlist; it returned 401. No credential values were printed or written into the probes.

## Validation and remaining work

Acceptance results and exact commands are in `GATES-thumbnail-gateway-repair.md`. The final direct focused suite passed 43 tests with 0 failures. Full TypeScript checking passed. Final acceptance-runner and production build results are recorded in the ledger after verification.

The repository-wide lint baseline returned 5 errors and 77 warnings. Errors are in `components/editor/LiquidCarveButton.tsx`, `components/mini-run/mini-run-comparison.tsx`, `tests/editorial-split-persistence.test.ts`, `tests/jarvis-mp4-session.test.mjs`, and `tests/safe-response-and-sanitizer.test.mjs`. They are outside this repair. Changed thumbnail files receive a separate lint check.

Normal build attempts encountered the existing Next build lock in the shared checkout. No competing build was stopped and no shared lock was removed. Only this task's verified acceptance runner was stopped before restarting verification with an isolated project build. `scripts/verify-thumbnail-build.mjs` creates a separate staging directory, links source and dependencies, keeps environment values in process memory, and runs the normal production build with its pre/post checks and production auth bypass disabled. Build results are recorded in the ledger.

The confirmed account-level blocker is zero image-generation quota for the selected local Gemini credential. Enable billing and image-generation access for that project, or supply the existing dedicated `THUMBNAIL_IMAGE_API_KEY` configuration with a credential that has image access. No working secret can be synthesized in code. No credentials, provider versions, dependencies, billing settings, auth logic or production deployment were changed.

Matching production logs and a live production generation remain unverified. The local quota result does not prove the deployed environment has the same credentials or that it caused the exact original HTML 502. The code repair addresses reproducible paths that could stall before returning JSON, and the quota response now identifies its own concrete configuration failure.
