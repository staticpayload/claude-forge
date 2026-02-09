---
name: setup
description: Interactive setup wizard for claude-forge — configure everything step by step
---

<Purpose>
First-run setup wizard for claude-forge. Walks new users through every
configuration option step by step: CLI detection, model selection, HUD setup,
worktree aliases, and feature overview. Run once after installing the plugin.
</Purpose>

<Use_When>
- User says "forge setup", "setup forge", "configure forge"
- First time using claude-forge after installation
- User wants to reconfigure their setup
</Use_When>

<Steps>
1. **Welcome**:
   Print a welcome banner:
   ```
   === claude-forge Setup Wizard ===
   Multi-CLI delegation plugin for Claude Code.
   Let's get you configured in 5 easy steps.
   ```

2. **Step 1 — CLI Detection**:
   Check for Codex CLI and Gemini CLI:
   - Run `which codex` and `which gemini` (or check known paths)
   - If Codex found: "Codex CLI detected at [path]. Backend delegation ready."
   - If Codex NOT found: Ask "Would you like to install Codex CLI? (npm install -g @openai/codex)"
   - If Gemini found: "Gemini CLI detected at [path]. Frontend delegation ready."
   - If Gemini NOT found: Ask "Would you like to install Gemini CLI? (npm install -g @anthropic-ai/gemini)" or provide the install command.
   - Tell user about `/claude-forge:enable-codex` and `/claude-forge:enable-gemini` for when they install CLIs later.

3. **Step 2 — Model Configuration**:
   - Ask if user wants to set a specific model for Codex (or use CLI default)
   - Ask if user wants to set a specific model for Gemini (or use CLI default)
   - If yes, write to `~/.claude-forge/config.json`
   - If no, skip (CLI defaults will be used)

4. **Step 3 — HUD Setup**:
   - Check if `~/.claude/settings.json` has a `statusLine` configured
   - If OMC HUD is active: "OMC HUD detected. You can keep it or switch to the Forge HUD."
   - If no HUD: Offer to install the Forge HUD
   - Setup: create `~/.claude/hud/forge-hud.mjs` wrapper, configure `statusLine`
   - The HUD shows: rate limits (5h + weekly), CLI status, models, jobs, context

5. **Step 4 — Skill Overview**:
   List all available skills grouped by category:
   ```
   Delegation:
     /claude-forge:forge         Auto-route to best CLI
     /claude-forge:backend       Direct Codex delegation
     /claude-forge:frontend      Direct Gemini delegation
     /claude-forge:backend-agent Built-in agent (no CLI needed)
     /claude-forge:frontend-agent Built-in agent (no CLI needed)
     /claude-forge:review        Parallel review via both CLIs
     /claude-forge:parallel      Split task for parallel execution

   Productivity:
     /claude-forge:worktree      Manage git worktrees for parallel sessions
     /claude-forge:techdebt      Find duplicated code, dead exports, TODOs
     /claude-forge:fix           Auto-fix from CI/docker/error logs
     /claude-forge:learn         Auto-update CLAUDE.md with learnings

   Configuration:
     /claude-forge:set-codex-model   Set Codex model
     /claude-forge:set-gemini-model  Set Gemini model
     /claude-forge:enable-codex      Enable Codex after installing CLI
     /claude-forge:enable-gemini     Enable Gemini after installing CLI
     /claude-forge:hud               Configure HUD statusline
     /claude-forge:setup             This wizard
   ```

6. **Step 5 — Quick Tips**:
   ```
   Quick Start:
   - Say "forge this" to auto-route any task
   - Say "forge review" for dual-CLI code review
   - Say "fix CI" to auto-fix failing tests
   - Say "techdebt" at end of session to clean up
   - Say "worktree" to set up parallel sessions

   Pro Tips:
   - Tasks are auto-classified by keywords (api, component, etc.)
   - If a CLI is missing, built-in agents handle it automatically
   - Models can be changed anytime via /claude-forge:set-codex-model
   ```

7. **Done**:
   "Setup complete! Restart Claude Code for HUD changes to take effect."
   Show a summary of what was configured.
</Steps>
