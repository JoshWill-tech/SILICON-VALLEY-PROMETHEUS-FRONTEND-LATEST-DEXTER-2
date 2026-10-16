# Gates: review feedback latency

OWNS: components/editor/video-review-annotations.tsx, lib/editor/video-review-annotations.ts, tests/video-review-annotations.test.ts, tests/video-review-annotations.browser.mjs

Scope: Keep two-video comparison review input responsive while preserving annotation behavior.

- [x] G1: review exports retain frame identity, timestamps, annotations, and image bytes
  CHECK: node --import tsx --test tests/video-review-annotations.test.ts
  EXPECT: review timestamps retain milliseconds and hours
  EVIDENCE: automatic-evidence=v1; definition-sha256=2430f6cfc0d8a0caf3ab9d36d266bd515e562ec237f2a76803001905383c6bdb; exit=0; EXPECT=matched; output-sha256=6db5cc0775cf8bfcbbec6842066a26e4c33ecf706b6e4d2312d33f97ba9613cc; output-bytes=823; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=a9242a33444c/38 entries

- [x] G2: a dense freehand stroke avoids per-pointer SVG updates and saves successfully
  CHECK: node tests/video-review-annotations.browser.mjs
  EXPECT: PASS: optional drawing editor
  EVIDENCE: automatic-evidence=v1; definition-sha256=15b79677d644f8b034dec871fe6462fa933662f76e1bd3dea3936a848633ea3d; exit=0; EXPECT=matched; output-sha256=6417ba390274a11c0f2a0c2ccbe133cf46163249c1cbb052521c188fd8971507; output-bytes=160; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=a9242a33444c/38 entries
