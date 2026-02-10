---
name: swarm
description: Fire-and-forget parallel execution without team infrastructure overhead
---

<Purpose>
Lightweight alternative to `/claude-forge:team`. Spawns N agents in parallel without
TeamCreate/TeamDelete overhead. Each agent gets a task and runs independently -- no
inter-agent messaging, no monitoring loop, no file ownership enforcement, no state file.

Use swarm when you need speed and the tasks are truly independent. Use team when you
need coordination, dependencies, or file conflict prevention.
</Purpose>

<Use_When>
- User says "swarm", "fire and forget", "blast", "spawn N agents"
- Tasks are fully independent (no shared files, no dependencies between tasks)
- Coordination overhead isn't worth it (simple parallel work)
- Quick parallel execution is more important than fault tolerance
- You need to process >5 tasks in waves
</Use_When>

<Syntax>
```
/claude-forge:swarm [N] "task description"
/claude-forge:swarm "task description"
```

### Parameters
- **N** (optional) - Number of parallel agents (2-5 per wave). If omitted, auto-detect from task analysis.
- **task** - High-level task to decompose and distribute.

### Examples
```
/claude-forge:swarm 3 "fix all lint errors in src/"
/claude-forge:swarm 5 "write unit tests for each service in src/services/"
/claude-forge:swarm "add JSDoc comments to all exported functions"
/claude-forge:swarm 4 "update all API endpoints to use the new auth middleware"
```
</Syntax>

<Architecture>
```
User: "/swarm 3 fix lint errors"
            |
            v
    [SWARM COORDINATOR]
            |
            +-- Analyze task, break into N subtasks
            |
            +-- For each subtask:
            |     +-- Classify (backend/frontend/ambiguous)
            |     +-- Route to best provider
            |     +-- TaskCreate (for tracking)
            |     +-- Spawn agent (background)
            |
            +-- Wait for all agents to complete
            |     +-- Claude agents: check TaskList
            |     +-- MCP workers: poll *_status every 25s
            |
            +-- Collect results
            |
            +-- Report summary
```

No TeamCreate. No TeamDelete. No SendMessage. No state file.
Swarm is fire-and-forget by design.
</Architecture>

<Lifecycle>

## Phase 1: Decompose

1. Analyze the task for independent subtasks
2. If N not specified, determine optimal count:
   - Count distinct files/modules affected
   - Cap at 5 (Claude Code background task limit)
   - Minimum 2 (otherwise just do it directly)
3. For each subtask:
   - Assign target files (best-effort, not strictly enforced)
   - Classify via routing signals:
     * Count backend signals (api, server, database, script, docker, auth, middleware)
     * Count frontend signals (component, ui, css, react, vue, design, layout)
   - Score complexity for model tier selection (haiku <4, sonnet 4-8, opus 8+)
4. Present decomposition to user (brief summary, not full approval flow)

## Phase 2: Spawn

For each subtask, in parallel:

1. Create tracking task:
   ```
   TaskCreate(
     subject: "Swarm: [brief description]",
     description: "[detailed task with file list and acceptance criteria]",
     activeForm: "[present continuous description]"
   )
   ```

2. Route and spawn:
   ```
   IF classification == "backend" AND Codex available:
     -> codex_exec(prompt, workFolder) -- poll status until done
   ELSE IF classification == "frontend" AND Gemini available:
     -> gemini_exec(prompt, workFolder) -- poll status until done
   ELSE IF classification == "backend":
     -> Task(subagent_type: "claude-forge:executor", model: tier, run_in_background: true)
   ELSE IF classification == "frontend":
     -> Task(subagent_type: "claude-forge:designer", model: tier, run_in_background: true)
   ELSE:
     -> Task(subagent_type: "claude-forge:executor", model: tier, run_in_background: true)
   ```

3. Launch ALL agents immediately -- don't wait between spawns.

### Wave-Based Spawning (>5 tasks)

When there are more than 5 subtasks, use waves:

```
Wave 1: Spawn tasks 1-5
  Wait for at least 2 to complete (frees up slots)
Wave 2: Spawn tasks 6-10
  Wait for at least 2 to complete
Wave 3: Spawn remaining tasks
  Wait for all to complete
```

This respects the 5-concurrent-background-task limit while maximizing throughput.

## Phase 3: Collect

1. Wait for all agents/jobs to complete:
   - For MCP workers: poll `*_status(jobId)` every 25 seconds
   - For Claude agents: check TaskList for task completion
   - Timeout: 10 minutes per task (configurable)

