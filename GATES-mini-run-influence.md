# Gates: Mini-Run Frontend to Backend Song & Editorial Directive Routing Audit and Fix

OWNS: GATES.md, lib/server/mini-run-render-payload.ts, lib/server/mini-run-dispatch.ts, app/api/mini-run/dispatch/route.ts, app/api/mini-run/plan/route.ts, app/api/projects/[id]/exports/route.ts, tests/mini-run-backend-influence.test.ts, tests/test_gateway_routing.py, tests/test_pipeline_influence.py

Scope: Diagnose and ensure that frontend song selection (via UI or JARVIS), B-roll directives, and motion graphics preferences are faithfully routed through the AWS Lambda gateway into the backend mini_run pipeline, and that the backend upholds the song selection and editorial directives in the final render.

- [ ] G1: buildMiniRunRenderPayload forwards explicit song selection, audio intent, and editorial directives (B-rolls, motion graphics) to the backend render payload.
  CHECK: node --import tsx --test --test-name-pattern="G1" tests/mini-run-backend-influence.test.ts
  EXPECT: G1 passed

- [ ] G2: Editor export dispatch extracts selected song and editorial preferences from project state and forwards them to Mini-Run dispatch.
  CHECK: node --import tsx --test --test-name-pattern="G2" tests/mini-run-backend-influence.test.ts
  EXPECT: G2 passed

- [ ] G3: Backend gateway handle_render and handle_plan preserve prompt, userPrompt, and all audio/design directives without stripping.
  CHECK: python tests/test_gateway_routing.py
  EXPECT: GATEWAY_ROUTING_TESTS_PASSED

- [ ] G4: Backend mini-run pipeline materializes user-selected song and honors B-roll and motion graphics prompt bias in orchestration.
  CHECK: python tests/test_pipeline_influence.py
  EXPECT: PIPELINE_INFLUENCE_TESTS_PASSED

- [ ] G5: AWS Lambda Remotion init for Mini-Runs correctly receives and routes soundtrack, SFX, and orchestration props into PrometheusMinRun.
  CHECK: node --import tsx --test --test-name-pattern="G5" tests/mini-run-backend-influence.test.ts
  EXPECT: G5 passed

- [ ] G6: Complete frontend typecheck passes cleanly.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
