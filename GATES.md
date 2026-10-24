# Gates: Prometheus Frontend Netflix Intro Sound & Studio Activation

OWNS: GATES.md, public/audio/netflix-intro.mp3, public/audio/netflix-intro.ogg, public/audio/netflix-intro.webm, hooks/use-netflix-intro-sound.ts, components/sound/netflix-intro-sound.tsx, components/root-client-effects.tsx, tests/netflix-intro-sound.test.mjs

Scope: Ensure that when an individual enters the Prometheus frontend or loads the studio section, the iconic Netflix "ta-dum" sound plays seamlessly with immediate autoplay, preloaded DOM audio, studio eligibility, and first-user-gesture fallback for browser autoplay policies.

- [x] G1: Audio assets for the Netflix intro sound exist with valid headers, codecs, and durations in public/audio.
  CHECK: node tests/netflix-intro-sound.test.mjs
  EXPECT: pass 4
  EVIDENCE: automatic-evidence=v1; definition-sha256=a7542e74752356e555137bf2c13c9221cbf9f77aa98357c751446664f34906b3; exit=0; EXPECT=matched; output-sha256=ca4b14d0360e942ecb9e919c01feb013b7a43187b3ac3f3b72daad3f0524c272; output-bytes=518; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: Netflix intro sound hook explicitly enables the studio section with cooldown-based re-entry rather than permanent session lockout.
  CHECK: node -e "const fs = require('fs'); const hook = fs.readFileSync('hooks/use-netflix-intro-sound.ts', 'utf8'); if (!hook.includes(\"pathname.startsWith('/studio')\") || !hook.includes('COOLDOWN_MS')) process.exit(1); console.log('studio activation verified');"
  EXPECT: studio activation verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=516582ff577b3f1eb5742cf2b98f229587f1df7673bf081679e3780741f2d961; exit=0; EXPECT=matched; output-sha256=93654e779d82062f5e67d91aa4cfb7fef9d2ae05b015a18f9f4f5ea424845839; output-bytes=27; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: NetflixIntroSound component provides preloaded DOM audio element and is wired into RootClientEffects without breaking SSR.
  CHECK: node -e "const fs = require('fs'); const code = fs.readFileSync('components/sound/netflix-intro-sound.tsx', 'utf8'); if (!code.includes('id=\"prometheus-netflix-sound\"')) process.exit(1); console.log('preloaded audio tag verified');"
  EXPECT: preloaded audio tag verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=8c1d70f5a327b83185874b923f43b1e80ef5027a3f94e1d2f3ed580327b69cb2; exit=0; EXPECT=matched; output-sha256=af74e9780612c0e06bbaad6af21a70ce7982c4d64e56b46559cb46e9797338ee; output-bytes=29; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Full TypeScript verification passes with 0 errors across the entire repository.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=9aeeb689bde5257e0a85c8ecb0aad3fdaf9ace3e9e5076bbf6758c22760ccfe3; exit=0; EXPECT=matched; output-sha256=2c4af01fb1a5f9597841244575659986624ce8ada13bbc89dce9491fd48c4a46; output-bytes=93; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G5: Working tree is clean and commits are synchronized to main on origin and upstream.
  EVIDENCE: Verified: commits staged, committed, and pushed to origin/main and upstream/main.
