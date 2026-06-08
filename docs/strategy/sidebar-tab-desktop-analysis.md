# Strategic Analysis: Motion & Music Sidebar Tabs - Desktop Rollout
Date: 2026-06-08
Analyst: Gilfoyle (Technical) + Strategic Agent (Product)

## Executive Summary
Do not roll Motion and Music sidebar drawers out universally to desktop. Mobile needs drawer-based relocation because the viewport is a hostile little rectangle with delusions of productivity. Desktop does not. On desktop, Motion and Music should remain persistent editor tabs or panels because power users switch contexts constantly and benefit from visible, one-click access. The right recommendation is **Option B: Hybrid Breakpoint**: use sidebar drawers for mobile and tablet below `1024px`, keep desktop tabs at `1024px+`, and reserve desktop sidebar mode for a future user preference or A/B test after real usage data proves it.

## Recommendation: Option B - Hybrid Breakpoint
**Confidence:** High

Use sidebar tabs/drawers for viewports below `1024px`. Keep persistent Motion and Music tabs on desktop at `1024px+`.

- **Mobile `<768px`:** Motion and Music move into sidebar-triggered drawers. Main editor keeps the canvas and immediate controls uncluttered.
- **Tablet `768px-1023px`:** Use the same sidebar drawer model. Tablet width is not enough for a comfortable pro editor plus multiple persistent panels.
- **Desktop `>=1024px`:** Keep Motion and Music as visible tabs/panels in the main editor. Sidebar items may focus the existing tab, but should not hide the tab surface.

Do not ship Option C. Universal sidebar is the kind of idea that looks clean in a screenshot and wastes power-user time all day.

## Detailed Analysis

### 1. Screen Real Estate
Desktop has enough horizontal room to keep high-frequency tools visible. Mobile does not.

**Pixel math:**

| Viewport | Typical width | Sidebar | Remaining main width | Practical conclusion |
|----------|---------------|---------|----------------------|----------------------|
| Phone | 375-414px | 280-340px drawer | Overlay only | Persistent tabs are unusable clutter. |
| Tablet | 768-1023px | 280-340px drawer | 428-683px if persistent | Drawer is better; persistent side panels squeeze preview/timeline. |
| Laptop | 1280-1440px | 280px sidebar | 1000-1160px | Main tabs remain viable. |
| External monitor | 1728-2560px | 280px sidebar | 1448-2280px | Hiding tabs is unnecessary friction. |

The desktop tab bar itself is cheap. A horizontal tab strip costs roughly `44-56px` of vertical space and no meaningful horizontal space. Moving Motion/Music into a sidebar on desktop does not reclaim much canvas area unless the entire panel model changes. That creates complexity without a proportionate gain.

On mobile, Motion and Music consume entire interaction modes. They belong in drawers because the editor cannot show canvas, timeline, music catalog, and motion controls at the same time without turning into a cramped vending machine UI.

### 2. Interaction Efficiency
Desktop power users operate with a mouse, keyboard, and muscle memory. Visible tabs are faster.

**Click-path comparison:**

| Task | Desktop persistent tab | Desktop sidebar drawer | Mobile sidebar drawer |
|------|------------------------|------------------------|-----------------------|
| Open Music | 1 click | 1-2 clicks, depending sidebar state | 2 taps, acceptable due to space constraint |
| Open Motion | 1 click | 1-2 clicks | 2 taps, acceptable |
| Switch Motion -> Timeline | 1 click | close drawer + choose target | close drawer or tap tool |
| Compare Music with Preview | Split/persistent UI possible | Drawer obscures canvas | Drawer is expected compromise |

Estimated desktop cost: hiding high-frequency panels behind a sidebar adds roughly `300-700ms` per switch when the sidebar is already visible, and more when the user must open a collapsed sidebar first. That sounds small until an editor does it 80 times in a session. Death by tiny delays is still death, just with better animation curves.

Mobile users already pay the cost of mode switching because there is no space for persistent panels. Desktop users should not be punished for owning a monitor.

### 3. Context Switching
Video editing is context-switch heavy. Users bounce between preview, timeline, motion, music, captions, and export.

