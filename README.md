<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
  <img alt="claude-forge" src="assets/banner-dark.svg" width="800">
</picture>

<br>

<p>
  <a href="https://www.npmjs.com/package/claude-forge-plugin"><img src="https://img.shields.io/npm/v/claude-forge-plugin.svg?style=flat-square&color=171717&labelColor=171717" alt="npm"></a>
  &nbsp;
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPLv3-171717.svg?style=flat-square&labelColor=171717" alt="license"></a>
  &nbsp;
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%E2%89%A518-171717.svg?style=flat-square&labelColor=171717" alt="node"></a>
</p>

---

Multi-CLI delegation and orchestration for **Claude Code**.

Route backend work to **Codex CLI** (GPT-5.3, 128K) and frontend work to **Gemini CLI** (1M context).
Claude orchestrates everything — classifying tasks, delegating to the right model, and verifying results.

No CLIs required. Built-in agents handle it when CLIs aren't installed.

---

## Install

```bash
npm install -g claude-forge-plugin
```

Or as a Claude Code plugin:

```bash
/plugin marketplace add https://github.com/staticpayload/claude-forge
/plugin install claude-forge
```

Then run the setup wizard:

```
/claude-forge:setup
```

The wizard handles CLI detection, model preferences, HUD configuration, and team setup.
Already configured? It offers a quick CLAUDE.md update instead of the full wizard.

---

## How it works

Your prompt hits a keyword router (100+ patterns). It classifies the task, scores complexity, and routes to the right destination.

```
prompt → keyword router → classification
                            ├── Codex CLI    (backend signals: api, server, database, auth...)
                            ├── Gemini CLI   (frontend signals: component, ui, css, react...)
                            ├── built-in agents  (when CLIs unavailable)
                            └── direct execution (simple tasks)
```

Complexity scoring decides the model tier: **Haiku** for simple work, **Sonnet** for standard, **Opus** for architecture.

---

## Teams

Coordinated multi-agent teams using Claude Code native infrastructure. The flagship orchestration feature.

```
/claude-forge:team 4 "build the user dashboard with auth, API, components, and tests"
```

```
          ┌─────────────────────────────────────────┐
          │              TEAM LEAD                   │
          │   decompose → route → monitor → verify   │
          └──────┬──────────┬──────────┬─────────────┘
                 │          │          │
         ┌───────▼──┐ ┌────▼─────┐ ┌──▼────────┐
         │ Worker 1  │ │ Worker 2 │ │ Worker 3  │
         │ executor  │ │ designer │ │ codex MCP │
         │ (claude)  │ │ (claude) │ │ (GPT-5.3) │
         └───────────┘ └──────────┘ └───────────┘
```

Workers communicate directly, claim tasks from a shared list, and respect file ownership boundaries.

**Smart auto-routing** classifies each subtask and sends it to the best provider — Codex for backend, Gemini for frontend, Claude agents for everything else. No manual routing needed.

### What makes it different

| Feature | claude-forge | Others |
|:--------|:-------------|:-------|
| Worker-to-worker messaging | Peer-to-peer | Lead-only |
| Task routing | Automatic per-subtask | Manual |
| Dynamic scaling | Early finishers reassigned | Fixed |
| Cascade mode | Auto-create test + review tasks | None |
| Cross-CLI verification | Alternate model reviews work | None |
| Team templates | 5 pre-built | None |
| Build step required | No | Yes |

### Templates

Start fast with pre-built team compositions:

| Template | Workers | Use case |
|:---------|:--------|:---------|
| `build-team` | architect + executor + designer | Feature development |
| `review-team` | style + quality + security + perf | Code review |
| `fullstack-team` | architect + executor + designer + test-engineer | End-to-end features |
| `audit-team` | security + quality + code reviewers | Security audit |
| `debug-team` | explorer + debugger + executor | Bug investigation |

```
/claude-forge:team fullstack-team "implement the billing system"
```

[Full teams documentation →](docs/teams.md)

---

## Swarm

Lightweight fire-and-forget parallel execution. No team overhead — just spawn agents and collect results.

```
/claude-forge:swarm 5 "write unit tests for each service in src/services/"
```

Swarm decomposes the task, routes each subtask to the best provider, spawns all agents immediately, and reports results. Wave-based spawning handles 5+ tasks without hitting concurrency limits.

Use **team** when tasks need coordination. Use **swarm** when they're independent.

[Full swarm documentation →](docs/swarm.md)

---

## Execution Modes

