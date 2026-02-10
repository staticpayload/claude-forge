# Teams

Coordinated multi-agent teams using Claude Code native infrastructure. Decompose a task into independent subtasks, automatically route each to the best provider (Codex CLI for backend, Gemini CLI for frontend, or Claude agents), spawn workers in parallel, and monitor until completion.

Teams achieve throughput impossible for a single agent — while respecting file ownership boundaries, managing dependencies, and verifying integration.

## Quick Start

### Basic team: 3 workers on a task

```bash
/claude-forge:team 3:executor "fix all TypeScript errors in src/"
```

Spawns 3 executor agents. The lead decomposes the work, assigns ownership, routes each subtask, and monitors.

### Pre-built template: fullstack-team

```bash
/claude-forge:team fullstack-team "build the user dashboard with auth, API, and components"
```

Spawns architect (design first), executor (backend), designer (frontend), and test-engineer in phases. Cascade mode auto-creates test tasks after implementation.

### Cascade mode: implement → test → review

Enable with `enableCascade: true` in config (default). When a worker completes an implementation task, the lead auto-creates a test task. When tests pass, auto-creates a review task. Depth capped at 3.

```bash
/claude-forge:team 2:executor "add OAuth 2.0 to the auth module" --cascade
```

## Architecture

```
User: "/claude-forge:team 3:executor build the API"
              |
              v
      [TEAM LEAD (opus model)]
      Coordinator + Monitor
              |
         +----┼----+
         |    |    |
    Phase 1: Decompose
    Break task into subtasks
    Classify + route each
    Assign file ownership

    Phase 2: Setup
    TeamCreate(forge-team-{ts})
    Write .forge/team-state.json

    Phase 3: Spawn
    TaskCreate x 3 (one per subtask)
    TaskUpdate (set deps + owners)
    Spawn workers in parallel:
         |    |    |
         v    v    v
    [Worker 1] [Worker 2] [Worker 3]
    executor   executor    executor
    (claude)   (codex)     (claude)

    Phases 4-6: Monitor, Integrate, Shutdown
    ├─ Phase 4: Poll TaskList every 30s
    │           Watchdog: 5min warn, 10min reassign
    │           Dynamic redistribution
    │
    ├─ Phase 5: Cross-CLI verification
    │           Build / test / lint checks
    │
    └─ Phase 6: SendMessage shutdown → TeamDelete
```

**The flow:**
1. Lead explores affected files to understand scope
2. Break into N independent subtasks with exclusive file ownership
3. Classify each subtask (backend/frontend/ambiguous) and score complexity
4. Route subtask to best provider: Codex (backend + CLI available), Gemini (frontend + CLI available), or Claude agent (fallback)
5. Create tasks, pre-assign owners, set dependencies
6. Spawn all workers in parallel
7. Monitor with polling + watchdog: detect stuck workers, reassign to early finishers
8. Manage cascade follow-ups (implement → test → review)
9. Run cross-CLI verification (alternate model reviews output)
10. Send shutdown signal, cancel MCP jobs, delete team, generate report

## Templates

Pre-built team compositions for common workflows.

| Template | Workers | Use Case |
|----------|---------|----------|
| `build-team` | architect, executor, designer (3) | Feature with design + backend + frontend |
| `review-team` | style, quality, security, perf reviewers (4) | Comprehensive code review |
| `fullstack-team` | architect, executor, designer, test-engineer (4) | Full feature with tests |
| `audit-team` | security, quality, code reviewers (3) | Compliance/security audit |
| `debug-team` | explorer, debugger, executor (3) | Bug investigation + fix |

### build-team example

```bash
/claude-forge:team build-team "implement real-time notifications with WebSocket API"
```

Execution: Architect designs first, then executor (backend) + designer (frontend) work in parallel. Each completion triggers cascade: executor → test task, designer → review task.

### fullstack-team example

```bash
/claude-forge:team fullstack-team "add two-factor authentication"
```

Execution: Architect → executor + designer (parallel) → test-engineer → auto-review. No manual coordination needed.

### review-team example

```bash
/claude-forge:team review-team "review the payment processing module for security and quality"
```

Execution: All 4 reviewers scan the same codebase in parallel (read-only, no conflicts). Each files an independent review. Cascade disabled (reviews are terminal).

