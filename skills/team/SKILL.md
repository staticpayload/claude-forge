---
name: team
description: N coordinated agents on shared task list using Claude Code native teams
---

# Team Skill

Spawn N coordinated agents working on a shared task list using Claude Code's native team
tools. Supports smart auto-routing (Codex, Gemini, Claude), cascade follow-ups, cross-CLI
verification, worker-to-worker peer messaging, dynamic scaling, and pre-built templates.

<Purpose>
Spawn N coordinated agents that work on a shared task list with smart routing, cascade mode,
cross-CLI verification, and worker-to-worker peer messaging. The team lead decomposes the
task, assigns exclusive file ownership, routes each subtask to the best provider (Codex CLI,
Gemini CLI, or Claude agent), spawns workers in parallel, monitors with a watchdog, handles
dynamic redistribution when workers finish early, manages cascade follow-ups (implement ->
test -> review), runs cross-CLI verification, and orchestrates graceful shutdown.

Better than OMC's team system: automatic per-subtask routing, worker-to-worker messaging,
dynamic scaling, 5 pre-built templates, cascade mode, and cross-CLI verification -- all in
a single SKILL.md with zero build step.
</Purpose>

<Use_When>
- User says "team", "coordinated team", "spawn agents"
- User uses a template name: "build-team", "review-team", "fullstack-team", "audit-team", "debug-team"
- User says "team N:agent-type" (e.g., "team 3:executor")
- Task is large enough to benefit from 2-5 parallel workers
- Work can be decomposed into independent units with clear file ownership
- Task spans backend + frontend and benefits from multi-CLI routing
</Use_When>

<Syntax>
Two invocation formats are supported:

### Format 1: Explicit agent count and type

```
/claude-forge:team [N]:[agent-type] "task description"
```

### Format 2: Pre-built template

```
/claude-forge:team [template-name] "task description"
```

### Parameters

- **N** - Number of worker agents (1-5, enforced by Claude Code limit)
- **agent-type** - Agent to spawn (executor, designer, build-fixer, test-engineer, etc.)
- **template-name** - One of: build-team, review-team, fullstack-team, audit-team, debug-team

### Examples

```bash
# Explicit count and type
/claude-forge:team 3:executor "fix all TypeScript errors across the project"
/claude-forge:team 4:designer "implement responsive layouts for all page components"
/claude-forge:team 2:build-fixer "fix build errors in src/"

# Templates
/claude-forge:team build-team "add user profile feature with API and UI"
/claude-forge:team review-team "review the entire auth module for quality and security"
/claude-forge:team fullstack-team "implement real-time notifications feature"
/claude-forge:team audit-team "comprehensive audit of payment processing code"
/claude-forge:team debug-team "investigate and fix intermittent test failures in CI"
```
</Syntax>

<Architecture>
```
User: "/claude-forge:team 3:executor fix all TypeScript errors"
                |
                v
        [TEAM LEAD (Coordinator)]
                |
                +-- Phase 0: Resume Detection
                |       -> Check .forge/team-state.json
                |       -> If valid: resume monitoring or integration
                |
                +-- Phase 1: Decomposition
                |       -> Explorer agent (haiku) scans affected files
                |       -> Break into N independent subtasks
                |       -> classifyTask() per subtask (routing.mjs)
                |       -> analyzeComplexity() per subtask (complexity.mjs)
                |       -> Assign exclusive file ownership
                |       -> Identify shared + boundary files
                |       -> Create dependency graph
                |       -> Present plan to user for approval
                |
                +-- Phase 2: Team Setup
                |       -> TeamCreate("forge-team-{timestamp}")
                |       -> Write .forge/team-state.json
                |
                +-- Phase 3: Task Creation + Worker Spawning
                |       -> TaskCreate x N (one per subtask)
                |       -> TaskUpdate x N (set dependencies + pre-assign owners)
                |       -> Spawn workers in parallel:
                |          - codex route -> codex_exec with MCP worker preamble
                |          - gemini route -> gemini_exec with MCP worker preamble
                |          - claude route -> Task(subagent: "claude-forge:team-worker")
                |
                +-- Phase 4: Monitoring
                |       -> TaskList polling every 30s
                |       -> Watchdog: 5min warning, 10min auto-reassign
                |       -> Dynamic redistribution (early finishers)
                |       -> Cascade: implement -> test -> review
                |       -> MCP polling: *_status(jobId) every 25s
                |       -> Dependency unblocking via SendMessage
                |
                +-- Phase 5: Integration
                |       -> Cross-CLI verification (alternate model reviews)
                |       -> Build / test / lint verification
                |       -> File conflict check
                |       -> Coordinator handles shared file updates
                |
                +-- Phase 6: Shutdown
                        -> SendMessage shutdown to all workers
                        -> Cancel MCP jobs via *_cancel
                        -> Wait 15s for drain
                        -> TeamDelete("forge-team-{timestamp}")
                        -> Delete .forge/team-state.json
                        -> Generate summary report
```
</Architecture>

<Team_Templates>
Pre-built team compositions for common workflows. Templates define worker count, agent types,
model tiers, routing preferences, and execution order.

### build-team (3 workers)

| Worker | Agent Type | Model | Route | Phase |
|--------|-----------|-------|-------|-------|
| worker-1 | architect | opus | claude | Phase A (sequential first) |
| worker-2 | executor | sonnet | codex or claude | Phase B (parallel) |
| worker-3 | designer | sonnet | gemini or claude | Phase B (parallel) |

**Execution:** Architect designs first, then executor + designer work in parallel.
**Cascade:** executor completion -> auto-create test task; designer completion -> auto-create review task.
**Best for:** New features that need design, backend implementation, and frontend work.

### review-team (4 workers)

| Worker | Agent Type | Model | Route | Phase |
|--------|-----------|-------|-------|-------|
| worker-1 | style-reviewer | haiku | claude | All parallel |
| worker-2 | quality-reviewer | sonnet | codex or claude | All parallel |
| worker-3 | security-reviewer | sonnet | codex or claude | All parallel |
| worker-4 | performance-reviewer | sonnet | codex or claude | All parallel |

**Execution:** All 4 reviewers work in parallel on the same codebase (read-only, no conflicts).
**Cascade:** Disabled by default (reviews are terminal).
**Best for:** Comprehensive code review before a major release or merge.

### fullstack-team (4 workers)

| Worker | Agent Type | Model | Route | Phase |
|--------|-----------|-------|-------|-------|
| worker-1 | architect | opus | claude | Phase A (sequential first) |
| worker-2 | executor | sonnet | codex or claude | Phase B (parallel) |
| worker-3 | designer | sonnet | gemini or claude | Phase B (parallel) |
| worker-4 | test-engineer | sonnet | claude | Phase C (after B) |

**Execution:** Architect -> executor + designer in parallel -> test-engineer writes tests for both.
**Cascade:** executor/designer -> test (handled by worker-4); test -> review (auto-created).
**Best for:** Full feature implementation with backend, frontend, and tests.

### audit-team (3 workers)

| Worker | Agent Type | Model | Route | Phase |
|--------|-----------|-------|-------|-------|
| worker-1 | security-reviewer | sonnet | codex or claude | All parallel |
| worker-2 | quality-reviewer | sonnet | codex or claude | All parallel |
| worker-3 | code-reviewer | opus | codex or claude | All parallel |

