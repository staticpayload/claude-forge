---
name: research
description: Orchestrate parallel scientist agents for comprehensive research
---

<Purpose>
Decompose a research question into independent stages, run parallel scientist
agents, cross-validate findings, and produce a comprehensive report.
Supports AUTO mode for fully autonomous execution.
</Purpose>

<Use_When>
- User says "research", "analyze data", "investigate thoroughly"
- Question requires multiple angles of investigation
- Need comprehensive analysis with evidence
</Use_When>

<Execution>

## Step 1: Decompose
Break the research question into 3-7 independent investigation stages:
- Each stage should be answerable independently
- Stages can run in parallel
- Identify what evidence would support/refute each hypothesis

## Step 2: Investigate (Parallel)
Launch scientist agents for each stage:
- Each agent gets: stage question + relevant context files + evidence requirements
- Route to appropriate tools: Grep for code search, WebSearch for external info,
  Read for file analysis, Bash for data processing
- Model routing: haiku for simple lookups, sonnet for analysis, opus for synthesis

## Step 3: Cross-Validate
After all stages complete:
- Compare findings across stages for contradictions
- Identify gaps in evidence
- Re-investigate contradictions with targeted follow-up

## Step 4: Synthesize
Produce a comprehensive report:
```markdown
# Research: [Question]

## Executive Summary
[2-3 sentence answer]

## Findings
### [Stage 1 Title]
**Evidence:** [specific file:line references or data]
**Confidence:** HIGH/MEDIUM/LOW
**Finding:** [conclusion]

### [Stage 2 Title]
...

## Cross-Validation
[Contradictions found and resolved]

## Recommendations
1. [Actionable recommendation with evidence]
2. [Actionable recommendation with evidence]

## Gaps
[What we couldn't determine and why]
```

</Execution>

<Quality_Standards>
- Every finding must cite specific evidence (file:line, URL, data)
- Confidence levels: HIGH (multiple sources agree), MEDIUM (single strong source), LOW (inference)
- Contradictions must be explicitly addressed
- Gaps must be honestly reported
- Recommendations must be actionable and evidence-based
</Quality_Standards>
