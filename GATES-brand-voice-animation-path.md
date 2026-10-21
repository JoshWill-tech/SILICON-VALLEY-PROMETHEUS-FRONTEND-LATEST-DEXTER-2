# Gates: Brand Voice-to-Text Path Animation & Dynamic Puns

OWNS: components/assets/brand-voice-path-animation.tsx, components/assets/library-collection.tsx, tests/brand-voice-animation-path.test.mjs, GATES-brand-voice-animation-path.md

Scope: Add the animated voice-to-text path animation (voice pill waveform + SVG roller-coaster text path with edge fade mask) into the brand acquisition card in the creator library collection, featuring dynamic witty pun-filled text lines.

- [x] G1: BrandVoicePathAnimation implements the roller-coaster path geometry, voice pill waveform, edge fade mask, and responsive SVG canvas.
  CHECK: node --import tsx --test tests/brand-voice-animation-path.test.mjs --test-name-pattern="geometry and waveform structure"
  EXPECT: geometry and waveform structure passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=85f102ca33f97a840c550ba88ea2ec1b826fb3f1992c626b04cdd14cdfc828df; exit=0; EXPECT=matched; output-sha256=8a5735e202caef4e3b6bdf470bcd0943293411523b21433f13598f4409625a78; output-bytes=451; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: Dynamic witty pun engine produces brand-specific witty quips with variable rotation for YouTube, social handles, and web domains.
  CHECK: node --import tsx --test tests/brand-voice-animation-path.test.mjs --test-name-pattern="dynamic witty pun engine"
  EXPECT: dynamic witty pun engine passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=99696c6584c30ee4ef24118e3805bb866595ffa7a8747d18e200ea990ac2311d; exit=0; EXPECT=matched; output-sha256=c036fd60d612640ae1d62c985133e8c71dd8d025c71c73d3597fcee203cf4726; output-bytes=451; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: LibraryCollection incorporates BrandVoicePathAnimation into the brand setup card when user inputs a URL.
  CHECK: node --import tsx --test tests/brand-voice-animation-path.test.mjs --test-name-pattern="library collection integration"
  EXPECT: library collection integration passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=0d1bd8c5800877eb9bef5aaf6fa33888e4b6826d3497a25d17e1bab34496bf7c; exit=0; EXPECT=matched; output-sha256=876c395ebc993891ed75b56f320f5a518f85c9e4dc014388e076ffb03174a63a; output-bytes=452; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Full regression test suite for brand voice path animation passes cleanly.
  CHECK: node --import tsx --test tests/brand-voice-animation-path.test.mjs
  EXPECT: all brand voice animation tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=b776c815ceacb69dc6030202c01389d1cf41b0250b1f12f9b7562e742b6da330; exit=0; EXPECT=matched; output-sha256=0834c85fa8ed87668557b26e232a87ac0dfe7a3bb2484bf7145dcca87a95c7c2; output-bytes=452; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
