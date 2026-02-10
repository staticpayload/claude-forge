---
name: setup
description: Setup and configure claude-forge (the ONLY command you need to learn)
---

# claude-forge Setup

This is the **only command you need to learn**. After running this, everything else is automatic.

## Pre-Setup Check: Already Configured?

**CRITICAL**: Before doing anything else, check if setup has already been completed. This prevents users from having to re-run the full setup wizard after every update.

```bash
# Check if setup was already completed
CONFIG_FILE="$HOME/.claude-forge/config.json"

if [ -f "$CONFIG_FILE" ]; then
  SETUP_COMPLETED=$(jq -r '.setupCompleted // empty' "$CONFIG_FILE" 2>/dev/null)
  SETUP_VERSION=$(jq -r '.setupVersion // empty' "$CONFIG_FILE" 2>/dev/null)

  if [ -n "$SETUP_COMPLETED" ] && [ "$SETUP_COMPLETED" != "null" ]; then
    echo "claude-forge setup was already completed on: $SETUP_COMPLETED"
    [ -n "$SETUP_VERSION" ] && echo "Setup version: $SETUP_VERSION"
    ALREADY_CONFIGURED="true"
  fi
fi
```

### If Already Configured (and no --force flag)

If `ALREADY_CONFIGURED` is true AND the user did NOT pass `--force`, `--local`, or `--global` flags:

Use AskUserQuestion to prompt:

**Question:** "claude-forge is already configured. What would you like to do?"

**Options:**
1. **Update CLAUDE.md only** - Download latest CLAUDE.md without re-running full setup
2. **Run full setup again** - Go through the complete setup wizard
3. **Cancel** - Exit without changes

**If user chooses "Update CLAUDE.md only":**
- Detect if local (.claude/CLAUDE.md) or global (~/.claude/CLAUDE.md) config exists
- If local exists, run the download/merge script from Step 2A
- If only global exists, run the download/merge script from Step 2B
- Skip all other steps
- Report success and exit

**If user chooses "Run full setup again":**
- Continue with Step 0 (Resume Detection) below

**If user chooses "Cancel":**
- Exit without any changes

### Force Flag Override

If user passes `--force` flag, skip this check and proceed directly to setup.

## Graceful Interrupt Handling

**IMPORTANT**: This setup process saves progress after each step. If interrupted (Ctrl+C or connection loss), the setup can resume from where it left off.

### State File Location
- `.forge/setup-state.json` - Tracks completed steps

### Resume Detection (Step 0)

Before starting any step, check for existing state:

```bash
# Check for existing setup state
STATE_FILE=".forge/setup-state.json"

# Cross-platform ISO date to epoch conversion
iso_to_epoch() {
  local iso_date="$1"
  local epoch=""
  # Try GNU date first (Linux)
  epoch=$(date -d "$iso_date" +%s 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$epoch" ]; then
    echo "$epoch"
    return 0
  fi
  # Try BSD/macOS date
  local clean_date=$(echo "$iso_date" | sed 's/[+-][0-9][0-9]:[0-9][0-9]$//' | sed 's/Z$//' | sed 's/T/ /')
  epoch=$(date -j -f "%Y-%m-%d %H:%M:%S" "$clean_date" +%s 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$epoch" ]; then
    echo "$epoch"
    return 0
  fi
  echo "0"
}

if [ -f "$STATE_FILE" ]; then
  # Check if state is stale (older than 24 hours)
  TIMESTAMP_RAW=$(jq -r '.timestamp // empty' "$STATE_FILE" 2>/dev/null)
  if [ -n "$TIMESTAMP_RAW" ]; then
    TIMESTAMP_EPOCH=$(iso_to_epoch "$TIMESTAMP_RAW")
    NOW_EPOCH=$(date +%s)
    STATE_AGE=$((NOW_EPOCH - TIMESTAMP_EPOCH))
  else
    STATE_AGE=999999  # Force fresh start if no timestamp
  fi
  if [ "$STATE_AGE" -gt 86400 ]; then
    echo "Previous setup state is more than 24 hours old. Starting fresh."
    rm -f "$STATE_FILE"
  else
    LAST_STEP=$(jq -r ".lastCompletedStep // 0" "$STATE_FILE" 2>/dev/null || echo "0")
    TIMESTAMP=$(jq -r .timestamp "$STATE_FILE" 2>/dev/null || echo "unknown")
    echo "Found previous setup session (Step $LAST_STEP completed at $TIMESTAMP)"
  fi
fi
```

If state exists, use AskUserQuestion to prompt:

**Question:** "Found a previous setup session. Would you like to resume or start fresh?"

**Options:**
1. **Resume from step $LAST_STEP** - Continue where you left off
2. **Start fresh** - Begin from the beginning (clears saved state)

If user chooses "Start fresh":
```bash
rm -f ".forge/setup-state.json"
echo "Previous state cleared. Starting fresh setup."
```

### Save Progress Helper

After completing each major step, save progress:

```bash
# Save setup progress (call after each step)
# Usage: save_setup_progress STEP_NUMBER
save_setup_progress() {
  mkdir -p .forge
  cat > ".forge/setup-state.json" << EOF
{
  "lastCompletedStep": $1,
  "timestamp": "$(date -Iseconds)",
  "configType": "${CONFIG_TYPE:-unknown}"
}
EOF
}
```

### Clear State on Completion

After successful setup completion (Step 8), remove the state file:

```bash
rm -f ".forge/setup-state.json"
echo "Setup completed successfully. State cleared."
```

## Usage Modes

This skill handles three scenarios:

1. **Initial Setup (no flags)**: First-time installation wizard
2. **Local Configuration (`--local`)**: Configure project-specific settings (.claude/CLAUDE.md)
3. **Global Configuration (`--global`)**: Configure global settings (~/.claude/CLAUDE.md)

## Mode Detection

