# Source media quota investigation — 2026-10-22

## Finding and remaining uncertainty

The reported message is emitted by the editor when source upload or registration fails with `STORAGE_QUOTA_EXCEEDED`. In this path, that code comes from Prometheus's PostgreSQL quota enforcement functions in Supabase. Source media itself is stored in Cloudflare R2. The message is not a Supabase subscription or Supabase Storage capacity warning.

The exact live reason for the rejection remains unverified: no authenticated database session or failed request payload was available. Do not treat the presence of migration files, a previous diagnosis, or passing local tests as proof that the live database was migrated. Do not recommend a paid storage upgrade until the actual allowance and accounting have been inspected.

## Traced failure path

1. `app/editor/[id]/page.tsx:9690` stages the local video and presents a browser preview before its cloud upload completes.
2. `app/editor/[id]/page.tsx:9738` starts `uploadSourceAssetToCloud` in the background.
3. `app/api/projects/[id]/upload-multipart/initiate/route.ts:99` invokes `maul_reserve_source_upload` before creating an R2 multipart upload. A quota failure here prevents uploading bytes.
4. If upload succeeds, `app/api/projects/[id]/assets/route.ts:127` invokes `maul_commit_source_revision`, which also checks quota. A quota failure here prevents durable registration; this route attempts to abort the reservation and delete the uploaded object.
5. `lib/api/source-control-plane-errors.ts` maps `STORAGE_QUOTA_EXCEEDED` to HTTP 413. Reservation exceptions can carry `details` with `usedBytes`, `reservedBytes`, `requestedBytes`, and `limitBytes`.
6. `app/editor/[id]/page.tsx:9758` recognizes this code/message, marks the source save as failed, calls the cleanup endpoint, and displays the exact user-reported message at line 9765.

Local playback is therefore not proof that the source is available to cloud services. The editor gates transcription while the replacement is saving (`page.tsx:7338`); asset registration starts downstream transcription after durable commit (`assets/route.ts:145`). A failed upload or commit can prevent Jarvis's cloud processing from accessing the selected file. This does not establish that every aspect of Jarvis's visual context requires the cloud upload.

## Ranked live causes to distinguish

1. **Old database allowance.** The original `20260803010000_maul_source_control_plane.sql` uses 524,288,000 bytes (500 MiB) for free accounts. Frontend limits specify 4,294,967,296 bytes (4 GiB). The October 16 and October 18 migrations align the database allowance. Prediction: the live function returns 524,288,000 if this mismatch is present.
2. **Old accounting or retained reservations.** Original reservation logic sums all source assets, including replacement history, plus unexpired sessions with `reserved`, `uploading`, or `verified` status. Prediction: the rejected request's byte counts, live function definitions, and database sessions show the excess; corrected active-revision accounting would fit.
3. **Actual workspace exhaustion.** Prediction: current assets from other projects plus legitimate pending reservations and the requested file exceed the intended allowance even under corrected accounting.

The exact toast differs from the preliminary application's `Storage limit exceeded. Your ...` message, so the database reservation/commit checks are the important first boundary to inspect for this report.

## Live checks performed

- Configured Supabase project: `svdhghdinmxiqbxrewqi` / Project Prometheus.
- A direct call to the stable quota function using the configured public credentials reached Supabase but returned HTTP 401 / PostgreSQL `42501`, `permission denied for function maul_storage_limit_bytes`. No elevated database credentials were available in the application environment. This does not indicate that signed-in application requests lack access.
- The installed `supabase migration list --linked` launcher failed before contacting the database: `No matching Supabase CLI binary package found for win32-x64`. Migration application status remains unknown.
- The available in-app browser had no open tabs; Chrome was unavailable through the browser integration. No signed-in editor or dashboard session could be inspected.
- Read-only R2 inventory succeeded for the **configured development user**, not an independently verified affected production account. It returned 42 objects totaling **765,867,267 bytes (~730.39 MiB)** and **zero pending multipart uploads**, with neither listing truncated. These are physical stored objects, including any history or other objects under that user's prefix; they are not authoritative database-billed active usage.
- That physical total is above the original 500 MiB allowance and below 4 GiB. This supports checking an outdated allowance first, but does not prove the database total, affected account, or file size.
- The initial investigation performed no uploads, aborts, deletions, migrations, billing changes, or production code changes. The follow-up below makes scoped local code changes; no remote media or database mutations were performed.

## Independently reproduced cleanup defect

The real `app/api/user/storage/cleanup/route.ts` was transpiled and executed with injected Supabase and R2 transports. A session held 1 GiB and `maul_abort_source_upload` returned `{ error: { code: '42501', message: 'permission denied for function maul_abort_source_upload' } }`.

