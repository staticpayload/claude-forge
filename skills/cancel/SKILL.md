---
name: cancel
description: Cancel any active forge mode — intelligent detection and cleanup
---

<Purpose>
Detect which execution mode is active and cleanly shut it down. Preserves progress
for resumable modes (autopilot). Handles dependency-aware cleanup order.
Supports team-specific graceful shutdown with SendMessage drain and MCP job cancellation.
</Purpose>

<Use_When>
- User says "cancel", "stop", "abort"
- Need to stop an active autopilot, ralph, ultrawork, team, swarm, or other mode
- Force cleanup with `--force` or `--all`
</Use_When>

<Detection_Order>
Check for active modes in dependency order (cancel parents before children):

1. **Autopilot** — `.forge/autopilot-state.json`
   → Saves progress (phase, spec, plan) for resume
   → Also cleans ralph + ultraqa if they were sub-modes

2. **Ralph** — `.forge/ralph-state.json`
   → Stops persistence loop
   → Cleans linked ultrawork if applicable

3. **Ultrapilot** — `.forge/ultrapilot-state.json`
   → Stops all workers
   → Cleans ownership map

4. **Ultrawork** — `.forge/ultrawork-state.json`
   → Stops parallel execution

5. **Ultraqa** — `.forge/ultraqa-state.json`
   → Stops QA cycling

6. **Ecomode** — `.forge/ecomode-state.json`
   → Resets model routing to defaults

7. **Pipeline** — `.forge/pipeline-state.json`
   → Stops sequential chain

8. **Team** — `.forge/team-state.json`
   → Graceful shutdown protocol (see Team Cleanup below)
   → SendMessage drain to all workers
   → Cancel MCP jobs (Codex/Gemini)
   → TeamDelete to remove team
   → Delete state file and failure sidecars

9. **Swarm** — Active swarm tasks in TaskList
   → Cancel any running MCP jobs (codex_cancel / gemini_cancel)
   → Mark remaining in-progress tasks as completed
   → No state file to clean (swarm is stateless)

</Detection_Order>

<Steps>
1. Check all state files listed above
2. For each active mode found:
   - Report: "Cancelling [mode] at [phase/iteration]"
   - Clean up dependent modes first
   - Delete state file (or mark inactive for resumable modes)
3. Report what was cancelled and how to resume (if applicable)

### Team Cleanup

If `.forge/team-state.json` exists:

1. Read `teamName` and `workers` array from state file
2. Send shutdown to all active Claude workers:
   ```
   SendMessage(recipient: "worker-N", content: "SHUTDOWN: Cancellation requested. Finish current atomic operation and stop.")
   ```
   Repeat for each worker with `status: "active"`.
3. Cancel MCP jobs for Codex/Gemini workers:
   ```
   For each worker with routing == "codex" and mcpJobId:
     codex_cancel(jobId: worker.mcpJobId)
   For each worker with routing == "gemini" and mcpJobId:
     gemini_cancel(jobId: worker.mcpJobId)
   ```
   Use ToolSearch to discover MCP tools if not already loaded.
4. Wait up to 15 seconds for workers to stop (check TaskList for remaining in_progress tasks)
5. Call TeamDelete:
   ```
   TeamDelete(name: teamName)
   ```
6. Delete state files:
   ```
   rm .forge/team-state.json
   rm .forge/worker-*-failure.json
   ```
7. Report: "Team {name} cancelled. {N} workers stopped, {M} tasks were incomplete."

If TeamDelete fails (workers still active), wait 5 seconds and retry once.
If it still fails, inform the user to manually clean up `~/.claude/teams/{teamName}/`.

### Swarm Cleanup

Swarm has no state file. To detect active swarms:

1. Check TaskList for tasks with subjects starting with "Swarm:"
2. For any still in_progress:
   - Cancel associated MCP jobs if any (check task description for job IDs)
   - Mark tasks as completed via TaskUpdate
3. Report: "Swarm tasks cancelled. {N} tasks were still running."

### Force Mode (`--force` / `--all`)
Delete ALL state files regardless of what's active:
```bash
rm -f .forge/*-state.json .forge/worker-*-failure.json
```
If a team is active, attempt TeamDelete (best-effort, don't block on failure).
Report: "All forge state cleared."
</Steps>

<Preservation>
| Mode | Progress Preserved | Resume Command |
|------|-------------------|----------------|
| Autopilot | Yes (phase, spec, plan) | `/claude-forge:autopilot` |
| Team | No (must restart) | N/A |
| Swarm | No (stateless) | N/A |
| Ralph | No | N/A |
| All Others | No | N/A |
</Preservation>

<Exit_Message>
Report:
- Which mode was cancelled
- What phase/iteration it was in
- What dependent modes were also cleaned up
- For teams: how many workers stopped, how many tasks were incomplete
- For swarms: how many tasks were still running
- How to resume (if applicable)
</Exit_Message>
