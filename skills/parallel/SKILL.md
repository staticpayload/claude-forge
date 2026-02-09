---
name: parallel
description: Decompose tasks for parallel delegation to multiple CLIs/agents
---

<Purpose>
Intelligent task decomposer that splits complex work into parallelizable
subtasks with file ownership assignment. Each subtask gets delegated to the
optimal CLI (Codex/Gemini) or built-in agent, running in parallel without
merge conflicts. Combines Boris's parallelism tip with OMC's task decomposition.
</Purpose>

<Use_When>
- User says "parallel", "do all of this", "split this up"
- Task touches 3+ files or has clearly separable concerns
- User wants maximum throughput on a large task
</Use_When>

<Steps>
1. **Analyze the task**:
   - Break it into independent subtasks
   - Identify which files each subtask will touch
   - Ensure no two subtasks modify the same file (file ownership)
   - Determine dependencies between subtasks (ordering)

2. **Classify each subtask**:
   Use signal word analysis to route each subtask:
   - Backend work (API, database, server) -> Codex CLI
   - Frontend work (UI, CSS, components) -> Gemini CLI
   - Mixed or simple -> Built-in agents
   - If CLI unavailable -> fallback to agent skills

3. **Present the decomposition plan**:
   Show the user:
   ```
   Subtask 1: [backend] Create API endpoint for /users
     Files: src/api/users.ts, src/api/routes.ts
     Delegate to: Codex CLI

   Subtask 2: [frontend] Build user list component
     Files: src/components/UserList.tsx, src/components/UserList.css
     Delegate to: Gemini CLI

   Subtask 3: [backend] Add database migration
     Files: migrations/003_users.sql
     Delegate to: Codex CLI (after Subtask 1)
   ```

4. **Execute in parallel** (after user approval):
   - Launch independent subtasks simultaneously using ToolSearch + MCP tools
   - Chain dependent subtasks sequentially
   - Poll all running jobs until complete

5. **Merge and verify**:
   - Check all subtasks completed successfully
   - Run tests to verify integration
   - Report results with per-subtask status

6. **Handle conflicts**:
   - If two subtasks accidentally modify the same file, flag it
   - Suggest resolution strategy
   - Re-run the conflicting subtask with updated context
</Steps>

<Decomposition_Rules>
- Maximum 5 parallel subtasks (avoid overwhelming the system)
- Each subtask must have exclusive file ownership
- Shared files (config, types, schemas) should be modified by at most one subtask
- Test files can be created in parallel if they test different modules
- Database migrations must run sequentially
</Decomposition_Rules>
