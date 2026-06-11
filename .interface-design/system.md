# Interface Design System

## Core Principles
1. **Precision**: Use exact tokens for spacing, color, and typography.
2. **Apple HIG Alignment**: Prioritize Clarity, Deference, and Depth.
3. **Gilfoyle Logic**: No fluff. Every element must have a functional or architectural purpose.

## Design Tokens (Apple Inspired)

### Colors (Semantic)
- **Primary**: `#007AFF` (System Blue)
- **Background**: `#05060a` (Deep Night)
- **Surface**: `rgba(255, 255, 255, 0.05)` (Subtle Glass)
- **Border**: `rgba(255, 255, 255, 0.1)`

### Spacing (The 4px Grid)
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### Hit Targets
- **Interactive**: Minimum 44px height/width.

### Typography (SF Pro Equivalent)
- **Base**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Heading Weight**: 600
- **Body Weight**: 400

## Active System Audit
- [ ] Verify hit targets on all new buttons.
- [ ] Check contrast ratios for glass overlays.
- [ ] Ensure consistent use of the 4px grid.
