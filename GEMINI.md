# Project Instructions (GEMINI.md)

## Installed Skills

- **penpot-uiux-design**: Comprehensive guide for creating professional UI/UX designs in Penpot using MCP tools.
  - Location: `./.agents/skills/penpot-uiux-design/SKILL.md`
  - Usage: Read the `SKILL.md` for expert guidance on Penpot design workflows and tools.

- **diagnose**: Disciplined diagnosis loop for hard bugs and performance regressions. Reproduce → minimise → hypothesise → instrument → fix → regression-test.
  - Location: `./.agents/skills/diagnose/SKILL.md`
  - Usage: Use when user reports a bug, performance regression, or says something is broken/failing.

- **ui-ux-pro-max**: AI-powered design intelligence toolkit for UI styles, color palettes, and UX guidelines.
  - Location: `./.agents/skills/ui-ux-pro-max/SKILL.md`
  - Usage: Use the search engine at `.agents/skills/ui-ux-pro-max/repo/src/ui-ux-pro-max/scripts/search.py` for precise design recommendations.

- **LibreUIUX**: Massive UI/UX infrastructure with 152 agents and 74 skills for modern development.
  - Location: `./.agents/skills/LibreUIUX/SKILL.md`
  - Usage: Reference the plugins and agents in `.agents/skills/LibreUIUX/repo/plugins/` for specialized UI/UX tasks.

## Custom Agents

- **gilfoyle**: Senior systems architect and security engineer.
  - Location: `./.gemini/agents/gilfoyle.md`
  - Usage: Invoke with `@gilfoyle` to delegate architectural audits and security reviews to this persona.

- **prometheus-strat**: Strategic Advisor (Co-Founder Mode).
  - Location: `./.gemini/agents/prometheus-strat.md`
  - Usage: Invoke with `@prometheus-strat` to review feature specs against 10 mandatory review gates before coding starts.
