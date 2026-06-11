# Backend-Ready Placeholder Replacement Checklist
Date: 2026-06-08

## Scope
This phase is additive. Old mock-backed components remain in place until Joshua approves the v2 replacements in production.

## New Backend-Ready Files
- `hooks/use-project-v2.ts`
- `hooks/use-projects-list.ts`
- `hooks/use-source-assets.ts`
- `hooks/use-music-catalog.ts`
- `hooks/use-user-connections.ts`
- `hooks/use-profile.ts`
- `hooks/use-durable-jobs.ts`
- `components/editor/staging/motion-brain-staging.tsx`
- `components/editor/staging/social-posting-staging.tsx`
- `components/editor/a11y/accessible-label.tsx`
- `components/editor/MediaBinV2.tsx`
- `components/editor/MotionBrainPanelV2.tsx`
- `components/editor/SocialPostingPanelV2.tsx`
- `components/dashboard/dashboard-mobile-sidebar-profile-v2.tsx`

## Supabase Tables Used Now
| Hook | Table | Purpose |
|------|-------|---------|
| `useProjectV2` | `projects` | Load one real project by id. |
| `useProjectsList` | `projects` | Load recent projects for editor redirects. |
| `useSourceAssets` | `source_assets` | Load real uploaded media and storage usage. |
| `useMusicCatalog` | `track_metadata` | Load real music catalog metadata. |
| `useUserConnections` | `user_connections` | Load OAuth-connected publishing platforms. |
| `useProfile` | `profiles` | Load authenticated user profile. |
| `useDurableJobs` | `durable_jobs` | Read status only; no fake progress. |

## Required Supabase Assumptions
- Tables are exposed to the Supabase Data API for authenticated users.
- RLS policies allow users to read only their own rows.
- Frontend uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- No service role key is used in client hooks.

## Project Replacement
1. Replace mock project reads in `hooks/use-editor-state.ts` with `useProjectV2(projectId)` in a v2 editor shell.
2. Replace `app/editor/page.tsx` redirect fallback with `useProjectsList()`.
3. Redirect to the most recent real project if one exists.
4. Redirect to `/projects` if no project exists.
5. Replace every `Untitled Project` production fallback with `getProjectDisplayTitle(project)`.
6. Keep honest fallback text as `Untitled` only when a real project row has no title/name.

## Source Assets Replacement
1. Swap `MediaBin` to `MediaBinV2` in the approved editor v2 shell.
2. Pass the real `projectId` prop.
3. `MediaBinV2` uses `useSourceAssets(projectId)`.
4. `MediaBinV2` renders `getSourceAssetDisplayName(asset)`.
5. `MediaBinV2` uses `formatBytes(asset.size_bytes ?? 0)` for file size.
6. `MediaBinV2` uses `storageUsedLabel` and `storageQuotaLabel`; it does not show fake `4.2GB / 100GB`.
7. Empty state: `No media yet. Upload your first asset.`
8. `Syncing...` appears only when `durable_jobs` includes an active upload job.

## Music Catalog Replacement
1. Current music code uses local catalog/API layers; this checklist adds `useMusicCatalog()` for direct `track_metadata` reads.
2. Keep existing music layout unchanged.
3. In a v2 wrapper, map `TrackMetadataV2` rows into the existing music component shape.
4. Preserve search UI but add a durable label with `AccessibleLabel`.

## User Connections Replacement
1. Swap mock posting surfaces to `SocialPostingPanelV2`.
2. `SocialPostingPanelV2` uses `useUserConnections()`.
3. Connected platforms show `Ready to post`.
4. Unconnected platforms show `Connect [Platform]`.
5. Facebook or other rejected platforms use `reviewPending: true` in `SocialPostingStaging`.
6. Disable the post button until at least one supported platform is connected.
7. The v2 panel contains no mock URLs and no mock captions.

## Profile Replacement
1. Swap `DashboardMobileSidebar` to `DashboardMobileSidebarProfileV2` in the approved dashboard v2 page.
2. `DashboardMobileSidebarProfileV2` uses `useProfile()`.
3. It passes `displayName` and `profile.email` into `DashboardMobileSidebar`.
4. Use the same hook in editor sidebar account footer when that footer is added.
5. Use the same hook in a v2 settings profile form.

## Motion Brain Staging
1. Swap demo Motion Brain surfaces to `MotionBrainPanelV2`.
2. `MotionBrainPanelV2` wraps `MotionBrainStaging`.
3. Do not query `motion_knowledge_base` until Motion Brain is operational.
4. `MotionBrainPanelV2` does not show hardcoded metrics such as `4K ProRes`, `Detected 12 semantic anchors`, or fake noise-floor readings.
5. `MotionBrainPanelV2` does not show hardcoded beats/vectors.

## Durable Jobs Staging
1. Use `useDurableJobs(projectId)` for status-only reads.
2. If no job exists, display `Ready to process`.
3. If a job exists, display its real status.
4. If the status cannot be determined, display `Processing status unavailable`.
5. Do not render fake percentages.

## Accessibility Label Replacement
Use `AccessibleLabel` in v2 components:

| Existing file | Existing placeholder | V2 label |
|---------------|----------------------|----------|
| `preview-feedback-shell.tsx` | `e.g. 0:15 or 1:20-1:30` | `Timestamp or range` |
| `preview-feedback-shell.tsx` | `Tell Prometheus exactly what felt off...` | `Feedback notes` |
| `CommandBubble.tsx` | `Describe how you want to modify this segment...` | `Describe your edit` |
| `command-overlay-shell.tsx` | Creative direction example | `Creative direction` |
| `command-overlay-shell.tsx` | Strategic notes example | `Strategic notes` |
| `motion-property-canvas.tsx` | `Describe the motion change...` | `Motion note` |
| `chat-workspace-panel.tsx` | `Describe an edit or ask for music...` | `Editor command` |
| `music-tab-panel.tsx` | `Search title or artist` | `Search music catalog` |

## Deprecation After V2 Approval
- Deprecate `hooks/use-editor-state.ts` mock reads after `useProjectV2` and `useDurableJobs` are live.
- Deprecate `lib/mock/index.ts` for production editor paths after upload/job/project flows are verified.
- Deprecate current `MediaBin.tsx` after `MediaBinV2` ships.
- Deprecate demo Motion Brain components after `MotionBrainStaging` is live.
- Deprecate mock social posting code after `SocialPostingStaging` or real posting UI is live.

## Exact Swap Targets
| Current production surface | Approved v2 replacement |
|----------------------------|--------------------------|
| `components/editor/MediaBin.tsx` | `components/editor/MediaBinV2.tsx` |
| `components/editor/MotionBrainPanel.tsx` | `components/editor/MotionBrainPanelV2.tsx` |
| Mock social posting surfaces in `app/editor/[id]/page.tsx` | `components/editor/SocialPostingPanelV2.tsx` |
| `components/dashboard/mobile-sidebar.tsx` when profile data is required | `components/dashboard/dashboard-mobile-sidebar-profile-v2.tsx` |
