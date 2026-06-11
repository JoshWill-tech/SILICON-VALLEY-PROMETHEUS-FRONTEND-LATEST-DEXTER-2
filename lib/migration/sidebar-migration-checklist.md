# Sidebar v2 Migration Checklist
Date: 2026-06-08

## Scope
This migration wires the additive sidebar work into dashboard/editor v2 route surfaces without changing live route files.

## Files Added
- `app/(dashboard)/page-v2.tsx`
- `app/(dashboard)/editor/layout-v2.tsx`
- `lib/migration/sidebar-migration-checklist.md`

## Existing Components Used
- `components/dashboard/mobile-sidebar.tsx`
- `components/dashboard/mobile-nav-item.tsx`
- `components/ui/hamburger-icon.tsx`
- `components/editor/sidebar/editor-sidebar-v2.tsx`
- `components/editor/sidebar/editor-sidebar-media-drawers-v2.tsx`
- `components/editor/editor-route-shell-media-v2.tsx`
- `hooks/use-editor-session.ts`

## Dashboard Swap
1. Current live route: `app/dashboard/page.tsx`.
2. Review `app/(dashboard)/page-v2.tsx`.
3. To activate, create a routed copy at `app/dashboard/page-v2.tsx` or replace `app/dashboard/page.tsx` after approval.
4. Keep desktop sidebar behavior from `AwwwardsSidebar`.
5. Keep mobile drawer under `lg:hidden`.
6. Wire the `prometheus:dashboard:new-project` event to the real dashboard project creation modal when that modal exists.

## Editor Swap
1. Current live route shell: `app/editor/layout.tsx`.
2. Current live shell component: `components/editor/EditorRouteShell.tsx`.
3. V2 shell component: `components/editor/editor-route-shell-media-v2.tsx`.
4. V2 additive layout: `app/(dashboard)/editor/layout-v2.tsx`.
5. To activate, replace the live layout import from `EditorRouteShell` to `EditorRouteShellMediaV2`, or copy `layout-v2.tsx` into `app/editor/layout.tsx` after approval.
6. Do not delete `EditorRouteShell` or `AwwwardsSidebar`; mark them deprecated after production smoke tests.

## Navigation Verification
| Surface | Item | Expected route/action | Implementation |
|---------|------|-----------------------|----------------|
| Editor sidebar v2 | Projects | `/projects` | `router.push('/projects')` |
| Editor sidebar v2 | Studio | `/studio` | `router.push('/studio')` |
| Editor sidebar v2 | Settings | `/settings` | `router.push('/settings')` |
| Editor sidebar v2 | Motion | mobile/tablet drawer, desktop tab focus | `EditorSidebarMediaDrawersV2` |
| Editor sidebar v2 | Music | mobile/tablet drawer, desktop tab focus | `EditorSidebarMediaDrawersV2` |
| Editor sidebar v2 | Export | export workflow event/callback | `prometheus:editor:start-export` fallback |
| Editor sidebar v2 | New Project | project creation event/callback | `prometheus:editor:new-project` fallback |
| Dashboard mobile | Dashboard | `/dashboard` | `router.push('/dashboard')` |
| Dashboard mobile | Projects | `/projects` | `router.push('/projects')` |
| Dashboard mobile | Studio | `/studio` | `router.push('/studio')` |
| Dashboard mobile | Editor | `/editor` | `router.push('/editor')` |
| Dashboard mobile | Settings | `/settings` | `router.push('/settings')` |
| Dashboard mobile | Profile | `/settings/profile` | `router.push('/settings/profile')` |

## Session Persistence Manual Test
1. Open `/editor`.
2. Load a source video and seek to `00:45`.
3. Switch to a second browser tab.
4. Return to `/editor`.
5. Confirm video time remains near `00:45`.
6. Confirm active tab restores.
7. Confirm sidebar open/collapsed state restores.
8. Confirm scroll position restores.
9. Confirm selected element is marked/restored if it still exists.

## Responsive Verification
| Viewport | Expected behavior |
|----------|-------------------|
| 375px iPhone | Dashboard mobile hamburger visible; desktop sidebar hidden; drawer overlays content. |
| 768px iPad | Editor sidebar uses overlay behavior; dashboard mobile sidebar remains available below `lg`. |
| 1024px laptop | Editor sidebar persistent icon-only; dashboard desktop sidebar visible. |
| 1440px desktop | Editor sidebar expanded by default and collapsible; dashboard desktop sidebar visible. |
| 1920px monitor | Editor sidebar expanded; all nav labels visible. |

## Activation Notes
- The repository currently uses `app/dashboard/page.tsx` and `app/editor/layout.tsx`, not a routed `app/(dashboard)` group.
- The `app/(dashboard)` files are migration references and will not become live routes until copied into the active route paths.
- `npm run build` requires valid Supabase env vars. Use Vercel project env vars for production validation.
