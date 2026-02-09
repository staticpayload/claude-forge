---
name: fix
description: Auto-fix bugs from CI logs, docker logs, or error output (Boris Tip #5)
---

<Purpose>
Zero-context-switching bug fixing. Point claude-forge at CI logs, docker logs,
Slack threads, or error output and say "fix". Claude will diagnose and fix
the issue autonomously. Inspired by Boris Cherny's tip that Claude fixes
most bugs by itself with minimal intervention.
</Purpose>

<Use_When>
- User says "fix", "fix CI", "fix tests", "fix the build"
- User pastes error output or logs
- User references a failing CI pipeline
- User mentions docker container errors
</Use_When>

<Steps>
1. **Identify the error source**:
   - If user pasted error text: parse it directly
   - If user said "fix CI" or "fix tests": run the test suite and capture output
   - If user said "fix build": run the build command and capture errors
   - If user mentioned docker: check `docker logs` for the relevant container
   - If user pasted a Slack thread or URL: extract the error details

2. **Diagnose the root cause**:
   - Parse error messages, stack traces, and log output
   - Identify the failing file(s) and line number(s)
   - Read the relevant source code
   - Determine if it's a:
     - Type error → delegate to build-fixer agent
     - Test failure → read the test, understand the assertion, fix the code
     - Runtime error → trace the call stack
     - Configuration issue → check config files
     - Dependency issue → check package.json/lock files

3. **Route the fix**:
   - Simple fix (typo, missing import, wrong type): fix directly
   - Backend bug: delegate to Codex via `mcp__codex__codex_exec` or `backend-agent`
   - Frontend bug: delegate to Gemini via `mcp__gemini__gemini_exec` or `frontend-agent`
   - Complex bug: use Task tool with `claude-forge:debugger` agent first

4. **Verify the fix**:
   - Re-run the failing command (test, build, CI check)
   - Confirm the error is resolved
   - Check for regressions (run full test suite if available)

5. **Report**: Show what was broken, what was changed, and verification results.
</Steps>

<Auto_Detection>
When the user just says "fix" with no other context:
1. Check for recently failed commands in the terminal
2. Run `git diff` to see recent changes that might have caused issues
3. Run the project's test command if detectable from package.json/Makefile
4. Fix whatever fails
</Auto_Detection>
