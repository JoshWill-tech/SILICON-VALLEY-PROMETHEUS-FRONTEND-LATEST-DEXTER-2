# Production deployment investigation — October 17, 2026

Investigated the reported missing Jarvis motion and slow export interaction. No application code was changed, reverted, committed, pushed, or deployed. Existing unfinished work was left untouched.

## Deployment and attribution

GitHub's current main commit is [7fd5c7b](https://github.com/joshwilsonwill-boop/SILICON-VALLEY-PROMETHEUS-FRONTEND-LATEST-DEXTER/commit/7fd5c7b50f84194b55927ae627e54377cc177f94), authored and committed by Temiloluwa Oladapo at 2026-10-17 03:37:53 UTC (04:37 Casablanca). Its author email identifier matches the supplied davidladz identifier. GitHub returned no linked author login; this does not establish who performed the push.

Its parent is 368ce212985acc219d594e24f8ee969aaea03e9c. Exactly four files changed:

- components/auth/LoginForm.tsx
- components/auth/animated-auth-characters.tsx
- tests/login-password-privacy.browser.mjs
- tests/signup-auth-characters-regression.test.mjs

The change makes login characters look away while the password visibility toggle is on, including when reduced motion is enabled. It removes periodic peeking and adds regression coverage. It does not change Jarvis, the editor, exports, dependency versions, or deployment configuration.

The successful GitHub Vercel status for this commit links to [deployment 3zbbgMbNUxPUBiiXAg1q4mWWcCN3](https://vercel.com/joshwilsonwill-7779s-projects/silicon-valley-prometheus-frontend-latest-dexter/3zbbgMbNUxPUBiiXAg1q4mWWcCN3). Its ID matches the deployment in the supplied runtime logs. This establishes the association; it does not compare environment variables or prove which version the browser had loaded.

## Confirmed: repeated unsuccessful source-analysis polling

The attached sample contains 100 request rows between 07:08:13.63 and 07:10:46.14 on October 17. The log UI timezone was not supplied.

- 54 requests to /api/projects/[project]/source-analysis returned 404.
- 8 export history requests returned 200.
- 3 latest-export requests returned 200.
- 4 export-readiness requests returned 200.

The route filter's 481 source-analysis count describes the broader selected window, not 481 confirmed 404s. The pasted “Error 2” badge includes no actual exception details or stack traces.

In app/editor/[id]/page.tsx, the source-analysis effect starts a request immediately and polls every 2,500 ms. An unsuccessful response executes “if (!response.ok) return” without stopping the timer, backing off, or checking page visibility. Slow requests can overlap because the interval has no in-flight guard.

The API route exists. Its ownedIngestion helper returns a JSON 404 when no source_ingestions row is found for the authenticated user and project. That is a plausible explanation for this project's 404s; the supplied logs do not include response bodies, so the exact server-side reason remains unconfirmed.

Git blame attributes the polling and unsuccessful-response behavior to 6cbdf6e3, August 11, authored by peterstanley922-cmd. This behavior predates the October 17 commit.

The isolated probe executed the actual committed effect against simulated 404 responses and timers. Result: six requests across five simulated 2.5-second ticks, with polling still scheduled; unmount cleanup stopped it. This confirms the retry behavior, not its contribution to perceived production lag.

## Confirmed: Jarvis is intentionally static while idle

components/navigation/jarvis-top-nav-filament.tsx only schedules animation when reduced motion is off AND Jarvis is active or hovered. Otherwise it sets both paths to a flat “M 0 16 L 200 16”.

The probe executed the actual committed animation effect:

| State | Frames scheduled at setup |
| --- | ---: |
| Disconnected, no hover, normal motion | 0; flat line |
| Disconnected, hovered, normal motion | 1 |
| Listening, normal motion | 1 |
| Listening, reduced motion | 0; flat line |

[14bcdad](https://github.com/joshwilsonwill-boop/SILICON-VALLEY-PROMETHEUS-FRONTEND-LATEST-DEXTER/commit/14bcdadc9c63b11b004543f39d564c7690a3e451), October 9, authored by peterstanley922-cmd, introduced this idle stop and frame throttling. It also deferred loading the global filament. The deferred hook becomes ready on pointer/key interaction or an idle callback with a 1,200 ms timeout, with a 600 ms fallback.

This explains a visible line that no longer moves while idle. It does not explain a completely absent icon, or failure to animate during an active session. Those require live DOM, bundle-loading, and console evidence.

## Export contact points

ExportDrawer opens through shared showExport state. The inspected click handler sets that state immediately; export readiness is fetched afterward. A successful HTTP response does not establish a fast response time, correct readiness payload, successful render, or responsive dialog.

Relevant independent refresh paths:

| Location | Behavior |
| --- | --- |
| hooks/use-project-export-readiness.ts | Requests /exports when the drawer is open; Start remains disabled until readiness allows submission |
| app/editor/[id]/page.tsx | Polls /exports/latest every 2.5 seconds while rendering and 10 seconds otherwise, while visible |
| components/editor/editorial-delivery-studio.tsx | Polls /exports/history every 5 seconds while visible |
| lib/editor/editorial-timeline-client.ts | Refreshes /editorial-timeline every 5 seconds while visible |
| app/editor/[id]/page.tsx | Separately polls source analysis every 2.5 seconds and transcripts every 3 seconds under their respective conditions |

Latest-export cadence changed in 9efa7baa on October 15. Export-history polling dates to a4a1e9b1 on October 5. Neither was introduced by the recent Temi commit.

An additional diagnostic contact point is 01a90377 (October 15): the global anti-tamper component suppresses console log/info/debug/table and can periodically clear console output based on window-size heuristics. It does not neutralize console.error. No causal link to the reported lag or missing icon was established.

## Validation and limitations

Run from the repository root:

node audit-artifacts/deployment-2026-10-17-probe.mjs

The probe reads committed code through git show HEAD, excluding unfinished source edits. It performs no network requests and simulates timers; it is not a production browser benchmark.

Production browser creation failed twice because the webview did not attach. No signed-in editor session, export click timing, frame profile, missing-icon DOM state, or failed chunk response could be inspected. Vercel CLI inspection with the deployment's scope reported that the scope does not exist for the configured access; A second attempt under the configured default Vercel context could not find the deployment either. GitHub's Vercel status remains the deployment evidence. Local main history was stale, so remote commit metadata came from GitHub directly.

## Recommended next work

A wholesale revert of 7fd5c7b is not supported by the evidence and would leave the confirmed older behaviors unchanged.

1. Address missing-job source-analysis polling deliberately: distinguish terminal missing data from transient failures, avoid overlapping requests, and suspend background work when hidden. Confirm the 404 response body and ingestion lifecycle before choosing whether to stop or retry.
2. Confirm whether Jarvis is absent or simply static. If static idle motion is the complaint, decide whether idle animation should be restored while respecting reduced motion.
3. Profile the actual export click and inspect readiness response timing/payload. Use the polling paths above as investigation points; no measured cause of the perceived lag has yet been established.
4. If the symptom began with this deployment, compare its loaded chunks and environment with the prior deployment. The small commit diff alone cannot rule out deployment or cached-client effects.
