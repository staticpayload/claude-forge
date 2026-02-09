---
name: backend-agent
description: Backend work via built-in Claude Code agents (no CLI needed)
---

<Purpose>
Fallback for backend work when Codex CLI is not installed. Uses Claude Code's
built-in Task subagents to handle backend tasks autonomously. This gives users
the same delegation workflow without requiring external CLI tools.
</Purpose>

<Use_When>
- Codex CLI is not available and user needs backend work done
- User explicitly asks for "backend agent" or "built-in backend"
- The forge skill detects a backend task but Codex CLI is missing
</Use_When>

<Steps>
1. Analyze the user's request to determine the type of backend work.

2. Delegate to the appropriate built-in agent via the Task tool:
   - **API/server/infra work** -> `oh-my-claudecode:executor` (subagent_type, model: sonnet)
   - **Database/data pipeline** -> `oh-my-claudecode:executor` (subagent_type, model: sonnet)
   - **Scripts/CLI tools** -> `oh-my-claudecode:executor` (subagent_type, model: sonnet)
   - **Complex architecture** -> `oh-my-claudecode:deep-executor` (subagent_type, model: opus)
   - **Debug/investigate** -> `oh-my-claudecode:debugger` (subagent_type, model: sonnet)

3. Pass the full user request as the prompt, including:
   - The working directory / project path
   - Any relevant file paths
   - Verification steps (run tests, type check, etc.)

4. Present the agent's result to the user.
</Steps>

<Fallback_Note>
This skill exists as a fallback for users without Codex CLI.
For best results, install Codex CLI and use `/claude-forge:backend` instead.
</Fallback_Note>
