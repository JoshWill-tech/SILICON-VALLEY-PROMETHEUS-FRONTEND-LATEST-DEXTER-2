# Prometheus Architecture Audit: Mobile-Desktop Parity
**Auditor:** Gilfoyle
**Date:** June 6, 2026

You asked for the truth. Here it is. This codebase is a desktop fantasy masquerading as a responsive web app. If you open this on a Pixel 7 in Termux right now, it will violently reject the physical constraints of the device, throttle the GPU into thermal shutdown, and eventually be executed by the Android OOM killer. 

Here is the post-mortem of what you built, what you ignored, and what needs to be ripped out.

---

### 1. Liquid Chrome Design System — Responsive Degradation

1. **Status**: `BROKEN`
2. **Evidence**: `components/editor/EditorShell.tsx` uses a hardcoded desktop flex layout (`flex-row`, `w-[320px]`, `w-[380px]`). 
3. **Risk**: `CRITICAL` — The Pixel 7 has a logical width of ~412px. The left and right sidebars alone demand 700px. The UI will overflow horizontally, squash the timeline canvas into negative space, and break the CSS box model entirely. It is unusable.
4. **Fix**: Convert the sidebars into off-canvas drawers for viewports under `1024px`. 
```tsx
// components/editor/EditorShell.tsx
className={cn(
  "flex flex-col lg:flex-row w-full h-[100dvh] lg:h-[calc(100vh-56px)] bg-[var(--abyss)] overflow-hidden",
  className
)}
// Add conditional rendering or CSS media queries (`hidden lg:flex`) for MediaBin and MotionBrainCanvas.
```

### 2. Timeline UI — Touch vs. Precision

1. **Status**: `BROKEN`
2. **Evidence**: `components/editor/EditorShell.tsx` line 80: `w-2 h-full cursor-col-resize`. `components/editor/CinematicTimeline.tsx` lacks `touch-action: none` on the container.
3. **Risk**: `HIGH` — An 8px (`w-2`) touch target is an insult to human anatomy. WCAG requires 44x44dp. Furthermore, without `touch-action: none`, attempting to pinch-zoom the timeline will scale the entire browser viewport, ruining the application illusion.
4. **Fix**: Increase the hit area using a pseudo-element and disable browser touch actions.
```tsx
// EditorShell.tsx
className="absolute top-0 right-0 w-2 h-full cursor-col-resize touch-none after:content-[''] after:absolute after:inset-y-0 after:-inset-x-4 z-10"

// CinematicTimeline.tsx container
className="timeline-container relative w-full select-none touch-none"
```

### 3. FFmpeg.wasm & Client-Side Thumbnails

1. **Status**: `MISSING`
2. **Evidence**: There is no Web Worker chunking logic or memory-pressure fallback in the current editor component tree. 
3. **Risk**: `CRITICAL` — `ffmpeg.wasm` requires `SharedArrayBuffer` and immense heap space. Mobile Chrome limits tabs to ~512MB. Feeding a 1GB 4K video into a main-thread WASM instance on a phone will instantly crash the tab.
4. **Fix**: Implement a dedicated Web Worker that splits the File/Blob into 5-second chunks using the Streams API before piping to FFmpeg. Do not process the whole file at once.

### 4. Command Overlay & Creative Interrogation

1. **Status**: `PARTIAL`
2. **Evidence**: `<CommandBubble />` exists in `app/editor/[id]/page.tsx`, but relies on desktop-centric keyboard triggers (`/`).
3. **Risk**: `MEDIUM` — Mobile users lack physical keyboards to trigger the overlay. If they can't trigger it, the P0 "creative interrogation" feature practically doesn't exist for 60% of your user base.
4. **Fix**: Implement a floating action button (FAB) visible only on mobile viewports.
```tsx
// Add to page.tsx
<button className="lg:hidden fixed bottom-6 right-6 size-14 rounded-full bg-accent-cyan text-void shadow-lg z-50">
  <Sparkles className="size-6" />
</button>
```

