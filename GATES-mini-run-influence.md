# Gates: Mini-Run Frontend to Backend Song & Editorial Directive Routing Audit and Fix

OWNS: GATES.md, lib/server/mini-run-render-payload.ts, lib/server/mini-run-dispatch.ts, app/api/mini-run/dispatch/route.ts, app/api/mini-run/plan/route.ts, app/api/projects/[id]/exports/route.ts, tests/mini-run-backend-influence.test.ts, tests/test_gateway_routing.py, tests/test_pipeline_influence.py

Scope: Diagnose and ensure that frontend song selection (via UI or JARVIS), B-roll directives, and motion graphics preferences are faithfully routed through the AWS Lambda gateway into the backend mini_run pipeline, and that the backend upholds the song selection and editorial directives in the final render.

- [x] G1: buildMiniRunRenderPayload forwards explicit song selection, audio intent, and editorial directives (B-rolls, motion graphics) to the backend render payload.
  CHECK: node --import tsx --test --test-name-pattern="G1" tests/mini-run-backend-influence.test.ts
  EXPECT: G1 passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=e46f4a64c8a1e6edfc01d786b53bc78e5a908299243f929bf494686ae518d081; exit=0; EXPECT=matched; output-sha256=516e20034ea704a87fcddf1a03bbfd5a2a02c8bd62828fa057e4556ce77ffe59; output-bytes=369; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: Editor export dispatch extracts selected song and editorial preferences from project state and forwards them to Mini-Run dispatch.
  CHECK: node --import tsx --test --test-name-pattern="G2" tests/mini-run-backend-influence.test.ts
  EXPECT: G2 passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=5cb99012a15c269dfaa1f0dcdcada3cc9a60ebde3cc06508a71c2f3b93af1e70; exit=0; EXPECT=matched; output-sha256=ad7a032e742c92436c54926f4778742ce223ce7a278e9f9f23c3f719df581f2b; output-bytes=358; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Backend gateway handle_render and handle_plan preserve prompt, userPrompt, and all audio/design directives without stripping.
  CHECK: python tests/test_gateway_routing.py
  EXPECT: GATEWAY_ROUTING_TESTS_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=71c3aa73cc1f4cf8f61d37d5faf57fa8bfeb4a6f7e6fc4ccf1390b09ce2bf71c; exit=0; EXPECT=matched; output-sha256=6f78aeff3265c1eb265bdd9ae8bb8320c3a38f938f04c78601175514eb82ea74; output-bytes=273; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Backend mini-run pipeline materializes user-selected song and honors B-roll and motion graphics prompt bias in orchestration.
  CHECK: python tests/test_pipeline_influence.py
  EXPECT: PIPELINE_INFLUENCE_TESTS_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=10954c152d7e39b0eae428f8cb086c1aaabe395c61076ba95a03488ba85b9452; exit=0; EXPECT=matched; output-sha256=01eb354dfc4a474bfa559fdde0b5feb36f1482dee4b8e7dac8ad62ad3732248b; output-bytes=467; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G5: AWS Lambda Remotion init for Mini-Runs correctly receives and routes soundtrack, SFX, and orchestration props into PrometheusMinRun.
  CHECK: node --import tsx --test --test-name-pattern="G5" tests/mini-run-backend-influence.test.ts
  EXPECT: G5 passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=69262316d251158c6618cf46f2b13c177b374fd2189beed28362734bddc13a6d; exit=0; EXPECT=matched; output-sha256=f14862937304d8f4eb2656779c85ab22e8af1d7a500d7f32b6f5d0e40f45b189; output-bytes=361; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [ ] G6: Complete frontend typecheck passes cleanly.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