Observed response:

```json
{
  "success": true,
  "clearedSessionsCount": 1,
  "reclaimedReservationBytes": 1073741824,
  "currentUsedBytes": 0,
  "activeAssetsCount": 0
}
```

HTTP status was 200, no error was reported, and the route proceeded to its mocked R2 abort. The database abort did not succeed.

Cause: the handler awaits `supabase.rpc(...)` but does not inspect its returned `error`; `try/catch` only handles thrown exceptions. It increments reclaimed counts regardless. Its session query also ignores returned errors. The initiate route's automatic cleanup uses the same unchecked RPC-result pattern. This is a confirmed implementation defect and a possible reason repeated cleanup does not recover capacity, **not proof that the same RPC error occurred for this user's request**.

The frontend's automatic cleanup request also ignores HTTP failures and does not automatically retry the rejected upload afterward.

## Other accounting and validation limits

- `lib/r2/project-source-multipart.ts:109` queries all source assets and excludes the project being replaced, but does not filter superseded assets from other projects. The corrected October 18 SQL filters for current revisions. These two checks can disagree. This preliminary check has different error wording from the reported toast.
- All 18 tests in `tests/source-replacement-upload.test.ts` and `tests/multipart-upload-runtime.test.ts` passed. They verify client chunking, error propagation, editor callbacks, and local SQL allowance constants.
- The existing stale-session and quota-reclamation tests operate on local arrays; they do not execute the cleanup handler or a live database. Passing them does not disprove the cleanup defect above.
- The latest reservation function's argument types match its local GRANT/REVOKE signatures. This only verifies the current migration file, not deployment.

## Exact next evidence needed

Use the affected project URL/account and file size, together with either:

- The failed `/upload-multipart/initiate` or `/assets` response, especially `code` and `details`; or
- Run the accompanying **SELECT-only** `source-media-quota-diagnostic-2026-10-22.sql` in the affected Supabase project's SQL editor. Replace its user ID if the affected user differs from the configured development account, and supply the affected project ID and requested size to compare accounting.

The SQL reads live function definitions, the actual account allowance, asset totals, and pending reservations. It does not reclaim storage or change schema. A confirmed obsolete function would justify deploying the existing reviewed quota migration; confirmed abandoned reservations would justify a scoped recovery. Neither action should be inferred from this report alone.

