# Prometheus Startup Operating System (PSOS)

## 1. Startup Decision Rules
Prometheus operates on a high-velocity, high-integrity startup execution model. We prioritize shipping visible progress while protecting system stability and premium quality.
- **Velocity over Completion:** Ship functional, premium slices of the system rather than waiting for "total" features.
- **Trust over Polish:** Reliability in the core loop (Upload -> Preview -> Export) is more important than UI micro-interactions.
- **No Waste:** Avoid features that do not improve launch, trust, demo quality, revenue, or system memory.

## 2. Bottleneck Theory
Always identify the current system bottleneck before starting new work.
- The bottleneck is the single constraint most limiting launch, demo quality, or product trust.
- **Rule:** Do not optimize secondary systems (e.g., advanced templates) while the main bottleneck (e.g., preview rendering) remains unresolved.
- Every task must state the bottleneck it solves.

## 3. Power-Law Capital Allocation
Engineering time is our most precious capital. Focus on the 20% of features that drive 80% of user value and product vision.
- **High-Leverage Features:** Reliable upload, fast transcription, command overlay, preview generation, job persistence, preference memory.
- **Low-Leverage Features:** Granular settings, non-essential social integrations, aesthetic-only changes that don't affect "Cinematic" feel.

## 4. System Decision Rules
Classify every product decision into:
- **NOW:** Required for launch, demo, trust, revenue, or core product loop.
- **NEXT:** Critical improvements once the core flow is stable.
- **LATER:** Valuable but not urgent; store in backlog.
- **NOT YET:** Distracting, too expensive, or premature for current scale.

## 5. Time-Casting Rules
Evaluate every task against its required horizon:
- Is this needed for the next demo?
- Is this needed for Day 1 launch?
- Is this only useful at scale? (If so, defer).
- **Rule:** Do not build for scale before the core demo works.

## 6. Global Product Rules
Prometheus must consistently feel:
- **Premium:** High-end aesthetic and typography.
- **Fast:** Instant feedback or clear progress indicators.
- **Reliable:** It works every time, or fails gracefully with clear recovery.
- **Cinematic:** Every output looks like a high-production film.
- **Intelligent:** Anticipates user needs via structured memory.
- **Trustworthy:** Transparent job status and data handling.
