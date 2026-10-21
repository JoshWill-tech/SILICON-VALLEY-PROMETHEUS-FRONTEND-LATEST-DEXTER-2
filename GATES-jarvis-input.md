# Gates: Jarvis text input delivery

OWNS: components/navigation/jarvis-top-nav-filament.tsx, hooks/use-voice-companion.ts, tests/jarvis-text-input-regression.test.mjs, tests/jarvis-network-recovery.test.mjs, GATES-jarvis-input.md

Scope: Reproduce the reported unavailable or dropped Jarvis text input, identify the responsible gate, fix the confirmed cause, and verify the disconnected and connected send paths.

- [ ] G1: The disconnected user can see the Jarvis text input, and a first message is delivered after live setup.
  CHECK: node --import tsx --test --test-reporter=tap tests/jarvis-text-input-regression.test.mjs tests/jarvis-network-recovery.test.mjs
  EXPECT: # fail 0
  EVIDENCE: pending

- [ ] G2: Type checking accepts the integrated changes.
  CHECK: npm.cmd run typecheck
  EXPECT: typecheck passed
  EVIDENCE: pending

- [x] G3: The disconnected/error and in-progress send failure is reproduced before the fix; the post-fix component keeps and reports the message.
  EVIDENCE: Before the fix, the real component test reached status=error and failed because `Type an instruction to Jarvis` was absent. A connecting-state submission also cleared the text while the hook returned early. After the fix, the same real component/hook fixture passes and retains the instruction with a connection status notice.

- [x] G4: Root cause and environment limits are documented from observed behavior and code tracing.
  EVIDENCE: Confirmed in `components/navigation/jarvis-top-nav-filament.tsx` (`isActive` gated the form) and `hooks/use-voice-companion.ts` (disconnected `client.isConnected()` early return; connection setup is asynchronous). `GeminiLiveClient.isConnected()` requires an OPEN socket and completed setup. The component-level reproduction uses the real component and hook; the full Next route could not render because Google Fonts network requests are denied in this environment. Gate-check approval records could not be written (`EPERM`) outside the writable roots, so G1/G2 automatic ledger evidence remains pending even though both commands passed directly.
