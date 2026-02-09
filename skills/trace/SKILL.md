---
name: trace
description: Show agent flow trace — timeline of hooks, skills, agents, and mode transitions
---

<Purpose>
Visualize what happened during a session: which hooks fired, which skills activated,
which agents ran, mode transitions, and performance bottlenecks.
</Purpose>

<Use_When>
- User says "trace", "show trace", "what happened", "agent timeline"
- Debugging why something didn't work as expected
- Understanding execution flow of a complex operation
</Use_When>

<Views>

### Timeline View
Chronological list of events:
```
[14:30:01] HOOK    UserPromptSubmit → keyword-router
[14:30:01] KEYWORD ultrawork detected
[14:30:02] SKILL   /forge:ultrawork activated
[14:30:03] AGENT   executor (sonnet) started — "implement auth middleware"
[14:30:03] AGENT   designer (sonnet) started — "build login form"
[14:30:45] AGENT   executor completed (42s, 12 tools)
[14:31:02] AGENT   designer completed (59s, 8 tools)
[14:31:03] HOOK    PostToolUse → context-monitor (67% used)
```

### Summary View
Aggregate statistics:
```
Session Summary:
  Duration: 12m 34s
  Hooks fired: 47 (keyword: 3, context-monitor: 38, continuation: 6)
  Skills activated: 2 (ultrawork, code-review)
  Agents spawned: 5 (executor x2, designer x1, test-engineer x1, verifier x1)
  Mode transitions: idle → ultrawork → idle
  Bottleneck: designer agent (59s avg)
  Context usage: 67%
```

</Views>

<Filters>
- `--hooks` — Show only hook events
- `--skills` — Show only skill activations
- `--agents` — Show only agent lifecycle
- `--modes` — Show only mode transitions
- `--all` — Show everything (default)
</Filters>

<Data_Source>
Read from session transcript (JSONL) and .forge/ state files.
Parse Task tool_use blocks for agent spawning, skill blocks for activations.
</Data_Source>
