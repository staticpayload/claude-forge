---
name: ultraqa
description: QA cycling workflow — test, verify, fix, repeat until goal met
---

<Purpose>
Autonomous QA loop: run tests → diagnose failures → fix → repeat.
Continues until the goal is met or max cycles reached.
Used standalone or as Phase 4 of autopilot.
</Purpose>

<Use_When>
- User says "ultraqa", "fix tests", "make tests pass", "qa loop"
- Tests are failing and need iterative fixing
- Autopilot Phase 4 (QA) activates this
</Use_When>

<Arguments>
- `--tests` — Make test suite pass (default)
- `--build` — Make build/compile succeed
- `--lint` — Fix all lint errors
- `--typecheck` — Fix all type errors
- `--custom "command"` — Run custom verification command
</Arguments>

<Cycle_Template>

## Cycle N of 5

### Step 1: Run Verification
Execute the goal command:
- `--tests`: Run project test suite (npm test, pytest, go test, etc.)
- `--build`: Run build command (npm run build, cargo build, etc.)
- `--lint`: Run linter (eslint, ruff, golangci-lint, etc.)
- `--typecheck`: Run type checker (tsc --noEmit, mypy, etc.)
- `--custom`: Run the provided command

### Step 2: Analyze Results
If PASS → Exit with success.
If FAIL:
1. Parse error output for specific failures
2. Classify errors:
   - Type errors → fix type annotations, null checks, imports
   - Test failures → fix logic bugs, update assertions, fix mocks
   - Build errors → fix syntax, resolve imports, fix configs
   - Lint errors → apply auto-fixable rules, fix remaining manually

### Step 3: Diagnose (if complex)
For non-obvious failures, use debugger agent to:
- Trace the error to root cause
- Identify the minimal fix (don't over-engineer)

### Step 4: Fix
Apply the fix using executor agent:
- Minimal changes only — don't refactor unrelated code
- One fix per failure when possible
- Verify fix doesn't break other tests

### Step 5: Loop Decision
- **Goal met:** All checks pass → EXIT with success summary
- **Progress made:** Some errors fixed → Continue to next cycle
- **Same failure 3x:** Identical error persists → EXIT with diagnosis
- **Max cycles (5):** → EXIT with remaining failures report

</Cycle_Template>

<Exit_Report>
```
ULTRAQA COMPLETE
Goal: [tests|build|lint|typecheck|custom]
Cycles: N/5
Result: [PASS|FAIL]
Fixed: [list of issues resolved]
Remaining: [list of unresolved issues, if any]
```
</Exit_Report>

<State_Format>
```json
{
  "active": true,
  "goal": "tests",
  "cycle": 1,
  "maxCycles": 5,
  "failures": [],
  "fixedIssues": [],
  "sameFailureCount": 0
}
```
</State_Format>
