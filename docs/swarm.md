# Swarm

Fire-and-forget parallel execution without team infrastructure overhead. Decompose a task, spawn N agents immediately, collect results.

Use **swarm** for independent parallel tasks. Use **team** when tasks need coordination, dependencies, or file conflict prevention.

## Quick Start

### Fix lint errors across 3 modules

```
/claude-forge:swarm 3 "fix all lint errors in src/"
```

Swarm analyzes the task, breaks it into 3 independent subtasks (one per module), routes each to the best provider, and spawns all agents immediately. No team setup, no messaging loop.

### Write tests for N services

```
/claude-forge:swarm 5 "write unit tests for each service in src/services/"
```

Swarm creates one test task per service, spawns up to 5 agents in parallel, and reports results. Each agent works independently.

### Add documentation (auto-detect count)

```
/claude-forge:swarm "add JSDoc comments to all exported functions"
```

Swarm analyzes the codebase, determines optimal parallelism (2-5), and spawns that many agents.

## How It Works

Swarm has a 4-phase lifecycle: decompose, spawn, collect, report.

### Phase 1: Decompose

1. Analyze the task for independent subtasks
2. If N is not specified, determine optimal count by counting distinct files/modules (capped at 5)
3. For each subtask:
   - Assign target files (best-effort)
   - Classify via routing signals: backend (api, server, database, auth, middleware) or frontend (component, ui, css, react)
   - Score complexity for model tier (Haiku <4 signals, Sonnet 4-8, Opus 8+)
4. Brief summary to user (no full approval flow — swarm is lightweight)

### Phase 2: Spawn

For each subtask in parallel:

1. Create a tracking task with subject, description, and acceptance criteria
2. Route and spawn based on classification:
   - Backend + Codex available → `codex_exec()`
   - Frontend + Gemini available → `gemini_exec()`
   - Ambiguous or CLI unavailable → built-in Claude agent (`executor` or `designer`)
3. Launch ALL agents immediately — no sequential waiting

### Phase 3: Collect

1. Poll for completion:
   - MCP workers: `*_status()` every 25 seconds
   - Claude agents: check TaskList
   - Timeout: 10 minutes per task
2. Collect results from each agent/job
3. Mark tracking tasks as completed

### Phase 4: Report

Display summary with per-task results and routing stats:

```
SWARM COMPLETE
Tasks: 5/5 | Duration: 2m 34s
Routing: 2 Claude, 2 Codex, 1 Gemini

Results:
  [DONE] #1: Fix lint in services/auth.ts (Codex, 1m 12s)
  [DONE] #2: Fix lint in services/api.ts (Codex, 58s)
  [DONE] #3: Fix lint in utils/ (Claude, 1m 45s)
  [DONE] #4: Fix lint in hooks/ (Gemini, 1m 02s)
  [DONE] #5: Fix lint in components/ (Claude, 1m 30s)
```

No integration step. No verification step. Swarm trusts workers to self-verify.

## Wave-Based Spawning

For >5 tasks, swarm automatically uses waves to respect the 5-concurrent-background-task limit:

```
Wave 1: Spawn tasks 1-5
  Wait for at least 2 to complete (frees up slots)

Wave 2: Spawn tasks 6-10
  Wait for at least 2 to complete

Wave 3: Spawn remaining tasks
  Wait for all to complete
```

This maximizes throughput while respecting concurrency limits.

## Auto-Routing

Swarm automatically classifies each subtask and routes it to the best provider:

- **Backend signals** (api, server, database, script, docker, auth, middleware) → Codex CLI if available, else `executor` agent
- **Frontend signals** (component, ui, css, react, vue, design, layout) → Gemini CLI if available, else `designer` agent
- **Ambiguous** → Claude `executor` agent

No manual routing needed. Classification and routing happen per-subtask, not globally.

## Swarm vs Team

| Feature | Team | Swarm |
|---------|------|-------|
| TeamCreate/TeamDelete | Yes | No |
| SendMessage | Yes (DM, broadcast) | No |
| File ownership enforcement | Yes | Best-effort only |
| Monitoring/watchdog | Yes (5min warn, 10min reassign) | No |
| Task dependencies | Yes (blocks/blockedBy) | No |
| Cascade mode | Yes (implement→test→review) | No |
| Cross-CLI verification | Yes | No |
| Dynamic redistribution | Yes (early finishers reassigned) | No |
| State file | Yes (.forge/team-state.json) | No |
| Recovery on resume | Yes (idempotent) | No |
| Smart auto-routing | Yes (per-subtask) | Yes (per-subtask) |
| Wave-based spawning | No (max 5 workers) | Yes (for >5 tasks) |
| Overhead | Medium | Minimal |

### When to Use Which

**Use Swarm when:**
- Tasks don't share files
- No dependencies between tasks
- Speed matters more than fault tolerance
- >5 independent tasks (leverage wave spawning)
- Simple "do this N times" parallelism

**Use Team when:**
- Workers need to coordinate (shared interfaces, shared files)
- Task dependencies exist (one task blocks another)
- Automatic follow-up tasks help (cascade mode)
- Cross-CLI verification needed
- Fault tolerance required (watchdog, restart, reassign)

## Error Handling

Swarm trades fault tolerance for speed and simplicity:

- No automatic retry on failure
- No watchdog — 10-minute timeout per task
- No redistribution — failed task stays failed
- Failures reported at end with option for manual retry

If a task fails, swarm collects the error and continues. After all tasks complete, swarm reports failures and offers:

```
2 task(s) failed. Run `/claude-forge:swarm --retry` to retry failed tasks.
```

For mission-critical work needing automatic recovery, use `/claude-forge:team` instead.

## Cancellation

Cancel a running swarm with `/claude-forge:cancel`:

1. Check TaskList for tasks with "Swarm:" prefix
2. Cancel all MCP jobs (Codex, Gemini)
3. Mark remaining tasks as completed

Use `--force` to clear all state files immediately.

## Tips

- **Keep tasks independent** — swarm does not enforce file ownership. Two workers modifying the same file will conflict. Use team if tasks share files.
- **Run build/test yourself** — swarm trusts workers to self-verify. Run `npm test` or `npm build` after swarm completes if you need confidence.
- **Use for batch operations** — lint fixes, test writing, doc updates, comment generation. All are independent and parallelizable.
- **Wave spawning is automatic** — for >5 tasks, swarm uses waves. You don't configure it; it just works.
- **No state file on crash** — if the session crashes during swarm, the TaskCreate entries remain but there's no way to resume. Restart the swarm manually if needed.
