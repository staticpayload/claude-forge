---
name: backend
description: Delegate task directly to Codex CLI for backend work
---

<Purpose>
Direct delegation shortcut to Codex CLI (OpenAI gpt-5.3-codex) for backend work.
Codex excels at API endpoints, data pipelines, scripts, CLI tools, infrastructure,
database work, server-side logic, and build tooling.
</Purpose>

<Use_When>
- User says "use codex", "ask codex", "delegate to codex", "backend this"
- Task is clearly backend work
</Use_When>

<Steps>
1. Call ToolSearch("codex") to discover MCP tools
2. Call `mcp__codex__codex_exec` with:
   - prompt: the user's full request
   - workFolder: current project directory
3. Poll `mcp__codex__codex_status` until completed or failed
4. Present the result to the user
</Steps>