Official access reference: [Supabase Management API authentication](https://supabase.com/docs/reference/api/introduction), [read-only SQL endpoint](https://supabase.com/docs/reference/api/v1-read-only-query).

## Follow-up: demonstrated defects repaired locally

Branch: `codex/source-media-quota-recovery`. This section supersedes the implementation status described in the initial investigation above.

The regression suite executes the production cleanup handler, initiation handler, and upload-context function. It substitutes only the database, R2, and framework boundaries, and its database fixtures apply the handlers' actual query filters. Against the original implementation, 9 of 13 cases failed with the expected assertions; 4 controls passed. After the changes, all 13 cases passed.

Changes:

- Cleanup checks both database query errors and RPC-returned errors. It counts reclaimed reservations only after the RPC confirms `status = 'aborted'`; it preserves a source when a concurrent commit wins. Partial failures return `success: false` and HTTP 500. An unavailable storage summary is reported as unknown rather than zero.
- Cleanup accepts an optional validated `projectId`. Scoped cleanup targets only that user's sessions in that project. Existing no-body callers can only clean expired sessions, so an automatic quota response cannot cancel unrelated in-progress work.
- Initiation checks cleanup query/RPC results before sending R2 aborts, handles the committed-session race, and scopes its quota-recovery pass to the affected project.
- Upload preflight and the cleanup storage summary select only assets with current source revisions, matching the corrected SQL accounting. The source being replaced remains excluded from replacement preflight.

Verification obtained so far:

- New real-handler regression suite: 13 passed, 0 failed.
- Existing upload/replacement/ownership/transcript-sequencing checks: 20 passed, 0 failed.
- Lint for all three changed production files and the new tests: exit 0, no output.
- Full application typecheck: exit 0, `typecheck passed`.
- The corrected `source_assets` / `source_revisions!inner(state)` query was accepted by the configured live Supabase REST API: HTTP 200, zero rows requested and returned. This verifies the deployed relationship supports the query; it reveals no account's usage or allowance.
- Windows credential metadata contained no matching Supabase CLI login entry. No CLI binary was downloaded or installed. Public-credential denial of the quota function remains the access limit.

The production build and the Unlazy acceptance ledger are recorded separately in `GATES-source-media-quota-recovery.md`. A passing local suite and a valid live query do **not** establish that the affected live account's original quota failure is resolved. That requires its authenticated allowance/reservation totals and original upload response. No schema, billing tier, authentication logic, or editor-page code was changed.

### Validation environment

The host supplies `NODE_OPTIONS=--max-old-space-size=512`. Node reported a 738,197,504-byte total V8 heap limit with that setting. A serialized build attempt aborted in the build worker with exit 134 during compilation. The successful isolated build used a temporary 4,096 MiB old-space allowance and captured its complete output in `.tmp/source-media-quota/build-worktree.log`; the project already grants its typecheck process a 4,096 MiB allowance. This is confined to the validation command and changes no application configuration or database limit. [Next.js memory diagnostics](https://nextjs.org/docs/app/guides/memory-usage) describes the supported build-memory tooling.

The first build's log reached the route summary and successful postbuild bypass-token check. A concurrent gate attempt encountered its still-held lock; the final command is serialized to avoid that overlap. The scoped lint command itself exited zero, but an empty-output regex expectation timed out in the gate tool; using ESLint's JSON output fixed the verification oracle without changing application code.

A fresh browser-session check during this follow-up again found no available editor or Supabase page. The live-account access limitation remains unchanged.

### Test integration and additional access checks

The normal `npm run test:source-upload` command now includes the 13 real-handler regressions alongside the original 18 upload tests. Both pull-request and main-branch CI path filters include the handlers and new test file. The workflow YAML was parsed successfully and its relevant triggers and test command were checked. Unsupported-file validation is tested separately from quota rejection; the reported toast does not identify an unsupported format.

The existing Vercel CLI was used to list production environment-variable metadata for the linked project. It returned `Could not retrieve Project Settings` and exit 1, so no production settings or credentials were obtained. No Vercel configuration was changed.

A second read-only R2 listing separated the configured development user's stored objects by path and filename extension: **28 `.mp4` objects totaling 765,643,348 bytes** and **14 `.json` objects totaling 223,919 bytes**. All 42 were under project source paths; no export or other user-object paths appeared. This is stored source media/JSON, rather than application source-code files in that prefix. The listing inspected metadata without downloading or validating media contents. It still does not establish which revisions are current in PostgreSQL or identify the affected production account.

Concurrent unrelated edits appeared in the shared workspace during verification, including UI and dependency changes. This task's package change is the upload test-script addition; it did not add dependencies or edit the lockfile. Those unrelated changes were preserved. The final build runs in the temporary detached checkout `.tmp/quota-validation-01a1618d`, with the three runtime fixes, new tests, test integration, existing local environment, and existing dependencies. Its build output is separate from the shared `.next` directory. The command grants 4,096 MiB old space and a one-hour validator timeout; the earlier completed build's final log arrived after its 30-minute validator timeout, so its full process exit was not certified by that attempt.

The isolated production build subsequently **passed with exit 0**, including compilation, page generation, and the postbuild bypass-token check. The normal upload test command also passed with exit 0, running **31 tests** including the 13 handler regressions. Together with the two separate ownership/sequencing script checks, **33 distinct checks passed**. The runtime, test, package, and workflow files were compared byte-for-byte against the successful build snapshot and matched. These local results do not resolve the outstanding authenticated live-account check.

### Final repository lint result and handoff

The full lint retry completed on the isolated checkout with a 4,096 MiB allowance. ESLint returned exit 1 across **1,259 files: 10 errors, 81 warnings, zero fatal errors**. All three changed runtime files and the new handler test have **zero errors and zero warnings**. The errors are in seven unchanged baseline files: `components/editor/LiquidCarveButton.tsx`, `components/mini-run/mini-run-comparison.tsx`, `components/navigation/jarvis-top-nav-filament.tsx`, `components/projects/project-details-modal.tsx`, `public/scripts/liquidGL.js`, `tests/editorial-split-persistence.test.ts`, and `tests/safe-response-and-sanitizer.test.mjs`. None appears in the isolated checkout's modified or untracked file list. These unrelated findings were preserved. The completed retry supersedes the earlier full-lint handoff; it does not make repository-wide lint green.

The acceptance ledger now records **8 met, 0 unmet, and 1 abandoned gate**. The outstanding handoff is G6: authenticate the affected account and inspect its failed request or SELECT-only database results. The exact original live quota condition and recovery remain unverified. No production deployment, migration, remote upload, media deletion, reservation cancellation, or plan change was performed.
