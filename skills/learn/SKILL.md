---
name: learn
description: Auto-update CLAUDE.md with project learnings (Boris Tip #3)
---

<Purpose>
Maintain a living CLAUDE.md that captures project-specific rules and learnings.
After every correction or mistake, this skill updates CLAUDE.md so the same
mistake never happens again. Boris Cherny says Claude is "eerily good at
writing rules for itself."
</Purpose>

<Use_When>
- User says "learn this", "remember this", "update claude.md", "don't make that mistake again"
- After a correction or bug fix
- When establishing a new project convention
- User wants to add a rule to CLAUDE.md
</Use_When>

<Steps>
1. **Identify what to learn**:
   - If user explicitly states a rule: use it directly
   - If this follows a correction: extract the pattern (what was wrong, what's right)
   - If this follows a bug fix: extract the root cause and prevention rule

2. **Read current CLAUDE.md**:
   - Check project root for `CLAUDE.md`
   - Check `~/.claude/CLAUDE.md` for global rules
   - Understand existing rules to avoid duplicates

3. **Draft the new rule**:
   - Write it as a clear, actionable directive
   - Keep it concise (1-2 lines)
   - Use imperative form: "Always...", "Never...", "When X, do Y"
   - Examples:
     - "Always use `node:` prefix for Node.js built-in imports"
     - "Never use `any` type — use `unknown` and narrow"
     - "When adding API endpoints, always add corresponding tests"

4. **Add to CLAUDE.md**:
   - Append under the appropriate section (create sections if needed)
   - Sections: Code Style, Testing, Architecture, Dependencies, Patterns
   - If the file is getting long (>4000 tokens), suggest trimming old/redundant rules

5. **Confirm**: Show the user what was added and where.
</Steps>

<Auto_Learn>
When invoked without a specific rule, scan the conversation for:
- Corrections the user made ("no, do it this way...")
- Repeated patterns that should be documented
- Project conventions that aren't in CLAUDE.md yet
- Mistakes that were made and fixed
Then propose rules for each one.
</Auto_Learn>

<CLAUDE_MD_Structure>
```markdown
# Project Rules

## Code Style
- ...

## Testing
- ...

## Architecture
- ...

## Dependencies
- ...

## Patterns
- ...
```
</CLAUDE_MD_Structure>