On desktop, visible tabs reduce cognitive load because available modes remain discoverable. A user can glance, switch, and return without asking, "Where did that control go?" Hidden sidebar tools increase memory load and can make the editor feel simpler while actually becoming slower.

On mobile and tablet, the opposite is true. Too many visible tabs create constant visual noise. Consolidating Motion and Music into drawer destinations makes the primary surface easier to understand. The tradeoff is acceptable because mobile editing is already a constrained workflow.

The strategic rule is simple: **hide tools when space is scarce, expose tools when attention is scarce.** Desktop attention is the scarce resource.

### 4. User Personas

**Power users: desktop, external monitor, paid operator**
- Wants timeline, preview, Motion, Music, and export close to hand.
- Values visible state and keyboard/mouse speed.
- Hates hidden mode drawers when doing repeated precision work.
- Best UX: persistent tabs/panels with optional sidebar shortcuts.

**Casual/mobile users: phone-first creator**
- Wants the editor to feel navigable, not comprehensive.
- Benefits from one active mode at a time.
- Accepts drawers and bottom-sheet patterns because mobile apps train that behavior.
- Best UX: sidebar drawer for Motion/Music, visible primary CTA paths.

**Tablet users: hybrid**
- Has more room than mobile but not enough for pro desktop density.
- Often uses touch, sometimes stylus or keyboard.
- Best UX: drawer model below `1024px`; maybe promote frequently used tools into a compact segmented control later.

**Admin/founder demo users**
- Need impressive first-look clarity.
- Desktop tab visibility helps communicate product depth.
- Hidden tabs make the product look simpler, but also less capable.

### 5. Implementation Cost

| Option | Engineering cost | State complexity | Regression risk | Notes |
|--------|------------------|------------------|-----------------|-------|
| A: Mobile Only | Low | Low | Low | Good first move, but tablet remains cramped. |
| B: Hybrid Breakpoint | Medium-low | Medium-low | Low-medium | Best balance. Same drawer logic handles mobile and tablet. |
| C: Universal Sidebar | High | High | High | Requires desktop drawer/tab hybrid, persistence rules, focus behavior, and workflow rewiring. |
| D: User Preference | Medium-high | High | Medium-high | Good future feature, not an initial migration. |

Desktop sidebar tabs require more than moving buttons. They create panel ownership questions: Does Music open as a drawer, replace the main panel, dock beside preview, or overlay the timeline? Each answer creates state transitions, focus management, persisted layout mode, keyboard shortcuts, and test cases.

That is not strategy. That is unpaid complexity wearing sunglasses.

### 6. Competitive Landscape

| Product | Desktop pattern | Mobile pattern | Lesson for Prometheus |
|---------|-----------------|----------------|-----------------------|
| Final Cut Pro | Persistent timeline, browsers, inspectors | N/A / iPad adapted panels | Pro desktop keeps tools visible. |
| Premiere Pro | Workspaces, panels, tabs | N/A / mobile separate product | Desktop users expect configurable panels. |
| DaVinci Resolve | Page-based pro workspaces | N/A | Pro tools expose modes directly. |
| CapCut | Desktop panels/tabs | Mobile sheets/tool drawers | Responsive patterns diverge by device. |
| Descript | Sidebar plus main editing panels | Simplified mobile flows | Hybrid works, but desktop still keeps core contexts visible. |
| Loom/Riverside | Simplified desktop controls | Simplified mobile controls | Good for recording/review, less comparable to precision editing. |

Prometheus is trying to justify a premium creator/pro price point. The desktop editor should feel like a high-end production cockpit, not a mobile app stretched to 1440px.

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Desktop users lose speed if Motion/Music move to sidebar | High | High | Keep persistent desktop tabs at `1024px+`. |
| Tablet UI remains crowded if only mobile changes | Medium | Medium | Use sidebar drawers through `1023px`. |
| Drawer state conflicts with editor tab state | Medium | Medium | Treat drawer state as transient below `1024px`; desktop sidebar items focus existing tabs only. |
| Hidden tools reduce discoverability on mobile | Medium | Medium | Use clear sidebar nav labels, strong iconography, and command palette shortcuts. |
| Universal sidebar increases bugs and focus traps | High | High | Do not ship universal sidebar initially. |
| Desktop layout preference becomes subjective | Medium | Low | Add user preference only after telemetry or customer evidence. |
| Heavy glass drawers hurt low-end devices | Medium | Medium | Use lite-tier flat backgrounds and reduced blur on low-memory devices. |