**Execution:** All 3 reviewers work in parallel (read-only).
**Cascade:** Disabled by default (reviews are terminal).
**Best for:** Pre-deployment audit, compliance review, or tech debt assessment.

### debug-team (3 workers)

| Worker | Agent Type | Model | Route | Phase |
|--------|-----------|-------|-------|-------|
| worker-1 | explorer | haiku | claude | Phase A (sequential first) |
| worker-2 | debugger | sonnet | claude | Phase B (after explore) |
| worker-3 | executor | sonnet | codex or claude | Phase C (after debug) |

**Execution:** Explorer maps the codebase -> debugger diagnoses the issue -> executor implements fix.
**Cascade:** executor completion -> auto-create test task (test-engineer, sonnet).
**Best for:** Investigating and fixing complex bugs, intermittent failures, or regressions.
</Team_Templates>

<Configuration>
Read from `~/.claude-forge/config.json` under the `"team"` key. All values have sensible
defaults and are optional.

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
| `maxAgents` | 5 | Maximum concurrent workers (hard cap: 5, Claude Code limit) |
| `defaultAgentType` | executor | Agent type when not specified in invocation |
| `defaultModel` | sonnet | Model tier for workers when not overridden by complexity scorer |
| `monitorIntervalMs` | 30000 | How often the lead polls TaskList (milliseconds) |
| `shutdownTimeoutMs` | 15000 | Max wait for worker shutdown responses (milliseconds) |
| `watchdogWarningMs` | 300000 | Send status check after this much time stuck (5 minutes) |
| `watchdogReassignMs` | 600000 | Auto-reassign task after this much time stuck (10 minutes) |
| `maxConsecutiveErrors` | 3 | Consecutive failures before quarantining a worker |
| `enableCascade` | true | Auto-create follow-up tasks on completion (implement -> test -> review) |
| `enableCrossCliVerification` | true | Route verification to alternate CLI after all tasks complete |
</Configuration>

<Lifecycle>

## Phase 0: Resume Detection

Check for existing team state before creating a new team.

1. Read `.forge/team-state.json`
2. If file exists and `status` is `"active"` or `"completing"`:
   a. Extract `teamName` from state
   b. Call `TaskList` to verify team still exists and get task statuses
   c. If tasks remain incomplete: resume at **Phase 4 (Monitoring)**
   d. If all tasks complete: proceed to **Phase 5 (Integration)**
   e. If team no longer exists (stale state): delete state file, proceed to Phase 1
3. If file does not exist or `status` is `"complete"` or `"failed"`: proceed to Phase 1

```json
// Check: does .forge/team-state.json exist?
// If yes, read it:
{
  "teamName": "forge-team-1707580800",
  "status": "active",
  "phase": "executing"
}
// -> Resume monitoring for forge-team-1707580800
```

## Phase 1: Decomposition

Parse the user's input and break the task into independent, ownable subtasks.

### 1.1 Parse Input

- If format is `N:agent-type "task"`: extract N, agent type, and task description
- If format is `template-name "task"`: look up template, extract worker specs
- Validate N is 1-5 (reject if over limit)
- Validate agent type maps to a known agent definition in `agents/`

### 1.2 Explore Affected Files

Launch an explorer agent (haiku model) to scan the codebase:
- Identify files that will need modification
- Map module boundaries and dependencies
- Find shared files (package.json, tsconfig.json, configs)
- Detect existing test files and patterns

### 1.3 Break Into Subtasks

Decompose the work into independent units:
- Each subtask should be file-scoped or module-scoped
- Subtasks must be independent or have explicit dependency ordering
- Each subtask needs: description, acceptance criteria, file ownership list

### 1.4 Classify Each Subtask (Smart Routing)

For each subtask, run the auto-routing algorithm:

```
1. classifyTask(subtaskDescription) -> "backend" | "frontend" | "ambiguous"
   (uses routing.mjs -- backend/frontend signal word matching)

2. analyzeComplexity(subtaskDescription) -> { tier: "haiku"|"sonnet"|"opus", score, explanation }
   (uses complexity.mjs -- lexical/structural/context signal scoring)

3. Check CLI availability:
   - ToolSearch("codex") to check if Codex MCP is available
   - ToolSearch("gemini") to check if Gemini MCP is available

4. Route decision:
   - backend + Codex available   -> route: "codex"
   - frontend + Gemini available -> route: "gemini"
   - backend + no Codex          -> route: "claude", agentType: "executor"
   - frontend + no Gemini        -> route: "claude", agentType: "designer"
   - ambiguous                   -> route: "claude", agentType: "executor"
```

### 1.5 Assign File Ownership

- Each file pattern belongs to exactly ONE worker
- Shared files (package.json, tsconfig.json, .env, lock files) reserved for coordinator
- Boundary files (interfaces between components) assigned to the most relevant worker
- Workers can READ any file but only WRITE to their owned files

### 1.6 Create Dependency Graph

Identify which tasks block which:
- Type definition tasks block implementation tasks that import those types
- Schema tasks block API tasks that use the schema
- Architecture tasks block all implementation tasks (in templates)

### 1.7 Present to User for Approval

Display the decomposition plan:

```
TEAM DECOMPOSITION
Task: "fix all TypeScript errors across the project"
Workers: 3 | Template: custom

  #1 [codex]  Fix type errors in src/auth/ (worker-1, executor, sonnet)
     Files: src/auth/**
     Dependencies: none

  #2 [claude]  Fix type errors in src/api/ (worker-2, executor, sonnet)
     Files: src/api/**
     Dependencies: blocked by #1 (shared auth types)

  #3 [gemini]  Fix type errors in src/components/ (worker-3, designer, sonnet)
     Files: src/components/**
     Dependencies: none

  Shared files (coordinator only): package.json, tsconfig.json
  Boundary files: src/types/api.ts (assigned to worker-1)

Proceed? [Y/n]
```

## Phase 2: Team Setup

Create the team and write state for recovery.

### 2.1 Create Team

```json
TeamCreate({
  "team_name": "forge-team-1707580800",
  "description": "Fix all TypeScript errors across the project"
})
```

Response:
```json
{
  "team_name": "forge-team-1707580800",
  "team_file_path": "~/.claude/teams/forge-team-1707580800/config.json",
  "lead_agent_id": "team-lead@forge-team-1707580800"
}
```

The current session becomes the team lead.

### 2.2 Write State File

Write `.forge/team-state.json` for resume detection and cancellation support:

```json
{
  "teamName": "forge-team-1707580800",
  "status": "active",
  "createdAt": "2026-02-10T12:00:00Z",
  "template": "custom",
  "prompt": "fix all TypeScript errors across the project",
  "phase": "setup",
  "workers": [],
  "sharedFiles": ["package.json", "tsconfig.json"],
  "boundaryFiles": ["src/types/api.ts"],
  "cascadeEnabled": true,
  "cascadeDepth": 0,
  "completedTasks": 0,
  "totalTasks": 0
}
```

## Phase 3: Task Creation + Worker Spawning

Create all tasks, set dependencies and owners, then spawn all workers in parallel.

### 3.1 Create Tasks

Call `TaskCreate` for each subtask:

```json
TaskCreate({
  "subject": "Fix type errors in src/auth/",
  "description": "Fix all TypeScript errors in src/auth/login.ts, src/auth/session.ts, and src/auth/types.ts. Run tsc --noEmit to verify. Only modify files in src/auth/.",
  "activeForm": "Fixing auth type errors"
})
```

