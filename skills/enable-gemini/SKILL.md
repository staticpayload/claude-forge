---
name: enable-gemini
description: Enable Gemini CLI delegation after installing the CLI
---

<Purpose>
Enable or re-enable Gemini CLI delegation. Use this after installing Gemini CLI
to activate the MCP tools. The server checks CLI availability at startup, so
this skill helps users who install Gemini after the initial plugin setup.
</Purpose>

<Use_When>
- User says "enable gemini", "activate gemini", "I installed gemini"
- User just installed Gemini CLI and wants to start using it
</Use_When>

<Steps>
1. **Check if Gemini CLI is installed**:
   Run `which gemini` or check `/opt/homebrew/bin/gemini` and `/usr/local/bin/gemini`.

2. **If found**:
   - Read `~/.claude-forge/config.json` (create if missing)
   - Set `"geminiEnabled": true` and `"geminiPath": "<detected path>"`
   - Write back the config
   - Tell user: "Gemini CLI enabled at [path]. Restart Claude Code to load the MCP tools."
   - Optionally ask if they want to set a specific model

3. **If NOT found**:
   - Tell user Gemini CLI was not found
   - Provide install instructions:
     ```
     npm install -g @anthropic-ai/gemini
     ```
   - Or if they installed it in a custom location, ask for the path
   - Set `GEMINI_CLI_NAME` env var approach: "You can also set GEMINI_CLI_NAME=/path/to/gemini"

4. **Remind**: "After restarting Claude Code, the gemini_exec, gemini_status, gemini_cancel, and gemini_list tools will appear. Use /claude-forge:frontend to delegate."
</Steps>