Check for flags in the user's invocation:
- If `--local` flag present -> Skip Pre-Setup Check, go to Local Configuration (Step 2A)
- If `--global` flag present -> Skip Pre-Setup Check, go to Global Configuration (Step 2B)
- If `--force` flag present -> Skip Pre-Setup Check, run Initial Setup wizard (Step 1)
- If no flags -> Run Pre-Setup Check first, then Initial Setup wizard (Step 1) if needed

## Step 1: Initial Setup Wizard (Default Behavior)

**Note**: If resuming and lastCompletedStep >= 1, skip to the appropriate step based on configType.

Use the AskUserQuestion tool to prompt the user:

**Question:** "Where should I configure claude-forge?"

**Options:**
1. **Local (this project)** - Creates `.claude/CLAUDE.md` in current project directory. Best for project-specific configurations.
2. **Global (all projects)** - Creates `~/.claude/CLAUDE.md` for all Claude Code sessions. Best for consistent behavior everywhere.

## Step 2A: Local Configuration (--local flag or user chose LOCAL)

**CRITICAL**: This ALWAYS downloads fresh CLAUDE.md from GitHub to the local project. DO NOT use the Write tool - use bash curl exclusively.

### Create Local .claude Directory

```bash
# Create .claude directory in current project
mkdir -p .claude && echo ".claude directory ready"
```

### Download Fresh CLAUDE.md

```bash
# Define target path
TARGET_PATH=".claude/CLAUDE.md"

# Extract old version before download
OLD_VERSION=$(grep -m1 "FORGE:VERSION" "$TARGET_PATH" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "none")

# Backup existing
if [ -f "$TARGET_PATH" ]; then
  BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
  BACKUP_PATH="${TARGET_PATH}.backup.${BACKUP_DATE}"
  cp "$TARGET_PATH" "$BACKUP_PATH"
  echo "Backed up existing CLAUDE.md to $BACKUP_PATH"
fi

# Download fresh forge content to temp file
TEMP_FORGE=$(mktemp /tmp/forge-claude-XXXXXX.md)
trap 'rm -f "$TEMP_FORGE"' EXIT
curl -fsSL "https://raw.githubusercontent.com/staticpayload/claude-forge/master/templates/CLAUDE.md" -o "$TEMP_FORGE"

if [ ! -s "$TEMP_FORGE" ]; then
  echo "ERROR: Failed to download CLAUDE.md. Aborting."
  rm -f "$TEMP_FORGE"
  return 1
fi

# Strip existing markers from downloaded content (idempotency)
if grep -q '<!-- FORGE:START -->' "$TEMP_FORGE"; then
  # Extract content between markers
  sed -n '/<!-- FORGE:START -->/,/<!-- FORGE:END -->/{//!p}' "$TEMP_FORGE" > "${TEMP_FORGE}.clean"
  mv "${TEMP_FORGE}.clean" "$TEMP_FORGE"
fi

if [ ! -f "$TARGET_PATH" ]; then
  # Fresh install: wrap in markers
  {
    echo '<!-- FORGE:START -->'
    cat "$TEMP_FORGE"
    echo '<!-- FORGE:END -->'
  } > "$TARGET_PATH"
  rm -f "$TEMP_FORGE"
  echo "Installed CLAUDE.md (fresh)"
else
  # Merge: preserve user content outside FORGE markers
  if grep -q '<!-- FORGE:START -->' "$TARGET_PATH"; then
    # Has markers: replace FORGE section, keep user content
    BEFORE_FORGE=$(sed -n '1,/<!-- FORGE:START -->/{ /<!-- FORGE:START -->/!p }' "$TARGET_PATH")
    AFTER_FORGE=$(sed -n '/<!-- FORGE:END -->/,${  /<!-- FORGE:END -->/!p }' "$TARGET_PATH")
    {
      [ -n "$BEFORE_FORGE" ] && printf '%s\n' "$BEFORE_FORGE"
      echo '<!-- FORGE:START -->'
      cat "$TEMP_FORGE"
      echo '<!-- FORGE:END -->'
      [ -n "$AFTER_FORGE" ] && printf '%s\n' "$AFTER_FORGE"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Updated FORGE section (user customizations preserved)"
  else
    # No markers: wrap new content in markers, append old content as user section
    OLD_CONTENT=$(cat "$TARGET_PATH")
    {
      echo '<!-- FORGE:START -->'
      cat "$TEMP_FORGE"
      echo '<!-- FORGE:END -->'
      echo ""
      echo "<!-- User customizations (migrated from previous CLAUDE.md) -->"
      printf '%s\n' "$OLD_CONTENT"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Migrated existing CLAUDE.md (added FORGE markers, preserved old content)"
  fi
  rm -f "$TEMP_FORGE"
fi

# Extract new version and report
NEW_VERSION=$(grep -m1 "FORGE:VERSION" "$TARGET_PATH" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
if [ "$OLD_VERSION" = "none" ]; then
  echo "Installed CLAUDE.md: v$NEW_VERSION"
elif [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "CLAUDE.md unchanged: v$NEW_VERSION"
else
  echo "Updated CLAUDE.md: v$OLD_VERSION -> v$NEW_VERSION"
fi
```

**MANDATORY**: Always run this command. Do NOT skip. Do NOT use Write tool.

**FALLBACK** if curl fails:
Tell user to manually download from:
https://raw.githubusercontent.com/staticpayload/claude-forge/master/templates/CLAUDE.md

### Verify Plugin Installation

```bash
grep -q "claude-forge" ~/.claude/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: claude /install-plugin claude-forge"
```

### Confirm Local Configuration Success

After completing local configuration, save progress and report:

```bash
# Save progress - Step 2 complete (Local config)
mkdir -p .forge
cat > ".forge/setup-state.json" << EOF
{
  "lastCompletedStep": 2,
  "timestamp": "$(date -Iseconds)",
  "configType": "local"
}
EOF
```