### 3.2 Set Dependencies and Pre-Assign Owners

**CRITICAL: Pre-assign ALL task owners BEFORE spawning any workers.** This prevents race
conditions since there is no atomic claiming mechanism.

```json
// Set dependency: task #2 blocked by task #1
TaskUpdate({ "taskId": "2", "addBlockedBy": ["1"] })

// Pre-assign owners
TaskUpdate({ "taskId": "1", "owner": "worker-1" })
TaskUpdate({ "taskId": "2", "owner": "worker-2" })
TaskUpdate({ "taskId": "3", "owner": "worker-3" })
```

Update state file with worker and task information.

### 3.3 Spawn Workers

Spawn all workers in parallel based on their routing:

**Claude workers** (route: "claude"):
```json
Task({
  "subagent_type": "claude-forge:team-worker",
  "team_name": "forge-team-1707580800",
  "name": "worker-1",
  "prompt": "<Claude Worker Preamble with task assignment>"
})
```

**Codex MCP workers** (route: "codex"):
```
codex_exec({
  "prompt": "<MCP Worker Preamble with task assignment>",
  "working_directory": "/path/to/project"
})
```

**Gemini MCP workers** (route: "gemini"):
```
gemini_exec({
  "prompt": "<MCP Worker Preamble with task assignment>",
  "working_directory": "/path/to/project"
})
```

**IMPORTANT:** Spawn all workers in parallel. Do NOT wait for one to finish before
spawning the next. Use `run_in_background: true` for background spawning.

### Claude Worker Preamble

Include this preamble when spawning Claude agent teammates:

```
You are a TEAM WORKER in team "{team_name}". Your name is "{worker_name}".
You report to the team lead ("team-lead").

== ASSIGNED TASKS ==
{list of task IDs, subjects, and descriptions assigned to this worker}

== FILE OWNERSHIP ==
Files you OWN (may modify): {exclusive file patterns}
Files you must NOT modify: everything else
Shared files (coordinator only): {shared files list}
Boundary files: {boundary files with owner assignments}

== WORK PROTOCOL ==

1. CLAIM: Call TaskList to see your assigned tasks (owner = "{worker_name}").
   Pick the first task with status "pending" that is assigned to you and not blocked.
   Call TaskUpdate to set status "in_progress":
   TaskUpdate(taskId: "ID", status: "in_progress")

2. WORK: Execute the task using your tools (Read, Write, Edit, Bash).
   Do NOT spawn sub-agents. Do NOT delegate. Work directly.
   Only modify files within your ownership scope.

3. VERIFY: Before marking complete, verify your changes:
   - Build passes (if applicable)
   - Tests pass (if applicable)
   - No debug artifacts left behind (console.log, TODO, debugger)

4. COMPLETE: Mark the task completed:
   TaskUpdate(taskId: "ID", status: "completed")

5. REPORT: Notify the lead via SendMessage:
   SendMessage(recipient: "team-lead", content: "Completed task #ID: <summary>")

6. NEXT: Check TaskList for more assigned tasks. If more pending tasks exist, go to step 1.
   If no more tasks, notify the lead:
   SendMessage(recipient: "team-lead", content: "All assigned tasks complete. Standing by.")

7. PEER MESSAGING: You may send messages directly to other workers:
   SendMessage(recipient: "worker-2", content: "API types ready for import.")

8. SHUTDOWN: When you receive a shutdown message from the team lead:
   - Finish current atomic operation
   - Do NOT start new tasks
   - Report final status to team lead

== BLOCKED TASKS ==
If a task has blockedBy dependencies, skip it until those tasks are completed.
Check TaskList periodically to see if blockers have been resolved.
If blocked for >2 minutes, notify the lead.

== ERRORS ==
If you cannot complete a task, report failure:
SendMessage(recipient: "team-lead", content: "FAILED task #ID: <reason>")
Do NOT mark the task as completed. Leave it in_progress so the lead can reassign.

== RULES ==
- NEVER spawn sub-agents or use the Task tool
- NEVER modify files outside your ownership scope
- NEVER claim tasks not assigned to you
- ALWAYS use absolute file paths
- ALWAYS report progress via SendMessage to "team-lead"
- Stop after 3 consecutive failures and report to team lead
```

### MCP Worker Preamble

Include this preamble when spawning Codex or Gemini MCP workers:

```
You are an autonomous worker executing a team task.

== TASK ==
Subject: {task subject}
Description: {task description}
Acceptance Criteria: {acceptance criteria}

== FILE SCOPE ==
Files you may modify: {exclusive file patterns}
Files you must NOT modify: {everything else}

== INSTRUCTIONS ==
1. Read the relevant files to understand the current state
2. Implement the changes described in the task
3. Verify your changes compile/pass lint
4. Do NOT modify files outside your scope
5. Do NOT leave debug artifacts (console.log, TODO, debugger)

== CONTEXT ==
Project root: {working_directory}
Related files for reference (read-only): {context file paths}
```

**Key difference:** MCP workers are one-shot autonomous executors. They cannot use
TaskList, TaskUpdate, or SendMessage. The lead manages their lifecycle: spawn job,
poll status, read output, mark task complete.

## Phase 4: Monitoring

The lead monitors all workers through polling and inbound messages.

### 4.1 TaskList Polling

Poll every 30 seconds (configurable via `monitorIntervalMs`):

```
TaskList -> returns all tasks with status, owner, dependencies
Filter out internal tasks (metadata._internal: true)
Count: pending, in_progress, completed, failed
```

### 4.2 MCP Job Polling

For Codex and Gemini workers, poll job status every 25 seconds:

```
codex_status(jobId: "job-xyz") -> { status: "running"|"completed"|"failed", output: "..." }
gemini_status(jobId: "job-abc") -> { status: "running"|"completed"|"failed", output: "..." }
```

When an MCP job completes:
1. Read the output/result
2. Mark the corresponding team task as completed via TaskUpdate
3. If cascade is enabled, create the follow-up task

When an MCP job fails:
1. Increment the worker's `consecutiveErrors` counter
2. If under `maxConsecutiveErrors`: restart with exponential backoff
3. If at limit: quarantine worker, reassign task

### 4.3 Watchdog

Monitor for stuck or failed workers:

- **Warning** (`watchdogWarningMs`, default 5 minutes):
  If a task stays `in_progress` for 5+ minutes without any update:
  ```
  SendMessage(recipient: "worker-N", content: "STATUS CHECK: Report progress on task #ID.")
  ```

- **Auto-reassign** (`watchdogReassignMs`, default 10 minutes):
  If a task stays `in_progress` for 10+ minutes without any update:
  1. Mark worker as unresponsive
  2. Reassign task to next available worker via TaskUpdate
  3. Notify the new worker via SendMessage

- **Quarantine** (`maxConsecutiveErrors`, default 3):
  If a worker reports 3 consecutive failures:
  1. Stop assigning new tasks to this worker
  2. Set worker status to "quarantined" in state file
  3. Reassign remaining tasks to other workers

### 4.4 Worker Restart (Exponential Backoff)

If a worker dies (MCP job fails, Claude agent crashes):

| Restart | Wait | Action |
|---------|------|--------|
| 1st | 5 seconds | Respawn worker with same task assignment |
| 2nd | 10 seconds | Respawn worker with same task assignment |
| 3rd | 20 seconds | Respawn worker with same task assignment |
| 4th+ | N/A | Mark worker as permanently failed, reassign tasks |