### debug-team example

```bash
/claude-forge:team debug-team "fix intermittent CI failures in the WebSocket tests"
```

Execution: Explorer maps the codebase, debugger diagnoses root cause, executor implements fix. Each phase blocks the next. Executor completion triggers test cascade.

## Smart Auto-Routing

Each subtask is automatically classified and routed to the best provider, no manual routing needed.

### Classification

For each subtask description, count backend signals (api, server, database, auth, middleware, redis, queue, webhook, docker) vs frontend signals (component, ui, css, react, vue, tailwind, layout, animation).

- Majority backend signals → "backend"
- Majority frontend signals → "frontend"
- Mixed/unclear → "ambiguous"

### Complexity Scoring

Analyze subtask for scope:
- Simple variables/config changes → **haiku** (fast, cheap)
- Standard implementation tasks → **sonnet** (balanced)
- Architecture/design/integration → **opus** (high quality)

### Routing Decision

```
if (classification == "backend" && codex_available)
  -> route to Codex MCP (GPT-5.3, 128K)
else if (classification == "frontend" && gemini_available)
  -> route to Gemini MCP (Gemini 3, 1M context)
else if (classification == "backend")
  -> route to Claude executor agent (haiku/sonnet/opus)
else if (classification == "frontend")
  -> route to Claude designer agent (haiku/sonnet/opus)
else
  -> route to Claude executor agent (haiku/sonnet/opus)
```

No manual routing. The system chooses the best provider for each subtask independently.

## Lifecycle

### Phase 0: Resume Detection

Check for existing team state before creating a new team.

1. Read `.forge/team-state.json`
2. If file exists with `status: "active"`, call TaskList to verify the team still exists
3. If tasks remain: resume at Phase 4 (monitoring)
4. If all tasks complete: proceed to Phase 5 (integration)
5. If team no longer exists: delete state file, proceed to Phase 1

Resume is automatic. If a session crashes or you disconnect, running `/claude-forge:team ...` again detects the existing team and resumes monitoring.

### Phase 1: Decomposition

Analyze the user's task and break it into independent, ownable subtasks.

1. Parse input: extract worker count, agent type (or template name), task description
2. Launch explorer agent (haiku) to scan affected files and map dependencies
3. Break task into N independent subtasks with clear acceptance criteria
4. For each subtask: classifyTask() (backend/frontend/ambiguous), analyzeComplexity() (haiku/sonnet/opus)
5. Check CLI availability via ToolSearch (is Codex installed? Gemini?)
6. Route each subtask: Codex for backend + available, Gemini for frontend + available, Claude agent as fallback
7. Assign exclusive file ownership per subtask (each file belongs to exactly one worker)
8. Identify shared files (package.json, tsconfig.json, lock files — reserved for coordinator)
9. Identify boundary files (interfaces between components — assigned to most relevant worker)
10. Create dependency graph (which tasks block which)
11. Present decomposition plan to user for approval

Example decomposition plan:

```
TEAM DECOMPOSITION
Task: "implement two-factor authentication"
Workers: 4 | Template: fullstack-team

  #1 [claude]     Design authentication architecture (architect, opus)
     Files: docs/auth-architecture.md
     Dependencies: none

  #2 [codex]      Implement TOTP backend + API endpoints (executor, sonnet)
     Files: src/auth/totp.ts, src/api/auth.ts
     Dependencies: blocked by #1 (needs architecture)

  #3 [gemini]     Build TOTP input component (designer, sonnet)
     Files: src/components/TotpInput.tsx, src/styles/totp.css
     Dependencies: none (can work in parallel with #2)

  #4 [claude]     Write unit + integration tests (test-engineer, sonnet)
     Files: src/__tests__/auth.test.ts, src/__tests__/totp.test.ts
     Dependencies: blocked by #2 and #3 (need implementations to test)

Shared files (coordinator only): package.json, tsconfig.json, .env.local
Boundary files: src/types/auth.ts (assigned to worker-2)

Proceed? [Y/n]
```

### Phase 2: Team Setup

Create the team and write state for recovery.

