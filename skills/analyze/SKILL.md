---
name: analyze
description: Deep investigation — architecture, bugs, performance, dependencies
---

<Purpose>
Deep investigation before taking action. Gather context from multiple sources,
form hypotheses, validate with evidence, and produce structured findings.
Routes to appropriate specialist based on investigation type.
</Purpose>

<Use_When>
- User says "analyze", "investigate", "debug", "diagnose", "explain", "why does"
- Need to understand a system before modifying it
- Debugging a complex issue
- Evaluating architecture or performance
</Use_When>

<Investigation_Types>

### Architecture Analysis
Route to: architect agent (opus)
- Map component boundaries and dependencies
- Identify coupling hotspots
- Evaluate scalability concerns
- Suggest structural improvements

### Bug Investigation
Route to: debugger agent (sonnet)
- Reproduce the issue
- Trace execution flow
- Identify root cause (not symptoms)
- Propose minimal fix

### Performance Analysis
Route to: performance-reviewer agent (sonnet)
- Profile hotspots (algorithmic complexity)
- Identify memory issues
- Find N+1 queries, unnecessary work
- Benchmark critical paths

### Dependency Analysis
Route to: explore agent (haiku) + architect (opus)
- Map dependency graph
- Identify circular dependencies
- Find unused dependencies
- Evaluate upgrade risks

</Investigation_Types>

<Execution>
1. Classify the investigation type from user request
2. Launch parallel explore agents for initial context gathering
3. Route to appropriate specialist agent
4. If complex: consult architect agent for structural understanding
5. Produce findings with evidence

**Output:**
```markdown
# Analysis: [topic]

## Confirmed Facts
- [Fact with file:line evidence]

## Hypotheses
- [Hypothesis with supporting/refuting evidence]

## Root Cause (if applicable)
[The actual cause with evidence chain]

## Recommendations
1. [Action] — [expected impact] — [risk level]
```
</Execution>

<Rules>
- Distinguish facts from hypotheses explicitly
- Every claim needs file:line or data evidence
- Don't jump to solutions before understanding the problem
- If analysis reveals a fix is needed, recommend ralph/executor — don't fix inline
</Rules>