### 4.5 Dynamic Work Redistribution

When a worker completes all assigned tasks (early finisher):

1. Check TaskList for unassigned pending tasks
2. If found: assign via `TaskUpdate(taskId, owner: "worker-N")`
3. Notify worker: `SendMessage(recipient: "worker-N", content: "New assignment: task #ID")`
4. Prefer workers whose routing matches the task (backend worker for backend tasks)
5. Prefer workers with fewer completed tasks (spread load evenly)
6. Never assign to quarantined workers

### 4.6 Cascade Mode

When `enableCascade: true` (default), task completion auto-creates follow-up tasks:

```
implement/create/build/fix -> auto-create test task (test-engineer, sonnet)
test task completes         -> auto-create review task (quality-reviewer, sonnet)
review task completes       -> terminal (no further cascade)
```

- Maximum cascade depth: 3 (configurable, prevents unbounded work)
- Cascade tasks are assigned to any idle worker matching the required agent type
- If no matching worker exists, a new worker is spawned (if under maxAgents)
- Disable per-task by including `[no-cascade]` in the task subject

### 4.7 Dependency Unblocking

When a blocking task completes:
1. Identify all tasks that had this task in their `blockedBy` list
2. Check if ALL their blockers are now resolved
3. If fully unblocked: notify the assigned worker via SendMessage:
   ```
   SendMessage(recipient: "worker-2", content: "UNBLOCKED: Task #2 is now ready. Blocker #1 completed.")
   ```

## Phase 5: Integration

After all tasks complete (or all remaining tasks are permanently failed), verify the
integrated result.

### 5.1 Cross-CLI Verification

If `enableCrossCliVerification: true` (default), route verification to an alternate model:

| Work done by | Verify with | Rationale |
|-------------|-------------|-----------|
| Claude workers | Codex | Independent model catches Claude blind spots |
| Codex workers | Gemini | Different model perspective |
| Gemini workers | Codex | Strongest code reviewer |
| Mixed workers | Least-used CLI | Maximizes diversity of verification |

If the target CLI is unavailable: skip verification (report as "skipped" in summary).

Verification prompt:
```
Review the following changes for correctness, completeness, and quality.

FILES CHANGED:
{list of all modified files with diffs}

ORIGINAL TASK:
{original user request}

SUBTASKS COMPLETED:
{list of completed task subjects with summaries}

Check for:
1. Correctness: Do the changes implement the requirements?
2. Completeness: Are any requirements missing?
3. Quality: Are there anti-patterns, missing error handling, or dead code?
4. Integration: Do the changes work together across file boundaries?
5. Debug artifacts: Any leftover console.log, TODO, HACK, debugger statements?

Report: PASS or FAIL with specific findings.
```

### 5.2 Build/Test/Lint Verification

Run the project's verification suite:

```bash
# Build check (detect command from package.json or project conventions)
npm run build   # or: tsc --noEmit, cargo build, go build, etc.

# Test suite
npm test        # or: pytest, cargo test, go test, etc.

# Lint check
npm run lint    # or: eslint, ruff, clippy, etc.
```

### 5.3 File Conflict Check

Verify no worker modified files outside their ownership scope:
1. Compare the list of actually-modified files against each worker's ownership list
2. If conflicts found: report them and have the coordinator resolve manually
3. Shared files should only have been modified by the coordinator

### 5.4 Shared File Updates

The coordinator (team lead) handles any necessary updates to shared files:
- package.json (new dependencies added by workers)
- Configuration files (new entries needed)
- Index/barrel files (new exports)

## Phase 6: Shutdown

Clean shutdown sequence after integration is verified.

### 6.1 Notify Workers

Send shutdown message to all active Claude workers:
```json
SendMessage({
  "recipient": "worker-1",
  "content": "SHUTDOWN: All work complete. Finish current operation and stop."
})
```

### 6.2 Cancel MCP Jobs

Cancel any still-running MCP jobs:
```
codex_cancel(jobId: "job-xyz")
gemini_cancel(jobId: "job-abc")
```

### 6.3 Wait for Drain

Wait up to `shutdownTimeoutMs` (default 15 seconds) for workers to finish their current
atomic operations and report final status.

### 6.4 Delete Team

```json
TeamDelete({ "team_name": "forge-team-1707580800" })
```

**IMPORTANT:** Call TeamDelete only AFTER all workers have been shut down. TeamDelete
will fail if active members (besides the lead) still exist.

### 6.5 Clean Up State

```bash
rm -f .forge/team-state.json
rm -f .forge/worker-*-failure.json
```

### 6.6 Generate Summary Report

Display the completion report (see Summary_Report section).

</Lifecycle>

<Worker_To_Worker_Communication>
**FORGE EXCLUSIVE** -- OMC only supports lead-to-worker messaging. Forge supports full
peer-to-peer messaging between workers.

## Protocol

Workers can send messages directly to other workers via SendMessage:

```json
SendMessage({
  "recipient": "worker-2",
  "content": "API types in src/types/api.ts are ready. You can import { UserProfile, AuthToken } from './types/api'."
})
```

## Use Cases

### Interface Handoff
Worker-1 finishes defining types that worker-2 needs:
```json
// worker-1 -> worker-2
SendMessage({
  "recipient": "worker-2",
  "content": "HANDOFF: Auth types defined in src/types/auth.ts. Exports: AuthToken, SessionData, UserCredentials. You can now import these for the API routes."
})
```

### Dependency Notification
Worker-1 finishes a blocking task that unblocks worker-3:
```json
// worker-1 -> worker-3
SendMessage({
  "recipient": "worker-3",
  "content": "UNBLOCKED: Database schema migration complete. Tables 'users' and 'sessions' now have the new columns. Proceed with your ORM model updates."
})
```

### Conflict Prevention
Worker-2 needs to temporarily touch a boundary file:
```json
// worker-2 -> worker-1
SendMessage({
  "recipient": "worker-1",
  "content": "BOUNDARY: I need to add an export to src/types/index.ts (your scope). Can you add 'export { ApiResponse } from ./api-response'? Or confirm I can touch it."
})
```

## Rules

- Workers should use targeted messages (never broadcast)
- Peer messages are informational -- they don't change task ownership or status
- The lead can see all peer messages via TaskList/monitoring
- If a peer message requires a file ownership exception, the lead must approve
</Worker_To_Worker_Communication>

<Smart_Auto_Routing>
**FORGE EXCLUSIVE** -- Automatic per-subtask routing to the best execution provider.
OMC requires manual routing; Forge does it automatically using existing libraries.

## Algorithm

For each subtask during decomposition:

```
Step 1: Classify task domain
  classifyTask(subtaskText)
    -> Count backend signals: api, server, database, script, docker, auth, middleware,
       redis, queue, worker, webhook, graphql, rest, grpc, lambda, serverless, terraform...
    -> Count frontend signals: component, ui, css, react, vue, design, layout,
       animation, accessibility, tailwind, svg, icon, font, color, storybook...
    -> Result: "backend" | "frontend" | "ambiguous"
  (Source: scripts/lib/routing.mjs)

Step 2: Score complexity
  analyzeComplexity(subtaskText)
    -> Lexical signals: architecture words (+3), debug words (+2), risk words (+2),
       refactor words (+2), why-questions (+2), long text (+1-2), code blocks (+1)
    -> Structural signals: subtask count (+3-4), cross-file deps (+2),
       test requirements (+1), system-wide impact (+3)
    -> Context signals: multi-domain (+2-3), irreversible operations (+1)
    -> Score -> tier: haiku (<4), sonnet (4-8), opus (>=8)
  (Source: scripts/lib/complexity.mjs)

Step 3: Check CLI availability
  ToolSearch("codex")  -> codexAvailable: true/false
  ToolSearch("gemini") -> geminiAvailable: true/false

Step 4: Route decision
  +------------+------------------+------------------------------------+
  | Domain     | CLI Available?   | Route                              |
  +------------+------------------+------------------------------------+
  | backend    | Codex: yes       | codex MCP (codex_exec)             |
  | backend    | Codex: no        | Claude executor agent              |
  | frontend   | Gemini: yes      | gemini MCP (gemini_exec)           |
  | frontend   | Gemini: no       | Claude designer agent              |
  | ambiguous  | either           | Claude executor agent              |
  +------------+------------------+------------------------------------+
  Model tier always comes from Step 2 (complexity scorer).
```

## Example Routing Output

```
Task: "Add user authentication with JWT"
  -> classifyTask: "backend" (auth, middleware signals)
  -> analyzeComplexity: score 7 -> "sonnet" (risk words +2, cross-file +2)
  -> Codex available: yes
  -> Route: codex MCP, model: sonnet

Task: "Create responsive profile page component"
  -> classifyTask: "frontend" (component, responsive, layout signals)
  -> analyzeComplexity: score 3 -> "haiku" (straightforward)
  -> Gemini available: yes
  -> Route: gemini MCP, model: haiku

Task: "Refactor auth module and update login UI"
  -> classifyTask: "ambiguous" (auth=backend, UI=frontend, tied)
  -> analyzeComplexity: score 6 -> "sonnet" (refactor +2, cross-file +2)
  -> Route: claude executor, model: sonnet
```
</Smart_Auto_Routing>

<Dynamic_Scaling>
**FORGE EXCLUSIVE** -- OMC uses fixed worker count. Forge dynamically redistributes
work when workers finish early.

## Early Finisher Protocol

When a worker completes all assigned tasks ahead of other workers:

1. Worker sends idle notification:
   ```
   SendMessage(recipient: "team-lead", content: "All assigned tasks complete. Standing by.")
   ```

2. Lead checks for unassigned pending tasks via TaskList