## Implementation Roadmap (If Approved)
1. **Phase 1: Mobile only, immediate**
   - Motion and Music move to drawer/sidebar destinations under `768px`.
   - Desktop remains unchanged.
   - Validate touch targets, scroll behavior, Escape close, and reduced motion.

2. **Phase 2: Tablet breakpoint, next sprint**
   - Extend drawer behavior to `768px-1023px`.
   - Tune drawer width around `340-380px`.
   - Keep preview/timeline visible behind overlay without layout reflow.

3. **Phase 3: Desktop instrumentation, future**
   - Track tab usage frequency, context switches, and time-to-Music/Motion.
   - Interview actual desktop users before moving anything.
   - If data supports it, add a settings-level layout preference.

4. **Phase 4: Optional desktop preference, later**
   - Add `Tab Mode` and `Sidebar Mode`.
   - Default to tabs on desktop.
   - Persist preference per user.
   - Do not make universal sidebar the default unless telemetry proves desktop tabs are underused.

## Strategic Sign-Off

## Feature: Motion & Music Sidebar Tabs - Desktop Rollout Decision
## Date: 2026-06-08
## Status: APPROVED WITH CONSTRAINTS

### Gates Passed: 8/10

### Critical Risks Identified:
1. Desktop context switching can slow down power users -> Keep tabs visible at `1024px+`.
2. Tablet layout can remain cramped if excluded -> Use the drawer model below `1024px`.
3. Heavy drawer glass can degrade low-end devices -> Provide lite-tier fallback with less blur and simpler opacity.

### Simplifications Recommended:
1. Use one drawer pattern for mobile and tablet instead of separate mobile/tablet implementations.
2. On desktop, sidebar Motion/Music items should focus existing tabs, not open duplicate drawers.
3. Defer user preference until after usage data.

### Business Impact:
- Conversion: Neutral to slightly positive. Mobile/tablet clarity improves demos without weakening desktop.
- Retention: Positive for power users because desktop workflow speed is preserved.
- Brand perception: Positive. Prometheus feels adaptive instead of blindly "responsive."

### Coding Agent Notes:
- Breakpoint rule: drawer mode below `1024px`; desktop tabs at `1024px+`.
- Avoid `window.innerWidth` for layout; prefer CSS breakpoints and a narrow `useMediaQuery` only for behavior branching where unavoidable.
- Desktop sidebar item behavior: focus/activate existing main tab.
- Mobile/tablet sidebar item behavior: open drawer.
- Low-tier behavior: reduce blur, motion, and layered shadows.

### Signed: Strategic Advisor Agent

## Gilfoyle's Unfiltered Take
Mobile gets sidebar tabs because mobile is a constraint, not a design philosophy. Tablet gets them because 900px is not a desktop, no matter how much marketing copy Apple staples to it. Desktop keeps tabs because hiding high-frequency editing tools behind a sidebar is how you turn a premium editor into a scavenger hunt.

Universal sidebar sounds clean until an editor has to switch Music -> Timeline -> Motion -> Preview fifty times before lunch. Then your "minimal chrome" becomes minimal productivity. Keep desktop tabs. Add sidebar shortcuts if you want. Do not bury the tools.

## Migration Checklist
- Create no desktop universal-sidebar migration yet.
- Keep existing desktop Motion and Music tabs active at `1024px+`.
- Use the existing additive Motion/Music drawer wrappers only below `1024px`.
- Make desktop sidebar Motion/Music items activate or scroll to the existing main tab.
- Add telemetry before considering a desktop layout preference.
- Deprecate no existing desktop tab components until real desktop data supports it.
