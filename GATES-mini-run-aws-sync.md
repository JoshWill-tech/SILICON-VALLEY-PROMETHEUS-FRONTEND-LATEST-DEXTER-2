# Gates: Mini-Run AWS frontend sync

OWNS: .env.example, app/api/mini-run/**, app/api/mcp/**, app/oauth/consent/**, app/api/oauth/decision/**, app/.well-known/oauth-protected-resource/**, app/api/projects/[id]/exports/route.ts, app/api/hermes/agent/route.ts, lib/server/mini-run-*.ts, lib/server/mcp-oauth.ts, lib/exports/service.ts, lib/hermes/tools.ts, tests/mini-run-aws-sync.test.ts

Scope: Route the existing Mini-Run frontend flow to a configured AWS API URL, forward the authenticated Supabase user token, and return completed MP4 output through the existing frontend delivery surface.

- [x] G1: Mini-Run server configuration uses an explicit AWS API endpoint and no Modal proxy credentials.
  CHECK: node --import tsx --test --test-reporter=tap tests/mini-run-aws-sync.test.ts
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=bb098f6763d6755471e5a3714c690a108a71eb6ee4f62b283443eb5c1c8e0e2b; exit=0; EXPECT=matched; output-sha256=6b8a69d4cee9062e4f0cb0fe197c3b8735d7fd9e1149eb56ad31a6cd0b994a0f; output-bytes=351; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=9331cc48dc98/38 entries

- [x] G2: Every authenticated Mini-Run dispatch, poll, and output request forwards the caller's Supabase access token.
  CHECK: node --import tsx --test --test-reporter=tap tests/mini-run-aws-sync.test.ts
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=bb098f6763d6755471e5a3714c690a108a71eb6ee4f62b283443eb5c1c8e0e2b; exit=0; EXPECT=matched; output-sha256=d0c0187baad90cd0b4c9186e6848f6723b0845d721f18929bd7e9763ca9dd60c; output-bytes=351; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=9331cc48dc98/38 entries

- [x] G3: Frontend output delivery is authorized by backend job ownership and can serve jobs started from Mini-Run Studio as well as project exports.
  CHECK: node --import tsx --test --test-reporter=tap tests/mini-run-aws-sync.test.ts
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=bb098f6763d6755471e5a3714c690a108a71eb6ee4f62b283443eb5c1c8e0e2b; exit=0; EXPECT=matched; output-sha256=d9b2f82aba9f7eee02f44d96a575930de2619690276497201c727235b4876d04; output-bytes=350; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=9331cc48dc98/38 entries

- [x] G4: The complete frontend typecheck passes.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=9aeeb689bde5257e0a85c8ecb0aad3fdaf9ace3e9e5076bbf6758c22760ccfe3; exit=0; EXPECT=matched; output-sha256=2c4af01fb1a5f9597841244575659986624ce8ada13bbc89dce9491fd48c4a46; output-bytes=93; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=9331cc48dc98/38 entries

- [x] G5: ChatGPT can discover the MCP resource and receives an OAuth challenge when unauthenticated.
  CHECK: node --import tsx --test --test-reporter=tap tests/mini-run-aws-sync.test.ts
  EXPECT: # fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=bb098f6763d6755471e5a3714c690a108a71eb6ee4f62b283443eb5c1c8e0e2b; exit=0; EXPECT=matched; output-sha256=2a34e1ab0b76af3fef8689a8d4c95bbe4403918a55f76fc847dcc18230e120c5; output-bytes=351; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=9331cc48dc98/38 entries

- [x] G6: The deployed AWS gateway currently passes its health, unauthenticated-job guard, and chunk route checks.
  CHECK: node --import tsx scripts/verify-mini-run-aws-live.ts
  EXPECT: Mini-Run AWS live gateway checks passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=177f0073501355b303e4d193a070cdb7901dce11263c2568d7feffefa7ce4fc8; exit=0; EXPECT=matched; output-sha256=654981b2f4b90359a5205d879929815d248f598b5dd0f3bef4cc5f6628bf95ca; output-bytes=40; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=9331cc48dc98/38 entries

- [ ] G7: The supplied 39.9-second Jeff Simons source video completes a real authenticated Mini-Run and its final MP4 is playable/downloadable from the frontend.
  EVIDENCE: pending; source file exists at `C:\Users\HomePC\Downloads\TALKING HEAD VID jeff simons THOUGHT OF THEDAY.mp4` (4,755,103 bytes, 39.913991s). Need the frontend to confirm upload, tracked render completion, and final MP4 playback/download.

- [ ] G8: The deployed Supabase OAuth server and ChatGPT MCP connector complete a real user authorization flow.
  EVIDENCE: pending; MCP routes and local OAuth UI exist in the frontend, but dashboard setup and a real ChatGPT authorization have not been evidenced. See `docs/mini-run-chatgpt-mcp-setup.md`.

- [x] G9: The local Next app starts and its Mini-Run API route reaches the deployed AWS gateway.
  EVIDENCE: `npm.cmd run dev -- --port 3177` reported Ready; `GET http://127.0.0.1:3177/api/mini-run/health` returned HTTP 200 with `deployment: aws-lambda`. The dev server was stopped after verification.

- [x] G10: The deployed production frontend is checked before attempting the user's upload.
  EVIDENCE: `GET https://prometheusstudio.tech/api/mini-run/health` returned HTTP 503 `MINI_RUN_BACKEND_URL is not configured`; production is still on a frontend/configuration state that cannot start Mini-Run. The local worktree has `MINI_RUN_AWS_API_URL` and its Next API route passed the AWS health check.
