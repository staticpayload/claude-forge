---
name: ralph
description: Self-referential persistence loop — don't stop until done, with architect verification
---

<Purpose>
Ralph is a persistence wrapper. It loops until the task is DONE and VERIFIED.
Every iteration: work → verify → if not done, keep going. Ralph includes
ultrawork (parallel execution) automatically. Named after Sisyphus — the boulder
never stops rolling.
</Purpose>

<Use_When>
- User says "ralph", "don't stop", "must complete", "keep going until done"
- Task is complex and might require multiple iterations
- You need guaranteed completion with verification
</Use_When>

<Loop_Template>

## Iteration N

### 1. Work Phase
Execute the task using maximum parallelism (ultrawork rules apply):
- Launch parallel agents for independent subtasks
- Route backend to Codex, frontend to Gemini (if available)
- Fall back to built-in agents (executor, designer, etc.)
- Every agent produces REAL code — no placeholders

### 2. Verify Phase
After work completes, run fresh verification:
- Build/compile check
- Test suite execution
- Lint/type check
- Manual review of changed files

**CRITICAL:** Verification must be FRESH every iteration.
Never reuse verification from a previous iteration.
Never say "should work" — show actual output.

### 3. Architect Review
Consult architect agent to evaluate:
- Does the implementation match the requirements?
- Are there architectural issues?
- Is the code production-quality?

**Review tiers:**
- STANDARD (< 5 files changed): Quick review, focus on correctness
- THOROUGH (5-20 files): Deep review, check patterns and consistency
- COMPREHENSIVE (20+ files): Full architecture review

### 4. Decision
- **DONE:** All tests pass, architect approves, requirements met → Exit loop
- **NOT DONE:** Issues found → Fix them in next iteration
- **BLOCKED:** Same issue persists after 3 iterations → Report to user

</Loop_Template>

<Rules>
1. **The boulder never stops.** Do not stop until verification passes.
2. **Fresh verification every iteration.** Re-run tests, don't assume.
3. **No scope reduction.** Don't simplify the task to make it "pass."
4. **Track iterations.** Write state to `.forge/ralph-state.json`.
5. **Max 10 iterations.** If still failing after 10, report with full diagnostics.
6. **Parallel by default.** Independent tasks run simultaneously.
7. **Evidence required.** Every "done" claim needs test output or build output.
</Rules>

<State_Format>
```json
{
  "active": true,
  "iteration": 1,
  "maxIterations": 10,
  "prompt": "original request",
  "startedAt": "ISO timestamp",
  "lastVerification": {
    "buildPassed": false,
    "testsPassed": false,
    "architectApproved": false,
    "issues": []
  }
}
```
</State_Format>

<Exit_Conditions>
- All verification checks pass AND architect approves → SUCCESS
- Max iterations reached → REPORT (list remaining issues)
- User says stop/cancel → SAVE STATE and stop
- Same error 3x in a row → ESCALATE to user
</Exit_Conditions>
