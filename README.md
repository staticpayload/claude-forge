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

Your prompt hits a keyword router (95 patterns). It classifies the task, scores complexity, and routes to the right destination.

```
prompt → keyword router → classification
                            ├── Codex CLI    (backend signals: api, server, database, auth...)
                            ├── Gemini CLI   (frontend signals: component, ui, css, react...)
                            ├── built-in agents  (when CLIs unavailable)
                            └── direct execution (simple tasks)
```

Complexity scoring decides the model tier: **Haiku** for simple work, **Sonnet** for standard, **Opus** for architecture.

---

## Skills

42 skills across 8 categories. Trigger them naturally or with `/claude-forge:<skill>`.

### Execution modes

| Skill | Trigger | Description |
|:------|:--------|:------------|
| `autopilot` | "autopilot", "build me" | Full pipeline — expand, plan, execute, QA, validate |
| `ralph` | "ralph", "don't stop" | Persistence loop — work, verify, repeat until done |
| `ultrawork` | "ulw", "ultrawork" | Parallel engine — decompose, assign ownership, run simultaneously |
| `ecomode` | "ecomode", "budget" | Cost-efficient model routing — Haiku/Sonnet preference |
| `ultraqa` | "ultraqa" | QA cycling — test, diagnose, fix, repeat |
| `ultrapilot` | "ultrapilot" | Parallel autopilot with file ownership partitioning |

Ralph includes ultrawork. Ecomode modifies any mode. Autopilot transitions to ralph or ultraqa.

### Orchestration

| Skill | Description |
|:------|:------------|
| `team` | N coordinated agents on a shared task list with file ownership |
| `pipeline` | Sequential agent chains with data passing between stages |

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

30 agents with automatic model routing.

| Lane | Agents |
|:-----|:-------|
| Build | `explorer` · `analyst` · `planner` · `architect` · `debugger` · `executor` · `deep-executor` · `verifier` |
| Review | `style-reviewer` · `quality-reviewer` · `api-reviewer` · `security-reviewer` · `performance-reviewer` · `code-reviewer` |
| Domain | `dependency-expert` · `test-engineer` · `build-fixer` · `designer` · `writer` · `qa-tester` · `scientist` · `git-master` · `quality-strategist` |
| Product | `product-manager` · `ux-researcher` · `information-architect` · `product-analyst` |
| Coordination | `critic` · `vision` · `researcher` |

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

Two MCP servers handle CLI delegation:

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
├── agents/                  30 agent system prompts
├── hooks/hooks.json         5 lifecycle hooks
├── hud/
│   ├── forge-hud.mjs        status bar renderer
│   └── usage-api.mjs        Anthropic Usage API
├── scripts/
│   ├── keyword-router.mjs   95 regex patterns
│   ├── session-init.mjs     CLI detection
│   ├── context-monitor.mjs  token tracking
│   ├── pre-tool-enforcer.mjs
│   ├── continuation.mjs     exit prevention
│   └── lib/                 routing, keywords, complexity
├── servers/
│   ├── codex-server.mjs     Codex MCP server
│   └── gemini-server.mjs    Gemini MCP server
├── skills/                  42 skill definitions
└── templates/CLAUDE.md      injected instructions
```

</details>

---

## Examples

```
autopilot: Build user auth with JWT, password hashing, rate limiting, and email verification
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
