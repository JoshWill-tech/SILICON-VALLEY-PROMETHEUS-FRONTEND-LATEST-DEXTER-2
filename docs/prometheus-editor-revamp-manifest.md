# Prometheus Editor Revamp Manifest

Generated: 2026-06-07

## Audited File Inventory

This manifest records the actual repo state after Revamp 01-17. The pasted Revamp 08 spec says 27 files, but only lists 24 concrete paths. The implementation has 53 revamp-relevant files when the repo-specific wrapper, workspace alias, touched project editor route, settings modal, keyboard shortcut handler, dashboard rotation files, mobile landing files, premium sidebar, dashboard integration hook, contextual event hooks, Vercel runtime config, deployment checklist, and pricing mobile scroll fix are included.

## Config And Styles

- `tailwind.config.ts`
- `app/globals.css`
- `vercel.json`
- `docs/vercel-deployment-checklist.md`

## Routes And Layout

- `app/pricing/page.tsx`
- `app/editor/layout.tsx`
- `app/editor/page.tsx`
- `app/editor/loading.tsx`
- `app/editor/workspace/page.tsx`
- `app/editor/[id]/page.tsx`

## Shell And Persistent UI

- `components/prometheus-shell.tsx`
- `components/editor/EditorProvider.tsx`
- `components/editor/EditorRouteShell.tsx`
- `components/editor/EditorShell.tsx`
- `components/editor/EditorTopBar.tsx`
- `components/editor/EditorSidebar.tsx`
- `components/editor/CommandZone.tsx`
- `components/editor/FocusModeToggle.tsx`
- `components/editor/KeyboardShortcuts.tsx`
- `components/editor/SettingsPanel.tsx`

## Workspace Canvas

- `components/editor/WorkspaceCanvas.tsx`
- `components/editor/TimelineRuler.tsx`
- `components/editor/Playhead.tsx`
- `components/editor/TranscriptStrip.tsx`
- `components/editor/AnimationTrack.tsx`

## Motion Brain

- `components/editor/MotionBrainPanel.tsx`
- `components/editor/BeatMapper.tsx`
- `components/editor/SemanticVectorGrid.tsx`

## Liquid Chrome Effects

- `components/editor/LiquidChromeOrb.tsx`
- `components/editor/ShimmerBorder.tsx`
- `components/editor/GlassTiltCard.tsx`
- `components/editor/ChromeText.tsx`
- `components/editor/AmbientGlow.tsx`

## Dashboard Rotation

- `hooks/useDashboardRotation.ts`
- `hooks/useMediaQuery.ts`
- `hooks/useContextualFlags.ts`
- `hooks/useActivityDetector.ts`
- `hooks/usePasteDetector.ts`
- `hooks/useProjectLifecycle.ts`
- `app/dashboard/page.tsx`
- `components/dashboard/DashboardRotator.tsx`
- `components/dashboard/PinButton.tsx`
- `components/dashboard/views/ExistingDashboard.tsx`
- `components/dashboard/views/GeometricWorkspace.tsx`
- `components/dashboard/views/BlobGreeting.tsx`
- `components/dashboard/views/CinematicMorning.tsx`

## Mobile Landing

- `hooks/useDeviceTier.ts`
- `app/mobile/page.tsx`
- `components/mobile/MobileLanding.tsx`
- `components/mobile/AnimatedBlobMobile.tsx`
- `components/mobile/MobileMenu.tsx`
- `components/mobile/CommandPalette.tsx`

## Premium Sidebar

- `components/sidebar/AwwwardsSidebar.tsx`

## Verification Notes

- `app/editor/page.tsx` is the primary assembly route.
- `app/editor/workspace/page.tsx` re-exports `app/editor/page.tsx` to avoid divergent integration pages.
- `EditorRouteShell` wraps editor routes because the existing `EditorShell` is the legacy full workspace component and was preserved.
- `components/editor/TimelineRuler.tsx` and `components/editor/Playhead.tsx` preserve their existing context-driven APIs while adding controlled prop modes for the revamp timeline.
- `bg-glass-bg` and `text-glass-bg` are not allowed in app/component source. Use `glass-panel` instead.
