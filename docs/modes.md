# Execution Modes

claude-forge has 9 execution modes that control how work is done. They compose together to handle different task profiles: autonomous pipelines, persistent loops, parallel execution, token optimization, QA cycling, coordinated teams, and more.

---

## Mode Overview

| Mode | Triggers | State File | Description |
|------|----------|-----------|-------------|
| **autopilot** | "autopilot", "build me", "I want a", "make me a" | `.forge/autopilot-state.json` | Full autonomous pipeline: expand → plan → execute → QA → validate |
| **ralph** | "ralph", "don't stop", "must complete" | `.forge/ralph-state.json` | Persistence loop with architect verification; keeps working until done |
| **ultrawork** | "ulw", "ultrawork", "maximum performance" | `.forge/ultrawork-state.json` | Maximum parallelism with file ownership partitioning |
| **ecomode** | "ecomode", "budget mode" | `.forge/ecomode-state.json` | Token-efficient model routing (haiku/sonnet preference) |
| **ultraqa** | "ultraqa", "make tests pass" | `.forge/ultraqa-state.json` | QA cycling: test → diagnose → fix → repeat until passing |
| **ultrapilot** | "ultrapilot", "parallel build" | `.forge/ultrapilot-state.json` | Parallel autopilot with file ownership partitioning |
| **team** | "team", template names | `.forge/team-state.json` | Coordinated agents with native teams (TeamCreate/SendMessage) |
| **swarm** | "swarm", "fire and forget" | None (stateless) | Fire-and-forget parallel execution with wave-based spawning |
| **pipeline** | "pipeline", "chain agents" | `.forge/pipeline-state.json` | Sequential agent chains with data passing and branching support |

---

## Autopilot

Full autonomous pipeline from requirement to completion.

**5 phases:**
1. **Expand** (analyst): clarify requirements, identify hidden constraints
2. **Plan** (planner): break work into tasks, estimate, sequence
3. **Execute** (executor): implement, refactor, integrate
4. **QA** (ultraqa): test, diagnose failures, fix iteratively
5. **Validate** (verifier): verify completion criteria met

**Behavior:** Resumable — saves progress at each phase. Can transition internally to ralph (keep going) or ultraqa (focus on test failures).

**When to use:** Vague requirements, multi-step work, first-time tasks.

---

## Ralph

Persistence loop. Keep working until done.

**Behavior:** `work → verify → repeat`. Includes ultrawork for parallel execution. The architect verifies completion at each cycle. Loops until the task is truly finished or explicitly cancelled.

**Key difference from autopilot:** Doesn't stop after one pass. Useful for "this must be completely finished" tasks.

**When to use:** High-stakes deliverables, refactors that must be comprehensive, tasks where partial completion is not acceptable.

---

## Ultrawork

Maximum parallelism through file ownership partitioning.

**Behavior:** Decomposes tasks into independent subtasks, assigns file ownership to prevent conflicts, runs up to 5 concurrent agents simultaneously. Each agent owns specific files.

**State management:** Shared state file, file-level locking to prevent race conditions.

**When to use:** Large multi-file tasks, when speed matters more than sequential feedback.

---

## Ecomode

Model routing modifier — not a standalone mode. Routes haiku-tier work to haiku, sonnet-tier to sonnet, reduces opus usage.

**Behavior:** Composes with any other mode. Example: `ecomode autopilot`, `ecomode ralph`, `ecomode ultrapilot`.

**Token savings:** Typically 30-40% reduction in token usage for standard tasks.

**When to use:** Budget constraints, repetitive tasks, when speed over quality is acceptable.

---

## Ultraqa

QA cycling loop. Test-driven remediation.

**Behavior:**
1. Run tests
2. Parse failures
3. Diagnose root cause
4. Apply fix
5. Re-run tests
6. Repeat until all pass or max iterations reached

**Typically activated by:** autopilot internally when tests fail.

**Can be used standalone:** For focused test-fixing workflows.

**When to use:** Flaky test suites, regression fixes, when you need high test coverage confidence.

---

## Ultrapilot

Parallel autopilot. Runs multiple independent autopilot instances simultaneously.

**Behavior:** Partitions the codebase by file ownership, spawns one autopilot per partition, waits for all to complete.

**Performance:** 2-3x faster than sequential autopilot for large multi-file tasks.

**Constraint:** Mutually exclusive with autopilot (choose one).

**When to use:** Large codebases, multiple independent features, parallel development on different files.

---

## Team

Coordinated multi-agent teams using Claude Code native infrastructure.

