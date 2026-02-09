---
name: team
description: N coordinated agents on shared task list using Claude Code native teams
---

<Purpose>
Spawn a coordinated team of agents that work on a shared task list. Each agent
claims tasks, executes them, and marks them complete. File ownership prevents
conflicts. Use for large tasks that benefit from 2-5 parallel workers.
</Purpose>

<Use_When>
- User says "team", "coordinated team", "spawn agents"
- Task is large enough to benefit from 2-5 parallel workers
- Work can be decomposed into independent units with clear file ownership
</Use_When>

<Lifecycle>

## 1. Decompose
Analyze the task and break it into independent subtasks:
- Use the task decomposer to identify components
- Assign non-overlapping file ownership per subtask
- Identify shared files (package.json, configs) — only ONE agent touches these
- Create dependency graph (which tasks block which)

## 2. Create Tasks
Use TaskCreate for each subtask:
- Clear description with acceptance criteria
- File ownership list (what this agent can modify)
- Dependencies (blockedBy other task IDs)
- Suggested model tier (haiku/sonnet/opus)

## 3. Spawn Workers
Launch 2-5 agents using Task tool:
- Each agent gets a preamble with:
  - Their assigned task(s)
  - File ownership boundaries (DO NOT modify files outside your scope)
  - How to claim tasks (TaskUpdate to in_progress)
  - How to mark done (TaskUpdate to completed)
  - Communication protocol (use SendMessage for cross-agent coordination)
- Route backend workers to Codex, frontend to Gemini if available
- Fall back to built-in executor/designer agents

## 4. Monitor
While tasks remain:
- Check TaskList periodically
- Detect stale agents (>5 min no progress)
- Resolve file conflicts if any arise
- Unblock stuck agents with guidance

## 5. Integrate
After all tasks complete:
- Verify no file conflicts
- Run build/test to check integration
- Fix any integration issues

## 6. Shutdown
- Verify all tasks completed
- Clean up state files
- Report summary

</Lifecycle>

<Worker_Preamble>
```
You are a team worker in claude-forge. Your assignment:

TASK: [task description]
FILES YOU OWN: [file patterns]
FILES YOU MUST NOT MODIFY: [everything else]

Protocol:
1. Claim your task: TaskUpdate(taskId, status: "in_progress")
2. Do the work — only modify files in your ownership scope
3. Mark complete: TaskUpdate(taskId, status: "completed")
4. If blocked, send message to coordinator

DO NOT modify files outside your ownership scope.
DO NOT create new files outside your scope without coordinator approval.
```
</Worker_Preamble>

<File_Ownership_Rules>
- Each file pattern belongs to exactly ONE worker
- Shared files (package.json, tsconfig.json, .env) → coordinator only
- If two workers need the same file → one does it, other waits
- Workers can READ any file but only WRITE to their owned files
</File_Ownership_Rules>
