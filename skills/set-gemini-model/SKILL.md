---
name: set-gemini-model
description: Configure the model used by Gemini CLI delegation
---

<Purpose>
Set or view the model that Gemini CLI uses when delegating frontend tasks.
The model preference is saved to ~/.claude-forge/config.json and picked up
by the Gemini MCP server on the next job. If no model is configured, Gemini
uses its own CLI default.
</Purpose>

<Use_When>
- User says "set gemini model", "change gemini model", "forge gemini model"
- User wants to switch between available Gemini models
</Use_When>

<Steps>
1. If user provided a model name as argument, skip to step 3.

2. Ask the user which model to use. Show current setting if config exists.
   Read ~/.claude-forge/config.json to check current `geminiModel` value.

3. Write the model to config:
   - Read existing ~/.claude-forge/config.json (or start with {})
   - Set `geminiModel` to the chosen value
   - Use `mkdir -p ~/.claude-forge` then write the JSON file
   - If user says "reset" or "default", remove the `geminiModel` key

4. Confirm: "Gemini model set to [model]. Takes effect on next gemini_exec call."
</Steps>

<Config_Path>~/.claude-forge/config.json</Config_Path>
<Config_Key>geminiModel</Config_Key>
