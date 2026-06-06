---
name: ui-ux-pro-max
description: AI-powered design intelligence toolkit for UI styles, color palettes, and UX guidelines.
---

# UI-UX Pro Max (Antigravity Kit)

This skill provides searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines. Use it to get precise design recommendations instead of vague aesthetics.

## Usage

You can use the built-in search script to find specific design elements:

```bash
python3 .agents/skills/ui-ux-pro-max/repo/src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
```

### Domains
- `style`: UI styles (glassmorphism, minimalism, brutalism) + AI prompts and CSS keywords.
- `color`: Color palettes by product type.
- `typography`: Font pairings with Google Fonts imports.
- `ux`: Best practices and anti-patterns.
- `landing`: Page structure and CTA strategies.
- `product`: Product type recommendations (SaaS, e-commerce, portfolio).
- `chart`: Chart types and library recommendations.

### Stacks
You can also filter by stack using `--stack <stack>`:
Available: `html-tailwind`, `react`, `nextjs`, `astro`, `vue`, `shadcn`, `swiftui`, `react-native`, `flutter`, `jetpack-compose`.

## Design Principles
- **Be Specific**: Request precise styles (e.g., "glassmorphism card with backdrop-blur-md").
- **Leverage Tokens**: Use the provided Tailwind/CSS tokens directly.
- **Reference Logic**: Use the BM25-ranked results to justify design decisions.
