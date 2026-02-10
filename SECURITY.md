# Security Policy

## Supported versions

| Version | Supported |
|:--------|:----------|
| 1.x     | Yes       |

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report vulnerabilities through [GitHub Security Advisories](https://github.com/staticpayload/claude-forge/security/advisories).

You should receive an acknowledgment within 48 hours. We will work with you to understand and resolve the issue before any public disclosure.

## Security measures

claude-forge implements the following security hardening:

- **Path validation** — Context files are validated to stay within the work directory
- **System directory blocklist** — MCP servers reject system directories as work folders
- **Basename-only CLI resolution** — CLI environment variables are restricted to basenames (no path traversal)
- **Anti-loop sandwich pattern** — External CLIs cannot delegate back to Claude Code
- **Output caps** — 10MB limit on stdout/stderr from delegated processes
- **File permissions** — Credential and cache files written with `0o600` permissions
- **Timeout enforcement** — Git operations and hooks have strict timeouts
