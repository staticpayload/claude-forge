---
name: set-codex-model
description: Configure the model used by Codex CLI delegation
---

<Purpose>
Set or view the model that Codex CLI uses when delegating backend tasks.
The model preference is saved to ~/.claude-forge/config.json and picked up
by the Codex MCP server on the next job. If no model is configured, Codex
uses its own CLI default.
</Purpose>

<Use_When>
- User says "set codex model", "change codex model", "forge codex model"
- User wants to switch between available Codex models
</Use_When>

<Steps>
1. If user provided a model name as argument, skip to step 3.

2. Ask the user which model to use. Show current setting if config exists.
   Read ~/.claude-forge/config.json to check current `codexModel` value.

3. Write the model to config:
   - Read existing ~/.claude-forge/config.json (or start with {})
   - Set `codexModel` to the chosen value
   - Use `mkdir -p ~/.claude-forge` then write the JSON file
   - If user says "reset" or "default", remove the `codexModel` key

4. Confirm: "Codex model set to [model]. Takes effect on next codex_exec call."
</Steps>

<Config_Path>~/.claude-forge/config.json</Config_Path>
<Config_Key>codexModel</Config_Key>
