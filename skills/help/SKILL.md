---
name: help
description: Guide on using claude-forge — features, skills, magic keywords, tips
---

<Purpose>
Show users everything claude-forge can do. Overview of features, skills, magic
keywords, and tips for effective usage.
</Purpose>

<Use_When>
- User says "help", "what can you do", "forge help", "how do I use forge"
- New user exploring the plugin
</Use_When>

<Steps>
Present this information in a clear, organized way:

```
=== claude-forge ===
Multi-CLI delegation plugin for Claude Code.

QUICK START
  "forge this"          Auto-route any task to best CLI
  "forge review"        Dual-CLI code review
  "fix CI"              Auto-fix failing tests/build
  "ultrawork [task]"    Maximum parallelism mode

MAGIC KEYWORDS (just say them naturally)
  ultrawork / ulw       Parallel execution, no scope reduction
  search / deepsearch   Exhaustive codebase search
  analyze / investigate Deep context gathering before action
  ultrathink            Extended reasoning, quality over speed

EXECUTION MODES
  /forge:autopilot      Full autonomous: idea → code → tests → verified
  /forge:ralph          Persistence loop: work → verify → repeat
  /forge:ultrawork      Parallel agents, maximum throughput
  /forge:ecomode        Budget-conscious model routing
  /forge:ultraqa        QA cycling: test → fix → repeat
  /forge:ultrapilot     Parallel autopilot with file ownership
  /forge:team           Coordinated multi-agent teams
  /forge:pipeline       Sequential agent chains with presets

DELEGATION
  /forge:forge          Auto-route to Codex (backend) or Gemini (frontend)
  /forge:backend        Direct to Codex CLI
  /forge:frontend       Direct to Gemini CLI
  /forge:backend-agent  Built-in backend agent (no CLI needed)
  /forge:frontend-agent Built-in frontend agent (no CLI needed)
  /forge:review         Parallel review via both CLIs
  /forge:parallel       Decompose + parallel multi-CLI execution

PLANNING & ANALYSIS
  /forge:plan           Strategic planning (--consensus, --review)
  /forge:research       Parallel investigation with evidence
  /forge:analyze        Deep investigation (architecture, bugs, perf)
  /forge:deepsearch     Thorough codebase search

CODE QUALITY
  /forge:code-review    Severity-rated multi-dimension review
  /forge:security-review OWASP Top 10 + secrets + auth audit
  /forge:tdd            Red-Green-Refactor enforcement
  /forge:build-fix      Minimal fixes for build errors

PRODUCTIVITY
  /forge:worktree       Git worktree manager for parallel sessions
  /forge:techdebt       Find duplicates, dead exports, stale TODOs
  /forge:fix            Auto-fix from CI/docker/error logs
  /forge:learn          Auto-update CLAUDE.md with learnings
  /forge:deepinit       Generate AGENTS.md for your codebase
  /forge:note           Persistent notepad across sessions
  /forge:doctor         Diagnose and fix installation issues

SPECIALIST AGENTS
  /forge:frontend-ui-ux UI/UX design and component work
  /forge:git-master     Atomic commits, rebasing, history

CONFIGURATION
  /forge:setup          Interactive setup wizard
  /forge:set-codex-model / set-gemini-model
  /forge:enable-codex   / enable-gemini
  /forge:hud            Configure HUD statusline

INTELLIGENT FEATURES
  - Complexity scoring: tasks auto-scored for model routing
  - Task decomposition: parallel skill splits tasks intelligently
  - Context monitoring: warns at 75%/90% context usage
  - Continuation enforcement: prevents premature stopping
  - Token tracking: cost estimation and session analytics

STOPPING
  "cancel" / "stop"     Cancel active mode
  /forge:cancel         Explicit cancellation with cleanup
  /forge:cancel --force Clear ALL state files
```
</Steps>
