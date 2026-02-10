# Contributing to claude-forge

Thanks for your interest in contributing. This guide covers everything you need to get started.

## Development setup

```bash
git clone https://github.com/staticpayload/claude-forge.git
cd claude-forge
npm install
```

No build step. Pure ESM JavaScript. Edit and test directly.

## Project structure

```
claude-forge/
├── agents/           Agent system prompts (markdown)
├── hooks/            Lifecycle hook configuration
├── hud/              Status bar renderer + usage API
├── scripts/          Hook implementations + libraries
├── servers/          MCP servers (Codex + Gemini)
├── skills/           Skill definitions (markdown)
└── templates/        CLAUDE.md template
```

## Adding a skill

1. Create `skills/<your-skill>/SKILL.md` with YAML frontmatter:

```yaml
---
name: your-skill
description: One-line description
---
```

2. Add `<Purpose>`, `<Use_When>`, and `<Steps>` sections in the body.

3. Add trigger patterns to `scripts/keyword-router.mjs` in the appropriate priority group.

4. Update `templates/CLAUDE.md` to include the skill in the skills list.

5. Test by running Claude Code with the plugin loaded.

## Adding an agent

1. Create `agents/<agent-name>.md` with the system prompt.

2. Follow existing agent structure — role definition, constraints, output format.

3. Update `templates/CLAUDE.md` agent catalog table.

## Code style

- Pure ESM (`import`/`export`, no `require`)
- Node.js >= 18
- No TypeScript, no build step
- Use `node:` prefix for built-in modules (`node:fs`, `node:path`)
- Error handling: fail gracefully, never block Claude Code execution
- Hooks must complete within their timeout (3-5 seconds)

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new skill for X
fix: correct routing for Y signal
docs: update README with Z
chore: clean up unused imports
security: harden path validation in MCP servers
```

## Pull requests

1. Fork the repo and create a branch from `master`.
2. Make your changes with clear commit messages.
3. Test with Claude Code to verify the plugin loads and skills work.
4. Open a PR with a description of what changed and why.

Keep PRs focused. One feature or fix per PR.

## Reporting bugs

Open an [issue](https://github.com/staticpayload/claude-forge/issues) with:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Claude Code version and OS

## Security

If you discover a security vulnerability, please report it privately via
[GitHub Security Advisories](https://github.com/staticpayload/claude-forge/security/advisories)
rather than opening a public issue.

## License

By contributing, you agree that your contributions will be licensed under the
[GPL-3.0](LICENSE) license.
