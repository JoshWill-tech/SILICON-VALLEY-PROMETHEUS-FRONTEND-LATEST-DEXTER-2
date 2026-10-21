# Gates: OpenCut Timeline Functionality, Interactivity & Jarvis Routing

OWNS: components/editor/editorial-timeline-viewport.tsx, components/editor/editorial-timeline-tracks.tsx, components/editor/editorial-timeline-toolbar.tsx, hooks/use-timeline-tools.ts, lib/editor/timeline-tools.ts, lib/voice-companion/bridge.ts, lib/voice-companion/gemini-live-client.ts, hooks/use-voice-companion.ts, tests/opencut-timeline-interaction.test.ts, GATES.md

Scope: Restore and map full OpenCut-grade timeline interactivity (interactive ruler scrubbing, clip trimming, moving, splitting, deletion, track controls) and wire complete Jarvis autonomous access.

- [x] G1: Interactive ruler and track seeking routes playhead scrub and click-to-seek without container capture blocking.
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts --test-name-pattern="ruler and playhead scrubbing"
  EXPECT: ruler and playhead scrubbing passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=35b3adb1e0368c9748a853feda85e3d856b0b4b0c2ea7ecfd2727ee27894e9a9; exit=0; EXPECT=matched; output-sha256=ad047df749170a486d0fd184ffd8e43a9a919b1a67ffb3f8479c236c1c7ed001; output-bytes=770; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: Video clips support full NLE interactivity: clip selection, left and right trim handles, horizontal dragging, splitting, and deletion.
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts --test-name-pattern="clip manipulation"
  EXPECT: clip manipulation passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=d229f1b6c51e29a56a726f26ef28ac34446b534f1ce3a4744a6bd3455bcc757e; exit=0; EXPECT=matched; output-sha256=17eab918b9c797d2e9488ff128725c0d380cb70c616a7e56f70b54861874a1fc; output-bytes=767; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Multi-track header routing provides functional visibility, mute, and track actions for Video, Captions, Text, and Music.
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts --test-name-pattern="multi-track controls"
  EXPECT: multi-track controls passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=93a95e9c53e85d0d8e14b397d0dbf068c145e8f60e1e2103d8728ba662840a58; exit=0; EXPECT=matched; output-sha256=62711c9269b04cbf8a18e4dd400a7dd9b10a8eb1a2a6b5419665b6da33bd34d6; output-bytes=767; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Jarvis voice companion bridge has complete routed access to timeline state and manipulation tools (inspect, seek, split, trim, move, delete, track mute/visibility).
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts --test-name-pattern="jarvis timeline bridge"
  EXPECT: jarvis timeline bridge passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=45fe27be80d82df49cd7e7528a8dc2caf55bd035aecceb6ba664599debff9d97; exit=0; EXPECT=matched; output-sha256=907d408ff2318e8a237dfa8b4d91ecb80383af585dcaeb0a91130314f0ff05fe; output-bytes=768; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G5: Entire timeline interaction and Jarvis routing test suite passes cleanly with zero regressions.
  CHECK: node --import tsx --test tests/opencut-timeline-interaction.test.ts
  EXPECT: all opencut timeline tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=89a43f13773d8ec505ed3aa9b3a60d15f0cc3803d594eadee1ed6d063dec28e0; exit=0; EXPECT=matched; output-sha256=ad462064e02a344c7f9ce3248d62290c2910aabb42695df81b25199588ab550a; output-bytes=770; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