2. Collect results from each agent/job

3. Mark tracking tasks as completed:
   ```
   TaskUpdate(taskId: "ID", status: "completed")
   ```

4. Handle failures:
   - If a task failed: log the error, do NOT retry automatically
   - Offer to retry failed tasks at the end

## Phase 4: Report

Display summary:

```
SWARM COMPLETE
Tasks: {completed}/{total} | Duration: {time}
Routing: {N} Claude, {M} Codex, {P} Gemini

Results:
  [DONE] #1: {subject} ({provider}, {duration})
  [DONE] #2: {subject} ({provider}, {duration})
  [FAIL] #3: {subject} ({provider}, error: {reason})

{If failures exist:}
{N} task(s) failed. Run `/claude-forge:swarm --retry` to retry failed tasks.
```

No integration step. No verification step. Swarm trusts workers to self-verify.

</Lifecycle>

<MCP_Worker_Preamble>
When routing to Codex or Gemini CLI, use this preamble:

```
You are a swarm worker. Execute this task independently.

TASK: {task description}
TARGET FILES: {file list}

Instructions:
1. Implement the task for the specified files
2. Verify your changes compile and work correctly
3. Report what you changed and verification results

Do NOT delegate to other tools or CLIs. Work directly.
```
</MCP_Worker_Preamble>

<Differences_From_Team>
## Swarm vs Team

| Feature | Team | Swarm |
|---------|------|-------|
| TeamCreate/TeamDelete | Yes | No |
| SendMessage | Yes (DM, broadcast, shutdown) | No |
| File ownership enforcement | Yes (honor system in preamble) | No (best-effort) |
| Monitoring/watchdog | Yes (5min warn, 10min reassign) | No |
| Task dependencies | Yes (blocks/blockedBy) | No |
| Cascade mode | Yes (implement->test->review) | No |
| Cross-CLI verification | Yes (alternate model reviews) | No |
| Dynamic redistribution | Yes (early finishers reassigned) | No |
| State file | Yes (.forge/team-state.json) | No |
| Recovery on resume | Yes (idempotent) | No |
| Worker-to-worker messaging | Yes (peer SendMessage) | No |
| Smart auto-routing | Yes (automatic per-subtask) | Yes (automatic per-subtask) |
| Wave-based spawning | No (max 5 workers) | Yes (>5 tasks in waves) |
| Overhead | Medium (setup + monitoring) | Minimal (spawn + wait) |
| Best for | Complex coordinated work | Simple independent parallel tasks |

### When to Use Which

**Use Swarm when:**
- Tasks don't share files
- No dependencies between tasks
- Speed matters more than fault tolerance
- You have >5 independent tasks (wave spawning)
- Simple "do this N times" parallelism

**Use Team when:**
- Workers need to coordinate (shared interfaces, dependencies)
- File conflicts are possible
- You want automatic follow-up tasks (cascade)
- You want cross-CLI verification
- You need fault tolerance (watchdog, restart, reassign)
- Task order matters (dependency graph)
</Differences_From_Team>

<Error_Handling>
## Failure Behavior

- Swarm does NOT retry failed tasks automatically
- Swarm does NOT have a watchdog -- if an agent hangs, it times out at 10 minutes
- Swarm does NOT redistribute work -- if one agent fails, its task stays failed
- After completion, swarm reports all failures and offers manual retry

This is intentional. Swarm trades fault tolerance for speed and simplicity.
If you need fault tolerance, use `/claude-forge:team` instead.
</Error_Handling>

<Gotchas>
## Gotchas

1. **No file conflict prevention** -- Two swarm workers CAN modify the same file.
   If tasks share files, use `/claude-forge:team` instead.

2. **No state file** -- If the session crashes, swarm progress is lost.
   TaskCreate entries remain but there's no way to resume the swarm.

3. **MCP workers are one-shot** -- Codex and Gemini workers execute once and return.
   You can't send them follow-up instructions.

4. **Wave spawning delays** -- For >5 tasks, later waves wait for earlier ones.
   This is necessary to respect the 5-concurrent-background-task limit.

5. **No verification step** -- Swarm trusts workers to self-verify.
   Run build/test yourself after swarm completes if you need confidence.

6. **Timeout is per-task** -- A single slow task delays the overall swarm.
   If one MCP job takes 8 minutes, you wait 8 minutes.
</Gotchas>
