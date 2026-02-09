---
name: forge
description: Auto-route tasks to the best CLI (Codex for backend, Gemini for frontend)
---

<Purpose>
Analyze the user's request and delegate to the optimal CLI agent:
- Codex (gpt-5.3-codex) for backend, API, data, infra, scripts
- Gemini (gemini-2.5-pro, 1M context) for frontend, UI/UX, design, docs
For ambiguous tasks, ask the user or run both in parallel.
</Purpose>

<Use_When>
- User says "forge this", "forge it", "auto-route"
- Task could benefit from external CLI delegation but domain is unclear
</Use_When>

<Do_Not_Use_When>
- Task is trivial (single-line fix, quick question)
- User explicitly chose a CLI already
</Do_Not_Use_When>

<Steps>
1. **Classify** the task by signal words:
   - Backend: api, endpoint, server, database, sql, migration, cli, script, pipeline, docker, auth, middleware, cache, redis, queue, worker, webhook, microservice
   - Frontend: component, ui, ux, css, style, layout, react, vue, svelte, html, design, theme, animation, accessibility, tailwind, visual, mobile

2. **Route** based on classification:
   - Clear backend -> Use ToolSearch to discover codex tools, then call `mcp__codex__codex_exec` with the task prompt and workFolder set to the current project
   - Clear frontend -> Use ToolSearch to discover gemini tools, then call `mcp__gemini__gemini_exec` with the task prompt and workFolder
   - Ambiguous -> Ask user: "Should I route this to Codex (backend) or Gemini (frontend/design)?"

3. **Monitor**: Poll `codex_status` or `gemini_status` every 25s until completed or failed

4. **Report**: Present the result with which CLI handled it
</Steps>

<Tool_Usage>
- ToolSearch("codex") to discover codex MCP tools
- ToolSearch("gemini") to discover gemini MCP tools
- mcp__codex__codex_exec / mcp__codex__codex_status for backend
- mcp__gemini__gemini_exec / mcp__gemini__gemini_status for frontend
</Tool_Usage>
