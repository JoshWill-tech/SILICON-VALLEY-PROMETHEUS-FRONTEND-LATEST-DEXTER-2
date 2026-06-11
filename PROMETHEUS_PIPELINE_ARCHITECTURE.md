# Prometheus Pipeline Architecture

## 1. Durable Job Pipeline
All edit requests and background tasks are managed via a durable job system (e.g., Supabase jobs table or dedicated queue).
- **Rule:** Every command submission MUST create a durable job record.
- **Job Statuses:** `pending`, `uploading`, `transcribing`, `editing`, `generating_preview`, `completed`, `failed`.
- **Persistence:** Jobs must survive browser refreshes and server restarts.

## 2. Ingest Phase
### A. Early Upload and Transcription
- Start asset upload as soon as the user selects a file (parallel to command input).
- Trigger transcription immediately upon upload completion to provide searchable content for the AI editor.

### B. Compression Strategy
- **Rule:** Defer heavy compression until the reliable upload/preview loop is confirmed working.
- Focus on raw or lightly compressed proxies for the preview stage to maintain speed.

## 3. Preview Generation
### A. Preview Loader
- A dedicated UI state that shows progress through the job pipeline (e.g., "Transcribing...", "Assembling scenes...").
- Keep the user engaged with cinematic animations or status updates.

### B. 15–20 Second Preview Generation
- Generate a high-impact, short-form preview of the edit.
- Focus on the most visually/audibly dense sections.
- Previews must be ready in < 30 seconds for Day 1 MVP.

## 4. Agent Execution Rules
Every agent loop (editing, color grading, music selection) must follow these constraints:
- **Max Attempts:** 3 retries for any failed step.
- **Quality Thresholds:** Automated checks for black frames, audio clipping, and sync issues.
- **Fallback Behavior:** If a complex edit fails, fall back to a "safe" template-based edit.
- **Error Recovery:** State must be saved at every successful step to allow partial resume.

## 5. Anti-Loop Critic Rules
- Implement an automated "Critic Agent" to detect repetitive or uncinematic edits.
- If the critic detects a loop or a low-quality output, it forces a re-plan with a different heuristic.

## 6. Data Retention Policy
- **Source Videos:** Automatically deleted 15 days after upload to manage storage costs.
- **Edited Outputs:** Retained indefinitely unless the user explicitly deletes them or the account is closed.
- **Job Logs:** Retained for 30 days for debugging and performance analysis.
