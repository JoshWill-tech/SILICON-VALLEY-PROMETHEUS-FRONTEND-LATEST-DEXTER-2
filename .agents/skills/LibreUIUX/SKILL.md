---
name: LibreUIUX
description: Comprehensive UI/UX system with 152 agents, 70 plugins, and 74 specialized skills.
---

# LibreUIUX

LibreUIUX is a massive infrastructure for modern UI/UX development. It moves beyond "Bootstrap-era" designs by providing specialized agents and domain-specific knowledge.

## Core Components

### 1. Domain Plugins
Located in `.agents/skills/LibreUIUX/repo/plugins/`. Each plugin contains:
- `agents/`: Specialized AI personas (e.g., `design-mastery`, `accessibility-compliance`).
- `skills/`: Domain-specific `SKILL.md` modules.

### 2. Task-Specific Agents
Invoke these by referencing their definitions in `plugins/[category]/agents/`.
- **UI Validator**: Checks for design consistency.
- **Design Critic**: Provides instant feedback on UI components.
- **Responsive Checker**: Ensures layouts adapt across screen sizes.

### 3. Specialized Skills
74 skills covering:
- Accessibility Compliance
- Animation & Motion (Framer Motion, GSAP)
- Design Systems (Shadcn, Aceternity)
- Performance Optimization

## How to Use
1. **Research**: When starting a UI task, browse the relevant plugin in `plugins/`.
2. **Consult Agents**: Use the instructions found in `agents/` files to adopt the persona of a specialist.
3. **Apply Skills**: Reference the domain-specific `SKILL.md` files for deep-dive technical guidance.

## Key Workflow: Technical Precision
Avoid vague requests. Speak the language of modern UI:
- Use precise Tailwind units and color tokens.
- Reference modern patterns like Bento grids, Glassmorphism, and Micro-interactions.
- Prioritize accessibility (WCAG/ARIA) from the start.
