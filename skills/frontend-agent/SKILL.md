---
name: frontend-agent
description: Frontend/design work via built-in Claude Code agents (no CLI needed)
---

<Purpose>
Fallback for frontend/design work when Gemini CLI is not installed. Uses Claude
Code's built-in Task subagents to handle UI/UX tasks autonomously. This gives
users the same delegation workflow without requiring external CLI tools.
</Purpose>

<Use_When>
- Gemini CLI is not available and user needs frontend/design work done
- User explicitly asks for "frontend agent" or "built-in frontend"
- The forge skill detects a frontend task but Gemini CLI is missing
</Use_When>

<Steps>
1. Analyze the user's request to determine the type of frontend work.

2. Delegate to the appropriate built-in agent via the Task tool:
   - **UI components/layouts** -> `claude-forge:designer` (subagent_type, model: sonnet)
   - **CSS/styling/themes** -> `claude-forge:designer` (subagent_type, model: sonnet)
   - **React/Vue/Svelte implementation** -> `claude-forge:executor` (subagent_type, model: sonnet)
   - **Design system/architecture** -> `claude-forge:designer` (subagent_type, model: sonnet)
   - **Documentation/content** -> `claude-forge:writer` (subagent_type, model: haiku)

3. Pass the full user request as the prompt, including:
   - The working directory / project path
   - Any relevant file paths or design specs
   - Visual requirements and constraints

4. Present the agent's result to the user.
</Steps>

<Fallback_Note>
This skill exists as a fallback for users without Gemini CLI.
For best results, install Gemini CLI and use `/claude-forge:frontend` instead.
</Fallback_Note>