9 modes that compose together. [Full guide →](docs/modes.md)

| Mode | Trigger | Description |
|:-----|:--------|:------------|
| `autopilot` | "autopilot", "build me" | Full pipeline — expand, plan, execute, QA, validate |
| `ralph` | "ralph", "don't stop" | Persistence loop — work, verify, repeat until done |
| `ultrawork` | "ulw", "ultrawork" | Parallel engine — decompose, assign ownership, run simultaneously |
| `ecomode` | "ecomode", "budget" | Cost-efficient model routing — Haiku/Sonnet preference |
| `ultraqa` | "ultraqa" | QA cycling — test, diagnose, fix, repeat |
| `ultrapilot` | "ultrapilot" | Parallel autopilot with file ownership partitioning |
| `team` | "forge team", template names | Coordinated agents with shared task list |
| `swarm` | "swarm", "fire and forget" | Fire-and-forget parallel execution |
| `pipeline` | "pipeline", "chain agents" | Sequential agent chains with data passing |

Ralph includes ultrawork. Ecomode modifies any mode. Autopilot transitions to ralph or ultraqa.

---

## Skills

42+ skills across 8 categories. Trigger them naturally or with `/claude-forge:<skill>`.

### CLI delegation

| Skill | Description |
|:------|:------------|
| `forge` | Auto-route to best CLI by signal classification |
| `backend` / `frontend` | Direct delegation to Codex or Gemini |
| `backend-agent` / `frontend-agent` | Built-in agents when CLIs unavailable |
| `review` | Parallel review — Codex checks logic, Gemini checks design |
| `parallel` | Decompose task into parallel waves across both CLIs |

### Planning and research

| Skill | Description |
|:------|:------------|
| `plan` | Strategic planning with interview, consensus, or review modes |
| `research` | Parallel scientists — sub-questions, cross-validation, synthesis |

### Code quality

| Skill | Description |
|:------|:------------|
| `code-review` | 5-dimension severity-rated review |
| `security-review` | OWASP Top 10, secrets detection, auth audit |
| `tdd` | Red-Green-Refactor enforcement |
| `build-fix` | Minimal-diff fixes for build errors |

### Analysis

| Skill | Description |
|:------|:------------|
| `analyze` | Deep investigation — architecture, bugs, performance |
| `deepsearch` | Multi-strategy exhaustive codebase search |

<details>
<summary>Productivity, specialists, and configuration</summary>

<br>

**Productivity:** `worktree` · `techdebt` · `fix` · `learn` · `deepinit` · `note` · `learner` · `trace`

**Specialists:** `frontend-ui-ux` · `git-master`

**Configuration:** `setup` · `doctor` · `help` · `hud` · `cancel` · `set-codex-model` · `set-gemini-model` · `enable-codex` · `enable-gemini`

</details>

---

## Magic keywords

Say these naturally in any prompt. They compose together.

| Keyword | Effect |
|:--------|:-------|
| `ultrawork` / `ulw` | Maximum parallelism — decompose and run agents simultaneously |
| `deepsearch` | Exhaustive search — multiple strategies, never stops at first result |
| `analyze` / `investigate` | Deep context gathering before any action |
| `ultrathink` / `think hard` | Extended reasoning — quality over speed |

*"ultrawork this analysis"* activates both parallel execution and deep investigation.

---

## Agents

32 agents with automatic model routing. [Full catalog →](docs/agents.md)

| Lane | Agents |
|:-----|:-------|
| Build | `explorer` · `analyst` · `planner` · `architect` · `debugger` · `executor` · `deep-executor` · `verifier` |
| Review | `style-reviewer` · `quality-reviewer` · `api-reviewer` · `security-reviewer` · `performance-reviewer` · `code-reviewer` |
| Domain | `dependency-expert` · `test-engineer` · `build-fixer` · `designer` · `writer` · `qa-tester` · `scientist` · `git-master` · `quality-strategist` |
| Product | `product-manager` · `ux-researcher` · `information-architect` · `product-analyst` |
| Coordination | `critic` · `vision` · `researcher` · `team-lead` · `team-worker` |

### Team compositions

```
Feature:    analyst → planner → executor → test-engineer → quality-reviewer → verifier
Bug fix:    explorer + debugger → executor → test-engineer → verifier
Review:     style-reviewer + quality-reviewer + api-reviewer + security-reviewer
Full-stack: planner → [Codex: backend] + [Gemini: frontend] → test-engineer → verifier
```

---

## HUD

Two-line status bar showing everything at a glance.

