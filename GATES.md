# Gates: prometheus-editorial-chat-break-fixes

OWNS: components/editor/PrometheusChat.tsx, app/editor/[id]/page.tsx, lib/editor/editorial-run.ts, lib/editor-handlers.ts, lib/prometheus-assistant/chat-intent.ts, lib/prometheus-assistant/project-context.ts, app/api/prometheus-chat/stream/route.ts, app/api/prometheus-chat/route.ts, hooks/use-ai-chat.ts, scripts/verify-chat-break-fixes.mjs, GATES.md

Scope: Implement corrective fixtures for Prometheus Editorial Chat Break Report: prevent workspace switching during active chat, eliminate duplicate replies and false intent triggers, persist split-view state, reject unsourced live weather/flight inquiries, disclose pending analysis without ungrounded arithmetic quarter-splits, clarify in-chat capability boundaries ("Expand editorial plan"), enforce valid workspace tab taxonomy, scrub raw project UUIDs from responses, and treat emoji-only inputs neutrally.

- [x] G1: Workspace lock & no autonomous edit hijacking
  CHECK: node scripts/verify-chat-break-fixes.mjs G1
  EXPECT: G1: workspace lock & no autonomous edit hijacking passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=29a77087e113f85b38dc57a152a675f8cf660ac908894d8300ee89e3b35ed8ed; exit=0; EXPECT=matched; output-sha256=e27124e8032e7ae87b309e7c4bf9f8c75ba69519a8a38ffd46cb1219e245af3d; output-bytes=57; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: No blind auto-apply or tab switching on action drafts
  CHECK: node scripts/verify-chat-break-fixes.mjs G2
  EXPECT: G2: no blind auto-apply or tab switching on action drafts passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=16292e6bbfa497c7d48315cc2eee6bc9f982b452b1e396b0f179eb9ff6c079f6; exit=0; EXPECT=matched; output-sha256=0e59e9817793136c4bd9aa129c65a5d06cb88db22a2b452e67af7bdcb8406184; output-bytes=65; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Strict edit intent routing without bare word triggers
  CHECK: node scripts/verify-chat-break-fixes.mjs G3
  EXPECT: G3: strict edit intent routing passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=1679ee62b0314b88d69f123a1efa97fc63dba14e5993391ce10c15172133f3c4; exit=0; EXPECT=matched; output-sha256=b4d5d74a65c997e45a94abe0988d055326dcbd9384c99a353cfc268d91a18f3e; output-bytes=38; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Grounding and no live weather or flight booking hallucination
  CHECK: node scripts/verify-chat-break-fixes.mjs G4
  EXPECT: G4: grounding and no live weather/booking hallucination rule passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=8e7df036ad2d1c009970dbfa273d3e7388c6c60dc4767f84b0d558dc701596d8; exit=0; EXPECT=matched; output-sha256=ff65b7949623f8993c36c2cf75a60aff8cdbb3f42962e5766a824bf4e44a877a; output-bytes=68; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G5: Analysis pending disclosure and anti-arithmetic split rule
  CHECK: node scripts/verify-chat-break-fixes.mjs G5
  EXPECT: G5: analysis pending disclosure and anti-arithmetic split rule passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=6e6df25c9a693b4f8491db0de5c3f831977108203046a43fde312b3aed09a2d8; exit=0; EXPECT=matched; output-sha256=2f7b88cb4e08d377e4f304da35074533f00d93a9612444555511723231c09ed2; output-bytes=70; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G6: Chat in-feed capability boundary and action label clarity
  CHECK: node scripts/verify-chat-break-fixes.mjs G6
  EXPECT: G6: chat in-feed capability boundary rule passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=84b87950034b353bafd114c72f9f1da400adf66753587a1c4003efb81ccede07; exit=0; EXPECT=matched; output-sha256=7b7831bb501962b9baddf5c0fb958329682fcab26c12e15fbbac13b64fb03972; output-bytes=49; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G7: Workspace taxonomy and ID leak protection
  CHECK: node scripts/verify-chat-break-fixes.mjs G7
  EXPECT: G7: workspace taxonomy and ID leak protection passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=f15eebbb5892d168e83890f128822c995a358d7ccf8fb42e73aa340dad533207; exit=0; EXPECT=matched; output-sha256=c3baa406a0ab4ca145225c160989fac2c64c84d2ee93953e241756d84421e649; output-bytes=53; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G8: Emoji neutrality and literal instruction discipline
  CHECK: node scripts/verify-chat-break-fixes.mjs G8
  EXPECT: G8: emoji and literal instruction discipline passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=0f92b92383e0b9937ce57845ab994a010e772f05cd4462e8ce794b870abc563f; exit=0; EXPECT=matched; output-sha256=d1979aa44330fdf3605c815d4b1bb44200c7c1c50d9c084e733fbb794a6091f9; output-bytes=52; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G9: Source video split-view persistence
  CHECK: node scripts/verify-chat-break-fixes.mjs G9
  EXPECT: G9: source video split-view persistence passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=2c6c1f52d7871d9972eaf8e6f5f7b7350f65b63c021bca2de19d2f15e9a9a3ff; exit=0; EXPECT=matched; output-sha256=e491db443843d43059fb1407b69a73826cab2b7f2fff00a2f93882b3786a0ea2; output-bytes=47; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G10: Stream deduplication and abort safety
  CHECK: node scripts/verify-chat-break-fixes.mjs G10
  EXPECT: G10: stream deduplication and abort safety passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=9248ccc01bc26e7ce9b9e2d5c1b9474a6e86d067cc873c886ac7b0aaa7a427f5; exit=0; EXPECT=matched; output-sha256=6a4213c6dd14f3ac6d2abe942f8c675aa70acaa1fa51c0574d1d22259cad94a0; output-bytes=50; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G11: Full editorial chat break verification suite
  CHECK: node scripts/verify-chat-break-fixes.mjs --all
  EXPECT: all break verification checks passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=ef0b0aab1f39e4cc118278c7d79f3a5b943f082021868bb68119c2a29ffc16a1; exit=0; EXPECT=matched; output-sha256=f6b29e248d3a24ac55e7e24d7a13baa33b5cc4cccfe093f60c383a368af5d915; output-bytes=586; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
