# Gates: Chat and clip pipeline routing

OWNS: app/editor/[id]/page.tsx, GATES-chat-pipeline-routing.md

Scope: Route natural-language chat edit and clipping requests through the editor's existing persisted edit and backend clip workflows.

- [x] G1: A natural-language clip request starts the same backend clip job as the clip button and preserves the requested brief.
  EVIDENCE: Source review confirms chat passes the user's prompt into the shared clip handler; the clip button calls that handler without an override. The same handler passes the prompt to `startViralClipJob`.

- [x] G2: A natural-language edit request applies the existing editorial plan and reports only after timeline save confirmation.
  EVIDENCE: Chat and voice both call `handleVoiceEditorialPlan`; it returns success only after the project timeline controller confirms the caption style and movement cues are saved. The chat path opens Motion first and displays the returned summary.

- [x] G3: The deployment branch remains main and the final-render limitation remains accurately described.
  EVIDENCE: `git branch --show-current` reports `main`. `docs/jarvis-capability-gaps.md` still states that the saved editorial timeline is not mapped into a final edited render.
