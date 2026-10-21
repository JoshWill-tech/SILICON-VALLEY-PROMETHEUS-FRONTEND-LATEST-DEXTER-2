# Gates: Jarvis Chat Dispatch Animation & Task Dynamic Narrative

OWNS: components/loading-animation/jarvis-dispatch-animation.tsx, components/loading-animation/cinematic-skeletal-loader.tsx, components/editor/prometheus-chat-loading-skeleton.tsx, lib/prometheus-assistant/task-animation-narrative.ts, tests/jarvis-dispatch-animation.test.tsx, tests/prometheus-chat-response-ui.test.tsx, GATES.md

Scope: Replace the screen-recorded video in the chat loading skeleton with an authentic, high-performance SVG/React flowing ribbon animation, audio waveform pill, and contextual dispatch card with dynamic strings unique to the task.

- [x] G1: Native animated dispatch component renders looping ribbon textPath, audio waveform pill, and status card with zero video elements.
  CHECK: node --import tsx --test --test-name-pattern="^renders native animation without video element$" tests/jarvis-dispatch-animation.test.tsx
  EXPECT: pass 1
  EVIDENCE: automatic-evidence=v1; definition-sha256=5616b80ca5deeec49cd83bc84b36c48eeef374ad2281a6635c6f48ba4c0ccae8; exit=0; EXPECT=matched; output-sha256=71bf53e03678ce906f20e401b4fae43de6d66300cfca2eda8496524940a8fc6d; output-bytes=232; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: Task narrative synthesizer produces contextual, unique flowing text and status cards for distinct tasks (hooks, captions, cuts, color, audio, general).
  CHECK: node --import tsx --test --test-name-pattern="^synthesizes task-unique narrative$" tests/jarvis-dispatch-animation.test.tsx
  EXPECT: pass 1
  EVIDENCE: automatic-evidence=v1; definition-sha256=85abaa5085cc2f54f3b77d6a3eb72926a8b0d769b2ee86a2c5c1e1a48fed72bf; exit=0; EXPECT=matched; output-sha256=23c6d88055b8f7706cbb0e39653d5fb08331b043a60774452bb457d5e4794332; output-bytes=205; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Prometheus chat loading skeleton integrates the native dispatch animation with semantic status role and reduced-motion support.
  CHECK: node --import tsx --test --test-name-pattern="^chat skeleton exposes semantic status and reduced motion$" tests/jarvis-dispatch-animation.test.tsx
  EXPECT: pass 1
  EVIDENCE: automatic-evidence=v1; definition-sha256=771637a220d22d281a5b92385cbb59126e353ad9c38f5ff76690f33d74804a05; exit=0; EXPECT=matched; output-sha256=bf53b51586bde72191fb5d5831b2cdce13dbcc389d6baa5100cc553d5f528319; output-bytes=252; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Full suite including prometheus chat response UI tests passes cleanly with zero failures.
  CHECK: node --import tsx --test tests/jarvis-dispatch-animation.test.tsx tests/prometheus-chat-response-ui.test.tsx
  EXPECT: pass 7
  EVIDENCE: automatic-evidence=v1; definition-sha256=5bd5e5adb8194d830fc2e0bd05011ca34f7bf9d22cbd9c4ebe907e7333fb57e7; exit=0; EXPECT=matched; output-sha256=3b0e66a531fbefd1a3de27e579aaf5af4abc55591dcc8a6a684f5c27e45ea6a9; output-bytes=768; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
