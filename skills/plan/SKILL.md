---
name: plan
description: Strategic planning with optional interview workflow and consensus mode
---

<Purpose>
Create a thorough implementation plan before writing code. Supports three modes:
direct planning, interview-based planning (clarify requirements first), and
consensus planning (planner → architect → critic loop).
</Purpose>

<Use_When>
- User says "plan this", "plan the", "make a plan", "design this"
- `--consensus` flag: planner → architect → critic loop
- `--review` flag: review an existing plan
- Task is complex enough to benefit from upfront planning
</Use_When>

<Mode_Detection>
**Auto-detect** based on request specificity:
- Specific request (file names, exact behavior) → Direct planning
- Vague request (no files, unclear scope) → Interview mode
- `--consensus` flag → Consensus planning
- `--review` flag → Plan review mode
</Mode_Detection>

<Interview_Mode>
When requirements are unclear:

1. **Gather codebase facts FIRST** — launch explore agents to answer questions
   you can answer yourself (project structure, tech stack, patterns)
2. **Ask ONE question at a time** — use AskUserQuestion
3. **Classify questions:**
   - Codebase fact → explore the code, don't ask the user
   - Preference → ask user (e.g., "REST or GraphQL?")
   - Requirement → ask user (e.g., "Should this support pagination?")
4. **Max 5 questions** — then proceed with best assumptions
5. **Progressive refinement** — each answer narrows the next question

Quality standard: After interview, 80%+ of plan items should reference specific
files and line numbers. 90%+ of acceptance criteria should be concrete and testable.
</Interview_Mode>

<Direct_Planning>
When requirements are clear:

1. Explore codebase for context (parallel agents)
2. Analyze complexity (use complexity scorer)
3. Create plan document:
   ```markdown
   # Plan: [title]

   ## Goal
   [What we're building and why]

   ## Approach
   [High-level strategy]

   ## Steps
   1. [Step] — [files] — [agent/model tier]
   2. [Step] — [files] — [agent/model tier]
   ...

   ## Risks
   - [Risk]: [Mitigation]

   ## Acceptance Criteria
   - [ ] [Concrete, testable criterion]
   - [ ] [Concrete, testable criterion]
   ```
4. Save to `.forge/plans/plan-{timestamp}.md`
</Direct_Planning>

<Consensus_Mode>
When `--consensus` is specified:

1. **Planner** creates initial plan (using direct planning flow)
2. **Architect** reviews for:
   - Technical feasibility
   - Architectural concerns
   - Missing considerations
   - Alternative approaches
3. **Critic** challenges:
   - Weak assumptions
   - Missing edge cases
   - Over-engineering risks
   - Under-engineering risks
4. **Planner** revises based on feedback
5. Repeat until consensus (max 3 rounds)

Output: Plan with architect approval and critic sign-off.
</Consensus_Mode>

<Review_Mode>
When `--review` is specified:

1. Read the existing plan
2. Evaluate against quality standards:
   - File references present? (80%+ threshold)
   - Concrete acceptance criteria? (90%+ threshold)
   - Risk assessment included?
   - Dependencies identified?
3. Provide feedback with specific improvements
</Review_Mode>
