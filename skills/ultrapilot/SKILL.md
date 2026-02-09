---
name: ultrapilot
description: Parallel autopilot — decompose task, partition file ownership, run up to 5 workers
---

<Purpose>
Like autopilot but parallel. Decomposes the task into independent chunks,
assigns exclusive file ownership to each worker, and runs up to 5 workers
simultaneously. 3-5x faster than sequential autopilot for parallelizable tasks.
</Purpose>

<Use_When>
- User says "ultrapilot", "parallel build", "fast autopilot"
- Task can be split into 2-5 independent components
- Components have non-overlapping file ownership
</Use_When>

<Lifecycle>

## Phase 1: Analysis
1. Analyze task for parallelizability using task decomposer
2. If NOT parallelizable (e.g., single bug fix) → fall back to regular autopilot
3. Identify 2-5 independent components
4. Estimate complexity per component

## Phase 2: Decomposition (Architect-Driven)
1. Consult architect agent for decomposition review
2. Assign file ownership per component:
   - **Exclusive files:** Only this worker modifies them
   - **Shared files:** Coordinator handles (package.json, configs)
   - **Boundary files:** Interfaces between components (careful coordination)
3. Create worker specifications
4. Save ownership map: `.forge/ultrapilot-ownership.json`

## Phase 3: Parallel Execution
1. Launch up to 5 worker agents simultaneously
2. Each worker gets:
   - Component spec with acceptance criteria
   - Exclusive file list (ONLY modify these)
   - Read-only access to everything else
   - CLI routing (backend → Codex, frontend → Gemini)
3. Monitor progress, detect stale workers

## Phase 4: Integration
1. After all workers complete, handle shared files
2. Resolve any boundary file conflicts
3. Run full build to check integration
4. Fix integration issues (coordinator does this)

## Phase 5: Validation
1. Run full test suite
2. Build/lint/typecheck verification
3. Architecture review by architect agent
4. Up to 3 retry rounds for failures
5. Report results

</Lifecycle>

<Fallback>
If task is NOT parallelizable:
- Single component → use regular autopilot
- Too many shared files → use regular autopilot
- High coupling between components → use regular autopilot
</Fallback>

<Ownership_Format>
```json
{
  "workers": [
    {
      "id": "worker-1",
      "component": "Frontend UI",
      "exclusiveFiles": ["src/components/**", "src/pages/**"],
      "agent": "designer",
      "model": "sonnet",
      "status": "pending"
    }
  ],
  "sharedFiles": ["package.json", "tsconfig.json"],
  "boundaryFiles": ["src/types/api.ts"]
}
```
</Ownership_Format>
