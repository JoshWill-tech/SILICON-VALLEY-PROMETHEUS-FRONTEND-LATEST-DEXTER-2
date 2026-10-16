# Gates: frontend complaint remediation

OWNS: app/editor/[id]/page.tsx, lib/editor/**, hooks/use-editorial-timeline.ts, hooks/use-timeline-tools.ts, components/editor/**, app/settings/social-accounts/page.tsx, app/api/prometheus-chat/**, tests/**

Scope: Resolve the frontend complaints in the October 15 functional editor report while retaining reported working behavior and existing workspace work.

- [x] G1: Splitting in both editor timelines creates a saved source-bound boundary; Motion undo and redo restore it
  CHECK: node --import tsx --test tests/editorial-split-persistence.test.ts
  EXPECT: # fail 0
  EVIDENCE: 3 tests pass. Persistence/replacement and split boundaries pass; a mounted Motion timeline-tools hook applies a controlled split, enables undo/redo, and restores the boundary in both directions.

- [x] G2: Reference look returns a useful error on non-JSON and unsuccessful responses
  CHECK: node --import tsx --test tests/style-clone-response.test.ts
  EXPECT: # fail 0
  EVIDENCE: 2 focused response tests pass (HTML error, JSON service error, valid analysis).

- [x] G3: The volume control remains interactive through pointer and keyboard adjustment
  CHECK: npm.cmd exec -- tsx --test tests/video-volume-interaction.test.tsx
  EXPECT: # fail 0
  EVIDENCE: The accessible 0–100% range remains mounted, dispatches an adjusted 65% value, and keeps controls available during keyboard focus; 1 focused test passes.

- [x] G4: Each Jarvis command produces a tracked action, concrete proposal, or visible blocker
  CHECK: node --import tsx --test tests/jarvis-complaint-actions.test.ts
  EXPECT: # fail 0
  EVIDENCE: The focused regression verifies machine-readable caption, silence-cut, soundtrack-selection, and thumbnail actions; confirms the conflicting proposal-only tool instruction is gone; and checks Auto-Cut routes to the tracked silence workflow. 2 tests pass.

- [ ] G5: Clean-footage captions have the approved manual or imported path and clear automatic-transcription costs
  CHECK: node --import tsx --test tests/editor-caption-access.test.ts tests/editor-transcription-quote.test.ts
  EXPECT: # fail 0
  EVIDENCE: A manual three-second playhead cue, four persistent styles, and a Jarvis request_transcription action are implemented. Four local tests verify source-bound cue state, quote display, zero-credit blocking before submission, and explicit confirmation. Funded ASR response/reload and final rendered caption parity remain unverified.

- [ ] G6: Configured social connections report actionable OAuth success, cancellation, and failure outcomes
  CHECK: node --import tsx --test tests/social-connect-feedback.test.ts
  EXPECT: # fail 0
  EVIDENCE: The button now shows pending state, obtains an authorization URL through the JSON initiate route, and reports unavailable, canceled, invalid-state, and general failure outcomes; 1 local source regression passes. Configured-provider sandbox authorization and persisted callback connection remain unverified.

- [ ] G7: Thumbnail generation and uploaded-project covers settle into success, failure, cancellation, or a safe fallback
  CHECK: node --import tsx --test tests/thumbnail-complaint-outcomes.test.ts
  EXPECT: # fail 0
  EVIDENCE: Current source already has a 240-second provider timeout, a 285-second client timeout, abort handling, preserved prior variants, and a project-card fallback. No new generation or durable-cover behavior was changed in this pass; success, retry, cancellation, and uploaded-cover persistence still need a controlled runtime test.

- [ ] G8: The export dialog reflects supported output, authoritative cost, confirmation, and saved edits
  CHECK: node --import tsx --test tests/editorial-export-contract.test.ts
  EXPECT: # fail 0
  EVIDENCE: Current Mini-Run readiness reports `timelineApplied: false`, and the submission path does not reserve or charge the `export` quote. A frontend quote/confirmation would therefore misstate the billing and output contract; edited rendering and authoritative quote need the render-service contract/D2 decision.

- [ ] G9: Reported working controls and cleanup behavior still pass focused regression coverage
  CHECK: node --import tsx --test tests/frontend-complaint-regressions.test.ts
  EXPECT: # fail 0
  EVIDENCE: pending
