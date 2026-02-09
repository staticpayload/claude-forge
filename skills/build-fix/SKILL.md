---
name: build-fix
description: Fix build and type errors with minimal changes — no refactoring, no architecture changes
---

<Purpose>
Get the build passing with MINIMAL changes. Fix type errors, import errors, syntax
errors. Don't refactor. Don't improve. Don't "while I'm here." Just make it compile.
</Purpose>

<Use_When>
- User says "fix build", "fix types", "build-fix", "type errors"
- Build/compile is failing and needs quick fixes
- TypeScript/type checker errors need resolution
</Use_When>

<Strategy>

## 1. Collect Errors
Run the build command and capture ALL errors:
- `npm run build` / `tsc --noEmit` / `cargo build` / `go build`
- Parse error output for file:line:column + error message
- Group errors by file

## 2. Fix Strategically
For each error, apply the MINIMUM fix:
- Missing import → add the import
- Type mismatch → add type annotation or assertion
- Null/undefined → add null check
- Missing property → add the property
- Unused variable → prefix with `_` or remove
- Syntax error → fix the syntax

## 3. Verify After Each Fix
- Re-run build after each file's fixes
- Stop if new errors were introduced
- Revert if a fix makes things worse

## 4. Stop When Build Passes
- Don't keep going after the build passes
- Don't refactor code that was already working
- Don't add types to code you didn't change

</Strategy>

<Anti_Patterns>
- DO NOT refactor unrelated code
- DO NOT change architecture
- DO NOT add features
- DO NOT "improve" working code
- DO NOT delete tests that were already passing
- ONLY fix what's broken
</Anti_Patterns>

<Output>
```
Build Fix Complete
Errors fixed: N
Files modified: [list]
Build status: PASS
```
</Output>
