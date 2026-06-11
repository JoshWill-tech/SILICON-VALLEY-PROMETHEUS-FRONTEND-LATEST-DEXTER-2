# Editor Command Overlay Specification

## 1. Overview
The Editor Command Overlay is the primary interface for user-directed cinematic editing. It captures intent, style preferences, and specific revision notes, converting them into a structured payload for the Prometheus pipeline.

## 2. Interface Components
### A. Command Overlay
- A modal or slide-over interface triggered from the editor.
- Focused on natural language input but supported by structured selectors.

### B. Guided Creative Questions
- To reduce "blank page" syndrome, provide dynamic prompts:
  - "What is the primary mood of this video? (e.g., Epic, Intimate, Fast-paced)"
  - "Who is the target audience?"
  - "Is this for a specific platform? (Instagram, YouTube, LinkedIn)"

### C. Reference & Style Selection
- Visual gallery of cinematic styles (e.g., "Muted Noir," "Golden Hour," "Corporate High-Key").
- Reference video selection (if the user wants to mimic a specific upload or template).

### D. Optional User Details
- Contextual information that helps the AI:
  - Brand guidelines (colors, fonts).
  - Specific "no-go" zones (e.g., "don't cut during the speaker's name").

## 3. Structured Edit Request Payload
Every command submission must generate a JSON payload:
```json
{
  "project_id": "uuid",
  "intent": "string",
  "mood": "string",
  "style_reference": "style_id",
  "platform": "string",
  "additional_context": {},
  "timestamp": "iso-8601"
}
```

## 4. Feedback & Iteration Loop
### A. “I like this” / “I don’t like this”
- Quick binary feedback on generated previews.
- Positive feedback reinforces preference memory.
- Negative feedback triggers a "Why?" follow-up to capture specific correction data.

### B. Timeline-Specific Revision Notes
- Users can drop markers or select clips on the timeline to provide localized feedback.
- "Make this cut 1 second earlier."
- "The music drop should happen here."

## 5. Structured User Preference Memory
- Store user feedback patterns in a persistent profile.
- Preferences include:
  - Favorite fonts/colors.
  - Preferred pacing (average shot length).
  - Music genre affinity.
- **Rule:** Use structured preference memory first before attempting per-user model fine-tuning.
