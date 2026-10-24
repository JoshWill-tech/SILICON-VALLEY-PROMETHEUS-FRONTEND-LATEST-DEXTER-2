# Gates: chronos-tactile-optical-scrubber-replacement

OWNS: components/editor/TimelinePanel.tsx, scripts/verify-chronos-scrubber.mjs, GATES.md

Scope: Replace the redundant video scrubber bar in TimelinePanel with the Chronos Tactile Optical Scrubber (Image 2 parity, canvas optical ruler, sub-bass swell oscillator, bandpass-filtered brown noise friction, metallic detent clicks, vignette blending, format toggles with "1277" counter, velocity telemetry, and preservation of all autonomous editor test hooks).

- [x] G1: Component architecture & export verification
  CHECK: node scripts/verify-chronos-scrubber.mjs G1
  EXPECT: G1: component architecture & export verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=1ce186c7cb039d277872194291facd63966d7528aded18911d244140b52b0e69; exit=0; EXPECT=matched; output-sha256=39dc8e6eb595447b586a947455cdc53cd6c5a9e62b903c048291ddbf8a8fca19; output-bytes=56; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: Optical ruler canvas & reference geometry
  CHECK: node scripts/verify-chronos-scrubber.mjs G2
  EXPECT: G2: optical ruler canvas & reference geometry passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=2f55045f377c4b2eee7041525e16f78586c4437be5e9d61b1a66a9fafb901246; exit=0; EXPECT=matched; output-sha256=4187ef3a96be6098792c094a6b6e8d291a234b83570b51d41cba664329fcfc20; output-bytes=53; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Procedural luxury sound engine with sub-bass and reel friction
  CHECK: node scripts/verify-chronos-scrubber.mjs G3
  EXPECT: G3: procedural luxury sound engine with sub-bass and reel friction passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=b44dbf532a5d686af1b04a2c9f436697ea70d82b45e6926f4f1a9c56bc47badc; exit=0; EXPECT=matched; output-sha256=9bab752bd96f590770ebbce69fd6f6759a7e032fd0ac0adb2bf2a79dd302fd00; output-bytes=74; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Vintage vignette and film grain blending
  CHECK: node scripts/verify-chronos-scrubber.mjs G4
  EXPECT: G4: vintage vignette and film grain blending passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=28d965c51174ce596b7a83a14965d83ac9e98f8586dafdbfd353331f32e36661; exit=0; EXPECT=matched; output-sha256=87093386be307980e096b85dba63f70032c0f6d499495319f4628badace038f2; output-bytes=52; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G5: Interactive transport, telemetry and snapping
  CHECK: node scripts/verify-chronos-scrubber.mjs G5
  EXPECT: G5: interactive transport, telemetry and snapping passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=6eb4d5131dd35bc23c326635b8731b05125f6edb321e477b6e880df968a9432a; exit=0; EXPECT=matched; output-sha256=7b7d3a2cd06443fbafa8457249b83533dff53efce9ffcab886a69dad78ee65d5; output-bytes=57; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G6: Autonomous test target attributes preservation
  CHECK: node scripts/verify-chronos-scrubber.mjs G6
  EXPECT: G6: autonomous test target attributes preserved
  EVIDENCE: automatic-evidence=v1; definition-sha256=ca7a07881fa820bfafdfab03d94c4b5b195beb1d60722373663faa0664fc0da1; exit=0; EXPECT=matched; output-sha256=462150b6d1348d54f2e886e65abdc68ecdccc45a1b4fdff0999e74df5ee2c832; output-bytes=48; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G7: Full test suite verification
  CHECK: node scripts/verify-chronos-scrubber.mjs --all
  EXPECT: all chronos scrubber verification checks passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=e0317c293b8226c8bf8cb14065f7d0f1cf8ae87537a194a832f6145dcc83f4ce; exit=0; EXPECT=matched; output-sha256=148cb2e765b9ae3af38563d554c704d0a8a72b252a3cdc634ce8700a202a1221; output-bytes=388; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
