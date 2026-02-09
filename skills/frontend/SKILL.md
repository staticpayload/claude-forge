---
name: frontend
description: Delegate task directly to Gemini CLI for frontend/design work
---

<Purpose>
Direct delegation shortcut to Gemini CLI (Google gemini-2.5-pro, 1M context) for
frontend and design work. Gemini excels at UI components, CSS/styling, React/Vue/Svelte,
layouts, design systems, documentation, visual analysis, and large-context tasks.
</Purpose>

<Use_When>
- User says "use gemini", "ask gemini", "delegate to gemini", "frontend this"
- Task is clearly frontend or design work
</Use_When>

<Steps>
1. Call ToolSearch("gemini") to discover MCP tools
2. Call `mcp__gemini__gemini_exec` with:
   - prompt: the user's full request
   - workFolder: current project directory
3. Poll `mcp__gemini__gemini_status` until completed or failed
4. Present the result to the user
</Steps>
