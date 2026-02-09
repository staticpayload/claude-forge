---
name: cancel
description: Cancel any active forge mode — intelligent detection and cleanup
---

<Purpose>
Detect which execution mode is active and cleanly shut it down. Preserves progress
for resumable modes (autopilot). Handles dependency-aware cleanup order.
</Purpose>

<Use_When>
- User says "cancel", "stop", "abort"
- Need to stop an active autopilot, ralph, ultrawork, or other mode
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

8. **Team** — Active team tasks
   → Graceful shutdown of all workers
   → Wait for in-progress tasks to checkpoint

</Detection_Order>

<Steps>
1. Check all state files listed above
2. For each active mode found:
   - Report: "Cancelling [mode] at [phase/iteration]"
   - Clean up dependent modes first
   - Delete state file (or mark inactive for resumable modes)
3. Report what was cancelled and how to resume (if applicable)

### Force Mode (`--force` / `--all`)
Delete ALL state files regardless of what's active:
```bash
rm -f .forge/*-state.json
```
Report: "All forge state cleared."
</Steps>

<Preservation>
| Mode | Progress Preserved | Resume Command |
|------|-------------------|----------------|
| Autopilot | Yes (phase, spec, plan) | `/claude-forge:autopilot` |
| Ralph | No | N/A |
| All Others | No | N/A |
</Preservation>

<Exit_Message>
Report:
- Which mode was cancelled
- What phase/iteration it was in
- What dependent modes were also cleaned up
- How to resume (if applicable)
</Exit_Message>
