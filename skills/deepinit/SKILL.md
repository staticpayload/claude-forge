---
name: deepinit
description: Deep codebase initialization — generate hierarchical AGENTS.md documentation
---

<Purpose>
Generate AI-readable documentation for your codebase. Creates AGENTS.md files at
each directory level, forming a navigable hierarchy that helps AI agents understand
your project structure without reading every file.
</Purpose>

<Use_When>
- User says "deepinit", "init codebase", "generate AGENTS.md"
- Setting up a new project for AI-assisted development
- Onboarding AI agents to an existing codebase
</Use_When>

<Generation_Rules>

## Hierarchy
- Generate AGENTS.md at each meaningful directory level
- Parent directories generated BEFORE children (top-down)
- Same-level directories can be generated in parallel
- Each file references its parent: `<!-- parent: ../AGENTS.md -->`

## Content per AGENTS.md
```markdown
<!-- parent: ../AGENTS.md -->
# [directory-name]

## Purpose
[What this directory contains and why it exists]

## Key Files
- `file.ts` — [one-line description of what it does]
- `other.ts` — [one-line description]

## Patterns
[Coding patterns used in this directory: naming, structure, conventions]

## Dependencies
[What this directory imports from and exports to]

## Notes for AI Agents
[Non-obvious things an AI needs to know to work in this directory]
```

## Skip Rules
- Skip `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`, `__pycache__/`
- Skip empty directories (or generate minimal "empty" marker)
- Skip directories with only generated/vendored code

## Preservation
- If AGENTS.md already exists, preserve any `## Manual Notes` section
- Update auto-generated sections, keep manual additions

</Generation_Rules>

<Execution>
1. Map project structure (explore agent, haiku)
2. Generate root AGENTS.md first
3. For each level, generate same-level files in parallel
4. Validate: every AGENTS.md has parent reference, purpose, key files
5. Report: files generated, directories covered, files skipped
</Execution>

<Quality_Standards>
- Every key file gets a one-line description
- Purpose section is specific (not generic "contains code")
- Patterns section captures actual conventions (not assumed)
- Dependencies are accurate (check actual imports)
</Quality_Standards>
