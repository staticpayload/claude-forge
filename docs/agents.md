# Agents

claude-forge has 32 specialized agents organized across 5 lanes. Each agent has a dedicated system prompt, a default model tier (haiku, sonnet, or opus), and specific capabilities. Agents are read-only and stateless — they produce analysis, plans, and design documents, never modifying code directly.

---

## Build Lane

The Build Lane handles discovery, analysis, planning, architecture, debugging, and implementation.

| Agent | Model | Capabilities |
|-------|-------|-------------|
| explorer | haiku | Codebase discovery, file/symbol mapping, dependency tracing. Fast lightweight scans to answer "where is this?" and "what depends on this?" |
| analyst | opus | Requirements clarity, acceptance criteria, edge case identification, scope definition. Surfaces hidden assumptions and ambiguities before implementation. |
| planner | opus | Task sequencing, execution plans, dependency analysis, risk flags. Decomposes complex goals into atomic, ordered steps with parallelization opportunities. |
| architect | opus | System design, component boundaries, interface contracts, long-horizon tradeoffs. READ-ONLY — analyzes and advises, never modifies code. |
| debugger | sonnet | Root-cause analysis, regression isolation, failure diagnosis. Applies systematic elimination to distinguish symptoms from causes. |
| executor | sonnet | Code implementation, refactoring, feature work. The primary implementation agent — turns plans into working code with verified compilation and passing tests. |
| deep-executor | opus | Complex autonomous goal-oriented tasks requiring multi-file exploration and deep reasoning. For large, multi-step implementations beyond standard executor scope. |
| verifier | sonnet | Completion evidence collection, claim validation, test adequacy assessment. Proves work is actually done before declaring success. |

---

## Review Lane

The Review Lane performs focused code reviews across specific dimensions. All review agents are READ-ONLY.

| Agent | Model | Capabilities |
|-------|-------|-------------|
| style-reviewer | haiku | Formatting, naming conventions, idioms, lint compliance. Fast style checks for consistency with project standards. |
| quality-reviewer | sonnet | Logic defects, maintainability issues, anti-patterns, SOLID principle violations. Catches subtle correctness problems. |
| api-reviewer | sonnet | API contracts, versioning strategy, backward compatibility, error semantics. Ensures stable and consistent interfaces. |
| security-reviewer | sonnet | OWASP analysis, secrets detection, auth/authz audit, vulnerability assessment. Finds trust boundary violations and security anti-patterns. |
| performance-reviewer | sonnet | Performance hotspots, algorithmic complexity, memory leaks, latency bottlenecks. Identifies optimization opportunities. |
| code-reviewer | opus | Comprehensive review across all concerns (correctness, maintainability, design, performance, security). The most thorough review agent. |

---

## Domain Lane

Domain specialists handle cross-cutting concerns: dependencies, testing, build systems, design, documentation, runtime validation, data analysis, version control, and quality strategy.

| Agent | Model | Capabilities |
|-------|-------|-------------|
| dependency-expert | sonnet | External SDK/API/package evaluation, official documentation lookup, compatibility assessment, risk evaluation. Checks docs before recommending technologies. |
| test-engineer | sonnet | Test strategy, coverage analysis, flaky test remediation, TDD workflow guidance. Ensures adequate test infrastructure. |
| build-fixer | sonnet | Build failures, toolchain errors, type errors, dependency resolution. Minimal diffs focused on fixing compilation, not architecture. |
| designer | sonnet | UI/UX architecture, interaction design, component structure, accessibility. Handles visual and interactive design work. |
| writer | haiku | Technical documentation, migration notes, API guides, user-facing guidance. Lightweight documentation specialist. |
| qa-tester | sonnet | Interactive CLI and service runtime validation through exploratory and structured testing. Uses tmux sessions for live service testing. |
| scientist | sonnet | Data analysis execution, statistical research, evidence-based investigation. Handles quantitative analysis and research. |
| git-master | sonnet | Commit strategy, history hygiene, branch management, merge conflict resolution. Ensures atomic, clean version control. |
| quality-strategist | sonnet | Quality strategy planning, release readiness assessment, risk evaluation, test coverage analysis. Holistic quality oversight. |

---

## Product Lane

Product specialists handle discovery, research, and metrics to inform feature decisions.

| Agent | Model | Capabilities |
|-------|-------|-------------|
| product-manager | sonnet | Problem framing, persona development, jobs-to-be-done analysis, PRD creation, value hypothesis definition. |
| ux-researcher | sonnet | Heuristic evaluation, usability audits, accessibility assessment, interaction analysis, user evidence synthesis. |
| information-architect | sonnet | Information taxonomy design, navigation structure, content organization, findability optimization, naming consistency. |
| product-analyst | sonnet | Product metrics analysis, funnel optimization, A/B experiment design, data-driven insights, behavior measurement. |