**claude-forge Project Configuration Complete**
- CLAUDE.md: Updated with latest configuration from GitHub at ./.claude/CLAUDE.md
- Backup: Previous CLAUDE.md backed up to `.claude/CLAUDE.md.backup.YYYY-MM-DD_HHMMSS` (if existed)
- Scope: **PROJECT** - applies only to this project
- Hooks: Provided by plugin (5 hooks: UserPromptSubmit, SessionStart, PreToolUse, PostToolUse, Stop)
- Agents: 30+ available (explorer through product-analyst)
- CLI Delegation: Codex CLI (backend) + Gemini CLI (frontend)
- Model routing: Haiku/Sonnet/Opus based on task complexity

**Note**: This configuration is project-specific and won't affect other projects or global settings.

If `--local` flag was used, clear state and **STOP HERE**:
```bash
rm -f ".forge/setup-state.json"
```
Do not continue to CLI detection or other steps.

## Step 2B: Global Configuration (--global flag or user chose GLOBAL)

**CRITICAL**: This ALWAYS downloads fresh CLAUDE.md from GitHub to global config. DO NOT use the Write tool - use bash curl exclusively.

### Download Fresh CLAUDE.md

```bash
# Define target path
TARGET_PATH="$HOME/.claude/CLAUDE.md"

# Extract old version before download
OLD_VERSION=$(grep -m1 "FORGE:VERSION" "$TARGET_PATH" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "none")

# Backup existing
if [ -f "$TARGET_PATH" ]; then
  BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
  BACKUP_PATH="${TARGET_PATH}.backup.${BACKUP_DATE}"
  cp "$TARGET_PATH" "$BACKUP_PATH"
  echo "Backed up existing CLAUDE.md to $BACKUP_PATH"
fi

# Download fresh forge content to temp file
TEMP_FORGE=$(mktemp /tmp/forge-claude-XXXXXX.md)
trap 'rm -f "$TEMP_FORGE"' EXIT
curl -fsSL "https://raw.githubusercontent.com/staticpayload/claude-forge/master/templates/CLAUDE.md" -o "$TEMP_FORGE"

if [ ! -s "$TEMP_FORGE" ]; then
  echo "ERROR: Failed to download CLAUDE.md. Aborting."
  rm -f "$TEMP_FORGE"
  return 1
fi

# Strip existing markers from downloaded content (idempotency)
if grep -q '<!-- FORGE:START -->' "$TEMP_FORGE"; then
  # Extract content between markers
  sed -n '/<!-- FORGE:START -->/,/<!-- FORGE:END -->/{//!p}' "$TEMP_FORGE" > "${TEMP_FORGE}.clean"
  mv "${TEMP_FORGE}.clean" "$TEMP_FORGE"
fi

if [ ! -f "$TARGET_PATH" ]; then
  # Fresh install: wrap in markers
  {
    echo '<!-- FORGE:START -->'
    cat "$TEMP_FORGE"
    echo '<!-- FORGE:END -->'
  } > "$TARGET_PATH"
  rm -f "$TEMP_FORGE"
  echo "Installed CLAUDE.md (fresh)"
else
  # Merge: preserve user content outside FORGE markers
  if grep -q '<!-- FORGE:START -->' "$TARGET_PATH"; then
    # Has markers: replace FORGE section, keep user content
    BEFORE_FORGE=$(sed -n '1,/<!-- FORGE:START -->/{ /<!-- FORGE:START -->/!p }' "$TARGET_PATH")
    AFTER_FORGE=$(sed -n '/<!-- FORGE:END -->/,${  /<!-- FORGE:END -->/!p }' "$TARGET_PATH")
    {
      [ -n "$BEFORE_FORGE" ] && printf '%s\n' "$BEFORE_FORGE"
      echo '<!-- FORGE:START -->'
      cat "$TEMP_FORGE"
      echo '<!-- FORGE:END -->'
      [ -n "$AFTER_FORGE" ] && printf '%s\n' "$AFTER_FORGE"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Updated FORGE section (user customizations preserved)"
  else
    # No markers: wrap new content in markers, append old content as user section
    OLD_CONTENT=$(cat "$TARGET_PATH")
    {
      echo '<!-- FORGE:START -->'
      cat "$TEMP_FORGE"
      echo '<!-- FORGE:END -->'
      echo ""
      echo "<!-- User customizations (migrated from previous CLAUDE.md) -->"
      printf '%s\n' "$OLD_CONTENT"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Migrated existing CLAUDE.md (added FORGE markers, preserved old content)"
  fi
  rm -f "$TEMP_FORGE"
fi

# Extract new version and report
NEW_VERSION=$(grep -m1 "FORGE:VERSION" "$TARGET_PATH" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
if [ "$OLD_VERSION" = "none" ]; then
  echo "Installed CLAUDE.md: v$NEW_VERSION"
elif [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "CLAUDE.md unchanged: v$NEW_VERSION"
else
  echo "Updated CLAUDE.md: v$OLD_VERSION -> v$NEW_VERSION"
fi
```

**Note**: If an existing CLAUDE.md is found, it will be backed up to `~/.claude/CLAUDE.md.backup.YYYY-MM-DD_HHMMSS` before downloading the new version.

### Clean Up Legacy Hooks (if present)

Check if old manual hooks exist and remove them to prevent duplicates:

```bash
# Remove legacy bash hook scripts (now handled by plugin system)
rm -f ~/.claude/hooks/keyword-router.sh
rm -f ~/.claude/hooks/session-init.sh
rm -f ~/.claude/hooks/pre-tool-enforcer.sh
rm -f ~/.claude/hooks/context-monitor.sh
rm -f ~/.claude/hooks/continuation.sh
echo "Legacy hooks cleaned"
```

Check `~/.claude/settings.json` for manual hook entries. If the "hooks" key exists with UserPromptSubmit, Stop, or SessionStart entries pointing to bash scripts, inform the user:

> **Note**: Found legacy hooks in settings.json. These should be removed since the plugin now provides hooks automatically via `hooks/hooks.json`. Remove the "hooks" section from ~/.claude/settings.json to prevent duplicate hook execution.

### Verify Plugin Installation

```bash
grep -q "claude-forge" ~/.claude/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: claude /install-plugin claude-forge"
```

### Confirm Global Configuration Success

After completing global configuration, save progress and report:

