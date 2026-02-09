---
name: worktree
description: Git worktree manager for parallel Claude sessions (Boris Tip #1)
---

<Purpose>
Manage git worktrees for running parallel Claude Code sessions — the single
biggest productivity unlock according to the Claude Code team. Spin up 3-5
worktrees, each running its own Claude session for parallel development.
</Purpose>

<Use_When>
- User says "worktree", "parallel sessions", "spin up worktrees"
- User wants to work on multiple tasks simultaneously
- User wants to set up parallel development environments
</Use_When>

<Steps>
1. **List existing worktrees**:
   Run `git worktree list` to show current worktrees.

2. **Create worktree** (when user says "add", "create", "new"):
   ```bash
   git worktree add .claude/worktrees/<name> origin/main
   ```
   - Use descriptive names: `feature-auth`, `fix-api`, `refactor-db`
   - Default base: `origin/main` (or user-specified branch)

3. **Setup shell aliases** (when user says "aliases", "setup"):
   Suggest adding to `~/.zshrc` or `~/.bashrc`:
   ```bash
   # Forge worktree aliases
   alias wa='cd $(git worktree list --porcelain | grep "worktree " | sed -n "2p" | cut -d" " -f2) && claude'
   alias wb='cd $(git worktree list --porcelain | grep "worktree " | sed -n "3p" | cut -d" " -f2) && claude'
   alias wc='cd $(git worktree list --porcelain | grep "worktree " | sed -n "4p" | cut -d" " -f2) && claude'
   alias wl='git worktree list'
   ```

4. **Remove worktree** (when user says "remove", "delete", "prune"):
   ```bash
   git worktree remove .claude/worktrees/<name>
   ```

5. **Quick parallel setup** (when user says "parallel setup" or "quick"):
   Create 3 worktrees named `a`, `b`, `c`:
   ```bash
   git worktree add .claude/worktrees/a origin/main
   git worktree add .claude/worktrees/b origin/main
   git worktree add .claude/worktrees/c origin/main
   ```
   Then print instructions for opening each in a new terminal.

6. **Analysis worktree** (when user says "analysis"):
   Create a read-only analysis worktree for logs/queries:
   ```bash
   git worktree add .claude/worktrees/analysis origin/main
   ```
</Steps>

<Pro_Tips>
- Name worktrees by task, not by letter
- Create a dedicated "analysis" worktree for log reading and queries
- Use tmux or separate terminal tabs for each worktree
- Each worktree gets its own Claude session with isolated context
- Worktrees share the same git history but have separate working directories
</Pro_Tips>