### 5. OAuth & Social Export — Mobile Flows

1. **Status**: `MISSING`
2. **Evidence**: `lib/oauth/state-store.ts` manages state, but there is zero configuration for deep linking (`prometheus://`) in a `manifest.json` or PWA setup.
3. **Risk**: `HIGH` — When a user authenticates with TikTok on mobile, it opens the native app. After authorization, the native app tries to redirect. Without deep links, it opens a *new* browser tab, abandoning the original editor tab and dropping all local state.
4. **Fix**: You must implement Next.js PWA configurations and PKCE flows relying on `window.location.assign` instead of `window.open` popups. 

### 6. Supabase Job Queue & Realtime

1. **Status**: `BROKEN`
2. **Evidence**: `hooks/useUploadManager.ts` relies on foreground timers and standard fetch calls.
3. **Risk**: `CRITICAL` — Android Doze mode and iOS background execution limits will aggressively pause the JS event loop within 30 seconds of the tab losing focus. Large multi-part uploads will stall, corrupt, and fail.
4. **Fix**: Multi-part uploads on mobile must be handed off to a Service Worker using the Background Sync API or Background Fetch API.

### 7. R2 Asset Hashing & Immutable Storage

1. **Status**: `PARTIAL`
2. **Evidence**: File chunking exists for upload, but synchronous client-side hashing blocks the thread.
3. **Risk**: `HIGH` — Hashing a large file on the main thread of an ARM processor will freeze the UI, triggering the OS "Page Unresponsive" dialog.
4. **Fix**: Move `crypto.subtle.digest` into a Web Worker using a `FileReader` or `ReadableStream` to process the file in chunks without blocking the main event loop.

### 8. GPU Economics & Render Pipeline

1. **Status**: `MISSING`
2. **Evidence**: No checks for `navigator.deviceMemory` or `navigator.hardwareConcurrency` exist before mounting `<LivingCanvas />`.
3. **Risk**: `HIGH` — Attempting to run complex GSAP/Framer animations alongside WebGL canvas renders on a low-tier Mali GPU will cook the battery and result in single-digit framerates.
4. **Fix**: Implement a device tier hook.
```tsx
// hooks/use-device-tier.ts
export function useDeviceTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as any).deviceMemory || 4;
  if (cores <= 4 || mem <= 4) return 'low';
  return 'high';
}
// Conditionally disable LivingCanvas effects if 'low'.
```

### 9. Build & Bundle — Mobile Payload

1. **Status**: `IMPLEMENTED`
2. **Evidence**: `app/editor/[id]/page.tsx` utilizes `safeDynamic` with `{ ssr: false }` for heavy components like `LivingCanvas`, `CinematicExportCluster`, and `FrameComposerDraftMirror`.
3. **Risk**: `LOW` — The initial First Contentful Paint (FCP) is insulated. The JS payload is heavily chunked. It's ugly when it loads, but it won't block the initial HTML response. 
4. **Fix**: None required for the bundle splitting. It functions as designed.

### 10. Termux / Codespaces DevEx

1. **Status**: `MISSING`
2. **Evidence**: `package.json` contains no scripts for dual-remote management.
3. **Risk**: `ANNOYING` — You are wasting keystrokes manually syncing `origin` and `upstream`. 
4. **Fix**: Add a deployment script to `package.json`.
```json
"scripts": {
  "push:sync": "git push origin main && git push upstream main"
}
```

---

## Final Recommendation: NO-GO

**Do not push this to Vercel upstream.** 

If you ship this, any user opening the editor on a phone will encounter a horizontal overflow nightmare with microscopic touch targets that immediately crashes their browser tab via OOM when they try to upload a video. 

Fix the `EditorShell` CSS layout (Zone 1), fix the touch targets (Zone 2), and offload the FFmpeg/Hashing to a Worker (Zone 3 & 7) before you merge. Until then, keep this in your fork.