```bash
# Save progress - Step 2 complete (Global config)
mkdir -p .forge
cat > ".forge/setup-state.json" << EOF
{
  "lastCompletedStep": 2,
  "timestamp": "$(date -Iseconds)",
  "configType": "global"
}
EOF
```

**claude-forge Global Configuration Complete**
- CLAUDE.md: Updated with latest configuration from GitHub at ~/.claude/CLAUDE.md
- Backup: Previous CLAUDE.md backed up to `~/.claude/CLAUDE.md.backup.YYYY-MM-DD_HHMMSS` (if existed)
- Scope: **GLOBAL** - applies to all Claude Code sessions
- Hooks: Provided by plugin (5 hooks: UserPromptSubmit, SessionStart, PreToolUse, PostToolUse, Stop)
- Agents: 30+ available (explorer through product-analyst)
- CLI Delegation: Codex CLI (backend) + Gemini CLI (frontend)
- Model routing: Haiku/Sonnet/Opus based on task complexity

**Note**: Hooks are now managed by the plugin system automatically. No manual hook installation required.

If `--global` flag was used, clear state and **STOP HERE**:
```bash
rm -f ".forge/setup-state.json"
```
Do not continue to CLI detection or other steps.

## Step 3: CLI Detection & Installation

**Note**: If resuming and lastCompletedStep >= 3, skip to Step 4.

Detect which external CLIs are available for delegation:

### Detect Codex CLI

```bash
# Check for Codex CLI
CODEX_PATH=""
CODEX_VERSION=""

# Try which first
if command -v codex &>/dev/null; then
  CODEX_PATH=$(which codex)
fi

# Check known paths
if [ -z "$CODEX_PATH" ]; then
  for p in /usr/local/bin/codex /opt/homebrew/bin/codex "$HOME/.npm-global/bin/codex" "$HOME/.local/bin/codex"; do
    if [ -x "$p" ]; then
      CODEX_PATH="$p"
      break
    fi
  done
fi

if [ -n "$CODEX_PATH" ]; then
  CODEX_VERSION=$(codex --version 2>/dev/null | head -1 || echo "installed")
  echo "Codex CLI detected at: $CODEX_PATH ($CODEX_VERSION)"
else
  echo "Codex CLI not found"
fi
```

### Detect Gemini CLI

```bash
# Check for Gemini CLI
GEMINI_PATH=""
GEMINI_VERSION=""

# Try which first
if command -v gemini &>/dev/null; then
  GEMINI_PATH=$(which gemini)
fi

# Check known paths
if [ -z "$GEMINI_PATH" ]; then
  for p in /usr/local/bin/gemini /opt/homebrew/bin/gemini "$HOME/.npm-global/bin/gemini" "$HOME/.local/bin/gemini"; do
    if [ -x "$p" ]; then
      GEMINI_PATH="$p"
      break
    fi
  done
fi

if [ -n "$GEMINI_PATH" ]; then
  GEMINI_VERSION=$(gemini --version 2>/dev/null | head -1 || echo "installed")
  echo "Gemini CLI detected at: $GEMINI_PATH ($GEMINI_VERSION)"
else
  echo "Gemini CLI not found"
fi
```

### Report CLI Status

If **Codex CLI not found**, tell the user:
> Codex CLI is not installed. You can install it later with:
> `npm install -g @openai/codex`
> Then run `/claude-forge:enable-codex` to activate it.

If **Gemini CLI not found**, tell the user:
> Gemini CLI is not installed. You can install it later with:
> `npm install -g @google/gemini-cli`
> Then run `/claude-forge:enable-gemini` to activate it.

If **neither CLI is found**:
> Neither Codex CLI nor Gemini CLI is installed. That's fine -- claude-forge includes built-in agent fallbacks (`/claude-forge:backend-agent` and `/claude-forge:frontend-agent`) that handle delegation without external CLIs. Install the CLIs later for enhanced multi-model capabilities.

### Save Progress

```bash
# Save progress - Step 3 complete (CLI detection)
mkdir -p .forge
CONFIG_TYPE=$(jq -r '.configType // "unknown"' ".forge/setup-state.json" 2>/dev/null || echo "unknown")
cat > ".forge/setup-state.json" << EOF
{
  "lastCompletedStep": 3,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## Step 4: Model Configuration

**Note**: If resuming and lastCompletedStep >= 4, skip to Step 5.

### Codex Model Preference

Use the AskUserQuestion tool to prompt:

**Question:** "Which model should Codex CLI use for backend delegation?"

**Options:**
1. **CLI default** - Use whatever model Codex CLI defaults to (no override)
2. **o3** - OpenAI o3 (recommended for complex reasoning)
3. **gpt-4.1** - GPT-4.1 (fast, capable)
4. **o4-mini** - o4-mini (cost-efficient)
5. **codex-mini** - Codex Mini (fastest, cheapest)

### Gemini Model Preference

Use the AskUserQuestion tool to prompt:

**Question:** "Which model should Gemini CLI use for frontend delegation?"

**Options:**
1. **CLI default** - Use whatever Gemini CLI defaults to (no override)
2. **gemini-2.5-pro** - Gemini 2.5 Pro (recommended, 1M context)
3. **gemini-2.5-flash** - Gemini 2.5 Flash (fast, cost-efficient)
4. **gemini-2.0-flash** - Gemini 2.0 Flash (fastest)

### Write Model Configuration

```bash
# Write model choices to config
CONFIG_FILE="$HOME/.claude-forge/config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# Replace CODEX_MODEL and GEMINI_MODEL with user choices (or omit if "CLI default")
# Only add model keys if user chose a specific model, not "CLI default"
echo "$EXISTING" | jq \
  --arg cxModel "CODEX_MODEL" \
  --arg gmModel "GEMINI_MODEL" \
  '. + (if $cxModel != "default" then {codexModel: $cxModel} else {} end) + (if $gmModel != "default" then {geminiModel: $gmModel} else {} end) + {configuredAt: (now | todate)}' > "$CONFIG_FILE"

