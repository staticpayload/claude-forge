# claude-forge - Multi-CLI Delegation

You have access to two external AI coding agents via MCP tools.
Use ToolSearch("codex") and ToolSearch("gemini") to discover them before first use.

## Codex (OpenAI gpt-5.3-codex) - Backend
**Tools:** `mcp__codex__codex_exec`, `codex_status`, `codex_cancel`, `codex_list`
**Best for:** API endpoints, data pipelines, scripts, CLI tools, infra, database, server-side logic, build tooling.
**Pattern:** `codex_exec(prompt, workFolder)` -> poll `codex_status(jobId)` until done.

## Gemini (Google gemini-2.5-pro, 1M context) - Frontend
**Tools:** `mcp__gemini__gemini_exec`, `gemini_status`, `gemini_cancel`, `gemini_list`
**Best for:** UI components, CSS, React/Vue/Svelte, layouts, design systems, docs, visual analysis.
**Pattern:** `gemini_exec(prompt, workFolder)` -> poll `gemini_status(jobId)` until done.

## Routing
- Backend signals (api, server, database, script, docker, auth) -> Codex
- Frontend signals (component, ui, css, react, design, layout) -> Gemini
- Ambiguous -> ask user or run both in parallel

## Skills
- `/claude-forge:forge` - Auto-route to best CLI
- `/claude-forge:review` - Parallel review via both CLIs
- `/claude-forge:backend` - Direct Codex delegation
- `/claude-forge:frontend` - Direct Gemini delegation

## Anti-Loop
Both CLIs have anti-loop preambles injected. They will NOT delegate back to Claude Code.
