# Gates: Complete Storage Quota Eradication & Prophylaxis

OWNS: lib/storage-limits.ts, lib/r2/project-source-multipart.ts, app/api/projects/[id]/upload-multipart/initiate/route.ts, app/api/projects/[id]/assets/route.ts, lib/billing.ts, components/video-upload-interface.tsx, supabase/migrations/20261023000000_unlimited_storage_and_quota_prophylaxis.sql, tests/storage-quota-eradication.test.ts

Scope: Completely eliminate account-level and database-level storage quota limits, grant all accounts free unlimited usage, add proactive session recovery prophylaxis, and verify end-to-end.

- [x] G1: Storage tier definition grants unlimited 100 TB capacity to all tiers including Free.
  CHECK: node scripts/verify-unlimited-storage.mjs
  EXPECT: storage tiers verified unlimited
  EVIDENCE: Output: "storage tiers verified unlimited" (exit 0)

- [x] G2: Source upload preflight never rejects uploads on plan storage quota.
  CHECK: node scripts/verify-preflight-unlimited.mjs
  EXPECT: upload preflight quota check disabled
  EVIDENCE: Output: "upload preflight quota check disabled" (exit 0)

- [x] G3: Upload initiate route auto-aborts stale workspace sessions and handles quota exceptions proactively.
  CHECK: npm run test:source-upload
  EXPECT: tests passed
  EVIDENCE: Output: 36/36 tests passed (exit 0)

- [x] G4: Full storage eradication regression test suite passes.
  CHECK: node --import tsx --test tests/storage-quota-eradication.test.ts
  EXPECT: storage quota eradication tests passed
  EVIDENCE: Output: 5/5 subtests passed (ok 32 - ok 36 in TAP runner, exit 0)

- [x] G5: Supabase migration file defines 100 TB unlimited storage in PostgreSQL functions.
  CHECK: node scripts/verify-supabase-quota-migration.mjs
  EXPECT: supabase migration verified
  EVIDENCE: Output: "supabase migration verified" (exit 0)

- [x] G6: Full application typecheck passes.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: Output: "typecheck passed" (exit 0)
