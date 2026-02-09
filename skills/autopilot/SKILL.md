---
name: autopilot
description: Full autonomous execution from idea to working code — 5-phase lifecycle
---

<Purpose>
Execute a complete development workflow autonomously: from vague idea to verified,
working code. No hand-holding required. You drive every phase, escalate only when
blocked, and don't stop until the work is verified.
</Purpose>

<Use_When>
- User says "autopilot", "build me", "I want a", "make me a", "create a full"
- User provides a vague idea that needs expansion, planning, and execution
- Task requires multiple phases: understand → plan → build → test → verify
</Use_When>

<Phases>

## Phase 1: Expansion (Understand the Ask)
**Goal:** Turn a vague idea into a concrete specification.

1. Launch parallel explore agents to gather codebase context:
   - Project structure, tech stack, existing patterns
   - Related code, naming conventions, test patterns
2. If the ask is ambiguous, use AskUserQuestion (max 3 questions, one at a time)
3. Write a spec document capturing:
   - What exactly will be built
   - Acceptance criteria (concrete, testable)
   - Files that will be created/modified
   - Dependencies on existing code
4. Save spec: `.forge/autopilot-spec.md`

**Exit:** Spec written with 90%+ concrete acceptance criteria.

## Phase 2: Planning
**Goal:** Create an actionable implementation plan.

1. Analyze the spec for complexity (use complexity scorer)
2. If complexity >= opus tier, consult architect agent for design review
3. Create plan with:
   - Ordered list of implementation steps
   - File ownership per step (non-overlapping where possible)
   - Dependencies between steps
   - Risk flags (breaking changes, data migrations, security)
4. Identify parallelizable steps
5. Save plan: `.forge/autopilot-plan.md`

**Exit:** Plan with all steps having concrete file references.

## Phase 3: Execution
**Goal:** Build everything according to the plan.

1. For parallelizable steps: launch multiple agents simultaneously
   - Use Task tool with run_in_background: true for independent work
   - Route to Codex for backend steps, Gemini for frontend steps (if available)
   - Fall back to built-in executor agents if CLIs unavailable
2. For sequential steps: execute in dependency order
3. Each agent must produce REAL, working code (no placeholders, no mocks, no TODOs)
4. Track progress: mark completed steps in the plan

**Rules:**
- ZERO TOLERANCE for placeholder code
- Every file must be syntactically valid
- Don't skip error handling
- Follow existing project patterns and conventions

**Exit:** All plan steps completed, all files written.

## Phase 4: QA (Quality Assurance)
**Goal:** Verify everything works.

1. Run the project's test suite (if it exists)
2. Run build/compile checks
3. Run linter/type checker
4. If tests fail:
   - Diagnose the failure (use debugger agent if needed)
   - Fix the issue
   - Re-run tests
   - Max 5 QA cycles — if still failing after 5, report what's broken
5. If no test suite exists, write basic tests for the new code

**Exit:** Build passes, tests pass, no lint errors. Or: max cycles reached with report.

## Phase 5: Validation
**Goal:** Confirm the work meets the original spec.

1. Review each acceptance criterion from the spec
2. For each criterion, provide EVIDENCE it's met:
   - File path + line number showing the implementation
   - Test output proving the behavior
   - Build output proving compilation
3. If any criterion is NOT met, go back to Phase 3 for that specific item
4. Generate summary:
   ```
   AUTOPILOT COMPLETE
   Spec: [description]
   Files changed: [count]
   Tests: [pass/fail count]
   Acceptance criteria: [met/total]
   ```

**Exit:** All acceptance criteria met with evidence. Summary delivered.

</Phases>

<Execution_Policy>
- State tracking: Write progress to `.forge/autopilot-state.json`
- Resume: If interrupted, read state file and continue from last completed phase
- Escalation: If blocked for >2 attempts on same issue, ask the user
- Delegation: Backend work → Codex (or executor agent), Frontend → Gemini (or designer agent)
- Verification: NEVER claim "should work" — provide actual test output
- Cancellation: User says "stop" or "cancel" → save state and stop gracefully
</Execution_Policy>

<State_Format>
```json
{
  "phase": "expansion|planning|execution|qa|validation|complete|failed",
  "startedAt": "ISO timestamp",
  "prompt": "original user request",
  "specPath": ".forge/autopilot-spec.md",
  "planPath": ".forge/autopilot-plan.md",
  "completedSteps": [],
  "qaIterations": 0,
  "lastError": null
}
```
</State_Format>
