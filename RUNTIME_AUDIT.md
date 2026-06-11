# PROMETHEUS RUNTIME AUDIT
## Generated: Thursday, June 4, 2026
## Classification: INTERNAL — DO NOT SHARE

## 1. EXECUTIVE SUMMARY
Total issues found: 7
- P0 (Will break in production): 3
- P1 (High risk): 2
- P2 (Medium risk): 2

## 2. P0 CRITICAL ISSUES

### Issue 1: Serverless Environment Lack of FFMPEG
- **File:** `app/api/thumbnails/generate/route.ts`
- **Line:** 4, 28, 31, 57
- **Problem:** The route uses `child_process.exec` to call `ffmpeg`. Vercel serverless functions do NOT include `ffmpeg` in their runtime environment. This route will fail with "ffmpeg: command not found" in production.
- **Fix:** Move thumbnail generation to a dedicated worker (e.g., AWS Lambda with an FFMPEG layer, or a specialized media service) or use a WASM-based FFMPEG (though slow for serverless).
- **Test:** Deploy to a serverless environment and attempt to generate thumbnails.

### Issue 2: Global Crash on Missing KMS Configuration
- **File:** `lib/crypto/token-vault.ts`
- **Line:** 14
- **Problem:** The file throws an Error at the module's top level if `KMS_KEY_ARN` is missing. Since this file is imported by almost every social provider handler and OAuth route, the entire server process (or any route using them) will crash on startup if this environment variable is not set.
- **Fix:** Move the configuration check inside the `sealToken` and `unsealToken` functions so it only throws when the service is actually called.
- **Test:** Remove `KMS_KEY_ARN` from `.env.local` and try to start the app or hit a non-KMS route that happens to import a social provider.

### Issue 3: Unsafe Web Crypto Usage in Node.js
- **File:** `lib/crypto/token-vault.ts`
- **Line:** 18
- **Problem:** The code calls `crypto.getRandomValues(new Uint8Array(12))`. In Node.js, `getRandomValues` is not a global function; it resides in `crypto.webcrypto`. This will throw a `ReferenceError` in most Node.js environments.
- **Fix:** `import crypto from "crypto";` and use `crypto.randomBytes(12)` or `crypto.webcrypto.getRandomValues()`.
- **Test:** Run `sealToken` in a Node.js environment.

---

## 3. P1 HIGH ISSUES

### Issue 4: Hardcoded Export URL
- **File:** `components/editor/ExportDrawer.tsx`
- **Line:** 25
- **Problem:** The `currentVideoUrl` is hardcoded to a sample video. Users will successfully "export" their project to TikTok/YouTube, but it will always post the sample video regardless of their project content.
- **Fix:** Pass the actual project export URL from the `EditorContext` or the render job result.
- **Test:** Perform an export and verify the content posted to the social platform.

### Issue 5: Breaking Database Migration
- **File:** `supabase/migrations/20240604000004_fix_circular_reference.sql`
- **Problem:** This migration drops the `source_asset_id` column from the `projects` table. However, `lib/projects/service.ts` and `lib/exports/service.ts` still explicitly reference and require this column. Pushing this migration will break all project loading and export functionality.
- **Fix:** Refactor the application code to use the one-to-many relationship (source_assets pointing to project_id) before dropping the column, or remove the migration.
- **Test:** Run the migration and attempt to list projects.

---

## 4. P2 MEDIUM ISSUES

### Issue 6: Inefficient File System Management
- **File:** `app/api/thumbnails/generate/route.ts`
- **Problem:** Uses `exec(mkdir -p)` and `exec(rm -rf)` instead of Node's native `fs` promises. While it works, it's slower and more prone to shell injection risks if paths aren't sanitized.
- **Fix:** Use `fs.promises.mkdir({ recursive: true })` and `fs.promises.rm({ recursive: true, force: true })`.

### Issue 7: Redundant IV in KMS Sealing
- **File:** `lib/crypto/token-vault.ts`
- **Problem:** The `sealToken` function generates an `iv` and returns it, but doesn't pass it to the KMS `EncryptCommand`. AWS KMS manages its own encryption parameters. Storing a random IV that isn't used for decryption is confusing and adds unnecessary data to the DB.
- **Fix:** Remove the IV generation and storage, or switch to a local AES-GCM implementation where the IV is required (using KMS only for the Master Key).

---

## 5. VERIFICATION CHECKLIST
- [x] Async/await consistency fixed (Most server-side calls are awaited)
- [ ] Vercel limitations addressed (FFMPEG and Top-level Error still present)
- [x] OAuth flow complete for Google Drive
- [x] Error handling added to RAG route
- [x] Database queries safe (Wrapped in checks)
- [x] Frontend-backend contract aligned
- [x] Security smells removed (No leaked tokens in logs)

## 6. DEPLOYMENT READINESS
**This codebase is NOT ready for production until ALL P0 issues are resolved.**
