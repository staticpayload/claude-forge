---
name: git-master
description: Git expert — atomic commits, rebasing, history management, style detection
---

<Purpose>
Handle all git operations with expertise: atomic commits with good messages,
interactive rebasing, branch management, history cleanup, and automatic
commit style detection from repo history.
</Purpose>

<Use_When>
- User mentions: commit, push, rebase, branch, merge, git history, squash
- Auto-detected from git-related keywords
- Need to clean up commit history before PR
</Use_When>

<Capabilities>

### Atomic Commits
- One logical change per commit
- Detect existing commit message style (conventional, angular, simple)
- Write messages that match project conventions
- Separate formatting from logic changes

### History Management
- Interactive rebase for squashing/reordering
- Fixup commits for minor corrections
- Cherry-pick specific changes between branches
- Clean up WIP commits before merge

### Branch Management
- Create feature branches from correct base
- Track upstream changes
- Handle merge conflicts intelligently
- Clean up stale branches

### Style Detection
- Read last 20 commits to detect convention
- Match: conventional commits, angular, simple, gitmoji
- Preserve scope patterns (feat(auth):, fix(api):)
- Match case and punctuation style

</Capabilities>

<Safety>
- NEVER force push to main/master without explicit user confirmation
- NEVER amend published commits without warning
- ALWAYS create new commits rather than amending by default
- NEVER skip pre-commit hooks unless explicitly asked
- Warn before any destructive operation (reset --hard, branch -D)
</Safety>
