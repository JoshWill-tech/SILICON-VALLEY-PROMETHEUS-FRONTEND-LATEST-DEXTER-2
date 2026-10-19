# Source Replacement Storage Quota Exceeded Diagnosis & Rectification

**Date:** 2026-10-18  
**Scope:** Editor source replacement upload failures, `STORAGE_QUOTA_EXCEEDED` error handling, database upload reservation leakage, and active vs superseded asset accounting.

---

## 1. Symptom

In the editor (`app/editor/[id]/page.tsx`), when a creator attempted to replace their project's source video, the frontend displayed an error toast:
> **The replacement source could not be saved.**  
> *Storage quota exceeded by active assets and upload reservations.*

---

## 2. Root Cause Analysis

Tracing the error from the frontend UI down to the database control plane uncovered five intertwined factors that caused this failure:

1. **Double-Counting During Replacement (`maul_reserve_source_upload` & `getUserStorageQuota`):**
   - When a creator replaced an existing video, `maul_reserve_source_upload` computed `v_used_bytes + v_reserved_bytes + p_size_bytes > v_limit_bytes`.
   - `v_used_bytes` summed all assets for the user in `public.source_assets`, including the **current source asset of the project being replaced**.
   - If a creator on the 4 GiB free tier had a project with a 2.5 GiB video and attempted to replace it with a 2.0 GiB video:
     $$\text{Used (2.5 GiB)} + \text{New (2.0 GiB)} = 4.5\text{ GiB} > 4.0\text{ GiB}$$
   - The replacement was rejected even though the old 2.5 GiB asset would be superseded by the new 2.0 GiB video upon commit. Anyone with >50% quota utilized on a single video project was mathematically blocked from replacing it.

2. **Ghost Reservations from Uncommitted/Interrupted Sessions:**
   - Every upload initiation creates a row in `public.source_upload_sessions` with `status = 'reserved'` and `expires_at = now() + 24 hours`.
   - If an upload was interrupted, failed due to network conditions, or the user re-selected or dropped a different file, the prior session was never aborted.
   - Each attempt generated a new UUID `assetId` via `stageSourceFile` / `persistSourceAsset`, bypassing idempotency.
   - All uncommitted sessions (`status in ('reserved', 'uploading', 'verified')`) were summed into `v_reserved_bytes`. 2–3 attempts with a 1 GiB file accumulated 2–3 GiB of phantom reservations, locking the user out for 24 hours.

3. **Superseded Assets Permanently Consuming Quota:**
   - When a new source revision was committed in `maul_commit_source_revision`, the older revision was marked `state = 'superseded'`, but the old `source_assets` record was never deleted or excluded from `v_used_bytes`.
   - Replaced videos permanently consumed quota, steadily degrading user capacity with each replacement.

4. **Lack of Automated Session Abort on Replacement in Initiate Route:**
   - `POST /api/projects/[id]/upload-multipart/initiate` did not abort prior uncommitted sessions for `projectId`.
   - The client only reported the raw error string with no recovery action.

5. **Database Quota Function Alignment:**
   - While `lib/storage-limits.ts` set free tier storage to 4 GiB, unmigrated database instances returned 500 MiB from `maul_storage_limit_bytes(p_user_id)`.

---

## 3. Rectifications Implemented

### A. Server Initiate Route (`app/api/projects/[id]/upload-multipart/initiate/route.ts`)
- **Auto-abort of prior uncommitted sessions:** Before reserving a new upload, the initiate handler queries `source_upload_sessions` for any uncommitted sessions (`status in ('reserved', 'uploading')`) belonging to the same project and user (with a different `assetId`). It invokes `maul_abort_source_upload` and sends `AbortMultipartUploadCommand` to Cloudflare R2, instantly reclaiming zombie reservations.
- **Quota recovery retry:** If `maul_reserve_source_upload` returns `STORAGE_QUOTA_EXCEEDED`, the route checks for any orphaned uncommitted sessions across the user's workspace older than 1 hour, aborts them, and retries the reservation once before returning an error.

### B. Upload Context Quota Accounting (`lib/r2/project-source-multipart.ts`)
- `getUserStorageQuota(userId: string, currentProjectId?: string)` now excludes any existing source asset belonging to `currentProjectId` from the `usedBytes` calculation when checking replacement eligibility.

### C. Client Resumable Session Reset (`lib/r2/multipart-client.ts`)
- When `STORAGE_QUOTA_EXCEEDED` is caught, the client removes the stored session fingerprint from IndexedDB so subsequent attempts start fresh with clean reservations.

### D. User Feedback & Toast Clarification (`app/editor/[id]/page.tsx`)
- Updated toast notification to provide clear, actionable guidance if storage quota is exceeded:
  *"Storage quota exceeded. Free up storage in your workspace or upgrade your plan to upload larger files."*

### E. Database Control Plane Migration (`supabase/migrations/20261018000000_fix_source_replacement_quota_accounting.sql`)
- Replaces `public.maul_storage_limit_bytes(p_user_id uuid)`: aligns free tier to `4294967296::bigint` (4 GiB).
- Replaces `public.maul_reserve_source_upload(...)`:
  - Automatically aborts prior uncommitted sessions for `p_project_id`.
  - Calculates `v_used_bytes` strictly from current active revisions (`sr.state = 'current'`) and excludes `p_project_id`'s existing asset when replacing.
  - Excludes `p_project_id` from `v_reserved_bytes`.
- Replaces `public.maul_commit_source_revision(...)`:
  - Revalidates quota excluding the superseded project asset.
  - Aborts older uncommitted sessions for the project upon commit.

---

## 4. Verification

1. **Unit & Integration Suite (`npm run test:source-upload`):**
   - All 17 tests passed:
     - `replacement does not double-count existing project source asset against storage quota` (PASSED)
     - `prior uncommitted sessions are aborted when initiating a new upload for the project` (PASSED)
     - `the latest database storage limits match every frontend tier` (PASSED)
     - Multi-part chunk verification, simulated 4 GiB file, 114 MiB real path, and terminal error propagation (ALL PASSED)
2. **Companion Render Suite (`tests/jarvis-mp4-session.test.mjs`):**
   - All 25 tests passed.
3. **TypeScript Compilation (`node scripts/verify-typecheck.mjs`):**
   - Clean pass with zero errors.
