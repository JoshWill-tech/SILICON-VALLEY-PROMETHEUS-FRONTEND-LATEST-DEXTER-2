# Jarvis voice connection diagnosis — 21 October 2026

The supplied screenshot shows a queued user message followed by “Voice could not connect.” The connection notice is generic, and the latest transcript hides the separate error message in the expanded filament.

## Reproduction and cause

The production session route defaulted to `models/gemini-2.0-flash-exp`. It also accepted `models/gemini-2.0-flash-live-001`, another retired model. Its fallback was derived from `GEMINI_LIVE_MODEL` itself, so invalid or whitespace environment overrides bypassed validation.

The route regression suite failed eight checks before the fix, including the existing source contract and runtime cases for absent, retired, invalid, and whitespace overrides. The UI regression reproduced a queued message hiding the provider failure. Six error/UI checks failed before the fix.

`scripts/diagnose-jarvis-connection.mts` executes the actual route configuration with a local user-lookup stub, then uses the production `GeminiLiveClient` against Google. It never prints keys or socket URLs. The initial sandboxed socket could not connect. Outside the sandbox, Google rejected the configured model with close code `1008`:

> models/gemini-2.0-flash-exp is not found for API version v1beta, or is not supported for bidiGenerateContent.

This is a model availability error, not a quota-exhaustion response. Google documents the model shutdowns and current Live replacements in its [deprecation list](https://ai.google.dev/gemini-api/docs/deprecations/).

## Fix

- Use `models/gemini-3.8-live` as the server and direct-client default. Keep the fallback independent of environment overrides.
- Remove retired models from the supported set; normalize supported overrides and use the current default for other values.
- Keep the actual connection failure visible beside a queued/latest user message.
- Distinguish explicit quota/rate-limit failures, unavailable models, invalid credentials, microphone problems, and generic transport failures. A transport failure alone never diagnoses token exhaustion.

Authentication checks, credentials, tool schemas, queued messages, and audio processing remain on their existing paths.

## Live evidence

With the repaired route and the same two configured keys, the diagnostic selected `models/gemini-3.8-live`, received setup confirmation, and completed a spoken reply: **13 audio chunks, 168,960 PCM bytes**. No key replacement, quota increase, or billing change was needed. This establishes available capacity for that request, not the account's remaining monthly usage.

The diagnostic tests a text-input/native-audio-output turn against the real provider. It does not establish browser microphone permissions or deploy the code. Browser rendering/error visibility is covered by the actual component/hook regression test using JSDOM.

Run locally with environment files loaded, without printing their contents:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
node --env-file=.env --env-file=.env.local --import tsx scripts/diagnose-jarvis-connection.mts
```

The initial production-build baseline failed with Node's inherited 512 MB heap limit, before these edits. Final checks and their outcomes are recorded in `GATES-jarvis-connection.md` and the `audit-artifacts/jarvis-connection-*` logs.

The focused model/error/UI run passed all 19 checks. Focused lint reported only two pre-existing `react-hooks/refs` violations on the filament's existing render-time ref assignments; linting the original HEAD component reproduced both. A larger-heap build retry encountered a confirmed other active Next build. Global lint/typecheck attempts suffered memory pressure and duplicate runs were stopped. Final TypeScript verification explicitly checks the changed Jarvis entry points and all their real imported dependencies using the repository compiler options, independent of concurrently regenerated Next route artifacts. This is not a full-repository build/lint certificate.
