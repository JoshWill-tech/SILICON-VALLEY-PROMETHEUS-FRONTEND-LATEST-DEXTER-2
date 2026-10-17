# Mobile editorial workspace: investigation and plan

Date: 2026-10-17

## Findings

- `MobileEditorView` maps both the Editor and Motion workspaces to its Motion tab. Editorial chat requires an extra switch, and the persistent source preview duplicates the Motion canvas preview.
- Source assessment also switched to Motion as soon as cut-ready pauses were found. Replace that background navigation with an explicit "Review in Motion" notification action.
- The mobile Export view uses the full `EditorialDeliveryStudio`. Its source and finished players omit `VideoReviewProvider`, `VideoAnnotateButton`, and review downloads. Those controls exist only in the separate comparison presentation.
- The fixed preview and horizontal navigation consume much of a phone's height. Tab targets are small, the active content has little hierarchy, and preview duplication makes the workspace feel crowded.

## Smallest safe plan

1. Route Editor to Editorial chat and reserve Motion for an explicit Motion selection. Keep external music and export actions working.
2. Show a single preview per workspace. Give Editorial a compact screening area and let Motion and Export own their players.
3. Add the existing, locally persisted frame correction tools and review downloads to the full render studio. Reuse the same review storage identity as desktop comparison.
4. Use scoped CSS for a dark screening-room composition, clear selected tabs, 44px touch targets, safe-area padding, and compact landscape behavior. Preserve existing brand colors and respect reduced motion.
5. Test actual production components in an isolated browser fixture with deterministic media and service responses. Check narrow phones, landscape, and a wide touch viewport that represents phone desktop mode; run project checks and relevant regressions.

## Strategic sign-off

Status: APPROVED for this scoped repair. This restores essential mobile editing and review functions. Keep API, authentication, render submission, upload behavior, and database contracts intact. Use existing dependencies and annotation storage; do not add costly visual effects. Existing branch: `codex/fix-large-source-replacement`; existing upload edits must be preserved. No commit, push, or deployment is part of this request.

## Verification

- Navigation regression: the original editor failed the Editorial default check. The current component passes workspace separation, single-preview behavior, external Music/Export navigation, and an explicit-action check for background source assessment.
- Browser proof uses production mobile navigation, MobileVideoPlayer, MotionPropertyCanvas, EditorialDeliveryStudio, and annotation components. Chat/music services and backend timeline/history responses are isolated. This does not validate a signed-in production session, a real render submission, or microphone transcription.
- Touch viewport coverage: 390x844, 320x568, 844x390, 980x740 (phone desktop mode), and 1280x800. Saved typed corrections, captured PNGs, exported render-bound JSON, recovered after reload, added a second note to the same frame, and recovered the review in comparison view. All tested correction controls are 44x44px, note text is 16px, and no horizontal page overflow or page errors were recorded.
- Motion visual review caught its default collapsed 40dvh inspector sheet leaving most of the screen empty. Scoped styles now embed it at full tab size and hide the sheet drag handle. The browser test checks its position and height.
- Both the initial and final typechecks passed. Changed-file lint passed with zero errors and 13 existing warnings (12 in the editor page, one image warning in the Motion canvas). Repository-wide lint reports 5 existing errors and 77 warnings in other test files.
- Existing render, annotation, workspace, and source-upload regressions: 24 passed; one pre-existing chat test fails because `components/editor/PrometheusChat.tsx` no longer references `AIChatStreamingText`. That component has no changes in this task.
- Default-heap production build exhausted memory. The 8GB retry compiled successfully in 26.7 minutes and generated all 98 static pages. Final deployment trace collection is still being checked. The emitted production CSS contains the new embedded Motion layout selector.

## Artifacts

- `artifacts/mobile-editor-proof/verification.json`: viewport measurements and browser error results.
- `artifacts/mobile-editor-proof/motion-phone.png`: full-height Motion workspace.
- `artifacts/mobile-editor-proof/render-corrections-phone.png`: rendered player and correction input below the picture.
- `artifacts/mobile-editor-proof/frame-correction-phone.png`: captured-frame correction editor.
- Additional screenshots cover small phone, landscape, phone desktop mode, and wide touch layouts.
- `render-corrections.json` and `marked-render-corrections.json` contain only local fixture data.

## Scope and review

Production changes are limited to the editor route's mobile navigation and source-assessment notification, the render studio, an optional inline placement for existing review controls, two Motion DOM attributes, and a scoped responsive stylesheet. Existing upload, thumbnail, render API, and voice edits in the shared workspace are preserved. No dependencies, backend contracts, authentication, storage schema, or brand tokens were changed by this task. No commit, push, or deployment was performed.
