---
name: note
description: Persistent notepad across sessions — survives context compaction
---

<Purpose>
Save important information to a persistent notepad file that survives context
compaction and can be loaded in future sessions. Three sections with different
persistence behaviors.
</Purpose>

<Use_When>
- User says "note", "remember this", "save this"
- Need to persist information across context compaction
- Want to track working state during long sessions
</Use_When>

<Sections>

### Priority Context (max 500 chars)
- Loaded automatically at session start
- For the most critical context that MUST survive compaction
- Usage: `/forge:note --priority "current task: implementing auth middleware"`

### Working Memory (timestamped, auto-pruned)
- Timestamped entries
- Auto-pruned after 7 days
- For tracking progress, findings, decisions during a session
- Usage: `/forge:note "found the bug in auth.ts:42 — missing null check"`

### Manual (permanent)
- Never auto-pruned
- For permanent reference information
- Usage: `/forge:note --manual "project uses JWT auth with RS256 signing"`

</Sections>

<Commands>
- `/forge:note "text"` — Add to working memory (default)
- `/forge:note --priority "text"` — Set priority context (overwrites previous)
- `/forge:note --manual "text"` — Add to manual section (permanent)
- `/forge:note --show` — Display all notepad contents
- `/forge:note --prune` — Remove entries older than 7 days
- `/forge:note --clear` — Clear all sections (with confirmation)
</Commands>

<Storage>
File: `.forge/notepad.md`
Format:
```markdown
## Priority Context
[max 500 chars, always loaded at session start]

## Working Memory
- [2024-01-15 14:30] Found bug in auth.ts:42
- [2024-01-15 14:45] Fix applied, tests passing

## Manual
- Project uses JWT auth with RS256
- Database migrations run with: npm run migrate
```
</Storage>
