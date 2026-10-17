# Gates: Jarvis end-to-end video delivery and source recovery

Scope: Diagnose the supplied voice session, fix confirmed export-intent and source-state defects, and verify the changes without disturbing existing workspace work.

- [ ] G1: Voice execution submits final exports by default and preserves explicit preview requests
  CHECK: node --import tsx --test --test-reporter=tap tests/jarvis-end-to-end-session.test.mjs
  EXPECT: # fail 0
  EVIDENCE: pending

- [ ] G2: Existing export, source-readiness, and upload runtime regressions pass
  CHECK: node --import tsx --test --test-reporter=tap tests/jarvis-mp4-session.test.mjs tests/source-render-readiness.test.ts tests/source-replacement-upload.test.ts tests/multipart-upload-runtime.test.ts
  EXPECT: # fail 0
  EVIDENCE: pending

- [ ] G3: Type checking accepts the integrated changes
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: pending

- [ ] G4: Findings identify confirmed causes, Cloudflare evidence, and verification limitations
  EVIDENCE: pending

- [ ] G5: Changed files introduce no lint errors relative to their committed baseline
  CHECK: node scripts/verify-jarvis-session-lint.mjs
  EXPECT: JARVIS_SESSION_LINT_PASSED
  EVIDENCE: pending
