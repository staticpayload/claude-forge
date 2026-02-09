---
name: enable-codex
description: Enable Codex CLI delegation after installing the CLI
---

<Purpose>
Enable or re-enable Codex CLI delegation. Use this after installing Codex CLI
to activate the MCP tools. The server checks CLI availability at startup, so
this skill helps users who install Codex after the initial plugin setup.
</Purpose>

<Use_When>
- User says "enable codex", "activate codex", "I installed codex"
- User just installed Codex CLI and wants to start using it
</Use_When>

<Steps>
1. **Check if Codex CLI is installed**:
   Run `which codex` or check `/usr/local/bin/codex` and `/opt/homebrew/bin/codex`.

2. **If found**:
   - Read `~/.claude-forge/config.json` (create if missing)
   - Set `"codexEnabled": true` and `"codexPath": "<detected path>"`
   - Write back the config
   - Tell user: "Codex CLI enabled at [path]. Restart Claude Code to load the MCP tools."
   - Optionally ask if they want to set a specific model

3. **If NOT found**:
   - Tell user Codex CLI was not found
   - Provide install instructions:
     ```
     npm install -g @openai/codex
     ```
   - Or if they installed it in a custom location, ask for the path
   - Set `CODEX_CLI_NAME` env var approach: "You can also set CODEX_CLI_NAME=/path/to/codex"

4. **Remind**: "After restarting Claude Code, the codex_exec, codex_status, codex_cancel, and codex_list tools will appear. Use /claude-forge:backend to delegate."
</Steps>
