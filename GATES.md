# Gates: Motion Workspace Video Playback & Jarvis Voice Coordination

OWNS: GATES.md, lib/voice-companion/bridge.ts, hooks/use-voice-companion.ts, app/editor/[id]/page.tsx, tests/motion-playback-jarvis-coordination.test.ts

Scope: Prevent autonomous video playback when navigating to or remounting Motion workspace, preserve paused state across tab switches, and coordinate voice interaction with video playback so Jarvis and the video never clobber each other.

- [x] G1: lib/voice-companion/bridge.ts exposes jarvisVoiceState and interaction predicates (isVoiceInteractionActive, isVoiceActivelyListening, isVoiceSpeaking) and preserves voice state across unregistrations.
  CHECK: node --import tsx --test --test-name-pattern="G1" tests/motion-playback-jarvis-coordination.test.ts
  EXPECT: jarvis voice state and predicates verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=6604c009fc31b208461119f0ac609f47ceed607b9f4ef9395ce27125c355d1e1; exit=0; EXPECT=matched; output-sha256=6787d8ab670e4eb38d406fcc02fd7563c78504a6bda6d957a1bf003775628477; output-bytes=234; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: hooks/use-voice-companion.ts reports live voice companion status to the bridge and dispatches onPause when Jarvis begins speaking or when speech onset is detected.
  CHECK: node --import tsx --test --test-name-pattern="G2" tests/motion-playback-jarvis-coordination.test.ts
  EXPECT: use voice companion pause dispatch verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=a62b90a1beba65674c4d3b79fb91ea22c1ce603d30adf559d3216a7c8c2eeb43; exit=0; EXPECT=matched; output-sha256=4923724b456b789e168ff1c0a19cca342348ae1596639d9af5ca1f8336b77791; output-bytes=249; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: app/editor/[id]/page.tsx handlePreviewVideoReady respects playback intent and prevents autonomous playback when paused or when voice interaction is active.
  CHECK: node --import tsx --test --test-name-pattern="G3" tests/motion-playback-jarvis-coordination.test.ts
  EXPECT: preview video ready intent check verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=cd3fd7fc9870cdb8f343c6aeb90dd9eee1193cedcf21caa867c68123f465bbfd; exit=0; EXPECT=matched; output-sha256=3a57af1df51dd426878c0709b759e519c2cefee8176abe6887401f3a8875c84b; output-bytes=254; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: app/editor/[id]/page.tsx automatically pauses playback when Jarvis or chat voice begins speaking or listening and maintains paused state when switching between workspace tabs.
  CHECK: node --import tsx --test --test-name-pattern="G4" tests/motion-playback-jarvis-coordination.test.ts
  EXPECT: workspace tab switch and jarvis speech pause verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=fe3e1b673ca606ef58bde566c03824ac022fc7cb76cc1f4573fb7e7da6bacaf1; exit=0; EXPECT=matched; output-sha256=82d43cdee9f8919d0c81185bcd1e0240025b2779354b4989c76e72fb47fb0747; output-bytes=259; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G5: Comprehensive regression suite passes validating Motion workspace maintains paused state across tab navigation and prevents voice clobbering.
  CHECK: node --import tsx --test tests/motion-playback-jarvis-coordination.test.ts
  EXPECT: all motion playback and jarvis coordination tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=d853371091580ee96efc486ec0db69eaae33546545b83848a0296b62dc3a171c; exit=0; EXPECT=matched; output-sha256=d2bd18972d4bc9704a8b7b08d3f9a647d51f604fab8a5975cc5f1ee24396d3c2; output-bytes=792; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G6: TypeScript typecheck passes with zero errors across the modified files.
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=b1f4bb997a1386556f4e4d5acc883d881fd44a425b32e4d71925cb4bab048fd0; exit=0; EXPECT=matched; output-sha256=88603ae6d0804b467cf0223e64644258397c61d0119a5876e07565cc5b2dd279; output-bytes=17; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
