---
name: techdebt
description: Find and fix tech debt - duplicated code, dead exports, TODOs (Boris Tip #4)
---

<Purpose>
End-of-session tech debt scanner. Find duplicated code, dead exports, stale
TODOs, and other code quality issues. Run this at the end of every session
to keep the codebase clean. Inspired by Boris Cherny's advice to build a
/techdebt slash command and run it daily.
</Purpose>

<Use_When>
- User says "techdebt", "tech debt", "cleanup", "find duplicates"
- End of a coding session
- Before creating a PR
- User wants to reduce code duplication
</Use_When>

<Steps>
1. **Scan for duplicated code patterns**:
   Use Grep to find identical or near-identical code blocks across files.
   Look for:
   - Functions with identical bodies (>5 lines)
   - Repeated import patterns
   - Copy-pasted logic blocks
   - Similar error handling patterns that should be abstracted

2. **Find dead exports**:
   Use Grep to find exported functions/classes/constants, then check if
   they are imported anywhere else in the codebase. Flag unreferenced exports.

3. **Collect TODO/FIXME/HACK comments**:
   ```
   Grep for: TODO|FIXME|HACK|XXX|TEMP|WORKAROUND
   ```
   Group by file, show line numbers, and categorize by severity.

4. **Check for unused dependencies**:
   Read package.json, find each dependency, check if it's imported anywhere
   in the source code. Flag unused ones.

5. **Generate report**:
   Present findings grouped by category:
   - **Critical**: Dead code, unused dependencies (remove now)
   - **Warning**: Duplicated code (refactor when convenient)
   - **Info**: TODOs and FIXMEs (track and schedule)

6. **Auto-fix** (when user says "fix" or "clean"):
   - Remove confirmed dead exports
   - Extract duplicated code into shared utilities
   - Remove unused dependencies from package.json
   - Delegate fixes to appropriate agent (executor for backend, designer for frontend)

7. **Update CLAUDE.md** with any patterns discovered to prevent future debt.
</Steps>

<Categories>
- Duplicated code (>5 lines identical across files)
- Dead exports (exported but never imported)
- Unused dependencies (in package.json but not imported)
- Stale TODOs (older than 30 days if git blame available)
- Oversized files (>500 lines, suggest splitting)
- Deep nesting (>4 levels, suggest flattening)
</Categories>
