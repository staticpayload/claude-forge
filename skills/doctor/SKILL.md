---
name: doctor
description: Diagnose and fix claude-forge installation issues
---

<Purpose>
Run diagnostic checks on the claude-forge installation. Detect common issues,
report status, and offer auto-fixes.
</Purpose>

<Use_When>
- User says "doctor", "diagnose", "forge not working"
- Skills aren't loading or MCP tools aren't appearing
- After updating the plugin
</Use_When>

<Diagnostic_Checks>

### 1. Plugin Installation
- Check `.claude-plugin/plugin.json` exists and is valid JSON
- Verify plugin is registered in Claude Code

### 2. MCP Servers
- Check `.mcp.json` exists and references both servers
- Verify `servers/codex-server.mjs` and `servers/gemini-server.mjs` exist
- Check if Codex CLI is installed (`which codex`)
- Check if Gemini CLI is installed (`which gemini`)
- Test MCP server syntax (node -c)

### 3. Hooks
- Check `hooks/hooks.json` is valid JSON
- Verify all referenced scripts exist:
  - `scripts/keyword-router.mjs`
  - `scripts/session-init.mjs`
  - `scripts/continuation.mjs`
  - `scripts/context-monitor.mjs`
- Syntax check all hook scripts

### 4. Skills
- Count skill directories
- Verify each has a SKILL.md with valid frontmatter
- Check for orphaned skills (in keyword-router but no SKILL.md)

### 5. Config
- Check `~/.claude-forge/config.json` (if exists)
- Verify model settings are valid
- Check for stale state files in `.forge/`

### 6. Dependencies
- Check `node_modules/@modelcontextprotocol/sdk` exists
- Verify Node.js version >= 18

### 7. HUD
- Check if `hud/forge-hud.mjs` exists
- Verify statusLine configured in `~/.claude/settings.json`

</Diagnostic_Checks>

<Output_Format>
```
=== claude-forge Doctor ===

Plugin:      OK
MCP Servers: OK (codex: installed, gemini: not found)
Hooks:       OK (4 hooks registered)
Skills:      OK (34 skills found)
Config:      OK
Dependencies: OK
HUD:         WARN (not configured)

Issues Found:
  [WARN] Gemini CLI not installed — install with: npm i -g @google/gemini-cli
  [WARN] HUD not configured — run /claude-forge:hud to set up

Auto-fix available for 1 issue. Run /claude-forge:doctor --fix to apply.
```
</Output_Format>

<Auto_Fixes>
- Install missing npm dependencies
- Clear stale state files
- Regenerate config with defaults
- Fix hooks.json if malformed
</Auto_Fixes>
