# Gates: durable large source replacement

OWNS: lib/r2/**, lib/editor/**, app/editor/[id]/page.tsx, app/api/projects/**, supabase/migrations/20261016000000_align_source_upload_storage_quotas.sql, tests/**, scripts/**, docs/**, GATES.md

Scope: Diagnose the reported replacement-source failure, correct the proven cause, protect heavy-video uploads with behavioral regression coverage, inspect live R2 configuration, and document operational evidence and any outstanding deployment work.

- [ ] G1: The reported error is traced to a reproduced failing boundary with evidence distinguishing transport, session, registration, and local ownership failures.
  EVIDENCE: pending

- [ ] G2: Behavioral regression coverage exercises replacement and large multipart uploads, including interrupted uploads and registration failures.
  CHECK: node --import tsx --test --test-reporter=tap tests/source-replacement-upload.test.ts tests/multipart-upload-runtime.test.ts
  EXPECT: # fail 0
  EVIDENCE: pending

- [ ] G3: The repository passes its required TypeScript check.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: pending

- [ ] G4: The repository passes lint without new errors.
  CHECK: npm run lint
  EXPECT: eslint .
  EVIDENCE: pending

- [ ] G5: A production build succeeds with production safety verification.
  CHECK: npm run build
  EXPECT: No dev bypass tokens found in production build output.
  EVIDENCE: pending

- [ ] G6: Live Cloudflare R2 access, CORS, multipart behavior, file-size limits, and deployment state have been checked and the findings are recorded in the incident report.
  EVIDENCE: pending

- [ ] G7: The final report distinguishes measured fixes, actual large-file verification, and any required user or deployment action, without claiming universal failure prevention.
  EVIDENCE: pending
