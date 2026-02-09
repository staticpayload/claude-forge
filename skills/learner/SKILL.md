---
name: learner
description: Extract reusable skills from debugging insights — capture hard-won knowledge
---

<Purpose>
Capture hard-won debugging insights and solutions as reusable skills. Not just
code — the understanding behind WHY something works. Quality over quantity.
</Purpose>

<Use_When>
- User says "learn this", "remember this mistake", "save this insight"
- Just solved a tricky bug worth remembering
- Discovered a non-obvious pattern or gotcha
</Use_When>

<Quality_Gates>
A good learned skill must be:
1. **Non-Googleable** — Can't find this in the first page of search results
2. **Context-specific** — Relevant to this project's specific setup/patterns
3. **Actionable** — Clear steps to apply, not vague advice
4. **Hard-won** — Took real debugging effort to discover

### Anti-Patterns (DO NOT capture)
- Generic advice ("always handle errors")
- Easily Googleable solutions ("how to use async/await")
- Vague observations ("this code is complex")
- Language basics ("null check before access")
</Quality_Gates>

<Skill_Format>
```markdown
---
name: [descriptive-kebab-case-name]
triggers: [keyword1, keyword2, keyword3]
scope: [user|project]
---

## The Insight
[What you discovered — the non-obvious thing]

## Why This Matters
[Why this is important in this context]

## Recognition Pattern
[How to recognize when this skill is relevant again]

## The Approach
[Step-by-step what to do when you encounter this]
```
</Skill_Format>

<Storage>
- **User-level:** `~/.claude-forge/skills/` (applies across projects)
- **Project-level:** `.forge/skills/` (project-specific)
- Scope determined by whether the insight is project-specific or universal
</Storage>

<Steps>
1. Identify the insight from the current conversation
2. Validate against quality gates (reject if fails)
3. Extract trigger keywords (what prompts would benefit from this)
4. Determine scope (user vs. project)
5. Write the skill file
6. Confirm with user
</Steps>