1. Call TeamCreate("forge-team-{timestamp}") to create the team
2. Write `.forge/team-state.json` with teamName, status ("active"), phase, worker specs, shared/boundary files, cascade settings
3. Current session becomes the team lead (Claude Code's Team lead role)

The state file enables resume detection if your session crashes.

### Phase 3: Task Creation + Worker Spawning

Create all tasks, set dependencies and owners, spawn all workers in parallel.

1. Call TaskCreate for each subtask (N calls, can be parallel)
2. Call TaskUpdate to set task dependencies: `addBlockedBy: ["task-1"]`
3. Call TaskUpdate to pre-assign owners: `owner: "worker-1"` — **CRITICAL: pre-assign all owners before spawning workers** to prevent race conditions
4. Spawn all workers in parallel:
   - Claude agents: `Task(subagent_type: "claude-forge:team-worker", team_name: "...", name: "worker-1")`
   - Codex jobs: `codex_exec(prompt: "...", working_directory: "...")`
   - Gemini jobs: `gemini_exec(prompt: "...", working_directory: "...")`
5. Use `run_in_background: true` for parallel spawning — do not wait for one worker to finish before starting the next
6. Update state file with task IDs and worker job IDs

Workers immediately call TaskList to find their assigned tasks, claim the first pending one, and start working.

### Phase 4: Monitoring

The lead monitors all workers through polling and inbound messages.

1. Poll TaskList every 30 seconds (configurable: `monitorIntervalMs`)
2. For Codex/Gemini workers: poll MCP job status every 25 seconds
3. Report progress to user at milestones (25%, 50%, 75%, 100% complete)
4. Watchdog: if a task stays `in_progress` for 5+ minutes without update, send status check via SendMessage
5. Watchdog: if a task stays `in_progress` for 10+ minutes, mark worker as unresponsive and reassign task to another worker
6. If an MCP worker reports 3 consecutive failures, quarantine that worker
7. When a worker completes all assigned tasks (early finisher), check TaskList for unassigned pending tasks and reassign to that worker
8. Manage cascade follow-ups: when a task completes, if cascade enabled, auto-create follow-up task (implement → test, test → review)
9. Handle dependency unblocking: when a task completes, notify any workers waiting on that task via SendMessage

The lead does not implement — it delegates everything to workers. Workers use TaskUpdate and SendMessage to communicate progress and blockers.

### Phase 5: Integration

Verify that all worker changes integrate correctly.

1. Build verification: run `npm run build` (or project's build command) — all changes must compile/pass lint
2. Test verification: run test suite — existing tests must still pass
3. File conflict check: verify no two workers modified the same file
4. Cross-CLI verification (if enabled): route the completed work to an alternate CLI for review:
   - Claude work → verify via Codex (GPT-5.3 reviews quality)
   - Codex work → verify via Gemini (1M context for comprehensive review)
   - Gemini work → verify via Codex (logic/performance review)
5. If any verification fails: report failure, optionally reassign to worker for fix, or mark team as failed

The lead handles any shared file updates needed for integration (e.g., updating package.json types).

### Phase 6: Shutdown

Graceful shutdown of all workers.

1. Verify all tasks are completed or permanently failed via TaskList
2. Send shutdown message to all active Claude workers: `SendMessage(recipient: "worker-N", content: "SHUTDOWN: All work complete. Finish current operation and stop.")`
3. For Codex/Gemini workers: cancel any running jobs via `codex_cancel(jobId)` / `gemini_cancel(jobId)`
4. Wait up to 15 seconds for workers to acknowledge and finish (configurable: `shutdownTimeoutMs`)
5. Call TeamDelete("forge-team-{timestamp}") to clean up the team
6. Delete state files: `.forge/team-state.json`, `.forge/worker-*-failure.json`
7. Generate and display summary report:

```
TEAM COMPLETE
Team: forge-team-1707580800 | Template: fullstack-team | Duration: 12m 45s
Workers: 4 | Tasks: 10 completed, 0 failed
Build: PASS | Tests: PASS | Cross-CLI Verification: PASS

Worker Performance:
  worker-1 (architect/claude): 1 task, 2m 10s
  worker-2 (executor/codex): 3 tasks, 8m 30s
  worker-3 (designer/gemini): 3 tasks, 7m 45s
  worker-4 (test-engineer/claude): 3 tasks, 5m 20s

Task Results:
  [DONE] #1: Design authentication architecture (worker-1, 2m 10s)
  [DONE] #2: Implement TOTP backend (worker-2, 3m 45s)
  [DONE] #3: Build TOTP input component (worker-3, 2m 30s)
  [DONE] #4: Write unit tests (worker-4, 2m 15s)
  [DONE] #5: Write integration tests (worker-4, 2m 30s)
  ...

All tasks completed successfully.
```

## Worker Communication

Workers communicate in two ways: task status updates (TaskUpdate, TaskList) and peer messaging (SendMessage).

### Status Updates

```
TaskList -> returns all tasks with status, owner, dependencies
TaskUpdate(taskId, status: "in_progress"|"completed")
TaskUpdate(taskId, addBlockedBy: ["other-task-id"])
```

The lead polls TaskList every 30s. Workers call TaskList to claim tasks and TaskUpdate to report progress.

### Peer Messaging

Workers can send targeted messages to other workers or the lead:

```
SendMessage(recipient: "worker-2", content: "API types ready for import")
SendMessage(recipient: "team-lead", content: "Completed task #1: ...")
```

Use peer messaging for:
- Interface handoffs ("I finished the types file, you can import now")
- Dependency notifications ("Blocking task done, you can proceed")
- Conflict prevention ("I need to modify the shared boundary file, please wait")

Peer messages are fast and cheap. The lead uses SendMessage to notify workers of cascade follow-ups or shutdown.

## Cascade Mode

When enabled (default), task completion auto-creates follow-up tasks, building out a comprehensive execution pipeline.

### Cascade Chain

```
Implement task completes
  -> auto-create Test task (test-engineer, sonnet)
       -> auto-create Review task (quality-reviewer, sonnet)
             -> terminal (no more follow-ups)
```

Max cascade depth is 3. Disable per-task with `[no-cascade]` in the task subject or description.

### Example: cascade in fullstack-team

```bash
/claude-forge:team fullstack-team "add OAuth 2.0"
```

1. Architect designs
2. Executor (backend) implements
   - Completion triggers: auto-create test task
3. Designer implements frontend
   - Completion triggers: auto-create test task
4. Test-engineer writes tests for both
   - Completion triggers: auto-create review task
5. Quality-reviewer reviews implementation + tests

Cascade is not forced. Disable with `enableCascade: false` in config or `[no-cascade]` in task subject.

## Cross-CLI Verification

After all tasks complete, the lead routes the completed work to an alternate CLI for verification.

```
Claude executor work -> verify via Codex (GPT-5.3 checks quality)
Codex backend work -> verify via Gemini (1M context checks comprehensiveness)
Gemini frontend work -> verify via Codex (checks logic/performance)
```

Verification is a read-only review. The alternate model files a report: quality score, found issues, recommendations. If critical issues found, lead can reassign to worker for fix.

Enable/disable: `enableCrossCliVerification: true|false` in config (default: true).

## Dynamic Scaling

Workers that finish their assigned tasks early get reassigned to remaining work.

1. Worker completes all assigned tasks
2. Worker sends: `SendMessage(recipient: "team-lead", content: "All assigned tasks complete. Standing by.")`
3. Lead polls TaskList for unassigned pending tasks
4. Lead assigns best-fit task to worker (prefer workers that match task's routing: backend worker for backend task)
5. Lead notifies worker: `SendMessage(recipient: "worker-1", content: "New task #7 assigned: ...")`
6. Worker calls TaskList, claims the new task, and continues

This maximizes throughput. No worker is idle while unassigned work remains.

## Configuration

Read from `~/.claude-forge/config.json` under the `"team"` key. All values are optional and have sensible defaults.

```json
{
  "team": {
    "maxAgents": 5,
    "defaultAgentType": "executor",
    "defaultModel": "sonnet",
    "monitorIntervalMs": 30000,
    "shutdownTimeoutMs": 15000,
    "watchdogWarningMs": 300000,
    "watchdogReassignMs": 600000,
    "maxConsecutiveErrors": 3,
    "enableCascade": true,
    "enableCrossCliVerification": true
  }
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `maxAgents` | 5 | Maximum concurrent workers (hard limit: 5, Claude Code's background task limit) |
| `defaultAgentType` | executor | Agent type when not specified in invocation |
| `defaultModel` | sonnet | Model tier for workers when not overridden by complexity scorer |
| `monitorIntervalMs` | 30000 | How often the lead polls TaskList (milliseconds) |
| `shutdownTimeoutMs` | 15000 | Max wait for worker shutdown responses (milliseconds) |
| `watchdogWarningMs` | 300000 | Send status check after task stuck for 5 minutes |
| `watchdogReassignMs` | 600000 | Auto-reassign task after stuck for 10 minutes |
| `maxConsecutiveErrors` | 3 | Consecutive failures before quarantining a worker |
| `enableCascade` | true | Auto-create follow-up tasks (implement → test → review) |
| `enableCrossCliVerification` | true | Route completed work to alternate CLI for verification |

## State File

`.forge/team-state.json` tracks team state for resume detection and cancellation.

```json
{
  "teamName": "forge-team-1707580800",
  "status": "active",
  "createdAt": "2026-02-10T12:00:00Z",
  "template": "fullstack-team",
  "prompt": "build user dashboard with auth, API, components, tests",
  "phase": "executing",
  "workers": [
    { "name": "worker-1", "agentType": "architect", "routing": "claude", "model": "opus" },
    { "name": "worker-2", "agentType": "executor", "routing": "codex", "model": "sonnet" },
    { "name": "worker-3", "agentType": "designer", "routing": "gemini", "model": "sonnet" },
    { "name": "worker-4", "agentType": "test-engineer", "routing": "claude", "model": "sonnet" }
  ],
  "tasks": [
    { "id": "1", "subject": "Design auth architecture", "owner": "worker-1", "status": "completed" },
    { "id": "2", "subject": "Implement backend", "owner": "worker-2", "status": "in_progress" }
  ],
  "sharedFiles": ["package.json", "tsconfig.json"],
  "boundaryFiles": ["src/types/auth.ts"],
  "cascadeEnabled": true,
  "cascadeDepth": 1,
  "completedTasks": 1,
  "totalTasks": 4
}
```

Written after Phase 2 (Team Setup). Updated as tasks progress. Read during Phase 0 (Resume Detection) and Phase 6 (Shutdown) to recover team state or clean up.

## Cancellation

To cancel a running team, invoke `/claude-forge:cancel`.

The system detects team state automatically:
1. Read `.forge/team-state.json`
2. If team is active: proceed with shutdown
3. Otherwise: no-op

Shutdown process:
1. Send `SendMessage(recipient: "worker-N", content: "SHUTDOWN: ...")` to all active Claude workers
2. Cancel Codex/Gemini MCP jobs via `codex_cancel(jobId)` / `gemini_cancel(jobId)`
3. Wait up to 15 seconds for workers to acknowledge
4. Call `TeamDelete("forge-team-{name}")`
5. Delete state files: `.forge/team-state.json`, `.forge/worker-*-failure.json`
6. Report cancellation

Cancellation is graceful. Workers finish atomic operations before stopping. In-progress work is not lost — state is saved for potential resume.

## Tips

**Pre-assign task owners.** Before spawning workers, call TaskUpdate to pre-assign each task to a specific worker. This prevents race conditions since there is no atomic claiming mechanism.

**Use templates for common patterns.** Templates encode execution order, worker counts, and routing preferences. `build-team`, `review-team`, `fullstack-team` are battle-tested. Custom decompositions work too, but templates save time.

**Enable cascade for comprehensive coverage.** Cascade mode builds out implement → test → review pipelines automatically. Disable selectively with `[no-cascade]` in task subject if a task is truly terminal.

**Teams work without CLIs.** If Codex or Gemini CLIs are not installed, the router falls back to Claude agents. No manual fallback needed — the system chooses the best available provider per subtask.

**Monitor watchdog warnings.** If a worker stays stuck for 5 minutes, the lead sends a warning via SendMessage. If stuck for 10 minutes, the lead auto-reassigns. If a worker fails 3 times, it's quarantined. Check the summary report for worker performance stats.

**Boundary files go to most relevant worker.** If multiple workers need to coordinate on a shared interface (e.g., `src/types/api.ts`), assign ownership to the worker most likely to need it first (usually backend/executor). Other workers can read it freely — only writes are restricted.

**Use peer messaging for coordination.** SendMessage between workers is cheap. Use it to handoff interfaces, notify blockers, prevent conflicts. The lead doesn't need to orchestrate every interaction.
