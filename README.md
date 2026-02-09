<div align="center">

```
      _                 _             __
  ___| | __ _ _   _  __| | ___       / _| ___  _ __ __ _  ___
 / __| |/ _` | | | |/ _` |/ _ \____ | |_ / _ \| '__/ _` |/ _ \
| (__| | (_| | |_| | (_| |  __/_____||  _| (_) | | | (_| |  __/
 \___|_|\__,_|\__,_|\__,_|\___|     |_|  \___/|_|  \__, |\___|
                                                    |___/
```

### Multi-CLI Delegation & Orchestration for Claude Code

Route backend to **Codex CLI** (GPT-5.3) &bull; Frontend to **Gemini CLI** (1M context) &bull; **42 skills** &bull; Parallel execution

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet.svg)](https://docs.anthropic.com/en/docs/claude-code)
[![Skills](https://img.shields.io/badge/Skills-42-orange.svg)](#skills-reference)
[![Agents](https://img.shields.io/badge/Agents-30-teal.svg)](#architecture)

</div>

---

## Why claude-forge?

Claude Code is powerful on its own. But it's a single brain. claude-forge turns it into a **command center** that delegates to specialized AI agents:

| | Without forge | With forge |
|:---|:---|:---|
| **Backend API work** | Claude does it alone | Codex CLI handles it autonomously |
| **Frontend components** | Claude does it alone | Gemini CLI handles it (1M token context) |
| **Large refactors** | Sequential, slow | Parallel execution across multiple agents |
| **Code reviews** | One perspective | Cross-review from Claude + Codex + Gemini |
| **Complex features** | Hope it works | Autopilot: spec &rarr; plan &rarr; build &rarr; test &rarr; verify |

> **The core idea:** Claude Code becomes the orchestrator. It reads your codebase, understands your intent, classifies the task, and delegates to the right specialist. You get the combined intelligence of three frontier AI models working in parallel.

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

Start a new session and try:

```
"forge this: build a REST API for user authentication with JWT"
```

Claude auto-routes this to Codex CLI (backend signals detected) and monitors progress.

---

## Prerequisites

**Required:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code) v2.0+ &bull; [Node.js](https://nodejs.org) >= 18

**Optional (recommended):**

```bash
# Codex CLI - backend delegation
npm install -g @openai/codex

# Gemini CLI - frontend delegation
npm install -g @anthropic-ai/gemini-cli
```

> claude-forge works without either CLI. Skills fall back to Claude's built-in agents. Install CLIs later with `/claude-forge:enable-codex` or `/claude-forge:enable-gemini`.

---

## How It Works

```
                        ┌─────────────────┐
                        │   Your Prompt    │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  Keyword Router  │  UserPromptSubmit hook
                        │  95 patterns     │  Magic keywords
                        │  Complexity score│  Task classification
                        └────────┬────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
         ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
         │ Skill Router │ │  Auto-   │ │   Direct   │
         │  42 skills   │ │ Classify │ │  Execution │
         └───────┬──────┘ └────┬─────┘ └────────────┘
                 │             │
      ┌──────────┼─────────────┼──────────┐
      │          │             │          │
 ┌────▼───┐ ┌───▼────┐ ┌─────▼───┐ ┌───▼────────┐
 │ Codex  │ │ Gemini │ │ Built-in│ │  Parallel  │
 │  CLI   │ │  CLI   │ │ Agents  │ │  All Three │
 └────────┘ └────────┘ └─────────┘ └────────────┘
```

1. **Every prompt** passes through the keyword router (95 regex patterns)
2. **Skill keywords** trigger workflows &mdash; "autopilot" activates the 5-phase pipeline
3. **Magic keywords** inject behavior &mdash; "ultrawork" enables parallel execution
4. **Task classification** detects backend/frontend signals for CLI delegation
5. **Complexity scoring** routes to the right model tier (Haiku &lt; Sonnet &lt; Opus)

---

## Skills Reference

<details>
<summary><b>Execution Modes</b> &mdash; Persistent modes that change how Claude operates</summary>

| Skill | Trigger | Description |
|:------|:--------|:------------|
| `autopilot` | "autopilot", "build me" | Full pipeline: expansion &rarr; planning &rarr; execution &rarr; QA &rarr; validation. 5 phases, resumable. |
| `ralph` | "ralph", "don't stop" | Persistence loop. Works &rarr; architect verifies &rarr; repeats until done. Max 10 iterations. |
| `ultrawork` | "ultrawork", "ulw" | Parallel engine. Decomposes tasks, assigns file ownership, runs multiple agents simultaneously. |
| `ecomode` | "ecomode", "budget mode" | Token-efficient routing. Haiku for simple, Sonnet for medium, Opus only when needed. 3-5x cheaper. |
| `ultraqa` | "ultraqa", "make tests pass" | QA cycling: test &rarr; diagnose &rarr; fix &rarr; repeat. Max 5 cycles with same-failure detection. |

**Composability:** Ralph includes ultrawork. Ecomode modifies routing for any mode. Autopilot can transition to ralph or ultraqa.

</details>

<details>
<summary><b>Orchestration</b> &mdash; Multi-agent coordination</summary>

| Skill | Trigger | Description |
|:------|:--------|:------------|
| `ultrapilot` | "ultrapilot", "parallel build" | Parallel autopilot. Architect decomposes, up to 5 workers execute with file ownership partitioning. |
| `team` | "forge team", "spawn agents" | N coordinated agents on shared task list. File ownership prevents conflicts. |
| `pipeline` | "pipeline", "chain agents" | Sequential agent chains with data passing. 6 presets: review, implement, debug, research, refactor, security. |

</details>

<details>
<summary><b>Planning & Research</b> &mdash; Think before you build</summary>

| Skill | Trigger | Description |
|:------|:--------|:------------|
| `plan` | "plan this", "--consensus" | Strategic planning with 4 modes: interview, direct, consensus (3 architects), review (critic challenges). |
| `research` | "research this" | Parallel scientists. Decomposes into 3-7 sub-questions, cross-validates, synthesizes with confidence levels. |

</details>

<details>
<summary><b>CLI Delegation</b> &mdash; Direct control over routing</summary>

| Skill | Trigger | Description |
|:------|:--------|:------------|
| `forge` | "forge this", "auto-route" | Intelligent auto-routing by signal classification. Falls back to built-in agents. |
| `review` | "forge review", "cross-review" | Parallel review: Codex (logic/security) + Gemini (design/UX). Deduplicated findings. |
| `backend` | "use codex", "delegate to codex" | Direct Codex CLI delegation with anti-loop preamble. |
| `frontend` | "use gemini", "delegate to gemini" | Direct Gemini CLI delegation with 1M token context. |
| `backend-agent` | "backend agent" | Backend via Claude's built-in agents (no CLI needed). |
| `frontend-agent` | "frontend agent" | Frontend via Claude's built-in agents (no CLI needed). |
| `parallel` | "forge parallel", "split this up" | Decompose + parallel multi-CLI execution in waves. |

</details>

<details>
<summary><b>Code Quality</b> &mdash; Reviews, testing, standards</summary>

| Skill | Trigger | Description |
|:------|:--------|:------------|
| `code-review` | "code review", "review code" | 5-dimension review: security, quality, performance, best practices, maintainability. Severity-rated. |
| `security-review` | "security review", "owasp" | OWASP Top 10 mapping. Injection, broken auth, XSS, SSRF, misconfigs. Remediation priorities. |
| `tdd` | "tdd", "test first" | Red-Green-Refactor enforcement. One failing test &rarr; minimum code to pass &rarr; refactor. |
| `build-fix` | "build-fix", "fix type errors" | Minimal-diff build fixing. No refactoring, no architecture changes. Stops when build passes. |

</details>

<details>
<summary><b>Analysis</b> &mdash; Deep investigation and search</summary>

| Skill | Trigger | Description |
|:------|:--------|:------------|
| `analyze` | "forge analyze", "root cause" | 4 types: architecture, bug, performance, dependency. Separates facts from hypotheses. |
| `deepsearch` | "deepsearch" | Exhaustive codebase search. Multiple strategies, never stops at first result. |

</details>

<details>
<summary><b>Productivity</b> &mdash; Daily workflow tools</summary>

| Skill | Trigger | Description |
|:------|:--------|:------------|
| `worktree` | "worktree" | Git worktree manager for parallel feature development. |
| `techdebt` | "tech debt" | Scan for duplicates, dead exports, unused deps, stale TODOs. |
| `fix` | "fix ci/tests" | Auto-fix from error output. Paste CI logs, test failures, Docker errors. |
| `learn` | "learn this" | Auto-update CLAUDE.md with project learnings. |
| `deepinit` | "deepinit" | Generate hierarchical AGENTS.md documentation for entire codebase. |
| `note` | "forge note" | Persistent notepad: priority (permanent), working (7-day), manual (permanent). |
| `learner` | "save this insight" | Extract reusable skills from debugging. Must be non-Googleable and actionable. |
| `trace` | "forge trace" | Visualize execution timeline and aggregate stats. |

</details>

<details>
<summary><b>Specialist Agents & Configuration</b></summary>

**Specialist Agents:**

| Skill | Trigger | Description |
|:------|:--------|:------------|
| `frontend-ui-ux` | "ui/ux" | Routes to Gemini (1M context) or designer agent. WCAG 2.1 AA. |
| `git-master` | "git-master" | Atomic commits, rebasing, history cleanup. Detects commit style. |

**Configuration:**

| Skill | Description |
|:------|:------------|
| `setup` | Interactive setup wizard &mdash; detect CLIs, configure models, validate |
| `set-codex-model` | Configure Codex CLI model |
| `set-gemini-model` | Configure Gemini CLI model |
| `enable-codex` | Enable Codex after installing CLI |
| `enable-gemini` | Enable Gemini after installing CLI |
| `hud` | Configure HUD statusline |
| `doctor` | 7 diagnostic checks with auto-fix |
| `help` | Full feature guide |
| `cancel` | Cancel any active mode. `--force` clears all state. |

</details>

---

## Intelligent Features

These work automatically in the background &mdash; no skill invocation needed.

<details open>
<summary><b>Magic Keywords</b></summary>

Say these naturally in any prompt:

| Keyword | Aliases | Effect |
|:--------|:--------|:-------|
| **ultrawork** | `ulw` | Maximum parallelism. Decomposes and runs agents in parallel. |
| **search** | `deepsearch`, `search the codebase` | Exhaustive search. Multiple strategies, never stops at first result. |
| **analyze** | `investigate`, `diagnose` | Deep context gathering before any action. |
| **ultrathink** | `think hard`, `step by step` | Extended reasoning. Quality over speed. |

Keywords compose &mdash; "ultrawork this analysis" activates both modes.

</details>

<details>
<summary><b>Automatic Task Routing</b></summary>

Prompts are classified by signal words:

**Backend** (routes to Codex): `api` `endpoint` `server` `database` `sql` `migration` `cli` `script` `pipeline` `docker` `auth` `middleware` `cache` `redis` `queue` `worker` `webhook` `microservice`

**Frontend** (routes to Gemini): `component` `ui` `ux` `css` `style` `layout` `react` `vue` `svelte` `html` `design` `theme` `animation` `accessibility` `tailwind` `visual` `mobile`

</details>

<details>
<summary><b>Complexity Scoring</b></summary>

Tasks are scored 0-15+ for model routing:

| Signal | Weight | Examples |
|:-------|:------:|:--------|
| Architecture decisions | +3 | "design the system", "architect" |
| Debugging | +2 | "fix the bug", "why is this failing" |
| Risk/security | +2 | "security audit", "vulnerability" |
| Refactoring | +2 | "refactor", "restructure" |
| Multiple subtasks | +3 | "and also", numbered lists |
| Cross-file changes | +2 | "across all files" |
| System-wide impact | +3 | "entire codebase" |

**Routing:** 0-3 &rarr; Haiku &bull; 4-8 &rarr; Sonnet &bull; 8+ &rarr; Opus

</details>

<details>
<summary><b>Task Decomposition</b></summary>

The `parallel` skill decomposes tasks into execution waves:

1. **Type detection** &mdash; fullstack, refactoring, bug-fix, feature, testing, docs, infra
2. **Area extraction** &mdash; backend, frontend, database, auth, testing, etc.
3. **File ownership** &mdash; maps files to components, prevents conflicts
4. **Dependency analysis** &mdash; topological sort for ordering
5. **Wave generation** &mdash; groups independent work for parallel execution

Example: *"Build a user dashboard with API endpoints and database models"*
- **Wave 1:** Database models + API endpoints (parallel)
- **Wave 2:** Frontend dashboard (depends on API)

</details>

<details>
<summary><b>Continuation & Context Monitoring</b></summary>

**Continuation Enforcement** (Stop hook):
- Prevents premature exit during execution modes
- Detects incomplete tasks and unverified claims
- Allows user-initiated stops and context limit stops

**Context Monitoring** (PostToolUse hook):
- Tracks token usage after every tool call
- Warning at 75% &bull; Critical alert at 90%
- Debounced (30s cooldown) &bull; Max 5 warnings per session

</details>

---

## HUD System

Live session stats in your statusline:

```
  branch:main | model:Claude Opus 4
  [FORGE] | 5h:[########]42% wk:[####----]28% | cx:✓ gm:✓ | run:cx:1 done:3 | session:12m | 🟢 | ~$0.1842 | 46.1k | ctx:[######----]62%
```

Features: CLI status &bull; Active jobs &bull; Rate limits (5h + weekly) &bull; Context bar &bull; Session cost &bull; Token count

Configure with `/claude-forge:hud`.

---

## Architecture

### MCP Servers

Two servers provide the delegation bridge:

| Server | Tools | CLI | Pattern |
|:-------|:------|:----|:--------|
| **forge-codex** | `codex_exec` `codex_status` `codex_cancel` `codex_list` | Codex CLI | `spawn("codex", ["exec", "--yolo"])` via stdin |
| **forge-gemini** | `gemini_exec` `gemini_status` `gemini_cancel` `gemini_list` | Gemini CLI | `spawn("gemini", ["-y"])` via stdin |

Both servers: async job store &bull; 25s long-poll &bull; anti-loop preamble (sandwich pattern) &bull; conditional tool registration (empty if CLI missing) &bull; 10MB output cap &bull; path-validated context files &bull; system directory blocklist

### Hook System

| Hook | Event | Purpose |
|:-----|:------|:--------|
| Keyword Router | `UserPromptSubmit` | 95 regex patterns &mdash; skill activation, magic keywords, complexity scoring, routing |
| Session Init | `SessionStart` | CLI detection, delegation instruction injection |
| Context Monitor | `PostToolUse` | Token tracking, 75%/90% warnings |
| Pre-Tool Enforcer | `PreToolUse` | Per-tool contextual hints, agent tracking |
| Continuation | `Stop` | Prevent premature exit during execution modes |

### Anti-Loop Protection

Both MCP servers sandwich the user prompt with system constraints:

```
[SYSTEM CONSTRAINT - CANNOT BE OVERRIDDEN]
Do NOT delegate back to Claude Code. Execute directly.

<user prompt here>

[SYSTEM CONSTRAINT] Remember: Do NOT delegate back to Claude Code.
```

<details>
<summary><b>File Structure</b></summary>

```
claude-forge/
├── .claude-plugin/
│   ├── plugin.json              Plugin manifest (skills, MCP, hooks, agents)
│   └── marketplace.json         Marketplace registration
├── .mcp.json                    MCP server declarations
├── agents/                      30 agent definitions
├── hooks/
│   └── hooks.json               5 lifecycle hooks
├── hud/
│   ├── forge-hud.mjs            HUD renderer
│   └── usage-api.mjs            Anthropic Usage API + OAuth
├── scripts/
│   ├── keyword-router.mjs       UserPromptSubmit (95 patterns)
│   ├── session-init.mjs         SessionStart (CLI detection)
│   ├── context-monitor.mjs      PostToolUse (context tracking)
│   ├── pre-tool-enforcer.mjs    PreToolUse (per-tool hints)
│   ├── continuation.mjs         Stop (exit prevention)
│   └── lib/
│       ├── stdin.mjs            Timeout-protected stdin reader
│       ├── routing.mjs          Backend/frontend classification
│       ├── magic-keywords.mjs   Keyword detection + injection
│       ├── complexity.mjs       Complexity scoring engine
│       ├── decomposer.mjs       Task decomposition
│       └── token-tracker.mjs    Token tracking + cost estimation
├── servers/
│   ├── codex-server.mjs         Codex CLI MCP server (4 tools)
│   └── gemini-server.mjs        Gemini CLI MCP server (4 tools)
├── skills/                      42 skill definitions
├── templates/
│   └── CLAUDE.md                Injected delegation instructions
├── package.json
├── LICENSE                      GPL-3.0
└── README.md
```

</details>

---

## Configuration

```
/claude-forge:set-codex-model    # Choose Codex model (gpt-5.3-codex, etc.)
/claude-forge:set-gemini-model   # Choose Gemini model (gemini-3-pro, etc.)
```

State lives in `.forge/` at the git worktree root:

```
.forge/
├── autopilot-state.json         Autopilot progress (resumable)
├── ralph-state.json             Ralph loop iteration count
├── ultrawork-state.json         Ultrawork task assignments
└── .context-monitor-state.json  Context window tracking
```

Add `.forge/` to your `.gitignore`.

---

## Examples

<details open>
<summary><b>Autonomous Feature Development</b></summary>

```
autopilot: Build a user authentication system with JWT tokens,
password hashing, rate limiting, and email verification
```

1. **Expansion** &mdash; Analyzes requirements, asks clarifying questions
2. **Planning** &mdash; Detailed plan with file ownership
3. **Execution** &mdash; Backend to Codex, frontend to Gemini, parallel
4. **QA** &mdash; Runs tests, fixes failures, iterates
5. **Validation** &mdash; Verifier confirms all criteria met

</details>

<details>
<summary><b>Parallel Cross-Review</b></summary>

```
forge review the authentication PR
```

Spawns two reviews simultaneously:
- **Codex:** security vulnerabilities, logic bugs, performance, error handling
- **Gemini:** design patterns, maintainability, naming, documentation, UX

Unified report with deduplicated findings and severity ratings.

</details>

<details>
<summary><b>Maximum Throughput Refactor</b></summary>

```
ultrawork: Migrate the entire codebase from CommonJS to ESM
```

1. Analyzes all files, builds dependency graph
2. Decomposes into independent work units with file ownership
3. Assigns parallel agents (Codex + built-in agents)
4. Each agent works on its files without conflicts
5. Verifies all imports resolve and tests pass

</details>

<details>
<summary><b>Quick Backend Delegation</b></summary>

```
use codex: Add pagination to the /api/users endpoint with
cursor-based pagination, filtering by role, and sorting
```

Directly delegates to Codex CLI. Claude monitors and reports.

</details>

<details>
<summary><b>Token-Efficient Development</b></summary>

```
ecomode: Add form validation to the signup page
```

Haiku classifies, Sonnet implements, Opus skipped. Same quality, ~3x cheaper.

</details>

---

## Comparison

<details>
<summary><b>claude-forge vs Claude Code Alone</b></summary>

| Feature | Claude Code | + claude-forge |
|:--------|:------------|:---------------|
| AI models | Claude only | Claude + GPT (Codex) + Gemini |
| Parallel execution | Sequential | Up to 5 parallel agents |
| Context window | 200K | 200K + 128K (Codex) + 1M (Gemini) |
| Autonomous modes | Manual | Autopilot, Ralph, Ultrawork |
| Code review | Single perspective | Multi-model cross-review |
| Task routing | Manual | Automatic classification |
| Cost optimization | One model tier | Complexity-based routing |

</details>

<details>
<summary><b>claude-forge vs oh-my-claudecode (OMC)</b></summary>

| Feature | OMC | claude-forge |
|:--------|:----|:-------------|
| **Focus** | Claude-native orchestration | Multi-CLI delegation |
| **External CLIs** | Optional MCP | Core feature |
| **Skills** | 37 | 42 |
| **Build system** | TypeScript + esbuild | Pure ESM, no build step |
| **LSP/AST tools** | Yes (via MCP) | No |
| **State** | Session-aware with SQLite | File-based JSON |

**Use claude-forge** when multi-CLI delegation is primary. **Use OMC** when Claude-native orchestration with LSP/AST tools matters.

</details>

---

## Troubleshooting

<details>
<summary><b>"Codex CLI not found"</b></summary>

```bash
npm install -g @openai/codex
export OPENAI_API_KEY=sk-...
/claude-forge:enable-codex
```

</details>

<details>
<summary><b>"Gemini CLI not found"</b></summary>

```bash
npm install -g @google/gemini-cli
gemini auth
/claude-forge:enable-gemini
```

</details>

<details>
<summary><b>Skills not appearing</b></summary>

Run `/claude-forge:doctor` &mdash; checks plugin registration, skill discovery, MCP servers, and hooks.

</details>

<details>
<summary><b>MCP server not responding</b></summary>

```bash
node /path/to/claude-forge/servers/codex-server.mjs
# Should start and wait for MCP messages on stdin
```

</details>

<details>
<summary><b>Cancel a stuck mode</b></summary>

```
/claude-forge:cancel --force
```

Clears all state files regardless of what's active.

</details>

<details>
<summary><b>Context running out</b></summary>

1. Complete the current sub-task
2. Run `/claude-forge:note` to save progress
3. Start a new session

</details>

---

## Contributing

Contributions welcome. Pure ESM JavaScript, no build step.

<details>
<summary><b>Adding a Skill</b></summary>

1. Create `skills/your-skill/SKILL.md`
2. Add YAML frontmatter with `name` and `description`
3. Write using `<Purpose>`, `<Use_When>`, `<Steps>` sections
4. Add trigger patterns to `scripts/keyword-router.mjs`
5. Update `templates/CLAUDE.md`

```markdown
---
name: your-skill
description: One-line description
---

<Purpose>
What this skill does and why.
</Purpose>

<Use_When>
- User says "trigger phrase"
</Use_When>

<Steps>
1. First step
2. Second step
</Steps>
```

</details>

<details>
<summary><b>MCP Server Development</b></summary>

Both servers use `@modelcontextprotocol/sdk` with StdioServerTransport:

1. Define tools with JSON Schema parameters
2. Handle `call_tool` requests
3. Spawn CLI subprocess with prompt on stdin
4. Store job in memory Map
5. Support async polling via `*_status` tool

</details>

---

## License

[GPL-3.0](LICENSE) &mdash; Free software. Share alike.

---

<div align="center">

**claude-forge** &mdash; Because one AI model is never enough.

[GitHub](https://github.com/staticpayload/claude-forge) &bull; [Issues](https://github.com/staticpayload/claude-forge/issues) &bull; [Discussions](https://github.com/staticpayload/claude-forge/discussions)

</div>