---

## Coordination Lane

Coordination agents manage team workflows, visual analysis, and research.

| Agent | Model | Capabilities |
|-------|-------|-------------|
| critic | opus | Plan/design critical challenge, assumption stress-testing, devil's advocate. READ-ONLY — pokes holes in proposals without building alternatives. |
| vision | sonnet | Image/screenshot/diagram analysis, visual content extraction, PDF inspection. Processes visual media files. |
| researcher | sonnet | External documentation research, reference lookup for frameworks, libraries, APIs, and technical topics. |
| team-lead | opus | Team coordination, task decomposition, smart routing, progress monitoring, graceful shutdown. Orchestrates coordinated multi-agent workflows. |
| team-worker | sonnet | Coordinated team worker with claim/execute/report/shutdown protocol. Respects file ownership, communicates with peers. |

---

## Model Routing

Three model tiers balance capability against speed and cost:

**Haiku** (fast, lightweight)
- Quick lookups and narrow checks
- Agents: explorer, style-reviewer, writer
- Use when: the task is straightforward, the answer should be immediate, exploration/scanning is sufficient

**Sonnet** (standard, balanced)
- Implementation, debugging, most reviews, domain work, product work
- Agents: debugger, executor, all reviewers, all domain specialists, all product agents, team-worker, researcher, vision
- Use when: the task requires reasoning, correctness matters, or multiple factors must be weighed

**Opus** (deep reasoning, comprehensive)
- Architecture, complex analysis, multi-step planning, leadership coordination
- Agents: analyst, planner, architect, deep-executor, code-reviewer, critic, team-lead
- Use when: the problem is complex, design decisions are permanent, or an oversight pass is essential

---

## Team Compositions

These are proven agent workflows for common scenarios. You can invoke them directly or build custom compositions.

### Feature Development Pipeline
```
analyst → planner → executor → test-engineer → quality-reviewer → verifier
```
Use for: standard feature work with clear requirements. Analyst clarifies scope, planner breaks it into tasks, executor implements, test-engineer ensures coverage, quality-reviewer performs final review, verifier proves completion.

### Bug Investigation and Fix
```
explorer + debugger → executor → test-engineer → verifier
```
Use for: production bugs. Explorer maps the codebase, debugger isolates root cause, executor fixes it, test-engineer adds regression test, verifier confirms the fix.

### Code Review (Parallel)
```
[style-reviewer + quality-reviewer + api-reviewer + security-reviewer] → code-reviewer
```
Use for: comprehensive pre-merge review. Run the dimension reviewers in parallel for speed, then code-reviewer performs a final holistic pass.

### Full-Stack Feature with External Services
```
planner → [executor: backend] + [Gemini/Codex: frontend] → test-engineer → verifier
```
Use for: features spanning backend and frontend. Planner decomposes, executor handles backend in Claude Code, external agent handles frontend design/implementation, test-engineer validates both, verifier confirms end-to-end.

### Product Discovery
```
product-manager + ux-researcher + product-analyst + designer
```
Use for: new features or products. All four run in parallel: product-manager frames the problem, ux-researcher validates with users, product-analyst measures readiness, designer explores interaction approaches.

### Architecture Decision
```
analyst → architect → critic → planner
```
Use for: major structural changes. Analyst clarifies requirements, architect proposes design, critic stress-tests assumptions, planner creates rollout sequence.

### Data-Driven Investigation
```
explorer → scientist → product-analyst
```
Use for: metrics analysis and hypothesis testing. Explorer finds relevant code/data sources, scientist runs statistical analysis, product-analyst interprets results and recommends actions.

---

## Custom Agents

Agents are plain markdown files in the `agents/` directory. You can create custom agents by following the standard format.

### Agent File Structure

Each agent is a markdown file with YAML frontmatter and markdown sections:

```yaml
---
name: agent-name
description: One-line description of what this agent does
model: haiku | sonnet | opus
disallowedTools: ["Write", "Edit", "NotebookEdit"]  # optional
---

<Role>
Concise statement of the agent's purpose and identity.
</Role>

<Why_This_Matters>
Explain why this role exists and what problem it solves in the development workflow.
</Why_This_Matters>

<Success_Criteria>
Bullet list of concrete, measurable outcomes that prove the agent succeeded.
</Success_Criteria>

<Constraints>
Hard limits on what the agent can and cannot do (e.g., READ-ONLY, no modifications, no scope expansion).
</Constraints>

<Execution_Policy>
Step-by-step process for how the agent should approach its work.
</Execution_Policy>

<Output_Format>
Template for the agent's response, with sections and expected structure.
</Output_Format>

<Failure_Modes_To_Avoid>
Common mistakes and anti-patterns specific to this agent's domain.
</Failure_Modes_To_Avoid>
```