```
branch:main | model:Claude Opus 4
[FORGE] | 5h:[████████]42% wk:[████░░░░]28% | cx:✓ gm:✓ | run:cx:1 done:3 | ~$0.18 | ctx:[██████░░░░]62%
```

Rate limits, CLI availability, active jobs, cost estimate, context usage. Configure with `/claude-forge:hud`.

---

## Architecture

Two MCP servers handle CLI delegation. [Full guide →](docs/cli-delegation.md)

**forge-codex** — Spawns `codex exec --yolo` via stdin. GPT-5.3, 128K context.
Tools: `codex_exec` · `codex_status` · `codex_cancel` · `codex_list`

**forge-gemini** — Spawns `gemini -y` via stdin. Gemini 3 Pro, 1M context.
Tools: `gemini_exec` · `gemini_status` · `gemini_cancel` · `gemini_list`

Five lifecycle hooks: `SessionStart` (CLI detection) · `UserPromptSubmit` (keyword routing) · `PreToolUse` (per-tool hints) · `PostToolUse` (context monitoring) · `Stop` (continuation enforcement)

Security: path-validated context files, system directory blocklist, basename-only CLI resolution, anti-loop sandwich pattern, 10MB output cap.

<details>
<summary>File structure</summary>

```
claude-forge/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── agents/                  32 agent system prompts
│   ├── team-lead.md         team coordinator (opus)
│   └── team-worker.md       team worker (sonnet)
├── docs/                    feature documentation
│   ├── teams.md
│   ├── swarm.md
│   ├── modes.md
│   ├── agents.md
│   └── cli-delegation.md
├── hooks/hooks.json         5 lifecycle hooks
├── hud/
│   ├── forge-hud.mjs        status bar renderer
│   └── usage-api.mjs        Anthropic Usage API
├── scripts/
│   ├── keyword-router.mjs   100+ regex patterns
│   ├── session-init.mjs     CLI detection
│   ├── context-monitor.mjs  token tracking
│   ├── pre-tool-enforcer.mjs
│   ├── continuation.mjs     exit prevention
│   └── lib/                 routing, keywords, complexity
├── servers/
│   ├── codex-server.mjs     Codex MCP server
│   └── gemini-server.mjs    Gemini MCP server
├── skills/                  42+ skill definitions
│   ├── team/SKILL.md        1600 lines — teams orchestration
│   ├── swarm/SKILL.md       fire-and-forget parallel
│   └── ...
└── templates/CLAUDE.md      injected instructions
```

</details>

---

## Documentation

| Guide | Description |
|:------|:------------|
| [Teams](docs/teams.md) | Coordinated multi-agent teams — templates, lifecycle, smart routing, cascade |
| [Swarm](docs/swarm.md) | Fire-and-forget parallel execution — wave spawning, routing |
| [Execution Modes](docs/modes.md) | All 9 modes — autopilot, ralph, ultrawork, teams, and more |
| [Agents](docs/agents.md) | Full catalog of 32 agents — models, capabilities, compositions |
| [CLI Delegation](docs/cli-delegation.md) | Codex and Gemini integration — routing, MCP tools, fallbacks |

---

## Examples

```
autopilot: Build user auth with JWT, password hashing, rate limiting, and email verification
```

```
forge team fullstack-team: Implement the entire checkout flow with Stripe integration
```

```
swarm 5: Write comprehensive tests for every module in src/services/
```

```
ultrawork: Migrate the entire codebase from CommonJS to ESM
```

```
forge review the authentication PR
```

```
ecomode: Add form validation to the signup page
```

---

## Troubleshooting

**Codex CLI not found** — `npm install -g @openai/codex` then `/claude-forge:enable-codex`

**Gemini CLI not found** — `npm install -g @google/gemini-cli` then `/claude-forge:enable-gemini`

**Skills not appearing** — Run `/claude-forge:doctor` for 7 diagnostic checks with auto-fix

**Cancel a stuck mode** — `/claude-forge:cancel --force`

---

## Contributing

Pure ESM JavaScript, no build step. Add a skill by creating `skills/<name>/SKILL.md`, adding trigger patterns to `keyword-router.mjs`, and updating `templates/CLAUDE.md`.

---

<sub>[GPL-3.0](LICENSE) · [GitHub](https://github.com/staticpayload/claude-forge) · [npm](https://www.npmjs.com/package/claude-forge-plugin) · [Issues](https://github.com/staticpayload/claude-forge/issues)</sub>