3. If unassigned tasks exist:
   a. Select the best-matching task (prefer tasks matching worker's routing/agent type)
   b. Assign via TaskUpdate: `TaskUpdate(taskId: "5", owner: "worker-1")`
   c. Notify worker: `SendMessage(recipient: "worker-1", content: "New assignment: task #5 - [description]")`

4. If no unassigned tasks but other workers are still busy:
   Worker remains on standby (may be needed if another worker fails)

5. If all tasks are complete: proceed to Phase 5 (Integration)

## Rebalancing Triggers

Dynamic rebalancing is triggered by:
- Worker completes all tasks (early finisher)
- Worker is quarantined (tasks redistributed to healthy workers)
- Worker crashes and cannot be restarted (tasks reassigned)
- Cascade creates new tasks (assigned to idle workers first)

## Load Balancing Heuristic

When choosing which idle worker gets a new task:

```
1. Filter: exclude quarantined workers
2. Prefer: worker whose routing matches task domain
   (backend task -> prefer codex-routed worker)
3. Prefer: worker with fewer completed tasks (spread load)
4. Prefer: worker with lower total execution time (faster worker)
5. Tiebreak: lower worker number (deterministic)
```
</Dynamic_Scaling>

<Cascade_Mode>
**FORGE EXCLUSIVE** -- Auto-create follow-up tasks when a task completes. OMC has no
cascade capability; Forge chains implement -> test -> review automatically.

## Rules

When `enableCascade: true` (default) and a task completes, the lead checks whether
a follow-up task should be auto-created:

| Completed Task Type | Follow-Up | Agent Type | Model |
|--------------------|-----------|------------|-------|
| implement / create / build / fix | Test task | test-engineer | sonnet |
| test | Review task | quality-reviewer | sonnet |
| review | Terminal | -- | -- |
| explore / debug / analyze | Terminal | -- | -- |

## Detection

Task type is inferred from the subject/description keywords:
- **implement type**: contains "implement", "create", "build", "fix", "add", "refactor"
- **test type**: contains "test", "spec", "coverage"
- **review type**: contains "review", "audit", "check"

## Cascade Chain Example

```
Task #1: "Implement user profile API" (executor, codex)
  -> completes
  -> auto-creates Task #4: "Write tests for user profile API" (test-engineer, sonnet)
     -> completes
     -> auto-creates Task #7: "Review user profile API and tests" (quality-reviewer, sonnet)
        -> completes
        -> terminal (no further cascade)
```

Cascade depth tracked in state: `cascadeDepth` increments per level. Maximum depth: 3.

## Disabling Cascade

- Globally: set `enableCascade: false` in config
- Per-task: include `[no-cascade]` in the task subject:
  ```
  TaskCreate({ "subject": "[no-cascade] Fix critical bug in auth" })
  ```
- Review tasks: never cascade (always terminal)
- Explore/debug tasks: never cascade (always terminal)

## Task Assignment

Cascade-created tasks are assigned to:
1. An idle worker whose agent type matches (if available)
2. Any idle worker (if no type match)
3. A newly spawned worker (if under maxAgents and no idle workers)
4. Queued as unassigned (if at maxAgents limit)
</Cascade_Mode>

<Cross_CLI_Verification>
**FORGE EXCLUSIVE** -- After all tasks complete, route verification to an alternate
model for independent review. OMC has no cross-CLI verification.

## Routing Table

| Primary CLI used | Verification CLI | Rationale |
|-----------------|-----------------|-----------|
| Claude (all workers) | Codex | Different model catches Claude-specific blind spots |
| Codex (all workers) | Gemini | Large context window for holistic review |
| Gemini (all workers) | Codex | Strongest analytical reviewer |
| Mixed workers | Least-used CLI | Maximize verification diversity |

If the target verification CLI is unavailable, skip and report "Cross-CLI: skipped (CLI unavailable)".

## Verification Prompt Template

```
You are performing cross-CLI verification for a team of {N} workers.

ORIGINAL TASK: {original user prompt}

COMPLETED SUBTASKS:
{for each completed task:}
  #{id}: {subject}
  Worker: {worker-name} ({agentType}/{routing})
  Summary: {completion summary}
  Files modified: {file list}

VERIFICATION CHECKLIST:
1. CORRECTNESS: Do all changes correctly implement the requirements?
2. COMPLETENESS: Are any requirements from the original task missing?
3. CONSISTENCY: Do changes across different workers integrate properly?
4. QUALITY: Any anti-patterns, missing error handling, dead code, or debug artifacts?
5. FILE CONFLICTS: Did any worker modify files outside their ownership scope?

OUTPUT FORMAT:
- PASS: All checks pass. Summary of what looks good.
- FAIL: List specific issues found, organized by check category.
```

## Execution

```
1. Collect all file diffs from completed tasks
2. Determine verification CLI from routing table
3. Call verification CLI:
   - codex_exec({ prompt: verificationPrompt, working_directory: projectRoot })
   - gemini_exec({ prompt: verificationPrompt, working_directory: projectRoot })
4. Read verification output
5. If PASS: proceed to shutdown
6. If FAIL: create fix tasks for reported issues, assign to available workers
```
</Cross_CLI_Verification>

<Summary_Report>
Generated at the end of Phase 6 (Shutdown). Displayed to the user.

## Format

```
TEAM COMPLETE
Team: {teamName} | Template: {template} | Duration: {totalTime}
Workers: {N} ({agentTypes}) | Tasks: {completed}/{total}
Build: {pass/fail} | Tests: {pass/fail} | Cross-CLI: {pass/fail/skipped}

Worker Performance:
  worker-1 ({agentType}/{routing}): {tasksCompleted} tasks, {duration}, {status}
  worker-2 ({agentType}/{routing}): {tasksCompleted} tasks, {duration}, {status}
  worker-3 ({agentType}/{routing}): {tasksCompleted} tasks, {duration}, {status}

Task Results:
  [DONE] #1: {subject} (worker-1, 45s)
  [DONE] #2: {subject} (worker-2, 1m30s)
  [DONE] #3: {subject} (worker-3, 2m15s)
  [DONE] #4: {subject} (worker-1, 55s) [cascade: test for #1]
  [FAIL] #5: {subject} (worker-2, error: {reason})

Cascade Summary:
  Created: 3 follow-up tasks | Completed: 2 | Failed: 1

Cross-CLI Verification:
  Verifier: Codex | Result: PASS
  Notes: "All changes correctly implement requirements. No integration issues found."
```

## Example Output

```
TEAM COMPLETE
Team: forge-team-1707580800 | Template: fullstack-team | Duration: 8m32s
Workers: 4 (architect, executor, designer, test-engineer) | Tasks: 7/7
Build: pass | Tests: pass | Cross-CLI: pass

Worker Performance:
  worker-1 (architect/claude): 1 task, 2m10s, completed
  worker-2 (executor/codex): 3 tasks, 4m45s, completed
  worker-3 (designer/gemini): 2 tasks, 3m20s, completed
  worker-4 (test-engineer/claude): 1 task, 1m55s, completed

Task Results:
  [DONE] #1: Design user profile API architecture (worker-1, 2m10s)
  [DONE] #2: Implement user profile API endpoints (worker-2, 2m30s)
  [DONE] #3: Create profile page components (worker-3, 3m20s)
  [DONE] #4: Write API integration tests (worker-4, 1m55s) [cascade: test for #2]
  [DONE] #5: Fix type imports across modules (worker-2, 1m15s) [reassigned from worker-1]
  [DONE] #6: Review profile API code quality (worker-2, 1m00s) [cascade: review for #4]
  [DONE] #7: Accessibility review of profile UI (worker-3, 45s) [cascade: review for #3]

Cascade Summary:
  Created: 3 follow-up tasks | Completed: 3 | Failed: 0

Cross-CLI Verification:
  Verifier: Codex | Result: PASS
  Notes: "All endpoints correctly implement REST conventions. UI components are accessible. Test coverage adequate."
```
</Summary_Report>

<MCP_Workers>
Codex and Gemini CLIs participate as team members through MCP tool calls. They are
one-shot autonomous executors -- not persistent teammates like Claude agents.

## How MCP Workers Operate

1. **Lead creates task** with routing decision (codex or gemini)
2. **Lead spawns MCP job**:
   ```
   codex_exec({ prompt: mcpWorkerPreamble, working_directory: projectRoot })
   // Returns: { jobId: "job-xyz" }
   ```
3. **Lead polls job status** every 25 seconds:
   ```
   codex_status({ jobId: "job-xyz" })
   // Returns: { status: "running"|"completed"|"failed", output: "..." }
   ```
4. **On completion**: Lead reads output, marks team task as completed via TaskUpdate
5. **On failure**: Lead increments error counter, decides retry vs reassign

## Key Differences from Claude Workers

| Aspect | Claude Worker | MCP Worker (Codex/Gemini) |
|--------|-------------|--------------------------|
| Persistence | Long-running agent in team | One-shot autonomous job |
| Team awareness | Full (TaskList, TaskUpdate, SendMessage) | None (lead manages lifecycle) |
| Communication | SendMessage to lead and peers | Output file only (lead reads) |
| Tool access | Full Claude Code tools | CLI filesystem access only |
| Monitoring | Self-reports via SendMessage | Lead polls via *_status |
| Restart | Lead respawns via Task tool | Lead respawns via *_exec |
| Cost | Claude API tokens | Codex/Gemini API tokens |

## When to Route to MCP

| Task Type | Best Route | Why |
|-----------|-----------|-----|
| Code review / security audit | Codex | Specialized reviewer, cheaper |
| Architecture analysis | Codex | Strong analytical reasoning |
| Well-scoped refactoring | Codex | Good at structured transforms |
| UI/frontend implementation | Gemini | 1M context, design expertise |
| Large-scale documentation | Gemini | Writing + large context |
| Build/test iteration loops | Claude | Needs Bash tool + iterative cycles |
| Tasks needing coordination | Claude | Needs SendMessage for updates |

## MCP Context Limits

- **Codex**: ~128K token context window
- **Gemini**: ~1M token context window

For large codebases, prefer Gemini for tasks requiring broad context. Use Codex for
focused tasks on specific files/modules.
</MCP_Workers>

<Communication_Patterns>
Examples of all supported communication patterns in a forge team.

## Worker to Lead (Task Completion)

```json
// worker-1 -> team-lead
SendMessage({
  "recipient": "team-lead",
  "content": "Completed task #1: Fixed 3 type errors in src/auth/login.ts and 2 in src/auth/session.ts. All files pass tsc --noEmit. Modified files: src/auth/login.ts, src/auth/session.ts, src/auth/types.ts."
})
```

## Lead to Worker (Reassignment)

```json
// team-lead -> worker-2
SendMessage({
  "recipient": "worker-2",
  "content": "NEW ASSIGNMENT: Task #5 is now assigned to you (was worker-1, quarantined). Subject: Fix type errors in src/utils/. Files: src/utils/**."
})
```

## Worker to Worker (Peer Messaging)

```json
// worker-1 -> worker-3
SendMessage({
  "recipient": "worker-3",
  "content": "HANDOFF: Auth middleware types are now exported from src/types/auth.ts. You can import { AuthMiddleware, TokenPayload } for your route handlers."
})
```

## Broadcast (Team-Wide Alert)

**Use sparingly** -- each broadcast sends a separate message to every worker.

```json
// team-lead -> all workers (sent individually)
SendMessage({
  "recipient": "worker-1",
  "content": "ALERT: Shared types in src/types/index.ts have changed. Re-read before continuing."
})
SendMessage({
  "recipient": "worker-2",
  "content": "ALERT: Shared types in src/types/index.ts have changed. Re-read before continuing."
})
SendMessage({
  "recipient": "worker-3",
  "content": "ALERT: Shared types in src/types/index.ts have changed. Re-read before continuing."
})
```

## Shutdown Protocol

**Lead sends:**
```json
SendMessage({
  "recipient": "worker-1",
  "content": "SHUTDOWN: All work complete. Finish current operation and stop."
})
```

**Worker receives and acknowledges:**
```json
// Worker finishes current atomic operation, then:
SendMessage({
  "recipient": "team-lead",
  "content": "SHUTDOWN ACK: worker-1 stopping. Final status: 3 tasks completed, 0 in progress."
})
// Worker terminates
```

## Status Check (Watchdog)

**Lead sends:**
```json
SendMessage({
  "recipient": "worker-2",
  "content": "STATUS CHECK: Task #3 has been in_progress for 6 minutes. Report your current progress."
})
```

**Worker responds:**
```json
SendMessage({
  "recipient": "team-lead",
  "content": "STATUS: Task #3 at ~70%. Fixing complex type inference issue in src/api/handlers.ts. ETA: 2 more minutes."
})
```
</Communication_Patterns>

<Error_Handling>

## Worker Fails a Task

1. Worker sends failure report to lead:
   ```
   SendMessage(recipient: "team-lead", content: "FAILED task #3: Cannot resolve circular dependency between auth.ts and session.ts. Error: TS2456.")
   ```
2. Lead increments worker's `consecutiveErrors` counter in state
3. Lead decides:
   - **Retry**: reassign same task to same worker with additional guidance
   - **Reassign**: assign task to a different worker via TaskUpdate
   - **Skip**: mark task as permanently failed, continue with remaining tasks
4. If reassigning: `TaskUpdate(taskId: "3", owner: "worker-2")` + notify worker-2

## Worker Gets Stuck (No Messages)

1. Watchdog detects: task in_progress for >5 minutes with no SendMessage or TaskUpdate
2. Lead sends status check: `SendMessage(recipient: "worker-N", content: "STATUS CHECK...")`
3. If no response within 2 minutes:
   - Consider worker dead
   - Reassign task to another available worker
   - If Claude worker: it may have crashed (check internal task status)
   - If MCP worker: check `*_status(jobId)` for failure

## Dependency Blocked

1. Blocking task fails -> all dependent tasks are stuck
2. Lead decides:
   - **Retry the blocker**: reassign to same or different worker
   - **Remove dependency**: `TaskUpdate(taskId: "3", removeBlockedBy: ["1"])` to unblock
   - **Skip cascade**: mark blocked tasks as skipped, continue with independent tasks
3. Communicate decisions to affected workers via SendMessage

## Worker Crashes

For Claude workers:
1. Internal task for that worker shows unexpected status
2. Worker disappears from team config members
3. Lead reassigns orphaned tasks: `TaskUpdate(taskId, owner: "worker-replacement")`
4. If under maxAgents: spawn replacement worker with same task assignment
5. If at maxAgents: assign to existing idle worker

For MCP workers:
1. `*_status(jobId)` returns "failed" or times out
2. Lead follows worker restart protocol (exponential backoff)
3. After 3 failed restarts: fall back to Claude worker for that task

## MCP Job Fails

1. `codex_status(jobId)` or `gemini_status(jobId)` returns `status: "failed"`
2. Read error output from the job
3. Increment `consecutiveErrors` for that worker
4. If retriable error (timeout, rate limit): restart with backoff
5. If permanent error (invalid task, context too large): reassign to Claude worker
6. If Codex context limit exceeded: try Gemini (1M context) or split task

</Error_Handling>

<State_Format>
Full schema for `.forge/team-state.json`. Written in Phase 2, updated throughout
execution, deleted in Phase 6.

```json
{
  "teamName": "forge-team-1707580800",
  "status": "active",
  "createdAt": "2026-02-10T12:00:00Z",
  "template": "custom",
  "prompt": "fix all TypeScript errors across the project",
  "phase": "executing",
  "workers": [
    {
      "id": "worker-1",
      "taskIds": ["1", "4"],
      "agentType": "executor",
      "model": "sonnet",
      "routing": "codex",
      "mcpJobId": "job-xyz-123",
      "exclusiveFiles": ["src/auth/**"],
      "status": "active",
      "consecutiveErrors": 0,
      "restartCount": 0,
      "lastActivity": "2026-02-10T12:05:30Z",
      "completedTasks": 1,
      "totalAssigned": 2,
      "spawnedAt": "2026-02-10T12:01:00Z"
    },
    {
      "id": "worker-2",
      "taskIds": ["2"],
      "agentType": "executor",
      "model": "sonnet",
      "routing": "claude",
      "mcpJobId": null,
      "exclusiveFiles": ["src/api/**"],
      "status": "active",
      "consecutiveErrors": 0,
      "restartCount": 0,
      "lastActivity": "2026-02-10T12:04:15Z",
      "completedTasks": 0,
      "totalAssigned": 1,
      "spawnedAt": "2026-02-10T12:01:00Z"
    },
    {
      "id": "worker-3",
      "taskIds": ["3"],
      "agentType": "designer",
      "model": "sonnet",
      "routing": "gemini",
      "mcpJobId": "job-abc-456",
      "exclusiveFiles": ["src/components/**"],
      "status": "idle",
      "consecutiveErrors": 0,
      "restartCount": 0,
      "lastActivity": "2026-02-10T12:03:45Z",
      "completedTasks": 1,
      "totalAssigned": 1,
      "spawnedAt": "2026-02-10T12:01:00Z"
    }
  ],
  "sharedFiles": ["package.json", "tsconfig.json"],
  "boundaryFiles": ["src/types/api.ts"],
  "cascadeEnabled": true,
  "cascadeDepth": 1,
  "completedTasks": 3,
  "totalTasks": 5,
  "failedTasks": 0,
  "crossCliVerification": {
    "enabled": true,
    "verifier": null,
    "result": null
  }
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `teamName` | string | Claude Code team name (forge-team-{timestamp}) |
| `status` | enum | `"active"` / `"completing"` / `"shutdown"` / `"failed"` |
| `createdAt` | ISO string | When the team was created |
| `template` | string | `"custom"` or template name (build-team, etc.) |
| `prompt` | string | Original user request |
| `phase` | enum | `"decomposition"` / `"setup"` / `"executing"` / `"integration"` / `"shutdown"` / `"complete"` |
| `workers[].id` | string | Worker identifier (worker-1, worker-2, ...) |
| `workers[].taskIds` | string[] | Task IDs assigned to this worker |
| `workers[].agentType` | string | Agent type (executor, designer, etc.) |
| `workers[].model` | string | Model tier (haiku, sonnet, opus) |
| `workers[].routing` | enum | `"codex"` / `"gemini"` / `"claude"` |
| `workers[].mcpJobId` | string/null | MCP job ID for codex/gemini workers (null for claude) |
| `workers[].exclusiveFiles` | string[] | Glob patterns this worker owns exclusively |
| `workers[].status` | enum | `"active"` / `"idle"` / `"quarantined"` / `"stopped"` |
| `workers[].consecutiveErrors` | number | Consecutive failures (quarantine at maxConsecutiveErrors) |
| `workers[].restartCount` | number | Times this worker has been restarted (max 3) |
| `workers[].lastActivity` | ISO string | Last TaskUpdate or SendMessage timestamp |
| `workers[].completedTasks` | number | Number of tasks this worker completed |
| `workers[].totalAssigned` | number | Total tasks assigned (including reassignments) |
| `workers[].spawnedAt` | ISO string | When this worker was first spawned |
| `sharedFiles` | string[] | Files reserved for coordinator only |
| `boundaryFiles` | string[] | Interface files between worker scopes |
| `cascadeEnabled` | boolean | Whether cascade mode is active |
| `cascadeDepth` | number | Current cascade depth (max 3) |
| `completedTasks` | number | Total completed tasks across all workers |
| `totalTasks` | number | Total tasks created (including cascade) |
| `failedTasks` | number | Total permanently failed tasks |
| `crossCliVerification` | object | Verification tracking |
| `crossCliVerification.enabled` | boolean | Whether cross-CLI verification is configured |
| `crossCliVerification.verifier` | string/null | Which CLI performed verification |
| `crossCliVerification.result` | string/null | `"pass"` / `"fail"` / `"skipped"` / null |
</State_Format>

<Comparison_With_OMC>
Forge's team system improves on OMC in 12 specific areas.

| # | Capability | OMC | Forge |
|---|-----------|-----|-------|
| 1 | Worker-to-worker messaging | Lead-to-worker only | Full peer-to-peer messaging between all workers |
| 2 | Task routing | Manual (user specifies) | Automatic via routing.mjs + complexity.mjs |
| 3 | Dynamic scaling | Fixed N workers | Early finishers dynamically reassigned to remaining tasks |
| 4 | Team templates | None (always custom) | 5 pre-built templates (build, review, fullstack, audit, debug) |
| 5 | Cascade mode | None | Auto-create follow-ups: implement -> test -> review (max depth 3) |
| 6 | Cross-CLI verification | None | Alternate model reviews all work post-completion |
| 7 | Watchdog action | Detection + warning only | Detection + warning + auto-reassign at 10 minutes |
| 8 | Worker restart | Restart with backoff | Same (matched capability) + fall back to alternate CLI |
| 9 | Complexity scoring | None (manual model selection) | Automatic via lexical/structural/context signal analysis |
| 10 | Resume detection | Checks state file | Same (matched) + validates team still exists via TaskList |
| 11 | Build step required | Yes (TypeScript compilation) | None (pure .md skill files + .mjs scripts) |
| 12 | Total implementation | ~2700 lines across 25 TS modules + 709-line SKILL.md | ~950-line SKILL.md + ~30 lines JS (routing + complexity) |

### Feature Comparison Details

**Routing:** OMC requires the user to manually decide which workers use which CLI. Forge
automatically classifies each subtask as backend/frontend/ambiguous using word-boundary
regex matching against 60+ signal words, then routes to the appropriate CLI. No user
input needed.

**Cascade:** OMC has no concept of follow-up tasks. When a worker finishes implementing
code, the user must manually request tests and reviews. Forge auto-creates test tasks
when implementation completes, and review tasks when tests complete, up to 3 levels deep.

**Cross-CLI Verification:** OMC relies on a single model for all work and verification.
Forge routes the final verification pass to a different model entirely, catching blind
spots that the primary model might miss.

**Dynamic Scaling:** OMC assigns tasks at spawn time and never rebalances. If worker-1
finishes in 30 seconds but worker-2 takes 5 minutes, worker-1 sits idle. Forge
redistributes pending tasks to early finishers automatically.
</Comparison_With_OMC>

<Cancellation>
The `/claude-forge:cancel` skill handles team cleanup. Team state is detected via
`.forge/team-state.json`.

## Detection

Cancel skill checks `.forge/team-state.json`:
- If `status` is `"active"` or `"completing"`: active team found, proceed with cleanup
- If file doesn't exist: no active team

## Cleanup Sequence

1. **Read state** to get `teamName` and list of active workers
2. **Send shutdown** to all active Claude workers:
   ```
   SendMessage(recipient: "worker-N", content: "SHUTDOWN: Team cancelled by user.")
   ```
3. **Cancel MCP jobs** for all Codex/Gemini workers:
   ```
   codex_cancel(jobId: "job-xyz")
   gemini_cancel(jobId: "job-abc")
   ```
4. **Wait** up to `shutdownTimeoutMs` (15 seconds) for workers to drain
5. **Delete team**: `TeamDelete(team_name: teamName)`
6. **Clean state files**:
   ```bash
   rm -f .forge/team-state.json
   rm -f .forge/worker-*-failure.json
   ```
7. **Report**: "Team {teamName} cancelled. {N} workers stopped. {completed}/{total} tasks were completed before cancellation."

## Force Cancel

With `--force` flag, skip the graceful shutdown and drain:
1. Cancel all MCP jobs immediately
2. TeamDelete (may fail if workers are still active -- retry after 5s)
3. Delete all state files
4. Report: "Team {teamName} force-cancelled."

## Partial Progress

Cancelled teams do not preserve progress for resume. If the user wants to retry,
they must invoke the team skill again from scratch. Task results from completed
subtasks remain in the codebase (file changes are not reverted).
</Cancellation>

<Gotchas>

### 1. Task Claiming Race Condition
There is no atomic claiming mechanism in Claude Code's TaskUpdate. Two workers could
theoretically race to claim the same task. **Mitigation:** The lead pre-assigns ALL
task owners before spawning any workers. Workers only work on tasks assigned to them.

### 2. MCP Workers Are One-Shot
Codex and Gemini CLIs run as autonomous one-shot jobs. They cannot use TaskList,
TaskUpdate, or SendMessage. They have no awareness of being in a team. The lead must
manage their entire lifecycle: spawn, poll status, read output, mark task complete.

### 3. SendMessage Is Fire-and-Forget
Messages are delivered asynchronously. There is no delivery confirmation or read receipt.
For ordering guarantees, use task dependencies (`blockedBy`) instead of relying on
message delivery order.

### 4. TeamDelete Kills Everything
Calling TeamDelete removes all team state, tasks, and member records. Always drain
workers first (send shutdown, wait for acknowledgment). Calling TeamDelete with active
workers will fail or leave orphaned processes.

### 5. File Ownership Is Honor System
Workers are instructed not to modify files outside their scope, but there is no
technical enforcement. The only safeguard is the preamble instructions and post-completion
conflict checking in Phase 5. Workers can technically write to any file.

### 6. Cascade Can Create Unbounded Work
Without the depth limit, cascade would create infinite follow-ups (implement -> test ->
review -> ... forever). The maximum depth of 3 prevents this. Additionally, review and
explore/debug tasks are always terminal (never cascade).

### 7. MCP Context Limits
Codex has ~128K token context. Gemini has ~1M token context. If a task requires reading
many large files, Codex may fail with context overflow. For large-context tasks, prefer
Gemini or split the task into smaller units.

### 8. Background Task Limit
Claude Code allows a maximum of 4-5 concurrent background tasks. If you spawn 5 workers
plus the lead's monitoring, you may hit limits. The `maxAgents: 5` config respects this
constraint, but be aware of other background tasks competing for slots.

### 9. State File Corruption
If the lead crashes mid-write to `.forge/team-state.json`, the state file may be
corrupted (partial JSON). The resume detection in Phase 0 should handle this gracefully:
if JSON parsing fails, delete the corrupt state file and start fresh.

### 10. Team Name Collisions
Team names are timestamp-based (`forge-team-{unix-seconds}`). If two teams are created
in the same second (unlikely but possible), they will collide. The TeamCreate call will
fail in this case. Retry with a new timestamp.

### 11. CLI Availability Changes Mid-Session
A CLI that was available during decomposition may become unavailable during execution
(rate limits, server issues). If an MCP job fails due to CLI unavailability, the lead
should fall back to spawning a Claude agent worker for that task instead of retrying
the MCP route.

### 12. Agent Type Mismatch
Not all agent types can perform all task types. Assigning a `style-reviewer` agent to
an implementation task will produce poor results. Template definitions enforce correct
agent-task mappings, but custom invocations (`N:agent-type`) rely on the user choosing
appropriately. The lead should validate that the agent type is implementation-capable
for implementation tasks and review-capable for review tasks.

</Gotchas>