echo "Model configuration saved"
```

### Save Progress

```bash
# Save progress - Step 4 complete (Model config)
mkdir -p .forge
CONFIG_TYPE=$(jq -r '.configType // "unknown"' ".forge/setup-state.json" 2>/dev/null || echo "unknown")
cat > ".forge/setup-state.json" << EOF
{
  "lastCompletedStep": 4,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## Step 5: HUD Setup

**Note**: If resuming and lastCompletedStep >= 5, skip to Step 5.5.

### Check Current HUD Status

```bash
SETTINGS_FILE="$HOME/.claude/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
  CURRENT_HUD=$(jq -r '.statusLine.command // empty' "$SETTINGS_FILE" 2>/dev/null)
  if [ -n "$CURRENT_HUD" ]; then
    echo "Current HUD: $CURRENT_HUD"
  else
    echo "No HUD configured"
  fi
else
  echo "No settings.json found"
fi
```

### Detect Existing HUD

If the current HUD command contains "omc-hud" or another third-party HUD:

Use AskUserQuestion to prompt:

**Question:** "An existing HUD is detected. Would you like to keep it or switch to the Forge HUD?"

**Options:**
1. **Keep existing HUD** - Leave the current HUD unchanged
2. **Switch to Forge HUD** - Replace with the forge HUD (shows CLI status, jobs, rate limits)

If user chooses "Keep existing HUD", skip the rest of this step.

### Offer HUD Installation (if no HUD or user chose to switch)

If no HUD is configured:

Use AskUserQuestion to prompt:

**Question:** "Would you like to install the Forge HUD statusline? It shows rate limits, CLI availability, active jobs, models, cost estimates, and context usage."

**Options:**
1. **Yes, install Forge HUD (Recommended)** - Install and configure the statusline
2. **No, skip** - Leave statusline unconfigured

If user chooses "No, skip", skip the rest of this step.

### Install Forge HUD

**Invoke the hud skill** to set up and configure:

Use the Skill tool to invoke: `hud` with args: `setup`

This will:
1. Install the HUD wrapper script to `~/.claude/hud/forge-hud.mjs`
2. Configure `statusLine` in `~/.claude/settings.json`
3. Report status and prompt to restart if needed

The HUD displays:
- `[FORGE]` label
- 5h and weekly rate limit bars with reset timers
- CLI availability (codex/gemini checkmarks)
- Configured models
- Active/completed/failed delegation jobs
- Session duration
- Health indicator (green/yellow/red)
- Cost estimate
- Token count
- Context window usage bar

### Save Progress

```bash
# Save progress - Step 5 complete (HUD setup)
mkdir -p .forge
CONFIG_TYPE=$(jq -r '.configType // "unknown"' ".forge/setup-state.json" 2>/dev/null || echo "unknown")
cat > ".forge/setup-state.json" << EOF
{
  "lastCompletedStep": 5,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## Step 5.5: Clear Stale Plugin Cache

Clear old cached plugin versions to avoid conflicts:

```bash
# Clear stale plugin cache versions
CACHE_DIR="$HOME/.claude/plugins/cache"
CLEARED_TOTAL=0

# Check all possible cache locations for claude-forge
for FORGE_CACHE in "$CACHE_DIR"/*/claude-forge "$CACHE_DIR"/claude-forge/claude-forge; do
  if [ -d "$FORGE_CACHE" ]; then
    LATEST=$(ls -1 "$FORGE_CACHE" 2>/dev/null | sort -V | tail -1)
    for dir in "$FORGE_CACHE"/*; do
      if [ -d "$dir" ] && [ "$(basename "$dir")" != "$LATEST" ]; then
        rm -rf "$dir"
        CLEARED_TOTAL=$((CLEARED_TOTAL + 1))
      fi
    done
  fi
done

[ $CLEARED_TOTAL -gt 0 ] && echo "Cleared $CLEARED_TOTAL stale cache version(s)" || echo "Cache is clean"
```

## Step 5.6: Check for Updates

Notify user if a newer version is available:

```bash
# Detect installed version
INSTALLED_VERSION=""

# Try cache directory first
for FORGE_CACHE in "$HOME/.claude/plugins/cache"/*/claude-forge "$HOME/.claude/plugins/cache/claude-forge/claude-forge"; do
  if [ -d "$FORGE_CACHE" ]; then
    INSTALLED_VERSION=$(ls -1 "$FORGE_CACHE" 2>/dev/null | sort -V | tail -1)
    [ -n "$INSTALLED_VERSION" ] && break
  fi
done

# Try config.json second
if [ -z "$INSTALLED_VERSION" ]; then
  INSTALLED_VERSION=$(jq -r '.setupVersion // empty' "$HOME/.claude-forge/config.json" 2>/dev/null)
fi

# Try CLAUDE.md header third (local first, then global)
if [ -z "$INSTALLED_VERSION" ]; then
  if [ -f ".claude/CLAUDE.md" ]; then
    INSTALLED_VERSION=$(grep -m1 "FORGE:VERSION" .claude/CLAUDE.md 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  elif [ -f "$HOME/.claude/CLAUDE.md" ]; then
    INSTALLED_VERSION=$(grep -m1 "FORGE:VERSION" "$HOME/.claude/CLAUDE.md" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  fi
fi

# Check npm for latest version
LATEST_VERSION=$(npm view claude-forge version 2>/dev/null)

if [ -n "$INSTALLED_VERSION" ] && [ -n "$LATEST_VERSION" ]; then
  if [ "$INSTALLED_VERSION" != "$LATEST_VERSION" ]; then
    echo ""
    echo "UPDATE AVAILABLE:"
    echo "  Installed: v$INSTALLED_VERSION"
    echo "  Latest:    v$LATEST_VERSION"
    echo ""
    echo "To update, run: claude /install-plugin claude-forge"
  else
    echo "You're on the latest version: v$INSTALLED_VERSION"
  fi
elif [ -n "$LATEST_VERSION" ]; then
  echo "Latest version available: v$LATEST_VERSION"
elif [ -n "$INSTALLED_VERSION" ]; then
  echo "Installed version: v$INSTALLED_VERSION (npm check unavailable)"
fi
```

## Step 5.7: Set Default Execution Mode

Use the AskUserQuestion tool to prompt the user:

**Question:** "Which parallel execution mode should be your default when you say 'fast' or 'parallel'?"

**Options:**
1. **ultrawork (maximum capability)** - Uses all agent tiers including Opus for complex tasks. Best for challenging work where quality matters most. (Recommended)
2. **ecomode (token efficient)** - Prefers Haiku/Sonnet agents, avoids Opus. Best for pro-plan users who want cost efficiency.

Store the preference in `~/.claude-forge/config.json`:

```bash
# Read existing config or create empty object
CONFIG_FILE="$HOME/.claude-forge/config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# Set defaultExecutionMode (replace USER_CHOICE with "ultrawork" or "ecomode")
echo "$EXISTING" | jq --arg mode "USER_CHOICE" '. + {defaultExecutionMode: $mode}' > "$CONFIG_FILE"
echo "Default execution mode set to: USER_CHOICE"
```

**Note**: This preference ONLY affects generic keywords ("fast", "parallel"). Explicit keywords ("ulw", "eco") always override this preference.

### Save Progress

```bash
# Save progress - Step 5.7 complete (Execution mode)
mkdir -p .forge
CONFIG_TYPE=$(jq -r '.configType // "unknown"' ".forge/setup-state.json" 2>/dev/null || echo "unknown")
cat > ".forge/setup-state.json" << EOF
{
  "lastCompletedStep": 5.7,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## Step 5.8: Configure Agent Teams (Optional)

**Note**: If resuming and lastCompletedStep >= 5.8, skip to Step 6.

Agent teams are an experimental Claude Code feature that lets you spawn N coordinated agents working on a shared task list with inter-agent messaging. **Teams are disabled by default** and require enabling via `settings.json`.

Use the AskUserQuestion tool to prompt:

**Question:** "Would you like to enable agent teams? Teams let you spawn coordinated agents (e.g., `/claude-forge:team 3:executor 'fix all errors'`). This is an experimental Claude Code feature."

**Options:**
1. **Yes, enable teams (Recommended)** - Enable the experimental feature and configure defaults
2. **No, skip** - Leave teams disabled (can enable later)

### If User Chooses YES:

#### Step 5.8.1: Enable Agent Teams in settings.json

**CRITICAL**: Agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` to be set in `~/.claude/settings.json`. This must be done carefully to preserve existing user settings.

First, read the current settings.json:

```bash
SETTINGS_FILE="$HOME/.claude/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
  echo "Current settings.json found"
  cat "$SETTINGS_FILE"
else
  echo "No settings.json found - will create one"
fi
```

Then use the Read tool to read `~/.claude/settings.json` (if it exists). Use the Edit tool to merge the teams configuration while preserving ALL existing settings.

**If settings.json exists and has an `env` key**, merge the new env var into it:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Use jq to safely merge without overwriting existing settings:

```bash
SETTINGS_FILE="$HOME/.claude/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
  # Merge env var into existing settings, preserving everything else
  TEMP_FILE=$(mktemp)
  jq '.env = (.env // {} | . + {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"})' "$SETTINGS_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$SETTINGS_FILE"
  echo "Added CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS to existing settings.json"
else
  # Create new settings.json with just the teams env var
  mkdir -p "$(dirname "$SETTINGS_FILE")"
  cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
SETTINGS_EOF
  echo "Created settings.json with teams enabled"
fi
```

**IMPORTANT**: The Edit tool is preferred for modifying settings.json when possible, since it preserves formatting and comments. The jq approach above is the fallback for when the file needs structural merging.

#### Step 5.8.2: Configure Teammate Display Mode

Use the AskUserQuestion tool:

**Question:** "How should teammates be displayed?"

**Options:**
1. **Auto (Recommended)** - Uses split panes if in tmux, otherwise in-process. Best for most users.
2. **In-process** - All teammates in your main terminal. Use Shift+Up/Down to select. Works everywhere.
3. **Split panes (tmux)** - Each teammate in its own pane. Requires tmux or iTerm2.

If user chooses anything other than "Auto", add `teammateMode` to settings.json:

```bash
SETTINGS_FILE="$HOME/.claude/settings.json"

# TEAMMATE_MODE is "in-process" or "tmux" based on user choice
# Skip this if user chose "Auto" (that's the default)
jq --arg mode "TEAMMATE_MODE" '. + {teammateMode: $mode}' "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"
echo "Teammate display mode set to: TEAMMATE_MODE"
```

#### Step 5.8.3: Configure Team Defaults in forge config

Use the AskUserQuestion tool with multiple questions:

**Question 1:** "How many agents should teams spawn by default?"

**Options:**
1. **3 agents (Recommended)** - Good balance of speed and resource usage
2. **5 agents (maximum)** - Maximum parallelism for large tasks
3. **2 agents** - Conservative, for smaller projects

**Question 2:** "Which agent type should teammates use by default?"

**Options:**
1. **executor (Recommended)** - General-purpose code implementation agent
2. **build-fixer** - Specialized for build/type error fixing
3. **designer** - Specialized for UI/frontend work

**Question 3:** "Which model should teammates use by default?"

**Options:**
1. **sonnet (Recommended)** - Fast, capable, cost-effective for most tasks
2. **opus** - Maximum capability for complex tasks (higher cost)
3. **haiku** - Fastest and cheapest, good for simple/repetitive tasks

Store the team configuration in `~/.claude-forge/config.json`:

```bash
CONFIG_FILE="$HOME/.claude-forge/config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# Replace MAX_AGENTS, AGENT_TYPE, MODEL with user choices
echo "$EXISTING" | jq \
  --argjson maxAgents MAX_AGENTS \
  --arg agentType "AGENT_TYPE" \
  --arg model "MODEL" \
  '. + {team: {maxAgents: $maxAgents, defaultAgentType: $agentType, defaultModel: $model, monitorIntervalMs: 30000, shutdownTimeoutMs: 15000, watchdogWarningMs: 300000, watchdogReassignMs: 600000, maxConsecutiveErrors: 3, enableCascade: true, enableCrossCliVerification: true}}' > "$CONFIG_FILE"

echo "Team configuration saved:"
echo "  Max agents: MAX_AGENTS"
echo "  Default agent: AGENT_TYPE"
echo "  Default model: MODEL"
```

#### Verify settings.json Integrity

After all modifications, verify settings.json is valid JSON and contains the expected keys:

```bash
SETTINGS_FILE="$HOME/.claude/settings.json"

# Verify JSON is valid
if jq empty "$SETTINGS_FILE" 2>/dev/null; then
  echo "settings.json: valid JSON"
else
  echo "ERROR: settings.json is invalid JSON! Restoring from backup..."
  exit 1
fi

# Verify teams env var is present
if jq -e '.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS' "$SETTINGS_FILE" > /dev/null 2>&1; then
  echo "Agent teams: ENABLED"
else
  echo "WARNING: Agent teams env var not found in settings.json"
fi

# Show final settings.json for user review
echo ""
echo "Final settings.json:"
jq '.' "$SETTINGS_FILE"
```

### If User Chooses NO:

Skip this step. Agent teams will remain disabled. User can enable later by adding to `~/.claude/settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or by running `/claude-forge:setup --force` and choosing to enable teams.

### Save Progress

```bash
# Save progress - Step 5.8 complete (Teams configured)
mkdir -p .forge
CONFIG_TYPE=$(jq -r '.configType // "unknown"' ".forge/setup-state.json" 2>/dev/null || echo "unknown")
cat > ".forge/setup-state.json" << EOF
{
  "lastCompletedStep": 5.8,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## Step 6: Verify Plugin Installation

```bash
grep -q "claude-forge" ~/.claude/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: claude /install-plugin claude-forge"
```

## Step 7: Show Welcome Message

### For New Users:

```
claude-forge Setup Complete!

You don't need to learn any commands. I now have intelligent behaviors that activate automatically.

WHAT HAPPENS AUTOMATICALLY:
- Backend tasks -> Delegated to Codex CLI (or built-in backend agent)
- Frontend tasks -> Delegated to Gemini CLI (or built-in frontend agent)
- Complex tasks -> I parallelize and delegate to specialist agents
- "plan this" -> I start a planning interview
- "don't stop until done" -> I persist until verified complete
- "stop" or "cancel" -> I intelligently stop current operation

MAGIC KEYWORDS (optional power-user shortcuts):
Just include these words naturally in your request:

| Keyword         | Effect                  | Example                          |
|-----------------|-------------------------|----------------------------------|
| forge this      | Auto-route to best CLI  | "forge this API endpoint"        |
| ralph           | Persistence mode        | "ralph: fix the auth bug"        |
| ulw / ultrawork | Max parallelism         | "ulw refactor the API"           |
| eco / ecomode   | Token-efficient mode    | "eco refactor the API"           |
| plan            | Planning interview      | "plan the new endpoints"         |
| team            | Coordinated agents      | "/team 3:executor fix errors"    |
| use codex       | Direct Codex delegation | "use codex to build the worker"  |
| use gemini      | Direct Gemini delegation| "use gemini for the UI"          |

SKILLS (42 available):

  Execution Modes:
    /claude-forge:autopilot      Full autonomous: idea -> code -> tests -> verified
    /claude-forge:ralph          Persistence loop with architect verification
    /claude-forge:ultrawork      Maximum parallelism, parallel agents
    /claude-forge:ecomode        Token-efficient model routing
    /claude-forge:ultraqa        QA cycling: test -> fix -> repeat
    /claude-forge:ultrapilot     Parallel autopilot with file ownership

  Orchestration:
    /claude-forge:team           N coordinated agents on shared task list
    /claude-forge:pipeline       Sequential agent chains with data passing

  Planning & Research:
    /claude-forge:plan           Strategic planning (--consensus, --review)
    /claude-forge:research       Parallel investigation with evidence synthesis

  CLI Delegation:
    /claude-forge:forge          Auto-route to best CLI
    /claude-forge:backend        Direct Codex delegation
    /claude-forge:frontend       Direct Gemini delegation
    /claude-forge:backend-agent  Built-in backend agent (no CLI needed)
    /claude-forge:frontend-agent Built-in frontend agent (no CLI needed)
    /claude-forge:review         Parallel review via both CLIs
    /claude-forge:parallel       Decompose + parallel multi-CLI execution

  Code Quality:
    /claude-forge:code-review    Severity-rated multi-dimension review
    /claude-forge:security-review OWASP Top 10 + secrets + auth audit
    /claude-forge:tdd            Red-Green-Refactor enforcement
    /claude-forge:build-fix      Minimal fixes for build errors

  Analysis:
    /claude-forge:analyze        Deep investigation (architecture, bugs, perf)
    /claude-forge:deepsearch     Exhaustive codebase search

  Productivity:
    /claude-forge:worktree       Git worktree manager for parallel sessions
    /claude-forge:techdebt       Find duplicates, dead exports, stale TODOs
    /claude-forge:fix            Auto-fix from CI/docker/error logs
    /claude-forge:learn          Auto-update CLAUDE.md with learnings
    /claude-forge:deepinit       Generate hierarchical AGENTS.md
    /claude-forge:note           Persistent notepad across sessions
    /claude-forge:learner        Extract reusable skills/insights
    /claude-forge:trace          Agent flow timeline and summary

  Specialist Agents:
    /claude-forge:frontend-ui-ux UI/UX design and component work
    /claude-forge:git-master     Atomic commits, rebasing, history

  Configuration:
    /claude-forge:setup          This wizard
    /claude-forge:doctor         Diagnose and fix issues
    /claude-forge:help           Full feature guide
    /claude-forge:hud            Configure HUD statusline
    /claude-forge:set-codex-model / set-gemini-model
    /claude-forge:enable-codex   / enable-gemini
    /claude-forge:cancel         Cancel active mode

TEAMS:
Spawn coordinated agents with smart routing, cascade mode, and cross-CLI verification:
- /claude-forge:team 3:executor "fix all TypeScript errors"
- /claude-forge:team build-team "implement the auth module"
- /claude-forge:team review-team "review the API changes"
- /claude-forge:team fullstack-team "build the dashboard"
Templates: build-team, review-team, fullstack-team, audit-team, debug-team

SWARM:
Fire-and-forget parallel execution (no team overhead):
- /claude-forge:swarm 5 "add JSDoc to all exported functions"
- /claude-forge:swarm "fix lint errors across the project"

HUD STATUSLINE:
The status bar shows forge state: rate limits (5h + weekly), CLI availability,
configured models, active delegation jobs, session duration, cost estimate,
and context window usage. Restart Claude Code to see it.

That's it! Just use Claude Code normally.
```

## Step 8: Ask About Starring Repository

First, check if `gh` CLI is available and authenticated:

```bash
gh auth status &>/dev/null
```

### If gh is available and authenticated:

Use the AskUserQuestion tool to prompt the user:

**Question:** "If you're enjoying claude-forge, would you like to support the project by starring it on GitHub?"

**Options:**
1. **Yes, star it!** - Star the repository
2. **No thanks** - Skip without further prompts
3. **Maybe later** - Skip without further prompts

If user chooses "Yes, star it!":

```bash
gh api -X PUT /user/starred/staticpayload/claude-forge 2>/dev/null && echo "Thanks for starring!" || true
```

**Note:** Fail silently if the API call doesn't work -- never block setup completion.

### If gh is NOT available or not authenticated:

```bash
echo ""
echo "If you enjoy claude-forge, consider starring the repo:"
echo "  https://github.com/staticpayload/claude-forge"
echo ""
```

### Clear Setup State and Mark Completion

After Step 8 completes (regardless of star choice), clear the temporary state and mark setup as completed:

```bash
# Setup complete - clear temporary state file
rm -f ".forge/setup-state.json"

# Mark setup as completed in persistent config (prevents re-running full setup on updates)
CONFIG_FILE="$HOME/.claude-forge/config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

# Get current forge version from CLAUDE.md
FORGE_VERSION=""
if [ -f ".claude/CLAUDE.md" ]; then
  FORGE_VERSION=$(grep -m1 "FORGE:VERSION" .claude/CLAUDE.md 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
elif [ -f "$HOME/.claude/CLAUDE.md" ]; then
  FORGE_VERSION=$(grep -m1 "FORGE:VERSION" "$HOME/.claude/CLAUDE.md" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
fi

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# Add setupCompleted timestamp and version
echo "$EXISTING" | jq --arg ts "$(date -Iseconds)" --arg ver "$FORGE_VERSION" \
  '. + {setupCompleted: $ts, setupVersion: $ver}' > "$CONFIG_FILE"

echo "Setup completed successfully!"
echo "Note: Future updates will only refresh CLAUDE.md, not the full setup wizard."
```

## Keeping Up to Date

After installing claude-forge updates (via npm or plugin update):

**Automatic**: Just run `/claude-forge:setup` -- it will detect you've already configured and offer a quick "Update CLAUDE.md only" option that skips the full wizard.

**Manual options**:
- `/claude-forge:setup --local` to update project config only
- `/claude-forge:setup --global` to update global config only
- `/claude-forge:setup --force` to re-run the full wizard (reconfigure preferences)

This ensures you have the newest features and agent configurations without the token cost of repeating the full setup.

## Help Text

When user runs `/claude-forge:setup --help` or just `--help`, display:

```
claude-forge Setup - Configure claude-forge

USAGE:
  /claude-forge:setup           Run initial setup wizard (or update if already configured)
  /claude-forge:setup --local   Configure local project (.claude/CLAUDE.md)
  /claude-forge:setup --global  Configure global settings (~/.claude/CLAUDE.md)
  /claude-forge:setup --force   Force full setup wizard even if already configured
  /claude-forge:setup --help    Show this help

MODES:
  Initial Setup (no flags)
    - Interactive wizard for first-time setup
    - Configures CLAUDE.md (local or global)
    - Detects Codex CLI and Gemini CLI
    - Configures model preferences
    - Sets up HUD statusline
    - Checks for updates
    - Sets default execution mode (ultrawork or ecomode)
    - Configures team mode defaults (agent count, type, model)
    - If already configured, offers quick update option

  Local Configuration (--local)
    - Downloads fresh CLAUDE.md to ./.claude/
    - Backs up existing CLAUDE.md to .claude/CLAUDE.md.backup.YYYY-MM-DD_HHMMSS
    - Project-specific settings
    - Use this to update project config after forge upgrades

  Global Configuration (--global)
    - Downloads fresh CLAUDE.md to ~/.claude/
    - Backs up existing CLAUDE.md to ~/.claude/CLAUDE.md.backup.YYYY-MM-DD_HHMMSS
    - Applies to all Claude Code sessions
    - Cleans up legacy hooks
    - Use this to update global config after forge upgrades

  Force Full Setup (--force)
    - Bypasses the "already configured" check
    - Runs the complete setup wizard from scratch
    - Use when you want to reconfigure preferences

EXAMPLES:
  /claude-forge:setup           # First time setup (or update CLAUDE.md if configured)
  /claude-forge:setup --local   # Update this project
  /claude-forge:setup --global  # Update all projects
  /claude-forge:setup --force   # Re-run full setup wizard

KEY PATHS:
  Config:     ~/.claude-forge/config.json
  State:      .forge/ (at git worktree root)
  CLAUDE.md:  ~/.claude/CLAUDE.md (global) or .claude/CLAUDE.md (local)
  HUD:        hud/forge-hud.mjs (in plugin root)
  Plugin:     .claude-plugin/plugin.json
  Hooks:      hooks/hooks.json (5 hooks)

For more info: https://github.com/staticpayload/claude-forge
```
