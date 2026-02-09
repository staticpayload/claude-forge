---
name: review
description: Parallel code review using both Codex and Gemini
---

<Purpose>
Delegate a code review to BOTH Codex and Gemini simultaneously, then synthesize
their findings into a unified report. Codex focuses on logic, security, and
performance. Gemini focuses on design patterns, maintainability, and UX.
</Purpose>

<Use_When>
- User says "forge review", "multi-review", "cross-review"
- Before merging significant PRs
- When comprehensive review from multiple AI perspectives is wanted
</Use_When>

<Steps>
1. **Scope**: Determine what to review (git diff, specific files, or PR)

2. **Discover tools**: Call ToolSearch("codex") and ToolSearch("gemini")

3. **Spawn both reviews in parallel** (same message, two tool calls):
   a. `mcp__codex__codex_exec` with prompt:
      "Review this code for: security vulnerabilities, logic bugs, performance issues, error handling, and code quality. Be specific with file paths and line numbers. [include git diff or file contents]"
   b. `mcp__gemini__gemini_exec` with prompt:
      "Review this code for: design patterns, maintainability, naming conventions, documentation quality, component architecture, and UX implications. Be specific. [include git diff or file contents]"

4. **Poll both**: Alternate between codex_status and gemini_status until both complete

5. **Synthesize**: Combine findings into a unified report:
   - Deduplicate overlapping findings
   - Severity-rate each issue (critical / warning / suggestion)
   - Attribute source (Codex / Gemini / both)
   - Group by category (security, logic, design, style)

6. **Present** the unified report to the user
</Steps>

<Tool_Usage>
- mcp__codex__codex_exec + mcp__codex__codex_status
- mcp__gemini__gemini_exec + mcp__gemini__gemini_status
</Tool_Usage>
