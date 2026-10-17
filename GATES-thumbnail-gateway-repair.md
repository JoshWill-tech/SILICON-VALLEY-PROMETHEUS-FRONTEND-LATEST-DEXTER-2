# Gates: thumbnail route gateway repair

OWNS: app/api/projects/[id]/thumbnails/nano-banana/route.ts, lib/thumbnails/thumbnail-runtime.ts, tests/thumbnail-route-runtime.test.mjs, tests/thumbnail-studio-design.test.mjs, scripts/probe-thumbnail-models.mjs, scripts/probe-thumbnail-generation.mjs, scripts/verify-thumbnail-build.mjs, artifacts/thumbnail-gateway-repair/**, docs/thumbnail-gateway-repair.md, GATES-thumbnail-gateway-repair.md

Scope: Reproduce thumbnail route failures locally, repair proven request-lifetime or provider-contract defects, and validate image output and failure responses without requiring production log access.

- [ ] G1: Optional planning cannot consume the image generation deadline; cancellation stops provider work.
  CHECK: node --test --test-reporter=tap tests/thumbnail-route-runtime.test.mjs
  EXPECT: /# fail 0/
  EVIDENCE: pending

- [ ] G2: Thumbnail provider requests and image output remain compatible with existing studio behavior.
  CHECK: node --test --test-reporter=tap tests/nano-banana-image.test.mjs tests/thumbnail-studio-design.test.mjs tests/thumbnail-response.test.mjs tests/thumbnail-reference-priority.test.mjs tests/iterative-thumbnail-modification.test.mjs
  EXPECT: /# fail 0/
  EVIDENCE: pending

- [ ] G3: Changes pass TypeScript checking.
  CHECK: npm.cmd run typecheck
  EXPECT: typecheck passed
  EVIDENCE: pending

- [ ] G4: Changes pass repository lint.
  CHECK: npm.cmd run lint
  EXPECT: /eslint/
  EVIDENCE: pending

- [ ] G4b: Thumbnail files pass lint independently of unrelated repository failures.
  CHECK: node node_modules/eslint/bin/eslint.js "app/api/projects/[id]/thumbnails/nano-banana/route.ts" lib/thumbnails/thumbnail-runtime.ts tests/thumbnail-route-runtime.test.mjs scripts/probe-thumbnail-models.mjs scripts/probe-thumbnail-generation.mjs scripts/verify-thumbnail-build.mjs && node -e "console.log('thumbnail lint passed')"
  EXPECT: thumbnail lint passed
  EVIDENCE: pending

- [ ] G5: Production build succeeds in an isolated project directory using the same source and dependencies.
  CHECK: node scripts/verify-thumbnail-build.mjs
  EXPECT: /Compiled successfully/
  EVIDENCE: pending

- [x] G6: Hypotheses and outcomes distinguish reproduced repairs from unverified production behavior.
  EVIDENCE: docs/thumbnail-gateway-repair.md records the six reproduced failures, their code repairs, model/API metadata results and the real zero-quota response. Final direct regression run passed 43 tests with 0 failures. Runtime fixtures verify real route behavior and decodable images, not live provider success. No production deployment is claimed.

- [ ] G7: A configured provider can generate a real thumbnail.
  EVIDENCE: Live Gemini request with synthetic source returned HTTP 429 RESOURCE_EXHAUSTED and generate_content_free_tier_requests limit 0. No dedicated thumbnail image credential is configured. There is no second distinct configured Gemini key accepted by the application's key resolver. The configured Bedrock credential returned HTTP 401 when reading its documented models endpoint.

ABANDON: G4 Repository-wide lint baseline fails with 5 pre-existing errors outside thumbnail ownership. Details in docs/thumbnail-gateway-repair.md; G4b verifies all changed thumbnail files.
ABANDON: G7 Real image generation requires quota/billing for the configured Gemini project or a valid dedicated thumbnail image provider credential. Account access/billing and production deployment are not changed by this patch.
