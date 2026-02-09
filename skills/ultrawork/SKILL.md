---
name: ultrawork
description: Maximum parallelism mode — launch agents simultaneously, never wait
---

<Purpose>
Ultrawork is the parallel execution engine. Every independent task runs simultaneously.
No sequential waiting. No one-at-a-time. Maximum throughput. This is a composable
component — ralph and autopilot layer on top of it.
</Purpose>

<Use_When>
- User says "ultrawork", "ulw", "uw", "maximum performance", "parallel"
- Task has multiple independent subtasks
- Speed is critical
</Use_When>

<Execution_Rules>

## Core Principles
1. **Parallel everything.** If two tasks don't depend on each other, run them simultaneously.
2. **Background execution.** Any task taking >30 seconds gets `run_in_background: true`.
3. **No sequential waiting.** NEVER wait for agent A to finish before starting agent B (unless B depends on A's output).
4. **Smart model routing.** Match agent complexity to task:
   - LOW (haiku): File discovery, simple lookups, formatting
   - MEDIUM (sonnet): Standard implementation, debugging, reviews
   - HIGH (opus): Architecture, complex refactors, security analysis

## Agent Spawning
```
For each independent subtask:
  1. Classify: backend → Codex MCP (or executor agent)
                frontend → Gemini MCP (or designer agent)
                analysis → architect/debugger agent
                testing → test-engineer agent
  2. Select model tier based on complexity
  3. Launch with Task tool (run_in_background: true if slow)
  4. Don't wait — launch next agent immediately
```

## Delegation Routing
- Backend tasks (API, database, scripts, infra) → Codex CLI if available
- Frontend tasks (UI, CSS, components, layouts) → Gemini CLI if available
- If CLI unavailable → built-in Claude agents (executor, designer, etc.)
- Analysis tasks → always use Claude agents (they need tool access)

## Verification (Lightweight)
After all agents complete:
1. Build check (compile/typecheck)
2. Test suite (run existing tests)
3. No new errors introduced
4. That's it — no extensive review (ralph/autopilot add that layer)

</Execution_Rules>

<Composition>
Ultrawork is a building block:
- **Standalone:** Just parallel execution + lightweight verification
- **Inside Ralph:** Ralph adds persistence loop + architect review
- **Inside Autopilot:** Autopilot adds phases (expansion, planning, QA, validation)
- **With Ecomode:** Ecomode modifies model routing (prefer cheaper models first)
</Composition>

<Anti_Patterns>
- NEVER run agents one at a time when they're independent
- NEVER use opus for simple file reads (use haiku)
- NEVER skip verification entirely
- NEVER produce placeholder/mock code
- NEVER reduce scope to finish faster
</Anti_Patterns>
