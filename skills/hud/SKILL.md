---
name: hud
description: Setup and configure the claude-forge HUD statusline
---

<Purpose>
Install and configure the claude-forge HUD — a real-time statusline that shows
CLI availability, active delegation jobs, configured models, and context usage.
Works standalone or as a lightweight alternative to OMC's HUD.
</Purpose>

<Use_When>
- User says "forge hud", "setup hud", "forge statusline"
- First-time setup of claude-forge
- User wants to see delegation status in the statusline
</Use_When>

<Steps>
1. **Check current status**:
   - Read `~/.claude/settings.json` to see if `statusLine` is already configured
   - Check if `~/.claude/hud/forge-hud.mjs` wrapper exists
   - If OMC HUD is active, warn user that switching will replace it

2. **Create wrapper script** at `~/.claude/hud/forge-hud.mjs`:
   ```javascript
   #!/usr/bin/env node
   // Forge HUD wrapper - finds plugin and runs HUD
   import { existsSync } from "node:fs";
   import { homedir } from "node:os";
   import { join } from "node:path";
   import { pathToFileURL } from "node:url";

   const home = homedir();
   const paths = [
     // Plugin installation paths
     join(home, ".claude/plugins/cache/claude-forge/claude-forge/1.0.0/hud/forge-hud.mjs"),
     // Direct installation
     join(home, "Mainframe/claude-forge/hud/forge-hud.mjs"),
   ];

   for (const p of paths) {
     if (existsSync(p)) {
       await import(pathToFileURL(p).href);
       process.exit(0);
     }
   }
   console.log("[FORGE] HUD not found. Reinstall claude-forge plugin.");
   ```
   - Use `mkdir -p ~/.claude/hud` then write the file
   - Make the wrapper executable

3. **Configure statusLine** in `~/.claude/settings.json`:
   - Read current settings
   - Set `statusLine` to: `{ "type": "command", "command": "node ~/.claude/hud/forge-hud.mjs" }`
   - Write back (preserving all other settings)

4. **Confirm**: Tell user to restart Claude Code for the HUD to take effect.

5. **If user says "status"**: Just report current HUD config without changing anything.
</Steps>

<Display_Elements>
The HUD shows a single line:
```
[FORGE] codex:ready | gemini:ready | cx:o3 | jobs:cx:1+gm:2 | done:3 | ctx:45% | myproject
```

Elements (left to right):
- `[FORGE]` - Plugin label
- `codex:ready/off` - CLI availability
- `gemini:ready/off` - CLI availability
- `cx:<model>` - Configured Codex model (if set)
- `gm:<model>` - Configured Gemini model (if set)
- `jobs:<counts>` - Active delegation jobs
- `done:<n>` / `fail:<n>` - Completed/failed job counts
- `ctx:<pct>%` - Context window usage (green/yellow/red)
- `<dirname>` - Current working directory
</Display_Elements>