**Architecture:**
- Team lead (Claude) decomposes task, creates workers, monitors progress
- Workers (executor, designer, security-reviewer, codex MCP, etc.) claim tasks from shared list
- Smart auto-routing classifies each subtask, sends to best provider
- Worker-to-worker messaging for cross-cutting concerns
- Dynamic scaling: early finishers reassigned to new tasks
- Cascade mode: auto-create test and review tasks for completed features

**Providers:**
- **Codex CLI** (GPT-5.3, 128K): backend work (API, server, database, auth)
- **Gemini CLI** (1M context): frontend work (components, UI, CSS, React)
- **Built-in agents:** architectural work, logic, testing

**When to use:** Large teams of developers, complex systems, need cross-functional visibility.

See `docs/teams.md` for full details.

---

## Swarm

Lightweight fire-and-forget parallel. No TeamCreate overhead, no monitoring state.

**Behavior:**
- Decompose task into independent subtasks
- Spawn workers (no team overhead)
- Wait for all to complete
- Report results

**Wave-based spawning:** For >5 tasks, spawn in waves to avoid resource exhaustion.

**No state file:** Stateless execution — progress is not saved.

**When to use:** Independent parallel tasks, quick exploratory work, when you don't need resumability.

See `docs/swarm.md` for full details.

---

## Pipeline

Sequential agent chains. Output feeds into input.

**Behavior:**
- Agent 1 executes, outputs data
- Agent 2 receives data, executes, outputs
- Agent 3 receives, executes, etc.

**Supports:**
- Branching (one agent → many)
- Merging (many agents → one)
- Conditional routing

**When to use:** Multi-step workflows where each step depends on the previous (lint → test → build → deploy; analyze → plan → implement).

---

## Composition Rules

How modes interact:

| Rule | Details |
|------|---------|
| **Ralph includes ultrawork** | Ralph wraps ultrawork for parallelism within the persistence loop |
| **Ecomode modifies any mode** | Model routing only — doesn't change task decomposition |
| **Autopilot can transition internally** | Transitions to ralph (keep looping) or ultraqa (focus on tests) |
| **Autopilot ↔ ultrapilot mutual exclusion** | Choose one; mutually exclusive |
| **Team and swarm are standalone** | Don't compose with autopilot, ralph, ultrawork, or pipeline |
| **Pipeline doesn't parallelize** | Sequential only; use swarm or ultrawork for parallelism |

---

## Decision Guide

```
Is it a single, clear, simple task?
├── Yes → Direct execution (no mode needed)
└── No
    ├── Need full autonomous pipeline?
    │   └── autopilot
    │
    ├── Need to keep going until truly done?
    │   └── ralph
    │
    ├── Need maximum parallelism on large codebase?
    │   ├── Multiple independent features?
    │   │   └── ultrapilot
    │   └── Single task, many parallel subtasks?
    │       └── ultrawork
    │
    ├── Need coordinated multi-agent team?
    │   └── team
    │
    ├── Need independent parallel tasks (no state)?
    │   └── swarm
    │
    ├── Need sequential agent chain?
    │   └── pipeline
    │
    ├── Need tests to pass?
    │   └── ultraqa
    │
    └── Need to save tokens?
        └── ecomode (add to any mode above)
```

---

## Cancellation

All modes cancelled with `/claude-forge:cancel`.

**Auto-detection:** Detects which mode is active and clears its state.

**Force clear:** `/claude-forge:cancel --force` clears all state files.

**Partial cancellation:** Stop current iteration, don't clear history — use `cancel` without `--force`.

---

## State Files

State files stored in `.forge/` directory within the project:

- **autopilot-state.json** – Phase, progress, phase-specific context
- **ralph-state.json** – Cycle count, verification results, iteration history
- **ultrawork-state.json** – File ownership, task assignments, concurrency locks
- **ultraqa-state.json** – Test results, diagnosed failures, iteration count
- **ultrapilot-state.json** – Partition assignments, instance status
- **team-state.json** – Team ID, worker roster, task queue, cascade rules
- **pipeline-state.json** – Agent chain definition, intermediate outputs, routing rules
- **ecomode-state.json** – Model routing preferences (read-only, set in config)

---

## Configuration

Per-project config at `.forge/config.json`:

```json
{
  "defaultMode": "autopilot",
  "modelPreferences": {
    "architect": "opus",
    "reviewer": "sonnet",
    "executor": "sonnet"
  },
  "parallelismLimit": 5,
  "ecomode": false,
  "teamSize": 4
}
```

Global config at `~/.claude/.forge-config.json` for CLI defaults.
