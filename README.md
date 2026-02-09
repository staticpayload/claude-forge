```
      _                 _             __
  ___| | __ _ _   _  __| | ___       / _| ___  _ __ __ _  ___
 / __| |/ _` | | | |/ _` |/ _ \____ | |_ / _ \| '__/ _` |/ _ \
| (__| | (_| | |_| | (_| |  __/_____||  _| (_) | | | (_| |  __/
 \___|_|\__,_|\__,_|\__,_|\___|     |_|  \___/|_|  \__, |\___|
                                                    |___/
```

# claude-forge

**Multi-CLI delegation and orchestration for Claude Code.**

Route backend work to [Codex CLI](https://github.com/openai/codex), frontend work to [Gemini CLI](https://github.com/google-gemini/gemini-cli), and orchestrate everything through 42 skills, intelligent auto-routing, and parallel execution modes.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet.svg)](https://docs.anthropic.com/en/docs/claude-code)

---

## Why claude-forge?

Claude Code is powerful on its own. But it's a single brain. claude-forge turns it into a **command center** that delegates to specialized AI agents:

| Problem | Without forge | With forge |
|---------|--------------|------------|
| Backend API work | Claude does it alone | Codex CLI handles it autonomously (GPT-5.3) |
| Frontend components | Claude does it alone | Gemini CLI handles it (1M token context) |
| Large refactors | Sequential, slow | Parallel execution across multiple agents |
| Code reviews | One perspective | Cross-review from Claude + Codex + Gemini |
| Complex features | Hope it works | Autopilot: spec -> plan -> build -> test -> verify |

**The core idea:** Claude Code becomes the orchestrator. It reads your codebase, understands your intent, classifies the task, and delegates to the right specialist. You get the combined intelligence of three frontier AI models working in parallel.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Skills Reference](#skills-reference)
  - [Execution Modes](#execution-modes)
  - [Orchestration](#orchestration)
  - [Planning & Research](#planning--research)
  - [CLI Delegation](#cli-delegation)
  - [Code Quality](#code-quality)
  - [Analysis](#analysis)
  - [Productivity](#productivity)
  - [Specialist Agents](#specialist-agents)
  - [Configuration](#configuration)
- [Intelligent Features](#intelligent-features)
  - [Magic Keywords](#magic-keywords)
  - [Automatic Task Routing](#automatic-task-routing)
  - [Complexity Scoring](#complexity-scoring)
  - [Task Decomposition](#task-decomposition)
  - [Continuation Enforcement](#continuation-enforcement)
  - [Context Monitoring](#context-monitoring)
- [HUD System](#hud-system)
- [Architecture](#architecture)
  - [MCP Servers](#mcp-servers)
  - [Hook System](#hook-system)
  - [Anti-Loop Protection](#anti-loop-protection)
  - [File Structure](#file-structure)
- [Configuration](#configuration-1)
- [Examples](#examples)
- [Comparison](#comparison)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

```bash
# 1. Add the marketplace
/plugin marketplace add https://github.com/staticpayload/claude-forge

# 2. Install
/plugin install claude-forge

# 3. Setup (one-time)
/claude-forge:setup
```

That's it. Start a new Claude Code session and forge is active. Try it:

```
"forge this: build a REST API for user authentication with JWT"
```

Claude will auto-route this to Codex CLI (backend signals detected), and you'll see Codex working autonomously while Claude monitors progress.

---

## Prerequisites

**Required:**
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (v2.0+)
- [Node.js](https://nodejs.org) >= 18.0.0

**Optional (but recommended):**
- [Codex CLI](https://github.com/openai/codex) - for backend delegation
  ```bash
  npm install -g @openai/codex
  ```
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - for frontend delegation
  ```bash
  npm install -g @anthropic-ai/gemini-cli
  # or via Homebrew
  brew install gemini-cli
  ```

> **Note:** claude-forge works without either CLI installed. Skills that need a missing CLI will fall back to Claude's built-in agents. You can install CLIs later and run `/claude-forge:enable-codex` or `/claude-forge:enable-gemini`.

---

## Installation

### From Marketplace (Recommended)

```bash
# In any Claude Code session:
/plugin marketplace add https://github.com/staticpayload/claude-forge
/plugin install claude-forge
```

### From Local Directory

```bash
# Clone the repo
git clone https://github.com/staticpayload/claude-forge.git
cd claude-forge
npm install

# Install as local plugin
/plugin add /path/to/claude-forge
```

### Verify Installation

Start a new Claude Code session. You should see:

```
claude-forge active. Codex CLI ready (/opt/homebrew/bin/codex) - backend delegation available.
Gemini CLI ready (/opt/homebrew/bin/gemini) - frontend delegation available.
```

Or run the diagnostics:

```
/claude-forge:doctor
```

This checks: plugin registration, MCP server health, CLI availability, hook wiring, skill discovery, and configuration.

---

## How It Works

```
                          ┌─────────────────┐
                          │   Your Prompt    │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  Keyword Router  │  (UserPromptSubmit hook)
                          │  95 patterns     │
                          │  Magic keywords  │
                          │  Complexity score│
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
           ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
           │ Skill Router │ │ Auto-    │ │  Direct    │
           │ 42 skills    │ │ Classify │ │  Execution │
           │ /forge:xxx   │ │ backend/ │ │  (simple)  │
           └───────┬──────┘ │ frontend │ └────────────┘
                   │        └────┬─────┘
                   │             │
        ┌──────────┼─────────────┼──────────┐
        │          │             │          │
   ┌────▼───┐ ┌───▼────┐ ┌─────▼───┐ ┌───▼────────┐
   │ Codex  │ │ Gemini │ │ Built-in│ │  Parallel  │
   │  CLI   │ │  CLI   │ │ Agents  │ │  All Three │
   │(backend│ │(frontend│ │(fallback│ │  (review)  │
   └────────┘ └────────┘ └─────────┘ └────────────┘
```

1. **Every prompt** passes through the keyword router hook (95 regex patterns)
2. **Skill keywords** trigger specific workflows (e.g., "autopilot" activates the 5-phase autonomous pipeline)
3. **Magic keywords** inject enhanced behavior (e.g., "ultrawork" activates parallel execution mode)
4. **Task classification** detects backend/frontend signals and suggests CLI delegation
5. **Complexity scoring** routes to appropriate model tier (Haiku < Sonnet < Opus)

---

## Skills Reference

### Execution Modes

The big five. These are persistent execution modes that change how Claude operates.

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `/claude-forge:autopilot` | "autopilot", "build me", "I want a" | Full autonomous pipeline: expansion -> planning -> execution -> QA -> validation. 5 phases, state tracking, resumable. |
| `/claude-forge:ralph` | "ralph", "don't stop", "must complete" | Persistence loop. Works -> architect verifies -> repeats until done. Max 10 iterations. Named after Sisyphus - the boulder never stops. |
| `/claude-forge:ultrawork` | "ultrawork", "ulw", "maximum performance" | Parallel execution engine. Decomposes tasks, assigns file ownership, runs multiple agents simultaneously. Maximum throughput. |
| `/claude-forge:ecomode` | "ecomode", "budget mode" | Token-efficient routing. Haiku for simple tasks, Sonnet for medium, Opus only when necessary. Cuts costs 3-5x. |
| `/claude-forge:ultraqa` | "ultraqa", "qa loop", "make tests pass" | QA cycling: test -> diagnose -> fix -> repeat. Supports `--tests`, `--build`, `--lint`, `--typecheck`. Max 5 cycles with same-failure detection. |

**Composability:** Ralph includes ultrawork. Ecomode modifies model routing for any mode. Autopilot can transition to ralph or ultraqa internally.

### Orchestration

Multi-agent coordination for complex work.

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `/claude-forge:ultrapilot` | "ultrapilot", "parallel build", "fast autopilot" | Parallel autopilot. Architect decomposes task, up to 5 workers execute simultaneously with file ownership partitioning. |
| `/claude-forge:team` | "forge team", "coordinated team", "spawn agents" | N coordinated agents on shared task list. File ownership prevents conflicts. Workers claim tasks, report progress, hand off. |
| `/claude-forge:pipeline` | "pipeline", "chain agents" | Sequential agent chains with data passing. 6 built-in presets: `review`, `implement`, `debug`, `research`, `refactor`, `security`. Custom chains supported. |

### Planning & Research

Think before you build.

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `/claude-forge:plan` | "plan this/the/it", "make a plan", "--consensus" | Strategic planning with 4 modes: interview, direct, consensus (3 independent architects), and review (critic challenges plan). Quality gate: 80% file references, 90% concrete criteria. |
| `/claude-forge:research` | "research this/the/it", "investigate thoroughly" | Parallel scientist agents. Decomposes question into 3-7 sub-questions, assigns each to a scientist, cross-validates findings, synthesizes evidence-based report with confidence levels. |

### CLI Delegation

Direct control over which CLI handles what.

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `/claude-forge:forge` | "forge this/it", "auto-route" | Intelligent auto-routing. Classifies task by signal words, routes to best CLI. Falls back to built-in agents if CLI unavailable. |
| `/claude-forge:review` | "forge review", "cross-review", "multi-review" | Parallel review via both CLIs. Codex reviews logic/security/performance. Gemini reviews design/maintainability/UX. Findings synthesized and deduplicated. |
| `/claude-forge:backend` | "use codex", "backend this", "delegate to codex" | Direct Codex CLI delegation. Prompt goes to Codex with anti-loop preamble. Polls until completion. |
| `/claude-forge:frontend` | "use gemini", "frontend this", "delegate to gemini" | Direct Gemini CLI delegation. Prompt goes to Gemini with 1M token context. Polls until completion. |
| `/claude-forge:backend-agent` | "backend agent" | Backend work via Claude's built-in agents (no CLI needed). Uses executor/debugger agents. |
| `/claude-forge:frontend-agent` | "frontend agent" | Frontend work via Claude's built-in agents (no CLI needed). Uses designer agent. |
| `/claude-forge:parallel` | "forge parallel", "split this/it up" | Task decomposition for parallel multi-CLI execution. Analyzes task, identifies backend/frontend components, executes in parallel waves. |

### Code Quality

Reviews, testing, and standards enforcement.

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `/claude-forge:code-review` | "code review", "review code/pr" | 5-dimension review: security, quality, performance, best practices, maintainability. Each finding rated CRITICAL/HIGH/MEDIUM/LOW. Verdict: APPROVE or REQUEST CHANGES. |
| `/claude-forge:security-review` | "security review/audit", "owasp" | OWASP Top 10 mapping. Scans for injection, broken auth, XSS, SSRF, misconfigs. Checks for hardcoded secrets. Auth/authz boundary review. Remediation priority table. |
| `/claude-forge:tdd` | "tdd", "test first", "red green refactor" | Red-Green-Refactor enforcement. Write ONE failing test -> implement MINIMUM code to pass -> refactor. Strict cycle discipline. |
| `/claude-forge:build-fix` | "build-fix", "fix type errors" | Minimal-diff build error fixing. Read error -> fix -> verify. No refactoring, no architecture changes. Stops when build passes. |

### Analysis

Deep investigation and search.

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `/claude-forge:analyze` | "forge analyze", "root cause", "diagnose" | 4 investigation types: architecture, bug, performance, dependency. Separates facts from hypotheses. Multiple evidence sources. |
| `/claude-forge:deepsearch` | "deepsearch" | Exhaustive codebase search. Never stops at first result. Strategy: broad search -> deep dive each match -> cross-reference -> synthesize. Covers: code, comments, configs, tests, docs. |

### Productivity

Tools that make daily work faster.

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `/claude-forge:worktree` | "worktree", "parallel sessions" | Git worktree manager. Create isolated working copies for parallel feature development without branch switching. |
| `/claude-forge:techdebt` | "tech debt", "find duplicates" | Scan for duplicated code, dead exports, unused dependencies, stale TODOs, inconsistent patterns. Prioritized remediation list. |
| `/claude-forge:fix` | "fix ci/tests/the fail", "go fix" | Auto-fix from error output. Paste CI logs, test failures, or Docker build errors. Parses, diagnoses, and fixes. |
| `/claude-forge:learn` | "learn this", "remember this", "update claude.md" | Auto-update CLAUDE.md with project learnings. Captures patterns, conventions, and decisions. |
| `/claude-forge:deepinit` | "deepinit", "generate agents.md", "init codebase" | Generate hierarchical AGENTS.md documentation. Scans entire codebase, maps architecture, documents each directory with parent references. |
| `/claude-forge:note` | "forge note" | Persistent notepad across sessions. 3 sections: priority (permanent), working (7-day auto-prune), manual (permanent). Survives context compaction. |
| `/claude-forge:learner` | "save this insight", "don't make that mistake" | Extract reusable skills from debugging insights. Quality gates: must be non-Googleable, context-specific, actionable, and hard-won. |
| `/claude-forge:trace` | "forge trace", "agent timeline" | Visualize session execution. Timeline view (chronological events) and summary view (aggregate stats). Filter: `--hooks`, `--skills`, `--agents`, `--modes`. |

### Specialist Agents

Domain-specific expert routing.

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `/claude-forge:frontend-ui-ux` | "ui/ux" | UI/UX design work. Routes to Gemini CLI (1M context for component libraries) or designer agent. WCAG 2.1 AA compliance. Responsive, accessible, performant. |
| `/claude-forge:git-master` | "git-master" | Git expert. Atomic commits, interactive rebasing, history cleanup. Detects existing commit style (conventional, angular, gitmoji). Never force-pushes without confirmation. |

### Configuration

Setup and diagnostics.

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `/claude-forge:setup` | "setup forge", "configure forge" | Interactive setup wizard. Detects installed CLIs, configures models, sets up HUD, validates everything. |
| `/claude-forge:set-codex-model` | "set codex model" | Configure which model Codex CLI uses. |
| `/claude-forge:set-gemini-model` | "set gemini model" | Configure which model Gemini CLI uses. |
| `/claude-forge:enable-codex` | "enable codex", "installed codex", "activate codex" | Enable Codex delegation after installing the CLI. |
| `/claude-forge:enable-gemini` | "enable gemini", "installed gemini", "activate gemini" | Enable Gemini delegation after installing the CLI. |
| `/claude-forge:hud` | "forge hud", "setup hud" | Configure the HUD statusline display. |
| `/claude-forge:doctor` | "forge doctor" | Run 7 diagnostic checks: plugin registration, MCP servers, CLI paths, hooks, skills, config, state directory. Auto-fixes common issues. |
| `/claude-forge:help` | "forge help", "what can forge do" | Full feature guide with all skills, examples, and tips. |
| `/claude-forge:cancel` | "cancel", "stop forge/autopilot/ralph/ultrawork" | Cancel any active mode. Detects which mode is running, cleans up in dependency order. `--force` clears all state. |

---

## Intelligent Features

These features work automatically in the background. No skill invocation needed.

### Magic Keywords

Say these naturally in any prompt to activate enhanced behavior:

| Keyword | Aliases | Effect |
|---------|---------|--------|
| **ultrawork** | `ulw` | Maximum parallelism. Decomposes task, assigns agents, runs in parallel. No scope reduction. |
| **search** | `deepsearch` | Exhaustive search mode. Multiple strategies, never stops at first result. |
| **analyze** | `investigate` | Deep context gathering before any action. Read everything relevant first. |
| **ultrathink** | `think hard` | Extended reasoning. Quality over speed. More thorough analysis. |

Magic keywords inject behavioral prompts into the conversation context. They compose - you can say "ultrawork this analysis" to get both parallel execution and deep investigation.

### Automatic Task Routing

Every prompt longer than 40 characters is automatically classified:

**Backend signals** (routes to Codex):
`api`, `endpoint`, `server`, `database`, `sql`, `migration`, `cli`, `script`, `pipeline`, `docker`, `auth`, `middleware`, `cache`, `redis`, `queue`, `worker`, `webhook`, `microservice`

**Frontend signals** (routes to Gemini):
`component`, `ui`, `ux`, `css`, `style`, `layout`, `react`, `vue`, `svelte`, `html`, `design`, `theme`, `animation`, `accessibility`, `tailwind`, `visual`, `mobile`

When signals are detected, a routing hint is injected. Claude decides whether to delegate based on the hint and task complexity.

### Complexity Scoring

Tasks are automatically scored on a 0-15+ scale for model routing:

| Signal | Weight | Examples |
|--------|--------|---------|
| Architecture decisions | +3 | "design the system", "architect" |
| Debugging | +2 | "fix the bug", "why is this failing" |
| Risk/security | +2 | "security audit", "vulnerability" |
| Refactoring | +2 | "refactor", "restructure" |
| Multiple subtasks | +3 | "and also", "additionally", numbered lists |
| Cross-file changes | +2 | "across all files", "everywhere" |
| System-wide impact | +3 | "entire codebase", "global change" |

**Routing tiers:**
- Score 0-3: **Haiku** - quick lookups, simple fixes
- Score 4-8: **Sonnet** - standard implementation, debugging
- Score 8+: **Opus** - architecture, deep analysis, complex refactors

### Task Decomposition

The `/claude-forge:parallel` skill uses intelligent decomposition:

1. **Type detection** - fullstack, refactoring, bug-fix, feature, testing, docs, infra
2. **Area extraction** - identifies distinct work areas (backend, frontend, database, etc.)
3. **Component mapping** - maps files to components with ownership
4. **Dependency analysis** - topological sort for execution ordering
5. **Wave generation** - groups independent components into parallel execution waves

Example: "Build a user dashboard with API endpoints and database models"
- Wave 1: Database models + API endpoints (parallel, no dependencies)
- Wave 2: Frontend dashboard (depends on API being ready)

### Continuation Enforcement

A `Stop` hook prevents premature exit during execution modes:

- Detects incomplete tasks, pending work, and unverified claims
- Injects continuation reminders when Claude tries to stop early
- Recognizes completion signals (all tests pass, verification complete)
- Allows user-initiated stops and context limit stops
- Active only during execution modes (autopilot, ralph, ultrawork, etc.)

### Context Monitoring

A `PostToolUse` hook tracks context window consumption:

- Estimates token usage after every tool call
- **Warning** at 75% context usage - suggests summarizing or completing current task
- **Critical alert** at 90% - recommends wrapping up immediately
- Debounced (30s cooldown) to avoid spam
- Max 5 warnings per session

---

## HUD System

claude-forge includes an optional Heads-Up Display showing live session stats:

```
forge | codex:ready gemini:ready | jobs:2 | ctx:45% | cost:$0.12
```

Features:
- CLI availability status
- Active job count
- Context window usage bar
- Estimated session cost
- Live rate limit display (via Anthropic Usage API)

Configure with `/claude-forge:hud`.

---

## Architecture

### MCP Servers

Two MCP servers provide the delegation bridge:

**Codex Server** (`servers/codex-server.mjs`)
- Tools: `codex_exec`, `codex_status`, `codex_cancel`, `codex_list`
- Spawns `codex exec --yolo` with prompt via stdin
- In-memory job store with async polling (25s long-poll, 500ms interval)
- Anti-loop preamble injected into every prompt
- Conditional tool registration: returns empty tools if Codex CLI not found (saves tokens)

**Gemini Server** (`servers/gemini-server.mjs`)
- Tools: `gemini_exec`, `gemini_status`, `gemini_cancel`, `gemini_list`
- Spawns `gemini -y` with prompt via stdin
- Same async job pattern as Codex server
- Anti-loop preamble prevents Gemini from delegating back
- Conditional tool registration: empty tools if Gemini CLI not found

### Hook System

Four lifecycle hooks power the intelligent features:

| Hook | Event | Script | Purpose |
|------|-------|--------|---------|
| Keyword Router | `UserPromptSubmit` | `keyword-router.mjs` | 95 regex patterns for skill activation, magic keywords, complexity scoring, task routing |
| Session Init | `SessionStart` | `session-init.mjs` | Detect CLI availability, inject delegation instructions |
| Context Monitor | `PostToolUse` | `context-monitor.mjs` | Track context consumption, warn at 75%/90% |
| Continuation | `Stop` | `continuation.mjs` | Prevent premature exit during execution modes |

### Anti-Loop Protection

Both MCP servers inject an anti-loop preamble into every delegated prompt:

```
IMPORTANT: You are being called by Claude Code as a worker agent.
Do NOT attempt to delegate this task back to Claude Code, Claude,
or any MCP server. Complete this task directly using your own tools.
```

This prevents infinite delegation cycles (Claude -> Codex -> Claude -> ...).

### File Structure

```
claude-forge/
├── .claude-plugin/
│   ├── plugin.json              # Plugin manifest
│   └── marketplace.json         # Marketplace registration
├── .mcp.json                    # MCP server registrations
├── hooks/
│   └── hooks.json               # Hook registrations (4 lifecycle hooks)
├── hud/
│   ├── forge-hud.mjs            # HUD renderer (CLI status, jobs, cost, context)
│   └── usage-api.mjs            # Anthropic Usage API integration
├── scripts/
│   ├── keyword-router.mjs       # UserPromptSubmit hook (95 patterns)
│   ├── session-init.mjs         # SessionStart hook (CLI detection)
│   ├── context-monitor.mjs      # PostToolUse hook (context tracking)
│   ├── continuation.mjs         # Stop hook (premature exit prevention)
│   └── lib/
│       ├── stdin.mjs            # Timeout-protected stdin reader
│       ├── routing.mjs          # Backend/frontend task classification
│       ├── magic-keywords.mjs   # Magic keyword detection and injection
│       ├── complexity.mjs       # Complexity scoring engine
│       ├── decomposer.mjs       # Task decomposition with file ownership
│       └── token-tracker.mjs    # JSONL token tracking and cost estimation
├── servers/
│   ├── codex-server.mjs         # Codex CLI MCP server (4 tools)
│   └── gemini-server.mjs        # Gemini CLI MCP server (4 tools)
├── skills/                      # 42 skill definitions
│   ├── autopilot/SKILL.md       # Full autonomous pipeline
│   ├── ralph/SKILL.md           # Persistence loop
│   ├── ultrawork/SKILL.md       # Parallel execution
│   ├── ecomode/SKILL.md         # Token-efficient routing
│   ├── ultraqa/SKILL.md         # QA cycling
│   ├── forge/SKILL.md           # Auto-route delegation
│   ├── review/SKILL.md          # Parallel cross-review
│   ├── ... (35 more)
│   └── cancel/SKILL.md          # Mode cancellation
├── templates/
│   └── CLAUDE.md                # Injected delegation instructions
├── package.json
├── LICENSE
└── README.md
```

---

## Configuration

### CLI Model Selection

```
/claude-forge:set-codex-model    # Choose Codex model (gpt-5.3-codex, etc.)
/claude-forge:set-gemini-model   # Choose Gemini model (gemini-3-pro, etc.)
```

### State Directory

claude-forge stores execution mode state in `.forge/` at the git worktree root:

```
.forge/
├── autopilot-state.json     # Autopilot progress (resumable)
├── ralph-state.json         # Ralph loop iteration count
├── ultrawork-state.json     # Ultrawork task assignments
└── token-tracking.jsonl     # Token usage log
```

Add `.forge/` to your `.gitignore` (already included in the plugin's `.gitignore`).

---

## Examples

### Autonomous Feature Development

```
autopilot: Build a user authentication system with JWT tokens,
password hashing, rate limiting, and email verification
```

Claude enters autopilot mode:
1. **Expansion** - Analyzes requirements, asks clarifying questions
2. **Planning** - Creates detailed implementation plan with file ownership
3. **Execution** - Routes backend to Codex, frontend to Gemini, runs in parallel
4. **QA** - Runs tests, fixes failures, iterates until passing
5. **Validation** - Verifier agent confirms all acceptance criteria met

### Parallel Cross-Review

```
forge review the authentication PR
```

Spawns two reviews simultaneously:
- **Codex** reviews: security vulnerabilities, logic bugs, performance, error handling
- **Gemini** reviews: design patterns, maintainability, naming, documentation, UX

Synthesizes into unified report with deduplicated findings, severity ratings, and source attribution.

### Maximum Throughput Refactor

```
ultrawork: Migrate the entire codebase from CommonJS to ESM
```

1. Analyzes all files, identifies dependency graph
2. Decomposes into independent work units with file ownership
3. Assigns parallel agents (some to Codex, some to built-in agents)
4. Each agent works on its files without conflicts
5. Verifies all imports resolve and tests pass

### Quick Backend Delegation

```
use codex: Add pagination to the /api/users endpoint with
cursor-based pagination, filtering by role, and sorting
```

Directly delegates to Codex CLI. Claude monitors progress, reports when done.

### Token-Efficient Development

```
ecomode: Add form validation to the signup page
```

Routes to Haiku for the classification, Sonnet for the implementation, skips Opus entirely. Same quality, ~3x cheaper.

---

## Comparison

### claude-forge vs Using Claude Code Alone

| Feature | Claude Code | + claude-forge |
|---------|-------------|---------------|
| AI models | Claude only | Claude + GPT (Codex) + Gemini |
| Parallel execution | Sequential | Up to 5 parallel agents |
| Context window | 200K | 200K + 128K (Codex) + 1M (Gemini) |
| Autonomous modes | Manual | Autopilot, Ralph, Ultrawork |
| Code review | Single perspective | Multi-model cross-review |
| Task routing | Manual | Automatic classification |
| Cost optimization | One model tier | Complexity-based model routing |

### claude-forge vs oh-my-claudecode (OMC)

| Feature | OMC | claude-forge |
|---------|-----|-------------|
| **Focus** | Claude-native orchestration | Multi-CLI delegation |
| **External CLIs** | Optional (Codex/Gemini MCP) | Core feature (Codex + Gemini) |
| **MCP Servers** | 3 (tools, codex, gemini) | 2 (codex, gemini) |
| **Skills** | 37 | 42 |
| **Build system** | TypeScript + esbuild | Pure ESM, no build step |
| **Magic keywords** | Yes | Yes |
| **Execution modes** | Autopilot, Ralph, Ultrawork, Ecomode, UltraQA | Same |
| **HUD** | Yes | Yes |
| **LSP/AST tools** | Yes (via MCP) | No |
| **State management** | Session-aware with SQLite | File-based JSON |
| **Installation** | Plugin marketplace | Plugin marketplace |

**When to use claude-forge:** You want multi-CLI delegation as the primary workflow. Backend goes to Codex, frontend goes to Gemini, Claude orchestrates.

**When to use OMC:** You want Claude-native orchestration with optional CLI delegation. LSP and AST tools are important to you.

---

## Troubleshooting

### "Codex CLI not found"

```bash
# Install Codex
npm install -g @openai/codex

# Set your OpenAI API key
export OPENAI_API_KEY=sk-...

# Tell forge it's available
/claude-forge:enable-codex
```

### "Gemini CLI not found"

```bash
# Install Gemini
npm install -g @google/gemini-cli

# Authenticate
gemini auth

# Tell forge it's available
/claude-forge:enable-gemini
```

### Skills not appearing

```
/claude-forge:doctor
```

This runs diagnostics on plugin registration, skill discovery, MCP servers, and hooks.

### MCP server not responding

```bash
# Test manually
node /path/to/claude-forge/servers/codex-server.mjs
# Should start and wait for MCP messages on stdin
```

### Cancel a stuck mode

```
/claude-forge:cancel --force
```

This clears all state files regardless of what's active.

### Context running out

If you see context warnings during a large operation:
1. Complete the current sub-task
2. Start a new session
3. Run `/claude-forge:note` to save progress before the session ends

---

## Contributing

Contributions welcome. The codebase is pure ESM JavaScript with no build step.

### Adding a Skill

1. Create `skills/your-skill/SKILL.md`
2. Add YAML frontmatter with `name` and `description`
3. Write the skill using `<Purpose>`, `<Use_When>`, `<Steps>` sections
4. Add trigger patterns to `scripts/keyword-router.mjs`
5. Update `templates/CLAUDE.md` with the new skill

### Skill Format

```markdown
---
name: your-skill
description: One-line description of what this skill does
---

<Purpose>
What this skill does and why it exists.
</Purpose>

<Use_When>
- User says "trigger phrase"
- When some condition is met
</Use_When>

<Steps>
1. First step
2. Second step
3. ...
</Steps>
```

### MCP Server Development

Both servers use `@modelcontextprotocol/sdk` with StdioServerTransport. The pattern:

1. Define tools with JSON Schema parameters
2. Handle `call_tool` requests
3. Spawn CLI subprocess with prompt on stdin
4. Store job in memory Map
5. Support async polling via `*_status` tool

---

## License

[GPL-3.0](LICENSE) - Free software. Share alike.

---

<p align="center">
<b>claude-forge</b> - Because one AI model is never enough.
<br>
<a href="https://github.com/staticpayload/claude-forge">GitHub</a> ·
<a href="https://github.com/staticpayload/claude-forge/issues">Issues</a> ·
<a href="https://github.com/staticpayload/claude-forge/discussions">Discussions</a>
</p>