### Example: Custom Security Agent

```yaml
---
name: custom-security-hardener
description: Applies security hardening patterns to legacy code
model: sonnet
---

<Role>
You harden legacy code by applying proven security patterns from the codebase without broad refactoring.
</Role>

<Success_Criteria>
- Identifies 3+ security improvements specific to the code
- Changes are minimal and localized
- No breaking changes to APIs or behavior
</Success_Criteria>

<Execution_Policy>
1. Scan the code for common vulnerability patterns
2. Check existing codebase for how security is handled elsewhere
3. Propose changes that match existing patterns
4. Verify no new test failures
</Execution_Policy>
```

### Key Principles for Custom Agents

1. **Focused responsibility**: one agent, one job, clear boundaries
2. **Explicit constraints**: READ-ONLY, scope limits, tool restrictions
3. **Testable success**: success criteria must be measurable, not vague
4. **Grounded execution**: reference the codebase, use evidence, not intuition
5. **Clear output**: templates so results are scannable and usable by downstream agents

---

## Integration Patterns

### Sequential Composition
Use `→` when output of one agent feeds into the next:
```
analyst → planner → executor
```
The analyst clarifies what should be done. The planner creates an ordered task list. The executor implements the tasks.

### Parallel Composition
Use `+` when agents work independently:
```
style-reviewer + quality-reviewer + security-reviewer
```
All three reviewers examine the same code in parallel, then results are consolidated.

### Mixed Composition
Combine sequential and parallel:
```
planner → [executor: module-a] + [executor: module-b] → test-engineer
```
Planner decomposes the work. Two executors work on different modules in parallel. Test-engineer validates both.

### Staged Verification
Use verification gates at key points:
```
executor → verifier (proves tests pass)
    ↓
quality-reviewer → verifier (proves review complete)
    ↓
release-decision
```
Each stage must provide evidence before proceeding.

---

## Invoking Agents

All agents are invoked through the Claude Code interface. Common patterns:

**Direct Invocation**
```
/oh-my-claudecode:executor
Task: Implement the feature in PLAN.md
```

**Pipeline Invocation**
```
/oh-my-claudecode:pipeline
compose: analyst → planner → executor → verifier
```

**Parallel Invocation**
```
/oh-my-claudecode:ultrawork
tasks: [explorer, debugger, test-engineer]
```

**Team Coordination**
```
/oh-my-claudecode:team-lead
goal: Implement feature X with coordinated team
```

Consult `/oh-my-claudecode:help` for syntax and available skills.

---

## Agent Capabilities Matrix

| Agent | Reads Code | Modifies Code | Analyzes | Plans | Reviews | Implements |
|-------|-----------|---------------|----------|-------|---------|------------|
| explorer | Yes | No | Yes | No | No | No |
| analyst | Yes | No | Yes | No | No | No |
| planner | Yes | No | Yes | Yes | No | No |
| architect | Yes | No | Yes | No | No | No |
| debugger | Yes | Yes | Yes | No | No | Yes |
| executor | Yes | Yes | No | No | No | Yes |
| deep-executor | Yes | Yes | Yes | Yes | No | Yes |
| verifier | Yes | No | Yes | No | Yes | No |
| style-reviewer | Yes | No | No | No | Yes | No |
| quality-reviewer | Yes | No | No | No | Yes | No |
| api-reviewer | Yes | No | No | No | Yes | No |
| security-reviewer | Yes | No | No | No | Yes | No |
| performance-reviewer | Yes | No | No | No | Yes | No |
| code-reviewer | Yes | No | No | No | Yes | No |
| dependency-expert | Yes | No | Yes | No | No | No |
| test-engineer | Yes | Yes | Yes | Yes | No | Yes |
| build-fixer | Yes | Yes | Yes | No | No | Yes |
| designer | Yes | No | Yes | No | No | No |
| writer | Yes | No | No | No | No | No |
| qa-tester | Yes | No | Yes | No | No | No |
| scientist | Yes | No | Yes | No | No | No |
| git-master | Yes | Yes | Yes | No | No | No |
| quality-strategist | Yes | No | Yes | Yes | No | No |
| product-manager | Yes | No | Yes | Yes | No | No |
| ux-researcher | Yes | No | Yes | No | No | No |
| information-architect | Yes | No | Yes | No | No | No |
| product-analyst | Yes | No | Yes | No | No | No |
| critic | Yes | No | Yes | No | Yes | No |
| vision | Yes | No | Yes | No | No | No |
| researcher | Yes | No | Yes | No | No | No |
| team-lead | Yes | No | Yes | Yes | No | No |
| team-worker | Yes | Yes | Yes | No | No | Yes |
