# Gates: Prometheus Chat History, Sync, and Integration Fixes

OWNS: hooks/use-ai-chat.ts, components/editor/PrometheusChat.tsx, components/editor/prometheus-chat-history-drawer.tsx, components/editor/prometheus-chat-history-row.tsx, components/editor/ai-chat-history-panel.tsx, components/editor/ai-chat-session-item.tsx, components/editor/conversation-export-button.tsx, components/video-upload-interface.tsx, components/navigation/jarvis-top-nav-filament.tsx, lib/conversation-log.ts, lib/prometheus-assistant/local-chat-history.ts, lib/supabase/chat-sessions.ts, scripts/verify-chat-critique-fixes.mjs, tests/chat-critique-integration.test.ts, GATES.md

Scope: Comprehensive fixes for Prometheus editorial chat false empty states on reopen, orphan message accounting, history dialog search and metadata, cross-project isolation, surface sync honesty, upfront export routing, and second-chat preservation.

- [x] G1: Reopen behaviour shows explicit session loading state, never false empty state, with in-memory caching
  CHECK: node scripts/verify-chat-critique-fixes.mjs --p1
  EXPECT: p1-reopen-loading-state-verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=e0cd31abb2ff0a6018f0c746cf22bef2d4ec8d0895c52ccffba27463d0aa5ee8; exit=0; EXPECT=matched; output-sha256=93f84798393e43964cb7a1d78029a771ab346e087f4ea0687f056196f0cbc068; output-bytes=33; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=44f9caf79fc0/35 entries

- [x] G2: Orphan messages are accounted for with explicit honest failure/no-reply status without mutating history
  CHECK: node scripts/verify-chat-critique-fixes.mjs --p2
  EXPECT: p2-orphan-messages-honesty-verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=49eb1043372ac79d1f53f202c093a0b0f48e617afe984d0377d6f534b681a536; exit=0; EXPECT=matched; output-sha256=ef7e0bc3f32bbc2724554d1537d072a402ccef92eec371bdd43e088ea4db6c92; output-bytes=36; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=44f9caf79fc0/35 entries

- [x] G3: History dialog surfaces project badge, message count, timestamp, and message-content search
  CHECK: node scripts/verify-chat-critique-fixes.mjs --p3
  EXPECT: p3-history-dialog-search-metadata-verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=56b7a51f5d6a19cf41a76ec79c69858e9fc4b71cb3616a5947cc44cf575841a9; exit=0; EXPECT=matched; output-sha256=cc3ffbbb870fa724ff4ce923102968785c91f753496c57a9f9491089bf7a065c; output-bytes=43; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=44f9caf79fc0/35 entries

- [x] G4: Cross-project history isolation is strictly preserved between projects
  CHECK: node scripts/verify-chat-critique-fixes.mjs --p4
  EXPECT: p4-cross-project-separation-verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=dc32a9e42665948a2834ab28e6e9cd54854182f17407b66ad2db6894b586e988; exit=0; EXPECT=matched; output-sha256=7d2b634fb704800b961553289d5d2c5cd1f4f4f84faea6b91aef1247c0ca2e67; output-bytes=37; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=44f9caf79fc0/35 entries

- [x] G5: Surface honesty distinguishes home inception, Jarvis voice bridge, and project editorial chat
  CHECK: node scripts/verify-chat-critique-fixes.mjs --p5
  EXPECT: p5-surface-honesty-verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=83a0dc627d6e4c2bd393bb803c7b630643eb1389202849a75638cf77cd6644b5; exit=0; EXPECT=matched; output-sha256=ff4983f9a640927159cb9c1bfc3db3ab0aad4b08bf1436e454184519e3707d04; output-bytes=28; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=44f9caf79fc0/35 entries

- [x] G6: Chat-to-output routing states up front before first prompt that MP4 renders generate in Export
  CHECK: node scripts/verify-chat-critique-fixes.mjs --p6
  EXPECT: p6-upfront-export-routing-verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=b4607cb28a85c0fb31f86f9b0144567de04ff33485eb01007d661d8a20021fd7; exit=0; EXPECT=matched; output-sha256=29a99470d78069e0a2ec1e8ace2cea9c042d7f1e1f980ffc20864d1ff8f3e367; output-bytes=35; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=44f9caf79fc0/35 entries

- [x] G7: Second-chat action creates fresh session while keeping previous sessions accessible
  CHECK: node scripts/verify-chat-critique-fixes.mjs --p7
  EXPECT: p7-second-chat-preservation-verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=895176f05e4c6aa4808feb59a8d2d34b0294b3505ac09f3fbf4fca0506c967be; exit=0; EXPECT=matched; output-sha256=f97d1820be45f3416070993043c38bffa2ab976cad67900f72e7af4abccd866f; output-bytes=37; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=44f9caf79fc0/35 entries

- [x] G8: Typecheck and full jarvis render test suites pass without regression
  CHECK: node scripts/verify-chat-critique-fixes.mjs --p8
  EXPECT: p8-typecheck-and-regression-verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=545d0717b6817d58834e73b28766632d83798a6ccdf4df835270b14d1f82fe16; exit=0; EXPECT=matched; output-sha256=69bbd9687cddebc24b8f4f7b56aa7dc9030ee95ac18604406e26b88d0264d946; output-bytes=17975; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=44f9caf79fc0/35 entries
