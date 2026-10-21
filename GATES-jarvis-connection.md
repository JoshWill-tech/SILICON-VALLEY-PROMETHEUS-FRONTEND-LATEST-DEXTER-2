# Gates: Jarvis voice connection reliability

OWNS: app/api/voice-companion/session/route.ts, lib/voice-companion/gemini-live-client.ts, lib/media/feedback.ts, components/navigation/jarvis-top-nav-filament.tsx, tests/gemini-live-session-route.test.mjs, tests/jarvis-connection-errors.test.mjs, tests/jarvis-text-input-regression.test.mjs, scripts/diagnose-jarvis-connection.mts, scripts/verify-jarvis-connection-types.mjs, docs/qa/jarvis-connection-diagnosis-2026-10-21.md, GATES-jarvis-connection.md

Scope: Identify the actual Jarvis connection failure, repair model selection and actionable error reporting, and verify real audio plus regression coverage without exposing credentials.

Validation scope decision: The original whole-repository build baseline exhausted the inherited 512 MB Node heap. A retry was blocked by another active Next build (confirmed live process and build lock). Whole-repository lint/typecheck attempts ran under memory pressure with concurrent workspace validation; redundant runs were stopped. G3 now explicitly typechecks the changed production entry points and every real imported dependency with the repository compiler options, without relying on concurrently regenerated .next routes. G5 records the global-check limits and compares focused lint with unchanged HEAD. This ledger does not certify a full repository build or lint pass.

- [x] G1: Session configuration selects supported Live audio models for absent, invalid, and retired overrides.
  CHECK: node --import tsx --test --test-reporter=tap tests/gemini-live-session-route.test.mjs tests/gemini-live-model-contract.test.mjs
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=a4e82d7403696d6d2ed6d0dbc8daf9b7034c64ce416fbd8e19f77a949c687a85; exit=0; EXPECT=matched; output-sha256=7fccafa6bda12e96302d3a3720c8e86698bb19598d4a0900e85cd0ad3f305ef2; output-bytes=2285; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G2: Connection regressions preserve text delivery, recovery, and actionable errors.
  CHECK: node --import tsx --test --test-reporter=tap tests/jarvis-network-recovery.test.mjs tests/jarvis-text-input-regression.test.mjs tests/jarvis-connection-errors.test.mjs tests/jarvis-transcription-language-regression.test.mjs
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=046d2bc6e46b1e91f421aac760f8cfa39605bee0c62abd557682da82aa6e7c91; exit=0; EXPECT=matched; output-sha256=8cc722e6ab1c5b377fc4bde02081228734c2f4e454ae717a96b4641871c6ea73; output-bytes=3915; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G3: Changed Jarvis production modules and their real imported dependencies pass TypeScript checks.
  CHECK: node --max-old-space-size=4096 scripts/verify-jarvis-connection-types.mjs
  EXPECT: Jarvis connection types passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=603cd275ff2e5f3ce21b0660559186356262fc1c8090ae666e74153cc73cabb6; exit=0; EXPECT=matched; output-sha256=9f6ed3e610026b96e30f7278cd1770a4fe45b79f07f0a2585f9aaf206c95ed35; output-bytes=31; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=ca81aa2e5d24/38 entries

- [x] G4: The cause and quota conclusion are supported by sanitized provider evidence; the fixed route produces a completed audio response.
  EVIDENCE: The actual route selected models/gemini-2.0-flash-exp with two configured keys. Outside the network sandbox Gemini rejected setup with close code 1008 and "models/gemini-2.0-flash-exp is not found for API version v1beta, or is not supported for bidiGenerateContent". The repaired route selected models/gemini-3.8-live with the same keys, confirmed setup, and completed a real reply with 13 audio chunks (168960 PCM bytes). This request succeeded without replacing keys or increasing quota. Local diagnostic stubs user lookup only; it exercises the production route configuration and GeminiLiveClient against Google, not an authenticated browser/microphone session.

- [x] G5: Build, lint, and final diff are reviewed for regressions and any environment limitations are stated.
  EVIDENCE: Focused ESLint reported two react-hooks/refs violations on the existing companionRef.current and isHoveredRef.current render assignments. Linting the original HEAD component through stdin reproduced the same two violations; neither assignment is changed by this patch. Other changed files had no lint diagnostics. The full-build baseline exited 134 from the inherited 512 MB heap; a larger-heap retry was blocked by another confirmed active Next build. Repository-wide lint/typecheck were attempted and redundant runs stopped under memory pressure; G3 explicitly covers affected entry points and their real dependencies. Reviewed the scoped source diff and git diff --check: no whitespace errors, credentials, authentication changes, or unrelated production edits in this task.
