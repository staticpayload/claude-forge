---
name: frontend-ui-ux
description: UI/UX design and component work — routes to designer agent or Gemini CLI
---

<Purpose>
Handle all UI/UX work: component design, responsive layouts, design system
consistency, accessibility compliance, styling, and visual polish.
Routes to Gemini CLI (1M context, great for design) or designer agent.
</Purpose>

<Use_When>
- User mentions: component, UI, CSS, layout, design, styling, responsive, accessible
- Building or modifying frontend interfaces
- Auto-detected from frontend signals in user prompt
</Use_When>

<Routing>
1. **Gemini CLI available** → delegate via `mcp__gemini__gemini_exec`
   - Best for: large-context design work, multi-file component changes
   - 1M token context handles entire component libraries
2. **Gemini unavailable** → use designer agent (sonnet)
   - Task tool with subagent_type: "oh-my-claudecode:designer"
   - Good for: single component changes, styling fixes
</Routing>

<Capabilities>
- **Component Design:** React/Vue/Svelte components with proper props, state, events
- **Responsive Layouts:** Mobile-first, breakpoints, flexible grids
- **Design Systems:** Consistent spacing, colors, typography, tokens
- **Accessibility:** ARIA labels, keyboard navigation, screen reader support, contrast
- **Animation:** Transitions, micro-interactions, loading states
- **Performance:** Code splitting, lazy loading, optimized re-renders
</Capabilities>

<Quality_Standards>
- Components must be accessible (WCAG 2.1 AA minimum)
- Responsive across mobile, tablet, desktop breakpoints
- Follow existing design system / component library conventions
- No inline styles when CSS modules / styled-components / Tailwind is used
- Interactive elements must have hover, focus, and active states
</Quality_Standards>
