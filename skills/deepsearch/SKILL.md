---
name: deepsearch
description: Thorough codebase search — never stop at first result
---

<Purpose>
Exhaustive codebase search. Don't stop at the first match. Search across naming
conventions, follow imports, map usage patterns, and report everything found.
</Purpose>

<Use_When>
- User says "search", "find", "where is", "deepsearch"
- Need to locate all occurrences of something
- Need to understand how something is used across the codebase
</Use_When>

<Strategy>

## 1. Broad Search
- Search exact term AND common variations (camelCase, snake_case, kebab-case, UPPER_CASE)
- Search across all file types (.ts, .tsx, .js, .jsx, .mjs, .py, .go, .rs, etc.)
- Check common locations: src/, lib/, utils/, helpers/, types/, interfaces/
- Use Glob for file patterns, Grep for content patterns

## 2. Deep Dive
- Read each matching file to understand context
- Follow import chains (who imports this? what does this import?)
- Check test files for usage examples
- Look at git history for recent changes

## 3. Synthesize
- Map all locations where the target is defined, used, tested, documented
- Identify the primary implementation vs. secondary references
- Note patterns (is it used consistently? are there variations?)

</Strategy>

<Output_Format>
```markdown
## Search: [query]

### Primary Locations
- `file:line` — [role: definition|usage|test|export]

### Related Files
- `file` — [relationship: imports|extends|implements|tests]

### Usage Patterns
- [How it's used across the codebase]

### Key Insights
- [Anything notable about the search results]
```
</Output_Format>
