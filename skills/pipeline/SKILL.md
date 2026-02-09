---
name: pipeline
description: Chain agents together in sequential or branching workflows with data passing
---

<Purpose>
Run agents in sequence where each stage's output feeds the next stage's input.
Like a Unix pipe but for AI agents. Includes built-in presets for common workflows
and custom pipeline syntax.
</Purpose>

<Use_When>
- User says "pipeline", "chain agents", "sequential workflow"
- Task requires ordered steps where output feeds input
- Using a built-in preset workflow
</Use_When>

<Built_In_Presets>

### review
`explore → code-reviewer → security-reviewer → verifier`
Comprehensive code review with security audit and verification.

### implement
`architect → executor → test-engineer → verifier`
Design → build → test → verify workflow.

### debug
`explore → debugger → executor → test-engineer`
Find → diagnose → fix → verify workflow.

### research
`explore → scientist → scientist → writer`
Discover → analyze (2x parallel) → document workflow.

### refactor
`explore → architect → executor → code-reviewer → verifier`
Understand → design → refactor → review → verify workflow.

### security
`explore → security-reviewer → executor → security-reviewer`
Scan → audit → fix → re-audit workflow.

</Built_In_Presets>

<Custom_Syntax>
```
# Sequential: A → B → C
architect -> executor -> verifier

# Parallel merge: A+B → C
[code-reviewer, security-reviewer] -> writer

# With model specification:
architect:opus -> executor:sonnet -> verifier:haiku

# Branching:
explore -> {
  backend: executor -> test-engineer,
  frontend: designer -> test-engineer
} -> verifier

# With CLI routing:
explore -> codex:backend -> gemini:frontend -> verifier
```
</Custom_Syntax>

<Data_Passing>
Each stage receives the previous stage's output as context:
1. Stage A runs and produces output
2. Output is summarized (max 2000 chars) and passed as context to Stage B
3. Stage B runs with that context + original task description
4. Repeat until pipeline completes

If a stage fails:
- **retry**: Re-run the same stage (max 2 retries)
- **skip**: Move to next stage without this output
- **abort**: Stop the pipeline and report
- **fallback**: Try alternative agent for this stage
</Data_Passing>

<State_Format>
```json
{
  "active": true,
  "preset": "implement",
  "stages": [
    {"agent": "architect", "status": "completed", "output": "..."},
    {"agent": "executor", "status": "in_progress", "output": null},
    {"agent": "test-engineer", "status": "pending", "output": null},
    {"agent": "verifier", "status": "pending", "output": null}
  ],
  "currentStage": 1,
  "errors": []
}
```
</State_Format>
