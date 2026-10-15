# Gates: Jarvis video session rectification

OWNS: hooks/use-voice-companion.ts, lib/voice-companion/gemini-live-client.ts, app/editor/[id]/page.tsx, docs/jarvis-capability-gaps.md, GATES-jarvis-video-session.md

Scope: Make Jarvis's video availability, delegated editorial pass, save status, and completion message match the editor's verified state and supported capabilities.

- [x] G1: The editorial action checks playable source, source identity, and duration before mutating the timeline, and distinguishes missing/loading/unplayable media.
  EVIDENCE: static review of `hooks/use-voice-companion.ts`; source identity is checked again after opening Motion

- [x] G2: The action result reports only saved caption/movement changes; save failures remain unconfirmed and do not suggest there is no video.
  EVIDENCE: static review of `hooks/use-voice-companion.ts`, `app/editor/[id]/page.tsx`, and the save-confirmation return path

- [x] G3: Jarvis identifies unsupported parts of an end-to-end edit and does not imply that the saved Motion preview is a completed rendered video.
  EVIDENCE: static review of `lib/voice-companion/gemini-live-client.ts`; action result names work not performed

- [ ] G4: Changes are accepted in a live editor session with a playable source, and source-missing / timeline-save-failure states produce accurate recovery guidance.
  EVIDENCE: pending; live editor acceptance requires a browser session with representative project states
